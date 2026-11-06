import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../app/stock-operations/stock-operations.module.css',import.meta.url),'utf8');
test('A4 portrait print reserves an explicit, visible rejected-quantity column',()=>{
 assert.match(css,/@page\{size:A4 portrait;margin:11mm\}/);
 assert.match(css,/col:nth-child\(5\)\{width:14%!important\}/);
 assert.match(css,/col:nth-child\(2\)\{width:40%!important\}/);
 assert.match(css,/width:calc\(100% - 2mm\)!important/);
 assert.match(css,/\.printItems th:last-child,\.printItems td:last-child/);
});
test('all numeric print columns, including rejected, are centered and padded',()=>{
 assert.match(css,/td:nth-child\(n\+3\)\{text-align:center!important/);
 assert.match(css,/padding-right:2mm!important;white-space:nowrap!important/);
});
