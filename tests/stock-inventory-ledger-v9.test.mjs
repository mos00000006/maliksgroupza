import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const v1=readFileSync(new URL('../drizzle/0056_stock_operations_control_register.sql',import.meta.url),'utf8');
const live=readFileSync(new URL('../drizzle/0057_stock_inventory_ledger.sql',import.meta.url),'utf8');
const db=()=>{const d=new DatabaseSync(':memory:');d.exec(v1);d.exec(live);return d;};
let seq=1;
function doc(d,kind='GRV',branch='A',dest='',lines=[{id:1,quantity:5,expected:0,rejected:0}]){
 const id=`doc${seq++}`;
 d.prepare(`INSERT INTO stock_ops_documents (id,document_number,client_request_id,kind,branch_name,destination_branch,created_by,created_at,last_action_by)
 VALUES (?,?,?,?,?,?,'creator','2026-11-06','creator')`).run(id,`ST-${id}`,id,kind,branch,dest);
 const q=d.prepare(`INSERT INTO stock_ops_document_lines(document_id,line_no,catalogue_product_id,product_code,product_name,document_quantity,expected_quantity,rejected_quantity)
 VALUES(?,?,?,?,?,?,?,?)`);
 lines.forEach((l,i)=>q.run(id,i+1,l.id,`SKU-${l.id}`,`Product ${l.id}`,l.quantity,l.expected??0,l.rejected??0));
 d.prepare("UPDATE stock_ops_documents SET status='Submitted',last_action_by='creator' WHERE id=?").run(id);
 return id;
}
function approve(d,id,manager='manager'){d.prepare("UPDATE stock_ops_documents SET status='Approved',reviewed_by=?,reviewed_at='2026-11-06',last_action_by=? WHERE id=?").run(manager,manager,id);}
function receive(d,id){d.prepare("UPDATE stock_ops_documents SET status='Received',received_by='receiver',received_at='2026-11-06',last_action_by='receiver' WHERE id=?").run(id);}
function opening(d,branch,id,qty){d.prepare("INSERT OR IGNORE INTO stock_inventory_branches(branch_name,created_at,created_by) VALUES(?,'now','owner')").run(branch);
 d.prepare("INSERT INTO stock_inventory_balances(branch_name,catalogue_product_id,qty_milli,initialized_at,initialized_by,opening_reference) VALUES(?,?,?,'now','owner','VERIFIED-COUNT')").run(branch,id,Math.round(qty*1000));}
function activate(d,branch){d.prepare("UPDATE stock_inventory_branches SET active=1,activated_at='now',activated_by='owner',activation_reference='COUNT-VERIFIED' WHERE branch_name=?").run(branch);}
function balance(d,branch,id=1){return d.prepare('SELECT qty_milli FROM stock_inventory_balances WHERE branch_name=? AND catalogue_product_id=?').get(branch,id)?.qty_milli;}
function movement(d,id){return d.prepare('SELECT phase,branch_name,delta_milli,balance_after_milli FROM stock_inventory_movements WHERE document_id=? ORDER BY id').all(id).map(r=>({...r}));}

test('no auto-posting while inventory branch is not activated; activation never replays old approvals',()=>{
 const d=db();opening(d,'A',1,10);const id=doc(d);approve(d,id);assert.equal(balance(d,'A'),10000);activate(d,'A');assert.equal(balance(d,'A'),10000);assert.equal(movement(d,id).length,0);d.close();
});
test('GRV posts accepted quantities only and is impossible to post twice',()=>{
 const d=db();opening(d,'A',1,10);activate(d,'A');const id=doc(d,'GRV','A','',[{id:1,quantity:7,expected:10,rejected:2}]);approve(d,id);
 assert.equal(balance(d,'A'),15000);assert.deepEqual(movement(d,id),[{phase:'APPROVAL',branch_name:'A',delta_milli:5000,balance_after_milli:15000}]);
 assert.throws(()=>approve(d,id),/Invalid stock document transition/);assert.equal(balance(d,'A'),15000);d.close();
});
test('stock count reconcile is atomic, and stale count or adjustment is rejected',()=>{
 const d=db();opening(d,'A',1,10);activate(d,'A');const id=doc(d,'COUNT','A','',[{id:1,quantity:8,expected:10}]);approve(d,id);assert.equal(balance(d,'A'),8000);
 const stale=doc(d,'ADJUSTMENT','A','',[{id:1,quantity:6,expected:10}]);assert.throws(()=>approve(d,stale),/Stock changed since counted/);
 assert.equal(d.prepare('SELECT status FROM stock_ops_documents WHERE id=?').get(stale).status,'Submitted');assert.equal(balance(d,'A'),8000);
 const fresh=doc(d,'ADJUSTMENT','A','',[{id:1,quantity:9.5,expected:8}]);approve(d,fresh);assert.equal(balance(d,'A'),9500);d.close();
});
test('supplier return cannot make stock negative and approval remains Submitted',()=>{
 const d=db();opening(d,'A',1,3);activate(d,'A');const id=doc(d,'SUPPLIER_RETURN','A','',[{id:1,quantity:4}]);assert.throws(()=>approve(d,id),/Insufficient available stock/);
 assert.equal(balance(d,'A'),3000);assert.equal(d.prepare('SELECT status FROM stock_ops_documents WHERE id=?').get(id).status,'Submitted');d.close();
});
test('transfer debits source at approval and credits destination at independent receipt',()=>{
 const d=db();opening(d,'A',1,12);opening(d,'B',1,0);activate(d,'A');activate(d,'B');const id=doc(d,'TRANSFER','A','B',[{id:1,quantity:7,expected:12}]);approve(d,id);
 assert.equal(balance(d,'A'),5000);assert.equal(balance(d,'B'),0);assert.equal(movement(d,id).length,1);
 assert.throws(()=>d.prepare("UPDATE stock_ops_documents SET status='Received',last_action_by='manager' WHERE id=?").run(id),/Invalid stock document transition/);
 receive(d,id);assert.equal(balance(d,'B'),7000);assert.deepEqual(movement(d,id).map(x=>x.phase),['APPROVAL','RECEIPT']);d.close();
});
test('transfer blocks when only one branch is activated and when destination lacks baseline',()=>{
 const d=db();opening(d,'A',1,10);opening(d,'B',1,0);activate(d,'A');const id=doc(d,'TRANSFER','A','B');assert.throws(()=>approve(d,id),/Both transfer branches/);
 activate(d,'B');const missing=doc(d,'TRANSFER','A','B',[{id:2,quantity:1}]);opening(d,'A',2,5);
 assert.throws(()=>approve(d,missing),/Destination SKU has no opening/);d.close();
});
test('uninitialized SKU fails closed; cannot approve a zero-line GRV',()=>{
 const d=db();opening(d,'A',1,8);activate(d,'A');const id=doc(d,'GRV','A','',[{id:2,quantity:10}]);assert.throws(()=>approve(d,id),/Missing verified opening balance/);
 const empty=doc(d,'GRV','A','',[]);assert.throws(()=>approve(d,empty),/Cannot post a stock document without products/);d.close();
});
test('opening stock is audited and cannot be edited, deleted or activated with no baseline',()=>{
 const d=db();d.prepare("INSERT INTO stock_inventory_branches(branch_name,created_at,created_by) VALUES('B','now','owner')").run();assert.throws(()=>activate(d,'B'),/Load verified opening stock/);
 opening(d,'A',1,12.125);activate(d,'A');assert.equal(balance(d,'A'),12125);
 assert.deepEqual(movement(d,'OPEN:A:1').map(x=>x.phase),['OPENING']);
 assert.throws(()=>d.prepare('DELETE FROM stock_inventory_movements').run(),/immutable/);
 assert.throws(()=>d.prepare('DELETE FROM stock_inventory_balances').run(),/cannot be deleted/);
 assert.throws(()=>d.prepare("UPDATE stock_inventory_balances SET opening_reference='alter' ").run(),/immutable/);
 assert.throws(()=>d.prepare("UPDATE stock_inventory_branches SET active=0 WHERE branch_name='A'").run(),/cannot be reset/);
 assert.throws(()=>d.prepare("DELETE FROM stock_inventory_branches WHERE branch_name='A'").run(),/immutable/);d.close();
});
test('multiple document lines post atomically or none if one SKU is short',()=>{
 const d=db();opening(d,'A',1,10);opening(d,'A',2,1);activate(d,'A');const id=doc(d,'SUPPLIER_RETURN','A','',[{id:1,quantity:2},{id:2,quantity:4}]);assert.throws(()=>approve(d,id),/Insufficient available stock/);
 assert.equal(balance(d,'A',1),10000);assert.equal(balance(d,'A',2),1000);assert.equal(movement(d,id).length,0);d.close();
});
test('cannot credit an old transfer on receipt when source was not posted',()=>{
 const d=db();opening(d,'A',1,10);opening(d,'B',1,0);
 const id=doc(d,'TRANSFER','A','B');approve(d,id);activate(d,'A');activate(d,'B');
 assert.throws(()=>receive(d,id),/Cannot receive old transfer/);assert.equal(balance(d,'B'),0);d.close();
});
