import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const ui=read('app/tills/till-checkout.tsx');
const api=read('app/api/tills/catalogue/route.ts');
const css=read('app/tills/tills.module.css');

test('quotation, sales order and lay-by open a paginated product catalogue',()=>{
  assert.match(ui,/const pickerMode=modal==="quote"\|\|modal==="order"\|\|modal==="layby"/);
  assert.match(ui,/cataloguePicker\(\)/);
  assert.match(ui,/mode:"browse"/);
  assert.match(ui,/mode:"categories"/);
  assert.match(ui,/All catalogue items/);
  assert.match(ui,/All departments/);
  assert.match(ui,/Next →/);
});
test('picker adds priced items and guards unpriced products',()=>{
  assert.match(ui,/product\.price_cents<=0\)return/);
  assert.match(ui,/disabled=\{!priced\}/);
  assert.match(ui,/Price not published/);
  assert.match(ui,/setLines\(previous=>/);
  assert.match(ui,/pickerSelectedBottom/);
  assert.match(ui,/setDocumentLines/);
  assert.match(ui,/documentTotals/);
});
test('API blocks unauthorised staff and unrelated branches before catalogue queries',()=>{
  const checkMember=api.indexOf('const member = await tillMember()');
  const checkBranch=api.indexOf('permittedBranch(assigned,query.get("branch"))');
  const useDb=api.indexOf('env.DB.prepare');
  assert.ok(checkMember>=0&&checkBranch>checkMember&&useDb>checkBranch);
  assert.match(api,/status:403/);
  assert.match(api,/mode==="browse"/);
  assert.match(api,/mode==="categories"/);
  assert.match(api,/LIMIT \? OFFSET \?/);
  assert.match(api,/LEFT JOIN/);
  assert.match(api,/p\.active=1/);
  assert.match(api,/hasMore:results\.length>perPage/);
  assert.doesNotMatch(api,/\b(INSERT|UPDATE|DELETE)\s+(INTO|FROM|catalogue_products)/i);
});
test('POS remains unposted and full-access Hub navigation remains available',()=>{
  assert.match(ui,/No cash, card, EFT, invoice or stock-release action is available on the Sales screen/);
  assert.match(ui,/role!=="Sales \/ Tills"&&<Link href="\/">Switch back to Hub<\/Link>/);
  assert.match(ui,/Transaction service not yet activated/);
  assert.doesNotMatch(ui,/fetch\(\s*["']\/api\/(?:sales|tills\/sales)/);
});
test('picker styling has desktop and compact layouts',()=>{
  assert.match(css,/\.catalogueDialog\{/);
  assert.match(css,/\.pickerLayout\{/);
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(css,/\.pickerSelectionTotals\{/);
});
