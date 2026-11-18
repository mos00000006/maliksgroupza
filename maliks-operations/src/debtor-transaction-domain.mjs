// Phase 30: strictly non-posting debtor transaction registers for Maliks POS Professional.
// Production payments continue exclusively through Tills/Cash Office. These records NEVER
// update customer balances, invoices, cash, bank, VAT, GL, stock or dispatch.
import { matchingBranch } from './policy.mjs';
import { canUseMaster } from './master-domain.mjs';

const KINDS=new Set(['PAYMENT','REVERSAL','JOURNAL','PDC','GROUP_SETTLEMENT']);
const METHODS=new Set(['CASH','CARD','EFT','CHEQUE','OTHER']);
const canReview=member=>['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager'].includes(member?.role);
const fail=(error,status=400)=>Response.json({error},{status,headers:{'cache-control':'no-store'}});
const ok=obj=>Response.json(obj,{headers:{'cache-control':'no-store'}});
const text=(value,label,min=1,max=120)=>{
  const v=String(value??'').trim();
  if(v.length<min||v.length>max||/[<>\x00-\x1f]/.test(v))throw Error(label+' must be '+min+'–'+max+' safe characters.');
  return v;
};
const code=(value,label,required=true)=>{
  const v=String(value??'').trim().toUpperCase();
  if(!v && !required)return '';
  if(!/^[A-Z0-9][A-Z0-9._/ -]{0,59}$/.test(v))throw Error(label+' must be a valid code (up to 60 characters).');
  return v;
};
const date=(v,label)=>{
  const s=String(v??'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s+'T12:00:00Z'))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)
    throw Error(label+' must be a valid ISO date.');
  return s;
};
const id=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid record ID.');return n;};
const version=v=>{const n=Number(v);if(!Number.isSafeInteger(n)||n<1)throw Error('Invalid record version.');return n;};
const requestId=v=>{
  const s=String(v||'');if(!/^[a-zA-Z0-9_-]{12,100}$/.test(s))throw Error('Invalid unique request ID.');return s;
};
async function digest(value){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
const parsed=row=>({id:row.id,kind:row.kind,branch:row.branch,reference:row.reference,
  debtor_code:row.debtor_code,amount_cents:row.amount_cents,event_date:row.event_date,
  description:row.description,details:JSON.parse(row.details_json),status:row.status,version:row.version,
  posted:false,created_by_email:row.created_by_email,created_by_name:row.created_by_name,
  reviewed_by_email:row.reviewed_by_email,reviewed_at:row.reviewed_at,review_reason:row.review_reason,
  created_at:row.created_at,updated_at:row.updated_at});
function details(kind,source){
  const d=source&&typeof source==='object'&&!Array.isArray(source)?source:{};
  if(kind==='PAYMENT'){
    const method=code(d.method,'Payment method');if(!METHODS.has(method))throw Error('Choose a valid payment method.');
    return {method,bank_reference:code(d.bank_reference,'External payment reference',false)};
  }
  if(kind==='REVERSAL')return {original_reference:code(d.original_reference,'Original payment/transaction number'),
    reason:text(d.reason,'Reversal reason',10,300)};
  if(kind==='JOURNAL'){
    const debit_account=code(d.debit_account,'Debit account'),credit_account=code(d.credit_account,'Credit account');
    if(debit_account===credit_account)throw Error('Debit and credit accounts must differ.');
    return {debit_account,credit_account};
  }
  if(kind==='PDC')return {bank:text(d.bank,'Cheque bank',2,80),cheque_number:code(d.cheque_number,'Cheque number'),
    cheque_date:date(d.cheque_date,'Post-dated cheque date')};
  if(kind==='GROUP_SETTLEMENT')return {invoice_number:code(d.invoice_number,'Invoice reference'),
    group_account:code(d.group_account,'Group account code')};
  throw Error('Unsupported transaction type.');
}
export function validateDebtorTransaction(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid transaction.');
  const kind=String(body.kind||'').toUpperCase();if(!KINDS.has(kind))throw Error('Invalid transaction type.');
  const amount=Number(body.amount_cents);
  if(!Number.isSafeInteger(amount)||amount<=0||amount>100000000000)throw Error('Amount must be positive whole cents.');
  const value={kind,reference:code(body.reference,'Register reference'),
    debtor_code:code(body.debtor_code,'Debtor account',kind!=='JOURNAL'),amount_cents:amount,
    event_date:date(body.event_date,'Transaction date'),description:text(body.description,'Description',3,500),
    details:details(kind,body.details),request_id:requestId(body.request_id)};
  if(kind==='PDC'&&value.details.cheque_date<=value.event_date)throw Error('PDC cheque date must be after the received date.');
  if(kind==='REVERSAL'&&value.reference===value.details.original_reference)throw Error('Reversal reference must differ from original document.');
  return value;
}
function access(context,branch,writable=false){
  if(context.app!=='management'||!canUseMaster(context.member,'debtor',writable))return null;
  return matchingBranch(context.branches,branch);
}
function originOK(req){return !!req.headers.get('origin')&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');}
export async function listDebtorTransactions(req,env,context){
  const p=new URL(req.url).searchParams,branch=access(context,p.get('branch'));
  if(!branch)return fail('Debtors transaction access denied for this branch.',403);
  const kind=String(p.get('kind')||'').toUpperCase();if(!KINDS.has(kind))return fail('Choose a transaction type.');
  const {results}=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE lower(branch)=lower(?) AND kind=?
    ORDER BY id DESC LIMIT 150`).bind(branch,kind).all();
  return ok({branch,kind,records:results.map(parsed),posting_enabled:false});
}
export async function listDebtorTransactionAudit(req,env,context){
  const p=new URL(req.url).searchParams,branch=access(context,p.get('branch'));
  if(!branch)return fail('Audit access denied for this branch.',403);
  let record_id;try{record_id=id(p.get('id'));}catch(e){return fail(e.message);}
  const row=await env.DB.prepare(`SELECT id FROM maliks_pos_debtor_transaction_register WHERE id=? AND lower(branch)=lower(?)`)
    .bind(record_id,branch).first();
  if(!row)return fail('Record not found in this branch.',404);
  const {results}=await env.DB.prepare(`SELECT action,actor_email,actor_name,status_from,status_to,reason,created_at
    FROM maliks_pos_debtor_transaction_audit WHERE record_id=? AND lower(branch)=lower(?) ORDER BY id`)
    .bind(record_id,branch).all();
  return ok({record_id,branch,events:results});
}
export async function createDebtorTransaction(req,env,context){
  if(!originOK(req))return fail('Invalid request origin.',403);
  const body=await req.json().catch(()=>null);if(!body)return fail('Invalid JSON.');
  const branch=access(context,body.branch,true);if(!branch)return fail('Transaction capture denied for this branch.',403);
  let d;try{d=validateDebtorTransaction(body);}catch(e){return fail(e.message);}
  const hash=await digest({branch,...d,request_id:undefined});
  const actor=context.member.email.toLowerCase(),name=context.member.name||actor;
  let existing=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE create_request_id=?`).bind(d.request_id).first();
  if(existing){if(existing.create_payload_hash!==hash||existing.created_by_email!==actor)return fail('Request ID already used for different details.',409);return ok({record:parsed(existing),duplicate:true,posting_enabled:false});}
  const now=new Date().toISOString();
  const insert=env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_debtor_transaction_register
    (kind,branch,reference,debtor_code,amount_cents,event_date,description,details_json,
     status,version,posted,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
    VALUES(?,?,?,?,?,?,?,?,'DRAFT',1,0,?,?,?,?,?,?,?)`).bind(d.kind,branch,d.reference,d.debtor_code,d.amount_cents,
      d.event_date,d.description,JSON.stringify(d.details),actor,name,now,now,d.request_id,hash,d.request_id);
  const audit=env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_debtor_transaction_audit
    (record_id,branch,kind,action,request_id,payload_hash,actor_email,actor_name,status_from,status_to,reason,created_at)
    SELECT id,branch,kind,'CREATE',?,?,?,?,'','DRAFT','',? FROM maliks_pos_debtor_transaction_register
    WHERE create_request_id=? AND created_by_email=?`).bind(d.request_id,hash,actor,name,now,d.request_id,actor);
  try{await env.DB.batch([insert,audit]);}catch(e){if(/UNIQUE|constraint/i.test(String(e)))return fail('Duplicate transaction reference for this branch.',409);throw e;}
  existing=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE create_request_id=?`).bind(d.request_id).first();
  if(!existing)return fail('Reference already exists for this branch and transaction type.',409);
  if(existing.create_payload_hash!==hash||existing.created_by_email!==actor)return fail('Request ID conflict.',409);
  return ok({record:parsed(existing),posting_enabled:false});
}
export async function actionDebtorTransaction(req,env,context){
  if(!originOK(req))return fail('Invalid request origin.',403);
  const body=await req.json().catch(()=>null);if(!body)return fail('Invalid JSON.');
  const branch=access(context,body.branch,true);if(!branch)return fail('Transaction action denied for this branch.',403);
  let record_id,record_version,rid,action,reason='';
  try{record_id=id(body.id);record_version=version(body.version);rid=requestId(body.request_id);
    action=String(body.action||'').toUpperCase();if(!['SUBMIT','REVIEW','REJECT','CANCEL'].includes(action))throw Error('Invalid action.');
    if(action==='REJECT')reason=text(body.reason,'Rejection reason',8,300);
  }catch(e){return fail(e.message);}
  const actor=context.member.email.toLowerCase(),name=context.member.name||actor;
  const hash=await digest({record_id,branch,record_version,action,reason});
  const replay=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_audit WHERE request_id=?`).bind(rid).first();
  if(replay){if(replay.record_id!==record_id||replay.actor_email!==actor||replay.payload_hash!==hash)return fail('Request ID already used for another action.',409);
    const restored=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE id=? AND lower(branch)=lower(?)`).bind(record_id,branch).first();
    return restored?ok({record:parsed(restored),duplicate:true,posting_enabled:false}):fail('Record not found.',404);
  }
  const record=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE id=? AND lower(branch)=lower(?)`)
    .bind(record_id,branch).first();
  if(!record)return fail('Record not found for assigned branch.',404);
  if(record.version!==record_version)return fail('Record changed. Refresh and retry.',409);
  const next=({SUBMIT:'SUBMITTED',REVIEW:'REVIEWED',REJECT:'REJECTED',CANCEL:'CANCELLED'})[action];
  const valid=action==='SUBMIT'||action==='CANCEL'?record.status==='DRAFT':record.status==='SUBMITTED';
  if(!valid)return fail('Invalid status transition.',409);
  if((action==='SUBMIT'||action==='CANCEL')&&record.created_by_email!==actor)return fail('Only the creator can submit or cancel this draft.',403);
  if(['REVIEW','REJECT'].includes(action)){
    if(!canReview(context.member))return fail('Manager review permission required.',403);
    if(record.created_by_email===actor)return fail('Independent review required: creator cannot approve or reject own entry.',403);
  }
  const now=new Date().toISOString(),reviewer=['REVIEW','REJECT'].includes(action)?actor:null;
  const update=env.DB.prepare(`UPDATE maliks_pos_debtor_transaction_register
    SET status=?,version=version+1,updated_at=?,last_request_id=?,
    reviewed_by_email=CASE WHEN ? IS NOT NULL THEN ? ELSE reviewed_by_email END,
    reviewed_at=CASE WHEN ? IS NOT NULL THEN ? ELSE reviewed_at END,
    review_reason=CASE WHEN ?='REJECT' THEN ? ELSE review_reason END
    WHERE id=? AND lower(branch)=lower(?) AND version=? AND status=?
      AND NOT EXISTS(SELECT 1 FROM maliks_pos_debtor_transaction_audit WHERE request_id=?)`)
    .bind(next,now,rid,reviewer,reviewer,reviewer,now,action,reason,record_id,branch,record_version,record.status,rid);
  const audit=env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_debtor_transaction_audit
    (record_id,branch,kind,action,request_id,payload_hash,actor_email,actor_name,status_from,status_to,reason,created_at)
    SELECT id,branch,kind,?,?,?,?,?,?,?,?,? FROM maliks_pos_debtor_transaction_register
    WHERE id=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
    .bind(action,rid,hash,actor,name,record.status,next,reason,now,record_id,branch,record_version+1,rid);
  const out=await env.DB.batch([update,audit]);
  if(Number(out[0]?.meta?.changes)!==1)return fail('Record changed. Refresh and retry.',409);
  const saved=await env.DB.prepare(`SELECT * FROM maliks_pos_debtor_transaction_register WHERE id=? AND lower(branch)=lower(?)`)
    .bind(record_id,branch).first();
  return ok({record:parsed(saved),posting_enabled:false});
}
