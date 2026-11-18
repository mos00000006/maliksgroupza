import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {REFERENCE_KINDS,listReferences,saveReference,referenceAudit} from '../src/reference-master-domain.mjs';
import frontend from '../src/frontend.mjs';
import core from '../src/core.mjs';

class D1 {
  constructor(){this.db=new DatabaseSync(':memory:');this.db.exec('PRAGMA foreign_keys=ON;'+readFileSync(new URL('../sql/phase27_reference_master_files.sql',import.meta.url),'utf8'));}
  prepare(sql){let args=[];const db=this.db;return {bind(...x){args=x;return this;},first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args).changes)}})};}
  async batch(stmts){this.db.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
const actor={email:'admin@example.test',name:'Technical Admin',active:1,role:'Developer / Technical Admin',access_scope:'Full company'};
const context=(app='management',member=actor,branches=['Store A'])=>({app,member,branches});
const base='https://maliks-core.internal/v1/reference-masters';
const readReq=(kind='region',branch='Store A',extra='')=>new Request(base+'?'+new URLSearchParams({kind,branch})+extra);
const writeReq=(data,origin='https://maliks-pos.test')=>new Request(base,{method:'POST',headers:{'content-type':'application/json',origin,'x-maliks-original-origin':'https://maliks-pos.test'},body:JSON.stringify({request_id:crypto.randomUUID(),branch:'Store A',active:true,description:'',...data})});
const create=async(env,data,contextOverride=context())=>saveReference(writeReq(data),env,contextOverride);
const json=async res=>res.json();

test('Phase 27 schema is additive, idempotent and has unique branch code/audit',()=>{
 const env=new D1();env.db.exec(readFileSync(new URL('../sql/phase27_reference_master_files.sql',import.meta.url),'utf8'));
 assert.ok(env.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maliks_pos_reference_masters'").get());
 assert.equal(Object.keys(REFERENCE_KINDS).length,14); // Phase 34 adds three supplier reference kinds
 const schema=readFileSync(new URL('../sql/phase27_reference_master_files.sql',import.meta.url),'utf8');
 assert.doesNotMatch(schema.replace(/^--.*$/gm,''),/^\s*(DROP|ALTER|DELETE)\s/mi);
});

test('All debtor/supplier lookups save, list and audit, and prevent duplicate codes',async()=>{
 const env={DB:new D1()};
 for(const kind of ['debtor_category','debtor_classification','supplier_category','supplier_classification','region','delivery_method']){
  const res=await create(env,{kind,code:'GENERAL',name:'General '+kind});
  assert.equal(res.status,200,kind+': '+JSON.stringify(await res.clone().json()));
  const entry=(await json(res)).record;assert.equal(entry.branch,'Store A');assert.equal(entry.version,1);
  const records=await json(await listReferences(readReq(kind),env,context()));
  assert.equal(records.records.length,1);assert.equal(records.records[0].code,'GENERAL');
  const audit=await json(await referenceAudit(readReq(kind),env,context()));
  assert.equal(audit.audit.length,1);assert.equal(audit.audit[0].action,'CREATE');
  assert.equal((await create(env,{kind,code:'GENERAL',name:'Duplicate'})).status,409);
 }
});

test('Areas require active region in same branch; inactive region with active areas is blocked',async()=>{
 const env={DB:new D1()};
 assert.equal((await create(env,{kind:'area',code:'C1',name:'Carletonville',parent_region_id:1})).status,409);
 const region=(await json(await create(env,{kind:'region',code:'GAU',name:'Gauteng'}))).record;
 const area=(await json(await create(env,{kind:'area',code:'C1',name:'Carletonville',parent_region_id:region.id}))).record;
 assert.equal(area.parent_region_id,region.id);
 assert.equal((await create(env,{kind:'area',code:'C2',name:'Wrong Branch',parent_region_id:region.id},context('management',actor,['Store B']))).status,403);
 assert.equal((await saveReference(writeReq({...region,active:false,request_id:crypto.randomUUID()}),env,context())).status,409);
 const off=await json(await saveReference(writeReq({...area,active:false,request_id:crypto.randomUUID()}),env,context()));
 assert.equal(off.record.active,false);
 const updated=await json(await saveReference(writeReq({...region,active:false,request_id:crypto.randomUUID()}),env,context()));
 assert.equal(updated.record.active,false);
 assert.equal((await create(env,{kind:'area',code:'C3',name:'Inactive Region',parent_region_id:region.id})).status,409);
});

test('Optimistic version, create retry and update retry remain idempotent with audit',async()=>{
 const env={DB:new D1()};const request_id=crypto.randomUUID();
 const input={kind:'delivery_method',code:'COLLECT',name:'Customer Collection',request_id};
 const first=await saveReference(writeReq(input),env,context());assert.equal(first.status,200);
 const original=(await json(first)).record;
 const repeated=await saveReference(writeReq(input),env,context());assert.equal(repeated.status,200);
 assert.equal((await json(repeated)).record.id,original.id);
 assert.equal((await saveReference(writeReq({...input,name:'Different'}),env,context())).status,409);
 const update={...original,code:'COLLECT',name:'Collect in store',description:'Staff check required',request_id:crypto.randomUUID()};
 const update1=await saveReference(writeReq(update),env,context());assert.equal(update1.status,200);
 const update2=await saveReference(writeReq(update),env,context());assert.equal(update2.status,200);
 assert.equal((await json(update2)).duplicate,true);
 assert.equal((await saveReference(writeReq({...update,request_id:crypto.randomUUID()}),env,context())).status,409);
 const audit=(await json(await referenceAudit(readReq('delivery_method'),env,context()))).audit;
 assert.equal(audit.length,2);assert.equal(audit[0].action,'UPDATE');
});

test('Branch and department rights, origin and payload are protected',async()=>{
 const env={DB:new D1()};const input={kind:'debtor_category',code:'TRADE',name:'Trade'};
 assert.equal((await create(env,input,context('pos'))).status,403);
 assert.equal((await create(env,input,context('management',actor,['Store B']))).status,403);
 assert.equal((await saveReference(writeReq(input,'https://malicious.test'),env,context())).status,403);
 const supplierRole={...actor,role:'Buyer'};
 assert.equal((await create(env,input,context('management',supplierRole))).status,403);
 assert.equal((await create(env,{...input,kind:'supplier_category'},context('management',supplierRole))).status,200);
 assert.equal((await listReferences(readReq('debtor_category'),env,context('management',supplierRole))).status,403);
 assert.equal((await listReferences(readReq('supplier_category','Store B'),env,context())).status,403);
 assert.equal((await create(env,{...input,code:'?'})).status,400);
 assert.equal((await create(env,{...input,kind:'region',parent_region_id:6})).status,400);
});

test('POS menus, API proxy, Core dispatch and deployment migration are connected',async()=>{
 const src=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
 const coreSrc=readFileSync(new URL('../src/core.mjs',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../../.github/workflows/deploy-maliks-operations.yml',import.meta.url),'utf8');
 for(const word of ['suiteReferenceMaster','debtor_category','debtor_classification','supplier_category','supplier_classification','region','area','delivery_method'])assert.match(src,new RegExp(word));
 assert.match(src,/\/api\/reference-masters/);assert.match(coreSrc,/saveReference/);
 assert.match(workflow,/migrate:phase27/);
 const html=await (await frontend.fetch(new Request('https://maliks-pos.test/'),{APP_TYPE:'pos'})).text();
 assert.match(html,/Regions and Areas/);assert.match(html,/suiteReferenceMaster/);
 const calls=[];
 const response=await frontend.fetch(new Request('https://maliks-pos.test/api/reference-masters?branch=Store%20A&kind=region',{headers:{'cf-access-jwt-assertion':'example'}}),
  {APP_TYPE:'pos',CORE:{fetch:async req=>{calls.push(req);return Response.json({records:[]});}}});
 assert.equal(response.status,200);assert.equal(new URL(calls[0].url).pathname,'/v1/reference-masters');
 assert.equal(calls[0].headers.get('x-maliks-app'),'management');
 const denied=await frontend.fetch(new Request('https://maliks-sales.test/api/reference-masters?branch=Store%20A&kind=region',{headers:{'cf-access-jwt-assertion':'example'}}),
  {APP_TYPE:'sales',CORE:{fetch:async()=>Response.json({records:[]})}});
 assert.equal(denied.status,403);
});
