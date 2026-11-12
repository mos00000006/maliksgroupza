import { createRemoteJWKSet, jwtVerify } from 'jose';
import { APPS, canUseApp, allowedBranches, matchingBranch, limitSearch } from './policy.mjs';
import { validateQuoteLines, calculateQuote, canonicalQuotePayload, quoteNumber, quoteListStatement, quoteLookupStatement } from './quote-domain.mjs';

const HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff'};
const denied=(msg='Access denied.',status=403)=>Response.json({error:msg},{status,headers:HEADERS});
const result=(json,status=200)=>Response.json(json,{status,headers:HEADERS});
const securityCache = new Map();
const accessVars={pos:'ACCESS_AUD_POS',tills:'ACCESS_AUD_TILLS',cashoffice:'ACCESS_AUD_CASHOFFICE',dispatch:'ACCESS_AUD_DISPATCH'};

async function identity(request,env) {
  const app=request.headers.get('x-maliks-app');
  if(!APPS.includes(app)) return null;
  const jwt=request.headers.get('cf-access-jwt-assertion');
  const issuer=String(env.CF_ACCESS_TEAM_DOMAIN||'').replace(/\/$/,'');
  const audience=env[accessVars[app]];
  if(!jwt || !issuer.startsWith('https://') || !audience || audience.startsWith('REPLACE_')) return null;
  try {
    let keys=securityCache.get(issuer);
    if(!keys){keys=createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));securityCache.set(issuer,keys);}
    const {payload}=await jwtVerify(jwt,keys,{issuer,audience,algorithms:['RS256']});
    const email=typeof payload.email==='string' ? payload.email.trim().toLowerCase() : '';
    return email ? {email,app} : null;
  } catch {return null;}
}

async function memberAndBranches(env,email,app){
  const member=await env.DB.prepare(`SELECT name,email,role,department,access_scope,workspace_access,active
    FROM team_members WHERE lower(email)=? AND active=1 LIMIT 1`).bind(email).first();
  if(!canUseApp(member,app))return null;
  const {results}=await env.DB.prepare("SELECT name FROM workspaces WHERE type='Store' AND active=1 ORDER BY name").all();
  const branches=allowedBranches(member,results.map(r=>r.name));
  return branches.length ? {member,branches} : null;
}

function tagTableFor(branch){return /buster\s*build/i.test(branch)?'busterbuild_price_tags':'powerbuild_price_tags';}
function brandFor(branch){return /buster\s*build/i.test(branch)?'busterbuild':'powerbuild';}

async function catalogue(req,env,context){
  if(context.app!=='pos')return denied('This app cannot access the sales catalogue.');
  const query=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,query.get('branch'));
  const q=limitSearch(query.get('q') || '');
  if(!branch)return denied('Select your assigned branch.');
  if(q===null)return denied('Search is too long.',400);
  // A bounded lookup preserves shared D1 capacity. Exact product codes are ranked first.
  if(!q)return result({branch,products:[]});
  const pattern=`%${q.toLowerCase().replaceAll('%','\\%').replaceAll('_','\\_')}%`;
  const table=tagTableFor(branch),brand=brandFor(branch);
  const {results}=await env.DB.prepare(`SELECT p.id,p.code,p.name,p.category,
    COALESCE(bp.price_cents,t.price_cents) AS price_cents,
    COALESCE(t.unit,'each') AS unit,COALESCE(t.coverage_per_box,0) AS coverage_per_box
    FROM catalogue_products p
    JOIN ${table} t ON t.product_id=p.id AND t.published=1
    LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
    WHERE p.active=1 AND COALESCE(bp.price_cents,t.price_cents)>0
    AND (lower(p.code)=lower(?) OR lower(p.code) LIKE ? ESCAPE '\\' OR lower(p.name) LIKE ? ESCAPE '\\')
    ORDER BY CASE WHEN lower(p.code)=lower(?) THEN 0 ELSE 1 END,p.name LIMIT 35
  `).bind(brand,branch,q,pattern,pattern,q).all();
  return result({branch,products:results});
}

const createQuoteTable=`CREATE TABLE IF NOT EXISTS till_quotation_submissions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,
 branch TEXT NOT NULL,submitted_by_email TEXT NOT NULL,submitted_by_name TEXT NOT NULL,
 customer_name TEXT NOT NULL,customer_contact TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',
 lines_json TEXT NOT NULL,net_cents INTEGER NOT NULL CHECK(net_cents>=0),
 vat_cents INTEGER NOT NULL CHECK(vat_cents>=0),total_cents INTEGER NOT NULL CHECK(total_cents>0),
 status TEXT NOT NULL DEFAULT 'AWAITING_CASH_OFFICE' CHECK(status IN ('AWAITING_CASH_OFFICE','REVIEWED')),
 created_at TEXT NOT NULL,received_by_email TEXT,received_at TEXT)`;
const quoteForClient=row=>({number:quoteNumber(row.id),branch:row.branch,customer_name:row.customer_name,
  customer_contact:row.customer_contact,submitted_by_name:row.submitted_by_name,
  notes:row.notes,created_at:row.created_at,status:row.status,
  net_cents:row.net_cents,vat_cents:row.vat_cents,total_cents:row.total_cents,
  lines:JSON.parse(row.lines_json)});

async function listQuotes(req,env,context){
  if(!['pos','tills','cashoffice'].includes(context.app))return denied('This app cannot review quotations.');
  const branch=matchingBranch(context.branches,new URL(req.url).searchParams.get('branch'));
  if(!branch)return denied('Select an assigned branch.');
  await env.DB.prepare(createQuoteTable).run();
  const listing=quoteListStatement(context.app,branch,context.member.email);
  const {results}=await env.DB.prepare(listing.sql).bind(...listing.params).all();
  return result({branch,quotes:results.map(quoteForClient)});
}

/** Exact-number lookup is read-only and always constrained to the signed-in user's branch. */
export async function findQuote(req,env,context){
  if(!['pos','tills','cashoffice'].includes(context.app))return denied('This app cannot look up quotations.');
  const query=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,query.get('branch'));
  if(!branch)return denied('Select an assigned branch.');
  let lookup;
  try{lookup=quoteLookupStatement(context.app,branch,context.member.email,query.get('number'));}
  catch(error){return denied(error.message,400);}
  await env.DB.prepare(createQuoteTable).run();
  const row=await env.DB.prepare(lookup.sql).bind(...lookup.params).first();
  if(!row)return denied('Quotation not found for this branch.',404);
  return result({branch,quotation:quoteForClient(row)});
}

async function createQuote(req,env,context){
  if(context.app!=='pos')return denied('Only the Sales POS can submit quotations.');
  const origin=req.headers.get('origin');
  const originExpected=req.headers.get('x-maliks-original-origin');
  if(!origin || !originExpected || origin!==originExpected)return denied('Invalid request origin.');
  const bytes=await req.text();
  if(bytes.length>22000)return denied('Quotation too large.',413);
  let body;
  try{body=JSON.parse(bytes);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return denied('Invalid quotation.',400);}
  if(typeof body.request_id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.request_id))return denied('Invalid quotation request ID.',400);
  const branch=matchingBranch(context.branches,body.branch);
  if(!branch)return denied('Branch access denied.');
  const customer=String(body.customer_name||'Walk-in customer').trim();
  const contact=String(body.customer_contact||'').trim();
  const notes=String(body.notes||'').trim();
  if(!customer||customer.length>120||contact.length>80||notes.length>400)return denied('Invalid customer or notes.',400);
  let lines;
  try{lines=validateQuoteLines(body.lines);}catch(error){return denied(error.message,400);}
  const canonical=canonicalQuotePayload(branch,customer,contact,notes,lines);
  const bytesHash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  const hash=Array.from(new Uint8Array(bytesHash),x=>x.toString(16).padStart(2,'0')).join('');
  await env.DB.prepare(createQuoteTable).run();
  const existing=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(body.request_id).first();
  if(existing){
    if(existing.payload_hash!==hash || existing.submitted_by_email.toLowerCase()!==context.member.email.toLowerCase())return denied('Request ID already used.',409);
    return result({quotation:quoteForClient(existing),duplicate:true});
  }
  const brand=brandFor(branch), table=tagTableFor(branch), ids=lines.map(x=>x.product_id);
  const marks=ids.map(()=>'?').join(',');
  const {results}=await env.DB.prepare(`SELECT p.id,p.code,p.name,COALESCE(t.unit,'each') AS unit,
    CASE WHEN t.product_id IS NOT NULL THEN COALESCE(bp.price_cents,t.price_cents,0) ELSE 0 END AS price_cents
    FROM catalogue_products p
    LEFT JOIN ${table} t ON t.product_id=p.id AND t.published=1
    LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
    WHERE p.active=1 AND p.id IN (${marks})`).bind(brand,branch,...ids).all();
  const byId=new Map(results.map(p=>[p.id,p]));
  let calculated;
  try {
    const priced=lines.map(line=>{
      const product=byId.get(line.product_id);
      if(!product || !Number.isSafeInteger(product.price_cents)||product.price_cents<1)throw Error('Product unavailable.');
      if(product.price_cents!==line.expected_price_cents)throw Error('Price changed. Refresh the catalogue.');
      return {product_id:line.product_id,quantity:line.quantity,price_cents:product.price_cents,code:product.code,name:product.name,unit:product.unit};
    });
    calculated=calculateQuote(priced);
  } catch(error){return denied(error.message,409);}
  const now=new Date().toISOString();
  await env.DB.prepare(`INSERT OR IGNORE INTO till_quotation_submissions
    (request_id,payload_hash,branch,submitted_by_email,submitted_by_name,customer_name,customer_contact,notes,
     lines_json,net_cents,vat_cents,total_cents,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(body.request_id,hash,branch,context.member.email.toLowerCase(),context.member.name,
    customer,contact,notes,JSON.stringify(calculated.lines),calculated.net_cents,calculated.vat_cents,
    calculated.total_cents,'AWAITING_CASH_OFFICE',now).run();
  const saved=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(body.request_id).first();
  if(!saved)return denied('Quotation not saved.',503);
  if(saved.payload_hash!==hash || saved.submitted_by_email.toLowerCase()!==context.member.email.toLowerCase())return denied('Request ID already used.',409);
  return result({quotation:quoteForClient(saved)});
}

export default {
  async fetch(req,env){
    const path=new URL(req.url).pathname;
    if(!path.startsWith('/v1/'))return denied('Internal service only.',404);
    if(!['GET','POST'].includes(req.method))return denied('Method not allowed.',405);
    const auth=await identity(req,env);
    if(!auth)return denied('Cloudflare Access login is required.',401);
    try{
      const access=await memberAndBranches(env,auth.email,auth.app);
      if(!access)return denied('No active department and branch assignment.');
      const context={...access,app:auth.app};
      if(path==='/v1/session'&&req.method==='GET')return result({
        app:auth.app,user:{name:access.member.name,role:access.member.role},branches:access.branches,
        mode:'PHASE_1',live_payment:false,stock_posting:false,
      });
      if(path==='/v1/catalogue'&&req.method==='GET')return await catalogue(req,env,context);
      if(path==='/v1/quotes'&&req.method==='GET')return await listQuotes(req,env,context);
      if(path==='/v1/quotes/find'&&req.method==='GET')return await findQuote(req,env,context);
      if(path==='/v1/quotes'&&req.method==='POST')return await createQuote(req,env,context);
      return denied('Unknown operation.',404);
    }catch(error){
      console.error('Maliks Core request failed',error?.message||'Unknown error');
      return denied('Service temporarily unavailable. Contact IT.',503);
    }
  }
};
