import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../app/stock-operations/stock-operations.module.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../app/stock-operations/stock-operations.tsx',import.meta.url),'utf8');

test('4-column print reserves right-side width for complete Reference quantity',()=>{
 assert.match(css,/\.printItemsFour colgroup col:nth-child\(4\)\{width:22%!important\}/);
 assert.match(css,/\.printItemsFour th:last-child\{white-space:normal!important/);
 assert.match(css,/\.printItemsFour td:last-child\{white-space:normal!important/);
});
test('5-column GRV Rejected quantity remains protected',()=>{
 assert.match(css,/\.printItems colgroup col:nth-child\(5\)\{width:14%!important\}/);
 assert.match(ui,/finalColumn:'Rejected'/);
});
test('correct transfer/return field labels are in edit and print',()=>{
 assert.match(ui,/TRANSFER:\{title:'Stock Transfer Note',quantity:'Transfer quantity',expected:'Reference quantity'/);
 assert.match(ui,/SUPPLIER_RETURN:\{title:'Supplier Return Note',quantity:'Return quantity',expected:'Reference quantity'/);
 assert.match(ui,/kind==='TRANSFER'\?'Transfer qty'/);
 assert.match(ui,/kind==='TRANSFER'\|\|kind==='SUPPLIER_RETURN'\?'Reference qty'/);
});
test('empty document prints clear warning instead of misleading blank table',()=>{
 assert.match(ui,/No product lines are attached to this document/);
 assert.match(ui,/colSpan=\{labels.finalColumn\?5:4\}/);
});
