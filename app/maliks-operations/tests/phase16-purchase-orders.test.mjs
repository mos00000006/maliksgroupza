import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canUsePurchase,validatePurchaseDraft,validatePurchaseAction,listPurchaseOrders,savePurchaseOrder,actionPurchaseOrder,purchaseAudit} from '../src/purchase-domain.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const admin={active:1,role:'Store Manager',name:'Store Manager',email:'admin@example.com'};
const buyer={active:1,role:'Buyer',name:'Buyer',email:'buyer@example.com'};
const manager={active:1,role:'Operations Manager',name:'Manager',email:'manager@example.com'};
const ctx=(member=buyer,branches=['Branch A'])=>({app:'management',member,branches});
const write=(path,data,origin='https://pos.example')=>new Request(origin+path,{method:'POST',headers:{origin,'x-maliks-original-origin':origin,'content-type':'application/json'},body:JSON.stringify(data)});
const get=(path)=>new Request('https://pos.example'+path);
const body=(id,overrides={})=>({request_id:uuid(id),branch:'Branch A',supplier_master_id:1,notes:'Order test',expected_date:'2026-12-01',lines:[{stock_id:2,quantity_milli:2000,unit_cost_cents:1500}],...overrides});
class LocalD1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');for(const file of ['phase15_master_files.sql','phase16_purchase_orders.sql'])this.sqlite.exec(readFileSync(new URL('../sql/'+file,import.meta.url),'utf8'));this.sqlite.exec(`INSERT INTO maliks_pos_master_records (id,kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id) VALUES
  (1,'supplier','Branch A','SUP1','Supplier',1,'{}',1,'a','a','x','x','a','a','a'),
  (2,'stock','Branch A','STK1','Stock item',1,'{"unit":"each"}',1,'a','a','x','x','b','b','b'),
  (3,'supplier','Branch B','SUP1','Supplier B',1,'{}',1,'a','a','x','x','c','c','c'),
  (4,'stock','Branch B','STK1','Stock B',1,'{"unit":"each"}',1,'a','a','x','x','d','d','d');`);}
 prepare(sql){const db=this.sqlite;let params=[];return {bind(...values){params=values;return this;},first(){return db.prepare(sql).get(...params)||null;},all(){return {results:db.prepare(sql).all(...params)};},run(){const r=db.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};}
 batch(statements){this.sqlite.exec('BEGIN');try{const results=statements.map(s=>s.run());this.sqlite.exec('COMMIT');return results;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const unpack=async res=>({status:res.status,data:await res.json()});
test('PO role and request validation',()=>{
 assert.equal(canUsePurchase(buyer,'write'),true);assert.equal(canUsePurchase(buyer,'approve'),false);assert.equal(canUsePurchase(manager,'approve'),true);
 assert.throws(()=>validatePurchaseDraft(body(1,{lines:[]})),/lines/);
 assert.throws(()=>validatePurchaseDraft(body(1,{lines:[{stock_id:2,quantity_milli:0,unit_cost_cents:5}]})),/quantity/);
 assert.throws(()=>validatePurchaseAction({action:'APPROVE',id:1,version:1,branch:'Branch A',request_id:'x',note:''}),/request ID/);
});
test('PO creation, idempotency, supplier and stock branch isolation',async()=>{
 const env={DB:new LocalD1()};const first=await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(1)),env,ctx()));
 assert.equal(first.status,200,JSON.stringify(first.data));assert.equal(first.data.po.total_cents,3000);assert.equal(first.data.po.status,'DRAFT');
 assert.equal((await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(1)),env,ctx()))).data.duplicate,true);
 assert.equal((await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(2,{branch:'Branch B'})),env,ctx()))).status,403);
 assert.equal((await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(3,{supplier_master_id:3})),env,ctx()))).status,409);
 const list=await unpack(await listPurchaseOrders(get('/v1/purchase-orders?branch=Branch%20A'),env,ctx()));assert.equal(list.data.orders.length,1);
 const audit=await unpack(await purchaseAudit(get('/v1/purchase-orders/audit?branch=Branch%20A&id=1'),env,ctx()));assert.equal(audit.data.audit[0].action,'CREATE');
});
test('PO draft edit, submission and independent approval',async()=>{
 const env={DB:new LocalD1()};const created=(await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(10)),env,ctx()))).data.po;
 const updated=await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(11,{id:created.id,version:1,notes:'Revised'})),env,ctx()));
 assert.equal(updated.status,200,JSON.stringify(updated.data));assert.equal(updated.data.po.version,2);
 assert.equal((await unpack(await savePurchaseOrder(write('/v1/purchase-orders',body(12,{id:created.id,version:1})),env,ctx()))).status,409);
 const act=(n,action,version,member,note='')=>actionPurchaseOrder(write('/v1/purchase-orders/action',{id:created.id,version,branch:'Branch A',action,note,request_id:uuid(n)}),env,ctx(member));
 const submitted=await unpack(await act(13,'SUBMIT',2,buyer));assert.equal(submitted.status,200,JSON.stringify(submitted.data));
 assert.equal((await unpack(await act(14,'APPROVE',3,buyer))).status,403);
 const approved=await unpack(await act(15,'APPROVE',3,manager));assert.equal(approved.status,200,JSON.stringify(approved.data));assert.equal(approved.data.po.status,'APPROVED');
 assert.equal((await unpack(await act(15,'APPROVE',3,manager))).data.duplicate,true);
 assert.equal((await unpack(await act(16,'CANCEL',4,manager,'No'))).status,409);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_po_audit').get().n,4);
});
