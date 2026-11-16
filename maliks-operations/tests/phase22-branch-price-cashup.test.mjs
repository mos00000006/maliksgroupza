
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {listMasterRecords,saveMasterRecord,syncStockCatalogue} from '../src/master-domain.mjs';
import {listCashupReconciliations,reviewCashupReconciliation,CASHUP_RECONCILIATION_MODE} from '../src/cashup-reconciliation-domain.mjs';
import frontend from '../src/frontend.mjs';
const uid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const owner={name:'Manager',email:'manager@maliks.test',active:1,role:'Store Manager',access_scope:'Assigned workspace'};
const stocker={...owner,name:'Stock Controller',email:'stock@maliks.test',role:'Stock Controller'};
const cashoffice={name:'Cash Officer',email:'cashoffice@maliks.test',active:1,role:'Finance Manager'};
const context=(app,branch,member=owner)=>({app,branches:[branch],member});
const origin='https://pos.test';
const req=(path)=>new Request(origin+path);
const post=(path,data,reqOrigin=origin)=>new Request(origin+path,{method:'POST',headers:{origin:reqOrigin,'x-maliks-original-origin':origin},body:JSON.stringify(data)});
class D1 {
 constructor(){
   this.sqlite=new DatabaseSync(':memory:');
   for(const file of ['phase15_master_files.sql','phase4_till_shift_register.sql',
     'phase9_paid_sales_dispatch.sql','phase22_cashup_reconciliation.sql']){
     this.sqlite.exec(readFileSync(new URL('../sql/'+file,import.meta.url),'utf8'));
   }
   this.sqlite.exec(`CREATE TABLE till_quotation_submissions (id INTEGER PRIMARY KEY);
   INSERT INTO till_quotation_submissions(id) VALUES (1),(2),(3);
   CREATE TABLE maliks_pos_stock_balances (branch TEXT NOT NULL COLLATE NOCASE, stock_master_id INTEGER NOT NULL, qty_milli INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, PRIMARY KEY(branch,stock_master_id));
   CREATE TABLE catalogue_products(id INTEGER PRIMARY KEY,code TEXT UNIQUE,name TEXT,category TEXT,active INTEGER,updated_at TEXT);
   CREATE TABLE powerbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
   CREATE TABLE busterbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
   CREATE TABLE price_tag_branch_prices(brand TEXT NOT NULL,product_id INTEGER NOT NULL,
     branch_name TEXT NOT NULL,price_cents INTEGER NOT NULL,updated_by TEXT,updated_at TEXT,
     PRIMARY KEY(brand,product_id,branch_name));`);
   this.sqlite.exec("INSERT INTO catalogue_products VALUES (1,'ITEM001','Hardware Item','Hardware',1,'2026-11-16');");
 }
 prepare(sql){const db=this.sqlite;let params=[];return {bind(...args){params=args;return this;},
     first(){return db.prepare(sql).get(...params)||null;},
     all(){return {results:db.prepare(sql).all(...params)};},
     run(){const x=db.prepare(sql).run(...params);return {meta:{changes:Number(x.changes)}};}};}
 batch(stmts){this.sqlite.exec('BEGIN');try{const x=stmts.map(s=>s.run());this.sqlite.exec('COMMIT');return x;}
   catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
test('Branch manager can set initially R0 selling price and save branch override with audit',async()=>{
  const env={DB:new D1()};
  for(const [branch,n] of [['Branch A',1],['Branch B',2]]){
    const r=await syncStockCatalogue(post('/v1/master/catalogue/sync',{branch,request_id:uid(n)}),env,context('management',branch));
    assert.equal(r.status,200,await r.text());
  }
  const before=await (await listMasterRecords(req('/v1/master/records?kind=stock&branch=Branch%20A'),env,context('management','Branch A'))).json();
  const record=before.records[0];
  assert.equal(record.details.selling_price_cents,0);
  const modified={request_id:uid(11),kind:'stock',branch:'Branch A',code:record.code,name:record.name,
    active:true,id:record.id,version:record.version,details:{...record.details,selling_price_cents:12995},
    price_update:true,expected_selling_price_cents:0};
  const saved=await saveMasterRecord(post('/v1/master/records',modified),env,context('management','Branch A'));
  assert.equal(saved.status,200,await saved.text());
  const newPrice=env.DB.sqlite.prepare("SELECT price_cents FROM price_tag_branch_prices WHERE branch_name='Branch A'").get();
  assert.equal(newPrice.price_cents,12995);
  const after=await (await listMasterRecords(req('/v1/master/records?kind=stock&branch=Branch%20A'),env,context('management','Branch A'))).json();
  assert.equal(after.records[0].details.selling_price_cents,12995);
  assert.equal(after.records[0].price_available,true,'branch price becomes visible even without price tag');
  const b=await (await listMasterRecords(req('/v1/master/records?kind=stock&branch=Branch%20B'),env,context('management','Branch B'))).json();
  assert.equal(b.records[0].details.selling_price_cents,0,'other branch price unaffected');
  const audit=env.DB.sqlite.prepare("SELECT after_json FROM maliks_pos_master_audit WHERE action='UPDATE'").get();
  assert.equal(JSON.parse(audit.after_json).details.selling_price_cents,12995);
  const stale=await saveMasterRecord(post('/v1/master/records',{...modified,request_id:uid(12)}),env,context('management','Branch A'));
  assert.equal(stale.status,409);
});
test('Stock controller may edit stock settings but cannot change prices',async()=>{
 const env={DB:new D1()};
 await syncStockCatalogue(post('/v1/master/catalogue/sync',{branch:'Branch A',request_id:uid(22)}),env,context('management','Branch A'));
 const record=(await (await listMasterRecords(req('/v1/master/records?kind=stock&branch=Branch%20A'),env,context('management','Branch A'))).json()).records[0];
 const request={request_id:uid(23),kind:'stock',branch:'Branch A',code:record.code,name:record.name,active:true,
   details:{...record.details,selling_price_cents:4999},price_update:true,expected_selling_price_cents:0,id:record.id,version:record.version};
 const response=await saveMasterRecord(post('/v1/master/records',request),env,context('management','Branch A',stocker));
 assert.equal(response.status,403);
 assert.equal(env.DB.sqlite.prepare('SELECT count(*) as n FROM price_tag_branch_prices').get().n,0);
});
function seedShift(db){
  db.sqlite.prepare(`INSERT INTO maliks_till_shift_register
    (open_request_id,branch,till_code,opened_by_email,opened_by_name,opening_float_cents,opened_at,status,
     counted_cash_cents,closed_by_email,closed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uid(30),'Branch A','TILL01','cashier@maliks.test','Cashier',5000,'2026-11-16T07:00:00Z','CLOSED',27000,'cashier@maliks.test','2026-11-16T17:00:00Z');
  const add=(id,quote,amtCash,amtCard,st,amtReceived)=>db.sqlite.prepare(`INSERT INTO maliks_p9_payments
   (request_id,quotation_id,branch,shift_id,cashier_email,cashier_name,cash_cents,cash_received_cents,
    card_cents,eft_cents,total_cents,status,created_at)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(uid(id),quote,'Branch A',1,'cashier@maliks.test','Cashier',amtCash,amtReceived,amtCard,0,
      amtCash+amtCard,st,'2026-11-16T12:00:00Z');
  add(31,1,22000,0,'CONFIRMED',30000); // R80 change excluded from till cash
  add(32,2,0,13500,'CONFIRMED',0);
  add(33,3,500,0,'AWAITING_VERIFICATION',500);
}
test('Cash-Up sums confirmed transactions and blocks premature cash-count check',async()=>{
 const env={DB:new D1()};seedShift(env.DB);
 const result=await listCashupReconciliations(req('/v1/cashup-reconciliation?branch=Branch%20A'),env,context('cashoffice','Branch A',cashoffice));
 assert.equal(result.status,200);
 const data=await result.json();assert.equal(data.mode,CASHUP_RECONCILIATION_MODE);
 const row=data.records[0];
 assert.equal(row.expected_cash_cents,27000);
 assert.equal(row.confirmed_cash_sales_cents,22000);
 assert.equal(row.confirmed_card_sales_cents,13500);
 assert.equal(row.cash_change_cents,8000);
 assert.equal(row.counted_cash_cents,27000);
 assert.equal(row.variance_cents,0);
 assert.equal(row.pending_payment_count,1);
 assert.equal(row.bank_reconciled,false);
 let payload={request_id:uid(34),branch:'Branch A',shift_id:row.shift_id,decision:'CASH_COUNT_CHECKED',
   note:'Cash physically counted',expected_cash_cents:row.expected_cash_cents,counted_cash_cents:row.counted_cash_cents};
 const pending=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload),env,context('cashoffice','Branch A',cashoffice));
 assert.equal(pending.status,409);
 const another=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload),env,context('cashoffice','Branch A',cashoffice),);
 assert.equal(another.status,409);
 env.DB.sqlite.exec("UPDATE maliks_p9_payments SET status='REJECTED' WHERE quotation_id=3");
 const saved=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload),env,context('cashoffice','Branch A',cashoffice));
 assert.equal(saved.status,200,await saved.clone().text());
 assert.equal((await saved.json()).decision,'CASH_COUNT_CHECKED');
 const replay=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload),env,context('cashoffice','Branch A',cashoffice));
 assert.equal((await replay.json()).duplicate,true);
 const other=await listCashupReconciliations(req('/v1/cashup-reconciliation?branch=Branch%20A'),env,context('cashoffice','Branch B',cashoffice));
 assert.equal(other.status,403);
});
test('Cashier cannot review their own cash-up; invalid origin is refused',async()=>{
 const env={DB:new D1()};seedShift(env.DB);
 const payload={request_id:uid(40),branch:'Branch A',shift_id:1,decision:'FLAGGED',note:'Till counter difference investigated',
   expected_cash_cents:27000,counted_cash_cents:27000};
 const self=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload),env,
   context('cashoffice','Branch A',{...cashoffice,email:'cashier@maliks.test'}));
 assert.equal(self.status,403);
 const origin=await reviewCashupReconciliation(post('/v1/cashup-reconciliation/review',payload,'https://other.test'),env,
   context('cashoffice','Branch A',cashoffice));
 assert.equal(origin.status,403);
 assert.equal(env.DB.sqlite.prepare('SELECT count(*) AS n FROM maliks_p22_cashup_reviews').get().n,0);
});
test('No unauthorised worker gets Cash-Up review endpoints; premium screens contain Cash-Up workflow',async()=>{
 const cash=await (await frontend.fetch(req('/'),{APP_TYPE:'cashoffice'})).text();
 assert.match(cash,/Cash-Up Reconciliation/);
 assert.match(cash,/linkParams.get\('view'\)==='cashup'/);
 assert.match(cash,/expected_cash_cents/);
 const tills=await (await frontend.fetch(req('/'),{APP_TYPE:'tills'})).text();
 assert.match(tills,/Close \/ Cash-Up/);
 const blocked=await frontend.fetch(req('/api/cashup-reconciliation?branch=Branch%20A'),{APP_TYPE:'tills'});
 assert.equal(blocked.status,403);
});
