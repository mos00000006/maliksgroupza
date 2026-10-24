import {env} from 'cloudflare:workers';
import {comboManager} from '../../combos/shared';
import {STAFF_TOKEN} from '../../../../lib/staff-id-verification';
export async function GET(req:Request){
 const auth=await comboManager(req);if(auth.response)return auth.response;const token=new URL(req.url).searchParams.get('token')||'';
 if(!STAFF_TOKEN.test(token))return new Response('Not found',{status:404});const row=await env.DB.prepare('SELECT photo_key FROM staff_id_verifications WHERE token=?').bind(token).first<{photo_key:string}>();if(!row)return new Response('Not found',{status:404});const image=await env.BUCKET.get(row.photo_key);return image?new Response(image.body,{headers:{'content-type':'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff'}}):new Response('Not found',{status:404});
}
