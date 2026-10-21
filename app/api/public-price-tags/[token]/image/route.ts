import { env } from "cloudflare:workers";
import { TAG_TOKEN } from "../../../../lib/price-tags";
import { tagImageResponse } from "../../../price-tags/image-source";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TAG_TOKEN.test(token)) return new Response("Not found", { status: 404 });
  let row = await env.DB.prepare(`SELECT CASE WHEN t.picture_key!='' THEN t.picture_key ELSE p.image_key END AS image_key,CASE WHEN t.picture_key!='' THEN 'image/png' ELSE p.image_type END AS image_type FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<{ image_key: string; image_type: string }>();
  if (!row) row = await env.DB.prepare(`SELECT CASE WHEN t.picture_key!='' THEN t.picture_key ELSE p.image_key END AS image_key,CASE WHEN t.picture_key!='' THEN 'image/png' ELSE p.image_type END AS image_type FROM busterbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<{ image_key: string; image_type: string }>();
  return tagImageResponse(req,row);
}
