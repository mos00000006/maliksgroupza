import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createStockControl,stockControlAction,listStockControl} from '../src/stock-control-domain.mjs';
import {listInventory} from '../src/inventory-domain.mjs';
import frontend from '../src/frontend.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const member=(role,email)=>({role,email,name:role,active:1,access_scope:'Assigned workspace'});
const counter=member('Receiving Clerk','counter@example.com');
const controller=member('Stock Controller','stock@example.com');
const manager=member('Store Manager','manager@example.com');
const manager2=member('Operations Manager','manager2@example.com');
const ctx=(m,branches=['Branch A'])=>({app:'management',member:m,branches});
const req=(path,body)=>new Request('https://pos.example'+path,{method:'POST',headers:{origin:'https://pos.example','x-maliks-original-origin':'https://pos.example'},body:JSON.stringify(body)});
const get=path=>new Request('https://pos.example'+path);
const result=async r=>({status:r.status,body:await r.json()});
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');for(const name of ['phase15_master_files.sql','phase16_purchase_orders.sql','phase17_inventory_flow.sql','phase20_stock_control.sql'])this.sqlite.exec(readFileSync(new URL('../sql/'+name,import.meta.url),'utf8'));
 this.sqlite.exec(`CREATE TABLE workspaces(name TEXT,type TEXT,active INTEGER);INSERT INTO workspaces VALUES('Branch A','Store',1),('Branch B','Store',1);
 INSERT INTO maliks_pos_master_records(id,kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id) VALUES
 (2,'stock','Branch A','STK1','Test stock',1,'{"unit":"each","category":"Tools","cost_cents":500,"reorder_min":5}',1,'a','a','x','x','a','a','a'),
 (3,'stock','Branch A','STK2','Other stock',1,'{"unit":"each"}',1,'a','a','x','x','b','b','b'),
 (5,'stock','Branch B','STK1','Branch B stock',1,'{"unit":"each"}',1,'a','a','x','x','c','c','c');`);
 }
 prepare(sql){const sqlite=this.sqlite;let params=[];return {bind(...v){params=v;return this;},first(){return sqlite.prepare(sql).get(...params)||null;},all(){return {results:sqlite.prepare(sql).all(...params)};},run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};}
 batch(steps){this.sqlite.exec('BEGIN');try{const out=steps.map(x=>x.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const env=()=>({DB:new D1()});
const opening=(id,stock_id=2,qty=10000)=>({branch:'Branch A',doc_type:'OPENING',reason:'Opening count from signed physical sheet',lines:[{stock_id,counted_milli:qty}],request_id:uuid(id)});
const adjust=(id,delta)=>({branch:'Branch A',doc_type:'ADJUSTMENT',reason:'Damaged stock write off approved',lines:[{stock_id:2,delta_milli:delta}],request_id:uuid(id)});
const take=(id,qty)=>({branch:'Branch A',doc_type:'STOCKTAKE',reason:'Weekly independent shelf count',lines:[{stock_id:2,counted_milli:qty}],request_id:uuid(id)});
const act=(id,docId,version,action,branch='Branch A')=>({branch,id:docId,version,action,request_id:uuid(id)});
const balance=db=>db.sqlite.prepare("SELECT qty_milli FROM maliks_pos_stock_balances WHERE branch='Branch A' AND stock_master_id=2").get()?.qty_milli||0;
test('migration is repeatable and all stock control routes stay in the management Worker',async()=>{
 const e=env();e.DB.sqlite.exec(readFileSync(new URL('../sql/phase20_stock_control.sql',import.meta.url),'utf8'));
 const html=await (await frontend.fetch(get('/'),{APP_TYPE:'pos'})).text();
 for(const label of ['suiteStockControl','suiteStockReport','Stock Adjustments','Stock Valuations','Opening Stock Count'])assert.ok(html.includes(label),label);
 assert.equal((await frontend.fetch(get('/api/stock-control'),{APP_TYPE:'sales'})).status,403);
 assert.equal((await frontend.fetch(get('/api/stock-control'),{APP_TYPE:'member'})).status,403);
});
test('opening count is independently approved and updates operational stock exactly once',async()=>{
 const e=env();const doc=await result(await createStockControl(req('/v1/stock-control',opening(1)),e,ctx(counter)));
 assert.equal(doc.status,200,JSON.stringify(doc.body));assert.equal(doc.body.document.status,'DRAFT');assert.equal(balance(e.DB),0);
 const denied=await result(await stockControlAction(req('/v1/stock-control/action',act(2,1,1,'POST')),e,ctx(counter)));
 assert.equal(denied.status,403);
 const posted=await result(await stockControlAction(req('/v1/stock-control/action',act(3,1,1,'POST')),e,ctx(manager)));
 assert.equal(posted.status,200,JSON.stringify(posted.body));assert.equal(balance(e.DB),10000);
 const again=await result(await stockControlAction(req('/v1/stock-control/action',act(3,1,1,'POST')),e,ctx(manager)));
 assert.equal(again.body.duplicate,true);assert.equal(balance(e.DB),10000);
 assert.equal(e.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_stock_control_movements').get().n,1);
 const inventory=await result(await listInventory(get('/v1/inventory?branch=Branch%20A'),e,ctx(controller)));
 assert.equal(inventory.status,200,JSON.stringify(inventory.body));assert.equal(inventory.body.movements[0].movement_type,'OPENING');
 assert.equal(inventory.body.items.find(x=>x.code==='STK1').qty_milli,10000);
 assert.equal(inventory.body.items.find(x=>x.code==='STK1').cost_cents,500);
});
test('stocktake reconciles to physical count, then signed negative adjustment is audited',async()=>{
 const e=env();await createStockControl(req('/v1/stock-control',opening(10)),e,ctx(counter));await stockControlAction(req('/v1/stock-control/action',act(11,1,1,'POST')),e,ctx(manager));
 const doc=await result(await createStockControl(req('/v1/stock-control',take(12,8000)),e,ctx(counter)));
 assert.equal(doc.status,200,JSON.stringify(doc.body));assert.equal(doc.body.document.lines[0].expected_qty_milli,10000);
 const posted=await result(await stockControlAction(req('/v1/stock-control/action',act(13,2,1,'POST')),e,ctx(manager)));
 assert.equal(posted.status,200,JSON.stringify(posted.body));assert.equal(balance(e.DB),8000);
 const adj=await result(await createStockControl(req('/v1/stock-control',adjust(14,-2000)),e,ctx(controller)));
 assert.equal(adj.status,200,JSON.stringify(adj.body));
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(15,3,1,'POST')),e,ctx(controller)))).status,403);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(16,3,1,'POST')),e,ctx(manager)))).status,200);
 assert.equal(balance(e.DB),6000);
 assert.deepEqual(e.DB.sqlite.prepare('SELECT movement_type,quantity_delta_milli FROM maliks_pos_stock_control_movements ORDER BY id').all().map(x=>[x.movement_type,x.quantity_delta_milli]),[['OPENING',10000],['STOCKTAKE',-2000],['ADJUSTMENT',-2000]]);
});
test('stale stocktake, negative adjustment and stale version are rejected atomically',async()=>{
 const e=env();await createStockControl(req('/v1/stock-control',opening(20)),e,ctx(counter));await stockControlAction(req('/v1/stock-control/action',act(21,1,1,'POST')),e,ctx(manager));
 const pending=await result(await createStockControl(req('/v1/stock-control',take(22,7000)),e,ctx(counter)));assert.equal(pending.status,200);
 const adj=await result(await createStockControl(req('/v1/stock-control',adjust(23,-1000)),e,ctx(controller)));assert.equal(adj.status,200);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(24,3,1,'POST')),e,ctx(manager)))).status,200);
 assert.equal(balance(e.DB),9000);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(25,2,1,'POST')),e,ctx(manager2)))).status,409);
 assert.equal(balance(e.DB),9000);
 const over=await result(await createStockControl(req('/v1/stock-control',adjust(26,-20000)),e,ctx(controller)));assert.equal(over.status,200);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(27,4,1,'POST')),e,ctx(manager)))).status,409);
 assert.equal(balance(e.DB),9000);
 assert.equal(e.DB.sqlite.prepare('SELECT status FROM maliks_pos_stock_control_docs WHERE id=4').get().status,'DRAFT');
});
test('duplicate request IDs, branch isolation, cancelled drafts and unauthorized actions',async()=>{
 const e=env();const v=opening(30);
 assert.equal((await result(await createStockControl(req('/v1/stock-control',v),e,ctx(counter)))).status,200);
 assert.equal((await result(await createStockControl(req('/v1/stock-control',v),e,ctx(counter)))).body.duplicate,true);
 assert.equal((await result(await createStockControl(req('/v1/stock-control',{...v,reason:'Different physical count reason'}),e,ctx(counter)))).status,409);
 assert.equal((await result(await listStockControl(get('/v1/stock-control?branch=Branch%20A'),e,ctx(counter,['Branch B'])))).status,403);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(31,1,1,'POST','Branch B')),e,ctx(manager,['Branch B'])))).status,404);
 const cancelled=await result(await stockControlAction(req('/v1/stock-control/action',act(32,1,1,'CANCEL')),e,ctx(manager)));assert.equal(cancelled.status,200);
 assert.equal((await result(await stockControlAction(req('/v1/stock-control/action',act(33,1,2,'POST')),e,ctx(manager2)))).status,409);
 assert.equal(balance(e.DB),0);
});
test('opening count rejects items with posted GRV/transfer/previous count movement',async()=>{
 const e=env();await createStockControl(req('/v1/stock-control',opening(40)),e,ctx(counter));await stockControlAction(req('/v1/stock-control/action',act(41,1,1,'POST')),e,ctx(manager));
 assert.equal((await result(await createStockControl(req('/v1/stock-control',opening(42)),e,ctx(counter)))).status,409);
});
test('inventory list supports pagination beyond 150 linked Hub products and branch-safe searching',async()=>{
 const e=env();const stmt=e.DB.sqlite.prepare(`INSERT INTO maliks_pos_master_records(kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
 VALUES ('stock','Branch A',?, ?,1,'{"unit":"each"}',1,'a','a','x','x',?,?,?)`);
 for(let n=0;n<160;n++){const id='CAT-'+String(n).padStart(4,'0');stmt.run(id,'Catalogue '+n,'q'+n,'h'+n,'l'+n);}
 const first=await result(await listInventory(get('/v1/inventory?branch=Branch%20A&page=1'),e,ctx(controller)));
 const second=await result(await listInventory(get('/v1/inventory?branch=Branch%20A&page=2'),e,ctx(controller)));
 assert.equal(first.status,200);assert.equal(first.body.items.length,150);assert.equal(first.body.total,162);
 assert.equal(second.status,200);assert.equal(second.body.items.length,12);assert.equal(second.body.pages,2);
 const found=await result(await listInventory(get('/v1/inventory?branch=Branch%20A&q=CAT-0159'),e,ctx(controller)));
 assert.equal(found.body.items.length,1);assert.equal(found.body.items[0].code,'CAT-0159');
 assert.equal((await result(await listInventory(get('/v1/inventory?branch=Branch%20A&page=0'),e,ctx(controller)))).status,400);
});
