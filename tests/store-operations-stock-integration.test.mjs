import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {integrate} from '../scripts/integrate-stock-into-store-operations.mjs';
const original = `if (active === "Store Operations")\n    return (\n      <>\n        <div className="moduleHero storesHero">\n          <h2>Store network</h2>\n        </div>\n      </>\n    );`;
test('adds a stock controls entry only inside EXISTING Store Operations',()=>{
  const first=integrate(original);assert.equal(first.changed,true);
  assert.match(first.result,/data-maliks-store-stock="integrated-v2"/);
  assert.match(first.result,/href="\/store-operations\/stock"/);
  assert.match(first.result,/moduleHero storesHero/);
  const second=integrate(first.result);assert.equal(second.changed,false);assert.equal(second.result,first.result);
});
test('refuses unrecognised layout without changing source',()=>{
  assert.throws(()=>integrate('const active = "Store Operations";'),/not found/);
});
test('child route opens stock controls and preserves old Hub UI file',()=>{
  const page=readFileSync(new URL('../app/store-operations/stock/page.tsx',import.meta.url),'utf8');
  assert.match(page,/stock-operations\/stock-operations/);
  const ui=readFileSync(new URL('../app/stock-operations/stock-operations.tsx',import.meta.url),'utf8');
  assert.match(ui,/Stock Control & GRVs/);
});
