// Phase 17: controlled PO receiving, GRV posting, operational SOH and inter-branch transfers.
// Stock changes are transactional; there is deliberately no VAT/AP/GL or sales stock posting.
import {matchingBranch,limitSearch} from './policy.mjs';

const COMMON=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager']);
const COUNT=new Set([...COMMON,'Receiving Clerk','Receiving','Receiving Supervisor','Warehouse Manager','Warehouse Management','Stock Controller']);
const VERIFY=new Set([...COMMON,'Receiving Manager','Warehouse Manager','Warehouse Management']);
const POST=new Set([...COMMON,'GRV Clerk']);
const PACK_CHECK=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager']);
const TRANSFER=new Set([...COMMON,'Stock Controller','Warehouse Manager','Warehouse Management']);
const READ=new Set([...COUNT,...VERIFY,...POST,'Purchasing Manager','Buyer','Finance Manager','Creditors Clerk','Executive / EXCO']);
export function canUseInventory(member,permission='read'){
 if(!member||Number(member.active)!==1)return false;
 const role=member.role;
 if(permission==='count')return COUNT.has(role);
 if(permission==='verify')return VERIFY.has(role);
 if(permission==='post')return POST.has(role);
 if(permission==='packCheck')return PACK_CHECK.has(role);
 if(permission==='transfer')return TRANSFER.has(role);
 if(permission==='approveTransfer')return VERIFY.has(role);
 return READ.has(role)&&(role!=='Executive / EXCO'||member.access_scope==='Full company');
}
const json=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(v,status=400)=>json({error:v},status);
const int=(v,name,min=1,max=2_000_000_000)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('Invalid '+name+'.');return v;};
const str=(v,name,max=150,required=false)=>{if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim())||/[\u0000-\u001f\u007f]/.test(v))throw Error('Invalid '+name+'.');return v.trim();};
const uuid=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v))throw Error('Invalid request ID.');return v.toLowerCase();};
const actor=c=>c.member.email.toLowerCase();
const allow=(c,perm)=>c.app==='management'&&canUseInventory(c.member,perm);
const originOK=req=>Boolean(req.headers.get('origin'))&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const parse=async req=>{const s=await req.text();if(s.length>18000)throw Error('Request too large.');try{return JSON.parse(s);}catch{throw Error('Invalid JSON.');}};
const sha=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)))),b=>b.toString(16).padStart(2,'0')).join('');
const requireBranch=(c,v)=>{const b=matchingBranch(c.branches,v);if(!b)throw Error('Branch access denied.');return b;};
const checkAction=(raw,kind)=>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid action.');
 const action=str(raw.action,'action',16,true).toUpperCase();
 const actions=kind==='receipt'?['VERIFY','POST','CANCEL','PRINT_LABELS','LABELLED','PACK_CHECK']:['SEND','RECEIVE','CANCEL'];
 if(!actions.includes(action))throw Error('Invalid action.');
 return {id:int(raw.id,kind+' ID'),version:int(raw.version,'version'),branch:str(raw.branch,'branch',150,true),action,request_id:uuid(raw.request_id)};
};
const stockLines=raw=>{
 if(!Array.isArray(raw)||!raw.length||raw.length>30)throw Error('Select 1–30 stock lines.');
 const seen=new Set();return raw.map(v=>{
  const stock_id=int(v.stock_id,'stock ID');if(seen.has(stock_id))throw Error('Duplicate stock line.');seen.add(stock_id);
  const accepted_milli=int(v.accepted_milli,'accepted quantity',0,1_000_000_000);
  const rejected_milli=int(v.rejected_milli,'rejected quantity',0,1_000_000_000);
  if(!accepted_milli&&!rejected_milli)throw Error('A counted line must have accepted or rejected quantity.');
  return {stock_id,accepted_milli,rejected_milli};
 });
};
export function validateReceipt(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid receiving note.');
 return {branch:str(raw.branch,'branch',150,true),po_id:int(raw.po_id,'PO ID'),delivery_note:str(raw.delivery_note,'delivery note',90,true),
  supplier_invoice_reference:str(raw.supplier_invoice_reference,'supplier invoice reference',90),driver_name:str(raw.driver_name,'driver name',100),
  notes:str(raw.notes,'notes',400),lines:stockLines(raw.lines),request_id:uuid(raw.request_id)};
}
export function validateTransfer(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid transfer.');
 if(!Array.isArray(raw.lines)||!raw.lines.length||raw.lines.length>30)throw Error('Select 1–30 transfer lines.');
 const seen=new Set();const lines=raw.lines.map(l=>{const stock_id=int(l.stock_id,'stock ID'),qty_milli=int(l.qty_milli,'quantity',1,1_000_000_000);if(seen.has(stock_id))throw Error('Duplicate stock item.');seen.add(stock_id);return {stock_id,qty_milli};});
 return {source_branch:str(raw.source_branch,'source branch',150,true),destination_branch:str(raw.destination_branch,'destination branch',150,true),notes:str(raw.notes,'notes',400),lines,request_id:uuid(raw.request_id)};
}
const receiptFor=(r,lines=[])=>({id:r.id,number:'RCV-'+String(r.id).padStart(6,'0'),po_id:r.po_id,branch:r.branch,delivery_note:r.delivery_note,
 supplier_invoice_reference:r.supplier_invoice_reference,driver_name:r.driver_name,notes:r.notes,status:r.status,version:r.version,
 counted_by_email:r.counted_by_email,verified_by_email:r.verified_by_email,posted_by_email:r.posted_by_email,labels_printed_by:r.labels_printed_by,labels_printed_at:r.labels_printed_at,
 labelled_by:r.labelled_by,labelled_at:r.labelled_at,pack_checked_by:r.pack_checked_by,pack_checked_at:r.pack_checked_at,created_at:r.created_at,lines});
const transferFor=r=>({id:r.id,number:'TRF-'+String(r.id).padStart(6,'0'),source_branch:r.source_branch,destination_branch:r.destination_branch,
 lines:JSON.parse(r.lines_json),notes:r.notes,status:r.status,version:r.version,created_by_email:r.created_by_email,
 sent_by_email:r.sent_by_email,received_by_email:r.received_by_email,created_at:r.created_at});
async function receiptWithLines(db,row){
 const {results}=await db.prepare(`SELECT rl.stock_master_id AS stock_id,rl.accepted_milli,rl.rejected_milli,m.code,m.name
 FROM maliks_pos_receipt_lines rl LEFT JOIN maliks_pos_master_records m ON m.id=rl.stock_master_id
 WHERE rl.receipt_id=? ORDER BY rl.stock_master_id`).bind(row.id).all();
 return receiptFor(row,results);
}
async function replay(db,table,id,hash,actorEmail){
 const row=await db.prepare(`SELECT * FROM ${table} WHERE request_id=?`).bind(id).first();
 if(!row)return null;
 return row.payload_hash===hash&&row.actor_email===actorEmail?{duplicate:true,document_id:table==='maliks_pos_receipt_audit'?row.receipt_id:row.transfer_id}:{conflict:true};
}
export async function listInventory(req,env,c){
 if(!allow(c,'read'))return fail('Stock access denied.',403);
 const branch=matchingBranch(c.branches,new URL(req.url).searchParams.get('branch'));if(!branch)return fail('Branch access denied.',403);
 const query=new URL(req.url).searchParams;
 const q=limitSearch(query.get('q')||'');if(q===null)return fail('Search too long.');const term=q.toLowerCase();
 const pageRaw=Number(query.get('page')||1);if(!Number.isSafeInteger(pageRaw)||pageRaw<1||pageRaw>10000)return fail('Invalid page.');
 const page=pageRaw,perPage=150;
 const {results}=await env.DB.prepare(`SELECT m.id AS stock_id,m.code,m.name,json_extract(m.details_json,'$.unit') AS unit,
 COALESCE(b.qty_milli,0) AS qty_milli,COALESCE(b.version,0) AS stock_version,
 json_extract(m.details_json,'$.category') AS category,json_extract(m.details_json,'$.barcode') AS barcode,
 COALESCE(CAST(json_extract(m.details_json,'$.cost_cents') AS INTEGER),0) AS cost_cents,
 COALESCE(CAST(json_extract(m.details_json,'$.reorder_min') AS INTEGER),0) AS reorder_min
 FROM maliks_pos_master_records m LEFT JOIN maliks_pos_stock_balances b ON b.stock_master_id=m.id AND lower(b.branch)=lower(m.branch)
 WHERE m.kind='stock' AND lower(m.branch)=lower(?) AND m.active=1 AND (?='' OR instr(lower(m.code),?)>0 OR instr(lower(m.name),?)>0)
 ORDER BY m.name LIMIT ? OFFSET ?`).bind(branch,term,term,term,perPage,(page-1)*perPage).all();
 const totalRow=await env.DB.prepare(`SELECT COUNT(*) AS total FROM maliks_pos_master_records m
 WHERE m.kind='stock' AND lower(m.branch)=lower(?) AND m.active=1 AND (?='' OR instr(lower(m.code),?)>0 OR instr(lower(m.name),?)>0)`).bind(branch,term,term,term).first();
 const {results:movements}=await env.DB.prepare(`SELECT * FROM (
 SELECT m.id,m.movement_type,m.document_id,m.quantity_delta_milli,m.created_at,m.actor_email,s.code
 FROM maliks_pos_stock_movements m LEFT JOIN maliks_pos_master_records s ON s.id=m.stock_master_id
 WHERE lower(m.branch)=lower(?)
 UNION ALL
 SELECT m.id,m.movement_type,m.doc_id AS document_id,m.quantity_delta_milli,m.created_at,m.actor_email,s.code
 FROM maliks_pos_stock_control_movements m LEFT JOIN maliks_pos_master_records s ON s.id=m.stock_master_id
 WHERE lower(m.branch)=lower(?)
 ) ORDER BY created_at DESC,id DESC LIMIT 60`).bind(branch,branch).all();
 const {results:destinations}=await env.DB.prepare("SELECT name FROM workspaces WHERE type='Store' AND active=1 ORDER BY name").all();
 return json({branch,items:results,page,pages:Math.ceil(Number(totalRow?.total||0)/perPage),total:Number(totalRow?.total||0),movements,destinations:destinations.map(r=>r.name),accounting_posted:false});
}
export async function listReceipts(req,env,c){
 if(!allow(c,'read'))return fail('Receiving access denied.',403);
 const branch=matchingBranch(c.branches,new URL(req.url).searchParams.get('branch'));if(!branch)return fail('Branch access denied.',403);
 const {results}=await env.DB.prepare(`SELECT * FROM maliks_pos_receipts WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 80`).bind(branch).all();
 return json({branch,receipts:await Promise.all(results.map(r=>receiptWithLines(env.DB,r)))});
}
export async function countReceipt(req,env,c){
 if(!allow(c,'count'))return fail('Receiving count permission denied.',403);
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=validateReceipt(await parse(req));v.branch=requireBranch(c,v.branch);}catch(e){return fail(e.message,403);}
 const email=actor(c),payloadHash=await sha(v),now=new Date().toISOString();
 const prev=await env.DB.prepare('SELECT * FROM maliks_pos_receipts WHERE create_request_id=?').bind(v.request_id).first();
 if(prev)return prev.create_hash===payloadHash&&prev.counted_by_email===email?json({receipt:await receiptWithLines(env.DB,prev),duplicate:true}):fail('Request ID already used.',409);
 const po=await env.DB.prepare(`SELECT id,status,lines_json FROM maliks_pos_purchase_orders WHERE id=? AND lower(branch)=lower(?)`).bind(v.po_id,v.branch).first();
 if(!po||po.status!=='APPROVED')return fail('Only approved POs can be received.',409);
 const lineMap=new Map(JSON.parse(po.lines_json).map(l=>[l.stock_id,l]));
 for(const line of v.lines)if(!lineMap.has(line.stock_id))return fail('Counted item not on this purchase order.',409);
 const steps=[env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_receipts
 (po_id,branch,delivery_note,supplier_invoice_reference,driver_name,notes,status,version,counted_by_email,created_at,updated_at,create_request_id,create_hash,last_request_id)
 VALUES (?,?,?,?,?,?,'COUNTED',1,?,?,?,?,?,?)`)
 .bind(v.po_id,v.branch,v.delivery_note,v.supplier_invoice_reference,v.driver_name,v.notes,email,now,now,v.request_id,payloadHash,v.request_id)];
 for(const l of v.lines)steps.push(env.DB.prepare(`INSERT INTO maliks_pos_receipt_lines(receipt_id,stock_master_id,accepted_milli,rejected_milli)
 SELECT id,?,?,? FROM maliks_pos_receipts WHERE create_request_id=? AND create_hash=? AND counted_by_email=?`)
 .bind(l.stock_id,l.accepted_milli,l.rejected_milli,v.request_id,payloadHash,email));
 steps.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_receipt_audit(request_id,receipt_id,branch,action,actor_email,payload_hash,created_at)
 SELECT ?,id,branch,'COUNT',?,?,? FROM maliks_pos_receipts WHERE create_request_id=? AND create_hash=? AND counted_by_email=?`)
 .bind(v.request_id,email,payloadHash,now,v.request_id,payloadHash,email));
 try{await env.DB.batch(steps);}catch(e){return fail(/RECEIPT_EXCEEDS_ORDER/.test(String(e))?'Accepted quantities exceed outstanding PO quantities.':`Count could not be saved: ${String(e.message||e).slice(0,100)}`,409);}
 const saved=await env.DB.prepare('SELECT * FROM maliks_pos_receipts WHERE create_request_id=?').bind(v.request_id).first();
 if(!saved||saved.create_hash!==payloadHash||saved.counted_by_email!==email)return fail('Count was not saved. Refresh.',409);
 return json({receipt:await receiptWithLines(env.DB,saved)});
}
export async function receiptAction(req,env,c){
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=checkAction(await parse(req),'receipt');v.branch=requireBranch(c,v.branch);}catch(e){return fail(e.message);}
 const permission={VERIFY:'verify',POST:'post',CANCEL:'verify',PRINT_LABELS:'post',LABELLED:'count',PACK_CHECK:'packCheck'}[v.action];if(!allow(c,permission))return fail('Insufficient receiving permissions.',403);
 const email=actor(c),hash=await sha(v),now=new Date().toISOString();
 const old=await replay(env.DB,'maliks_pos_receipt_audit',v.request_id,hash,email);
 if(old){if(old.conflict)return fail('Request ID already used.',409);const row=await env.DB.prepare('SELECT * FROM maliks_pos_receipts WHERE id=? AND lower(branch)=lower(?)').bind(old.document_id,v.branch).first();return row?json({receipt:await receiptWithLines(env.DB,row),duplicate:true}):fail('Receipt not found.',404);}
 const r=await env.DB.prepare('SELECT * FROM maliks_pos_receipts WHERE id=? AND lower(branch)=lower(?)').bind(v.id,v.branch).first();
 if(!r)return fail('Receiving note not found.',404);
 if(r.version!==v.version)return fail('Receiving note changed. Refresh.',409);
 if(v.action==='VERIFY'&&r.status!=='COUNTED'||v.action==='POST'&&r.status!=='VERIFIED'||v.action==='CANCEL'&&r.status!=='COUNTED')return fail('Invalid receiving status transition.',409);
 if(['PRINT_LABELS','LABELLED','PACK_CHECK'].includes(v.action)&&r.status!=='POSTED')return fail('Post the GRV before label and pack controls.',409);
 if(v.action==='PRINT_LABELS'&&r.labels_printed_by)return fail('Labels were already printed.',409);
 if(v.action==='LABELLED'&&(!r.labels_printed_by||r.labelled_by))return fail('Labels must be printed first and can only be marked once.',409);
 if(v.action==='PACK_CHECK'&&(!r.labelled_by||r.pack_checked_by))return fail('Store Manager must wait until labelling is complete.',409);
 if(v.action==='LABELLED'&&email===r.labels_printed_by)return fail('Receiving staff must independently confirm labelling.',403);
 if(v.action==='PACK_CHECK'&&email===r.posted_by_email)return fail('Store Manager pack check must be independent of GRV posting.',403);
 if(v.action==='VERIFY'&&r.counted_by_email===email)return fail('Receiving Manager must be different from the counter.',403);
 if(v.action==='POST'&&(r.verified_by_email===email||r.counted_by_email===email))return fail('GRV poster must be independent from counter and verifier.',403);
 if(v.action==='CANCEL'&&r.counted_by_email===email&&!COMMON.has(c.member.role))return fail('Independent manager must cancel the count.',403);
 const status={VERIFY:'VERIFIED',POST:'POSTED',CANCEL:'CANCELLED'}[v.action]||'POSTED';
 const column={VERIFY:'verified_by_email',POST:'posted_by_email',CANCEL:'cancelled_by_email',
   PRINT_LABELS:'labels_printed_by',LABELLED:'labelled_by',PACK_CHECK:'pack_checked_by'}[v.action];
 const extra={PRINT_LABELS:'labels_printed_at',LABELLED:'labelled_at',PACK_CHECK:'pack_checked_at'}[v.action];
 const guard=v.action==='PRINT_LABELS'?' AND labels_printed_by IS NULL':v.action==='LABELLED'?' AND labels_printed_by IS NOT NULL AND labelled_by IS NULL':v.action==='PACK_CHECK'?' AND labelled_by IS NOT NULL AND pack_checked_by IS NULL':'';
 const steps=[env.DB.prepare(`UPDATE maliks_pos_receipts SET status=CASE WHEN status=? AND version=?${guard} THEN ? ELSE 'INVALID' END,
 version=version+1,${column}=?,${extra?extra+'=?,':''}updated_at=?,last_request_id=? WHERE id=? AND lower(branch)=lower(?)`)
 .bind(r.status,v.version,status,email,...(extra?[now]:[]),now,v.request_id,v.id,v.branch)];
 if(v.action==='POST'){
  const {results:lines}=await env.DB.prepare(`SELECT stock_master_id,accepted_milli FROM maliks_pos_receipt_lines WHERE receipt_id=? AND accepted_milli>0`).bind(v.id).all();
  const ids=lines.map(l=>l.stock_master_id);
  if(ids.length){const {results:active}=await env.DB.prepare(`SELECT id FROM maliks_pos_master_records WHERE kind='stock' AND active=1 AND lower(branch)=lower(?) AND id IN (${ids.map(()=>'?').join(',')})`).bind(v.branch,...ids).all();
   if(active.length!==ids.length)return fail('Reactivate the relevant Stock Master items before GRV posting.',409);}
  for(const l of lines){
   steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_balances(branch,stock_master_id,qty_milli,version,updated_at) VALUES(?,?,?,1,?)
    ON CONFLICT(branch,stock_master_id) DO UPDATE SET qty_milli=qty_milli+excluded.qty_milli,version=version+1,updated_at=excluded.updated_at`)
    .bind(v.branch,l.stock_master_id,l.accepted_milli,now));
   steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_movements(branch,stock_master_id,quantity_delta_milli,movement_type,document_id,actor_email,created_at)
    VALUES (?,?,?,'GRV',?,?,?)`).bind(v.branch,l.stock_master_id,l.accepted_milli,v.id,email,now));
  }
 }
 steps.push(env.DB.prepare(`INSERT INTO maliks_pos_receipt_audit(request_id,receipt_id,branch,action,actor_email,payload_hash,created_at)
 VALUES (?,?,?,?,?,?,?)`).bind(v.request_id,v.id,v.branch,v.action,email,hash,now));
 try{await env.DB.batch(steps);}catch{return fail('Receipt changed or GRV could not be posted. No stock was changed.',409);}
 const updated=await env.DB.prepare('SELECT * FROM maliks_pos_receipts WHERE id=?').bind(v.id).first();return json({receipt:await receiptWithLines(env.DB,updated)});
}
export async function listTransfers(req,env,c){
 if(!allow(c,'read'))return fail('Transfer access denied.',403);
 const branch=matchingBranch(c.branches,new URL(req.url).searchParams.get('branch'));if(!branch)return fail('Branch access denied.',403);
 const {results}=await env.DB.prepare(`SELECT * FROM maliks_pos_transfers WHERE lower(source_branch)=lower(?) OR lower(destination_branch)=lower(?) ORDER BY id DESC LIMIT 100`).bind(branch,branch).all();
 return json({branch,transfers:results.map(transferFor)});
}
export async function createTransfer(req,env,c){
 if(!allow(c,'transfer'))return fail('Transfer creation denied.',403);
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=validateTransfer(await parse(req));v.source_branch=requireBranch(c,v.source_branch);}catch(e){return fail(e.message,/Branch access denied/.test(e.message)?403:400);}
 if(v.source_branch.toLowerCase()===v.destination_branch.toLowerCase())return fail('Source and destination must be different.');
 const dest=await env.DB.prepare("SELECT name FROM workspaces WHERE type='Store' AND active=1 AND lower(name)=lower(?)").bind(v.destination_branch).first();
 if(!dest)return fail('Destination must be an active store.',409);v.destination_branch=dest.name;
 const email=actor(c),hash=await sha(v),now=new Date().toISOString();
 const prior=await env.DB.prepare('SELECT * FROM maliks_pos_transfers WHERE create_request_id=?').bind(v.request_id).first();
 if(prior)return prior.create_hash===hash&&prior.created_by_email===email?json({transfer:transferFor(prior),duplicate:true}):fail('Request ID already used.',409);
 const ids=v.lines.map(l=>l.stock_id),{results:stocks}=await env.DB.prepare(`SELECT id,code,name FROM maliks_pos_master_records WHERE kind='stock' AND active=1 AND lower(branch)=lower(?) AND id IN (${ids.map(()=>'?').join(',')})`).bind(v.source_branch,...ids).all();
 if(stocks.length!==ids.length)return fail('Every transfer line must be an active source stock item.',409);
 const byId=new Map(stocks.map(x=>[x.id,x]));const lines=v.lines.map(l=>({...l,code:byId.get(l.stock_id).code,name:byId.get(l.stock_id).name}));
 try{await env.DB.batch([
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_transfers(source_branch,destination_branch,lines_json,notes,status,version,created_by_email,created_at,updated_at,create_request_id,create_hash,last_request_id)
   VALUES(?,?,?,?,'DRAFT',1,?,?,?,?,?,?)`).bind(v.source_branch,v.destination_branch,JSON.stringify(lines),v.notes,email,now,now,v.request_id,hash,v.request_id),
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_transfer_audit(request_id,transfer_id,action,actor_email,payload_hash,created_at)
   SELECT ?,id,'CREATE',?,?,? FROM maliks_pos_transfers WHERE create_request_id=? AND create_hash=? AND created_by_email=?`).bind(v.request_id,email,hash,now,v.request_id,hash,email),
 ]);}catch{return fail('Unable to create transfer.',409);}
 const row=await env.DB.prepare('SELECT * FROM maliks_pos_transfers WHERE create_request_id=?').bind(v.request_id).first();
 if(!row||row.create_hash!==hash||row.created_by_email!==email)return fail('Request ID already used.',409);
 return json({transfer:transferFor(row)});
}
export async function transferAction(req,env,c){
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=checkAction(await parse(req),'transfer');v.branch=requireBranch(c,v.branch);}catch(e){return fail(e.message);}
 const perm=v.action==='RECEIVE'?'count':'approveTransfer';if(!allow(c,perm))return fail('Transfer approval/receipt permission denied.',403);
 const email=actor(c),hash=await sha(v),now=new Date().toISOString();
 const old=await replay(env.DB,'maliks_pos_transfer_audit',v.request_id,hash,email);
 if(old){if(old.conflict)return fail('Request ID already used.',409);const r=await env.DB.prepare('SELECT * FROM maliks_pos_transfers WHERE id=?').bind(old.document_id).first();
 if(!r)return fail('Transfer not found.',404);const required=v.action==='RECEIVE'?r.destination_branch:r.source_branch;
 if(v.branch.toLowerCase()!==required.toLowerCase())return fail('Branch access denied.',403);
 return json({transfer:transferFor(r),duplicate:true});}
 const r=await env.DB.prepare('SELECT * FROM maliks_pos_transfers WHERE id=?').bind(v.id).first();if(!r)return fail('Transfer not found.',404);
 const requiredBranch=v.action==='RECEIVE'?r.destination_branch:r.source_branch;
 if(v.branch.toLowerCase()!==requiredBranch.toLowerCase())return fail('Action must be performed at the correct branch.',403);
 if(r.version!==v.version)return fail('Transfer changed. Refresh.',409);
 if(v.action==='SEND'&&r.status!=='DRAFT'||v.action==='RECEIVE'&&r.status!=='IN_TRANSIT'||v.action==='CANCEL'&&r.status!=='DRAFT')return fail('Invalid transfer status transition.',409);
 if(v.action==='SEND'&&r.created_by_email===email)return fail('Transfer must be released by an independent manager.',403);
 if(v.action==='RECEIVE'&&(r.sent_by_email===email||r.created_by_email===email))return fail('Destination receiving must be independent.',403);
 if(v.action==='CANCEL'&&r.created_by_email===email&&!COMMON.has(c.member.role))return fail('Independent manager required to cancel.',403);
 const status={SEND:'IN_TRANSIT',RECEIVE:'RECEIVED',CANCEL:'CANCELLED'}[v.action],column={SEND:'sent_by_email',RECEIVE:'received_by_email',CANCEL:'cancelled_by_email'}[v.action];
 const steps=[env.DB.prepare(`UPDATE maliks_pos_transfers SET status=CASE WHEN status=? AND version=? THEN ? ELSE 'INVALID' END,
 version=version+1,${column}=?,updated_at=?,last_request_id=? WHERE id=?`).bind(r.status,v.version,status,email,now,v.request_id,v.id)];
 const lines=JSON.parse(r.lines_json);
 if(v.action==='SEND'){
  const ids=lines.map(l=>l.stock_id),codes=lines.map(l=>l.code);
  const {results:activeSource}=await env.DB.prepare(`SELECT id FROM maliks_pos_master_records WHERE kind='stock' AND active=1 AND lower(branch)=lower(?) AND id IN (${ids.map(()=>'?').join(',')})`).bind(r.source_branch,...ids).all();
  const {results:activeDest}=await env.DB.prepare(`SELECT code FROM maliks_pos_master_records WHERE kind='stock' AND active=1 AND lower(branch)=lower(?) AND code IN (${codes.map(()=>'?').join(',')})`).bind(r.destination_branch,...codes).all();
  if(activeSource.length!==lines.length||activeDest.length!==lines.length)return fail('Both branches need active matching Stock Master codes before transfer dispatch.',409);
  for(const l of lines){
   // A CHECK constraint on stock balances aborts the complete transaction if any line would go negative.
   steps.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_stock_balances(branch,stock_master_id,qty_milli,version,updated_at) VALUES(?,?,0,1,?)`).bind(r.source_branch,l.stock_id,now));
   steps.push(env.DB.prepare(`UPDATE maliks_pos_stock_balances SET qty_milli=qty_milli-?,version=version+1,updated_at=? WHERE lower(branch)=lower(?) AND stock_master_id=?`).bind(l.qty_milli,now,r.source_branch,l.stock_id));
   steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_movements(branch,stock_master_id,quantity_delta_milli,movement_type,document_id,actor_email,created_at)
    VALUES(?,?,?,'TRANSFER_OUT',?,?,?)`).bind(r.source_branch,l.stock_id,-l.qty_milli,v.id,email,now));
  }
 }
 if(v.action==='RECEIVE'){
  const codes=lines.map(l=>l.code);const {results:dest}=await env.DB.prepare(`SELECT id,code FROM maliks_pos_master_records WHERE kind='stock' AND active=1 AND lower(branch)=lower(?) AND code IN (${codes.map(()=>'?').join(',')})`).bind(r.destination_branch,...codes).all();
  if(dest.length!==lines.length)return fail('Destination must have active stock masters with matching codes before receiving.',409);
  const byCode=new Map(dest.map(x=>[x.code.toLowerCase(),x.id]));
  for(const l of lines){const stockId=byCode.get(l.code.toLowerCase());if(!stockId)return fail('Destination stock code mismatch.',409);
   steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_balances(branch,stock_master_id,qty_milli,version,updated_at) VALUES(?,?,?,1,?)
    ON CONFLICT(branch,stock_master_id) DO UPDATE SET qty_milli=qty_milli+excluded.qty_milli,version=version+1,updated_at=excluded.updated_at`).bind(r.destination_branch,stockId,l.qty_milli,now));
   steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_movements(branch,stock_master_id,quantity_delta_milli,movement_type,document_id,actor_email,created_at)
    VALUES(?,?,?,'TRANSFER_IN',?,?,?)`).bind(r.destination_branch,stockId,l.qty_milli,v.id,email,now));
  }
 }
 steps.push(env.DB.prepare(`INSERT INTO maliks_pos_transfer_audit(request_id,transfer_id,action,actor_email,payload_hash,created_at) VALUES(?,?,?,?,?,?)`).bind(v.request_id,v.id,v.action,email,hash,now));
 try{await env.DB.batch(steps);}catch{return fail(v.action==='SEND'?'Insufficient stock, stale transfer, or duplicate send. No stock was moved.':'Transfer changed or receipt could not be posted. No stock was moved.',409);}
 const updated=await env.DB.prepare('SELECT * FROM maliks_pos_transfers WHERE id=?').bind(v.id).first();return json({transfer:transferFor(updated)});
}
