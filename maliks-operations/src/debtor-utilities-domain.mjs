// Phase 32 — controlled debtor utilities. NO money posting, debtor balance edits,
// invoice settlement, customer credit approval or destructive quotation deletion.
import {matchingBranch} from './policy.mjs';
import {canUseMaster,validateMasterInput} from './master-domain.mjs';

const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(e,status=400)=>reply({error:String(e)},status);
const kinds=new Set(['agents','blocks','documents','document','journals','labels','expired','imports','audit']);
const CONTROL_ROLES=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager','Finance Manager','Credit Controller']);
const uuid=s=>typeof s==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
const key=(v,label,max=40)=>{const s=String(v??'').trim().toUpperCase();if(!s||s.length>max||!/^[A-Z0-9][A-Z0-9_./-]*$/.test(s))throw Error('Invalid '+label+'.');return s;};
const txt=(v,label,max=160,required=false)=>{const s=String(v??'').trim();if((required&&!s)||s.length>max||/[\x00-\x1f\x7f]/.test(s))throw Error('Invalid '+label+'.');return s;};
const id=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid record ID.');return n;};
const verify=(ctx,branch,write=false)=>ctx.app==='management'&&canUseMaster(ctx.member,'debtor',write)?matchingBranch(ctx.branches,branch):null;
const requireOrigin=req=>{if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))throw Object.assign(Error('Invalid request origin.'),{status:403});};
const digest=async obj=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(obj)))),v=>v.toString(16).padStart(2,'0')).join('');
const date=s=>new Date(s).toISOString().slice(0,10);
const now=()=>new Date().toISOString();
const json=s=>{try{return JSON.parse(s||'{}');}catch{return {};}};
const searchable=s=>String(s||'').trim().slice(0,70);
const qargs=(p,mode)=>{const branch=p.get('branch');const search=searchable(p.get('search'));if(search.length>70)throw Error('Search is too long.');return {branch,search,mode};};
const eligibleBefore=(raw)=>{
 const before=String(raw||'').trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(before)||Number.isNaN(Date.parse(before+'T00:00:00Z'))||date(before+'T00:00:00Z')!==before)throw Error('Choose a valid expiry date (YYYY-MM-DD).');
 const oldest=new Date(Date.now()-90*86400000).toISOString().slice(0,10);
 if(before>oldest)throw Error('Only quotations at least 90 days old can be archived.');return before;
};
const docNumber=(row,type)=> (type==='invoice'?'INV-':'Q-')+String(row.id).padStart(8,'0');
async function existingAudit(db,rid){return db.prepare('SELECT * FROM maliks_pos_debtor_utility_audit WHERE request_id=?').bind(rid).first();}
export async function listDebtorUtility(req,env,ctx){
 try{
  const params=new URL(req.url).searchParams,mode=params.get('mode');
  if(!kinds.has(mode))return fail('Invalid utilities screen.');
  const {branch:asked,search}=qargs(params,mode),branch=verify(ctx,asked);
  if(!branch)return fail('Debtors utilities access denied for this branch.',403);
  const db=env.DB,match='%'+search+'%',out={mode,branch,non_posting:true};
  if(mode==='agents'){
   const {results}=await db.prepare(`SELECT * FROM maliks_pos_debtor_agents WHERE branch=? AND (code LIKE ? OR name LIKE ?) ORDER BY active DESC,code LIMIT 150`).bind(branch,match,match).all();
   out.rows=results;
  }else if(mode==='blocks'){
   const {results}=await db.prepare(`SELECT m.code,m.name,m.active,COALESCE(b.blocked,0) AS blocked,b.reason,COALESCE(b.version,0) AS version,b.changed_by,b.updated_at
    FROM maliks_pos_master_records m LEFT JOIN maliks_pos_debtor_sales_blocks b ON b.branch=m.branch AND b.debtor_code=m.code
    WHERE m.kind='debtor' AND m.branch=? AND (m.code LIKE ? OR m.name LIKE ?) ORDER BY m.code LIMIT 150`).bind(branch,match,match).all();
   out.rows=results;out.warning='Administrative sales-block flags only. The existing walk-in Sales/Tills workflows do not yet select debtor account codes and therefore cannot enforce account-specific blocks.';
  }else if(mode==='documents'){
   const {results:quotes}=await db.prepare(`SELECT q.id,q.customer_name,q.created_at,q.total_cents,q.status,a.archived_at FROM till_quotation_submissions q
      LEFT JOIN maliks_pos_debtor_quote_archives a ON a.quotation_id=q.id AND a.branch=q.branch
      WHERE q.branch=? AND (q.customer_name LIKE ? OR CAST(q.id AS TEXT) LIKE ?) ORDER BY q.id DESC LIMIT 75`).bind(branch,match,match).all();
   const {results:invoices}=await db.prepare(`SELECT i.id,q.customer_name,i.issued_at AS created_at,i.total_cents,'CONFIRMED' AS status
       FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id AND p.status='CONFIRMED'
       JOIN till_quotation_submissions q ON q.id=i.quotation_id WHERE i.branch=? AND (q.customer_name LIKE ? OR CAST(i.id AS TEXT) LIKE ?) ORDER BY i.id DESC LIMIT 75`).bind(branch,match,match).all();
   out.rows=[...invoices.map(x=>({...x,type:'invoice',number:docNumber(x,'invoice')})),...quotes.map(x=>({...x,type:'quote',number:docNumber(x,'quote')}))];
  }else if(mode==='document'){
   const type=params.get('type');if(!['quote','invoice'].includes(type))return fail('Invalid document type.');
   const doc_id=id(params.get('id'));
   let row;
   if(type==='quote')row=await db.prepare('SELECT * FROM till_quotation_submissions WHERE id=? AND branch=?').bind(doc_id,branch).first();
   else row=await db.prepare(`SELECT i.id,i.branch,i.issued_at AS created_at,i.net_cents,i.vat_cents,i.total_cents,q.customer_name,q.customer_contact,q.lines_json,
      q.id AS quotation_id,'CONFIRMED' AS status FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id AND p.status='CONFIRMED'
      JOIN till_quotation_submissions q ON q.id=i.quotation_id WHERE i.id=? AND i.branch=?`).bind(doc_id,branch).first();
   if(!row)return fail('Document not found or not confirmed for this branch.',404);
   out.document={type,id:doc_id,number:docNumber(row,type),branch,customer_name:row.customer_name,customer_contact:row.customer_contact,
     issued_at:row.created_at,net_cents:row.net_cents,vat_cents:row.vat_cents,total_cents:row.total_cents,
     status:row.status,notes:row.notes||'',lines:Array.isArray(json(row.lines_json))?json(row.lines_json):[],
     posting_note:type==='quote'?'QUOTATION ONLY — NOT PAID': 'CONFIRMED INTERNAL INVOICE — settlement/official tax compliance must be checked separately'};
  }else if(mode==='journals'){
   const {results}=await db.prepare(`SELECT id,reference,debtor_code,amount_cents,event_date,description,details_json,status,posted FROM maliks_pos_debtor_transaction_register
    WHERE branch=? AND kind='JOURNAL' AND (reference LIKE ? OR debtor_code LIKE ?) ORDER BY id DESC LIMIT 120`).bind(branch,match,match).all();
   out.rows=results.map(r=>({...r,details:json(r.details_json),status_label:'NOT POSTED · '+r.status}));
  }else if(mode==='labels'){
   const {results}=await db.prepare(`SELECT code,name,details_json FROM maliks_pos_master_records WHERE kind='debtor' AND active=1 AND branch=? AND (code LIKE ? OR name LIKE ?) ORDER BY name LIMIT 150`).bind(branch,match,match).all();
   out.rows=results.map(r=>({code:r.code,name:r.name,details:json(r.details_json)}));
  }else if(mode==='expired'){
   const before=eligibleBefore(params.get('before')||new Date(Date.now()-90*86400000).toISOString().slice(0,10));
   const {results}=await db.prepare(`SELECT q.id,q.customer_name,q.status,q.created_at,q.total_cents,
    CASE WHEN a.quotation_id IS NULL THEN 0 ELSE 1 END AS archived
    FROM till_quotation_submissions q LEFT JOIN maliks_pos_debtor_quote_archives a ON a.branch=q.branch AND a.quotation_id=q.id
    WHERE q.branch=? AND substr(q.created_at,1,10)<? AND NOT EXISTS(SELECT 1 FROM maliks_p9_payments p WHERE p.quotation_id=q.id)
      AND NOT EXISTS(SELECT 1 FROM maliks_p9_invoices i WHERE i.quotation_id=q.id)
      AND (q.customer_name LIKE ? OR CAST(q.id AS TEXT) LIKE ?)
    ORDER BY q.created_at ASC LIMIT 120`).bind(branch,before,match,match).all();
   out.before=before;out.rows=results;out.warning='Archive is non-destructive: records are retained for audit and reprinting. This does not remove a quotation from all legacy Sales/Tills views.';
  }else if(mode==='imports'){
   const {results}=await db.prepare(`SELECT request_id,count,actor_email,created_at FROM maliks_pos_debtor_import_batches WHERE branch=? ORDER BY created_at DESC LIMIT 50`).bind(branch).all();out.rows=results;
  }else if(mode==='audit'){
   const {results}=await db.prepare(`SELECT event,entity,entity_key,actor_email,created_at FROM maliks_pos_debtor_utility_audit WHERE branch=? ORDER BY id DESC LIMIT 100`).bind(branch).all();out.rows=results;
  }
  return reply(out);
 }catch(e){return fail(e.message,e.status||400);}
}
function parseUser(req){return req.json().catch(()=>null);}
function validAgent(d){const code=key(d.code,'agent code'),name=txt(d.name,'agent name',120,true),email=txt(d.email,'email',150),phone=txt(d.phone,'telephone',45),active=d.active===true;
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email address.');
 return {code,name,email:email.toLowerCase(),phone,active:active?1:0};
}
export async function changeDebtorUtility(req,env,ctx){
 try{
  requireOrigin(req);const body=await parseUser(req);if(!body||Array.isArray(body)||typeof body!=='object')return fail('Invalid JSON.');
  const branch=verify(ctx,body.branch,true);if(!branch)return fail('Debtors utilities write permission denied.',403);
  if(!uuid(body.request_id))return fail('Invalid unique request ID.');
  const action=String(body.action||'').toUpperCase();if(!['SAVE_AGENT','SET_BLOCK','ARCHIVE_EXPIRED','IMPORT_DEBTORS'].includes(action))return fail('Invalid utility action.');
  if(['SET_BLOCK','ARCHIVE_EXPIRED'].includes(action)&&!CONTROL_ROLES.has(ctx.member.role))return fail('Manager or credit controller authorisation required.',403);
  const db=env.DB,actor=String(ctx.member.email||'').toLowerCase(),rid=body.request_id,payload=JSON.stringify({...body,branch});
  const old=await existingAudit(db,rid);
  if(old){if(old.actor_email!==actor||old.branch.toLowerCase()!==branch.toLowerCase()||old.details_json!==payload)return fail('Request ID was already used for another action.',409);
   return reply({ok:true,duplicate:true,action,branch});}
  const t=now();
  if(action==='SAVE_AGENT'){
   const a=validAgent(body),recordId=body.id==null?null:id(body.id),version=Number(body.version||0);
   if(recordId!=null&&(!Number.isSafeInteger(version)||version<1))return fail('Invalid version.');
   let statements=[];
   if(recordId==null){
    statements.push(db.prepare(`INSERT INTO maliks_pos_debtor_agents(branch,code,name,email,phone,active,created_at,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?)`)
     .bind(branch,a.code,a.name,a.email,a.phone,a.active,t,t,actor));
   }else{
    const before=await db.prepare('SELECT id FROM maliks_pos_debtor_agents WHERE id=? AND branch=? AND version=?').bind(recordId,branch,version).first();
    if(!before)return fail('Agent record changed. Refresh the list.',409);
    statements.push(db.prepare(`UPDATE maliks_pos_debtor_agents SET code=?,name=?,email=?,phone=?,active=?,version=version+1,updated_at=?,updated_by=? WHERE id=? AND branch=? AND version=?`)
     .bind(a.code,a.name,a.email,a.phone,a.active,t,actor,recordId,branch,version));
   }
   statements.push(db.prepare(`INSERT INTO maliks_pos_debtor_utility_audit(branch,event,entity,entity_key,request_id,actor_email,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)`)
     .bind(branch,recordId?'UPDATE_AGENT':'CREATE_AGENT','AGENT',a.code,rid,actor,payload,t));
   try{const changes=await db.batch(statements);if(recordId!=null&&Number(changes[0]?.meta?.changes)!==1)return fail('Agent changed. Refresh.',409);}catch(e){if(/UNIQUE|constraint/i.test(String(e)))return fail('An agent with this code already exists at this branch.',409);throw e;}
   return reply({ok:true,action,branch});
  }
  if(action==='SET_BLOCK'){
   const debtor=key(body.debtor_code,'debtor code');if(typeof body.blocked!=='boolean')return fail('Select Block or Unblock.');
   const reason=txt(body.reason,'block reason',300,true);if(reason.length<8)return fail('Enter a reason of at least 8 characters.');
   const master=await db.prepare("SELECT code FROM maliks_pos_master_records WHERE kind='debtor' AND active=1 AND branch=? AND code=?").bind(branch,debtor).first();
   if(!master)return fail('Active debtor account not found at this branch.',404);
   const prior=await db.prepare('SELECT version FROM maliks_pos_debtor_sales_blocks WHERE branch=? AND debtor_code=?').bind(branch,debtor).first();
   const version=Number(body.version||0);if((prior?.version||0)!==version)return fail('Block record changed. Refresh.',409);
   let stm=[];
   if(prior)stm.push(db.prepare(`UPDATE maliks_pos_debtor_sales_blocks SET blocked=?,reason=?,version=version+1,changed_by=?,updated_at=? WHERE branch=? AND debtor_code=? AND version=?`)
    .bind(body.blocked?1:0,reason,actor,t,branch,debtor,version));
   else stm.push(db.prepare(`INSERT INTO maliks_pos_debtor_sales_blocks(branch,debtor_code,blocked,reason,version,changed_by,updated_at) VALUES(?,?,?,?,1,?,?)`)
    .bind(branch,debtor,body.blocked?1:0,reason,actor,t));
   stm.push(db.prepare(`INSERT INTO maliks_pos_debtor_utility_audit(branch,event,entity,entity_key,request_id,actor_email,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)`)
    .bind(branch,body.blocked?'BLOCK_ACCOUNT':'UNBLOCK_ACCOUNT','DEBTOR',debtor,rid,actor,payload,t));
   const results=await db.batch(stm);if(Number(results[0]?.meta?.changes)!==1)return fail('Block record changed. Refresh.',409);
   return reply({ok:true,branch,action,warning:'Block flag saved in debtor administration. Live Sales/Tills account enforcement requires account-code linking.'});
  }
  if(action==='ARCHIVE_EXPIRED'){
   const quoteId=id(body.id),before=eligibleBefore(body.before),reason=txt(body.reason,'archive reason',250,true);if(reason.length<8)return fail('Enter a reason of at least 8 characters.');
   const q=await db.prepare(`SELECT q.id FROM till_quotation_submissions q WHERE q.id=? AND q.branch=? AND substr(q.created_at,1,10)<?
     AND NOT EXISTS(SELECT 1 FROM maliks_p9_payments p WHERE p.quotation_id=q.id)
     AND NOT EXISTS(SELECT 1 FROM maliks_p9_invoices i WHERE i.quotation_id=q.id)
     AND NOT EXISTS(SELECT 1 FROM maliks_pos_debtor_quote_archives a WHERE a.branch=q.branch AND a.quotation_id=q.id)`).bind(quoteId,branch,before).first();
   if(!q)return fail('Quotation is too new, already archived, or linked to a payment/invoice.',409);
   const stm=[db.prepare(`INSERT INTO maliks_pos_debtor_quote_archives(branch,quotation_id,reason,archived_by,archived_at) VALUES(?,?,?,?,?)`).bind(branch,quoteId,reason,actor,t),
    db.prepare(`INSERT INTO maliks_pos_debtor_utility_audit(branch,event,entity,entity_key,request_id,actor_email,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)`)
     .bind(branch,'ARCHIVE_EXPIRED','QUOTE',String(quoteId),rid,actor,payload,t)];
   try{await db.batch(stm);}catch(e){if(/constraint/i.test(String(e)))return fail('Quotation already archived.',409);throw e;}
   return reply({ok:true,action,branch,archived:quoteId,hard_deleted:false});
  }
  // Secure CREATE-ONLY import. Reject conflicting rows rather than overwriting active accounts.
  const rows=body.rows;if(!Array.isArray(rows)||rows.length<1||rows.length>50)return fail('Import between 1 and 50 debtor records per batch.');
  const validated=rows.map(row=>validateMasterInput({kind:'debtor',branch,code:row.code,name:row.name,active:row.active!==false,
   details:{contact_name:row.contact_name||'',phone:row.phone||'',email:row.email||'',credit_limit_cents:Number(row.credit_limit_cents||0),payment_terms_days:Number(row.payment_terms_days||0)},request_id:crypto.randomUUID()}));
  if(new Set(validated.map(x=>x.code)).size!==validated.length)return fail('The import contains duplicate account codes.',409);
  const identifiers=validated.map(x=>x.code),placeholders=identifiers.map(()=>'?').join(',');
  const {results:found}=await db.prepare(`SELECT code FROM maliks_pos_master_records WHERE kind='debtor' AND branch=? AND code IN (${placeholders})`).bind(branch,...identifiers).all();
  if(found.length)return fail('Existing debtor code(s): '+found.map(x=>x.code).slice(0,6).join(', ')+'. Nothing imported.',409);
  const rawHash=await digest(validated.map(x=>({code:x.code,name:x.name,active:x.active,details:x.details})));const entries=[];
  for(const data of validated){const recordHash=await digest(data),after={kind:'debtor',branch,code:data.code,name:data.name,active:Boolean(data.active),details:data.details,version:1};
   entries.push(db.prepare(`INSERT INTO maliks_pos_master_records(kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
      VALUES('debtor',?,?,?,?,?,1,?,?,?,?,?,?,?)`).bind(branch,data.code,data.name,data.active,JSON.stringify(data.details),actor,actor,t,t,data.request_id,recordHash,data.request_id));
   entries.push(db.prepare(`INSERT INTO maliks_pos_master_audit(request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
     SELECT ?,'debtor',branch,id,'CREATE',?,?,?,?,?,? FROM maliks_pos_master_records WHERE create_request_id=?`).bind(data.request_id,actor,ctx.member.name||actor,recordHash,null,JSON.stringify(after),t,data.request_id));
  }
  entries.push(db.prepare('INSERT INTO maliks_pos_debtor_import_batches(request_id,branch,actor_email,payload_hash,count,created_at) VALUES(?,?,?,?,?,?)').bind(rid,branch,actor,rawHash,validated.length,t));
  entries.push(db.prepare('INSERT INTO maliks_pos_debtor_utility_audit(branch,event,entity,entity_key,request_id,actor_email,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(branch,'IMPORT_DEBTORS','BATCH',rid,rid,actor,payload,t));
  try{await db.batch(entries);}catch(e){if(/constraint/i.test(String(e)))return fail('Import conflicts with another account or request. Nothing imported.',409);throw e;}
  return reply({ok:true,action,branch,imported:validated.length});
 }catch(e){return fail(e.message,e.status||400);}
}
