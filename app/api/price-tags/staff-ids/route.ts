import {env} from 'cloudflare:workers';
import {comboManager} from '../combos/shared';
import {parseStaffId,staffIdRecord,STAFF_TOKEN} from '../../../lib/staff-id-verification';
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
export async function GET(req:Request){
 const auth=await comboManager(req);if(auth.response)return auth.response;
 const query=new URL(req.url).searchParams,brand=query.get('brand');if(brand!=='busterbuild'&&brand!=='powerbuild')return Response.json({error:'Choose a brand.'},{status:400,headers});
 const token=query.get('token');if(token){if(!STAFF_TOKEN.test(token))return Response.json({error:'Invalid staff card.'},{status:400,headers});const row=await env.DB.prepare('SELECT * FROM staff_id_verifications WHERE token=? AND brand=?').bind(token,brand).first<Record<string,unknown>>();return row?Response.json({staff:staffIdRecord(row)},{headers}):Response.json({error:'Staff card not found.'},{status:404,headers});}
 const result=await env.DB.prepare('SELECT token,employee_id,name,active,version FROM staff_id_verifications WHERE brand=? AND (employee_id LIKE ? OR name LIKE ?) ORDER BY updated_at DESC LIMIT 200').bind(brand,`%${(query.get('q')||'').slice(0,100)}%`,`%${(query.get('q')||'').slice(0,100)}%`).all();return Response.json({staff:result.results},{headers});
}
export async function POST(req:Request){
 const auth=await comboManager(req);if(auth.response)return auth.response;
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Save staff verification from the Hub.'},{status:403,headers});
 if(Number(req.headers.get('content-length'))>3*1024*1024)return Response.json({error:'Use a smaller staff photo.'},{status:413,headers});
 let form:FormData,body:Record<string,unknown>,data:ReturnType<typeof parseStaffId>;
 try{form=await req.formData();body=JSON.parse(String(form.get('details')));data=parseStaffId(body);}catch(error){return Response.json({error:error instanceof Error?error.message:'Check staff details.'},{status:400,headers});}
 const requested=String(body.token||'');if(requested&&!STAFF_TOKEN.test(requested))return Response.json({error:'Invalid staff card.'},{status:400,headers});
 const old=requested?await env.DB.prepare('SELECT * FROM staff_id_verifications WHERE token=? AND brand=?').bind(requested,data.brand).first<Record<string,unknown>>():null;
 if(requested&&!old)return Response.json({error:'Staff card not found.'},{status:404,headers});
 if(old&&Number(body.version)!==Number(old.version))return Response.json({error:'This record changed. Reload the saved staff card before editing.'},{status:409,headers});
 const photo=form.get('photo');let bytes:Uint8Array|null=null;
 if(photo instanceof File&&photo.size){if(photo.size>2*1024*1024)return Response.json({error:'Use a JPEG photo smaller than 2 MB.'},{status:413,headers});bytes=new Uint8Array(await photo.arrayBuffer());if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return Response.json({error:'Use a valid JPEG staff photo.'},{status:400,headers});}
 if(!old&&!bytes)return Response.json({error:'Add a staff photo.'},{status:400,headers});
 const token=requested||crypto.randomUUID(),newKey=bytes?`staff-id-photos/${crypto.randomUUID()}.jpg`:'',photoKey=newKey||String(old?.photo_key||'');const now=new Date().toISOString();
 if(bytes)await env.BUCKET.put(newKey,bytes,{httpMetadata:{contentType:'image/jpeg'}});
 let committed=false;
 try{
  if(old){const result=await env.DB.prepare(`UPDATE staff_id_verifications SET employee_id=?,name=?,role=?,department=?,branch=?,start_date=?,expiry=?,active=?,photo_key=?,photo_zoom=?,photo_position=?,version=version+1,updated_by=?,updated_at=? WHERE token=? AND brand=? AND version=?`).bind(data.employeeId,data.name,data.role,data.department,data.branch,data.startDate,data.expiry,data.active?1:0,photoKey,data.photoZoom,data.photoPosition,auth.member!.email,now,token,data.brand,Number(old.version)).run();if(!result.meta.changes)return Response.json({error:'This record changed. Reload the saved staff card.'},{status:409,headers});}
  else await env.DB.prepare(`INSERT INTO staff_id_verifications (token,brand,employee_id,name,role,department,branch,start_date,expiry,active,photo_key,photo_zoom,photo_position,version,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).bind(token,data.brand,data.employeeId,data.name,data.role,data.department,data.branch,data.startDate,data.expiry,data.active?1:0,photoKey,data.photoZoom,data.photoPosition,auth.member!.email,now).run();
  committed=true;
 }catch(error){if(error instanceof Error&&/unique/i.test(error.message))return Response.json({error:'That employee number already exists for this brand. Load the saved staff card to edit it.'},{status:409,headers});throw error;}
 finally{if(!committed&&newKey)try{await env.BUCKET.delete(newKey);}catch{}}
 if(newKey&&old?.photo_key)try{await env.BUCKET.delete(String(old.photo_key));}catch{}
 const saved=await env.DB.prepare('SELECT * FROM staff_id_verifications WHERE token=?').bind(token).first<Record<string,unknown>>();return Response.json({staff:staffIdRecord(saved!)},{headers});
}
