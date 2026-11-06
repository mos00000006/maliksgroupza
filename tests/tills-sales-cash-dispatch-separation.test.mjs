import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
test('sales panel only prints and sends quotations, not tenders',()=>{
 const sales=text.slice(text.indexOf('aria-label="Quotation totals — no payment collection"'),text.indexOf('QUICK TOOLS',text.indexOf('aria-label="Quotation totals — no payment collection"')));
 assert.match(sales,/Sales does not take payment/);
 assert.match(sales,/Create quotation for Cash Office/);
 assert.doesNotMatch(sales,/onClick=\{\(\)=>open\("tender"\)\}/);
 assert.doesNotMatch(sales,/Cash received/);
});
test('cash office has cash or card choices only in queue, no fabricated paid posting',()=>{
 assert.match(text,/aria-label="Cash Office payment method"/);
 assert.match(text,/Approved terminal reference/);
 assert.match(text,/disabled className=\{styles\.modalDisabled\}>Confirm payment and print paid invoice/);
});
test('printable issued quotation explicitly says UNPAID and no invoice',()=>{
 assert.match(text,/printNumberedQuotation/);
 assert.match(text,/UNPAID QUOTATION/);
 assert.match(text,/NOT AN INVOICE OR RECEIPT/);
});
test('dispatch queue only releases payment-posted invoices; no fake queue',()=>{
 assert.match(text,/Paid invoices ready for picking/);
 assert.match(text,/No unpaid quotation is shown as ready for dispatch/);
});
test('cashier-only menu is restricted to quotation related sections',()=>{
 assert.match(text,/\["checkout","documents","inventory"\]\.includes\(menu\.id\)/);
 assert.match(text,/role==="Sales \/ Tills"/);
});
