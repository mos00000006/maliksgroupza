import { quoteId } from './quote-domain.mjs';
import { matchingBranch } from './policy.mjs';

const noStore={'cache-control':'no-store','x-content-type-options':'nosniff'};
const ok=(data,status=200)=>Response.json(data,{status,headers:noStore});
const deny=(message,status=403)=>Response.json({error:message},{status,headers:noStore});
const num=(v)=>Number.isSafeInteger(v)&&v>=0&&v<=1_000_000_000;
const email=(v)=>String(v||'').trim().toLowerCase();
const now=()=>new Date().toISOString();
const uuid=(v)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const reference=(v)=>typeof v==='string'&&v.trim().length>=3&&v.trim().length<=65&&!/(?:\d[ -]?){13,19}/.test(v);
const safeText=(v,max=400)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
const originOk=(req)=>req.headers.get('origin') && req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const invoiceNumber=(id)=>'INV-'+String(id).padStart(9,'0');
function toPayment(row){return {id:row.id,quotation_number:'Q-'+String(row.quotation_id).padStart(8,'0'),branch:row.branch,shift_id:row.shift_id,created_at:row.created_at,status:row.status,
 cashier_name:row.cashier_name,invoice_id:row.invoice_id||null,invoice_number:row.invoice_id?invoiceNumber(row.invoice_id):null,reviewer_name:row.reviewed_by_name||null,review_note:row.review_note||null,cash_cents:row.cash_cents,cash_received_cents:row.cash_received_cents,change_cents:row.cash_received_cents-row.cash_cents,
 card_cents:row.card_cents,card_reference:row.card_reference,eft_cents:row.eft_cents,eft_reference:row.eft_reference,total_cents:row.total_cents};}
function toJob(row){return {id:row.id,branch:row.branch,status:row.status,invoice_number:invoiceNumber(row.invoice_id),quotation_number:'Q-'+String(row.quotation_id).padStart(8,'0'),customer_name:row.customer_name,
 customer_contact:row.customer_contact,created_at:row.created_at,lines:JSON.parse(row.lines_json),total_cents:row.total_cents,picker_name:row.picker_name,checker_name:row.checker_name,notes:row.notes};}
const byBranch=(context,supplied)=>matchingBranch(context.branches,supplied);
const getInput=async(req,max=3500)=>{const raw=await req.text();if(raw.length>max)throw Error('Request too large.');const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid request.');return body;};
export function checkTender(body,total){
 const cash=body.cash_cents,received=body.cash_received_cents,card=body.card_cents,eft=body.eft_cents;
 if(![cash,received,card,eft,total].every(num)||total<=0||cash+card+eft!==total)throw Error('Cash, card and EFT must equal the exact quotation total.');
 if(received<cash || (cash===0&&received!==0) || received-cash>100_000_000)throw Error('Incorrect cash received or change.');
 if(card>0&&!reference(body.card_reference))throw Error('A valid terminal approval reference is required (never enter a card number).');
 if(eft>0&&!reference(body.eft_reference))throw Error('A valid EFT reference is required.');
 if(card===0&&String(body.card_reference||'').trim())throw Error('Card reference without a card amount.');
 if(eft===0&&String(body.eft_reference||'').trim())throw Error('EFT reference without an EFT amount.');
 if(!uuid(body.request_id))throw Error('Invalid submission ID.');
 if(!Number.isSafeInteger(body.shift_id)||body.shift_id<=0)throw Error('Open till shift required.');
 return {request_id:body.request_id,shift_id:body.shift_id,cash,received,card,eft,cardRef:(body.card_reference||'').trim(),eftRef:(body.eft_reference||'').trim(),total};
}
export async function submitPayment(req,env,context){
 if(context.app!=='tills')return deny('Tills only.');
 if(!originOk(req))return deny('Invalid request origin.');
 let body;try{body=await getInput(req);}catch{return deny('Invalid payment request.',400);}
 const branch=byBranch(context,body.branch),id=quoteId(body.quotation_number);
 if(!branch||!id)return deny('Invalid branch or quotation.',400);
 const quote=await env.DB.prepare('SELECT id,total_cents,status FROM till_quotation_submissions WHERE id=? AND lower(branch)=lower(?)').bind(id,branch).first();
 if(!quote)return deny('Quotation not found.',404);
 let v;try{v=checkTender(body,quote.total_cents);}catch(e){return deny(e.message,400);}
 const cashier=email(context.member.email),created=now();
 // SQL atomic guard: only the current cashier with an OPEN till shift may submit.
 await env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_payments
 (request_id,quotation_id,branch,shift_id,cashier_email,cashier_name,cash_cents,cash_received_cents,card_cents,card_reference,eft_cents,eft_reference,total_cents,created_at)
 SELECT ?,q.id,q.branch,s.id,?,?,?,?,?,?,?,?,?,? FROM till_quotation_submissions q JOIN maliks_till_shift_register s
 ON s.id=? AND lower(s.branch)=lower(q.branch) AND lower(s.opened_by_email)=lower(?) AND s.status='OPEN'
 WHERE q.id=? AND lower(q.branch)=lower(?) AND q.total_cents=?`)
 .bind(v.request_id,cashier,context.member.name,v.cash,v.received,v.card,v.cardRef,v.eft,v.eftRef,v.total,created,v.shift_id,cashier,id,branch,v.total).run();
 const saved=await env.DB.prepare('SELECT * FROM maliks_p9_payments WHERE request_id=?').bind(v.request_id).first();
 if(!saved)return deny('An open shift is required, or this quotation already has a payment request.',409);
 if(saved.quotation_id!==id||email(saved.cashier_email)!==cashier||saved.branch.toLowerCase()!==branch.toLowerCase()||saved.shift_id!==v.shift_id||
  saved.cash_cents!==v.cash||saved.cash_received_cents!==v.received||saved.card_cents!==v.card||saved.eft_cents!==v.eft||saved.total_cents!==v.total||saved.card_reference!==v.cardRef||saved.eft_reference!==v.eftRef)return deny('Submission ID already used with different data.',409);
 return ok({payment:toPayment(saved),dispatch_released:false,message:'Pending independent Cash Office confirmation. Goods are NOT released.'});
}
export async function listPayments(req,env,context){
 if(!['tills','cashoffice'].includes(context.app))return deny('Department denied.');
 const branch=byBranch(context,new URL(req.url).searchParams.get('branch'));if(!branch)return deny('Branch denied.');
 const cashier=context.app==='tills'?email(context.member.email):null;
 const sql=`SELECT p.*,i.id AS invoice_id FROM maliks_p9_payments p LEFT JOIN maliks_p9_invoices i ON i.payment_id=p.id WHERE lower(p.branch)=lower(?) ${cashier?'AND lower(p.cashier_email)=lower(?)':''} ORDER BY p.id DESC LIMIT 80`;
 const {results}=await env.DB.prepare(sql).bind(...(cashier?[branch,cashier]:[branch])).all();
 return ok({payments:results.map(toPayment)});
}
export async function verifyPayment(req,env,context){
 if(context.app!=='cashoffice')return deny('Cash Office only.');
 if(!originOk(req))return deny('Invalid request origin.');
 let body;try{body=await getInput(req);}catch{return deny('Invalid review request.',400);}
 const branch=byBranch(context,body.branch);
 const id=Number(body.payment_id),decision=body.decision,reviewer=email(context.member.email);
 if(!branch||!Number.isSafeInteger(id)||id<=0||!uuid(body.request_id)||!['CONFIRMED','REJECTED'].includes(decision)||!safeText(body.evidence_note,500))return deny('Invalid review.',400);
 const record=await env.DB.prepare(`SELECT p.*,q.net_cents,q.vat_cents FROM maliks_p9_payments p JOIN till_quotation_submissions q ON q.id=p.quotation_id
 WHERE p.id=? AND lower(p.branch)=lower(?)`).bind(id,branch).first();
 if(!record)return deny('Payment not found.',404);
 if(email(record.cashier_email)===reviewer)return deny('Cashier cannot verify their own transaction.',403);
 if(decision==='CONFIRMED'){
   const confirmations=String(body.evidence_note).toLowerCase();
   if(record.cash_cents && !confirmations.includes('cash counted'))return deny('Cash: evidence note must include "cash counted" after physical count.',400);
   if(record.card_cents && !confirmations.includes('terminal approved'))return deny('Card: evidence note must include "terminal approved" after independent terminal review.',400);
   if(record.eft_cents && !confirmations.includes('bank credit verified'))return deny('EFT: evidence note must include "bank credit verified" after independently seeing funds in bank.',400);
 }
 const stamp=now();
 // D1 batch is transactional: reviewer decision, approved payment, numbered internal invoice,
 // balanced journal lines, and Dispatch job are committed or rolled back together.
 const statements=[
 env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_payment_decisions
   (request_id,payment_id,decision,evidence_note,reviewer_email,reviewer_name,created_at)
   SELECT ?,p.id,?,?,?,?,? FROM maliks_p9_payments p WHERE p.id=? AND lower(p.branch)=lower(?)
   AND p.status='AWAITING_VERIFICATION' AND lower(p.cashier_email)<>lower(?)`)
   .bind(body.request_id,decision,body.evidence_note.trim(),reviewer,context.member.name,stamp,id,branch,reviewer),
 env.DB.prepare(`UPDATE maliks_p9_payments SET status=?,reviewed_by_email=?,reviewed_by_name=?,reviewed_at=?,review_note=?
   WHERE id=? AND status='AWAITING_VERIFICATION' AND lower(branch)=lower(?)
   AND EXISTS(SELECT 1 FROM maliks_p9_payment_decisions d WHERE d.payment_id=maliks_p9_payments.id AND d.request_id=? AND d.decision=? AND d.reviewer_email=?)`)
   .bind(decision,reviewer,context.member.name,stamp,body.evidence_note.trim(),id,branch,body.request_id,decision,reviewer),
 env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_invoices (payment_id,quotation_id,branch,total_cents,net_cents,vat_cents,issued_at,issued_by_email)
   SELECT p.id,p.quotation_id,p.branch,p.total_cents,q.net_cents,q.vat_cents,?,? FROM maliks_p9_payments p JOIN till_quotation_submissions q ON q.id=p.quotation_id
   JOIN maliks_p9_payment_decisions d ON d.payment_id=p.id
   WHERE p.id=? AND p.status='CONFIRMED' AND d.request_id=? AND d.decision='CONFIRMED'`)
   .bind(stamp,reviewer,id,body.request_id),
 env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_dispatch_jobs (invoice_id,quotation_id,branch,created_at)
   SELECT i.id,i.quotation_id,i.branch,? FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id
   JOIN maliks_p9_payment_decisions d ON d.payment_id=p.id WHERE p.id=? AND p.status='CONFIRMED' AND d.request_id=? AND d.decision='CONFIRMED'`)
   .bind(stamp,id,body.request_id),
 ];
 // Balanced internal posting. These ARE NOT posted to the Hub's general ledger.
 for(const [account,side,field] of [['CASH_CONTROL','DR','cash_cents'],['CARD_CLEARING','DR','card_cents'],['EFT_CLEARING','DR','eft_cents']]){
  statements.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_journal_lines (invoice_id,account,side,amount_cents)
    SELECT i.id,?,?,p.${field} FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id
    JOIN maliks_p9_payment_decisions d ON d.payment_id=p.id WHERE p.id=? AND p.status='CONFIRMED' AND p.${field}>0 AND d.request_id=?`)
    .bind(account,side,id,body.request_id));
 }
 for(const [account,field] of [['SALES_REVENUE','net_cents'],['OUTPUT_VAT','vat_cents']]){
  statements.push(env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_journal_lines (invoice_id,account,side,amount_cents)
    SELECT i.id,?,'CR',i.${field} FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id
    JOIN maliks_p9_payment_decisions d ON d.payment_id=p.id WHERE p.id=? AND p.status='CONFIRMED' AND i.${field}>0 AND d.request_id=?`)
   .bind(account,id,body.request_id));
 }
 await env.DB.batch(statements);
 const saved=await env.DB.prepare('SELECT * FROM maliks_p9_payment_decisions WHERE request_id=?').bind(body.request_id).first();
 if(!saved||saved.payment_id!==id||saved.decision!==decision||email(saved.reviewer_email)!==reviewer||saved.evidence_note!==body.evidence_note.trim())return deny('Already reviewed by another request; refresh the queue.',409);
 const invoice=decision==='CONFIRMED'?await env.DB.prepare('SELECT id FROM maliks_p9_invoices WHERE payment_id=?').bind(id).first():null;
 return ok({status:decision,invoice_number:invoice?invoiceNumber(invoice.id):null,dispatch_queued:!!invoice,warning:'Internal sales invoice, not automatically a compliant VAT tax invoice. No inventory deduction or bank integration.'});
}
export async function listDispatch(req,env,context){
 if(context.app!=='dispatch')return deny('Dispatch only.');
 const branch=byBranch(context,new URL(req.url).searchParams.get('branch'));if(!branch)return deny('Branch denied.');
 const {results}=await env.DB.prepare(`SELECT j.*,q.customer_name,q.customer_contact,q.lines_json,i.total_cents FROM maliks_p9_dispatch_jobs j
 JOIN maliks_p9_invoices i ON i.id=j.invoice_id JOIN till_quotation_submissions q ON q.id=j.quotation_id
 JOIN maliks_p9_payments p ON p.id=i.payment_id WHERE lower(j.branch)=lower(?) AND p.status='CONFIRMED' ORDER BY j.id DESC LIMIT 100`).bind(branch).all();
 return ok({jobs:results.map(toJob)});
}
export async function updateDispatch(req,env,context){
 if(context.app!=='dispatch')return deny('Dispatch only.');
 if(!originOk(req))return deny('Invalid request origin.');
 let body;try{body=await getInput(req);}catch{return deny('Invalid dispatch action.',400);}
 const branch=byBranch(context,body.branch),id=Number(body.job_id),act=body.action,actor=email(context.member.email);
 if(!branch||!uuid(body.request_id)||!Number.isSafeInteger(id)||id<=0||!['PICK','CHECK'].includes(act)||!safeText(body.note,250))return deny('Invalid dispatch action.',400);
 const next=act==='PICK'?'PICKED':'CHECKED',previous=act==='PICK'?'AWAITING_PICK':'PICKED';
 const checkedGuard=act==='CHECK'?'AND lower(picker_email)<>lower(?)':'';
 const sql=`UPDATE maliks_p9_dispatch_jobs SET status=?,last_action_request_id=?,notes=?,
   ${act==='PICK'?'picker_email=?,picker_name=?,picked_at=?':'checker_email=?,checker_name=?,checked_at=?'}
   WHERE id=? AND lower(branch)=lower(?) AND status=? ${checkedGuard}
   AND EXISTS(SELECT 1 FROM maliks_p9_invoices i JOIN maliks_p9_payments p ON p.id=i.payment_id WHERE i.id=maliks_p9_dispatch_jobs.invoice_id AND p.status='CONFIRMED')`;
 const params=[next,body.request_id,body.note.trim(),actor,context.member.name,now(),id,branch,previous,...(act==='CHECK'?[actor]:[])];
 // Mutation + append-only audit must commit together.
 await env.DB.batch([
   env.DB.prepare(sql).bind(...params),
   env.DB.prepare(`INSERT OR IGNORE INTO maliks_p9_dispatch_audit (request_id,job_id,action,actor_email,actor_name,note,created_at)
    SELECT ?,id,?,?,?,?,? FROM maliks_p9_dispatch_jobs WHERE id=? AND lower(branch)=lower(?) AND status=? AND last_action_request_id=?`)
     .bind(body.request_id,act,actor,context.member.name,body.note.trim(),now(),id,branch,next,body.request_id)
 ]);
 const audit=await env.DB.prepare('SELECT * FROM maliks_p9_dispatch_audit WHERE request_id=?').bind(body.request_id).first();
 if(!audit||audit.job_id!==id||audit.action!==act||audit.actor_email!==actor||audit.note!==body.note.trim())return deny('Job status changed or independent checker required. Refresh.',409);
 return ok({job_id:id,status:next,stock_posted:false,goods_released:false});
}
export async function getInvoice(req,env,context){
 if(!['tills','cashoffice','dispatch'].includes(context.app))return deny('Not authorised.');
 const qs=new URL(req.url).searchParams,branch=byBranch(context,qs.get('branch'));
 if(!branch)return deny('Branch denied.');
 const id=Number(qs.get('id'));if(!Number.isSafeInteger(id)||id<=0)return deny('Invalid invoice ID.',400);
 const invoice=await env.DB.prepare(`SELECT i.*,q.customer_name,q.customer_contact,q.lines_json,q.created_at AS quote_date,p.cashier_email,p.cashier_name,p.card_reference,p.eft_reference
 FROM maliks_p9_invoices i JOIN till_quotation_submissions q ON q.id=i.quotation_id JOIN maliks_p9_payments p ON p.id=i.payment_id
 WHERE i.id=? AND lower(i.branch)=lower(?) AND p.status='CONFIRMED'`).bind(id,branch).first();
 if(!invoice)return deny('Invoice not found.',404);
 if(context.app==='tills'&&email(invoice.cashier_email)!==email(context.member.email))return deny('Cashier can only view their own invoices.',403);
 return ok({invoice:{number:invoiceNumber(invoice.id),id:invoice.id,branch,customer_name:invoice.customer_name,customer_contact:invoice.customer_contact,
 lines:JSON.parse(invoice.lines_json),net_cents:invoice.net_cents,vat_cents:invoice.vat_cents,total_cents:invoice.total_cents,issued_at:invoice.issued_at,
 notice:'INTERNAL SALES INVOICE — not a validated statutory VAT tax invoice. Confirm legal seller details before customer tax invoice use.'}});
}
