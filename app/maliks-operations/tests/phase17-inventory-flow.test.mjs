import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canUseInventory,countReceipt,listReceipts,receiptAction,listInventory,createTransfer,transferAction,listTransfers} from '../src/inventory-domain.mjs';
import {savePurchaseOrder,actionPurchaseOrder} from '../src/purchase-domain.mjs';
import frontend from '../src/frontend.mjs';
import {canUseApp} from '../src/policy.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const user=(role,email)=>({role,email,name:role,active:1,access_scope:'Assigned workspace'});
const buyer=user('Buyer','buyer@example.com');const approver=user('Operations Manager','manager@example.com');
const counter=user('Receiving Clerk','counter@example.com');const verifier=user('Receiving Manager','verify@example.com');const poster=user('GRV Clerk','grv@example.com');
const stocker=user('Stock Controller','stocker@example.com');const receiver=user('Receiving Clerk','receiver@example.com');
const ctx=(member,branches=['Branch A'])=>({app:'management',member,branches});
const write=(path,body)=>new Request('https://pos.example'+path,{method:'POST',headers:{origin:'https://pos.example','x-maliks-original-origin':'https://pos.example'},body:JSON.stringify(body)});
const get=path=>new Request('https://pos.example'+path);
const result=async r=>({status:r.status,body:await r.json()});
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');for(const name of ['phase15_master_files.sql','phase16_purchase_orders.sql','phase17_inventory_flow.sql'])this.sqlite.exec(readFileSync(new URL('../sql/'+name,import.meta.url),'utf8'));
 this.sqlite.exec(`CREATE TABLE workspaces(name TEXT,type TEXT,active INTEGER);INSERT INTO workspaces VALUES('Branch A','Store',1),('Branch B','Store',1);
 INSERT INTO maliks_pos_master_records(id,kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id) VALUES
 (1,'supplier','Branch A','SUP1','Supplier',1,'{}',1,'a','a','x','x','a','a','a'),
 (2,'stock','Branch A','STK1','Stock item',1,'{"unit":"each"}',1,'a','a','x','x','b','b','b'),
 (3,'stock','Branch A','STK2','Other item',1,'{"unit":"each"}',1,'a','a','x','x','c','c','c'),
 (4,'supplier','Branch B','SUP1','Supplier B',1,'{}',1,'a','a','x','x','d','d','d'),
 (5,'stock','Branch B','STK1','Stock B',1,'{"unit":"each"}',1,'a','a','x','x','e','e','e');`);}
 prepare(sql){const sqlite=this.sqlite;let params=[];return {bind(...v){params=v;return this;},first(){return sqlite.prepare(sql).get(...params)||null;},all(){return {results:sqlite.prepare(sql).all(...params)};},run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};}
 batch(steps){this.sqlite.exec('BEGIN');try{const result=steps.map(s=>s.run());this.sqlite.exec('COMMIT');return result;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
async function setup(){
 const env={DB:new D1()};
 const po=await result(await savePurchaseOrder(write('/v1/purchase-orders',{branch:'Branch A',supplier_master_id:1,expected_date:'',notes:'',lines:[{stock_id:2,quantity_milli:5000,unit_cost_cents:2000}],request_id:uuid(1)}),env,ctx(buyer)));
 assert.equal(po.status,200,JSON.stringify(po.body));
 const sub=await result(await actionPurchaseOrder(write('/v1/purchase-orders/action',{branch:'Branch A',id:1,version:1,action:'SUBMIT',note:'',request_id:uuid(2)}),env,ctx(buyer)));assert.equal(sub.status,200,JSON.stringify(sub.body));
 const approve=await result(await actionPurchaseOrder(write('/v1/purchase-orders/action',{branch:'Branch A',id:1,version:2,action:'APPROVE',note:'',request_id:uuid(3)}),env,ctx(approver)));assert.equal(approve.status,200,JSON.stringify(approve.body));
 return env;
}
const count=(n,lines)=>({branch:'Branch A',po_id:1,delivery_note:'DN-'+n,supplier_invoice_reference:'INV-TEST',driver_name:'Driver',notes:'',lines,request_id:uuid(n)});
const line=(accepted,rejected=0)=>[{stock_id:2,accepted_milli:accepted,rejected_milli:rejected}];
const act=(n,id,version,action,branch='Branch A')=>({id,version,action,branch,request_id:uuid(n)});
const transfer=(n,qty)=>({source_branch:'Branch A',destination_branch:'Branch B',notes:'',lines:[{stock_id:2,qty_milli:qty}],request_id:uuid(n)});
test('roles, migration idempotence, and frontend route separation',async()=>{
 assert.equal(canUseApp(counter,'management'),true);assert.equal(canUseApp(poster,'management'),true);
 assert.equal(canUseInventory(counter,'count'),true);assert.equal(canUseInventory(counter,'post'),false);
 assert.equal(canUseInventory(verifier,'verify'),true);assert.equal(canUseInventory(poster,'post'),true);
 const db=new D1();db.sqlite.exec(readFileSync(new URL('../sql/phase17_inventory_flow.sql',import.meta.url),'utf8'));
 const html=await (await frontend.fetch(get('/'),{APP_TYPE:'pos'})).text();
 for(const label of ['suitePurchaseOrders','suiteReceiving','suiteStockBalances','suiteTransfers'])assert.ok(html.includes(label),label);
 const blocked=await frontend.fetch(get('/api/receipts'),{APP_TYPE:'sales'});assert.equal(blocked.status,403);
});
test('count → verify → post GRV, no damaged stock, idempotent retry, no cross-branch reads',async()=>{
 const env=await setup();const request=count(10,line(3000,1000));
 const counted=await result(await countReceipt(write('/v1/receipts',request),env,ctx(counter)));assert.equal(counted.status,200,JSON.stringify(counted.body));assert.equal(counted.body.receipt.status,'COUNTED');
 const retry=await result(await countReceipt(write('/v1/receipts',request),env,ctx(counter)));assert.equal(retry.body.duplicate,true);
 assert.equal((await result(await countReceipt(write('/v1/receipts',count(11,line(3000))),env,ctx(counter)))).status,409);
 assert.equal((await result(await receiptAction(write('/v1/receipts/action',act(12,1,1,'VERIFY')),env,ctx(counter)))).status,403);
 const verified=await result(await receiptAction(write('/v1/receipts/action',act(13,1,1,'VERIFY')),env,ctx(verifier)));assert.equal(verified.status,200,JSON.stringify(verified.body));
 assert.equal((await result(await receiptAction(write('/v1/receipts/action',act(14,1,2,'POST')),env,ctx(verifier)))).status,403);
 const posted=await result(await receiptAction(write('/v1/receipts/action',act(15,1,2,'POST')),env,ctx(poster)));assert.equal(posted.status,200,JSON.stringify(posted.body));
 assert.equal(posted.body.receipt.status,'POSTED');
 assert.equal((await result(await receiptAction(write('/v1/receipts/action',act(15,1,2,'POST')),env,ctx(poster)))).body.duplicate,true);
 const inventory=await result(await listInventory(get('/v1/inventory?branch=Branch%20A'),env,ctx(stocker)));
 assert.equal(inventory.status,200);assert.equal(inventory.body.items.find(x=>x.code==='STK1').qty_milli,3000);
 assert.equal(inventory.body.movements.length,1);assert.equal(inventory.body.movements[0].movement_type,'GRV');
 assert.equal((await result(await listReceipts(get('/v1/receipts?branch=Branch%20A'),env,ctx(counter,['Branch B'])))).status,403);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_receipt_audit').get().n,3);
});
test('partial receipts can be completed later; cancelled counts release outstanding quantities',async()=>{
 const env=await setup();
 assert.equal((await result(await countReceipt(write('/v1/receipts',count(20,line(3000))),env,ctx(counter)))).status,200);
 assert.equal((await result(await countReceipt(write('/v1/receipts',count(21,line(2000))),env,ctx(counter)))).status,200);
 assert.equal((await result(await countReceipt(write('/v1/receipts',count(22,line(1))),env,ctx(counter)))).status,409);
 const cancelled=await result(await receiptAction(write('/v1/receipts/action',act(23,2,1,'CANCEL')),env,ctx(approver)));assert.equal(cancelled.status,200);
 assert.equal((await result(await countReceipt(write('/v1/receipts',count(24,line(2000))),env,ctx(counter)))).status,200);
});
test('GRV stock can transfer out and in, independent users, no negative stock',async()=>{
 const env=await setup();
 await countReceipt(write('/v1/receipts',count(30,line(5000))),env,ctx(counter));
 await receiptAction(write('/v1/receipts/action',act(31,1,1,'VERIFY')),env,ctx(verifier));
 await receiptAction(write('/v1/receipts/action',act(32,1,2,'POST')),env,ctx(poster));
 const created=await result(await createTransfer(write('/v1/transfers',transfer(33,3000)),env,ctx(stocker)));assert.equal(created.status,200,JSON.stringify(created.body));
 assert.equal((await result(await transferAction(write('/v1/transfers/action',act(34,1,1,'SEND')),env,ctx(stocker)))).status,403);
 const sent=await result(await transferAction(write('/v1/transfers/action',act(35,1,1,'SEND')),env,ctx(approver)));assert.equal(sent.status,200,JSON.stringify(sent.body));assert.equal(sent.body.transfer.status,'IN_TRANSIT');
 assert.equal((await result(await transferAction(write('/v1/transfers/action',act(36,1,2,'RECEIVE','Branch B')),env,ctx(approver,['Branch B'])))).status,403);
 const received=await result(await transferAction(write('/v1/transfers/action',act(37,1,2,'RECEIVE','Branch B')),env,ctx(receiver,['Branch B'])));assert.equal(received.status,200,JSON.stringify(received.body));
 assert.equal(received.body.transfer.status,'RECEIVED');
 assert.equal((await result(await transferAction(write('/v1/transfers/action',act(37,1,2,'RECEIVE','Branch B')),env,ctx(receiver,['Branch B'])))).body.duplicate,true);
 const a=await result(await listInventory(get('/v1/inventory?branch=Branch%20A'),env,ctx(stocker)));
 const b=await result(await listInventory(get('/v1/inventory?branch=Branch%20B'),env,ctx(receiver,['Branch B'])));
 assert.equal(a.body.items.find(x=>x.code==='STK1').qty_milli,2000);assert.equal(b.body.items.find(x=>x.code==='STK1').qty_milli,3000);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_stock_movements').get().n,3);
 const over=await result(await createTransfer(write('/v1/transfers',transfer(38,2500)),env,ctx(stocker)));assert.equal(over.status,200);
 const denied=await result(await transferAction(write('/v1/transfers/action',act(39,2,1,'SEND')),env,ctx(approver)));assert.equal(denied.status,409);
 assert.equal(env.DB.sqlite.prepare("SELECT status FROM maliks_pos_transfers WHERE id=2").get().status,'DRAFT');
 assert.equal(env.DB.sqlite.prepare("SELECT qty_milli FROM maliks_pos_stock_balances WHERE branch='Branch A' AND stock_master_id=2").get().qty_milli,2000);
});
test('destination must have stock code and branch scope prevents unauthorised transfers',async()=>{
 const env=await setup();
 assert.equal((await result(await createTransfer(write('/v1/transfers',{...transfer(40,1000),destination_branch:'Unknown'}),env,ctx(stocker)))).status,409);
 assert.equal((await result(await createTransfer(write('/v1/transfers',{...transfer(41,1000),source_branch:'Branch B'}),env,ctx(stocker)))).status,403);
 assert.equal((await result(await listTransfers(get('/v1/transfers?branch=Branch%20B'),env,ctx(stocker)))).status,403);
});
test('GRV labels are printed by GRV role, labelled by receiving, then checked by store manager',async()=>{
 const env=await setup();
 await countReceipt(write('/v1/receipts',count(60,line(2000))),env,ctx(counter));
 await receiptAction(write('/v1/receipts/action',act(61,1,1,'VERIFY')),env,ctx(verifier));
 const premature=await result(await receiptAction(write('/v1/receipts/action',act(62,1,2,'PRINT_LABELS')),env,ctx(poster)));
 assert.equal(premature.status,409);
 await receiptAction(write('/v1/receipts/action',act(63,1,2,'POST')),env,ctx(poster));
 const printed=await result(await receiptAction(write('/v1/receipts/action',act(64,1,3,'PRINT_LABELS')),env,ctx(poster)));
 assert.equal(printed.status,200,JSON.stringify(printed.body));assert.equal(printed.body.receipt.labels_printed_by,poster.email);
 assert.equal((await result(await receiptAction(write('/v1/receipts/action',act(65,1,4,'LABELLED')),env,ctx(poster)))).status,403);
 const labelled=await result(await receiptAction(write('/v1/receipts/action',act(66,1,4,'LABELLED')),env,ctx(counter)));
 assert.equal(labelled.status,200,JSON.stringify(labelled.body));assert.equal(labelled.body.receipt.labelled_by,counter.email);
 assert.equal((await result(await receiptAction(write('/v1/receipts/action',act(67,1,5,'PACK_CHECK')),env,ctx(poster)))).status,403);
 const checked=await result(await receiptAction(write('/v1/receipts/action',act(68,1,5,'PACK_CHECK')),env,ctx(approver)));
 assert.equal(checked.status,200,JSON.stringify(checked.body));assert.equal(checked.body.receipt.pack_checked_by,approver.email);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_stock_movements').get().n,1);
});
test('duplicate delivery note cannot create a second count, even when remaining PO qty exists',async()=>{
 const env=await setup();const a=await result(await countReceipt(write('/v1/receipts',count(70,line(1000))),env,ctx(counter)));
 assert.equal(a.status,200);
 const b=await result(await countReceipt(write('/v1/receipts',{...count(71,line(1000)),delivery_note:'dn-70'}),env,ctx(counter)));
 assert.equal(b.status,409);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_receipts').get().n,1);
});
test('two-line transfer rolls back all stock movements if any item is insufficient',async()=>{
 const env=await setup();
 env.DB.sqlite.exec(`INSERT INTO maliks_pos_master_records(id,kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
 VALUES (6,'stock','Branch B','STK2','Other B',1,'{"unit":"each"}',1,'a','a','x','x','f','f','f');
 INSERT INTO maliks_pos_stock_balances VALUES('Branch A',2,2000,1,'x'),('Branch A',3,500,1,'x');`);
 const created=await result(await createTransfer(write('/v1/transfers',{source_branch:'Branch A',destination_branch:'Branch B',notes:'',lines:[{stock_id:2,qty_milli:1000},{stock_id:3,qty_milli:1000}],request_id:uuid(80)}),env,ctx(stocker)));
 assert.equal(created.status,200,JSON.stringify(created.body));
 const sent=await result(await transferAction(write('/v1/transfers/action',act(81,1,1,'SEND')),env,ctx(approver)));
 assert.equal(sent.status,409);
 const quantities=env.DB.sqlite.prepare("SELECT stock_master_id,qty_milli FROM maliks_pos_stock_balances WHERE branch='Branch A' ORDER BY stock_master_id").all();
 assert.deepEqual(quantities.map(x=>x.qty_milli),[2000,500]);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_stock_movements').get().n,0);
 assert.equal(env.DB.sqlite.prepare('SELECT status FROM maliks_pos_transfers WHERE id=1').get().status,'DRAFT');
});
