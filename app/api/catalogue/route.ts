import { env } from "cloudflare:workers";
import { getHubMember } from "../access";
import { canManageCatalogue, initCatalogueTable, productResponse } from "./shared";

export async function GET(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member)
    return Response.json({ error: "Hub access required." }, { status: 403 });

  const url = new URL(req.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const requestedSize = Number.parseInt(url.searchParams.get("pageSize") || "12", 10) || 12;
  const pageSize = Math.min(48, Math.max(6, requestedSize));
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const category = (url.searchParams.get("category") || "").trim();
  const offset = (page - 1) * pageSize;
  // Legacy blind stock is saved under Homeware (or other imported categories).
  // Keep the stored category unchanged while making the catalogue filters accurate.
  const blindsFilter = category === "Window Blinds & Treatments";
  const categorySql = blindsFilter
    ? "(lower(category)=lower('Window Blinds & Treatments') OR (lower(name) LIKE '%blind%' AND lower(name) NOT LIKE '%blind flange%' AND lower(name) NOT LIKE '%blind cap%' AND lower(name) NOT LIKE '%blind rivet%' AND lower(name) NOT LIKE '%blind plug%' AND lower(name) NOT LIKE '%blind nut%'))"
    : "(lower(category)=lower(?) AND NOT (lower(name) LIKE '%blind%' AND lower(name) NOT LIKE '%blind flange%' AND lower(name) NOT LIKE '%blind cap%' AND lower(name) NOT LIKE '%blind rivet%' AND lower(name) NOT LIKE '%blind plug%' AND lower(name) NOT LIKE '%blind nut%'))";
  const filterBind = blindsFilter ? [] : [category];
  const like = `%${q}%`;

  const count = q && category
    ? await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM catalogue_products
         WHERE active=1 AND ${categorySql} AND (
           lower(name) LIKE ? OR lower(code) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?
         )`,
      )
        .bind(...filterBind, like, like, like, like)
        .first<{ total: number }>()
    : category
      ? await env.DB.prepare(
          `SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1 AND ${categorySql}`,
        ).bind(...filterBind).first<{ total: number }>()
      : q
    ? await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM catalogue_products
         WHERE active=1 AND (
           lower(name) LIKE ? OR lower(code) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?
         )`,
      )
        .bind(like, like, like, like)
        .first<{ total: number }>()
    : await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM catalogue_products WHERE active=1",
      ).first<{ total: number }>();

  const query = q && category
    ? env.DB.prepare(
        `SELECT * FROM catalogue_products
         WHERE active=1 AND ${categorySql} AND (
           lower(name) LIKE ? OR lower(code) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?
         )
         ORDER BY id DESC LIMIT ? OFFSET ?`,
      ).bind(...filterBind, like, like, like, like, pageSize, offset)
    : category
      ? env.DB.prepare(
          `SELECT * FROM catalogue_products WHERE active=1 AND ${categorySql} ORDER BY id DESC LIMIT ? OFFSET ?`,
        ).bind(...filterBind, pageSize, offset)
      : q
        ? env.DB.prepare(
            `SELECT * FROM catalogue_products
             WHERE active=1 AND (
               lower(name) LIKE ? OR lower(code) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?
             )
             ORDER BY id DESC LIMIT ? OFFSET ?`,
          ).bind(like, like, like, like, pageSize, offset)
        : env.DB.prepare(
            "SELECT * FROM catalogue_products WHERE active=1 ORDER BY id DESC LIMIT ? OFFSET ?",
          ).bind(pageSize, offset);

  const { results } = await query.all<Record<string, unknown>>();
  const total = Number(count?.total || 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return Response.json({
    products: results.map(productResponse),
    page: Math.min(page, pages),
    page_size: pageSize,
    total,
    pages,
    can_manage: canManageCatalogue(member.email),
  });
}

export async function POST(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json(
      { error: "Only the authorised catalogue administrators can add products." },
      { status: 403 },
    );

  const form = await req.formData();
  const code = String(form.get("code") || "").trim();
  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const requestedCategory = String(form.get("category") || "General").trim() || "General";
  const category = /\bblinds?\b/i.test(name) && !/\bblind\s+(?:flanges?|caps?|rivets?|plugs?|nuts?)\b/i.test(name)
    ? "Window Blinds & Treatments" : requestedCategory;
  const image = form.get("image");

  if (!code || !name)
    return Response.json(
      { error: "Product code and product name are required." },
      { status: 400 },
    );

  let imageKey = "";
  let imageName = "";
  let imageType = "";
  let imageSize = 0;
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/"))
      return Response.json({ error: "Catalogue pictures must be image files." }, { status: 400 });
    if (image.size > 8 * 1024 * 1024)
      return Response.json({ error: "Catalogue product pictures are limited to 8MB." }, { status: 400 });
    imageKey = `catalogue/${crypto.randomUUID()}-${image.name}`;
    imageName = image.name;
    imageType = image.type || "application/octet-stream";
    imageSize = image.size;
    await env.BUCKET.put(imageKey, await image.arrayBuffer(), {
      httpMetadata: { contentType: imageType },
    });
  }

  const now = new Date().toISOString();
  try {
    const row = await env.DB.prepare(
      `INSERT INTO catalogue_products
       (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at)
       VALUES (?,?,?,?,?,?,?,?,1,?,?,?,?) RETURNING *`,
    )
      .bind(
        code,
        name,
        description,
        category,
        imageName,
        imageType,
        imageSize,
        imageKey,
        member.email,
        now,
        member.email,
        now,
      )
      .first<Record<string, unknown>>();
    return Response.json({ product: row ? productResponse(row) : null }, { status: 201 });
  } catch (error) {
    if (imageKey) await env.BUCKET.delete(imageKey).catch(() => undefined);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("constraint"))
      return Response.json({ error: `Product code ${code} already exists.` }, { status: 409 });
    return Response.json({ error: "The catalogue product could not be added." }, { status: 500 });
  }
}
