import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basketTotals, parseZarCents, quoteDeposit, safeQty, tenderPreview } from '../app/tills/pos-preview-domain.mjs';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path,root),'utf8');
const item = {product:{price_cents:11500},quantity:2};
test('15% VAT-inclusive basket is balanced at cents level',()=>{
 const t=basketTotals([item]); assert.deepEqual([t.net,t.vat,t.gross],[20000,3000,23000]);
 assert.equal(t.net+t.vat,t.gross);
});
test('fractional hardware unit quantities are supported',()=>{
 const t=basketTotals([{product:{price_cents:1200},quantity:1.25}]); assert.equal(t.gross,1500);
 assert.equal(t.net+t.vat,t.gross);
});
test('tender values are integer cents, reject invalid inputs',()=>{
 assert.equal(parseZarCents('12.50'),1250);assert.equal(parseZarCents('abc'),null);
 assert.equal(parseZarCents('-1'),null);assert.equal(parseZarCents('2.999'),null);
 assert.deepEqual(tenderPreview(23000,{cash:'300',card:'0',eft:'0'}).change,7000);
});
test('quantity and deposit are bounded',()=>{
 assert.equal(safeQty(0),null);assert.equal(safeQty('1.375'),1.375);
 assert.equal(quoteDeposit(20000,25)?.deposit,5000);
 assert.equal(quoteDeposit(20000,110),null);
});
test('sales posting is disabled and all calls use read-only catalogue endpoint',()=>{
 const ui=read('app/tills/till-checkout.tsx');
 assert.match(ui,/NO LIVE SALES/);
 assert.match(ui,/Complete sale — not enabled/);
 assert.match(ui,/\/api\/tills\/catalogue/);
 assert.doesNotMatch(ui,/fetch\(\s*["']\/api\/(?:sales|tills\/sales)/);
});
