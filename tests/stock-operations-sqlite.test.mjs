import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const ddl=readFileSync(new URL('../drizzle/0056_stock_operations_control_register.sql',import.meta.url),'utf8');
test('SQLite atomic statuses, immutable lines and append-only audit',()=>{
 const db=new DatabaseSync(':memory:');db.exec(ddl);
 const ins=db.prepare("INSERT INTO stock_ops_documents(id,document_number,client_request_id,kind,branch_name,status,created_by,created_at,last_action_by) VALUES (?,?,?,?,?,'Draft',?,?,?)");
 ins.run('id','ST-GRV-01','req','GRV','TEST','seller@branch','2026-11-06','seller@branch');
 db.prepare("INSERT INTO stock_ops_document_lines(document_id,line_no,catalogue_product_id,product_code,product_name,document_quantity) VALUES ('id',1,1,'A','Product',3)").run();
 db.prepare("UPDATE stock_ops_documents SET status='Submitted',last_action_by=? WHERE id='id'").run('seller@branch');
 assert.throws(()=>db.prepare("UPDATE stock_ops_documents SET status='Approved',last_action_by=? WHERE id='id'").run('seller@branch'),/Invalid stock document transition/);
 db.prepare("UPDATE stock_ops_documents SET status='Approved',last_action_by=? WHERE id='id'").run('manager@branch');
 assert.throws(()=>db.prepare("UPDATE stock_ops_documents SET supplier='changed' WHERE id='id'").run(),/Submitted document fields/);
 assert.throws(()=>db.prepare("UPDATE stock_ops_document_lines SET document_quantity=30 WHERE document_id='id'").run(),/immutable/);
 assert.throws(()=>db.prepare("DELETE FROM stock_ops_audit WHERE document_id='id'").run(),/immutable/);
 assert.deepEqual(db.prepare("SELECT action FROM stock_ops_audit ORDER BY id").all().map(x=>x.action),['Created','Submitted','Approved']);
 db.close();
});
test('SQL enforces three-person transfer acknowledgement',()=>{
 const db=new DatabaseSync(':memory:');db.exec(ddl);
 db.prepare("INSERT INTO stock_ops_documents(id,document_number,client_request_id,kind,branch_name,destination_branch,status,created_by,created_at,last_action_by) VALUES ('x','ST-TRF-01','req2','TRANSFER','DC','STORE','Draft','creator','now','creator')").run();
 db.prepare("UPDATE stock_ops_documents SET status='Submitted',last_action_by='creator' WHERE id='x'").run();
 db.prepare("UPDATE stock_ops_documents SET status='Approved',last_action_by='manager',reviewed_by='manager' WHERE id='x'").run();
 assert.throws(()=>db.prepare("UPDATE stock_ops_documents SET status='Received',last_action_by='manager' WHERE id='x'").run(),/Invalid stock document transition/);
 db.prepare("UPDATE stock_ops_documents SET status='Received',last_action_by='receiver',received_by='receiver' WHERE id='x'").run();
 assert.equal(db.prepare("SELECT status FROM stock_ops_documents WHERE id='x'").get().status,'Received');db.close();
});
