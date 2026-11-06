import { env } from 'cloudflare:workers';
import { tillMember,tillBranches,permittedBranch,tillBrand,tillsNoStore } from '../shared';
import { calculateQuote,canReviewCashOffice,canonicalQuotePayload,quoteId,quoteNumber,validateQuoteLines } from './quote-domain.mjs';

// Hub-only quotation requests. This is NOT a RetailOS invoice, reservation or payment queue.
const cache={'cache-control':'no-store'};
type QuoteRow={id:number;request_id:string;payload_hash:string;branch:string;submitted_by_email:string;submitted_by_name:string;customer_name:string;customer_contact:string;notes:string;lines_json:string;net_cents:number;vat_cents:number;total_cents:number;status:string;created_at:string;received_by_email:string|null;received_at:string|null};
const dbTable=`CREATE TABLE IF NOT EXISTS till_quotation_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  branch TEXT NOT NULL,
  submitted_by_email TEXT NOT NULL,
  submitted_by_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  lines_json TEXT NOT NULL,
  net_cents INTEGER NOT NULL CHECK (net_cents>=0),
  vat_cents INTEGER NOT NULL CHECK (vat_cents>=0),
  total_cents INTEGER NOT NULL CHECK (total_cents>0),
  status TEXT NOT NULL DEFAULT 'AWAITING_CASH_OFFICE' CHECK(status IN ('AWAITING_CASH_OFFICE','REVIEWED')),
  created_at TEXT NOT NULL,
  received_by_email TEXT,
  received_at TEXT
)`;
async function ensureTable(){await env.DB.prepare(dbTable).run();}
function fail(message:string,status=400){return Response.json({error:message},{status,headers:cache});}
function serial(row:QuoteRow){
  return {number:quoteNumber(row.id),id:row.id,branch:row.branch,customer_name:row.customer_name,
    customer_contact:row.customer_contact,notes:row.notes,submitted_by_name:row.submitted_by_name,
    created_at:row.created_at,status:row.status,net_cents:row.net_cents,vat_cents:row.vat_cents,total_cents:row.total_cents,
    lines:JSON.parse(row.lines_json),received_at:row.received_at};
}
function trustedOrigin(req:Request){const origin=req.headers.get('origin');return origin!==null&&origin===new URL(req.url).origin;}
async function access(req:Request){
  const member=await tillMember();if(!member)return {error:fail('Sales / Tills access required.',403)};
  const allowed=await tillBranches(member);if(!allowed.length)return {error:tillsNoStore()};
  return {member,allowed};
}
export async function POST(req:Request){
  if(!trustedOrigin(req))return fail('Untrusted request origin.',403);
  const permission=await access(req);if('error' in permission)return permission.error!;
  const {member,allowed}=permission;
  const size=Number(req.headers.get('content-length')||0);if(size>22000)return fail('Quotation payload too large.',413);
  let body:Record<string,unknown>;
  try {const text=await req.text();if(text.length>22000)return fail('Quotation payload too large.',413);body=JSON.parse(text) as Record<string,unknown>;if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return fail('Invalid quotation request.');}
  const requestId=String(body.request_id||'');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))return fail('Invalid quotation request identifier.');
  const branch=permittedBranch(allowed,typeof body.branch==='string'?body.branch:null);
  if(!branch)return fail('This branch is not assigned to your Hub account.',403);
  const customerName=String(body.customer_name||'Walk-in customer').trim();
  const customerContact=String(body.customer_contact||'').trim();
  const notes=String(body.notes||'').trim();
  if(customerName.length<1||customerName.length>120||customerContact.length>80||notes.length>400)return fail('Customer or notes fields exceed allowed length.');
  let lines;
  try{lines=validateQuoteLines(body.lines);}catch(e){return fail(e instanceof Error?e.message:'Invalid product list.');}
  const requestPayload=canonicalQuotePayload(branch,customerName,customerContact,notes,lines);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(requestPayload));
  const payloadHash=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
  try{
    await ensureTable();
    // Check replay BEFORE checking current prices. The same request returns the original quotation.
    const previous=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(requestId).first<QuoteRow>();
    if(previous){if(previous.payload_hash!==payloadHash||previous.submitted_by_email.toLowerCase()!==member.email.toLowerCase())return fail('Quotation request identifier was already used.',409);
      return Response.json({quotation:serial(previous),duplicate:true},{headers:cache});}
    const brand=tillBrand(branch),tagTable=brand==='busterbuild'?'busterbuild_price_tags':'powerbuild_price_tags';
    const ids=lines.map(x=>x.product_id), placeholders=ids.map(()=>'?').join(',');
    const {results}=await env.DB.prepare(`SELECT p.id,p.code,p.name,p.category,COALESCE(t.unit,'each') AS unit,
      CASE WHEN t.product_id IS NOT NULL THEN COALESCE(bp.price_cents,t.price_cents,0) ELSE 0 END AS price_cents
      FROM catalogue_products p LEFT JOIN ${tagTable} t ON t.product_id=p.id AND t.published=1
      LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
      WHERE p.active=1 AND p.id IN (${placeholders})`).bind(brand,branch,...ids).all<{
      id:number;code:string;name:string;category:string;unit:string;price_cents:number;
    }>();
    const found=new Map(results.map(item=>[item.id,item]));
    const priced=lines.map(line=>{
      const product=found.get(line.product_id);
      if(!product||!Number.isSafeInteger(product.price_cents)||product.price_cents<1)throw Error('One or more products are no longer available with a published price.');
      if(product.price_cents!==line.expected_price_cents)throw Error('Branch prices have changed. Refresh the catalogue and review the quotation before sending.');
      return {product_id:line.product_id,quantity:line.quantity,price_cents:product.price_cents,code:product.code,name:product.name,unit:product.unit,category:product.category};
    });
    const calculated=calculateQuote(priced),now=new Date().toISOString();
    // A single atomic INSERT stores document + product snapshot; SQLite enforces the unique retry key.
    const inserted=await env.DB.prepare(`INSERT OR IGNORE INTO till_quotation_submissions
      (request_id,payload_hash,branch,submitted_by_email,submitted_by_name,customer_name,customer_contact,notes,lines_json,net_cents,vat_cents,total_cents,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(requestId,payloadHash,branch,member.email.toLowerCase(),member.name,
      customerName,customerContact,notes,JSON.stringify(calculated.lines),calculated.net_cents,calculated.vat_cents,
      calculated.total_cents,'AWAITING_CASH_OFFICE',now).run();
    const saved=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(requestId).first<QuoteRow>();
    if(!saved)return fail('Quotation could not be saved.',503);
    if(saved.payload_hash!==payloadHash||saved.submitted_by_email.toLowerCase()!==member.email.toLowerCase())return fail('Quotation request identifier was already used.',409);
    return Response.json({quotation:serial(saved),duplicate:(inserted.meta.changes??0)===0},{headers:cache});
  }catch(error){
    const message=error instanceof Error?error.message:'';
    if(message.includes('prices have changed')||message.includes('no longer available'))return fail(message,409);
    return fail('Cash Office queue unavailable. The quotation was not confirmed; retry the same request.',503);
  }
}
export async function GET(req:Request){
  const permission=await access(req);if('error' in permission)return permission.error!;
  const {member,allowed}=permission;
  const search=new URL(req.url).searchParams;
  const branch=permittedBranch(allowed,search.get('branch'));
  if(!branch)return fail('Select an assigned branch.',403);
  if(!canReviewCashOffice(member.role,member.access_scope))return fail('Cash Office permission required.',403);
  const q=(search.get('q')||'').trim();if(q.length>80)return fail('Search is too long.');
  const id=quoteId(q);
  try{
    await ensureTable();
    const {results}=await env.DB.prepare(`SELECT * FROM till_quotation_submissions
      WHERE lower(branch)=lower(?) AND (?='' OR id=? OR lower(customer_name) LIKE lower(?) OR lower(submitted_by_name) LIKE lower(?))
      ORDER BY CASE status WHEN 'AWAITING_CASH_OFFICE' THEN 0 ELSE 1 END,id DESC LIMIT 75`)
      .bind(branch,q,id??-1,`%${q.replaceAll('%','').replaceAll('_','')}%`,`%${q.replaceAll('%','').replaceAll('_','')}%`).all<QuoteRow>();
    return Response.json({quotations:results.map(serial),branch},{headers:cache});
  }catch{return fail('Cash Office queue unavailable. Check the quotation database.',503);}
}
export async function PATCH(req:Request){
  if(!trustedOrigin(req))return fail('Untrusted request origin.',403);
  const permission=await access(req);if('error' in permission)return permission.error!;
  const {member,allowed}=permission;
  if(!canReviewCashOffice(member.role,member.access_scope))return fail('Cash Office permission required.',403);
  let body:{branch?:string;number?:string};
  try{body=await req.json() as typeof body;}catch{return fail('Invalid review request.');}
  const branch=permittedBranch(allowed,body?.branch??null),id=quoteId(body?.number);
  if(!branch||!id)return fail('Select an assigned branch and valid quotation number.',403);
  try{
    await ensureTable();
    const result=await env.DB.prepare(`UPDATE till_quotation_submissions
      SET status='REVIEWED',received_by_email=?,received_at=?
      WHERE id=? AND lower(branch)=lower(?) AND status='AWAITING_CASH_OFFICE' RETURNING *`)
      .bind(member.email.toLowerCase(),new Date().toISOString(),id,branch).first<QuoteRow>();
    if(!result)return fail('Quotation was already reviewed or is not available for this branch.',409);
    return Response.json({quotation:serial(result)},{headers:cache});
  }catch{return fail('Could not update Cash Office queue.',503);}
}
