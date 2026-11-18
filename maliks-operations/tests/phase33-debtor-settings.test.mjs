import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {getDebtorSettings,changeDebtorSettings} from '../src/debtor-settings-domain.mjs';

const BRANCH='Buster Build',OTHER='Active Build Carletonville';
class D1 {
 constructor(){this.sqlite=new DatabaseSync(':memory:');const sql=readFileSync(new URL('../sql/phase33_debtor_settings_numbering.sql',import.meta.url),'utf8');this.sqlite.exec(sql);this.sqlite.exec(sql);}
 prepare(sql){const db=this.sqlite;let args=[];return{bind(...x){args=x;return this;},async first(){return db.prepare(sql).get(...args)||null;},async all(){return{results:db.prepare(sql).all(...args)};},async run(){const result=db.prepare(sql).run(...args);return{meta:{changes:Number(result.changes)}};}};}
 async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const stmt of statements)out.push(await stmt.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const context=(role='Owner / Admin',branches=[BRANCH])=>({app:'management',member:{email:'manager@example.com',name:'Manager',role,department:BRANCH,active:1},branches});
const get=async(db,mode='settings',ctx=context(),branch=BRANCH)=>{const r=await getDebtorSettings(new Request('https://core.local/v1/debtor-settings?'+new URLSearchParams({branch,mode})),{DB:db},ctx);return{status:r.status,data:await r.json()};};
const post=async(db,action,extra={},ctx=context(),origin='https://pos.test')=>{const body={action,branch:BRANCH,request_id:crypto.randomUUID(),...extra};const r=await changeDebtorSettings(new Request('https://core.local/v1/debtor-settings',{method:'POST',headers:{'content-type':'application/json',origin,'x-maliks-original-origin':'https://pos.test'},body:JSON.stringify(body)}),{DB:db},ctx);return{status:r.status,data:await r.json()};};
const defaults={version:0,default_terms_days:30,default_credit_limit_cents:500000,statement_cutoff_day:28,invoice_note:'Accounts payable to branch',statement_note:'Thank you for your business'};

test('Phase 33 schema creates branch settings, numbering reservations and audit; is repeatable',()=>{
 const db=new D1();const names=db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'maliks_pos_debtor_%'").all().map(x=>x.name);
 for(const n of ['maliks_pos_debtor_branch_settings','maliks_pos_debtor_number_sequences','maliks_pos_debtor_reserved_numbers','maliks_pos_debtor_config_audit'])assert.ok(names.includes(n),n);
});
test('blank branch has safe defaults without writing records on read',async()=>{const db=new D1();const r=await get(db);assert.equal(r.status,200);assert.equal(r.data.settings.default_terms_days,30);assert.equal(r.data.settings.version,0);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_debtor_branch_settings').get().n,0);});
test('settings can be saved and edited with versions; do not touch other branches',async()=>{
 const db=new D1();let r=await post(db,'SAVE_SETTINGS',defaults);assert.equal(r.status,200,JSON.stringify(r.data));
 r=await get(db);assert.equal(r.data.settings.default_credit_limit_cents,500000);assert.equal(r.data.settings.version,1);
 assert.equal((await get(db,'settings',context('Owner / Admin',[BRANCH,OTHER]),OTHER)).data.settings.version,0);
 r=await post(db,'SAVE_SETTINGS',{...defaults,version:1,default_terms_days:45});assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal((await get(db)).data.settings.default_terms_days,45);
 assert.equal((await post(db,'SAVE_SETTINGS',defaults)).status,409);
});
test('settings rejects malformed amounts and unsafe note values',async()=>{
 const db=new D1();for(const a of [{default_terms_days:-1},{default_credit_limit_cents:2.5},{statement_cutoff_day:31},{invoice_note:'x'.repeat(501)}]){
  const r=await post(db,'SAVE_SETTINGS',{...defaults,...a});assert.equal(r.status,400,JSON.stringify(a));}
});
test('numbering reads six distinct series with branch-safe defaults',async()=>{const d=new D1(),r=await get(d,'numbering');assert.equal(r.status,200);assert.equal(r.data.sequences.length,6);assert.equal(r.data.automatic_document_numbering,false);assert.equal(r.data.sequences[0].next_reference,'DBT-000001');});
test('sequence configuration supports custom prefixes, forward-only counters and protects against duplicates',async()=>{
 const d=new D1();let r=await post(d,'SAVE_NUMBERING',{kind:'PDC_REGISTER',prefix:'BPD-',width:7,next_value:20,version:0});assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal((await get(d,'numbering')).data.sequences.find(x=>x.kind==='PDC_REGISTER').next_reference,'BPD-0000020');
 r=await post(d,'SAVE_NUMBERING',{kind:'PDC_REGISTER',prefix:'BPD-',width:7,next_value:18,version:1});assert.equal(r.status,409);
 r=await post(d,'SAVE_NUMBERING',{kind:'PDC_REGISTER',prefix:'BPD-',width:7,next_value:21,version:0});assert.equal(r.status,409);
 r=await post(d,'SAVE_NUMBERING',{kind:'PAYMENT_PREP',prefix:'BPD-',width:7,next_value:1,version:0});assert.equal(r.status,409);
});
test('reservation consumes exactly one sequential reference and is audited, not posted',async()=>{
 const d=new D1();let r=await post(d,'RESERVE_NUMBER',{kind:'JOURNAL_PREP'});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.reference,'DJR-000001');assert.equal(r.data.reservation_only,true);
 r=await post(d,'RESERVE_NUMBER',{kind:'JOURNAL_PREP'});assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.reference,'DJR-000002');
 assert.equal(d.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_debtor_reserved_numbers').get().n,2);
 assert.equal((await get(d,'numbering')).data.sequences.find(x=>x.kind==='JOURNAL_PREP').next_value,3);
 const audit=await get(d,'audit');assert.equal(audit.data.reserved.length,2);assert.equal(audit.data.entries.length,2);
});
test('reservation retry is idempotent and request ID collision fails',async()=>{
 const d=new D1(),id=crypto.randomUUID();let r=await post(d,'RESERVE_NUMBER',{kind:'DEBTOR_ACCOUNT',request_id:id});assert.equal(r.status,200);
 r=await post(d,'RESERVE_NUMBER',{kind:'DEBTOR_ACCOUNT',request_id:id});assert.equal(r.status,200);assert.equal(r.data.duplicate,true);assert.equal(r.data.reference,'DBT-000001');
 r=await post(d,'RESERVE_NUMBER',{kind:'PDC_REGISTER',request_id:id});assert.equal(r.status,409);
 assert.equal(d.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_debtor_reserved_numbers').get().n,1);
});
test('prefix and padding locked after reservations; next value may only increase',async()=>{
 const d=new D1();await post(d,'RESERVE_NUMBER',{kind:'DEBTOR_ACCOUNT'});
 let r=await post(d,'SAVE_NUMBERING',{kind:'DEBTOR_ACCOUNT',prefix:'NEW-',width:6,next_value:3,version:2});assert.equal(r.status,409);
 r=await post(d,'SAVE_NUMBERING',{kind:'DEBTOR_ACCOUNT',prefix:'DBT-',width:8,next_value:3,version:2});assert.equal(r.status,409);
 r=await post(d,'SAVE_NUMBERING',{kind:'DEBTOR_ACCOUNT',prefix:'DBT-',width:6,next_value:9,version:2});assert.equal(r.status,200,JSON.stringify(r.data));
 r=await post(d,'RESERVE_NUMBER',{kind:'DEBTOR_ACCOUNT'});assert.equal(r.data.reference,'DBT-000009');
});
test('permissions deny unauthorised departments, cross-branch access, read-only and cross-origin writes',async()=>{
 const d=new D1();assert.equal((await get(d,'settings',{...context(),app:'pos'})).status,403);
 assert.equal((await get(d,'numbering',context('Owner / Admin'),OTHER)).status,403);
 assert.equal((await post(d,'SAVE_SETTINGS',defaults,context('Sales'))).status,403);
 assert.equal((await post(d,'RESERVE_NUMBER',{kind:'PAYMENT_PREP'},context('Debtors Clerk'))).status,403);
 assert.equal((await post(d,'SAVE_SETTINGS',defaults,context(),'https://unsafe.test')).status,403);
});
test('all numbering and settings changes are branch-scoped and auditable',async()=>{
 const d=new D1();await post(d,'SAVE_SETTINGS',defaults);await post(d,'SAVE_NUMBERING',{kind:'GROUP_SETTLEMENT',prefix:'GRP-',width:6,next_value:1,version:0});
 const record=(await get(d,'audit')).data.entries;assert.deepEqual(record.map(x=>x.action),['SAVE_NUMBERING','SAVE_SETTINGS']);
 assert.equal((await get(d,'audit',context('Owner / Admin',[BRANCH,OTHER]),OTHER)).data.entries.length,0);
});
