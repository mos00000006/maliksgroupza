import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=readFileSync(new URL('app/stock-operations/stock-operations.tsx',root),'utf8');
const css=readFileSync(new URL('app/stock-operations/stock-operations.module.css',root),'utf8');
test('GRV print has the PowerBuild logo and dedicated one-sheet view',()=>{
 assert.match(source,/StockPrintSheet document=\{detail\}/);
 assert.match(source,/powerbuild-logo\.png/);
 assert.ok(existsSync(new URL('public/stock-operations/powerbuild-logo.png',root)));
 assert.match(source,/Goods Received Voucher/);
 assert.match(source,/Receiving manager/);
 assert.match(source,/Approval history/);
});
test('A4 portrait overrides the old A5 landscape print rule',()=>{
 assert.match(css,/@page\{size:A4 portrait;margin:11mm\}/);
 assert.doesNotMatch(css,/A5 landscape/);
 assert.match(css,/\.main>:not\(\.modalBackdrop\)\{display:none!important\}/);
 assert.match(css,/\.modalHead,\.modalBody,\.modalFooter\{display:none!important\}/);
 assert.match(css,/\.printSheet\{display:block!important/);
});
test('print does not modify stock operations API or documents',()=>{
 assert.match(source,/No stock or financial balance changes when saving/);
 assert.match(source,/Print register copy · PowerBuild A4/);
});
