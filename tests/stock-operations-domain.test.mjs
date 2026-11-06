import test from 'node:test';
import assert from 'node:assert/strict';
import {STOCK_KINDS,STOCK_DUTIES,isFullAccess,isStockManager,canCreate,canTransition,validateStockLines} from '../app/api/stock-operations/stock-domain.mjs';
const base=[{catalogue_product_id:2,document_quantity:2,expected_quantity:3,rejected_quantity:0}];
test('five stock document types, four distinct duties',()=>{assert.equal(STOCK_KINDS.length,5);assert.equal(STOCK_DUTIES.length,4);});
test('only authorised duties can create each type',()=>{
 assert.equal(canCreate('GRV','Receiving / GRV',false),true);
 assert.equal(canCreate('ADJUSTMENT','Receiving / GRV',false),false);
 assert.equal(canCreate('COUNT','Stock Controller',false),true);
 assert.equal(canCreate('TRANSFER','DC / Transfers',false),true);
 assert.equal(canCreate('SUPPLIER_RETURN','Stock Controller',false),false);
 assert.equal(canCreate('SUPPLIER_RETURN','',true),true);
});
test('managers need appropriate roles',()=>{
 assert.equal(isFullAccess({role:'Member / Contributor',access_scope:'Full company'}),false);
 assert.equal(isFullAccess({role:'Owner / Admin',access_scope:'Assigned workspace'}),true);
 assert.equal(isStockManager({role:'Store Manager',access_scope:'Assigned workspace'},''),true);
 assert.equal(isStockManager({role:'Member / Contributor',access_scope:'Assigned workspace'},'Receiving / GRV'),false);
});
test('approval requires different employee and submitted status',()=>{
 assert.equal(canTransition('Submitted','approve','GRV','a@x','a@x',''),false);
 assert.equal(canTransition('Submitted','approve','GRV','a@x','b@x',''),true);
 assert.equal(canTransition('Draft','approve','GRV','a@x','b@x',''),false);
 assert.equal(canTransition('Draft','submit','GRV','a@x','a@x',''),true);
});
test('transfer acknowledgement requires third staff member',()=>{
 assert.equal(canTransition('Approved','receive','TRANSFER','a@x','b@x','b@x'),false);
 assert.equal(canTransition('Approved','receive','TRANSFER','a@x','c@x','b@x'),true);
 assert.equal(canTransition('Approved','receive','GRV','a@x','c@x','b@x'),false);
});
test('valid catalogue lines and safe quantity precision',()=>{
 assert.equal(validateStockLines(base,'GRV')[0].catalogue_product_id,2);
 assert.throws(()=>validateStockLines([...base,...base],'GRV'),/unique/);
 assert.throws(()=>validateStockLines([{...base[0],document_quantity:-3}],'GRV'),/Quantities/);
 assert.throws(()=>validateStockLines([{...base[0],document_quantity:2.0004}],'GRV'),/Quantities/);
 assert.throws(()=>validateStockLines([{...base[0],rejected_quantity:4}],'GRV'),/Rejected/);
 assert.throws(()=>validateStockLines([],'COUNT'),/1–100/);
});
