import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {checkSimpleCheckout,confirmSimpleCheckout,listDispatch,listPayments} from '../src/payment-dispatch-domain.mjs';
import frontend from '../src/frontend.mjs';
const guid=n=>`73b5f01a-c1db-48cd-88c1-${String(n).padStart(12,'0')}`;
const ctx=(app,user,branches=['Buster Build'])=>({app,member:{email:user,name:user.split('@')[0]},branches});
const post=body=>new Request('https://tills.example.test/v1/payments/quick-confirm',{method:'POST',headers:{origin:'https://tills.example.test','x-maliks-original-origin':'https://tills.example.test'},body:JSON.stringify(body)});
const get=(path)=>new Request('https://tills.example.test'+path);
async function read(reply){return {status:reply.status,data:await reply.json()};}
function makeAdapter(db){const prepare=sql=>({bind:(...params)=>{const stmt=db.prepare(sql);return {run:async()=>({meta:{changes:Number(stmt.run(...params).changes)}}),first:async()=>stmt.get(...params)||null,all:async()=>({results:stmt.all(...params)})};}});return {prepare,batch:async stmts=>{db.exec('BEGIN');try{const r=[];for(const q of stmts)r.push(await q.run());db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};}
function setup(){const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');db.exec(`CREATE TABLE till_quotation_submissions(id INTEGER PRIMARY KEY,branch TEXT,total_cents INTEGER,net_cents INTEGER,vat_cents INTEGER,status TEXT,customer_name TEXT,customer_contact TEXT,lines_json TEXT,created_at TEXT);
CREATE TABLE maliks_till_shift_register(id INTEGER PRIMARY KEY,branch TEXT,till_code TEXT,opened_by_email TEXT,opened_by_name TEXT,status TEXT);`);
const lines=JSON.stringify([{name:'Cement',code:'CE01',quantity:1,unit:'bag',price_cents:78000,line_total_cents:78000}]);
db.prepare('INSERT INTO till_quotation_submissions VALUES(?,?,?,?,?,?,?,?,?,?)').run(8,'Buster Build',78000,67826,10174,'AWAITING_CASH_OFFICE','Walk-in','',''+lines,new Date().toISOString());
db.prepare('INSERT INTO maliks_till_shift_register VALUES(?,?,?,?,?,?)').run(2,'Buster Build','TILL-01','cashier@example.com','Cashier','OPEN');
for(const file of ['phase9_paid_sales_dispatch.sql','phase10_simple_cashier_checkout.sql']){const sql=readFileSync(new URL('../sql/'+file,import.meta.url),'utf8');db.exec(sql);db.exec(sql);}
return {db,env:{DB:makeAdapter(db)}};}
const original={request_id:guid(1),branch:'Buster Build',quotation_number:'Q-00000008',shift_id:2,method:'CASH',amount_paid_cents:80000,attestation:'CASH_RECEIVED'};
test('Cash/Card validation enforces exact card charge and cashier attestation',()=>{
 assert.equal(checkSimpleCheckout(original,78000).received,80000);
 assert.throws(()=>checkSimpleCheckout({...original,method:'CARD'},78000),/match|Confirm/);
 assert.throws(()=>checkSimpleCheckout({...original,method:'EFT'},78000),/Cash or Card/);
 assert.throws(()=>checkSimpleCheckout({...original,amount_paid_cents:70000},78000),/Cash received/);
 assert.equal(checkSimpleCheckout({...original,method:'CARD',attestation:'CARD_TERMINAL_APPROVED',amount_paid_cents:78000},78000).card,78000);
});
test('Cashier CASH confirmation atomically creates invoice, balanced ledger and dispatch job, once',async()=>{
 const {db,env}=setup(),user=ctx('tills','cashier@example.com');
 const response=await read(await confirmSimpleCheckout(post(original),env,user));
 assert.equal(response.status,200,JSON.stringify(response));
 assert.equal(response.data.status,'CONFIRMED');assert.equal(response.data.dispatch_queued,true);
 assert.equal(response.data.confirmation_source,'CASHIER_DECLARATION');assert.equal(response.data.change_cents,2000);
 assert.equal(response.data.invoice_number,'INV-000000001');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,1);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p10_cashier_confirmations').get().n,1);
 const sums=db.prepare('SELECT side,SUM(amount_cents) n FROM maliks_p9_journal_lines GROUP BY side ORDER BY side').all();
 assert.deepEqual(sums.map(x=>x.n),[78000,78000]);
 assert.equal((await read(await confirmSimpleCheckout(post(original),env,user))).status,200);
 assert.equal((await read(await confirmSimpleCheckout(post({...original,request_id:guid(2)}),env,user))).status,409);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_payments').get().n,1);
 const queue=await read(await listDispatch(get('/v1/dispatch-jobs?branch=Buster%20Build'),env,ctx('dispatch','picker@example.com')));
 assert.equal(queue.status,200);assert.equal(queue.data.jobs.length,1);
 const cashierQueue=await read(await listPayments(get('/v1/payments?branch=Buster%20Build'),env,user));
 assert.equal(cashierQueue.data.payments[0].cashier_confirmed,true);
 assert.equal(cashierQueue.data.payments[0].confirmation_method,'CASH');
});
test('Card confirmation goes straight to dispatch with cashier declaration, not bank integration',async()=>{
 const {db,env}=setup();const card={...original,method:'CARD',attestation:'CARD_TERMINAL_APPROVED',amount_paid_cents:78000};
 const reply=await read(await confirmSimpleCheckout(post(card),env,ctx('tills','cashier@example.com')));
 assert.equal(reply.status,200,JSON.stringify(reply));assert.equal(reply.data.change_cents,0);
 assert.equal(db.prepare('SELECT cash_cents,card_cents FROM maliks_p9_payments').get().card_cents,78000);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,1);
});
test('Wrong user, closed shift, other branch and malformed payment do not dispatch',async()=>{
 for(const [mod,user,branch] of [
  [{},ctx('cashoffice','cashier@example.com'),'Buster Build'],
  [{},ctx('tills','other@example.com'),'Buster Build'],
  [{branch:'Other'},ctx('tills','cashier@example.com'),'Other'],
  [{amount_paid_cents:100},ctx('tills','cashier@example.com'),'Buster Build'],
 ]){
  const {db,env}=setup();const reply=await read(await confirmSimpleCheckout(post({...original,...mod}),env,user));assert.notEqual(reply.status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM maliks_p9_dispatch_jobs').get().n,0);
 }
 const {db,env}=setup();db.exec("UPDATE maliks_till_shift_register SET status='CLOSED' WHERE id=2");
 assert.notEqual((await read(await confirmSimpleCheckout(post(original),env,ctx('tills','cashier@example.com')))).status,200);
});
test('Tills UI has simple two-field CASH/CARD checkout and backend proxy stays department restricted',async()=>{
 const html=await (await frontend.fetch(get('/'),{APP_TYPE:'tills'})).text();
 assert.match(html,/Payment — send straight to Dispatch/);assert.match(html,/Confirm Paid & Send to Dispatch/);
 assert.match(html,/\/api\/payments\/quick-confirm/);assert.doesNotMatch(html,/Submit payment to Cash Office/);
 const notAllowed=await frontend.fetch(new Request('https://pos.example.test/api/payments/quick-confirm',{method:'POST',headers:{origin:'https://pos.example.test'},body:'{}'}),{APP_TYPE:'pos'});
 assert.equal(notAllowed.status,403);
});
