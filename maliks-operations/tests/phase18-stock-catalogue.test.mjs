import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {listMasterRecords,syncStockCatalogue} from '../src/master-domain.mjs';
import frontend from '../src/frontend.mjs';
const owner={active:1,role:'Owner / Admin',email:'admin@example.com',name:'Admin',access_scope:'Full company'};
const reader={...owner,role:'Executive / EXCO'};
const ctx=(member=owner,branches=['Branch A'])=>({app:'management',member,branches});
const get=q=>new Request('https://pos.example/v1/master/records?kind=stock&branch=Branch%20A'+q);
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const write=(branch='Branch A',n=1)=>new Request('https://pos.example/v1/master/catalogue/sync',{method:'POST',headers:{origin:'https://pos.example','x-maliks-original-origin':'https://pos.example'},body:JSON.stringify({branch,request_id:uuid(n)})});
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(readFileSync(new URL('../sql/phase15_master_files.sql',import.meta.url),'utf8'));
  this.sqlite.exec(`CREATE TABLE catalogue_products(id INTEGER PRIMARY KEY,code TEXT UNIQUE,name TEXT,category TEXT,active INTEGER,updated_at TEXT);
   CREATE TABLE powerbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
   CREATE TABLE busterbuild_price_tags(product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
   CREATE TABLE price_tag_branch_prices(product_id INTEGER,brand TEXT,branch_name TEXT,price_cents INTEGER);
   INSERT INTO catalogue_products VALUES (1,'PAINT001','Blue Paint','Paints',1,'2026-11-13'),(2,'TILE001','Gloss Tile','Tiles',1,'2026-11-13'),(3,'OLD001','Retired Item','General',0,'2026-11-13');
   INSERT INTO powerbuild_price_tags VALUES (1,1,'EA',20000);`);
 }
 prepare(sql){const db=this.sqlite;let args=[];return {bind(...v){args=v;return this;},first(){return db.prepare(sql).get(...args)||null;},all(){return {results:db.prepare(sql).all(...args)};},run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}
 batch(steps){this.sqlite.exec('BEGIN');try{const r=steps.map(x=>x.run());this.sqlite.exec('COMMIT');return r;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const result=async r=>({status:r.status,data:await r.json()});
test('stock master lists all active Hub catalogue items, including unpublished ones, without a manual master record',async()=>{
 const env={DB:new D1()};const r=await result(await listMasterRecords(get(''),env,ctx()));assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal(r.data.catalogue_source,true);assert.equal(r.data.total,2);assert.deepEqual(r.data.records.map(x=>x.code).sort(),['PAINT001','TILE001']);
 assert.ok(r.data.records.every(x=>x.linked===false));
 assert.equal(r.data.records.find(x=>x.code==='PAINT001').details.selling_price_cents,20000);
 const search=await result(await listMasterRecords(get('&q=tile'),env,ctx()));assert.equal(search.data.records.length,1);assert.equal(search.data.records[0].code,'TILE001');
});
test('explicit sync links Hub products to branch master IDs, audits once, preserves Hub and no SOH posting',async()=>{
 const env={DB:new D1()};const first=await result(await syncStockCatalogue(write(),env,ctx()));assert.equal(first.status,200,JSON.stringify(first.data));assert.equal(first.data.linked,2);
 const second=await result(await syncStockCatalogue(write('Branch A',2),env,ctx()));assert.equal(second.status,200);assert.equal(second.data.newly_linked,0);
 const list=await result(await listMasterRecords(get(''),env,ctx()));assert.equal(list.data.records.filter(x=>x.linked).length,2);
 assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM maliks_pos_master_audit WHERE kind='stock'").get().n,2);
 assert.equal(env.DB.sqlite.prepare("SELECT COUNT(*) n FROM maliks_pos_master_records WHERE branch='Branch A'").get().n,2);
 assert.equal(env.DB.sqlite.prepare("SELECT name FROM catalogue_products WHERE id=1").get().name,'Blue Paint');
});
test('branch permissions and read-only users cannot link stock',async()=>{
 const env={DB:new D1()};assert.equal((await result(await syncStockCatalogue(write(),env,ctx(reader)))).status,403);
 assert.equal((await result(await syncStockCatalogue(write(),env,ctx(owner,['Branch B'])))).status,403);
 assert.equal((await result(await syncStockCatalogue(write(),env,{...ctx(),app:'pos'}))).status,403);
});
test('POS frontend exposes link route but Sales frontend cannot access it',async()=>{
 const env={APP_TYPE:'pos',CORE:{fetch:async()=>Response.json({ok:true})}};
 const ok=await frontend.fetch(new Request('https://pos.example/api/master/catalogue/sync',{method:'POST',headers:{origin:'https://pos.example','cf-access-jwt-assertion':'test'},body:'{}'}),env);assert.equal(ok.status,200);
 const denied=await frontend.fetch(new Request('https://sales.example/api/master/catalogue/sync',{method:'POST',headers:{origin:'https://sales.example','cf-access-jwt-assertion':'test'},body:'{}'}),{...env,APP_TYPE:'sales'});assert.equal(denied.status,403);
});
test('Hub branch price overrides are read live; POS does not change the catalogue',async()=>{
 const env={DB:new D1()};env.DB.sqlite.exec("INSERT INTO price_tag_branch_prices VALUES(1,'powerbuild','Branch A',23000)");
 const before=await result(await listMasterRecords(get('&q=PAINT'),env,ctx()));assert.equal(before.data.records[0].details.selling_price_cents,23000);
 await syncStockCatalogue(write(),env,ctx());
 env.DB.sqlite.exec("UPDATE price_tag_branch_prices SET price_cents=25000 WHERE product_id=1");
 const after=await result(await listMasterRecords(get('&q=PAINT'),env,ctx()));assert.equal(after.data.records[0].details.selling_price_cents,25000);
});
test('duplicate Hub catalogue codes differing only by case block branch linking',async()=>{
 const env={DB:new D1()};env.DB.sqlite.exec("INSERT INTO catalogue_products VALUES(4,'paint001','Duplicate Paint','Paints',1,'2026-11-13')");
 const r=await result(await syncStockCatalogue(write(),env,ctx()));assert.equal(r.status,409);assert.match(r.data.error,/Duplicate catalogue product code/);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_master_records').get().n,0);
});
