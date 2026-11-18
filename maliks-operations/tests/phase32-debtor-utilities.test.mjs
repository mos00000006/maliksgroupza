import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {listDebtorUtility,changeDebtorUtility} from '../src/debtor-utilities-domain.mjs';
const BRANCH='Buster Build',OTHER='Active Build Carletonville';
class D1 {
 constructor(){
  this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(`
  CREATE TABLE maliks_pos_master_records(id INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT,branch TEXT COLLATE NOCASE,code TEXT COLLATE NOCASE,name TEXT,active INTEGER,details_json TEXT,version INTEGER,created_by_email TEXT,updated_by_email TEXT,created_at TEXT,updated_at TEXT,create_request_id TEXT UNIQUE,create_payload_hash TEXT,last_request_id TEXT,UNIQUE(kind,branch,code));
  CREATE TABLE maliks_pos_master_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT UNIQUE,kind TEXT,branch TEXT,record_id INTEGER,action TEXT,actor_email TEXT,actor_name TEXT,payload_hash TEXT,before_json TEXT,after_json TEXT,created_at TEXT);
  CREATE TABLE till_quotation_submissions(id INTEGER PRIMARY KEY,branch TEXT,customer_name TEXT,customer_contact TEXT,notes TEXT,lines_json TEXT,created_at TEXT,net_cents INTEGER,vat_cents INTEGER,total_cents INTEGER,status TEXT);
  CREATE TABLE maliks_p9_payments(id INTEGER PRIMARY KEY,quotation_id INTEGER,status TEXT);
  CREATE TABLE maliks_p9_invoices(id INTEGER PRIMARY KEY,payment_id INTEGER,quotation_id INTEGER,branch TEXT,issued_at TEXT,net_cents INTEGER,vat_cents INTEGER,total_cents INTEGER);
  `);
  this.sqlite.exec(readFileSync(new URL('../sql/phase30_debtor_transaction_registers.sql',import.meta.url),'utf8'));
  const migration=readFileSync(new URL('../sql/phase32_debtor_utilities.sql',import.meta.url),'utf8');this.sqlite.exec(migration);this.sqlite.exec(migration);
  const add=(branch,code,name)=>this.sqlite.prepare('INSERT INTO maliks_pos_master_records(kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at) VALUES(\'debtor\',?,?,?,1,\'{}\',1,\'admin\',\'admin\',\'2026-01-01\',\'2026-01-01\')').run(branch,code,name);
  add(BRANCH,'DB101','Buster Customer');add(OTHER,'DB999','Secret Customer');
  const q=this.sqlite.prepare('INSERT INTO till_quotation_submissions(id,branch,customer_name,customer_contact,notes,lines_json,created_at,net_cents,vat_cents,total_cents,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  q.run(10,BRANCH,'Old Buster','0820000000','',JSON.stringify([{code:'SKU1',name:'Cement',quantity:1,price_cents:10000,line_total_cents:10000}]),'2026-01-01T08:00:00Z',8696,1304,10000,'AWAITING_CASH_OFFICE');
  q.run(11,BRANCH,'New Buster','','','[]','2026-11-17T08:00:00Z',8696,1304,10000,'AWAITING_CASH_OFFICE');
  q.run(12,BRANCH,'Paid Buster','','','[]','2026-01-01T08:00:00Z',8696,1304,10000,'AWAITING_CASH_OFFICE');
  q.run(13,OTHER,'Secret Customer','','','[]','2026-01-01T08:00:00Z',100000,1304,11304,'AWAITING_CASH_OFFICE');
  this.sqlite.prepare('INSERT INTO maliks_p9_payments VALUES(1,12,\'CONFIRMED\')').run();
  this.sqlite.prepare('INSERT INTO maliks_p9_invoices VALUES(20,1,12,?,?,?,?,?)').run(BRANCH,'2026-04-01T08:00:00Z',8696,1304,10000);
  this.sqlite.prepare(`INSERT INTO maliks_pos_debtor_transaction_register (kind,branch,reference,debtor_code,amount_cents,event_date,description,details_json,status,version,posted,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
      VALUES('JOURNAL',?,'JR1','DB101',10000,'2026-01-01','Adjustment preview','{"debit_account":"100","credit_account":"200"}','SUBMITTED',1,0,'admin','Admin','2026-01-01','2026-01-01','jour001','hash','jour001')`).run(BRANCH);
 }
 prepare(sql){let args=[];const db=this.sqlite;return {bind(...v){args=v;return this;},async run(){let r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};},async all(){return {results:db.prepare(sql).all(...args)};},async first(){return db.prepare(sql).get(...args)||null;}};}
 async batch(stmt){let a=[];this.sqlite.exec('BEGIN');try{for(const s of stmt)a.push(await s.run());this.sqlite.exec('COMMIT');return a;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const ctx=(role='Owner / Admin',branches=[BRANCH])=>({app:'management',member:{email:'admin@test',name:'Administrator',role,active:1,department:BRANCH},branches});
const get=async(db,mode,params={},context=ctx())=>{const url='https://private.local/v1/debtor-utilities?'+new URLSearchParams({mode,branch:BRANCH,...params});let r=await listDebtorUtility(new Request(url),{DB:db},context);return {status:r.status,data:await r.json()};};
const change=async(db,action,values={},context=ctx(),origin='https://pos.test')=>{let r=await changeDebtorUtility(new Request('https://private.local/v1/debtor-utilities',{method:'POST',headers:{'content-type':'application/json',origin,'x-maliks-original-origin':'https://pos.test'},body:JSON.stringify({action,branch:BRANCH,request_id:crypto.randomUUID(),...values})}),{DB:db},context);return {status:r.status,data:await r.json()};};

test('Phase 32 D1 migration is additive and rerunnable',()=>{const d=new D1();assert.ok(d.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='maliks_pos_debtor_utility_audit'").get());assert.ok(d.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='maliks_pos_debtor_agents'").get());assert.equal(d.sqlite.prepare("SELECT COUNT(*) AS c FROM maliks_pos_master_records").get().c,2);});
test('agent directory can add, edit and deactivate with optimistic versions and no duplicates',async()=>{const d=new D1();let r=await change(d,'SAVE_AGENT',{code:'AG1',name:'Agent One',phone:'0115551234',active:true});assert.equal(r.status,200,JSON.stringify(r.data));let a=(await get(d,'agents')).data.rows;assert.equal(a.length,1);assert.equal(a[0].version,1);
 r=await change(d,'SAVE_AGENT',{id:a[0].id,version:1,code:'AG1',name:'Agent Changed',active:false});assert.equal(r.status,200);a=(await get(d,'agents')).data.rows;assert.equal(a[0].active,0);
 r=await change(d,'SAVE_AGENT',{code:'AG1',name:'Duplicate',active:true});assert.equal(r.status,409);r=await change(d,'SAVE_AGENT',{id:a[0].id,version:1,code:'AG1',name:'Stale',active:true});assert.equal(r.status,409);});
test('sales blocks validate active debtor code, reason, independent branch and version',async()=>{const d=new D1();let r=await change(d,'SET_BLOCK',{debtor_code:'DB101',blocked:true,reason:'Over credit limit',version:0});assert.equal(r.status,200,JSON.stringify(r.data));let a=(await get(d,'blocks')).data.rows;assert.equal(a.find(x=>x.code==='DB101').blocked,1);
 r=await change(d,'SET_BLOCK',{debtor_code:'DB101',blocked:false,reason:'Manager verified payment',version:1});assert.equal(r.status,200);r=await change(d,'SET_BLOCK',{debtor_code:'DB101',blocked:true,reason:'Another attempt',version:1});assert.equal(r.status,409);r=await change(d,'SET_BLOCK',{debtor_code:'DB999',blocked:true,reason:'Other branch',version:0});assert.equal(r.status,404);});
test('unposted journals remain clearly labelled non-posted for printing',async()=>{const r=await get(new D1(),'journals');assert.equal(r.status,200);assert.equal(r.data.rows[0].reference,'JR1');assert.match(r.data.rows[0].status_label,/NOT POSTED/);});
test('reprint documents only include branch quotations and confirmed invoices',async()=>{const d=new D1(),rows=(await get(d,'documents')).data.rows;assert.equal(rows.filter(x=>x.type==='invoice').length,1);assert.equal(rows.filter(x=>x.type==='quote').length,3);let r=await get(d,'document',{type:'invoice',id:'20'});assert.equal(r.data.document.status,'CONFIRMED');assert.match(r.data.document.posting_note,/INTERNAL INVOICE/);r=await get(d,'document',{type:'invoice',id:'999'});assert.equal(r.status,404);r=await get(d,'document',{type:'quote',id:'13'});assert.equal(r.status,404);});
test('expired quotation preview excludes paid, new and other-branch records; archival preserves source',async()=>{const d=new D1();let r=await get(d,'expired',{before:'2026-07-01'});assert.equal(r.status,200);assert.deepEqual(r.data.rows.map(x=>x.id),[10]);r=await change(d,'ARCHIVE_EXPIRED',{id:10,before:'2026-07-01',reason:'Expiry stock clean-up'});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.hard_deleted,false);r=await get(d,'expired',{before:'2026-07-01'});assert.equal(r.data.rows[0].archived,1);assert.ok(d.sqlite.prepare('SELECT id FROM till_quotation_submissions WHERE id=10').get());
 for(const i of [11,12,13]){r=await change(d,'ARCHIVE_EXPIRED',{id:i,before:'2026-07-01',reason:'Eligible for cleanup'});assert.equal(r.status,409);}
 r=await change(d,'ARCHIVE_EXPIRED',{id:10,before:'2026-07-01',reason:'Duplicate archive'});assert.equal(r.status,409);});
test('debtor CSV import creates audited new master accounts, cannot overwrite or double submit',async()=>{const d=new D1(),request_id=crypto.randomUUID(),rows=[{code:'NEW22',name:'New Customer',contact_name:'Clerk',email:'clerk@example.org',phone:'0111111111',credit_limit_cents:50000,payment_terms_days:30}];
 let r=await change(d,'IMPORT_DEBTORS',{rows,request_id});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.imported,1);
 r=await change(d,'IMPORT_DEBTORS',{rows,request_id});assert.equal(r.status,200);assert.equal(r.data.duplicate,true);
 let imported=d.sqlite.prepare("SELECT * FROM maliks_pos_master_records WHERE code='NEW22'").get();assert.equal(imported.name,'New Customer');assert.equal(JSON.parse(imported.details_json).credit_limit_cents,50000);
 assert.equal(d.sqlite.prepare("SELECT COUNT(*) c FROM maliks_pos_master_audit WHERE record_id=?").get(imported.id).c,1);
 r=await change(d,'IMPORT_DEBTORS',{rows:[{code:'NEW22',name:'Tamper',credit_limit_cents:0,payment_terms_days:0}]});assert.equal(r.status,409);assert.equal(d.sqlite.prepare("SELECT name FROM maliks_pos_master_records WHERE code='NEW22'").get().name,'New Customer');
 r=await change(d,'IMPORT_DEBTORS',{rows:[{code:'DUP',name:'One'},{code:'dup',name:'Two'}]});assert.equal(r.status,409);
});
test('labels only show current-branch debtor master records',async()=>{const r=await get(new D1(),'labels');assert.equal(r.data.rows.length,1);assert.equal(r.data.rows[0].name,'Buster Customer');});
test('security denies Sales, Member, missing store, read-only writes and cross-origin',async()=>{const d=new D1();assert.equal((await get(d,'agents',{}, {...ctx(),app:'pos'})).status,403);assert.equal((await get(d,'agents',{},ctx('Sales'))).status,403);assert.equal((await get(d,'agents',{branch:OTHER})).status,403);
 assert.equal((await change(d,'SAVE_AGENT',{code:'A1',name:'Agent',active:true},ctx('Executive / EXCO'))).status,403);
 assert.equal((await change(d,'SAVE_AGENT',{code:'A1',name:'Agent',active:true},ctx(),'https://evil.test')).status,403);
 assert.equal((await get(d,'document',{type:'quote',id:'-2'})).status,400);
});
test('audit log records utility mutations without ever posting balances or deleting quotations',async()=>{const d=new D1();await change(d,'SAVE_AGENT',{code:'A2',name:'Agent Two',active:true});const r=await get(d,'audit');assert.equal(r.data.rows[0].event,'CREATE_AGENT');assert.equal(r.data.rows[0].actor_email,'admin@test');
 const source=readFileSync(new URL('../src/debtor-utilities-domain.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/\bDELETE\s+FROM\s+till_quotation_submissions/i);
});
test('sales block changes and archival require manager or credit-controller role',async()=>{
 const db=new D1(),clerk=ctx('Debtors Clerk');let r=await change(db,'SET_BLOCK',{debtor_code:'DB101',blocked:true,reason:'Stop account credit',version:0},clerk);assert.equal(r.status,403);
 r=await change(db,'ARCHIVE_EXPIRED',{id:10,before:'2026-07-01',reason:'Expired and unpaid'},clerk);assert.equal(r.status,403);
 r=await change(db,'SET_BLOCK',{debtor_code:'DB101',blocked:true,reason:'Over limit',version:0},ctx('Credit Controller'));assert.equal(r.status,200);
});
