import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';

const html=async kind=>(await frontend.fetch(new Request('https://example.test/'),{APP_TYPE:kind})).text();
test('Maliks POS Professional suite retains navigation without Sales',async()=>{
  const page=await html('pos');
  assert.match(page,/<title>Maliks POS Professional<\/title>/);
  assert.match(page,/id="suite-navigation" class="suite-header" hidden/);
  assert.doesNotMatch(page,/data-suite-module="sales"/);
  assert.match(page,/data-suite-module="stock"/);
  assert.match(page,/data-suite-module="headoffice"/);
  assert.match(page,/ACCOUNTING &amp; POS SOLUTIONS/);
  assert.match(page,/PROFESSIONAL/);
  assert.match(page,/suiteView='home'/);
  assert.doesNotMatch(page,/Open Sales workspace/);
  assert.match(page,/Open Stock module/);
});
test('Reference menus are visible but not falsely connected to financial APIs',async()=>{
  const page=await html('pos');
  for(const term of ['Staggered Invoices Dispatch','Branches Synchronization History','Stock Valuations','Till Cash-Up','Sales and Stock Month End','Debtors Invoicing Classifications','Invoices and Debit Notes'])assert.ok(page.includes(term),term);
  assert.match(page,/Hub-linked stock master, purchasing and controlled stock operations are connected/);
  assert.match(page,/Financial posting is not yet enabled/);
  assert.match(page,/separate secure department application/);
  assert.match(page,/if\(APP==='pos'\)/);
});
test('Other secured department applications do not expose the new POS suite menu',async()=>{
  for(const kind of ['sales','tills','cashoffice','dispatch']){
    const page=await html(kind);
    assert.doesNotMatch(page,/id="suite-navigation"/);
    assert.match(page,/Restricted department workstation/);
  }
});
test('PowerBuild is the Professional suite logo and favicon; legacy M mark is removed',async()=>{
  const env={APP_TYPE:'pos'};
  const page=await html('pos');
  assert.match(page,/class="suite-brand-logo" src="\/powerbuild-logo\.png" alt="PowerBuild logo"/);
  assert.match(page,/rel="icon" type="image\/png" href="\/powerbuild-logo\.png"/);
  assert.doesNotMatch(page,/suite-brand-mark/);
  assert.doesNotMatch(page,/maliks-mark\.svg/);
  const logo=await frontend.fetch(new Request('https://example.test/powerbuild-logo.png'),env);
  assert.equal(logo.status,200);
  assert.equal(logo.headers.get('content-type'),'image/png');
  const oldMark=await frontend.fetch(new Request('https://example.test/maliks-mark.svg'),env);
  assert.equal(oldMark.status,404);
});
test('Existing Cloudflare Access API boundary is unchanged',async()=>{
  const response=await frontend.fetch(new Request('https://example.test/api/session'),{APP_TYPE:'pos'});
  assert.equal(response.status,401);
});
