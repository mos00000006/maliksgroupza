import { env } from "cloudflare:workers";
import { TAG_TOKEN,tagBrand } from "../../../lib/price-tags";
import { parseComboInput } from "../../../lib/combo-tags";
import { comboManager,comboRecord } from "./shared";
const headers={'cache-control':'no-store'};
export async function GET(req:Request) {
 const auth=await comboManager(req);if(auth.response)return auth.response;
 const params=new URL(req.url).searchParams;let brand;try{brand=tagBrand(params.get('brand'));}catch{return Response.json({error:'Choose a brand.'},{status:400,headers});}
 const token=params.get('token');
 if(token){if(!TAG_TOKEN.test(token))return Response.json({error:'Invalid combo.'},{status:400,headers});const row=await env.DB.prepare('SELECT * FROM price_tag_combos WHERE token=? AND brand=?').bind(token,brand).first<Record<string,unknown>>();return row?Response.json({combo:comboRecord(row)},{headers}):Response.json({error:'Combo not found.'},{status:404,headers});}
 const result=await env.DB.prepare('SELECT token,code,name,price_cents,published,updated_at FROM price_tag_combos WHERE brand=? ORDER BY updated_at DESC LIMIT 100').bind(brand).all();return Response.json({combos:result.results},{headers});
}
export async function POST(req:Request) {
 const auth=await comboManager(req);if(auth.response)return auth.response;
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Save this combo from the Hub.'},{status:403,headers});
 let data,requestedToken;try{const body=await req.json();data=parseComboInput(body);requestedToken=body.token;}catch(error){return Response.json({error:error instanceof Error?error.message:'Check the combo fields.'},{status:400,headers});}
 if(requestedToken&&(!TAG_TOKEN.test(String(requestedToken))||!await env.DB.prepare('SELECT token FROM price_tag_combos WHERE token=? AND brand=?').bind(requestedToken,data.brand).first()))return Response.json({error:'The combo could not be found.'},{status:404,headers});
 const token=requestedToken||crypto.randomUUID();
 try{await env.DB.prepare(`INSERT INTO price_tag_combos (token,brand,code,name,price_cents,includes_title,includes_text,items_json,published,updated_by,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(token) DO UPDATE SET code=excluded.code,name=excluded.name,price_cents=excluded.price_cents,includes_title=excluded.includes_title,includes_text=excluded.includes_text,items_json=excluded.items_json,published=excluded.published,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(token,data.brand,data.code,data.name,data.price_cents,data.includes_title,data.includes_text,JSON.stringify(data.items),data.published?1:0,auth.member!.email,new Date().toISOString()).run();}
 catch(error){if(error instanceof Error&&/unique/i.test(error.message))return Response.json({error:'That combo code is already used. Open the existing combo or choose another code.'},{status:409,headers});throw error;}
 const row=await env.DB.prepare('SELECT * FROM price_tag_combos WHERE token=?').bind(token).first<Record<string,unknown>>();return Response.json({combo:comboRecord(row!)},{headers});
}
