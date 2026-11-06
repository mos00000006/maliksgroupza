import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/tills/tills.module.css',import.meta.url),'utf8');
test('active sale and scan are visible before quick actions, with summary in adjacent column',()=>{
  const stage=ui.indexOf('styles.salesStage');
  const grid=ui.indexOf('styles.checkoutGrid');
  const search=ui.indexOf('styles.searchForm',grid);
  const actions=ui.indexOf('styles.quickActionPanel',grid);
  const basket=ui.indexOf('02 / ITEMS SELECTED',grid);
  assert.ok(stage>0 && stage<grid && grid<search && search<actions && actions<basket);
  assert.match(ui,/styles\.summaryCol/);
  assert.match(css,/\.shell \.checkoutGrid\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(330px,365px\)/);
});
test('compact status is still clear and never enables sale posting',()=>{
  assert.match(ui,/Checkout connection pending/);
  assert.match(ui,/Transactions LOCKED|TRANSACTIONS LOCKED/);
  assert.match(ui,/className=\{styles\.payPrimary\} type="button" onClick=\{\(\)=>open\("quote"\)\}/);
  assert.match(ui,/Send quotation to Cash Office/);
  assert.match(ui,/<Link href="\/">/);
  assert.match(ui,/if\(!lines\.length\)\{setError\("Add products before parking a draft\."\)/);
});
test('responsive layout and branch theme remain in the same stylesheet',()=>{
  assert.match(css,/SIGNATURE CHECKOUT V3/);
  assert.match(css,/@media\(max-width:940px\)/);
  assert.match(css,/@media\(max-width:480px\)/);
  assert.match(ui,/isBuster\?styles\.buster:styles\.power/);
  assert.match(css,/\.pickerLayout\s*\{/);
});
