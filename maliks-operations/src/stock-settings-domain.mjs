// Phase 42 — branch-scoped Stocks settings and numbering reservations.
// Does not modify live quotations, invoices, stock balances, cash, VAT, or general ledger.
import {matchingBranch} from './policy.mjs';
import {canUseMaster} from './master-domain.mjs';

const result=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const failure=(message,status=400)=>result({error:String(message)},status);
const MANAGERS=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager','Finance Manager','Stock Controller']);
const SEQUENCES=Object.freeze({
 STOCK_ADJUSTMENT:{label:'Stock adjustment preparation',prefix:'STA-',width:6},
 STOCK_COUNT:{label:'Stock count preparation',prefix:'STC-',width:6},
 STOCK_RETURN:{label:'Stock return preparation',prefix:'STR-',width:6},
 STOCK_TRANSFER:{label:'Transfer preparation',prefix:'STT-',width:6},
 STOCK_LABEL:{label:'Stock label batch',prefix:'STL-',width:6},
 STOCK_PRICE_REVIEW:{label:'Stock price review',prefix:'STP-',width:6}
});
const number=(v,label,lo,hi)=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<lo||n>hi)throw Error(label+' must be an integer between '+lo+' and '+hi+'.');return n;};
const description=(v,label,max=500)=>{const s=String(v??'').trim();if(s.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s))throw Error('Invalid '+label+'.');return s;};
const prefix=v=>{const s=String(v??'').trim().toUpperCase();if(s.length<2||s.length>12||!/^[A-Z][A-Z0-9-]*-$/.test(s))throw Error('Prefix must start with a letter and end with a hyphen (e.g. STA-).');return s;};
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const modeList=['settings','numbering','audit'];
const actor=ctx=>String(ctx.member.email||'').trim().toLowerCase();
const now=()=>new Date().toISOString();
function authorise(ctx,asked,writing=false){
 if(ctx.app!=='management'||!canUseMaster(ctx.member,'stock',writing)||(writing&&!MANAGERS.has(ctx.member.role)))return null;
 return matchingBranch(ctx.branches,asked);
}
function checkOrigin(req){const origin=req.headers.get('origin');if(!origin||origin!==req.headers.get('x-maliks-original-origin'))throw Object.assign(Error('Invalid request origin.'),{status:403});}
function configForClient(record,branch){return record?{...record,branch}:{branch,default_reorder_min_units:0,default_reorder_max_units:0,stocktake_cycle_days:30,stocktake_note:'',reorder_note:'',version:0,changed_by:'',changed_at:''};}
function sequenceForClient(row,branch,kind){const d=SEQUENCES[kind];const seq=row||{branch,kind,prefix:d.prefix,width:d.width,next_value:1,version:0,changed_by:'',changed_at:''};return {...seq,label:d.label,next_reference:seq.prefix+String(seq.next_value).padStart(seq.width,'0')};}
async function replay(db,reqId,context,branch,payload){
 const record=await db.prepare('SELECT * FROM maliks_pos_stock_config_audit WHERE request_id=?').bind(reqId).first();
 if(!record)return null;
 if(record.branch.toLowerCase()!==branch.toLowerCase()||record.actor_email!==actor(context)||record.detail!==payload)return failure('Request ID already used for a different action.',409);
 if(record.action==='RESERVE_NUMBER'){const reserved=await db.prepare('SELECT reference FROM maliks_pos_stock_reserved_numbers WHERE request_id=?').bind(reqId).first();
  return result({ok:true,duplicate:true,action:record.action,branch,reference:reserved?.reference||null,reservation_only:true});}
 return result({ok:true,duplicate:true,action:record.action,branch});
}
function auditStatement(db,branch,action,kind,payload,reqId,email,at){return db.prepare(`INSERT INTO maliks_pos_stock_config_audit(branch,action,kind,detail,request_id,actor_email,created_at) VALUES(?,?,?,?,?,?,?)`).bind(branch,action,kind,payload,reqId,email,at);}
export async function getStockSettings(req,env,context){
 try{
  const p=new URL(req.url).searchParams,mode=p.get('mode')||'settings';
  if(!modeList.includes(mode))return failure('Invalid Stocks settings screen.');
  const branch=authorise(context,p.get('branch'));if(!branch)return failure('Stocks settings access denied.',403);
  const db=env.DB;
  if(mode==='settings'){
   const r=await db.prepare('SELECT * FROM maliks_pos_stock_branch_settings WHERE branch=?').bind(branch).first();
   return result({mode,branch,settings:configForClient(r,branch),posting_enabled:false,defaults_connected_to_new_accounts:false});
  }
  if(mode==='numbering'){
   const {results:rows}=await db.prepare('SELECT * FROM maliks_pos_stock_number_sequences WHERE branch=?').bind(branch).all();
   const {results:counts}=await db.prepare('SELECT kind,COUNT(*) AS n FROM maliks_pos_stock_reserved_numbers WHERE branch=? GROUP BY kind').bind(branch).all();
   return result({mode,branch,sequences:Object.keys(SEQUENCES).map(kind=>({...sequenceForClient(rows.find(r=>r.kind===kind),branch,kind),reserved_count:Number(counts.find(c=>c.kind===kind)?.n||0)})),automatic_document_numbering:false,
    note:'These are independently reserved references. Existing GRVs, purchase orders, stock counts, adjustments and transfers retain their current numbering. Reservations are separate.'});
  }
  const {results:entries}=await db.prepare('SELECT id,action,kind,actor_email,created_at FROM maliks_pos_stock_config_audit WHERE branch=? ORDER BY id DESC LIMIT 100').bind(branch).all();
  const {results:reserved}=await db.prepare('SELECT kind,reference,actor_email,reserved_at FROM maliks_pos_stock_reserved_numbers WHERE branch=? ORDER BY id DESC LIMIT 100').bind(branch).all();
  return result({mode,branch,entries,reserved});
 }catch(e){return failure(e.message,e.status||400);}
}
export async function changeStockSettings(req,env,context){
 try{
  checkOrigin(req);
  const body=await req.json().catch(()=>null);if(!body||Array.isArray(body)||typeof body!=='object')return failure('Invalid JSON.');
  const branch=authorise(context,body.branch,true);if(!branch)return failure('Manager with Stocks write access required for this branch.',403);
  if(!uuid(body.request_id))return failure('Invalid unique request ID.');
  const action=String(body.action||'').toUpperCase(),rid=body.request_id;
  if(!['SAVE_SETTINGS','SAVE_NUMBERING','RESERVE_NUMBER'].includes(action))return failure('Unsupported settings action.');
  const db=env.DB,email=actor(context),payload=JSON.stringify({...body,branch});
  const previous=await replay(db,rid,context,branch,payload);if(previous)return previous;
  const at=now();
  if(action==='SAVE_SETTINGS'){
   const values={default_reorder_min_units:number(body.default_reorder_min_units,'Default reorder minimum',0,1000000),default_reorder_max_units:number(body.default_reorder_max_units,'Default reorder maximum',0,1000000),
    stocktake_cycle_days:number(body.stocktake_cycle_days,'Stocktake cycle days',1,365),stocktake_note:description(body.stocktake_note,'stocktake note'),reorder_note:description(body.reorder_note,'reorder note')};
   if(values.default_reorder_max_units>0 && values.default_reorder_max_units<values.default_reorder_min_units)return failure('Default maximum must be greater than or equal to the minimum.');
   const ver=number(body.version,'Settings version',0,1000000);
   const existing=await db.prepare('SELECT version FROM maliks_pos_stock_branch_settings WHERE branch=?').bind(branch).first();
   if(Number(existing?.version||0)!==ver)return failure('Settings were changed by someone else. Refresh.',409);
   const stm=existing?
    db.prepare(`UPDATE maliks_pos_stock_branch_settings SET default_reorder_min_units=?,default_reorder_max_units=?,stocktake_cycle_days=?,stocktake_note=?,reorder_note=?,version=version+1,changed_by=?,changed_at=? WHERE branch=? AND version=?`)
     .bind(values.default_reorder_min_units,values.default_reorder_max_units,values.stocktake_cycle_days,values.stocktake_note,values.reorder_note,email,at,branch,ver):
    db.prepare(`INSERT INTO maliks_pos_stock_branch_settings(branch,default_reorder_min_units,default_reorder_max_units,stocktake_cycle_days,stocktake_note,reorder_note,version,changed_by,changed_at) VALUES(?,?,?,?,?,?,1,?,?)`)
     .bind(branch,values.default_reorder_min_units,values.default_reorder_max_units,values.stocktake_cycle_days,values.stocktake_note,values.reorder_note,email,at);
   const r=await db.batch([stm,auditStatement(db,branch,action,'SETTINGS',payload,rid,email,at)]);
   if(Number(r[0]?.meta?.changes)!==1)return failure('Settings changed concurrently. Refresh.',409);
   return result({ok:true,branch,action,warning:'Saved Stock settings for future workflows. No existing quantities, product reorder levels, prices or documents were changed.'});
  }
  const kind=String(body.kind||'').toUpperCase();if(!Object.hasOwn(SEQUENCES,kind))return failure('Invalid sequence type.');
  const existing=await db.prepare('SELECT * FROM maliks_pos_stock_number_sequences WHERE branch=? AND kind=?').bind(branch,kind).first();
  if(action==='SAVE_NUMBERING'){
   const newPrefix=prefix(body.prefix),width=number(body.width,'Number padding',4,10),next=number(body.next_value,'Next reference number',1,999999999);
   const version=number(body.version,'Sequence version',0,1000000);
   if(Number(existing?.version||0)!==version)return failure('Sequence settings changed. Refresh.',409);
   if(existing&&next<existing.next_value)return failure('Next number cannot move backwards.',409);
   const count=await db.prepare('SELECT COUNT(*) AS n FROM maliks_pos_stock_reserved_numbers WHERE branch=? AND kind=?').bind(branch,kind).first();
   if(Number(count?.n||0)>0&&(newPrefix!==existing.prefix||width!==existing.width))return failure('Prefix and padding cannot change after numbers have been reserved.',409);
   // Avoid prefix collisions with other reserved-number types at the same branch.
   const row=await db.prepare('SELECT kind FROM maliks_pos_stock_number_sequences WHERE branch=? AND prefix=? AND kind<>?').bind(branch,newPrefix,kind).first();
   if(row)return failure('This prefix is already used by another Stocks numbering series.',409);
   const stm=existing?
    db.prepare(`UPDATE maliks_pos_stock_number_sequences SET prefix=?,width=?,next_value=?,version=version+1,changed_by=?,changed_at=? WHERE branch=? AND kind=? AND version=?`)
     .bind(newPrefix,width,next,email,at,branch,kind,version):
    db.prepare(`INSERT INTO maliks_pos_stock_number_sequences(branch,kind,prefix,width,next_value,version,changed_by,changed_at) VALUES(?,?,?,?,?,1,?,?)`)
     .bind(branch,kind,newPrefix,width,next,email,at);
   const r=await db.batch([stm,auditStatement(db,branch,action,kind,payload,rid,email,at)]);
   if(Number(r[0]?.meta?.changes)!==1)return failure('Sequence changed concurrently. Refresh.',409);
   return result({ok:true,branch,kind,action,warning:'Future manual number reservations use these settings. Existing document identifiers remain unchanged.'});
  }
  // Reserving creates an auditable reference, not a customer account or transaction.
  if(!existing){const d=SEQUENCES[kind];await db.prepare(`INSERT OR IGNORE INTO maliks_pos_stock_number_sequences(branch,kind,prefix,width,next_value,version,changed_by,changed_at) VALUES(?,?,?,?,1,1,?,?)`)
   .bind(branch,kind,d.prefix,d.width,email,at).run();}
  const seq=await db.prepare('SELECT * FROM maliks_pos_stock_number_sequences WHERE branch=? AND kind=?').bind(branch,kind).first();
  if(!seq)return failure('Could not load numbering sequence.',503);
  const n=number(seq.next_value,'Next reference number',1,999999998),reference=seq.prefix+String(n).padStart(seq.width,'0');
  const stm=[
   db.prepare(`UPDATE maliks_pos_stock_number_sequences SET next_value=next_value+1,version=version+1,changed_by=?,changed_at=? WHERE branch=? AND kind=? AND next_value=? AND version=?`).bind(email,at,branch,kind,n,seq.version),
   db.prepare(`INSERT INTO maliks_pos_stock_reserved_numbers(branch,kind,sequence_value,reference,request_id,payload_json,actor_email,reserved_at)
      SELECT ?,?,?,?,?,?,?,? FROM maliks_pos_stock_number_sequences WHERE branch=? AND kind=? AND next_value=? AND version=?`)
    .bind(branch,kind,n,reference,rid,payload,email,at,branch,kind,n+1,seq.version+1),
   auditStatement(db,branch,action,kind,payload,rid,email,at)
  ];
  try{const r=await db.batch(stm);if(Number(r[0]?.meta?.changes)!==1||Number(r[1]?.meta?.changes)!==1)return failure('Number reservation changed concurrently. Refresh.',409);}
  catch(e){if(/UNIQUE|constraint/i.test(String(e)))return failure('Number already reserved or request duplicated. Refresh.',409);throw e;}
  return result({ok:true,branch,kind,action,reference,sequence_value:n,reservation_only:true,posting_enabled:false});
 }catch(e){if(/UNIQUE|constraint/i.test(String(e)))return failure('Conflicting settings or request. Refresh.',409);return failure(e.message,e.status||400);}
}
