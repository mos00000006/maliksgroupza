import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import { readFileSync } from 'node:fs';
const url = new Request('https://maliks-pos.example.test/');
const html = async app => (await frontend.fetch(url,{APP_TYPE:app})).text();
test('POS produces an 80mm quotation slip with logo, product lines and NOT PAID label', async()=>{
 const page=await html('sales');
 for (const term of ['Print 80mm quotation slip','Print 80mm quote','receipt-logo','/powerbuild-logo.png','NOT PAID — QUOTATION ONLY','Present this quotation at Tills','thermalItems(sheet,row.lines)','thermalTotals(sheet,row,false)'])assert.ok(page.includes(term),term);
 assert.match(page,/if\(!row\|\|row\.branch!==branch\|\|!Array\.isArray\(row\.lines\)\)/);
 assert.ok(!page.includes('QUOTATION '+String.raw`\${row.number}`));
});
test('Tills offers paid slip immediately and reprints only confirmed paid invoices from Core',async()=>{
 const page=await html('tills');
 for(const term of ['Print 80mm PAID receipt','Reprint 80mm PAID receipt','PAID INVOICE / RECEIPT','/api/invoices?branch=','Balance due','thermalTotals(sheet,invoice,true)','not a statutory VAT tax invoice'])assert.ok(page.includes(term),term);
 assert.match(page,/if\(!invoice\|\|invoice\.id!==id\|\|invoice\.branch!==selected/);
 assert.match(page,/if\(payment\.invoice_id\)/);
 assert.match(page,/payment\.cash_cents/);
});
test('Print styles target real 72mm Epson printable area and variable 80mm paper length',async()=>{
 const page=await html('sales');
 for(const term of ['width:72mm!important','min-width:72mm!important','@page{size:80mm ','window.print()','getBoundingClientRect().height','grayscale(1) contrast(2.1)','thermal-print-style'])assert.ok(page.includes(term),term);
 assert.doesNotMatch(page,/@page\s*\{\s*size:80mm auto/);
 assert.match(page,/afterprint/);
});
test('Cash Office and Dispatch retain independent A4 invoices and picking slips',async()=>{
 for(const app of ['cashoffice','dispatch']){
  const page=await html(app);
  assert.match(page,/@page\{size:A4;margin:12mm\}/);
  assert.match(page,/DISPATCH PICKING SLIP/);
  assert.match(page,/function printInternalInvoice/);
  assert.match(page,/function printPickingSlip/);
  assert.ok(page.includes('Print A4 PAID customer invoice'));
 }
});
test('Thermal change requires no migration or extra Worker access',()=>{
 const s=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
 assert.ok(!s.includes('/api/receipts/submit'));
 assert.ok(!s.includes('ALTER TABLE'));
 assert.ok(s.includes('Cash Office can audit this sale.'));
});
