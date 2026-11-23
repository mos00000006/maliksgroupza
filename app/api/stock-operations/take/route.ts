import {env} from 'cloudflare:workers';
import {getHubMember,allowedWorkspaces,canWrite,canManageAccess} from '../../access';
import {isStockManager} from '../stock-domain.mjs';

const out=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail=(message:string,status=400)=>out({error:message},status);
const clean=(v:unknown,n=100)=>String(v??'').trim().slice(0,n);
const milli=(v:unknown)=>{if(v===''||v===null||v===undefined)throw Error('Quantity is required, enter 0 to confirm none.');const n=Number(v),m=Math.round(n*1000);if(!Number.isFinite(n)||n<0||n>1e6||Math.abs(m-n*1000)>0.00001)throw Error('Quantity must be from 0 to 1,000,000, with up to 3 decimals.');return m;};
const stamp=()=>new Date().toISOString();
type Session={id:string;reference:string;branch_name:string;status:string;created_by:string;department:string;zone:string;count_type:string;created_at:string;approved_by:string;approved_at:string;decision_note:string};
type Line={product_id:number;code:string;name:string;category:string;expected_milli:number|null;first_milli:number|null;recount_milli:number|null;first_counter:string|null;recount_counter:string|null;location_count:number};
async function context(branch:string,sessionId?:string){
 const member=await getHubMember({allowBuyerAccess:true,allowStockOrdersAccess:true});if(!member)return null;
 const allowed=allowedWorkspaces(member);if(allowed!==null&&!allowed.some(n=>n.toLowerCase()===branch.toLowerCase()))return null;
 const workplace=await env.DB.prepare('SELECT name FROM workspaces WHERE lower(name)=lower(?) AND active=1').bind(branch).first<{name:string}>();if(!workplace)return null;
 const assigned=await env.DB.prepare('SELECT duty FROM stock_ops_assignments WHERE lower(email)=lower(?) AND lower(branch_name)=lower(?) AND active=1').bind(member.email,branch).first<{duty:string}>();
 const manager=isStockManager(member,assigned?.duty||'');
 if(!manager&&!assigned){
  const counter=sessionId?await env.DB.prepare('SELECT 1 AS ok FROM stock_take_assignments WHERE session_id=? AND lower(email)=lower(?)').bind(sessionId,member.email).first<{ok:number}>():await env.DB.prepare('SELECT 1 AS ok FROM stock_take_assignments a JOIN stock_take_sessions s ON s.id=a.session_id WHERE s.branch_name=? AND lower(a.email)=lower(?) LIMIT 1').bind(branch,member.email).first<{ok:number}>();
  if(!counter)return null;
 }
 return {member,manager,canWrite:canWrite(member),branch:workplace.name};
}
async function load(id:string){return env.DB.prepare('SELECT * FROM stock_take_sessions WHERE id=?').bind(id).first<Session>();}
const audit=(session:string,event:string,email:string,note='',product:number|null=null,location='',qty:number|null=null)=>env.DB.prepare('INSERT INTO stock_take_audit(session_id,event_type,actor_email,product_id,location_name,qty_milli,note,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(session,event,email,product,location,qty,note,stamp());
async function listLines(id:string,blind:boolean){
 const rows=await env.DB.prepare(`SELECT l.product_id,l.code,l.name,l.category,l.expected_milli,
 (SELECT sum(qty_milli) FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id) AS first_milli,
 (SELECT min(counted_by) FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id) AS first_counter,
 (SELECT count(*) FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id) AS location_count,
 (SELECT qty_milli FROM stock_take_recounts r WHERE r.session_id=l.session_id AND r.product_id=l.product_id) AS recount_milli,
 (SELECT recounted_by FROM stock_take_recounts r WHERE r.session_id=l.session_id AND r.product_id=l.product_id) AS recount_counter
 FROM stock_take_lines l WHERE l.session_id=? ORDER BY l.category,l.name LIMIT 2000`).bind(id).all<Line>();
 return rows.results.map(l=>blind?{product_id:l.product_id,code:l.code,name:l.name,category:l.category,counted:l.first_milli!==null}:l);
}
async function isAssigned(id:string,email:string){const r=await env.DB.prepare('SELECT 1 AS ok FROM stock_take_assignments WHERE session_id=? AND lower(email)=lower(?)').bind(id,email).first<{ok:number}>();return Boolean(r);}
async function getSession(req:Request,id:string){
 const s=await load(id);if(!s)return {error:fail('Stock take not found.',404)};
 const ctx=await context(s.branch_name,id);if(!ctx)return {error:fail('Branch access required.',403)};
 const assigned=await isAssigned(s.id,ctx.member.email);if(!ctx.manager&&!assigned)return {error:fail('You are not assigned to this stock take.',403)};
 return {s,ctx,assigned};
}
export async function GET(req:Request){
 try{
  const q=new URL(req.url).searchParams,id=clean(q.get('id'),64),branch=clean(q.get('branch'));
  if(id){const check=await getSession(req,id);if(check.error)return check.error;const {s,ctx}=check as {s:Session;ctx:NonNullable<Awaited<ReturnType<typeof context>>>};
   const blind=!ctx.manager;const lines=await listLines(id,blind);
   const assignments=ctx.manager?(await env.DB.prepare('SELECT email FROM stock_take_assignments WHERE session_id=? ORDER BY email').bind(id).all<{email:string}>()).results:[];
   const auditRows=ctx.manager?(await env.DB.prepare('SELECT event_type,actor_email,product_id,location_name,qty_milli,note,created_at FROM stock_take_audit WHERE session_id=? ORDER BY id DESC LIMIT 200').bind(id).all()).results:[];
   return out({session:s,manager:ctx.manager,assigned:true,lines,assignments,audit:auditRows});
  }
  const member=await getHubMember({allowBuyerAccess:true,allowStockOrdersAccess:true});if(!member)return fail('Staff login required.',403);
  if(!branch)return out({sessions:[],notice:'Select an authorised branch.'});
  const ctx=await context(branch);if(!ctx)return fail('Branch access required.',403);
  const sql=ctx.manager?'SELECT * FROM stock_take_sessions WHERE branch_name=? ORDER BY created_at DESC LIMIT 100':`SELECT s.* FROM stock_take_sessions s JOIN stock_take_assignments a ON a.session_id=s.id WHERE s.branch_name=? AND lower(a.email)=lower(?) ORDER BY s.created_at DESC LIMIT 100`;
  const sessions=await (ctx.manager?env.DB.prepare(sql).bind(ctx.branch):env.DB.prepare(sql).bind(ctx.branch,member.email)).all<Session>();
  return out({sessions:sessions.results,manager:ctx.manager});
 }catch{return fail('Stock take data unavailable. Confirm migration 0071 is applied.',503);}
}
export async function POST(req:Request){
 try{
  if(!req.headers.get('content-type')?.includes('application/json'))return fail('JSON request required.',415);
  const origin=req.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(req.url).origin)return fail('Untrusted origin.',403);
  const raw=await req.text();if(raw.length>20000)return fail('Request too large.',413);
  const body=JSON.parse(raw) as Record<string,unknown>;const action=clean(body.action,30);
  if(action==='create'){
   const branch=clean(body.branch),ctx=await context(branch);if(!ctx?.manager||!ctx.canWrite)return fail('Stock manager permission required.',403);
   const dep=clean(body.department),zone=clean(body.zone,90)||'Entire branch',type=body.count_type==='Cycle'?'Cycle':'Full';
   const id=crypto.randomUUID(),now=stamp(),reference='STK-'+now.slice(0,10).replaceAll('-','')+'-'+id.slice(0,8).toUpperCase();
   const selected=Array.isArray(body.product_ids)?[...new Set(body.product_ids.map(Number))].filter(n=>Number.isSafeInteger(n)&&n>0):[];
   if(!selected.length||selected.length>150)return fail('Choose 1–150 catalogue products per stock take session.');
   const placeholders=selected.map(()=>'?').join(',');const products=await env.DB.prepare(`SELECT id,code,name,category FROM catalogue_products WHERE active=1 AND id IN (${placeholders})`).bind(...selected).all<{id:number;code:string;name:string;category:string}>();
   if(products.results.length!==selected.length)return fail('Some catalogue items are unavailable.',409);
   const balances=await env.DB.prepare(`SELECT catalogue_product_id,qty_milli FROM stock_inventory_balances WHERE branch_name=? AND catalogue_product_id IN (${placeholders})`).bind(ctx.branch,...selected).all<{catalogue_product_id:number;qty_milli:number}>();
   const expected=new Map(balances.results.map(r=>[r.catalogue_product_id,r.qty_milli]));
   const statements=[env.DB.prepare('INSERT INTO stock_take_sessions(id,reference,branch_name,department,zone,count_type,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,reference,ctx.branch,dep,zone,type,ctx.member.email,now),...products.results.map(p=>env.DB.prepare('INSERT INTO stock_take_lines(session_id,product_id,code,name,category,expected_milli) VALUES(?,?,?,?,?,?)').bind(id,p.id,p.code,p.name,p.category,expected.get(p.id)??null)),audit(id,'CREATED',ctx.member.email,`${type} · ${zone} · ${products.results.length} SKUs`)];
   await env.DB.batch(statements);return out({ok:true,id,reference},201);
  }
  const id=clean(body.id,64);if(!/^[a-f0-9-]{36}$/i.test(id))return fail('Valid session ID required.');
  const check=await getSession(req,id);if(check.error)return check.error;const {s,ctx}=check as {s:Session;ctx:NonNullable<Awaited<ReturnType<typeof context>>>};
  if(!ctx.canWrite)return fail('Read-only staff cannot update counts.',403);
  if(action==='assign'){
   if(!ctx.manager||s.status!=='Draft')return fail('Assignments are only editable by a manager before counting.',409);
   const email=clean(body.email).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail('Enter an employee email.');
   const employee=await env.DB.prepare('SELECT email FROM team_members WHERE lower(email)=? AND active=1').bind(email).first<{email:string}>();if(!employee)return fail('Employee is not an active Hub member.',404);
   const access=await env.DB.prepare('SELECT workspace_access,access_scope,role FROM team_members WHERE lower(email)=? AND active=1').bind(email).first<{workspace_access:string;access_scope:string;role:string}>();
   if(access&&!['Owner / Admin','Developer / Technical Admin'].includes(access.role)){let assigned:string[]=[];try{assigned=JSON.parse(access.workspace_access||'[]');}catch{}if(access.access_scope!=='Full company'&&!assigned.some(x=>x.toLowerCase()===s.branch_name.toLowerCase()))return fail('Employee must have access to this branch.',403);}
   await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO stock_take_assignments(session_id,email,assigned_by,assigned_at) VALUES(?,?,?,?)').bind(id,email,ctx.member.email,stamp()),audit(id,'ASSIGNED',ctx.member.email,email)]);return out({ok:true});
  }
  if(action==='start'){
   if(!ctx.manager||s.status!=='Draft')return fail('Only the manager can start a draft session.',409);
   const n=await env.DB.prepare('SELECT count(*) AS n FROM stock_take_assignments WHERE session_id=?').bind(id).first<{n:number}>();if(!n?.n)return fail('Assign at least one staff counter first.');
   await env.DB.batch([env.DB.prepare("UPDATE stock_take_sessions SET status='Counting',started_at=?,version=version+1 WHERE id=? AND status='Draft'").bind(stamp(),id),audit(id,'STARTED',ctx.member.email)]);return out({ok:true});
  }
  if(action==='count'){
   if(s.status!=='Counting')return fail('Counting session is not open.',409);
   if(!await isAssigned(id,ctx.member.email))return fail('You must be assigned as a counter.',403);
   const product=Number(body.product_id),qty=milli(body.quantity),location=clean(body.location,70);
   if(!location)return fail('Enter the exact aisle, shelf, yard or warehouse location.');
   const found=await env.DB.prepare('SELECT 1 AS ok FROM stock_take_lines WHERE session_id=? AND product_id=?').bind(id,product).first<{ok:number}>();if(!found)return fail('Product is not on this stock take.',404);
   const existing=await env.DB.prepare('SELECT counted_by FROM stock_take_counts WHERE session_id=? AND product_id=? AND location_name=?').bind(id,product,location).first<{counted_by:string}>();
   if(existing&&existing.counted_by.toLowerCase()!==ctx.member.email.toLowerCase())return fail('Already counted by another employee; ask the supervisor to review.',409);
   await env.DB.batch([env.DB.prepare('INSERT INTO stock_take_counts(session_id,product_id,location_name,qty_milli,counted_by,counted_at) VALUES(?,?,?,?,?,?) ON CONFLICT(session_id,product_id,location_name) DO UPDATE SET qty_milli=excluded.qty_milli,counted_at=excluded.counted_at WHERE lower(counted_by)=lower(excluded.counted_by)').bind(id,product,location,qty,ctx.member.email,stamp()),audit(id,existing?'COUNT_UPDATED':'COUNTED',ctx.member.email,'Physical count submitted',product,location,qty)]);return out({ok:true});
  }
  if(action==='submit'){
   if(!ctx.manager||s.status!=='Counting')return fail('Only the manager can submit a completed count for review.',409);
   const missing=await env.DB.prepare('SELECT count(*) AS n FROM stock_take_lines l WHERE l.session_id=? AND NOT EXISTS(SELECT 1 FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id)').bind(id).first<{n:number}>();
   if(missing?.n)return fail(`${missing.n} items have not been counted. Enter an explicit zero if the product is physically absent.`,409);
   await env.DB.batch([env.DB.prepare("UPDATE stock_take_sessions SET status='Review',submitted_by=?,submitted_at=?,version=version+1 WHERE id=? AND status='Counting'").bind(ctx.member.email,stamp(),id),audit(id,'REVIEW',ctx.member.email)]);return out({ok:true});
  }
  if(action==='reopen'){
   if(!ctx.manager||s.status!=='Review')return fail('Only manager may reopen review.',409);
   await env.DB.batch([env.DB.prepare("UPDATE stock_take_sessions SET status='Counting',version=version+1 WHERE id=? AND status='Review'").bind(id),audit(id,'REOPENED',ctx.member.email,clean(body.note,300))]);return out({ok:true});
  }
  if(action==='recount'){
   if(s.status!=='Review'||!await isAssigned(id,ctx.member.email))return fail('Recount requires a separate assigned counter during review.',403);
   const product=Number(body.product_id),qty=milli(body.quantity),reason=clean(body.reason,250);if(reason.length<5)return fail('Explain the recount result (at least 5 characters).');
   const line=await env.DB.prepare(`SELECT l.expected_milli, (SELECT sum(qty_milli) FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id) first_milli
     FROM stock_take_lines l WHERE l.session_id=? AND l.product_id=?`).bind(id,product).first<{expected_milli:number|null;first_milli:number|null}>();
   if(!line||line.first_milli===null)return fail('No original count exists for this product.',404);
   const original=await env.DB.prepare('SELECT counted_by FROM stock_take_counts WHERE session_id=? AND product_id=? AND lower(counted_by)=lower(?) LIMIT 1').bind(id,product,ctx.member.email).first();if(original)return fail('Recount must be performed by someone other than the original counter.',403);
   if(line.expected_milli===line.first_milli)return fail('This item has no variance to recount.');
   const prior=await env.DB.prepare('SELECT recounted_by FROM stock_take_recounts WHERE session_id=? AND product_id=?').bind(id,product).first<{recounted_by:string}>();if(prior)return fail('Recount already submitted. Manager must investigate a correction.',409);
   await env.DB.batch([env.DB.prepare('INSERT INTO stock_take_recounts(session_id,product_id,qty_milli,recounted_by,recounted_at,reason) VALUES(?,?,?,?,?,?)').bind(id,product,qty,ctx.member.email,stamp(),reason),audit(id,'RECOUNTED',ctx.member.email,reason,product,'',qty)]);return out({ok:true});
  }
  if(action==='approve'){
   if(!ctx.manager||s.status!=='Review')return fail('Manager approval required for a submitted session.',403);
   if(ctx.member.email.toLowerCase()===s.created_by.toLowerCase())return fail('Another authorised manager must approve the session.',403);
   const missing=await env.DB.prepare(`SELECT count(*) AS n FROM stock_take_lines l WHERE l.session_id=? AND (
      NOT EXISTS(SELECT 1 FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id)
      OR (l.expected_milli IS NOT NULL AND l.expected_milli<>(SELECT sum(qty_milli) FROM stock_take_counts c WHERE c.session_id=l.session_id AND c.product_id=l.product_id) AND NOT EXISTS(SELECT 1 FROM stock_take_recounts r WHERE r.session_id=l.session_id AND r.product_id=l.product_id)))`).bind(id).first<{n:number}>();
   if(missing?.n)return fail(`${missing.n} products are uncounted or still require independent recount.`,409);
   const note=clean(body.note,500);if(note.length<8)return fail('Enter an approval/reconciliation note of at least 8 characters.');
   const pending=await env.DB.prepare('SELECT count(*) AS n FROM stock_take_lines WHERE session_id=? AND expected_milli IS NULL').bind(id).first<{n:number}>();
   if(pending?.n)return fail(`${pending.n} items have no verified ledger snapshot; reconcile these before approving.`,409);
   await env.DB.batch([env.DB.prepare("UPDATE stock_take_sessions SET status='Approved',approved_by=?,approved_at=?,decision_note=?,version=version+1 WHERE id=? AND status='Review'").bind(ctx.member.email,stamp(),note,id),audit(id,'APPROVED',ctx.member.email,note)]);return out({ok:true,notice:'Count approved as a reconciliation record. No POS or Hub stock balances were changed.'});
  }
  return fail('Unknown stock take action.');
 }catch(e){const message=e instanceof Error?e.message:'';if(/Quantity|Recount|count|product|session|required|branch|Invalid/i.test(message))return fail(message);return fail('Stock take request failed. Confirm migration 0071, stock permissions and inventory availability.',503);}
}
