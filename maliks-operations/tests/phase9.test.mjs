import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {checkTender,submitPayment,listPayments,verifyPayment,listDispatch,updateDispatch,getInvoice} from '../src/payment-dispatch-domain.mjs';
import frontend from '../src/frontend.mjs';

const guid=n=>`8df06a1d-5e30-4c08-8a08-${String(n).padStart(12,'0')}`;
const quote={id:1,branch:'Buster Build',total_cents:10000,net_cents:8696,vat_cents:1304,status:'AWAITING_CASH_OFFICE',customer_name:'Test Customer',customer_contact:'',lines_json:JSON.stringify([{name:'Cement',code:'CE01',quantity:1,unit:'bag',price_cents:10000,line_total_cents:10000}]),created_at:'2026-11-12T10:00:00.000Z'};
// Small D1 adapter backed by SQLite for real SQL transaction smoke testing.
function makeAdapter(db){
 const prepared=sql=>({bind:(...params)=>{
  const st=db.prepare(sql);return {run:async()=>({meta:{changes:Number(st.run(...params).changes)}}),first:async()=>st.get(...params)||null,all:async()=>({results:st.all(...params)})};
 }});
 return {prepare:prepared,batch:async stmts=>{db.exec('BEGIN');try{const arr=[];for(const st of stmts)arr.push(await st.run());db.exec('COMMIT');return arr;}catch(e){db.exec('ROLLBACK');throw e;}}};
}
function setup(){
 const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
 db.exec(`CREATE TABLE till_quotation_submissions(id INTEGER PRIMARY KEY,branch TEXT NOT NULL,total_cents INTEGER NOT NULL,net_cents INTEGER NOT NULL,vat_cents INTEGER NOT NULL,status TEXT,customer_name TEXT,customer_contact TEXT,lines_json TEXT,created_at TEXT);
 CREATE TABLE maliks_till_shift_register(id INTEGER PRIMARY KEY,branch TEXT,till_code TEXT,opened_by_email TEXT,opened_by_name TEXT,status TEXT);`);
 db.prepare('INSERT INTO till_quotation_submissions(id,branch,total_cents,net_cents,vat_cents,status,customer_name,customer_contact,lines_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
 .run(quote.id,quote.branch,quote.total_cents,quote.net_cents,quote.vat_cents,quote.status,quote.customer_name,quote.customer_contact,quote.lines_json,quote.created_at);
 db.prepare('INSERT INTO maliks_till_shift_register VALUES(1,?,?,?,?,?)').run('Buster Build','T01','cashier@example.com','Cashier','OPEN');
 const schema=readFileSync(new URL('../sql/phase9_paid_sales_dispatch.sql',import.meta.url),'utf8');db.exec(schema);db.exec(schema);
 return {db,env:{DB:makeAdapter(db)}};
}
const ctx=(app,user,branches=['Buster Build'])=>({app,member:{email:user,name:user.split('@')[0]},branches});
const post=(route,body)=>new Request('https://tills.example.test'+route,{method:'POST',headers:{origin:'https://tills.example.test','x-maliks-original-origin':'https://tills.example.test'},body:JSON.stringify(body)});
const get=(route)=>new Request('https://tills.example.test'+route);
const data=async response=>({status:response.status,body:await response.json()});
const payment={request_id:guid(1),branch:'Buster Build',quotation_number:'q000000001',shift_id:1,cash_cents:4000,cash_received_cents:5000,card_cents:3500,card_reference:'TERM-7850',eft_cents:2500,eft_reference:'EFT-4482'};

// Core validation tests
 test('valid split totals and references are required',()=>{
  assert.equal(checkTender(payment,10000).cash,4000);
  assert.throws(()=>checkTender({...payment,card_cents:3501},10000),/exact quotation total/);
  assert.throws(()=>checkTender({...payment,card_reference:'4111 1111 1111 1111'},10000),/terminal approval/);
  assert.throws(()=>checkTender({...payment,eft_reference:''},10000),/EFT reference/);
 });
 test('cashier submits once, duplicate quotation and different branch are rejected',async()=>{
  const {env,db}=setup(),cashier=ctx('tills','cashier@example.com');
  assert.equal((await data(await submitPayment(post('/v1/payments',payment),env,cashier))).status,200);
  assert.equal((await data(await submitPayment(post('/v1/payments',payment),env,cashier))).status,200);
  assert.equal((await data(await submitPayment(post('/v1/payments',{...payment,request_id:guid(3)}),env,cashier))).status,409);
  assert.equal((await data(await submitPayment(post('/v1/payments',{...payment,branch:'Other',request_id:guid(4)}),env,cashier))).status,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_payments').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,0);
 });
 test('independent Cash Office confirmation generates balanced posting and exactly one dispatch job',async()=>{
  const {env,db}=setup(),cashier=ctx('tills','cashier@example.com'),officer=ctx('cashoffice','officer@example.com');
  await submitPayment(post('/v1/payments',payment),env,cashier);
  const same=await data(await verifyPayment(post('/v1/payments/verify',{request_id:guid(2),branch:'Buster Build',payment_id:1,decision:'CONFIRMED',evidence_note:'cash counted; terminal approved; bank credit verified; statement evidence 01'}),env,ctx('cashoffice','cashier@example.com')));
  assert.equal(same.status,403);
  const insufficient=await data(await verifyPayment(post('/v1/payments/verify',{request_id:guid(2),branch:'Buster Build',payment_id:1,decision:'CONFIRMED',evidence_note:'looked okay'}),env,officer));
  assert.equal(insufficient.status,400);
  const approval={request_id:guid(2),branch:'Buster Build',payment_id:1,decision:'CONFIRMED',evidence_note:'cash counted; terminal approved; bank credit verified; statement evidence 01'};
  const response=await data(await verifyPayment(post('/v1/payments/verify',approval),env,officer));
  assert.equal(response.status,200,JSON.stringify(response.body));
  assert.equal(response.body.dispatch_queued,true);assert.equal(response.body.invoice_number,'INV-000000001');
  assert.equal((await data(await verifyPayment(post('/v1/payments/verify',approval),env,officer))).status,200);
  assert.equal((await data(await verifyPayment(post('/v1/payments/verify',{...approval,request_id:guid(5)}),env,officer))).status,409);
  const ledger=db.prepare("SELECT side,SUM(amount_cents) AS total FROM maliks_p9_journal_lines GROUP BY side ORDER BY side").all();
  assert.deepEqual(ledger.map(r=>r.total),[10000,10000]);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_invoices').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,1);
  const queue=await data(await listDispatch(get('/v1/dispatch-jobs?branch=Buster%20Build'),env,ctx('dispatch','picker@example.com')));
  assert.equal(queue.status,200);assert.equal(queue.body.jobs.length,1);assert.equal(queue.body.jobs[0].status,'AWAITING_PICK');
  const unauthorized=await data(await listDispatch(get('/v1/dispatch-jobs?branch=Buster%20Build'),env,ctx('tills','cashier@example.com')));assert.equal(unauthorized.status,403);
  const inv=await data(await getInvoice(get('/v1/invoices?branch=Buster%20Build&id=1'),env,cashier));
  assert.equal(inv.status,200);assert.match(inv.body.invoice.notice,/INTERNAL SALES INVOICE/);
  const pick={request_id:guid(8),branch:'Buster Build',job_id:1,action:'PICK',note:'Pallet at bay 2'};
  assert.equal((await data(await updateDispatch(post('/v1/dispatch-jobs/action',pick),env,ctx('dispatch','picker@example.com')))).status,200);
  const check={...pick,request_id:guid(9),action:'CHECK',note:'Checked line counts against invoice'};
  assert.equal((await data(await updateDispatch(post('/v1/dispatch-jobs/action',check),env,ctx('dispatch','picker@example.com')))).status,409);
  assert.equal((await data(await updateDispatch(post('/v1/dispatch-jobs/action',check),env,ctx('dispatch','checker@example.com')))).status,200);
  assert.equal(db.prepare("SELECT status FROM maliks_p9_dispatch_jobs WHERE id=1").get().status,'CHECKED');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_audit').get().n,2);
 });
 test('Cash Office rejection does not make invoice or dispatch job',async()=>{
  const {env,db}=setup();await submitPayment(post('/v1/payments',payment),env,ctx('tills','cashier@example.com'));
  const reply=await data(await verifyPayment(post('/v1/payments/verify',{request_id:guid(10),branch:'Buster Build',payment_id:1,decision:'REJECTED',evidence_note:'Bank credit not visible; request rejected.'}),env,ctx('cashoffice','reviewer@example.com')));
  assert.equal(reply.status,200);assert.equal(reply.body.dispatch_queued,false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_invoices').get().n,0);
 });
 test('deployed UI exposes cashier submit / cashoffice confirmation / Dispatch work queue but no stock posting',async()=>{
  for(const [app,phrase] of [['tills','Submit payment to Cash Office'],['cashoffice','Independent Payment Verification'],['dispatch','Paid invoices — Dispatch work queue']]){
   const html=await (await frontend.fetch(get('/'),{APP_TYPE:app})).text();
   assert.ok(html.includes(phrase),app);assert.match(html,/powerbuild-logo\.png/);
   assert.ok(!html.includes('POST STOCK DEDUCTION'),app);
  }
 });
