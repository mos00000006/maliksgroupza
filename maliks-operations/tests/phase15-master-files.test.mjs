import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {canUseApp} from '../src/policy.mjs';
import {canUseManagement,canUseMaster,validateMasterInput,listMasterRecords,listMasterAudit,listMasterCatalogue,saveMasterRecord} from '../src/master-domain.mjs';
import frontend from '../src/frontend.mjs';

const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const owner={active:1,role:'Owner / Admin',name:'Admin',email:'admin@example.com',access_scope:'Full company'};
const stocker={active:1,role:'Stock Controller',name:'Stock Controller',email:'stock@example.com',access_scope:'Assigned workspace'};
const sales={active:1,role:'Sales / Tills',name:'Sales',email:'sales@example.com',access_scope:'Assigned workspace'};
const context=(member=owner,branches=['Branch A'])=>({app:'management',member,branches});
const body=(requestId,overrides={})=>({request_id:uuid(requestId),kind:'stock',branch:'Branch A',code:'ABC123',name:'Test Stock Item',active:true,
  details:{unit:'each',category:'General',barcode:'123456',cost_cents:10000,selling_price_cents:12000,reorder_min:3},...overrides});
const write=(payload,origin='https://pos.example')=>new Request(origin+'/v1/master/records',{method:'POST',headers:{origin,'x-maliks-original-origin':origin,'content-type':'application/json'},body:JSON.stringify(payload)});
const get=(path)=>new Request('https://pos.example'+path);

class LocalD1{
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(readFileSync(new URL('../sql/phase15_master_files.sql',import.meta.url),'utf8'));
    this.sqlite.exec(`CREATE TABLE catalogue_products(id INTEGER PRIMARY KEY,code TEXT,name TEXT,category TEXT,active INTEGER,updated_at TEXT);INSERT INTO catalogue_products VALUES(10,'ABC123','Test Stock Item','General',1,'2026-11-13');`);
    this.sqlite.exec('CREATE TABLE powerbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);CREATE TABLE busterbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);CREATE TABLE price_tag_branch_prices(product_id INTEGER,brand TEXT,branch_name TEXT,price_cents INTEGER);');}
  prepare(sql){
    const sqlite=this.sqlite;let params=[];
    return {bind(...v){params=v;return this;},first(){return sqlite.prepare(sql).get(...params)||null;},
      all(){return {results:sqlite.prepare(sql).all(...params)};},run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};
  }
  batch(steps){this.sqlite.exec('BEGIN');try{const result=steps.map(s=>s.run());this.sqlite.exec('COMMIT');return result;}
    catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const response=async res=>({status:res.status,body:await res.json()});

test('management is a separate server-side role and not the Sales app',()=>{
  assert.equal(canUseApp(owner,'management'),true);
  assert.equal(canUseApp(stocker,'management'),true);
  assert.equal(canUseApp(sales,'management'),false);
  assert.equal(canUseManagement(sales),false);
  assert.equal(canUseMaster(stocker,'stock',true),true);
  assert.equal(canUseMaster(stocker,'debtor'),false);
  assert.equal(canUseMaster({...owner,role:'Executive / EXCO'},'stock'),true);
  assert.equal(canUseMaster({...owner,role:'Executive / EXCO'},'stock',true),false);
  assert.equal(canUseMaster({...owner,active:0},'stock'),false);
});
test('master input validates branch, code, prices and email',()=>{
  const validated=validateMasterInput(body(1));assert.equal(validated.code,'ABC123');
  assert.throws(()=>validateMasterInput(body(1,{code:'x ; DROP TABLE'})),/Code/);
  assert.throws(()=>validateMasterInput(body(1,{details:{...body(1).details,cost_cents:-1}})),/cost/);
  assert.throws(()=>validateMasterInput(body(1,{active:'yes'})),/Active/);
  assert.throws(()=>validateMasterInput(body(1,{request_id:'wrong'})),/request ID/);
  const supplier=validateMasterInput(body(2,{kind:'supplier',details:{contact_name:'X',phone:'123',email:'x@example.com',vat_number:'',payment_terms_days:30}}));
  assert.equal(supplier.details.email,'x@example.com');
  assert.throws(()=>validateMasterInput(body(2,{kind:'supplier',details:{...supplier.details,email:'not email'}})),/email/);
});
test('D1 migration is additive and repeatable',()=>{
  const db=new LocalD1();db.sqlite.exec(readFileSync(new URL('../sql/phase15_master_files.sql',import.meta.url),'utf8'));
  const names=db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'maliks_pos_%'").all();
  assert.equal(names.length,2);
});
test('master record create, search, audit, idempotent retry and branch isolation',async()=>{
  const env={DB:new LocalD1()};
  const first=await response(await saveMasterRecord(write(body(1)),env,context()));assert.equal(first.status,200);assert.equal(first.body.record.version,1);
  const replay=await response(await saveMasterRecord(write(body(1)),env,context()));assert.equal(replay.status,200);
  const conflict=await response(await saveMasterRecord(write(body(2,{name:'Different'})),env,context()));assert.equal(conflict.status,409);
  const list=await response(await listMasterRecords(get('/v1/master/records?kind=stock&branch=Branch%20A&q=ABC'),env,context()));
  assert.equal(list.body.records.length,1);assert.equal(list.body.records[0].name,'Test Stock Item');
  const audit=await response(await listMasterAudit(get('/v1/master/audit?kind=stock&branch=Branch%20A'),env,context()));
  assert.equal(audit.body.audit.length,1);assert.equal(audit.body.audit[0].action,'CREATE');
  const other=await response(await listMasterRecords(get('/v1/master/records?kind=stock&branch=Branch%20A'),env,context(owner,['Branch B'])));
  assert.equal(other.status,403);
  const otherUser=await response(await listMasterRecords(get('/v1/master/records?kind=debtor&branch=Branch%20A'),env,context(stocker)));
  assert.equal(otherUser.status,403);
  const deniedOrigin=await response(await saveMasterRecord(new Request('https://pos.example/v1/master/records',{method:'POST',headers:{origin:'https://evil.example','x-maliks-original-origin':'https://pos.example'},body:JSON.stringify(body(4))}),env,context()));
  assert.equal(deniedOrigin.status,403);
});
test('optimistic versioning and audit of updates; no stale overwrite',async()=>{
  const env={DB:new LocalD1()};
  const created=await response(await saveMasterRecord(write(body(10)),env,context()));const record=created.body.record;
  const update=body(11,{id:record.id,version:record.version,name:'Renamed Item'});
  const updated=await response(await saveMasterRecord(write(update),env,context()));assert.equal(updated.status,200);assert.equal(updated.body.record.version,2);
  const duplicate=await response(await saveMasterRecord(write(update),env,context()));assert.equal(duplicate.status,200);assert.equal(duplicate.body.duplicate,true);
  const stale=await response(await saveMasterRecord(write(body(12,{id:record.id,version:1,name:'Stale'})),env,context()));assert.equal(stale.status,409);
  const audit=await response(await listMasterAudit(get('/v1/master/audit?kind=stock&branch=Branch%20A'),env,context()));
  assert.equal(audit.body.audit.length,2);assert.equal(audit.body.audit[0].action,'UPDATE');assert.equal(audit.body.audit[0].before.name,'Test Stock Item');
  const list=await response(await listMasterRecords(get('/v1/master/records?kind=stock&branch=Branch%20A'),env,context()));
  assert.equal(list.body.records[0].name,'Test Stock Item');
});
test('supplier and debtor master files are independently branch scoped and role controlled',async()=>{
  const env={DB:new LocalD1()};
  const finance={...owner,role:'Finance Manager',name:'Finance',email:'finance@example.com'};
  const clerk={...owner,role:'Debtors Clerk',name:'Debtors',email:'debtors@example.com'};
  const supplier=body(30,{kind:'supplier',code:'SUP001',name:'Supplier One',details:{contact_name:'John',phone:'0111234567',email:'supplier@example.com',vat_number:'12345',payment_terms_days:30}});
  const debtor=body(31,{kind:'debtor',code:'CUST001',name:'Customer One',details:{contact_name:'Jane',phone:'0111234567',email:'customer@example.com',credit_limit_cents:100000,payment_terms_days:30}});
  assert.equal((await response(await saveMasterRecord(write(supplier),env,context(finance)))).status,200);
  assert.equal((await response(await saveMasterRecord(write(debtor),env,context(clerk)))).status,200);
  assert.equal((await response(await saveMasterRecord(write(supplier),env,context(clerk)))).status,403);
  const suppliers=await response(await listMasterRecords(get('/v1/master/records?kind=supplier&branch=Branch%20A'),env,context(finance)));
  assert.equal(suppliers.body.records.length,1);assert.equal(suppliers.body.records[0].details.vat_number,'12345');
  const debtors=await response(await listMasterRecords(get('/v1/master/records?kind=debtor&branch=Branch%20A'),env,context(clerk)));
  assert.equal(debtors.body.records.length,1);assert.equal(debtors.body.records[0].details.credit_limit_cents,100000);
});
test('the same code is allowed in different branches but not duplicated within a branch',async()=>{
  const env={DB:new LocalD1()};
  assert.equal((await response(await saveMasterRecord(write(body(40)),env,context()))).status,200);
  const second=body(41,{branch:'Branch B'});
  assert.equal((await response(await saveMasterRecord(write(second),env,context(owner,['Branch B'])))).status,200);
  const duplicate=body(42,{branch:'Branch B'});
  assert.equal((await response(await saveMasterRecord(write(duplicate),env,context(owner,['Branch B'])))).status,409);
  const list=await response(await listMasterRecords(get('/v1/master/records?kind=stock&branch=Branch%20B'),env,context(owner,['Branch B'])));
  assert.equal(list.body.records.length,1);
});
test('catalogue is read-only and uses existing product records without inventing SOH',async()=>{
  const env={DB:new LocalD1()};env.DB.sqlite.exec("INSERT INTO catalogue_products VALUES(1,'P001','White Tile','Tiles',1,'2026-11-13'),(2,'P002','Other Item','General',0,'2026-11-13');INSERT INTO powerbuild_price_tags(product_id,published) VALUES(1,1),(2,1);");
  const result=await response(await listMasterCatalogue(get('/v1/master/catalogue?branch=Branch%20A&q=tile'),env,context()));
  assert.equal(result.status,200);assert.equal(result.body.products.length,1);assert.equal(result.body.read_only,true);assert.equal(result.body.stock_on_hand_available,false);
});
test('POS master routes use management identity, Sales remains separate, no financial route leakage',async()=>{
  const forwarded=[];const env={APP_TYPE:'pos',CORE:{fetch:async req=>{forwarded.push(req);return Response.json({ok:true});}}};
  const r=await frontend.fetch(new Request('https://pos.example/api/master/records?kind=stock&branch=A',{headers:{'cf-access-jwt-assertion':'test-jwt'}}),env);
  assert.equal(r.status,200);assert.equal(forwarded[0].headers.get('x-maliks-app'),'management');
  const denied=await frontend.fetch(new Request('https://pos.example/api/quotes',{headers:{'cf-access-jwt-assertion':'test-jwt'}}),env);
  assert.equal(denied.status,403);
  const wrong=await frontend.fetch(new Request('https://pos.example/api/master/records',{method:'POST',headers:{origin:'https://wrong.example','cf-access-jwt-assertion':'test-jwt'},body:'{}'}),env);
  assert.equal(wrong.status,403);
  const salesEnv={...env,APP_TYPE:'sales'};
  const salesMaster=await frontend.fetch(new Request('https://sales.example/api/master/records',{headers:{'cf-access-jwt-assertion':'test-jwt'}}),salesEnv);
  assert.equal(salesMaster.status,403);
  assert.equal(forwarded.length,1);
});
test('generated POS inline script is valid JS and contains real master workflows',async()=>{
  const page=await (await frontend.fetch(new Request('https://pos.example/'),{APP_TYPE:'pos'})).text();
  assert.match(page,/function suiteMasterView\(kind,openAudit=false\)/);
  assert.match(page,/api\('\/api\/master\/records'/);
  const match=page.match(/<script type="module">([\s\S]*?)<\/script>/);assert.ok(match);
  const dir=mkdtempSync(join(tmpdir(),'maliks-p15-'));
  try{const file=join(dir,'script.mjs');writeFileSync(file,match[1]);execFileSync(process.execPath,['--check',file]);}
  finally{rmSync(dir,{recursive:true,force:true});}
});
