import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { listMasterRecords, syncStockCatalogue } from '../src/master-domain.mjs';
import frontend from '../src/frontend.mjs';

const member = {active:1,role:'Owner / Admin',email:'manager@example.test',name:'Manager',access_scope:'Full company'};
const context = branch => ({app:'management',member,branches:[branch]});
const request = branch => new Request('https://pos.test/v1/master/records?kind=stock&branch='+encodeURIComponent(branch));
const syncRequest = (branch,id) => new Request('https://pos.test/v1/master/catalogue/sync', {
  method:'POST',headers:{origin:'https://pos.test','x-maliks-original-origin':'https://pos.test'},
  body:JSON.stringify({branch,request_id:'00000000-0000-4000-8000-'+String(id).padStart(12,'0')})
});
class D1 {
  constructor(){
    this.sqlite=new DatabaseSync(':memory:');
    this.sqlite.exec(readFileSync(new URL('../sql/phase15_master_files.sql',import.meta.url),'utf8'));
    this.sqlite.exec(`
      CREATE TABLE catalogue_products (id INTEGER PRIMARY KEY,code TEXT UNIQUE,name TEXT,category TEXT,active INTEGER,updated_at TEXT);
      CREATE TABLE powerbuild_price_tags (product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
      CREATE TABLE busterbuild_price_tags (product_id INTEGER,published INTEGER,unit TEXT,price_cents INTEGER);
      CREATE TABLE price_tag_branch_prices (product_id INTEGER,brand TEXT,branch_name TEXT,price_cents INTEGER);
      CREATE TABLE maliks_pos_stock_balances (branch TEXT NOT NULL COLLATE NOCASE,stock_master_id INTEGER NOT NULL,qty_milli INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,PRIMARY KEY(branch,stock_master_id));
      INSERT INTO catalogue_products VALUES (1,'CEM001','Cement 50KG','Cement',1,'2026-11-16'),(2,'TILE001','Floor Tile','Tiles',1,'2026-11-16');
      INSERT INTO powerbuild_price_tags VALUES (1,1,'BAG',10550);
      INSERT INTO price_tag_branch_prices VALUES (1,'powerbuild','Branch A',11995);
    `);
  }
  prepare(sql){const db=this.sqlite;let params=[];return {bind(...x){params=x;return this;},first(){return db.prepare(sql).get(...params)||null;},all(){return {results:db.prepare(sql).all(...params)};},run(){return {meta:{changes:Number(db.prepare(sql).run(...params).changes)}};}};}
  batch(steps){this.sqlite.exec('BEGIN');try{const outcome=steps.map(s=>s.run());this.sqlite.exec('COMMIT');return outcome;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}

test('Branch Stock Master shows catalogue description, branch price and only its own posted SOH',async()=>{
 const env={DB:new D1()};
 const before=await (await listMasterRecords(request('Branch A'),env,context('Branch A'))).json();
 assert.equal(before.records[0].linked,false);
 assert.equal(before.records[0].on_hand_milli,null,'unlinked stock must not be misrepresented as zero on-hand');
 assert.equal(before.records[0].details.selling_price_cents,11995);
 assert.equal(before.records[0].name,'Cement 50KG');
 assert.equal(before.records[1].price_available,false,'unpublished product must not display a fake sale price');
 for(const [branch,n] of [['Branch A',1],['Branch B',2]]){
   const r=await syncStockCatalogue(syncRequest(branch,n),env,context(branch));assert.equal(r.status,200,await r.text());
 }
 const aId=env.DB.sqlite.prepare("SELECT id FROM maliks_pos_master_records WHERE branch='Branch A' AND code='CEM001'").get().id;
 const bId=env.DB.sqlite.prepare("SELECT id FROM maliks_pos_master_records WHERE branch='Branch B' AND code='CEM001'").get().id;
 env.DB.sqlite.prepare('INSERT INTO maliks_pos_stock_balances VALUES(?,?,?,?,?)').run('Branch A',aId,7250,1,'2026-11-16');
 env.DB.sqlite.prepare('INSERT INTO maliks_pos_stock_balances VALUES(?,?,?,?,?)').run('Branch B',bId,555000,1,'2026-11-16');
 const a=await (await listMasterRecords(request('Branch A'),env,context('Branch A'))).json();
 const b=await (await listMasterRecords(request('Branch B'),env,context('Branch B'))).json();
 assert.equal(a.records.find(x=>x.code==='CEM001').on_hand_milli,7250);
 assert.equal(b.records.find(x=>x.code==='CEM001').on_hand_milli,555000);
 assert.equal(a.records.find(x=>x.code==='TILE001').on_hand_milli,0,'linked item with no posted ledger balance reports zero');
 assert.equal(a.records.find(x=>x.code==='CEM001').details.selling_price_cents,11995);
 assert.equal((await listMasterRecords(request('Branch B'),env,context('Branch A'))).status,403,'a user cannot request another branch');
});

test('POS stock list includes selling price, recorded on-hand, double-click and keyboard edit; edits preserve Hub authority',async()=>{
 const page=await (await frontend.fetch(new Request('https://pos.test/'),{APP_TYPE:'pos'})).text();
 assert.match(page,/\['Code','Description','Category','Selling price','On hand','Unit','Status','Action'\]/);
 assert.match(page,/tr\.addEventListener\('dblclick',open\)/);
 assert.match(page,/event\.key==='Enter'/);
 assert.match(page,/masterPermissions\.stock\?\.write/);
 assert.match(page,/record\.price_available\?formatMoney/);
 assert.match(page,/record\.linked\?formatQty/);
 assert.match(page,/Record(?:ed)? on hand|Recorded on hand/);
 assert.match(page,/Stock Adjustment \/ Stock Take/);
 assert.match(page,/selling_price_cents'\]\.includes\(key\)\)input\.readOnly=true/);
 assert.match(page,/sales deductions are not yet integrated/);
});
