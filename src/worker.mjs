import { createRemoteJWKSet, jwtVerify } from 'jose';
import {
  allowPosRole,allowedBranches,getBranch,isManager,brandForBranch,
  quoteId,validatedLines,calculateQuote,canonicalQuotePayload,productFilter,serialQuote
} from './domain.mjs';

const NO_STORE = {'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY',
  'referrer-policy':'same-origin','cross-origin-resource-policy':'same-origin',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
const error = (message,status=400)=>Response.json({error:message},{status,headers:NO_STORE});
const ok = (data,status=200)=>Response.json(data,{status,headers:NO_STORE});
const cacheJwks = new Map();

async function authenticatedMember(request,env,ctx) {
  let email='';
  const hostname=new URL(request.url).hostname;
  // Explicit local development identity only; disabled on deployed hostnames.
  if (env.LOCAL_DEV_AUTH==='true' && ['localhost','127.0.0.1'].includes(hostname)) {
    email=(env.LOCAL_DEV_EMAIL||'').toLowerCase();
  } else {
    const team=String(env.CF_ACCESS_TEAM_DOMAIN||'').replace(/\/$/,'');
    const aud=String(env.CF_ACCESS_AUD||'');
    if(!/^https:\/\/[a-z0-9.-]+\.cloudflareaccess\.com$/i.test(team) || !aud || aud.startsWith('REPLACE')) return null;
    const token=request.headers.get('Cf-Access-Jwt-Assertion');
    if (!token) return null;
    let jwks=cacheJwks.get(team);
    if(!jwks){jwks=createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));cacheJwks.set(team,jwks);}
    try {
      const {payload}=await jwtVerify(token,jwks,{issuer:team,audience:aud,algorithms:['RS256']});
      email=typeof payload.email==='string'?payload.email.trim().toLowerCase():'';
    } catch {return null;}
  }
  if(!email)return null;
  const member=await env.DB.prepare(`SELECT name,email,role,department,access_scope,workspace_access
      FROM team_members WHERE lower(email)=? AND active=1 LIMIT 1`).bind(email).first();
  if(!member||!allowPosRole(member.role,member.access_scope))return null;
  const {results}=await env.DB.prepare("SELECT name FROM workspaces WHERE active=1 AND type='Store' ORDER BY name").all();
  const branches=allowedBranches(member,results.map(r=>r.name));
  return {member,branches};
}
function sameOriginWrite(req) {
  const u=new URL(req.url);
  return req.headers.get('origin')===u.origin &&
    (req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()==='application/json';
}
function selectBranch(session,query){return getBranch(session.branches,query);}
function tagTable(branch){return brandForBranch(branch)==='busterbuild'?'busterbuild_price_tags':'powerbuild_price_tags';}

async function products(req,env,session) {
  const params=new URL(req.url).searchParams;
  const branch=selectBranch(session,params.get('branch'));
  if(!branch)return error('Select a retail branch assigned to your account.',403);
  const q=(params.get('q')||'').trim(),category=(params.get('category')||'').trim();
  if(q.length>100||category.length>100)return error('Search or category too long.');
  const page=Number(params.get('page')||'1');
  if(!Number.isSafeInteger(page)||page<1||page>500)return error('Invalid page.');
  const t=tagTable(branch), brand=brandForBranch(branch),match=productFilter(q);
  // Stock is shown only when the verified branch inventory ledger is active.
  const sql=(includeStock)=>`SELECT p.id,p.code,p.name,p.category,
       CASE WHEN t.product_id IS NOT NULL THEN COALESCE(bp.price_cents,t.price_cents,0) ELSE 0 END AS price_cents,
       COALESCE(t.unit,'each') AS unit,COALESCE(t.coverage_per_box,0) AS coverage_per_box
       ${includeStock?`,CASE WHEN s.active=1 THEN b.qty_milli ELSE NULL END AS qty_milli`:`,NULL AS qty_milli`}
    FROM catalogue_products p
    LEFT JOIN ${t} t ON t.product_id=p.id AND t.published=1
    LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
    ${includeStock?`LEFT JOIN stock_inventory_branches s ON lower(s.branch_name)=lower(?)
       LEFT JOIN stock_inventory_balances b ON b.catalogue_product_id=p.id AND lower(b.branch_name)=lower(?)`:''}
    WHERE p.active=1 AND (?='' OR lower(p.code)=lower(?) OR lower(p.code) LIKE ? ESCAPE '\\' OR lower(p.name) LIKE ? ESCAPE '\\')
      AND (?='' OR lower(COALESCE(NULLIF(trim(p.category),''),'Uncategorised'))=lower(?))
    ORDER BY CASE WHEN lower(p.code)=lower(?) THEN 0 ELSE 1 END,p.name COLLATE NOCASE,p.id LIMIT 37 OFFSET ?`;
  const bind=(withStock)=>[brand,branch,...(withStock?[branch,branch]:[]),q,q,match,match,category,category,q,(page-1)*36];
  let list;
  try{list=(await env.DB.prepare(sql(true)).bind(...bind(true)).all()).results;}
  catch(e){
    // Older Hub installations may not yet contain the stock-ledger tables.
    if(!String(e).toLowerCase().includes('no such table'))return error('Product search temporarily unavailable.',503);
    try{list=(await env.DB.prepare(sql(false)).bind(...bind(false)).all()).results;}
    catch {return error('Product search temporarily unavailable.',503);}
  }
  return ok({branch,brand,page,has_more:list.length>36,products:list.slice(0,36)});
}
async function categories(req,env,session){
  const branch=selectBranch(session,new URL(req.url).searchParams.get('branch'));
  if(!branch)return error('Select an assigned branch.',403);
  const rows=(await env.DB.prepare(`SELECT DISTINCT COALESCE(NULLIF(trim(category),''),'Uncategorised') AS category
   FROM catalogue_products WHERE active=1 ORDER BY category COLLATE NOCASE LIMIT 200`).all()).results;
  return ok({categories:rows.map(x=>x.category)});
}
async function quotesGet(req,env,session){
  const q=new URL(req.url).searchParams;
  const branch=selectBranch(session,q.get('branch'));
  if(!branch)return error('Select an assigned branch.',403);
  const manager=isManager(session.member.role,session.member.access_scope);
  const filter=(q.get('q')||'').trim();if(filter.length>80)return error('Filter too long.');
  const numeric=quoteId(filter),needle=`%${filter.replaceAll('%','').replaceAll('_','')}%`;
  try{
    const rows=(await env.DB.prepare(`SELECT * FROM till_quotation_submissions WHERE lower(branch)=lower(?)
       AND (?=1 OR lower(submitted_by_email)=lower(?)) AND
       (?='' OR id=? OR lower(customer_name) LIKE lower(?) OR lower(submitted_by_name) LIKE lower(?))
       ORDER BY id DESC LIMIT 100`)
       .bind(branch,manager?1:0,session.member.email,filter,numeric??-1,needle,needle).all()).results;
    return ok({branch,quotations:rows.map(serialQuote)});
  } catch{return error('Quotation history is unavailable. Verify migration 0055.',503);}
}
async function quoteDetails(req,env,session,idString){
  const id=quoteId(idString);if(!id)return error('Invalid quotation reference.');
  try{
    const row=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE id=?').bind(id).first();
    if(!row)return error('Quotation not found.',404);
    if(!selectBranch(session,row.branch))return error('Not authorised for this branch.',403);
    if(!isManager(session.member.role,session.member.access_scope)&&row.submitted_by_email.toLowerCase()!==session.member.email.toLowerCase())return error('Quotation not available to your role.',403);
    return ok({quotation:serialQuote(row)});
  }catch{return error('Quotation not available.',503);}
}
async function quotesPost(req,env,session){
  if(!sameOriginWrite(req))return error('Invalid request origin or content type.',403);
  const contentLength=Number(req.headers.get('content-length')||0);
  if(contentLength>22000)return error('Quotation payload too large.',413);
  let body;
  try{const text=await req.text();if(text.length>22000)return error('Quotation payload too large.',413);body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return error('Invalid JSON quotation.');}
  const uuid=String(body.request_id||'');
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(uuid))return error('Invalid request ID.');
  const branch=selectBranch(session,body.branch);
  if(!branch)return error('Branch is not assigned to your account.',403);
  const customerName=String(body.customer_name||'Walk-in customer').trim();
  const customerContact=String(body.customer_contact||'').trim();
  const notes=String(body.notes||'').trim();
  if(customerName.length<1||customerName.length>120||customerContact.length>80||notes.length>400)return error('Invalid customer fields.');
  let lines;
  try{lines=validatedLines(body.lines);}catch(e){return error(e.message);}
  const canonical=canonicalQuotePayload(branch,customerName,customerContact,notes,lines);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical));
  const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const email=session.member.email.toLowerCase();
  try {
    // Do not repeat a quotation on retry. Existing Hub request IDs remain compatible.
    const previous=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(uuid).first();
    if(previous){
      if(previous.payload_hash!==hash||previous.submitted_by_email.toLowerCase()!==email)return error('Request ID is already used.',409);
      return ok({quotation:serialQuote(previous),duplicate:true});
    }
    const t=tagTable(branch),brand=brandForBranch(branch),ids=lines.map(x=>x.product_id);
    const placeholders=ids.map(()=>'?').join(',');
    const rows=(await env.DB.prepare(`SELECT p.id,p.code,p.name,p.category,COALESCE(t.unit,'each') AS unit,
      CASE WHEN t.product_id IS NOT NULL THEN COALESCE(bp.price_cents,t.price_cents,0) ELSE 0 END AS price_cents
      FROM catalogue_products p LEFT JOIN ${t} t ON t.product_id=p.id AND t.published=1
      LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
      WHERE p.active=1 AND p.id IN (${placeholders})`).bind(brand,branch,...ids).all()).results;
    const found=new Map(rows.map(r=>[r.id,r]));
    const priced=lines.map(l=>{
      const p=found.get(l.product_id);
      if(!p||!Number.isSafeInteger(p.price_cents)||p.price_cents<1)throw Error('One or more products have no approved selling price.');
      if(p.price_cents!==l.expected_price_cents)throw Error('A product price has changed. Refresh the product list before submission.');
      return {product_id:p.id,quantity:l.quantity,price_cents:p.price_cents,code:p.code,name:p.name,unit:p.unit,category:p.category};
    });
    const calculated=calculateQuote(priced),now=new Date().toISOString();
    const inserted=await env.DB.prepare(`INSERT OR IGNORE INTO till_quotation_submissions
      (request_id,payload_hash,branch,submitted_by_email,submitted_by_name,customer_name,customer_contact,notes,
       lines_json,net_cents,vat_cents,total_cents,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
       .bind(uuid,hash,branch,email,session.member.name,customerName,customerContact,notes,
        JSON.stringify(calculated.lines),calculated.net_cents,calculated.vat_cents,calculated.total_cents,
        'AWAITING_CASH_OFFICE',now).run();
    const row=await env.DB.prepare('SELECT * FROM till_quotation_submissions WHERE request_id=?').bind(uuid).first();
    if(!row)return error('Quotation did not save. Please retry.',503);
    if(row.payload_hash!==hash||row.submitted_by_email.toLowerCase()!==email)return error('Request ID conflict.',409);
    return ok({quotation:serialQuote(row),duplicate:(inserted.meta.changes??0)===0},201);
  }catch(e){
    const msg=e instanceof Error?e.message:'';
    if(/price has changed|no approved selling price/.test(msg))return error(msg,409);
    return error('Quotation service unavailable. Retry with the same draft; no payment has been taken.',503);
  }
}
async function summary(req,env,session){
  const branch=selectBranch(session,new URL(req.url).searchParams.get('branch'));
  if(!branch)return error('Select an assigned branch.',403);
  const manager=isManager(session.member.role,session.member.access_scope);
  try{
    const metrics=await env.DB.prepare(`SELECT COUNT(*) AS quotes_total,
      SUM(CASE WHEN status='AWAITING_CASH_OFFICE' THEN 1 ELSE 0 END) AS pending,
      COALESCE(SUM(total_cents),0) AS quoted_cents
      FROM till_quotation_submissions WHERE lower(branch)=lower(?) AND (?=1 OR lower(submitted_by_email)=lower(?))`)
      .bind(branch,manager?1:0,session.member.email).first();
    return ok({branch,metrics:{quotes_total:metrics?.quotes_total||0,pending:metrics?.pending||0,quoted_cents:metrics?.quoted_cents||0},mode:'QUOTATIONS_ONLY'});
  }catch{return ok({branch,metrics:{quotes_total:0,pending:0,quoted_cents:0},mode:'QUOTATIONS_ONLY',warning:'Quotation metrics unavailable until migration 0055 is applied.'});}
}
export default {
  async fetch(req,env,ctx){
    const path=new URL(req.url).pathname;
    if(!path.startsWith('/api')) return env.ASSETS.fetch(req);
    if(req.method==='OPTIONS')return new Response(null,{status:405,headers:NO_STORE});
    if(!env.DB)return error('D1 database binding missing.',503);
    try{
      if(path==='/api/health'&&req.method==='GET')return ok({service:'MaliksPOS',status:'online',payments_enabled:false});
      const session=await authenticatedMember(req,env,ctx);
      if(!session)return error('Sign in through Cloudflare Access with a permitted Maliks Hub account.',401);
      if(!session.branches.length)return error('No active retail branch assigned. Contact your administrator.',403);
      if(path==='/api/session'&&req.method==='GET')return ok({user:{name:session.member.name,email:session.member.email,role:session.member.role},branches:session.branches,features:{quotes:true,live_payments:false,dispatch:false,offline_drafts:true},mode:'QUOTATIONS_ONLY'});
      if(path==='/api/products'&&req.method==='GET')return products(req,env,session);
      if(path==='/api/categories'&&req.method==='GET')return categories(req,env,session);
      if(path==='/api/summary'&&req.method==='GET')return summary(req,env,session);
      if(path==='/api/quotes'&&req.method==='GET')return quotesGet(req,env,session);
      if(path==='/api/quotes'&&req.method==='POST')return quotesPost(req,env,session);
      const detail=/^\/api\/quotes\/(Q-\d{1,12})$/i.exec(path);
      if(detail&&req.method==='GET')return quoteDetails(req,env,session,detail[1]);
      return error('This action is not available in this MaliksPOS release.',404);
    }catch(e){
      // Do not disclose D1 exception details or secret configuration to clients.
      return error('MaliksPOS could not complete the request. Please check connectivity and configuration.',503);
    }
  }
};
