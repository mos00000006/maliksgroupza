import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
test('five stock options connected to distinct screens',()=>{
 for(const title of ['Departments','Stock Groups','Stock Returns','Sales','Promotions'])assert.ok(src.includes("'"+title+"'"));
 assert.match(src,/suiteStockExpansion\(item\)/);
 assert.match(src,/Stock Returns.*Sales.*Promotions/);
});
test('no fabricated sales or promotion posting',()=>{
 assert.match(src,/Confirmed POS sales deductions are not connected/);
 assert.match(src,/Promotional pricing, effective dates and automatic till discounts are not implemented/);
 assert.match(src,/Open controlled Stock Adjustments/);
});
