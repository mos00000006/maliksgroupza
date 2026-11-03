import { publicCombo } from "../../price-tags/combos/shared";
import { env } from "cloudflare:workers";
import { ALL_BRANCHES, TAG_TOKEN } from "../../../lib/price-tags";
import { PUBLIC_TAG_COLUMNS, publicTag } from "../../price-tags/shared";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TAG_TOKEN.test(token)) return Response.json({ error: "Product unavailable." }, { status: 404 });
  let row = await env.DB.prepare(`SELECT ${PUBLIC_TAG_COLUMNS} FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<Record<string, unknown>>();
  const brand = row ? "powerbuild" : "busterbuild";
  if (!row) row = await env.DB.prepare(`SELECT ${PUBLIC_TAG_COLUMNS} FROM busterbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<Record<string, unknown>>();
  if (!row) {
    const combo = await publicCombo(token);
    if (combo) return Response.json({product:combo},{headers:{"cache-control":"no-store"}});
  }
  if (!row) return Response.json({ error: "This product tag is no longer available." }, { status: 404, headers: { "cache-control": "no-store" } });
  let branchName = ALL_BRANCHES;
  const requestedBranch = new URL(req.url).searchParams.get("branch")?.trim() || "";
  if (requestedBranch && requestedBranch.length <= 120) {
    const override = await env.DB.prepare(`SELECT branch_name,price_cents FROM price_tag_branch_prices WHERE brand=? AND product_id=? AND lower(branch_name)=lower(?) LIMIT 1`)
      .bind(brand, row.product_id, requestedBranch).first<{ branch_name: string; price_cents: number }>();
    if (override) { row.price_cents = override.price_cents; branchName = override.branch_name; }
  }
  return Response.json({ product: {...publicTag(row), brand, branch_name: branchName} }, { headers: { "cache-control": "no-store" } });
}
