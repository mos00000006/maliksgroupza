import {env} from 'cloudflare:workers';
// Called only after the normal price-tag manager and designer-session checks.
export async function createColourProduct(req:Request,email:string):Promise<Response|null>{
 const body=await req.clone().json().catch(()=>null);
 if(body?.action!=='create_colour_product')return null;
 const code=typeof body.code==='string'?body.code.trim():'';
 const colour=typeof body.colour==='string'?body.colour.trim():'';
 if(!code||code.length>150||/[\x00-\x1f\x7f\u2028\u2029]/.test(code)||!colour||colour.length>80||/[\x00-\x1f\x7f\u2028\u2029]/.test(colour)||!Number.isSafeInteger(body.source_id)||body.source_id<1)return Response.json({error:'Enter the new code and paint colour first.'},{status:400});
 const existing=()=>env.DB.prepare('SELECT id,code,active FROM catalogue_products WHERE upper(trim(code))=upper(?) LIMIT 1').bind(code).first<Record<string,unknown>>();
 const answer=(p:Record<string,unknown>,created=false)=>Response.json(p.active?{code:p.code,created}:{error:'That code belongs to an inactive catalogue product. Ask a catalogue manager to reactivate it.'},{status:p.active?(created?201:200):409,headers:{'cache-control':'no-store'}});
 const found=await existing();if(found)return answer(found);
 const source=await env.DB.prepare('SELECT * FROM catalogue_products WHERE id=? AND active=1').bind(body.source_id).first<Record<string,unknown>>();
 if(!source)return Response.json({error:'The original product is no longer active.'},{status:404});
 const name=String(source.name)+' — '+colour;
 let key='';
 try{
  if(source.image_key){const image=await env.BUCKET.get(String(source.image_key));if(!image)return Response.json({error:'The original picture could not load. Please try again.'},{status:409});key=`catalogue/${crypto.randomUUID()}-colour`;await env.BUCKET.put(key,await image.arrayBuffer(),{httpMetadata:{contentType:String(source.image_type||'image/png')}});}
  const now=new Date().toISOString();
  // Single SQL statement prevents case-insensitive duplicates, including concurrent requests.
  const inserted=await env.DB.prepare(`INSERT INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at)
   SELECT ?,?,?,?,?,?,?,?,1,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM catalogue_products WHERE upper(trim(code))=upper(?)) RETURNING id,code,active`).bind(code,name,String(source.description||''),String(source.category||'General'),String(source.image_name||''),String(source.image_type||''),Number(source.image_size||0),key,email,now,email,now,code).first<Record<string,unknown>>();
  if(inserted)return answer(inserted,true);
  if(key)await env.BUCKET.delete(key);key='';
  const concurrent=await existing();if(concurrent)return answer(concurrent);
  throw Error('Could not create product');
 }catch{
  if(key)await env.BUCKET.delete(key).catch(()=>undefined);
  const concurrent=await existing();if(concurrent)return answer(concurrent);
  return Response.json({error:'The colour product could not be saved. Please try again.'},{status:500});
 }
}
