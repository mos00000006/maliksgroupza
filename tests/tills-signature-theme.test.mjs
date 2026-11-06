import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ui = readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
const css = readFileSync(new URL('../app/tills/tills.module.css',import.meta.url),'utf8');

test('signature theme has dedicated branch-aware identity and compact activation status',()=>{
  assert.match(ui,/styles\.heroTags/);
  assert.match(ui,/Checkout setup required/);
  assert.match(ui,/isBuster\?styles\.buster:styles\.power/);
  assert.match(css,/SIGNATURE WORKSTATION/);
  assert.match(css,/\.totalsPanel\s*\{/);
});
test('full-access Hub switch remains available; till-only staff cannot use it',()=>{
  assert.match(ui,/!isTillOnly&&/);
  assert.match(ui,/<Link href="\/">/);
  assert.match(ui,/Sales \/ Tills/);
});
test('the premium design never unlocks a money or inventory posting route',()=>{
  assert.match(ui,/No cash, card, EFT, invoice or stock-release action is available on the Sales screen/);
  assert.match(ui,/className=\{styles\.payPrimary\} type="button" onClick=\{\(\)=>open\("quote"\)\}/);
  assert.match(ui,/Transaction service not yet activated/);
  assert.doesNotMatch(ui,/method:\s*["']POST["'][\s\S]*?\/api\/(sales|tills\/sales|stock\/adjust)/);
  assert.match(ui,/\/api\/tills\/catalogue/);
});
test('staging folder is not a part of the release',()=>{
  assert.match(css,/@media\(max-width:620px\)/);
  assert.doesNotMatch(ui,/new-files\/app\/tills/);
});
