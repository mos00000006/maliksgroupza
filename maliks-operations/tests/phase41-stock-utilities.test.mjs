import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
test('ten newly connected Stock Utilities have dedicated dispatch',()=>{
 for(const v of ['Labelling','Pricing Utilities','Master Utilities','Freeze Onhands','Reprint Documents','Link Pictures','Serial Number Tracking','Stock Master CSV File Import','Delete Stock Items','Delete Stock Purchase Orders'])assert.ok(src.includes("'"+v+"'"));
 assert.match(src,/suiteStockUtility\(item\)/);
});
test('non posting and destructive actions are not exposed',()=>{
 assert.match(src,/No hard-delete endpoint is exposed/);
 assert.match(src,/No data has been saved/);
 assert.match(src,/A genuine server-side stock freeze\/transaction lock is NOT enabled/);
});
