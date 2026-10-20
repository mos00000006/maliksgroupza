import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManagePriceTags } from "../shared";
export async function POST(req:Request) {
  const member=await getHubMember(); if(!canManagePriceTags(member))return Response.json({error:"Picture editing requires a price tag manager."},{status:403});
  let form:FormData;try{form=await req.formData();}catch{return Response.json({error:"Upload a PNG picture using the picture field."},{status:400});} const id=Number(form.get("product_id"));const file=form.get("picture");
  if(!Number.isSafeInteger(id)||id<=0||!(file instanceof File)||file.size>6*1024*1024||file.size<20)return Response.json({error:"Choose a PNG picture smaller than 6 MB."},{status:400});
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return Response.json({error:"The picture must be a PNG file."},{status:400});
  const tag=await env.DB.prepare("SELECT t.product_id FROM powerbuild_price_tags t JOIN catalogue_products p ON p.id=t.product_id WHERE t.product_id=? AND p.active=1").bind(id).first();
  if(!tag)return Response.json({error:"Save the product tag before its picture."},{status:404});
  const key=`price-tags/${id}/${crypto.randomUUID()}.png`;
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:"image/png"}});
  try {await env.DB.prepare("UPDATE powerbuild_price_tags SET picture_key=?,updated_by=?,updated_at=? WHERE product_id=?").bind(key,member!.email,new Date().toISOString(),id).run();}
  catch(error){await env.BUCKET.delete(key);throw error;}
  return Response.json({saved:true},{headers:{"cache-control":"no-store"}});
}
