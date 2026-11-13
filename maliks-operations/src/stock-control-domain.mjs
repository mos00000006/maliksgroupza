// Phase 20: stock adjustments, stocktake reconciliation and opening physical counts.
// No GL/AP/VAT posting. Each movement is branch scoped, version checked and independently approved.
import {matchingBranch} from './policy.mjs';
import {canUseInventory} from './inventory-domain.mjs';
const reply=(v,status=200)=>Response.json(v,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(msg,status=400)=>reply({error:msg},status);
const reqid=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v))throw Error('Invalid request ID.');return v.toLowerCase();};
const num=(v,label,min,max)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('Invalid '+label+'.');return v;};
const field=(v,label,max,required=false)=>{if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim())||/[\u0000-\u001f\u007f]/.test(v))throw Error('Invalid '+label+'.');return v.trim();};
const originOK=req=>Boolean(req.headers.get('origin'))&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),b=>b.toString(16).padStart(2,'0')).join('');
const actor=c=>String(c.member.email).toLowerCase();
const isManager=c=>c.app==='management'&&canUseInventory(c.member,'approveTransfer');
const isCounter=c=>c.app==='management'&&canUseInventory(c.member,'count');
const isController=c=>c.app==='management'&&canUseInventory(c.member,'transfer');
const canRead=c=>c.app==='management'&&canUseInventory(c.member,'read');
const branchFor=(c,raw)=>{const b=matchingBranch(c.branches,raw);if(!b)throw Error('Branch access denied.');return b;};
async function body(req){const raw=await req.text();if(raw.length>28000)throw Error('Request too large.');let v;try{v=JSON.parse(raw);}catch{throw Error('Invalid JSON.');}if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid document.');return v;}
const clientDoc=row=>({...row,number:'SC-'+String(row.id).padStart(6,'0'),lines:JSON.parse(row.lines_json),lines_json:undefined,create_hash:undefined});
export function validateStockControl(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid stock control document.');
 const doc_type=field(raw.doc_type,'document type',16,true).toUpperCase();
 if(!['ADJUSTMENT','STOCKTAKE','OPENING'].includes(doc_type))throw Error('Invalid document type.');
 const reason=field(raw.reason,'reason',350,true);if(reason.length<6)throw Error('Provide a meaningful reason (at least 6 characters).');
 if(!Array.isArray(raw.lines)||raw.lines.length<1||raw.lines.length>100)throw Error('Select 1–100 stock lines.');
 const seen=new Set(),lines=raw.lines.map(l=>{
  if(!l||typeof l!=='object'||Array.isArray(l))throw Error('Invalid stock line.');
  const stock_id=num(l.stock_id,'stock ID',1,2_000_000_000);
  if(seen.has(stock_id))throw Error('Duplicate stock line.');seen.add(stock_id);
  const value=doc_type==='ADJUSTMENT'?num(l.delta_milli,'adjustment quantity',-1_000_000_000,1_000_000_000):num(l.counted_milli,'counted quantity',0,1_000_000_000);
  if(doc_type==='ADJUSTMENT'&&value===0)throw Error('Adjustment quantity must not be zero.');
  return doc_type==='ADJUSTMENT'?{stock_id,delta_milli:value}:{stock_id,counted_milli:value};
 });
 return {branch:field(raw.branch,'branch',150,true),doc_type,reason,lines,request_id:reqid(raw.request_id)};
}
export async function listStockControl(req,env,c){
 if(!canRead(c))return fail('Stock control access denied.',403);
 const branch=matchingBranch(c.branches,new URL(req.url).searchParams.get('branch'));
 if(!branch)return fail('Branch access denied.',403);
 const {results}=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 80').bind(branch).all();
 const {results:movements}=await env.DB.prepare(`SELECT m.id,m.doc_id,m.quantity_delta_milli,m.movement_type,m.actor_email,m.created_at,s.code,s.name
 FROM maliks_pos_stock_control_movements m JOIN maliks_pos_master_records s ON s.id=m.stock_master_id
 WHERE lower(m.branch)=lower(?) ORDER BY m.id DESC LIMIT 100`).bind(branch).all();
 return reply({branch,documents:results.map(clientDoc),movements,financial_posting:false});
}
export async function createStockControl(req,env,c){
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=validateStockControl(await body(req));v.branch=branchFor(c,v.branch);}catch(e){return fail(e.message,/Branch access denied/.test(e.message)?403:400);}
 if(!(v.doc_type==='ADJUSTMENT'?isController(c):isCounter(c)))return fail('Stock count/adjustment permission denied.',403);
 const email=actor(c),hash=await digest(v),now=new Date().toISOString();
 const prior=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE create_request_id=?').bind(v.request_id).first();
 if(prior)return prior.create_hash===hash&&prior.created_by_email===email?reply({document:clientDoc(prior),duplicate:true}):fail('Request ID already used.',409);
 const ids=v.lines.map(l=>l.stock_id),{results}=await env.DB.prepare(`SELECT m.id,m.code,m.name,COALESCE(b.qty_milli,0) AS qty_milli,COALESCE(b.version,0) AS stock_version
 FROM maliks_pos_master_records m LEFT JOIN maliks_pos_stock_balances b ON b.stock_master_id=m.id AND lower(b.branch)=lower(m.branch)
 WHERE m.kind='stock' AND m.active=1 AND lower(m.branch)=lower(?) AND m.id IN (${ids.map(()=>'?').join(',')})`).bind(v.branch,...ids).all();
 if(results.length!==ids.length)return fail('All stock lines must be active branch Stock Master items.',409);
 const map=new Map(results.map(x=>[x.id,x]));
 const lines=v.lines.map(l=>({...l,code:map.get(l.stock_id).code,name:map.get(l.stock_id).name,expected_qty_milli:map.get(l.stock_id).qty_milli,expected_version:map.get(l.stock_id).stock_version}));
 if(v.doc_type==='OPENING'){
  const {results:existing}=await env.DB.prepare(`SELECT stock_master_id FROM maliks_pos_stock_movements WHERE lower(branch)=lower(?) AND stock_master_id IN (${ids.map(()=>'?').join(',')})
 UNION SELECT stock_master_id FROM maliks_pos_stock_control_movements WHERE lower(branch)=lower(?) AND stock_master_id IN (${ids.map(()=>'?').join(',')})`).bind(v.branch,...ids,v.branch,...ids).all();
  if(existing.length||lines.some(l=>l.expected_qty_milli!==0||l.expected_version!==0))return fail('Opening counts require items with no previous stock movements. Use Stock Take to reconcile existing stock.',409);
 }
 try{await env.DB.batch([
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_stock_control_docs(branch,doc_type,reason,lines_json,status,version,created_by_email,created_at,updated_at,create_request_id,create_hash,last_request_id)
  VALUES(?,?,?,?,'DRAFT',1,?,?,?,?,?,?)`).bind(v.branch,v.doc_type,v.reason,JSON.stringify(lines),email,now,now,v.request_id,hash,v.request_id),
  env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_stock_control_audit(request_id,doc_id,branch,action,actor_email,payload_hash,created_at)
  SELECT ?,id,branch,'CREATE',?,?,? FROM maliks_pos_stock_control_docs WHERE create_request_id=? AND create_hash=? AND created_by_email=?`).bind(v.request_id,email,hash,now,v.request_id,hash,email)
 ]);}catch{return fail('Could not save stock control draft.',409);}
 const row=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE create_request_id=?').bind(v.request_id).first();
 if(!row||row.create_hash!==hash||row.created_by_email!==email)return fail('Request ID already used.',409);
 return reply({document:clientDoc(row)});
}
export async function stockControlAction(req,env,c){
 if(!originOK(req))return fail('Invalid request origin.',403);
 let v;try{v=await body(req);v={id:num(v.id,'document ID',1,2_000_000_000),version:num(v.version,'version',1,2_000_000_000),branch:branchFor(c,field(v.branch,'branch',150,true)),action:field(v.action,'action',12,true).toUpperCase(),request_id:reqid(v.request_id)};
  if(!['POST','CANCEL'].includes(v.action))throw Error('Invalid action.');}catch(e){return fail(e.message,/Branch access denied/.test(e.message)?403:400);}
 if(!isManager(c))return fail('Independent stock manager approval required.',403);
 const email=actor(c),hash=await digest(v),now=new Date().toISOString();
 const prev=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_audit WHERE request_id=?').bind(v.request_id).first();
 if(prev){if(prev.payload_hash!==hash||prev.actor_email!==email||prev.doc_id!==v.id||prev.action!==v.action)return fail('Request ID already used.',409);
  const row=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE id=? AND lower(branch)=lower(?)').bind(v.id,v.branch).first();
  return row?reply({document:clientDoc(row),duplicate:true}):fail('Document not found.',404);
 }
 const row=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE id=? AND lower(branch)=lower(?)').bind(v.id,v.branch).first();
 if(!row)return fail('Document not found.',404);
 if(row.status!=='DRAFT'||row.version!==v.version)return fail('Document changed or is no longer a draft. Refresh.',409);
 if(row.created_by_email===email)return fail('An independent manager must approve the stock document.',403);
 const lines=JSON.parse(row.lines_json);
 const status=v.action==='POST'?'POSTED':'CANCELLED';const column=v.action==='POST'?'approved_by_email':'cancelled_by_email';
 const steps=[env.DB.prepare(`UPDATE maliks_pos_stock_control_docs SET status=CASE WHEN status='DRAFT' AND version=? THEN ? ELSE 'INVALID' END,
 version=version+1,${column}=?,updated_at=?,last_request_id=? WHERE id=? AND lower(branch)=lower(?)`).bind(v.version,status,email,now,v.request_id,v.id,v.branch)];
 if(v.action==='POST'){
  for(const l of lines){
   const delta=row.doc_type==='ADJUSTMENT'?l.delta_milli:l.counted_milli-l.expected_qty_milli;
   // Insert baseline with version 0 if this is a new stock item. Stale snapshots are rejected by CHECK(qty_milli>=0).
   steps.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_stock_balances(branch,stock_master_id,qty_milli,version,updated_at) VALUES(?,?,0,0,?)`).bind(v.branch,l.stock_id,now));
   if(row.doc_type==='OPENING'){
    steps.push(env.DB.prepare(`UPDATE maliks_pos_stock_balances SET qty_milli=CASE WHEN version=? AND qty_milli=0
     AND NOT EXISTS(SELECT 1 FROM maliks_pos_stock_movements WHERE lower(branch)=lower(?) AND stock_master_id=?)
     AND NOT EXISTS(SELECT 1 FROM maliks_pos_stock_control_movements WHERE lower(branch)=lower(?) AND stock_master_id=?)
     AND EXISTS(SELECT 1 FROM maliks_pos_master_records WHERE id=? AND active=1 AND kind='stock' AND lower(branch)=lower(?))
     THEN ? ELSE -1 END,version=version+1,updated_at=? WHERE lower(branch)=lower(?) AND stock_master_id=?`)
      .bind(l.expected_version,v.branch,l.stock_id,v.branch,l.stock_id,l.stock_id,v.branch,l.counted_milli,now,v.branch,l.stock_id));
   }else{
    const target=row.doc_type==='ADJUSTMENT'?`qty_milli+?`:'?';
    steps.push(env.DB.prepare(`UPDATE maliks_pos_stock_balances SET qty_milli=CASE WHEN version=? AND EXISTS(SELECT 1 FROM maliks_pos_master_records WHERE id=? AND active=1 AND kind='stock' AND lower(branch)=lower(?)) THEN ${target} ELSE -1 END,
      version=version+1,updated_at=? WHERE lower(branch)=lower(?) AND stock_master_id=?`)
      .bind(l.expected_version,l.stock_id,v.branch,row.doc_type==='ADJUSTMENT'?delta:l.counted_milli,now,v.branch,l.stock_id));
   }
   if(delta!==0)steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_control_movements(doc_id,branch,stock_master_id,quantity_delta_milli,movement_type,actor_email,created_at)
    VALUES(?,?,?,?,?,?,?)`).bind(v.id,v.branch,l.stock_id,delta,row.doc_type,email,now));
  }
 }
 steps.push(env.DB.prepare(`INSERT INTO maliks_pos_stock_control_audit(request_id,doc_id,branch,action,actor_email,payload_hash,created_at)
 VALUES(?,?,?,?,?,?,?)`).bind(v.request_id,v.id,v.branch,v.action,email,hash,now));
 try{await env.DB.batch(steps);}catch{return fail('Stock changed, insufficient quantity or duplicate posting. No changes were posted. Refresh and recount.',409);}
 const updated=await env.DB.prepare('SELECT * FROM maliks_pos_stock_control_docs WHERE id=?').bind(v.id).first();
 return reply({document:clientDoc(updated)});
}
