// Shift cash reconciliation based on recorded cashier-confirmed payments, not tender preparations.
// CASH_COUNT_CHECKED means the declared cash count matched the recorded shift cash;
 // it does not mean bank reconciliation, card settlement, Hub GL or physical deposit posting.
import { matchingBranch } from './policy.mjs';

const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const ok=(data,status=200)=>Response.json(data,{status,headers});
const denied=(message,status=403)=>ok({error:message},status);
const cent=v=>Number.isSafeInteger(v)&&v>=0&&v<=100_000_000_000;
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const safeNote=v=>typeof v==='string'&&v.trim().length>=3&&v.trim().length<=400&& !/[\u0000-\u001f\u007f]/.test(v);
export const CASHUP_RECONCILIATION_MODE='CASHIER_CONFIRMED_SHIFT_PAYMENTS';

export function cashupReconciliationQuery(branch,shiftId=null){
  if(typeof branch!=='string'||!branch.trim()||branch.length>150)throw Error('Select a branch.');
  const filter=shiftId===null?'':" AND id=?";
  return {sql:`WITH selected_shifts AS (
    SELECT * FROM maliks_till_shift_register WHERE lower(branch)=lower(?)${filter}
    ORDER BY id DESC LIMIT ${shiftId===null?'75':'1'}
  ), totals AS (
    SELECT s.id AS shift_id,s.branch,s.till_code,s.status,s.opened_by_name,s.opened_by_email,s.opened_at,
      s.closed_at,s.opening_float_cents,s.counted_cash_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0) AS cash_sales_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.card_cents ELSE 0 END),0) AS card_sales_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.eft_cents ELSE 0 END),0) AS eft_sales_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_received_cents-p.cash_cents ELSE 0 END),0) AS change_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN 1 ELSE 0 END),0) AS confirmed_count,
      COALESCE(SUM(CASE WHEN p.status='AWAITING_VERIFICATION' THEN 1 ELSE 0 END),0) AS pending_count,
      COALESCE(SUM(CASE WHEN p.status='REJECTED' THEN 1 ELSE 0 END),0) AS rejected_count
    FROM selected_shifts s LEFT JOIN maliks_p9_payments p
      ON p.shift_id=s.id AND lower(p.branch)=lower(s.branch)
    GROUP BY s.id
  ) SELECT t.*,r.decision AS last_review_decision,r.reviewer_name AS last_reviewed_by,
    r.reviewed_at AS last_reviewed_at,r.note AS last_review_note
    FROM totals t LEFT JOIN maliks_p22_cashup_reviews r ON r.id=(
      SELECT rr.id FROM maliks_p22_cashup_reviews rr
      WHERE rr.shift_id=t.shift_id AND lower(rr.branch)=lower(t.branch)
      ORDER BY rr.id DESC LIMIT 1)
    ORDER BY t.shift_id DESC`,params:shiftId===null?[branch]:[branch,shiftId]};
}
export function cashupReconciliationForClient(row){
  const expected=Number(row.opening_float_cents)+Number(row.cash_sales_cents);
  const closed=row.status==='CLOSED';
  if(!cent(expected)||!cent(row.opening_float_cents)||!cent(row.cash_sales_cents)||
     !cent(row.card_sales_cents)||!cent(row.eft_sales_cents)||!cent(row.pending_count)||
     !cent(row.confirmed_count)||!cent(row.rejected_count))throw Error('Invalid cash-up data.');
  if(closed&&!cent(row.counted_cash_cents))throw Error('Closing count not available.');
  const variance=closed?Number(row.counted_cash_cents)-expected:null;
  return {
    shift_id:row.shift_id,branch:row.branch,till_code:row.till_code,status:row.status,
    cashier_name:row.opened_by_name,cashier_email:row.opened_by_email,opened_at:row.opened_at,closed_at:row.closed_at,
    opening_float_cents:Number(row.opening_float_cents),
    confirmed_cash_sales_cents:Number(row.cash_sales_cents),
    confirmed_card_sales_cents:Number(row.card_sales_cents),
    confirmed_eft_sales_cents:Number(row.eft_sales_cents),
    cash_change_cents:Number(row.change_cents),
    confirmed_payment_count:Number(row.confirmed_count),
    pending_payment_count:Number(row.pending_count),
    rejected_payment_count:Number(row.rejected_count),
    expected_cash_cents:expected,
    counted_cash_cents:closed?Number(row.counted_cash_cents):null,
    variance_cents:variance,
    review_status:row.last_review_decision||'PENDING_CASH_OFFICE_REVIEW',
    reviewed_by:row.last_reviewed_by||null,
    reviewed_at:row.last_reviewed_at||null,
    review_note:row.last_review_note||null,
    bank_reconciled:false,card_settled:false,hub_general_ledger_posted:false,
  };
}
function authorised(context){return context.app==='cashoffice';}
async function readShift(env,branch,id){
  const q=cashupReconciliationQuery(branch,id);
  const row=await env.DB.prepare(q.sql).bind(...q.params).first();
  return row?cashupReconciliationForClient(row):null;
}
export async function listCashupReconciliations(req,env,context){
  if(!authorised(context))return denied('Cash Office only.');
  const branch=matchingBranch(context.branches,new URL(req.url).searchParams.get('branch'));
  if(!branch)return denied('Branch access denied.');
  const q=cashupReconciliationQuery(branch);
  const {results}=await env.DB.prepare(q.sql).bind(...q.params).all();
  return ok({branch,mode:CASHUP_RECONCILIATION_MODE,records:results.map(cashupReconciliationForClient),
    warning:'Shift cash count versus cashier-confirmed payment records only. Card payments are cashier-attested, not bank-settled. No deposit, Hub GL or stock postings.'});
}
export async function reviewCashupReconciliation(req,env,context){
  if(!authorised(context))return denied('Cash Office only.');
  if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))
    return denied('Invalid request origin.');
  let data;
  try{const raw=await req.text();if(raw.length>3000)throw Error();data=JSON.parse(raw);}
  catch{return denied('Invalid cash-up review request.',400);}
  const branch=matchingBranch(context.branches,data?.branch);
  const shiftId=data?.shift_id,decision=data?.decision,note=data?.note;
  if(!branch)return denied('Branch access denied.');
  if(!Number.isSafeInteger(shiftId)||shiftId<1||!uuid(data?.request_id)||
     !['CASH_COUNT_CHECKED','FLAGGED'].includes(decision)||!safeNote(note)||
     !cent(data?.expected_cash_cents)||!cent(data?.counted_cash_cents))
    return denied('Invalid review details or note (minimum 3 characters).',400);
  if(decision==='FLAGGED'&&note.trim().length<10)return denied('A flagged variance needs an explanation of at least 10 characters.',400);
  const reviewer=String(context.member.email||'').trim().toLowerCase();
  const prior=await env.DB.prepare('SELECT * FROM maliks_p22_cashup_reviews WHERE request_id=?')
    .bind(data.request_id).first();
  if(prior){
    if(prior.shift_id!==shiftId||prior.branch.toLowerCase()!==branch.toLowerCase()||
       prior.reviewer_email.toLowerCase()!==reviewer||prior.decision!==decision||prior.note!==note.trim()||
       prior.expected_cash_cents!==data.expected_cash_cents||prior.counted_cash_cents!==data.counted_cash_cents)
      return denied('Review request ID already used.',409);
    return ok({record_id:prior.id,duplicate:true,decision:prior.decision});
  }
  const record=await readShift(env,branch,shiftId);
  if(!record)return denied('Shift not found for your branch.',404);
  if(record.status!=='CLOSED')return denied('Cash-Up is available after the cashier closes the shift.',409);
  if(reviewer===String(record.cashier_email||'').toLowerCase()){
    // Cashier identity is independently checked below in SQL as well.
    return denied('A cashier cannot check their own cash-up.',403);
  }
  if(record.expected_cash_cents!==data.expected_cash_cents||record.counted_cash_cents!==data.counted_cash_cents)
    return denied('Cash-Up values have changed. Refresh before review.',409);
  if(decision==='CASH_COUNT_CHECKED'&&(record.variance_cents!==0||record.pending_payment_count!==0))
    return denied('Cannot mark a cash-up checked with a variance or pending payments.',409);
  if(record.review_status==='CASH_COUNT_CHECKED')return denied('This cash count has already been checked. Do not overwrite its audit.',409);
  const at=new Date().toISOString();
  // Revalidate state and cashier independence in the single INSERT statement.
  // A checked result cannot be created while a pending payment or variance exists.
  const sql=`INSERT OR IGNORE INTO maliks_p22_cashup_reviews
    (request_id,branch,shift_id,decision,opening_float_cents,confirmed_cash_sales_cents,
     expected_cash_cents,counted_cash_cents,variance_cents,pending_payment_count,reviewer_email,reviewer_name,note,reviewed_at)
    SELECT ?,s.branch,s.id,?,s.opening_float_cents,
      COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0),
      s.opening_float_cents+COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0),
      s.counted_cash_cents,
      s.counted_cash_cents-s.opening_float_cents-COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0),
      COALESCE(SUM(CASE WHEN p.status='AWAITING_VERIFICATION' THEN 1 ELSE 0 END),0),?,?,?,?
    FROM maliks_till_shift_register s
    LEFT JOIN maliks_p9_payments p ON p.shift_id=s.id AND lower(p.branch)=lower(s.branch)
    WHERE s.id=? AND lower(s.branch)=lower(?) AND s.status='CLOSED'
      AND lower(s.opened_by_email)<>lower(?)
      AND NOT EXISTS(SELECT 1 FROM maliks_p22_cashup_reviews rr WHERE rr.shift_id=s.id
                     AND rr.decision='CASH_COUNT_CHECKED')
    GROUP BY s.id
    HAVING s.opening_float_cents+COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0)=?
      AND s.counted_cash_cents=?
      AND (?='FLAGGED' OR (s.counted_cash_cents=s.opening_float_cents+
        COALESCE(SUM(CASE WHEN p.status='CONFIRMED' THEN p.cash_cents ELSE 0 END),0)
        AND COALESCE(SUM(CASE WHEN p.status='AWAITING_VERIFICATION' THEN 1 ELSE 0 END),0)=0))`;
  try {
    const result=await env.DB.prepare(sql).bind(
      data.request_id,decision,reviewer,context.member.name,note.trim(),at,
      shiftId,branch,reviewer,data.expected_cash_cents,data.counted_cash_cents,decision).run();
    if(Number(result.meta?.changes)!==1)return denied('Cash-Up changed or was already checked. Refresh before reviewing.',409);
  }catch(e){return denied('Could not record the cash-up. Check that the Phase 22 migration has been applied.',503);}
  const saved=await env.DB.prepare('SELECT id,decision,reviewed_at FROM maliks_p22_cashup_reviews WHERE request_id=?').bind(data.request_id).first();
  return ok({record_id:saved.id,decision:saved.decision,reviewed_at:saved.reviewed_at,
    message:'Cash Office review recorded. No bank, deposit, Hub GL, stock or invoice posting occurred.'});
}
