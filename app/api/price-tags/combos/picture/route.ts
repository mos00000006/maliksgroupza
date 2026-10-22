import { env } from "cloudflare:workers";
import { COMBO_IMAGE_KEY } from "../../../../lib/combo-tags";
import { comboManager } from "../shared";
import { tagImageResponse } from "../../image-source";
export async function GET(req:Request) {
 const auth=await comboManager(req);if(auth.response)return auth.response;
 const key=new URL(req.url).searchParams.get('key')||'';if(!COMBO_IMAGE_KEY.test(key))return new Response('Not found',{status:404});
 return tagImageResponse(req,{image_key:key,image_type:'image/png'});
}
export async function POST(req:Request) {
 const auth=await comboManager(req);if(auth.response)return auth.response;
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Upload this picture from the Hub.'},{status:403});
 let form:FormData;try{form=await req.formData();}catch{return Response.json({error:'Choose a product picture.'},{status:400});}
 const picture=form.get('picture');if(!(picture instanceof File)||picture.size<20||picture.size>6*1024*1024)return Response.json({error:'Use a PNG smaller than 6 MB.'},{status:400});
 const bytes=new Uint8Array(await picture.arrayBuffer());if(![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return Response.json({error:'Use a valid PNG product picture.'},{status:400});
 const key=`combo-pictures/${crypto.randomUUID()}.png`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:'image/png'}});
 return Response.json({image_key:key,image_url:`/api/price-tags/combos/picture?key=${encodeURIComponent(key)}`},{headers:{'cache-control':'no-store'}});
}
