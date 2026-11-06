import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateOpeningRows} from '../app/api/stock-operations/inventory/opening-domain.mjs';
test('bulk opening parser accepts 100 SKU quantities and three decimal precision',()=>{
 const rows=Array.from({length:100},(_,i)=>({code:`SKU${i}`,quantity:(i+1)/1000}));
 const result=validateOpeningRows(rows);assert.equal(result.length,100);assert.equal(result[99].qty_milli,100);
});
test('opening import fails for duplicate, missing and invalid quantities',()=>{
 assert.throws(()=>validateOpeningRows([{code:'AB',quantity:1},{code:'ab',quantity:1}]),/Duplicate/);
 assert.throws(()=>validateOpeningRows([{code:'X',quantity:-1}]),/nonnegative/);
 assert.throws(()=>validateOpeningRows([{code:'X',quantity:0.0001}]),/three decimals/);
 assert.throws(()=>validateOpeningRows([{code:'X',quantity:'foo'}]),/nonnegative/);
 assert.throws(()=>validateOpeningRows([{code:'',quantity:0}]),/valid product/);
 assert.throws(()=>validateOpeningRows([]),/1 to 100/);
 assert.throws(()=>validateOpeningRows(Array.from({length:101},(_,i)=>({code:`SKU${i}`,quantity:0}))),/1 to 100/);
});
