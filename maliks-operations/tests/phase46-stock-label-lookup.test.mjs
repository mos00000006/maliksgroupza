import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const inv=readFileSync(new URL('../src/inventory-domain.mjs',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/stock-labelling-ui.mjs',import.meta.url),'utf8');
test('label lookup is branch-scoped and reads only active stock',()=>{
 assert.match(inv,/if\(query\.get\('labels'\)==='1'\)/);
 assert.match(inv,/m\.kind='stock' AND m\.active=1 AND lower\(m\.branch\)=lower\(\?\)/);
 assert.match(inv,/tag\.published=1/);
 assert.match(inv,/movements:\[\],destinations:\[\]/);
});
test('label UI opts into lightweight read and retries only HTTP 503',()=>{
 assert.match(ui,/const url='\/api\/inventory\?labels=1&branch='/);
 assert.match(ui,/if\(e\.status!==503\)throw e/);
 assert.match(ui,/labelLookup\(search\.value\.trim\(\)\)/);
 assert.match(ui,/labelLookup\(code\)/);
});
