import {env} from 'cloudflare:workers';
import {STAFF_TOKEN,verificationStatus} from '../../../../../lib/staff-id-verification';
const headers={'cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow, noarchive'};
export async function GET(_req:Request,{params}:{params:Promise<{token:string}>}){
 const{token}=await params;if(!STAFF_TOKEN.test(token))return new Response('Not found',{status:404,headers});
 try{const row=await env.DB.prepare('SELECT * FROM staff_id_verifications WHERE token=?').bind(token).first<Record<string,unknown>>();if(!row||verificationStatus(row)!=='active')return new Response('Not found',{status:404,headers});const photo=await env.BUCKET.get(String(row.photo_key));return photo?new Response(photo.body,{headers:{...headers,'content-type':'image/jpeg'}}):new Response('Not found',{status:404,headers});}catch{return new Response('Photo unavailable',{status:503,headers});}
}
