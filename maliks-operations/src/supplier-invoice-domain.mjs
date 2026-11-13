// Phase 18: supplier invoice matching and independent verification. NO financial posting.
import {matchingBranch} from './policy.mjs';
const CAPTURE=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Finance Manager','Creditors Clerk']);
const VERIFY=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Finance Manager']);
const READ=new Set([...CAPTURE,'Store Manager','Regional Manager','Purchasing Manager','Buyer','Executive / EXCO']);
export function canUseSupplierInvoice(member,mode='read'){
 if(!member||Number(member.active)!==1)return false;
 if(mode==='capture')return CAPTURE.has(member.role);
 if(mode==='verify')return VERIFY.has(member.role);
 return READ.has(member.role)&&(member.role!=='Executive / EXCO'||member.access_scope==='Full company');
}
const ok=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>ok({error:message},status);
const int=(v,name,min=1,max=2_000_000_000)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('Invalid '+name+'.');return v;};
const str=(v,name,max,required=false)=>{if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim())||/[\u0000-\u001f\u007f]/.test(v))throw Error('Invalid '+name+'.');return v.trim();};
const uuid=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v))throw Error('Invalid request ID.');return v.toLowerCase();};
const date=v=>{const d=str(v,'invoice date',10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('Invalid invoice date.');return d;};
const sha=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj)))),b=>b.toString(16).padStart(2,'0')).join('');
const read=async req=>{const raw=await req.text();if(raw.length>20000)throw Error('Request too large.');try{return JSON.parse(raw);}catch{throw Error('Invalid JSON.');}};
const originOK=req=>Boolean(req.headers.get('origin'))&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const memberEmail=c=>c.member.email.toLowerCase();
const authorised=(c,mode)=>c.app==='management'&&canUseSupplierInvoice(c.member,mode);
export function validateSupplierInvoice(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid supplier invoice.');
 const branch=str(raw.branch,'branch',150,true),po_id=int(raw.po_id,'purchase order'),invoice_number=str(raw.invoice_number,'invoice number',90,true),invoice_date=date(raw.invoice_date),request_id=uuid(raw.request_id);
 const declared_vat_cents=int(raw.declared_vat_cents,'declared VAT',0,3_000_000_000_000);
 if(!Array.isArray(raw.lines)||raw.lines.length<1||raw.lines.length>30)throw Error('Invoice requires 1–30 lines.');
 const seen=new Set();const lines=raw.lines.map(line=>{const stock_id=int(line?.stock_id,'stock ID'),qty_milli=int(line?.qty_milli,'quantity',1,1_000_000_000),unit_cost_cents=int(line?.unit_cost_cents,'unit cost',1,100_000_000_000);
   if(seen.has(stock_id))throw Error('Duplicate invoice stock line.');seen.add(stock_id);
   const amount_cents=Math.round(qty_milli*unit_cost_cents/1000);
   if(!Number.isSafeInteger(amount_cents)||amount_cents<=0)throw Error('Invalid invoice line amount.');
   return {stock_id,qty_milli,unit_cost_cents,amount_cents};});
 const net_cents=lines.reduce((n,l)=>n+l.amount_cents,0);
 if(!Number.isSafeInteger(net_cents)||net_cents>3_000_000_000_000)throw Error('Invoice total too large.');
 const gross_cents=net_cents+declared_vat_cents;
 if(!Number.isSafeInteger(raw.invoice_total_cents)||raw.invoice_total_cents!==gross_cents)throw Error('Supplier invoice total must equal line net amount plus declared VAT.');
 if(!Number.isSafeInteger(gross_cents)||gross_cents>3_000_000_000_000)throw Error('Invoice total too large.');
 if(declared_vat_cents>Math.ceil(net_cents*0.15))throw Error('Declared VAT exceeds the 15% standard-rate ceiling.');
 return {branch,po_id,invoice_number,invoice_date,declared_vat_cents,net_cents,gross_cents,lines,request_id};
}
const view=r=>({...r,lines:JSON.parse(r.lines_json),exceptions:JSON.parse(r.exceptions_json),
  lines_json:undefined,exceptions_json:undefined,number:'SIN-'+String(r.id).padStart(6,'0'),
  ap_posted:false,vat_claimed:false,gl_posted:false});
async function checkMatch(db,po,lines){
 const ordered=new Map(JSON.parse(po.lines_json).map(l=>[l.stock_id,l]));
 const issues=[];
 for(const l of lines){
  const p=ordered.get(l.stock_id);
  if(!p){issues.push('Stock ID '+l.stock_id+' is not on the approved PO.');continue;}
  if(l.unit_cost_cents!==p.unit_cost_cents)issues.push(p.stock_code+': invoice unit cost differs from approved PO.');
  const posted=await db.prepare(`SELECT COALESCE(SUM(rl.accepted_milli),0) AS qty FROM maliks_pos_receipt_lines rl
    JOIN maliks_pos_receipts r ON r.id=rl.receipt_id
    WHERE r.po_id=? AND r.status='POSTED' AND rl.stock_master_id=?`).bind(po.id,l.stock_id).first();
  const allocated=await db.prepare(`SELECT COALESCE(SUM(a.qty_milli),0) AS qty FROM maliks_pos_supplier_invoice_allocations a
    JOIN maliks_pos_supplier_invoices i ON i.id=a.invoice_id
    WHERE i.po_id=? AND a.stock_master_id=?`).bind(po.id,l.stock_id).first();
  if(l.qty_milli>Number(posted?.qty||0)-Number(allocated?.qty||0))issues.push(p.stock_code+': invoiced quantity exceeds posted, unallocated GRV quantity.');
 }
 return issues;
}
export async function listSupplierInvoices(req,env,c){
 if(!authorised(c,'read'))return fail('Supplier invoice access denied.',403);
 const branch=matchingBranch(c.branches,new URL(req.url).searchParams.get('branch'));if(!branch)return fail('Branch access denied.',403);
 const {results}=await env.DB.prepare(`SELECT * FROM maliks_pos_supplier_invoices WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 100`).bind(branch).all();
 return ok({branch,invoices:results.map(view),accounting_posted:false});
}
export async function captureSupplierInvoice(req,env,c){
 if(!authorised(c,'capture'))return fail('Supplier invoice capture permission denied.',403);
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=validateSupplierInvoice(await read(req));}catch(e){return fail(e.message);}
 const branch=matchingBranch(c.branches,v.branch);if(!branch)return fail('Branch access denied.',403);v.branch=branch;
 const actor=memberEmail(c),hash=await sha(v),now=new Date().toISOString();
 const existing=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoices WHERE create_request_id=?').bind(v.request_id).first();
 if(existing)return existing.create_payload_hash===hash&&existing.captured_by_email===actor?ok({invoice:view(existing),duplicate:true}):fail('Request ID already used.',409);
 const po=await env.DB.prepare(`SELECT * FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?) AND status='APPROVED'`).bind(v.po_id,branch).first();
 if(!po)return fail('Approved purchase order not found.',409);
 const supplier=await env.DB.prepare(`SELECT id,code,name FROM maliks_pos_master_records WHERE id=? AND kind='supplier' AND lower(branch)=lower(?)`).bind(po.supplier_master_id,branch).first();
 if(!supplier)return fail('Supplier master record not found.',409);
 const exceptions=await checkMatch(env.DB,po,v.lines),status=exceptions.length?'EXCEPTION':'MATCHED';
 try{await env.DB.batch([
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_supplier_invoices
   (branch,po_id,supplier_master_id,supplier_code,supplier_name,invoice_number,invoice_date,lines_json,net_cents,declared_vat_cents,gross_cents,status,exceptions_json,version,captured_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?)`)
   .bind(branch,po.id,supplier.id,supplier.code,supplier.name,v.invoice_number,v.invoice_date,JSON.stringify(v.lines),v.net_cents,v.declared_vat_cents,v.gross_cents,status,JSON.stringify(exceptions),actor,now,now,v.request_id,hash,v.request_id),
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_supplier_invoice_audit
   (request_id,invoice_id,branch,action,actor_email,payload_hash,before_json,after_json,created_at)
   SELECT ?,id,branch,'CAPTURE',?,?,NULL,?,? FROM maliks_pos_supplier_invoices
   WHERE create_request_id=? AND create_payload_hash=? AND captured_by_email=?`)
   .bind(v.request_id,actor,hash,JSON.stringify({branch,po_id:v.po_id,invoice_number:v.invoice_number,status,exceptions,lines:v.lines}),now,v.request_id,hash,actor)
 ]);}catch(e){return fail(/UNIQUE/.test(String(e))?'Supplier invoice number already exists for this supplier and branch.':'Supplier invoice could not be saved: '+String(e.message||e).slice(0,100),409);}
 const saved=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoices WHERE create_request_id=?').bind(v.request_id).first();
 if(!saved||saved.create_payload_hash!==hash||saved.captured_by_email!==actor)return fail('Invoice number already exists or request changed.',409);
 return ok({invoice:view(saved)});
}
export async function supplierInvoiceAction(req,env,c){
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=await read(req);v={id:int(v.id,'invoice ID'),version:int(v.version,'version'),branch:str(v.branch,'branch',150,true),action:str(v.action,'action',12,true).toUpperCase(),request_id:uuid(v.request_id)};
   if(!['RECHECK','VERIFY','CANCEL'].includes(v.action))throw Error('Invalid action.');}catch(e){return fail(e.message);}
 const mode=v.action==='VERIFY'?'verify':'capture';if(!authorised(c,mode))return fail('Supplier invoice permission denied.',403);
 const branch=matchingBranch(c.branches,v.branch);if(!branch)return fail('Branch access denied.',403);v.branch=branch;
 const actor=memberEmail(c),hash=await sha(v),now=new Date().toISOString();
 const previous=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoice_audit WHERE request_id=?').bind(v.request_id).first();
 if(previous){if(previous.actor_email!==actor||previous.payload_hash!==hash)return fail('Request ID already used.',409);
  const saved=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoices WHERE id=?').bind(previous.invoice_id).first();return ok({invoice:view(saved),duplicate:true});}
 const prior=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoices WHERE id=? AND lower(branch)=lower(?)').bind(v.id,branch).first();
 if(!prior)return fail('Supplier invoice not found.',404);
 if(prior.version!==v.version)return fail('Invoice changed. Refresh.',409);
 if(prior.status==='VERIFIED'||prior.status==='CANCELLED')return fail('Verified/cancelled invoice cannot be changed.',409);
 if(v.action==='VERIFY'&&actor===prior.captured_by_email.toLowerCase())return fail('Independent Finance reviewer required.',403);
 if(v.action==='VERIFY'&&prior.status!=='MATCHED')return fail('Resolve the three-way-match exceptions first.',409);
 const po=await env.DB.prepare(`SELECT * FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?) AND status='APPROVED'`).bind(prior.po_id,branch).first();
 if(!po)return fail('Approved purchase order missing.',409);
 const issues=v.action==='CANCEL'?JSON.parse(prior.exceptions_json):await checkMatch(env.DB,po,JSON.parse(prior.lines_json));
 if(v.action==='VERIFY'&&issues.length)return fail('Three-way match no longer passes: '+issues.join(' '),409);
 const status=v.action==='CANCEL'?'CANCELLED':v.action==='VERIFY'?'VERIFIED':issues.length?'EXCEPTION':'MATCHED';
 const after={...view(prior),status,version:prior.version+1,exceptions:issues};
 const steps=[env.DB.prepare(`UPDATE maliks_pos_supplier_invoices SET status=?,exceptions_json=?,version=version+1,updated_at=?,last_request_id=?,
  verified_by_email=CASE WHEN ?='VERIFY' THEN ? ELSE verified_by_email END,
  cancelled_by_email=CASE WHEN ?='CANCEL' THEN ? ELSE cancelled_by_email END
  WHERE id=? AND lower(branch)=lower(?) AND status=? AND version=? AND NOT EXISTS(SELECT 1 FROM maliks_pos_supplier_invoice_audit WHERE request_id=?)`)
  .bind(status,JSON.stringify(issues),now,v.request_id,v.action,actor,v.action,actor,v.id,branch,prior.status,v.version,v.request_id)];
 if(v.action==='VERIFY')for(const line of JSON.parse(prior.lines_json))steps.push(env.DB.prepare(`INSERT INTO maliks_pos_supplier_invoice_allocations(invoice_id,stock_master_id,qty_milli)
  SELECT id,?,? FROM maliks_pos_supplier_invoices WHERE id=? AND status='VERIFIED' AND version=? AND last_request_id=?`)
  .bind(line.stock_id,line.qty_milli,v.id,v.version+1,v.request_id));
 steps.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_supplier_invoice_audit
  (request_id,invoice_id,branch,action,actor_email,payload_hash,before_json,after_json,created_at)
  SELECT ?,id,branch,?,?,?,?,?,? FROM maliks_pos_supplier_invoices
  WHERE id=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
  .bind(v.request_id,v.action,actor,hash,JSON.stringify(view(prior)),JSON.stringify(after),now,v.id,branch,v.version+1,v.request_id));
 let outcomes;try{outcomes=await env.DB.batch(steps);}catch(e){return fail('Three-way verification failed; no allocation was posted: '+String(e.message||e).slice(0,130),409);}
 if(Number(outcomes?.[0]?.meta?.changes)!==1)return fail('Invoice changed. Refresh.',409);
 const saved=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_invoices WHERE id=?').bind(v.id).first();
 return ok({invoice:view(saved)});
}
