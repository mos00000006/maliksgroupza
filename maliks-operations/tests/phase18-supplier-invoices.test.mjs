import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canUseSupplierInvoice,validateSupplierInvoice,captureSupplierInvoice,listSupplierInvoices,supplierInvoiceAction} from '../src/supplier-invoice-domain.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const finance={active:1,role:'Finance Manager',name:'Finance',email:'finance@example.com'};
const clerk={active:1,role:'Creditors Clerk',name:'Creditor',email:'creditor@example.com'};
const outsider={active:1,role:'Sales / Tills',name:'Sales',email:'sales@example.com'};
const ctx=(member=clerk,branches=['Branch A'])=>({app:'management',member,branches});
const get=()=>new Request('https://pos.example/v1/supplier-invoices?branch=Branch%20A');
const write=(path,payload)=>new Request('https://pos.example'+path,{method:'POST',headers:{origin:'https://pos.example','x-maliks-original-origin':'https://pos.example'},body:JSON.stringify(payload)});
const body=(n,qty=2000,cost=10000)=>({branch:'Branch A',po_id:1,invoice_number:'INV-'+n,invoice_date:'2026-11-13',declared_vat_cents:Math.round(qty*cost/1000*.15),invoice_total_cents:Math.round(qty*cost/1000*1.15),lines:[{stock_id:2,qty_milli:qty,unit_cost_cents:cost}],request_id:uuid(n)});
const action=(n,id,version,op)=>({branch:'Branch A',id,version,action:op,request_id:uuid(n)});
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');
  for(const name of ['phase15_master_files.sql','phase16_purchase_orders.sql','phase17_inventory_flow.sql','phase18_supplier_invoice_matching.sql'])this.sqlite.exec(readFileSync(new URL('../sql/'+name,import.meta.url),'utf8'));
  this.sqlite.exec(`INSERT INTO maliks_pos_master_records(id,kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
   VALUES (1,'supplier','Branch A','SUP1','Supplier 1',1,'{}',1,'x','x','x','x','a','a','a'),
          (2,'stock','Branch A','STK1','Stock 1',1,'{"unit":"EA"}',1,'x','x','x','x','b','b','b');
   INSERT INTO maliks_pos_purchase_orders(id,branch,supplier_master_id,supplier_code,supplier_name,lines_json,total_cents,notes,expected_date,status,version,created_by_email,created_by_name,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
   VALUES(1,'Branch A',1,'SUP1','Supplier 1','[{"stock_id":2,"stock_code":"STK1","quantity_milli":5000,"unit_cost_cents":10000}]',50000,'','','APPROVED',3,'buyer@example.com','Buyer','x','x','p','p','p');
   INSERT INTO maliks_pos_receipts(id,po_id,branch,delivery_note,status,version,counted_by_email,created_at,updated_at,create_request_id,create_hash,last_request_id)
   VALUES(1,1,'Branch A','DN1','POSTED',3,'receiving@example.com','x','x','r','r','r');
   INSERT INTO maliks_pos_receipt_lines VALUES(1,2,3000,0);`);
 }
 prepare(sql){const db=this.sqlite;let args=[];return {bind(...v){args=v;return this;},first(){return db.prepare(sql).get(...args)||null;},all(){return {results:db.prepare(sql).all(...args)};},run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}
 batch(steps){this.sqlite.exec('BEGIN');try{const r=steps.map(x=>x.run());this.sqlite.exec('COMMIT');return r;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const res=async r=>({status:r.status,data:await r.json()});
test('finance permissions and invoice validation',()=>{
 assert.equal(canUseSupplierInvoice(clerk,'capture'),true);assert.equal(canUseSupplierInvoice(clerk,'verify'),false);assert.equal(canUseSupplierInvoice(finance,'verify'),true);
 assert.equal(canUseSupplierInvoice(outsider),false);assert.equal(validateSupplierInvoice(body(1)).net_cents,20000);
 assert.throws(()=>validateSupplierInvoice({...body(1),declared_vat_cents:999999}),/total|VAT/);
 assert.throws(()=>validateSupplierInvoice({...body(1),invoice_total_cents:100}),/total/);
 assert.throws(()=>validateSupplierInvoice({...body(1),lines:[...body(1).lines,...body(1).lines]}),/Duplicate/);
});
test('capture, independent verify and allocate once, with NO AP/VAT/GL posting',async()=>{
 const env={DB:new D1()};const input=body(1);
 const created=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',input),env,ctx()));assert.equal(created.status,200,JSON.stringify(created.data));
 assert.equal(created.data.invoice.status,'MATCHED');assert.equal(created.data.invoice.gross_cents,23000);
 const replay=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',input),env,ctx()));assert.equal(replay.data.duplicate,true);
 const sameActor=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(2,1,1,'VERIFY')),env,ctx(clerk)));assert.equal(sameActor.status,403);
 const verified=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(3,1,1,'VERIFY')),env,ctx(finance)));assert.equal(verified.status,200,JSON.stringify(verified.data));
 assert.equal(verified.data.invoice.status,'VERIFIED');assert.equal(verified.data.invoice.ap_posted,false);assert.equal(verified.data.invoice.vat_claimed,false);
 const repeated=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(3,1,1,'VERIFY')),env,ctx(finance)));assert.equal(repeated.data.duplicate,true);
 assert.equal(env.DB.sqlite.prepare('SELECT SUM(qty_milli) AS qty FROM maliks_pos_supplier_invoice_allocations').get().qty,2000);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_pos_supplier_invoice_audit').get().n,2);
 const list=await res(await listSupplierInvoices(get(),env,ctx(finance)));assert.equal(list.data.invoices.length,1);
});
test('no GRV or price mismatch is an exception; recheck can pass after receipt is posted',async()=>{
 const env={DB:new D1()};env.DB.sqlite.exec("UPDATE maliks_pos_receipts SET status='VERIFIED' WHERE id=1");
 const created=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(11,2000)),env,ctx()));assert.equal(created.data.invoice.status,'EXCEPTION');
 const blocked=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(12,1,1,'VERIFY')),env,ctx(finance)));assert.equal(blocked.status,409);
 env.DB.sqlite.exec("UPDATE maliks_pos_receipts SET status='POSTED' WHERE id=1");
 const rechecked=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(13,1,1,'RECHECK')),env,ctx()));assert.equal(rechecked.status,200,JSON.stringify(rechecked.data));assert.equal(rechecked.data.invoice.status,'MATCHED');
 const verified=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(14,1,2,'VERIFY')),env,ctx(finance)));assert.equal(verified.status,200);
 const mismatch=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(15,1000,12000)),env,ctx()));assert.equal(mismatch.data.invoice.status,'EXCEPTION');
});
test('two invoices cannot allocate more than posted GRV and cancelled invoice number may be recaptured',async()=>{
 const env={DB:new D1()};await captureSupplierInvoice(write('/v1/supplier-invoices',body(21,2000)),env,ctx());
 await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(22,1,1,'VERIFY')),env,ctx(finance));
 const over=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(23,2000)),env,ctx()));assert.equal(over.data.invoice.status,'EXCEPTION');
 assert.equal((await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(24,2,1,'VERIFY')),env,ctx(finance)))).status,409);
 const cancelled=await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(25,2,1,'CANCEL')),env,ctx()));assert.equal(cancelled.status,200);
 const duplicateNumber=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',{...body(26,1000),invoice_number:'INV-21'}),env,ctx()));assert.equal(duplicateNumber.status,409);
 const recycled=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',{...body(27,1000),invoice_number:'INV-23'}),env,ctx()));assert.equal(recycled.status,200);
 assert.equal(recycled.data.invoice.status,'MATCHED');
});
test('supplier invoice writes are branch-scoped and management-only',async()=>{
 const env={DB:new D1()};assert.equal((await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(31)),env,ctx(outsider)))).status,403);
 assert.equal((await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(32)),env,ctx(clerk,['Branch B'])))).status,403);
 assert.equal((await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(33)),env,{...ctx(),app:'pos'}))).status,403);
 assert.equal((await res(await listSupplierInvoices(get(),env,ctx(clerk,['Branch B'])))).status,403);
});
test('verification rechecks quantities after another matched invoice is verified',async()=>{
 const env={DB:new D1()};
 const a=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(41,2000)),env,ctx()));
 const b=await res(await captureSupplierInvoice(write('/v1/supplier-invoices',body(42,2000)),env,ctx()));
 assert.equal(a.data.invoice.status,'MATCHED');assert.equal(b.data.invoice.status,'MATCHED');
 assert.equal((await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(43,1,1,'VERIFY')),env,ctx(finance)))).status,200);
 assert.equal((await res(await supplierInvoiceAction(write('/v1/supplier-invoices/action',action(44,2,1,'VERIFY')),env,ctx(finance)))).status,409);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_supplier_invoice_allocations').get().n,1);
});
