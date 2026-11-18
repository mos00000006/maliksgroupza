import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {validateDebtorTransaction,listDebtorTransactions,createDebtorTransaction,actionDebtorTransaction,listDebtorTransactionAudit} from '../src/debtor-transaction-domain.mjs';

const sql=readFileSync(new URL('../sql/phase30_debtor_transaction_registers.sql',import.meta.url),'utf8');
const branch='Active Build Carletonville';
class D1 {
  constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(sql);}
  prepare(q){const db=this.db;let args=[];return {bind(...p){args=p;return this;},
    async first(){return db.prepare(q).get(...args)??null;},
    async all(){return {results:db.prepare(q).all(...args)};},
    async run(){const x=db.prepare(q).run(...args);return {meta:{changes:Number(x.changes)}};}};}
  async batch(stmts){this.db.exec('BEGIN IMMEDIATE');try{const out=[];for(const s of stmts)out.push(await s.run());this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
const makeCtx=(email='maker@example.com', role='Store Manager',branches=[branch])=>({app:'management',branches,member:{name:email, email,role,active:1,department:branch}});
let counter=0;
const req=(path,data,origin='https://pos.test')=>new Request(`https://pos.test${path}`,{method:'POST',headers:{'content-type':'application/json',origin,'x-maliks-original-origin':'https://pos.test'},body:JSON.stringify({...data,request_id:data.request_id||`req_test_${String(++counter).padStart(8,'0')}`})});
const valid=(kind)=>({branch,kind,reference:`TR-${kind}-2026`,debtor_code:'AC101',amount_cents:23450,event_date:'2026-11-18',description:'Test capture for audit',details:({
 PAYMENT:{method:'EFT',bank_reference:'PAY-113'},REVERSAL:{original_reference:'R-208',reason:'Payment entered in error'},
 JOURNAL:{debit_account:'1100',credit_account:'2100'},PDC:{bank:'FNB',cheque_number:'CH1234',cheque_date:'2026-12-01'},
 GROUP_SETTLEMENT:{group_account:'GRP55',invoice_number:'INV-1444'}})[kind]});
const post=async(env,ctx,data)=>createDebtorTransaction(req('/api/debtor-transactions',data),env,ctx);
const action=async(env,ctx,data)=>actionDebtorTransaction(req('/api/debtor-transactions/action',{branch,...data}),env,ctx);
test('phase30 schema is additive, repeatable and has a hard no-posting constraint',()=>{
 const db=new D1();db.db.exec(sql);assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM maliks_pos_debtor_transaction_register').get().n,0);
 assert.throws(()=>db.db.prepare(`INSERT INTO maliks_pos_debtor_transaction_register(kind,branch,reference,amount_cents,event_date,description,details_json,posted,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id) VALUES('PAYMENT','Test','A',100,'2026-11-18','test','{}',1,'a','a','x','x','uuid','h','r')`).run(),/constraint/i);
});
test('all four Debtors transaction workspaces (five register types including reversals) can capture non-posting records',async()=>{
 const env={DB:new D1()},ctx=makeCtx();for(const kind of ['PAYMENT','REVERSAL','JOURNAL','PDC','GROUP_SETTLEMENT']){
  const response=await post(env,ctx,valid(kind));assert.equal(response.status,200,kind+' '+JSON.stringify(await response.clone().json()));
  const j=await response.json();assert.equal(j.record.status,'DRAFT');assert.equal(j.record.posted,false);
  const listing=await listDebtorTransactions(new Request(`https://pos.test/api/debtor-transactions?branch=${encodeURIComponent(branch)}&kind=${kind}`),env,ctx);
  assert.equal(listing.status,200);assert.equal((await listing.json()).records.length,1);
 }
});
test('idempotency rejects changed requests and duplicate register references',async()=>{
 const env={DB:new D1()},ctx=makeCtx();const body={...valid('PAYMENT'),request_id:'unique-request-123'};
 assert.equal((await post(env,ctx,body)).status,200);
 assert.equal((await post(env,ctx,body)).status,200);
 assert.equal((await post(env,ctx,{...body,amount_cents:100})).status,409);
 assert.equal((await post(env,ctx,{...body,request_id:'new-request-555'})).status,409);
 const count=env.DB.db.prepare('SELECT COUNT(*) AS n FROM maliks_pos_debtor_transaction_register').get().n;assert.equal(count,1);
});
test('submit then independent manager review with full audit; creator cannot review self',async()=>{
 const env={DB:new D1()},creator=makeCtx(),reviewer=makeCtx('reviewer@example.com');
 const row=(await (await post(env,creator,valid('JOURNAL'))).json()).record;
 assert.equal((await action(env,reviewer,{id:row.id,version:row.version,action:'SUBMIT'})).status,403);
 const submitted=(await (await action(env,creator,{id:row.id,version:row.version,action:'SUBMIT'})).json()).record;
 assert.equal(submitted.status,'SUBMITTED');
 assert.equal((await action(env,creator,{id:row.id,version:submitted.version,action:'REVIEW'})).status,403);
 const approved=(await (await action(env,reviewer,{id:row.id,version:submitted.version,action:'REVIEW'})).json()).record;
 assert.equal(approved.status,'REVIEWED');assert.equal(approved.posted,false);
 assert.equal((await action(env,reviewer,{id:row.id,version:approved.version,action:'REVIEW'})).status,409);
 const audit=await listDebtorTransactionAudit(new Request(`https://pos.test/api/debtor-transactions/audit?branch=${encodeURIComponent(branch)}&id=${row.id}`),env,reviewer);
 assert.deepEqual((await audit.json()).events.map(x=>x.action),['CREATE','SUBMIT','REVIEW']);
});
test('rejection requires a reason; cancel only draft; all reviewed records stay unposted',async()=>{
 const env={DB:new D1()},a=makeCtx(),b=makeCtx('reviewer@example.com');
 const row=(await (await post(env,a,valid('PDC'))).json()).record;
 assert.equal((await action(env,a,{id:row.id,version:1,action:'CANCEL'})).status,200);
 const r=(await (await post(env,a,{...valid('PDC'),reference:'PDC-22'})).json()).record;
 const sub=(await (await action(env,a,{id:r.id,version:1,action:'SUBMIT'})).json()).record;
 assert.equal((await action(env,b,{id:r.id,version:sub.version,action:'REJECT',reason:'no'})).status,400);
 const rejected=(await (await action(env,b,{id:r.id,version:sub.version,action:'REJECT',reason:'Cheque confirmation missing'})).json()).record;
 assert.equal(rejected.status,'REJECTED');assert.equal(rejected.posted,false);
});
test('invalid formats, origin mismatches, branch scope and non-management apps are denied',async()=>{
 const env={DB:new D1()},ctx=makeCtx();
 assert.throws(()=>validateDebtorTransaction({...valid('JOURNAL'),details:{debit_account:'100',credit_account:'100'},request_id:'req_test_12345678'}),/differ/);
 assert.throws(()=>validateDebtorTransaction({...valid('PDC'),details:{...valid('PDC').details,cheque_date:'2026-11-10'},request_id:'req_test_12345678'}),/after/);
 assert.throws(()=>validateDebtorTransaction({...valid('PAYMENT'),amount_cents:1.2,request_id:'req_test_12345678'}),/whole cents/);
 assert.equal((await createDebtorTransaction(req('/api/debtor-transactions',valid('PAYMENT'),'https://attacker.test'),env,ctx)).status,403);
 assert.equal((await post(env,makeCtx('another@test','Store Manager',['Other branch']),valid('PAYMENT'))).status,403);
 assert.equal((await post(env,{...ctx,app:'pos'},valid('PAYMENT'))).status,403);
 assert.equal((await post(env,makeCtx('readonly@test','Executive / EXCO'),valid('PAYMENT'))).status,403);
 const approved=await post(env,ctx,valid('PAYMENT'));assert.equal(approved.status,200);
 const other=await listDebtorTransactions(new Request(`https://pos.test/api/debtor-transactions?branch=Other%20branch&kind=PAYMENT`),env,ctx);
 assert.equal(other.status,403);
});
