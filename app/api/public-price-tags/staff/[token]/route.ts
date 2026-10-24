import {env} from 'cloudflare:workers';
import {STAFF_TOKEN,publicStaffId} from '../../../../lib/staff-id-verification';
export const staffHeaders={'cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'};
export async function GET(_req:Request,{params}:{params:Promise<{token:string}>}){
 const{token}=await params;if(!STAFF_TOKEN.test(token))return Response.json({error:'Staff verification not found.'},{status:404,headers:staffHeaders});
 try{const row=await env.DB.prepare('SELECT * FROM staff_id_verifications WHERE token=?').bind(token).first<Record<string,unknown>>();if(!row)return Response.json({error:'Staff verification not found.'},{status:404,headers:staffHeaders});return Response.json({verification:publicStaffId(row)},{headers:staffHeaders});}catch{return Response.json({error:'Employment could not be confirmed right now. Please try again or contact the store.'},{status:503,headers:staffHeaders});}
}
