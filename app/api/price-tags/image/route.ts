import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManagePriceTags } from "../shared";
import { tagImageResponse } from "../image-source";
export async function GET(req: Request) {
  if (!canManagePriceTags(await getHubMember())) return new Response("Forbidden",{status:403});
  const id=Number(new URL(req.url).searchParams.get("product_id")); if(!Number.isSafeInteger(id)||id<=0)return new Response("Not found",{status:404});
  const original=new URL(req.url).searchParams.get("original")==="1";
  const row=await env.DB.prepare(original ? "SELECT image_key,image_type FROM catalogue_products WHERE id=? AND active=1" : "SELECT CASE WHEN coalesce(t.picture_key,'')!='' THEN t.picture_key ELSE p.image_key END AS image_key,CASE WHEN coalesce(t.picture_key,'')!='' THEN 'image/png' ELSE p.image_type END AS image_type FROM catalogue_products p LEFT JOIN powerbuild_price_tags t ON t.product_id=p.id WHERE p.id=? AND p.active=1").bind(id).first<{image_key:string;image_type:string}>();
  return tagImageResponse(req,row);
}
