import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const jsx=readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/tills/tills.module.css',import.meta.url),'utf8');
test('full view is default and can be toggled without losing sidebar navigation',()=>{
  assert.match(jsx,/const \[fullView,setFullView\]=useState\(true\)/);
  assert.match(jsx,/section==="checkout"&&fullView\?styles\.fullView/);
  assert.match(jsx,/onClick=\{\(\)=>setFullView\(value=>!value\)\}/);
  assert.match(jsx,/title=\{menu\.name\} aria-label=\{menu\.name\}/);
});
test('checkout has separate right-hand sticky and scrollable summary panel',()=>{
  assert.match(jsx,/<aside className=\{styles\.summaryCol\}>/);
  assert.match(css,/\.shell\.fullView \.checkoutGrid \{[\s\S]*?grid-template-columns:minmax\(0,1fr\) clamp\(355px,30vw,465px\)/);
  assert.match(css,/\.shell\.fullView \.summaryCol \{[\s\S]*?position:sticky;top:0;[\s\S]*?overflow-y:auto/);
  assert.match(css,/@media\(max-width:900px\) \{[\s\S]*?\.shell\.fullView \.summaryCol \{position:static/);
});
test('existing quotation, branch and payment restrictions preserved',()=>{
  assert.match(jsx,/Send quotation to Cash Office/);
  assert.match(jsx,/fetch\("\/api\/tills\/quotes"/);
  assert.match(jsx,/className=\{styles\.payPrimary\} type="button" onClick=\{\(\)=>open\("quote"\)\}/);
  assert.match(jsx,/<Link href="\/">Switch back to Hub<\/Link>/);
  assert.match(jsx,/value=\{branch\} onChange=\{e=>changeBranch/);
});
