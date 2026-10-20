import { env } from "cloudflare:workers";
import { TAG_TOKEN } from "../../../lib/price-tags";
import { PUBLIC_TAG_COLUMNS, publicTag } from "../../price-tags/shared";
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TAG_TOKEN.test(token)) return Response.json({ error: "Product unavailable." }, { status: 404 });
  const row = await env.DB.prepare(`SELECT ${PUBLIC_TAG_COLUMNS} FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<Record<string, unknown>>();
  if (!row) return Response.json({ error: "This product tag is no longer available." }, { status: 404, headers: { "cache-control": "no-store" } });
  return Response.json({ product: publicTag(row) }, { headers: { "cache-control": "no-store" } });
}
