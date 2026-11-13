import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import frontend from '../src/frontend.mjs';
const get=(path='/')=>new Request('https://maliks-department.example.test'+path);
const html=async type=>(await frontend.fetch(get(),{APP_TYPE:type})).text();
test('Cash Office exposes prominent paid invoice printing rather than creating new payments',async()=>{
 const page=await html('cashoffice');
 assert.match(page,/Cash Office — PAID Customer Invoices & Payment Audit/);
 assert.match(page,/Print PAID customer invoice/);
 assert.match(page,/PAID SALES INVOICE/);
 assert.match(page,/INTERNAL PAID SALES INVOICE/);
 assert.match(page,/VAT included \(15%\)/);
 assert.match(page,/\/api\/invoices\?branch=/);
 assert.match(page,/powerbuild-logo\.png/);
 assert.match(page,/row\.id!==id/);
});
test('Dispatch offers a paid-invoice alert and separate priced-free picker sheet',async()=>{
 const page=await html('dispatch');
 for(const text of ['New PAID invoice for picking','Print picking slip','DISPATCH PICKING SLIP','PAID IN SYSTEM','Quantity to pick','Picked by (name & signature)','Checked by (name & signature)'])assert.ok(page.includes(text),text);
 assert.match(page,/document\.visibilityState===\x27visible\x27/);
 assert.match(page,/setInterval\(/);
 assert.match(page,/20000/);
 assert.match(page,/job\.status===\x27AWAITING_PICK\x27/);
 assert.match(page,/if\(job\.branch!==branch\)/);
 assert.match(page,/printItems\(sheet,job\.lines,false\)/);
 assert.doesNotMatch(page,/POST STOCK DEDUCTION/);
});
test('Dispatch print source remains the authenticated, branch-protected paid-only queue',async()=>{
 const core=readFileSync(new URL('../src/payment-dispatch-domain.mjs',import.meta.url),'utf8');
 assert.match(core,/if\(context\.app!==\x27dispatch\x27\)return deny\(\x27Dispatch only\.\x27\)/);
 assert.match(core,/p\.status=\x27CONFIRMED\x27 ORDER BY j\.id DESC/);
 assert.match(core,/WHERE i\.id=\? AND lower\(i\.branch\)=lower\(\?\) AND p\.status=\x27CONFIRMED\x27/);
 const pos=await frontend.fetch(get('/api/invoices?branch=branch&id=1'),{APP_TYPE:'pos'});
 assert.equal(pos.status,403);
 const dispatched=await frontend.fetch(get('/api/payments?branch=branch'),{APP_TYPE:'dispatch'});
 assert.equal(dispatched.status,403);
});
test('No new database tables or posted stock movements added for printing and alerts',()=>{
 const page=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
 assert.ok(!page.includes('/api/dispatch-jobs/print'));
 assert.match(page,/Printing this paper does not deduct stock/);
});
