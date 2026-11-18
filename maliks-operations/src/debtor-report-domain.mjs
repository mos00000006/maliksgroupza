// Phase 31 — branch-scoped, READ ONLY debtor reporting for Maliks POS Professional.
// Critical: registered transaction drafts are NOT posted receivables. Pilot sales
// journals are NOT a debtor subledger or a reconciled general ledger.
import {matchingBranch} from './policy.mjs';
import {canUseMaster} from './master-domain.mjs';

export const DEBTOR_REPORT_MODES=Object.freeze(['master','transactions','sales','ledger','statements','control','age','pdcs']);
const N=100;
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>json({error:message},status);
const money=v=>Number.isSafeInteger(v)?new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(v/100):'Not available';
const str=v=>String(v??'');
const safeDate=(s,label)=>{
  if(!s)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T12:00:00Z'))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)throw Error('Invalid '+label+' (YYYY-MM-DD).');
  return s;
};
const fmtDate=s=>s?String(s).slice(0,10):'—';
const safeJSON=s=>{try{const x=JSON.parse(s||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}};
const amount=v=>Number.isSafeInteger(Number(v))?money(Number(v)):'Not available';
const summary=(key,value)=>({key,value:String(value)});
const section=(name,columns,rows,more=false)=>({name,columns,rows,more});
const limit=(page)=>({sql:' LIMIT ? OFFSET ?',args:[N+1,(page-1)*N]});
const pageRows=(rows)=>({rows:rows.slice(0,N),more:rows.length>N});
async function query(db,sql,params,page){
 const paging=limit(page);const {results}=await db.prepare(sql+paging.sql).bind(...params,...paging.args).all();
 return pageRows(results||[]);
}
const filterCode=(q,fields)=>q?` AND (${fields.map(x=>`instr(lower(${x}),lower(?))>0`).join(' OR ')})`:'';
const searchArgs=(q,fields)=>q?fields.map(()=>q):[];
const dateClause=(field,from,to)=>`${from?` AND substr(${field},1,10)>=?`:''}${to?` AND substr(${field},1,10)<=?`:''}`;
const dateArgs=(from,to)=>[...(from?[from]:[]),...(to?[to]:[])];
const recordSummary=(label,rows)=>[summary(label+' shown',rows.length)];
const readyHeaders=['Account','Customer','Status','Credit limit (not balance)','Terms (days)','Contact','Email'];
const nonpostingNote='REGISTER ONLY — no payment, bank, invoice, debtor balance, VAT or general-ledger posting occurs from these transactions.';
const historicalNote='Opening balances, credit notes, debtor invoice allocations and a posted receivables subledger are not connected. Outstanding balances, statements, control-account reconciliation and ageing cannot be calculated accurately.';

function checkedParams(req,ctx){
 if(ctx.app!=='management'||!canUseMaster(ctx.member,'debtor'))throw Object.assign(Error('Debtors reporting permission required.'),{status:403});
 const p=new URL(req.url).searchParams;
 const branch=matchingBranch(ctx.branches,p.get('branch'));
 if(!branch)throw Object.assign(Error('Access denied to the requested branch.'),{status:403});
 const mode=str(p.get('mode')).toLowerCase();if(!DEBTOR_REPORT_MODES.includes(mode))throw Error('Choose a valid Debtors report.');
 const from=safeDate(p.get('from'),'start date'),to=safeDate(p.get('to'),'end date');
 if(from&&to&&from>to)throw Error('The start date cannot be after the end date.');
 const search=str(p.get('search')).trim();if(search.length>65||/[\x00-\x1f]/.test(search))throw Error('Invalid search (maximum 65 characters).');
 const page=Number(p.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>100)throw Error('Invalid page number.');
 return {branch,mode,from,to,search,page};
}

export async function getDebtorReport(req,env,ctx){
 let x;try{x=checkedParams(req,ctx);}catch(e){return fail(e.message,e.status||400);}
 const {branch,mode,from,to,search,page}=x,db=env.DB;
 const response={...x,source:'Maliks POS · Live read-only database query',generated_at:new Date().toISOString(),sections:[],summary:[],accounting_complete:false,financial_posting:false};
 try{
  if(mode==='master'){
   const fields=['code','name'];const where=filterCode(search,fields),r=await query(db,`SELECT code,name,active,details_json,updated_at FROM maliks_pos_master_records
     WHERE kind='debtor' AND lower(branch)=lower(?)${where} ORDER BY code`,[branch,...searchArgs(search,fields)],page);
   const rows=r.rows.map(a=>{const d=safeJSON(a.details_json);return [a.code,a.name,a.active?'Active':'Inactive',amount(d.credit_limit_cents),str(d.payment_terms_days??'—'),str(d.contact_name||'—'),str(d.email||'—')];});
   response.sections.push(section('Debtor master accounts',readyHeaders,rows,r.more));
   response.summary=recordSummary('Accounts',rows);response.disclaimer='Read-only debtor master details. Credit limits are NOT current balances; inactive accounts are shown for audit.';
  } else if(mode==='transactions'||mode==='pdcs'){
   const fields=['reference','debtor_code','description'];const where=filterCode(search,fields);const dateFilter=dateClause('event_date',from,to);
   const params=[branch,...(mode==='pdcs'?['PDC']:[]),...dateArgs(from,to),...searchArgs(search,fields)];
   const r=await query(db,`SELECT kind,reference,debtor_code,amount_cents,event_date,description,details_json,status,posted,created_by_email
     FROM maliks_pos_debtor_transaction_register WHERE lower(branch)=lower(?)${mode==='pdcs'?' AND kind=?':''}${dateFilter}${where} ORDER BY event_date DESC,id DESC`,params,page);
   const rows=r.rows.map(a=>{
     const d=safeJSON(a.details_json);
     if(mode==='pdcs')return [a.reference,a.debtor_code,fmtDate(a.event_date),str(d.cheque_date||'—'),str(d.bank||'—'),str(d.cheque_number||'—'),money(Number(a.amount_cents)),a.status,'NOT CLEARED'];
     return [fmtDate(a.event_date),a.kind,a.reference,a.debtor_code||'—',money(Number(a.amount_cents)),a.status,'NOT POSTED',a.created_by_email];
   });
   response.sections.push(section(mode==='pdcs'?'Post-dated cheque register':'All debtor transaction preparations',mode==='pdcs'?['Reference','Debtor','Received','Cheque date','Bank','Cheque #','Amount','Review status','Bank status']:['Date','Type','Reference','Debtor','Amount','Review status','Financial status','Created by'],rows,r.more));
   response.summary=recordSummary('Registers',rows);
   response.disclaimer=mode==='pdcs'?'PDC entries are registered, not deposited, presented, bank-confirmed or cleared. Review status does not mean clearance.':nonpostingNote;
  } else if(mode==='sales'){
   const invFields=['q.customer_name','q.customer_contact'];const filters=dateClause('i.issued_at',from,to);
   const paid=await query(db,`SELECT i.id,i.issued_at,q.customer_name,q.id AS quotation_id,i.net_cents,i.vat_cents,i.total_cents
     FROM maliks_p9_invoices i JOIN till_quotation_submissions q ON q.id=i.quotation_id
     JOIN maliks_p9_payments p ON p.id=i.payment_id AND p.status='CONFIRMED'
     WHERE lower(i.branch)=lower(?)${filters}${filterCode(search,invFields)} ORDER BY i.id DESC`,[branch,...dateArgs(from,to),...searchArgs(search,invFields)],page);
   response.sections.push(section('Confirmed internal sales invoices (pilot)', ['Date','Internal invoice','Quotation','Customer','Net','VAT','Total'],paid.rows.map(a=>[fmtDate(a.issued_at),'INV-'+String(a.id).padStart(8,'0'),'Q-'+String(a.quotation_id).padStart(8,'0'),a.customer_name,money(a.net_cents),money(a.vat_cents),money(a.total_cents)]),paid.more));
   const qs=['customer_name','customer_contact'];const r=await query(db,`SELECT id,created_at,customer_name,submitted_by_name,total_cents,status FROM till_quotation_submissions
     WHERE lower(branch)=lower(?)${dateClause('created_at',from,to)}${filterCode(search,qs)} ORDER BY id DESC`,[branch,...dateArgs(from,to),...searchArgs(search,qs)],page);
   response.sections.push(section('Submitted quotations — NOT revenue', ['Date','Quotation','Customer','Salesperson','Quote total','Status'],r.rows.map(a=>[fmtDate(a.created_at),'Q-'+String(a.id).padStart(8,'0'),a.customer_name,a.submitted_by_name,money(a.total_cents),a.status]),r.more));
   response.summary=[summary('Confirmed invoices shown',paid.rows.length),summary('Quotation records shown',r.rows.length),summary('Internal invoice value on this page',money(paid.rows.reduce((s,v)=>s+v.total_cents,0)))];
   response.disclaimer='Confirmed internal invoices are cashier/verification-confirmed pilot sales, not proof of card/EFT bank settlement or a compliant tax invoice. Quotations are NOT sales. Values are limited to the displayed page.';
  } else if(mode==='ledger'){
   const filt=dateClause('i.issued_at',from,to);
   const rows=await query(db,`SELECT i.issued_at,i.id AS invoice_id,j.account,j.side,j.amount_cents FROM maliks_p9_journal_lines j
     JOIN maliks_p9_invoices i ON i.id=j.invoice_id JOIN maliks_p9_payments p ON p.id=i.payment_id AND p.status='CONFIRMED'
     WHERE lower(i.branch)=lower(?)${filt}${filterCode(search,['j.account'])} ORDER BY i.id DESC,j.id DESC`,[branch,...dateArgs(from,to),...searchArgs(search,['j.account'])],page);
   response.sections.push(section('Internal invoice journal evidence (pilot)', ['Date','Invoice','Journal account','Side','Amount'],rows.rows.map(v=>[fmtDate(v.issued_at),'INV-'+String(v.invoice_id).padStart(8,'0'),v.account,v.side,money(v.amount_cents)]),rows.more));
   response.summary=recordSummary('Journal lines',rows.rows);
   response.disclaimer='PARTIAL JOURNAL EVIDENCE ONLY. These internal cash/card/EFT, revenue and VAT lines are not an imported General Ledger or a posted Debtors subledger. Do not use as a customer statement.';
  } else if(mode==='control'){
   const filt=dateClause('i.issued_at',from,to);
   const {results}=await db.prepare(`SELECT j.account,j.side,COUNT(*) AS line_count,SUM(j.amount_cents) AS total_cents FROM maliks_p9_journal_lines j
     JOIN maliks_p9_invoices i ON i.id=j.invoice_id JOIN maliks_p9_payments p ON p.id=i.payment_id AND p.status='CONFIRMED'
     WHERE lower(i.branch)=lower(?)${filt}${filterCode(search,['j.account'])} GROUP BY j.account,j.side ORDER BY j.account,j.side`).bind(branch,...dateArgs(from,to),...searchArgs(search,['j.account'])).all();
   const items=(results||[]).map(v=>[v.account,v.side,str(v.line_count),money(v.total_cents)]);
   response.sections.push(section('Pilot sales-journal control evidence — NOT debtor control reconciliation',['Account','DR/CR','Lines','Total'],items));
   const dr=(results||[]).filter(v=>v.side==='DR').reduce((s,v)=>s+Number(v.total_cents),0),cr=(results||[]).filter(v=>v.side==='CR').reduce((s,v)=>s+Number(v.total_cents),0);
   response.summary=[summary('Pilot DR',money(dr)),summary('Pilot CR',money(cr)),summary('Pilot difference (DR−CR)',money(dr-cr))];
   response.disclaimer='Not a reconciled Debtors Control Account. Only existing pilot sales-invoice journal lines are included; no opening balance, full AR ledger, debtor allocations, cash clearing or bank verification is available. A zero difference does not establish a reconciled account.';
  } else if(mode==='statements'||mode==='age'){
   // Do not invent balances or ageing bands without debtor-linked posted invoices.
   const fields=['m.code','m.name'];const q=await query(db,`SELECT m.code,m.name,m.active,m.details_json,
     (SELECT COUNT(*) FROM maliks_pos_debtor_transaction_register t WHERE lower(t.branch)=lower(m.branch)
      AND lower(t.debtor_code)=lower(m.code) AND t.status NOT IN ('CANCELLED','REJECTED')) AS unposted_count
     FROM maliks_pos_master_records m WHERE m.kind='debtor' AND lower(m.branch)=lower(?)${filterCode(search,fields)}
     ORDER BY m.code`,[branch,...searchArgs(search,fields)],page);
   const rows=q.rows.map(a=>{const d=safeJSON(a.details_json);return mode==='statements'?
     [a.code,a.name,str(d.payment_terms_days??'—'),amount(d.credit_limit_cents),str(a.unposted_count),'Not available — no posted AR ledger']:
     [a.code,a.name,str(d.payment_terms_days??'—'),str(a.unposted_count),'Not available','Not available'];});
   response.sections.push(section(mode==='statements'?'Debtor statement readiness (not an issued statement)':'Age-analysis readiness (not an aged debt balance)',mode==='statements'?['Account','Customer','Terms (days)','Credit limit (not balance)','Unposted requests','Outstanding balance']:['Account','Customer','Terms (days)','Unposted requests','Outstanding debt','Age band'],rows,q.more));
   response.summary=recordSummary('Debtor accounts',rows);
   response.disclaimer=historicalNote+' Any unposted requests shown are administrative records, not outstanding balances. This screen is a readiness register, not a financial statement.';
  }
  return json(response);
 }catch(e){
   console.error('Debtor report unavailable:',String(e?.message||'Unknown database error').slice(0,180));
   return fail('Debtors report unavailable. Check the required POS database migrations and private Core logs.',503);
 }
}
