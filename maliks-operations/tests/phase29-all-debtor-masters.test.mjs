import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {REFERENCE_KINDS,saveReference,listReferences,referenceAudit} from '../src/reference-master-domain.mjs';

const kinds=['debtor_route','debtor_return_reason','debtor_invoice_classification','debtor_invoice_note'];
const allDebtors=['debtor_category','debtor_classification','region','area','delivery_method',...kinds];
class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec('PRAGMA foreign_keys=ON;');for(const name of ['phase27_reference_master_files.sql','phase29_debtor_extended_masters.sql'])this.db.exec(readFileSync(new URL('../sql/'+name,import.meta.url),'utf8'));}
 prepare(sql){const db=this.db;let args=[];return {bind(...vals){args=vals;return this;},first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})};}
 async batch(items){this.db.exec('BEGIN');try{const results=[];for(const item of items)results.push(await item.run());this.db.exec('COMMIT');return results;}catch(error){this.db.exec('ROLLBACK');throw error;}}
}
const owner={role:'Developer / Technical Admin',active:1,email:'manager@example.test',name:'Manager',access_scope:'Full company'};
const ctx=(branches=['Branch A'],app='management',member=owner)=>({app,branches,member});
const endpoint='https://maliks-core.internal/v1/reference-masters';
const get=(kind,branch='Branch A')=>new Request(endpoint+'?'+new URLSearchParams({kind,branch}));
const post=(data,origin='https://maliks-pos.test')=>new Request(endpoint,{method:'POST',headers:{origin,'x-maliks-original-origin':'https://maliks-pos.test','content-type':'application/json'},body:JSON.stringify({request_id:crypto.randomUUID(),branch:'Branch A',active:true,description:'',...data})});
const create=(db,payload,c=ctx())=>saveReference(post(payload),{DB:db},c);
const lines=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('All eight previously-grey debtor master options are connected to a real maintained register',()=>{
 const source=lines('../src/frontend.mjs');
 assert.equal(allDebtors.length,9); // Region and Area are two registers under one menu item.
 const names=['Routes','Categories','Classifications','Regions and Areas','Delivery Methods','Debtors Returns Reasons','Debtors Invoicing Classifications','Debtors Invoicing Additional Notes'];
 for(const name of names){assert.match(source.slice(source.indexOf('function isConnectedSuiteAction'),source.indexOf('function suiteWorkspaceStart')),new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));}
 for(const kind of allDebtors)assert.equal(REFERENCE_KINDS[kind],'debtor');
 for(const kind of kinds)assert.ok(source.includes(kind));
 assert.match(source,/suiteReferenceMaster\(referenceKind\)/);
 assert.match(source,/Invoice note text/);
});

test('Phase 29 schema is additive, idempotent and never replaces existing Phase 27 records',()=>{
 const db=new D1();db.db.exec(readFileSync(new URL('../sql/phase29_debtor_extended_masters.sql',import.meta.url),'utf8'));
 const migration=lines('../sql/phase29_debtor_extended_masters.sql').replace(/^--.*$/gm,'');
 assert.doesNotMatch(migration,/^\s*(?:DROP|ALTER|DELETE|UPDATE)\b/mi);
 assert.equal(db.db.prepare("SELECT count(*) n FROM maliks_pos_reference_masters").get().n,0);
 assert.ok(db.db.prepare("SELECT name FROM sqlite_master WHERE name='maliks_pos_debtor_extra_masters'").get());
});

test('Routes, returns reasons, invoice classifications and invoice notes can be created and listed',async()=>{
 const db=new D1();for(const kind of kinds){
  const payload={kind,code:'GEN',name:'General '+kind,description:kind==='debtor_invoice_note'?'Please show your invoice to the cashier.':'Sample notes'};
  const response=await create(db,payload);assert.equal(response.status,200,kind+': '+JSON.stringify(await response.clone().json()));
  const data=await response.json();assert.equal(data.record.code,'GEN');assert.equal(data.record.version,1);
  const records=await (await listReferences(get(kind),{DB:db},ctx())).json();assert.equal(records.records.length,1);
  assert.equal(records.records[0].description,payload.description);
  const audit=await (await referenceAudit(get(kind),{DB:db},ctx())).json();assert.equal(audit.audit[0].action,'CREATE');
  assert.equal((await create(db,{...payload,name:'Duplicate code'})).status,409);
 }
});

test('Reference kinds stay distinct from one another and existing debtor category masters',async()=>{
 const db=new D1();
 const cat=await create(db,{kind:'debtor_category',code:'TRADE',name:'Trade customers'});assert.equal(cat.status,200);
 const route=await create(db,{kind:'debtor_route',code:'TRADE',name:'Trade route'});assert.equal(route.status,200);
 assert.equal((await (await listReferences(get('debtor_route'),{DB:db},ctx())).json()).records[0].name,'Trade route');
 assert.equal((await (await listReferences(get('debtor_category'),{DB:db},ctx())).json()).records[0].name,'Trade customers');
});

test('Update, deactivate, optimistic version, idempotent retry and audit remain enforced',async()=>{
 const db=new D1();const payload={kind:'debtor_return_reason',code:'DAMAGED',name:'Damaged goods'};
 const req=post(payload);const r=await saveReference(req,{DB:db},ctx());assert.equal(r.status,200);
 const current=(await r.json()).record;
 const update={...current,description:'Damaged on delivery',active:false,request_id:crypto.randomUUID()};
 const changed=await saveReference(post(update),{DB:db},ctx());assert.equal(changed.status,200);
 assert.equal((await changed.json()).record.active,false);
 assert.equal((await saveReference(post(update),{DB:db},ctx())).status,200);
 assert.equal((await saveReference(post({...update,request_id:crypto.randomUUID()}),{DB:db},ctx())).status,409);
 const history=await (await referenceAudit(get('debtor_return_reason'),{DB:db},ctx())).json();assert.equal(history.audit.length,2);
});

test('Reject wrong branch, other apps, forbidden job roles, bad origin and empty invoice notes',async()=>{
 const db=new D1();const payload={kind:'debtor_invoice_note',code:'BANK',name:'Payment note',description:'Payment on receipt only'};
 assert.equal((await create(db,payload,ctx(['Branch B']))).status,403);
 assert.equal((await create(db,payload,ctx(['Branch A'],'pos'))).status,403);
 assert.equal((await create(db,payload,ctx(['Branch A'],'management',{...owner,role:'Sales'}))).status,403);
 assert.equal((await saveReference(post(payload,'https://evil.test'),{DB:db},ctx())).status,403);
 assert.equal((await create(db,{...payload,description:''})).status,400);
 assert.equal((await create(db,payload)).status,200);
 assert.equal((await listReferences(get('debtor_route','Branch B'),{DB:db},ctx())).status,403);
});

test('Both migrations run before private Core and POS deployment',()=>{
 const pkg=JSON.parse(lines('../package.json'));
 const flow=lines('../../.github/workflows/deploy-maliks-operations.yml');
 assert.ok(pkg.scripts['migrate:phase27']);assert.ok(pkg.scripts['migrate:phase29']);
 assert.ok(flow.indexOf('migrate:phase27')<flow.indexOf('migrate:phase29'));
 assert.ok(flow.indexOf('migrate:phase29')<flow.indexOf('deploy:core'));
});
