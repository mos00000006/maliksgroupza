import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../app/tills/till-checkout.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/tills/tills.module.css',import.meta.url),'utf8');

test('quotation modal portals above Hub shell and locks background scrolling',()=>{
  assert.match(src,/import\s*\{\s*createPortal\s*\}\s*from\s*["']react-dom["']/);
  assert.match(src,/modal&&createPortal\(/);
  assert.match(src,/,document\.body\)\}/);
  assert.match(src,/document\.body\.style\.overflow="hidden"/);
  assert.match(css,/\.scrim\s*\{[\s\S]*?position:fixed;[\s\S]*?z-index:2147483000;/);
});

test('selection is in an independent quotation grid section, not an overlay sidebar',()=>{
  assert.match(src,/<section className=\{styles\.pickerSelection\}/);
  assert.doesNotMatch(src,/<aside className=\{styles\.pickerSelection\}/);
  assert.match(css,/\.pickerLayout\s*\{[\s\S]*?grid-template-columns:minmax\(0,1\.65fr\) minmax\(315px,\.9fr\)/);
  assert.match(css,/\.pickerLayout > \.pickerSelection\{grid-column:2;grid-row:1;/);
  assert.match(css,/@media\(max-width:790px\)/);
});

test('product workflow preserves server-authorised quotation sending and price safeguards',()=>{
  assert.match(src,/Send quotation to Cash Office/);
  assert.match(src,/fetch\("\/api\/tills\/quotes"/);
  assert.match(src,/Number\.isSafeInteger\(product\.price_cents\)&&product\.price_cents>0/);
  assert.match(src,/disabled=\{!priced\}/);
  assert.match(src,/quoteRequestId\.current/);
  assert.doesNotMatch(src,/POST\s*\/api\/sales\/complete/);
});
