import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/tills/tills.module.css',import.meta.url),'utf8');
test('desktop wide checkout keeps a labelled, bounded left navigation',()=>{
  const fixed=css.slice(css.indexOf('RESTORED SIGNATURE WORKSTATION V5'));
  assert.match(fixed,/grid-template-columns:224px minmax\(0,1fr\) !important/);
  assert.match(fixed,/width:224px !important/);
  assert.match(fixed,/\.shell\.fullView \.navButton > span:last-child,[\s\S]*?\{display:block\}/);
});
test('summary stays in the right column and does not cover item search',()=>{
  const fixed=css.slice(css.indexOf('RESTORED SIGNATURE WORKSTATION V5'));
  assert.match(fixed,/\.shell\.fullView \.checkoutGrid \{[\s\S]*?grid-template-columns:minmax\(0,1fr\) minmax\(330px,390px\)/);
  assert.match(fixed,/\.shell\.fullView \.summaryCol \{[\s\S]*?position:sticky/);
  assert.match(jsx,/<aside className=\{styles\.summaryCol\}>/);
});
test('quotations, Hub switch and locked sale posting stay untouched',()=>{
  assert.match(jsx,/Send quotation to Cash Office/);
  assert.match(jsx,/<Link href="\/">Switch back to Hub<\/Link>/);
  assert.match(jsx,/className=\{styles\.payPrimary\} type="button" onClick=\{\(\)=>open\("quote"\)\}/);
  assert.match(jsx,/aria-label=\{menu\.name\}/);
});
