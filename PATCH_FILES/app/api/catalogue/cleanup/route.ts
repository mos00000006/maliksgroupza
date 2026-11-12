import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManageCatalogue, initCatalogueTable, productResponse } from "../shared";

const duplicateNameSql = `lower(trim(name)) IN (
  SELECT lower(trim(name))
  FROM catalogue_products
  WHERE active=1 AND trim(COALESCE(name,''))<>''
  GROUP BY lower(trim(name))
  HAVING COUNT(*)>1
)`;

const issueSql: Record<string, string> = {
  "missing-image": "trim(COALESCE(image_key,''))=''",
  "missing-description": "trim(COALESCE(description,''))=''",
  "duplicate-name": duplicateNameSql,
  "external-image": "image_key LIKE 'external:%'",
};

export async function GET(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Catalogue cleanup is restricted to catalogue administrators." }, { status: 403 });

  const url = new URL(req.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(url.searchParams.get("pageSize") || "50", 10) || 50));
  const countsQuery = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND trim(COALESCE(image_key,''))=''").first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND trim(COALESCE(description,''))=''").first<{ total: number }>(),
    env.DB.prepare(`SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND ${duplicateNameSql}`).first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND image_key LIKE 'external:%'").first<{ total: number }>(),
  ]);
  const counts = {
    missing_images: Number(countsQuery[0]?.total || 0),
    missing_descriptions: Number(countsQuery[1]?.total || 0),
    duplicate_name_entries: Number(countsQuery[2]?.total || 0),
    external_images_to_review: Number(countsQuery[3]?.total || 0),
  };

  const issue = url.searchParams.get("issue") || "";
  if (!issue) return Response.json({ counts });
  const where = issueSql[issue];
  if (!where) return Response.json({ error: "Choose a valid catalogue cleanup queue." }, { status: 400 });

  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND ${where}`,
  ).first<{ total: number }>();
  const total = Number(count?.total || 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pages);
  const { results } = await env.DB.prepare(
    `SELECT * FROM catalogue_products WHERE active=1 AND ${where}
     ORDER BY lower(name), code LIMIT ? OFFSET ?`,
  )
    .bind(pageSize, (currentPage - 1) * pageSize)
    .all<Record<string, unknown>>();

  return Response.json({
    counts,
    issue,
    products: results.map(productResponse),
    page: currentPage,
    page_size: pageSize,
    total,
    pages,
  });
}
