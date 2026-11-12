import { createRemoteJWKSet, jwtVerify } from 'jose';
import { APPS, canUseApp, allowedBranches, matchingBranch, limitSearch } from './policy.mjs';
import { validateQuoteLines, calculateQuote, canonicalQuotePayload, quoteNumber, quoteListStatement, quoteLookupStatement } from './quote-domain.mjs';
import { validateRequestId, validateTillCode, validateMoneyCents, validateCloseNote, validateShiftId, shiftForClient, shiftListStatement } from './shift-domain.mjs';
import {validateReviewDecision,validateReviewNote,latestReviewsStatement,reviewHistoryStatement,reviewForClient} from './review-domain.mjs';
import {validateTenderPreparation,tenderListStatement,tenderForClient} from './tender-domain.mjs';
import {quoteId} from './quote-domain.mjs';

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


// Cash Office records immutable observations on CLOSED cashier declarations only.
// This is not a cash-up, approved deposit, invoice, or verified expected takings.
async function readReviewBody(req){
  const raw=await req.text();
  if(raw.length>1800)throw Error('Review request too large.');
  let body;try{body=JSON.parse(raw);}catch{throw Error('Invalid review request.');}
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid review request.');
  return body;
}
async function reviewHistory(req,env,context){
  if(context.app!=='cashoffice')return denied('Cash Office review access required.');
  const query=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,query.get('branch'));
  if(!branch)return denied('Branch access denied.');
  let shiftId;
  try{shiftId=validateShiftId(Number(query.get('shift_id')));}catch(error){return denied(error.message,400);}
  const shift=await env.DB.prepare('SELECT id,status FROM maliks_till_shift_register WHERE id=? AND lower(branch)=lower(?)')
    .bind(shiftId,branch).first();
  if(!shift)return denied('Shift not found for this branch.',404);
  const lookup=reviewHistoryStatement(branch,shiftId);
  const {results}=await env.DB.prepare(lookup.sql).bind(...lookup.params).all();
  return result({branch,shift_id:shiftId,shift_status:shift.status,reviews:results.map(reviewForClient),cash_reconciliation:false});
}
async function recordShiftReview(req,env,context){
  if(context.app!=='cashoffice')return denied('Only Cash Office can record shift reviews.');
  if(!req.headers.get('origin') || req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))
    return denied('Invalid request origin.');
  let body,id,requestId,decision,note;
  try{
    body=await readReviewBody(req);
    id=validateShiftId(body.shift_id);
    requestId=validateRequestId(body.request_id);
    decision=validateReviewDecision(body.decision);
    note=validateReviewNote(body.note,decision);
  }catch(error){return denied(error.message,400);}
  const branch=matchingBranch(context.branches,body.branch);
  if(!branch)return denied('Branch access denied.');
  const reviewer=context.member.email.toLowerCase();
  // Atomic INSERT ... SELECT ensures the referenced shift is CLOSED, belongs
  // to the assigned branch and was opened by someone other than the reviewer.
  await env.DB.prepare(`INSERT OR IGNORE INTO maliks_till_shift_reviews
    (request_id,shift_id,branch,decision,note,reviewed_by_email,reviewed_by_name,created_at)
    SELECT ?,id,branch,?,?,?,?,? FROM maliks_till_shift_register
    WHERE id=? AND lower(branch)=lower(?) AND status='CLOSED'
      AND lower(opened_by_email)<>lower(?)`)
    .bind(requestId,decision,note,reviewer,context.member.name,new Date().toISOString(),id,branch,reviewer).run();
  const saved=await env.DB.prepare('SELECT * FROM maliks_till_shift_reviews WHERE request_id=?')
    .bind(requestId).first();
  if(!saved)return denied('Closed shift not available, or independent review is required.',409);
  if(saved.shift_id!==id || saved.branch.toLowerCase()!==branch.toLowerCase() ||
      saved.reviewed_by_email.toLowerCase()!==reviewer || saved.decision!==decision || saved.note!==note)
    return denied('Review request identifier was already used.',409);
  return result({review:reviewForClient(saved),cash_reconciliation:false});
}

// Phase 6 tender PREPARATION: never records payment, invoice, settlement, or stock movement.
// A quote has at most one immutable practice allocation, and only a signed-in
// cashier with an OPEN shift for the same branch can prepare it.
async function listTenderPreparations(req,env,context){
  if(!['tills','cashoffice'].includes(context.app))return denied('Tender preparation access denied.');
  const branch=matchingBranch(context.branches,new URL(req.url).searchParams.get('branch'));
  if(!branch)return denied('Branch access denied.');
  const statement=tenderListStatement(context.app,branch,context.member.email);
  const {results}=await env.DB.prepare(statement.sql).bind(...statement.params).all();
  return result({branch,preparations:results.map(tenderForClient),payment_recorded:false,dispatch_released:false});
}
async function recordTenderPreparation(req,env,context){
  if(context.app!=='tills')return denied('Only a Tills cashier can prepare tender allocations.');
  const origin=req.headers.get('origin');
  if(!origin||origin!==req.headers.get('x-maliks-original-origin'))return denied('Invalid request origin.');
  const raw=await req.text();
  if(raw.length>2500)return denied('Preparation too large.',413);
  let body;
  try{body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
  catch{return denied('Invalid tender preparation.',400);}
  const branch=matchingBranch(context.branches,body.branch);
  if(!branch)return denied('Branch access denied.');
  const id=quoteId(body.quotation_number);
  if(!id)return denied('Valid quotation number required.',400);
  const quote=await env.DB.prepare(`SELECT id,branch,total_cents,status FROM till_quotation_submissions
    WHERE id=? AND lower(branch)=lower(?) LIMIT 1`).bind(id,branch).first();
  if(!quote)return denied('Quotation not found in your assigned branch.',404);
  let v;
  try{v=validateTenderPreparation(body,quote.total_cents);}
  catch(error){return denied(error.message,400);}
  const email=context.member.email.toLowerCase();
  // Atomic INSERT SELECT checks open-shift ownership, branch and unchanged
  // quote total at the moment of writing, rather than trusting browser claims.
  await env.DB.prepare(`INSERT OR IGNORE INTO maliks_tender_preparations
    (request_id,quotation_id,quotation_number,branch,shift_id,prepared_by_email,prepared_by_name,
     cash_applied_cents,cash_received_cents,card_cents,card_reference,eft_cents,eft_reference,
     change_cents,quote_total_cents,status,created_at)
    SELECT ?,q.id,?,q.branch,s.id,?,?,?,?,?,?,?,?,?,q.total_cents,'PREPARATION_ONLY',?
    FROM till_quotation_submissions q JOIN maliks_till_shift_register s
      ON s.id=? AND lower(s.branch)=lower(q.branch) AND lower(s.opened_by_email)=lower(?) AND s.status='OPEN'
    WHERE q.id=? AND lower(q.branch)=lower(?) AND q.total_cents=?`)
    .bind(v.request_id,quoteNumber(id),email,context.member.name,
      v.cash_applied_cents,v.cash_received_cents,v.card_cents,v.card_reference,v.eft_cents,v.eft_reference,
      v.change_cents,new Date().toISOString(),v.shift_id,email,id,branch,v.quote_total_cents).run();
  const saved=await env.DB.prepare('SELECT * FROM maliks_tender_preparations WHERE request_id=?').bind(v.request_id).first();
  if(!saved)return denied('An open shift is required, or this quotation already has a preparation.',409);
  if(saved.quotation_id!==id || saved.branch.toLowerCase()!==branch.toLowerCase() || saved.shift_id!==v.shift_id ||
     saved.prepared_by_email.toLowerCase()!==email ||
     ['cash_applied_cents','cash_received_cents','card_cents','card_reference','eft_cents','eft_reference','change_cents','quote_total_cents'].some(k=>saved[k]!==v[k]))
    return denied('Preparation request identifier already used.',409);
  return result({preparation:tenderForClient(saved),payment_recorded:false,invoice_created:false,dispatch_released:false});
}

// Department shift register. The schema is installed separately by the Phase 4 SQL.
// No shift endpoint marks quotations paid, creates an invoice or alters inventory.
async function readShiftBody(req){
  const raw=await req.text();
  if(raw.length>2500)throw Error('Shift request too large.');
  let body;try{body=JSON.parse(raw);}catch{throw Error('Invalid shift request.');}
  if(!body || typeof body!=='object' || Array.isArray(body))throw Error('Invalid shift request.');
  return body;
}
async function listTillShifts(req,env,context){
  if(!['tills','cashoffice'].includes(context.app))return denied('This application cannot review till shifts.');
  const branch=matchingBranch(context.branches,new URL(req.url).searchParams.get('branch'));
  if(!branch)return denied('Select an assigned branch.');
  const statement=shiftListStatement(context.app,branch,context.member.email);
  const {results}=await env.DB.prepare(statement.sql).bind(...statement.params).all();
  const shifts=results.map(shiftForClient);
  // Only Cash Office can view other cashiers' branch records and review flags.
  if(context.app==='cashoffice' && shifts.length){
    const reviewQuery=latestReviewsStatement(branch,shifts.map(s=>s.id));
    const {results:reviews}=await env.DB.prepare(reviewQuery.sql).bind(...reviewQuery.params).all();
    const latest=new Map(reviews.map(review=>[review.shift_id,reviewForClient(review)]));
    for(const shift of shifts){
      shift.latest_review=latest.get(shift.id)||null;
      shift.review_status=shift.status==='OPEN'?'AWAITING_CLOSE':
        shift.latest_review?shift.latest_review.decision:'PENDING_REVIEW';
    }
  }
  return result({branch,shifts,live_payments:false,cash_reconciliation:false});
}
async function openTillShift(req,env,context){
  if(context.app!=='tills')return denied('Only Tills can open a cashier shift.');
  const origin=req.headers.get('origin');
  if(!origin || origin!==req.headers.get('x-maliks-original-origin'))return denied('Invalid request origin.');
  let body, requestId, tillCode, amount;
  try{
    body=await readShiftBody(req);
    requestId=validateRequestId(body.request_id);
    tillCode=validateTillCode(body.till_code);
    amount=validateMoneyCents(body.opening_float_cents);
  }catch(error){return denied(error.message,400);}
  const branch=matchingBranch(context.branches,body.branch);
  if(!branch)return denied('Branch access denied.');
  const email=context.member.email.toLowerCase();
  await env.DB.prepare(`INSERT OR IGNORE INTO maliks_till_shift_register
    (open_request_id,branch,till_code,opened_by_email,opened_by_name,opening_float_cents,opened_at,status)
    VALUES(?,?,?,?,?,?,?,'OPEN')`)
    .bind(requestId,branch,tillCode,email,context.member.name,amount,new Date().toISOString()).run();
  // Supports retry after lost response; SQL unique constraints protect both till and cashier.
  const saved=await env.DB.prepare('SELECT * FROM maliks_till_shift_register WHERE open_request_id=?').bind(requestId).first();
  if(!saved)return denied('This till or cashier already has an open shift.',409);
  if(saved.opened_by_email.toLowerCase()!==email || saved.branch.toLowerCase()!==branch.toLowerCase()
     || saved.till_code!==tillCode || saved.opening_float_cents!==amount)return denied('Request identifier already used.',409);
  return result({shift:shiftForClient(saved),live_payments:false});
}
async function closeTillShift(req,env,context){
  if(context.app!=='tills')return denied('Only Tills can close a cashier shift.');
  const origin=req.headers.get('origin');
  if(!origin || origin!==req.headers.get('x-maliks-original-origin'))return denied('Invalid request origin.');
  let body, requestId, id, cashCount, note;
  try{
    body=await readShiftBody(req);
    requestId=validateRequestId(body.request_id);
    id=validateShiftId(body.shift_id);
    cashCount=validateMoneyCents(body.counted_cash_cents,1_000_000_000);
    note=validateCloseNote(body.close_notes||'');
  }catch(error){return denied(error.message,400);}
  const branch=matchingBranch(context.branches,body.branch);
  if(!branch)return denied('Branch access denied.');
  const email=context.member.email.toLowerCase();
  await env.DB.prepare(`UPDATE maliks_till_shift_register SET status='CLOSED',
    counted_cash_cents=?,close_notes=?,closed_by_email=?,closed_at=?,close_request_id=?
    WHERE id=? AND lower(branch)=lower(?) AND lower(opened_by_email)=lower(?) AND status='OPEN'`)
    .bind(cashCount,note,email,new Date().toISOString(),requestId,id,branch,email).run();
  const saved=await env.DB.prepare(`SELECT * FROM maliks_till_shift_register
    WHERE id=? AND lower(branch)=lower(?) AND lower(opened_by_email)=lower(?) LIMIT 1`).bind(id,branch,email).first();
  if(!saved)return denied('Shift not found for your assigned branch.',404);
  if(saved.status!=='CLOSED'||saved.close_request_id!==requestId||saved.counted_cash_cents!==cashCount||saved.close_notes!==note)
    return denied('This shift was already closed or the request changed.',409);
  return result({shift:shiftForClient(saved),live_payments:false});
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
        mode:auth.app==='tills'?'PHASE_6_TENDER_PREPARATION':auth.app==='cashoffice'?'PHASE_6_PREPARATION_REVIEW':'QUOTATIONS',live_payment:false,stock_posting:false,
      });
      if(path==='/v1/catalogue'&&req.method==='GET')return await catalogue(req,env,context);
      if(path==='/v1/quotes'&&req.method==='GET')return await listQuotes(req,env,context);
      if(path==='/v1/quotes/find'&&req.method==='GET')return await findQuote(req,env,context);
      if(path==='/v1/quotes'&&req.method==='POST')return await createQuote(req,env,context);
      if(path==='/v1/till-shifts'&&req.method==='GET')return await listTillShifts(req,env,context);
      if(path==='/v1/till-shifts/open'&&req.method==='POST')return await openTillShift(req,env,context);
      if(path==='/v1/till-shifts/close'&&req.method==='POST')return await closeTillShift(req,env,context);
      if(path==='/v1/till-reviews'&&req.method==='GET')return await reviewHistory(req,env,context);
      if(path==='/v1/till-reviews'&&req.method==='POST')return await recordShiftReview(req,env,context);
      if(path==='/v1/tender-preparations'&&req.method==='GET')return await listTenderPreparations(req,env,context);
      if(path==='/v1/tender-preparations'&&req.method==='POST')return await recordTenderPreparation(req,env,context);
      return denied('Unknown operation.',404);
    }catch(error){
      console.error('Maliks Core request failed',error?.message||'Unknown error');
      return denied('Service temporarily unavailable. Contact IT.',503);
    }
  }
};
