import { COMBO_SLOT, COMBO_IMAGE_KEY, type ComboItem } from "../../../../lib/combo-tags";
import { env } from "cloudflare:workers";
import { TAG_TOKEN } from "../../../../lib/price-tags";
import { tagImageResponse } from "../../../price-tags/image-source";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TAG_TOKEN.test(token)) return new Response("Not found", { status: 404 });
  const slot=new URL(req.url).searchParams.get("slot");
  if (slot && !COMBO_SLOT.test(slot)) return new Response("Not found",{status:404});
  if (slot) {
    const combo=await env.DB.prepare("SELECT items_json FROM price_tag_combos WHERE token=? AND published=1").bind(token).first<{items_json:string}>();
    const item=combo?(JSON.parse(combo.items_json) as ComboItem[]).find(item=>item.id===slot):null;
    return tagImageResponse(req,item && COMBO_IMAGE_KEY.test(item.image_key)?{image_key:item.image_key,image_type:"image/png"}:null);
  }
  let row = await env.DB.prepare(`SELECT CASE WHEN t.picture_key!='' THEN t.picture_key ELSE p.image_key END AS image_key,CASE WHEN t.picture_key!='' THEN 'image/png' ELSE p.image_type END AS image_type FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<{ image_key: string; image_type: string }>();
  if (!row) row = await env.DB.prepare(`SELECT CASE WHEN t.picture_key!='' THEN t.picture_key ELSE p.image_key END AS image_key,CASE WHEN t.picture_key!='' THEN 'image/png' ELSE p.image_type END AS image_type FROM busterbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.token=? AND t.published=1 AND p.active=1`).bind(token).first<{ image_key: string; image_type: string }>();
  return tagImageResponse(req,row);
}
