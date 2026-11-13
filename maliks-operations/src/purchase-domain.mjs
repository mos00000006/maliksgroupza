// Phase 16: branch-scoped purchase order draft, submission and independent approval.
// Approved POs are authorisations, NOT goods receipts or financial postings.
import {matchingBranch,limitSearch} from './policy.mjs';

const CREATE_ROLES=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager','Purchasing Manager','Buyer']);
const APPROVE_ROLES=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager','Purchasing Manager']);
const READ_ROLES=new Set([...CREATE_ROLES,'Finance Manager','Creditors Clerk','Stock Controller','Warehouse Manager','Warehouse Management','Receiving Clerk','Receiving Manager','Receiving Supervisor','Receiving','GRV Clerk','Executive / EXCO']);
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const ok=(data,status=200)=>Response.json(data,{status,headers});
const error=(message,status=400)=>ok({error:message},status);
export const canUsePurchase=(member,permission='read')=>{
  if(!member||Number(member.active)!==1)return false;
  if(permission==='approve')return APPROVE_ROLES.has(member.role);
  if(permission==='write')return CREATE_ROLES.has(member.role);
  return READ_ROLES.has(member.role) && (member.role!=='Executive / EXCO'||member.access_scope==='Full company');
};
const integer=(value,name,min,max)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)throw Error('Invalid '+name+'.');
  return value;
};
const text=(value,name,max,required=false)=>{
  if(typeof value!=='string')throw Error('Invalid '+name+'.');
  const v=value.trim();if(v.length>max||(required&&!v)||/[\u0000-\u001f\u007f]/.test(v))throw Error('Invalid '+name+'.');return v;
};
const requestId=value=>{
  if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))throw Error('Invalid request ID.');
  return value.toLowerCase();
};
const date=value=>{
  const s=text(value,'expected delivery date',10);
  if(s&&(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s).toISOString().slice(0,10)!==s))throw Error('Invalid expected delivery date.');
  return s;
};
export function validatePurchaseDraft(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid purchase order.');
  const branch=text(raw.branch,'branch',150,true);
  const supplier_master_id=integer(raw.supplier_master_id,'supplier',1,2_000_000_000);
  const notes=text(raw.notes,'notes',400);
  const expected_date=date(raw.expected_date);
  const id=requestId(raw.request_id);
  if(!Array.isArray(raw.lines)||!raw.lines.length||raw.lines.length>30)throw Error('Purchase order requires 1–30 stock lines.');
  const seen=new Set();
  const lines=raw.lines.map(line=>{
    if(!line||typeof line!=='object'||Array.isArray(line))throw Error('Invalid purchase order line.');
    const stock_id=integer(line.stock_id,'stock ID',1,2_000_000_000);
    const quantity_milli=integer(line.quantity_milli,'quantity',1,1_000_000);
    const unit_cost_cents=integer(line.unit_cost_cents,'unit cost',1,100_000_000);
    if(seen.has(stock_id))throw Error('Duplicate stock item. Combine the quantities.');seen.add(stock_id);
    return {stock_id,quantity_milli,unit_cost_cents};
  });
  const result={branch,supplier_master_id,notes,expected_date,request_id:id,lines};
  if(raw.id!==undefined){result.id=integer(raw.id,'PO ID',1,2_000_000_000);result.version=integer(raw.version,'version',1,2_000_000_000);}
  return result;
}
export function validatePurchaseAction(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid purchase order action.');
  const action=text(raw.action,'action',12,true).toUpperCase();
  if(!['SUBMIT','APPROVE','REJECT','CANCEL'].includes(action))throw Error('Invalid purchase order action.');
  const note=text(raw.note,'action note',400);
  if(['REJECT','CANCEL'].includes(action)&&!note)throw Error('A reason is required.');
  return {id:integer(raw.id,'PO ID',1,2_000_000_000),version:integer(raw.version,'version',1,2_000_000_000),
    branch:text(raw.branch,'branch',150,true),request_id:requestId(raw.request_id),action,note};
}
const asPO=row=>({id:row.id,number:'PO-'+String(row.id).padStart(6,'0'),branch:row.branch,
  supplier_master_id:row.supplier_master_id,supplier_code:row.supplier_code,supplier_name:row.supplier_name,
  lines:JSON.parse(row.lines_json),total_cents:row.total_cents,notes:row.notes,expected_date:row.expected_date,
  status:row.status,version:row.version,created_by_email:row.created_by_email,created_by_name:row.created_by_name,
  submitted_by_email:row.submitted_by_email,approved_by_email:row.approved_by_email,rejected_by_email:row.rejected_by_email,
  cancelled_by_email:row.cancelled_by_email,created_at:row.created_at,updated_at:row.updated_at});
const hash=async data=>{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
};
const actorOf=context=>context.member.email.toLowerCase();
const branchOf=(context,requested)=>matchingBranch(context.branches,requested);
const authorised=(context,permission)=>context.app==='management'&&canUsePurchase(context.member,permission);
const originOK=req=>Boolean(req.headers.get('origin'))&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const parse=async req=>{
  const raw=await req.text();if(raw.length>20000)throw Error('Purchase order request too large.');
  try{return JSON.parse(raw);}catch{throw Error('Invalid JSON request.');}
};
const replay=async(db,id,actor,payloadHash)=>{
  const a=await db.prepare('SELECT * FROM maliks_pos_po_audit WHERE request_id=?').bind(id).first();
  if(!a)return null;
  if(a.actor_email!==actor||a.payload_hash!==payloadHash)return {conflict:true};
  const current=await db.prepare('SELECT * FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?)').bind(a.po_id,a.branch).first();
  return {po:current?asPO(current):JSON.parse(a.after_json),duplicate:true};
};
async function resolveLines(db,branch,input){
  const supplier=await db.prepare(`SELECT id,code,name FROM maliks_pos_master_records
    WHERE id=? AND kind='supplier' AND lower(branch)=lower(?) AND active=1`).bind(input.supplier_master_id,branch).first();
  if(!supplier)throw Error('Active supplier not found for this branch.');
  const ids=input.lines.map(l=>l.stock_id);
  const marks=ids.map(()=>'?').join(',');
  const {results}=await db.prepare(`SELECT id,code,name,details_json FROM maliks_pos_master_records
    WHERE kind='stock' AND lower(branch)=lower(?) AND active=1 AND id IN (${marks})`).bind(branch,...ids).all();
  if(results.length!==ids.length)throw Error('Every line must reference an active branch stock master item.');
  const lookup=new Map(results.map(row=>[row.id,row]));
  let total=0;
  const lines=input.lines.map(line=>{
    const stock=lookup.get(line.stock_id);const unit=JSON.parse(stock.details_json).unit||'each';
    const amount_cents=Math.round(line.quantity_milli*line.unit_cost_cents/1000);
    total+=amount_cents;
    if(!Number.isSafeInteger(total)||total>3_000_000_000_000)throw Error('Purchase order total is too large.');
    return {...line,stock_code:stock.code,stock_name:stock.name,unit,amount_cents};
  });
  return {supplier,lines,total_cents:total};
}
export async function listPurchaseOrders(req,env,context){
  if(!authorised(context,'read'))return error('Purchasing access denied.',403);
  const params=new URL(req.url).searchParams;const branch=branchOf(context,params.get('branch'));
  if(!branch)return error('Branch access denied.',403);
  const q=limitSearch(params.get('q')||'');if(q===null)return error('Search too long.');
  const term=q.toLowerCase();
  const {results}=await env.DB.prepare(`SELECT * FROM maliks_pos_purchase_orders
    WHERE lower(branch)=lower(?) AND (?='' OR instr(lower(supplier_code),?)>0 OR instr(lower(supplier_name),?)>0 OR CAST(id AS TEXT)=?)
    ORDER BY id DESC LIMIT 100`).bind(branch,term,term,term,term.replace(/^PO-0*/i,'')).all();
  return ok({branch,orders:results.map(asPO)});
}
export async function purchaseAudit(req,env,context){
  if(!authorised(context,'read'))return error('Purchasing access denied.',403);
  const params=new URL(req.url).searchParams;const branch=branchOf(context,params.get('branch'));
  if(!branch)return error('Branch access denied.',403);
  let poId;try{poId=integer(Number(params.get('id')),'PO ID',1,2_000_000_000);}catch(e){return error(e.message);}
  const row=await env.DB.prepare('SELECT id FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?)').bind(poId,branch).first();
  if(!row)return error('Purchase order not found.',404);
  const {results}=await env.DB.prepare(`SELECT action,actor_email,actor_name,note,created_at,before_json,after_json
    FROM maliks_pos_po_audit WHERE po_id=? AND lower(branch)=lower(?) ORDER BY id DESC LIMIT 60`).bind(poId,branch).all();
  return ok({branch,po_id:poId,audit:results.map(r=>({action:r.action,actor_email:r.actor_email,actor_name:r.actor_name,
    note:r.note,created_at:r.created_at,before:r.before_json?JSON.parse(r.before_json):null,after:JSON.parse(r.after_json)}))});
}
export async function savePurchaseOrder(req,env,context){
  if(!authorised(context,'write'))return error('Purchase order write permission denied.',403);
  if(!originOK(req))return error('Invalid request origin.',403);
  let input;try{input=validatePurchaseDraft(await parse(req));}catch(e){return error(e.message);}
  const branch=branchOf(context,input.branch);if(!branch)return error('Branch access denied.',403);
  input.branch=branch;
  const actor=actorOf(context),now=new Date().toISOString();
  const payloadHash=await hash({op:input.id?'SAVE':'CREATE',...input});
  const previousReplay=await replay(env.DB,input.request_id,actor,payloadHash);
  if(previousReplay)return previousReplay.conflict?error('Request ID already used.',409):ok(previousReplay);
  let refs;try{refs=await resolveLines(env.DB,branch,input);}catch(e){return error(e.message,409);}
  if(!refs.total_cents)return error('Total must be positive.');
  if(input.id===undefined){
    await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_purchase_orders
        (branch,supplier_master_id,supplier_code,supplier_name,lines_json,total_cents,notes,expected_date,status,version,
        created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
        VALUES (?,?,?,?,?,?,?,?,'DRAFT',1,?,?,?,?,?,?,?)`)
        .bind(branch,refs.supplier.id,refs.supplier.code,refs.supplier.name,JSON.stringify(refs.lines),refs.total_cents,input.notes,input.expected_date,
          actor,context.member.name,now,now,input.request_id,payloadHash,input.request_id),
      env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_po_audit
        (request_id,po_id,branch,action,actor_email,actor_name,payload_hash,before_json,after_json,note,created_at)
        SELECT ?,id,branch,'CREATE',?,?,?,?,?, '',? FROM maliks_pos_purchase_orders
        WHERE create_request_id=? AND created_by_email=?`)
        .bind(input.request_id,actor,context.member.name,payloadHash,null,
          JSON.stringify({branch,supplier_master_id:refs.supplier.id,supplier_code:refs.supplier.code,supplier_name:refs.supplier.name,
            lines:refs.lines,total_cents:refs.total_cents,notes:input.notes,expected_date:input.expected_date,status:'DRAFT',version:1,created_by_email:actor}),
          now,input.request_id,actor),
    ]);
    const saved=await env.DB.prepare('SELECT * FROM maliks_pos_purchase_orders WHERE create_request_id=?').bind(input.request_id).first();
    if(!saved)return error('Unable to create purchase order.',409);
    if(saved.create_payload_hash!==payloadHash||saved.created_by_email!==actor)return error('Request ID already used.',409);
    return ok({po:asPO(saved)});
  }
  const prior=await env.DB.prepare('SELECT * FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?)').bind(input.id,branch).first();
  if(!prior)return error('Purchase order not found.',404);
  if(prior.status!=='DRAFT'||prior.version!==input.version)return error('Only a current draft can be edited. Refresh.',409);
  if(prior.created_by_email!==actor&&!canUsePurchase(context.member,'approve'))return error('Only the creator or manager may edit this draft.',403);
  const after={...asPO(prior),supplier_master_id:refs.supplier.id,supplier_code:refs.supplier.code,supplier_name:refs.supplier.name,
    lines:refs.lines,total_cents:refs.total_cents,notes:input.notes,expected_date:input.expected_date,version:prior.version+1,updated_at:now};
  const outcomes=await env.DB.batch([
    env.DB.prepare(`UPDATE maliks_pos_purchase_orders SET supplier_master_id=?,supplier_code=?,supplier_name=?,lines_json=?,total_cents=?,
      notes=?,expected_date=?,version=version+1,updated_at=?,last_request_id=?
      WHERE id=? AND lower(branch)=lower(?) AND status='DRAFT' AND version=?
      AND NOT EXISTS(SELECT 1 FROM maliks_pos_po_audit WHERE request_id=?)`)
      .bind(refs.supplier.id,refs.supplier.code,refs.supplier.name,JSON.stringify(refs.lines),refs.total_cents,input.notes,input.expected_date,now,
        input.request_id,input.id,branch,input.version,input.request_id),
    env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_po_audit
      (request_id,po_id,branch,action,actor_email,actor_name,payload_hash,before_json,after_json,note,created_at)
      SELECT ?,id,branch,'SAVE',?,?,?,?,?,'',? FROM maliks_pos_purchase_orders
      WHERE id=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
      .bind(input.request_id,actor,context.member.name,payloadHash,JSON.stringify(asPO(prior)),JSON.stringify(after),now,
        input.id,branch,input.version+1,input.request_id),
  ]);
  if(Number(outcomes?.[0]?.meta?.changes)!==1)return error('Purchase order changed. Refresh before saving.',409);
  return ok({po:after});
}
export async function actionPurchaseOrder(req,env,context){
  if(!authorised(context,'write'))return error('Purchase order permission denied.',403);
  if(!originOK(req))return error('Invalid request origin.',403);
  let input;try{input=validatePurchaseAction(await parse(req));}catch(e){return error(e.message);}
  const branch=branchOf(context,input.branch);if(!branch)return error('Branch access denied.',403);
  input.branch=branch;const actor=actorOf(context),now=new Date().toISOString();
  const payloadHash=await hash(input);
  const previousReplay=await replay(env.DB,input.request_id,actor,payloadHash);
  if(previousReplay)return previousReplay.conflict?error('Request ID already used.',409):ok(previousReplay);
  const prior=await env.DB.prepare('SELECT * FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?)').bind(input.id,branch).first();
  if(!prior)return error('Purchase order not found.',404);
  if(prior.version!==input.version)return error('Purchase order changed. Refresh before continuing.',409);
  const expected={SUBMIT:'DRAFT',APPROVE:'SUBMITTED',REJECT:'SUBMITTED'};
  if(input.action==='CANCEL'){
    if(!['DRAFT','SUBMITTED'].includes(prior.status))return error('Only draft or submitted orders may be cancelled.',409);
    if(prior.status==='SUBMITTED'&&!canUsePurchase(context.member,'approve'))return error('Manager approval required to cancel a submitted order.',403);
    if(prior.status==='DRAFT'&&prior.created_by_email!==actor&&!canUsePurchase(context.member,'approve'))return error('Only the creator or manager may cancel this draft.',403);
  }else if(prior.status!==expected[input.action])return error('Invalid purchase order status transition.',409);
  if(['APPROVE','REJECT'].includes(input.action)){
    if(!canUsePurchase(context.member,'approve'))return error('Independent purchasing approval permission required.',403);
    if(actor===prior.created_by_email.toLowerCase()||actor===(prior.submitted_by_email||'').toLowerCase())return error('The creator/submitter cannot approve or reject their own order.',403);
  }
  if(input.action==='SUBMIT'&&prior.created_by_email!==actor&&!canUsePurchase(context.member,'approve'))return error('Only the creator or manager may submit this draft.',403);
  const status={SUBMIT:'SUBMITTED',APPROVE:'APPROVED',REJECT:'REJECTED',CANCEL:'CANCELLED'}[input.action];
  const after={...asPO(prior),status,version:prior.version+1,updated_at:now,
    ...(input.action==='SUBMIT'?{submitted_by_email:actor}:{}),...(input.action==='APPROVE'?{approved_by_email:actor}:{}),
    ...(input.action==='REJECT'?{rejected_by_email:actor}:{}),...(input.action==='CANCEL'?{cancelled_by_email:actor}:{})};
  const outcomes=await env.DB.batch([
    env.DB.prepare(`UPDATE maliks_pos_purchase_orders SET status=?,version=version+1,updated_at=?,last_request_id=?,
      submitted_by_email=CASE WHEN ?='SUBMIT' THEN ? ELSE submitted_by_email END,
      approved_by_email=CASE WHEN ?='APPROVE' THEN ? ELSE approved_by_email END,
      rejected_by_email=CASE WHEN ?='REJECT' THEN ? ELSE rejected_by_email END,
      cancelled_by_email=CASE WHEN ?='CANCEL' THEN ? ELSE cancelled_by_email END
      WHERE id=? AND lower(branch)=lower(?) AND status=? AND version=?
      AND NOT EXISTS(SELECT 1 FROM maliks_pos_po_audit WHERE request_id=?)`)
      .bind(status,now,input.request_id,input.action,actor,input.action,actor,input.action,actor,input.action,actor,
        input.id,branch,prior.status,input.version,input.request_id),
    env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_po_audit
      (request_id,po_id,branch,action,actor_email,actor_name,payload_hash,before_json,after_json,note,created_at)
      SELECT ?,id,branch,?,?,?,?,?,?,?,? FROM maliks_pos_purchase_orders
      WHERE id=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
      .bind(input.request_id,input.action,actor,context.member.name,payloadHash,JSON.stringify(asPO(prior)),JSON.stringify(after),input.note,now,
        input.id,branch,input.version+1,input.request_id),
  ]);
  if(Number(outcomes?.[0]?.meta?.changes)!==1)return error('Purchase order changed. Refresh before continuing.',409);
  return ok({po:after});
}
