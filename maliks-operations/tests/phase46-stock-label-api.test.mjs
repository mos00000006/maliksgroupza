import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {listInventory} from '../src/inventory-domain.mjs';
function database(){
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE maliks_pos_master_records(id INTEGER,kind TEXT,branch TEXT,code TEXT,name TEXT,active INTEGER,details_json TEXT);
 CREATE TABLE catalogue_products(id INTEGER,code TEXT,active INTEGER);
 CREATE TABLE powerbuild_price_tags(product_id INTEGER,published INTEGER,token TEXT,price_cents INTEGER);
 CREATE TABLE price_tag_branch_prices(product_id INTEGER,brand TEXT,branch_name TEXT,price_cents INTEGER);
 INSERT INTO maliks_pos_master_records VALUES(1,'stock','Active Build Carletonville','PIPE43','PVC Piping',1,'{"unit":"ea","barcode":"BAR43","selling_price_cents":1000}');
 INSERT INTO maliks_pos_master_records VALUES(2,'stock','Different Branch','PIPE44','Other branch piping',1,'{}');
 INSERT INTO catalogue_products VALUES(10,'PIPE43',1);
 INSERT INTO powerbuild_price_tags VALUES(10,1,'12345678-1234-1234-1234-123456789abc',1250);
 INSERT INTO price_tag_branch_prices VALUES(10,'powerbuild','Active Build Carletonville',1399);`);
 return {prepare(sql){let params=[];return {bind(...values){params=values;return this;},all(){return {results:db.prepare(sql).all(...params)}}}}};
}
const member={role:'Operations Manager',active:1,email:'manager@example.com'};
const c={app:'management',member,branches:['Active Build Carletonville']};
test('label lookup returns branch price and published QR without stock history',async()=>{
 const req=new Request('https://core.example/v1/inventory?branch=Active%20Build%20Carletonville&q=pipe43&labels=1');
 const res=await listInventory(req,{DB:database()},c);
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.items.length,1);
 assert.equal(data.items[0].code,'PIPE43');
 assert.equal(data.items[0].selling_price_cents,1399);
 assert.equal(data.items[0].label_qr_token,'12345678-1234-1234-1234-123456789abc');
 assert.deepEqual(data.movements,[]);
 assert.deepEqual(data.destinations,[]);
});
test('label lookup rejects unauthorised branch before database operations',async()=>{
 const req=new Request('https://core.example/v1/inventory?branch=Different%20Branch&q=pipe&labels=1');
 const res=await listInventory(req,{DB:database()},c);
 assert.equal(res.status,403);
});
