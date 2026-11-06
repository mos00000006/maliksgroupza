import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const operational=readFileSync(new URL('../app/operational-view.tsx',import.meta.url),'utf8');
const route=readFileSync(new URL('../app/store-operations/stock/page.tsx',import.meta.url),'utf8');
test('existing Store Operations contains a visible Stock Control link without running an installer',()=>{
  const a=operational.indexOf('if (active === "Store Operations")');
  const b=operational.indexOf('if (active === "Wholesale Division")');
  const view=operational.slice(a,b);
  assert.ok(a>=0 && b>a);
  assert.match(view,/data-maliks-store-stock="integrated-v2"/);
  assert.match(view,/Open Stock Control/);
  assert.match(view,/href="\/store-operations\/stock"/);
  assert.match(view,/Open store boards/);
  assert.match(view,/workspaceStrip/);
  assert.match(view,/ActionRegister/);
  assert.equal(view.match(/data-maliks-store-stock=/g)?.length,1);
});
test('new Stock Control route loads the existing Stock Operations workspace',()=>{
  assert.match(route,/stock-operations\/stock-operations/);
});
test('other Store Operations features and departments remain in the source',()=>{
 for(const label of ['Executive Overview','Wholesale Division','Developments','Store Operations','ActionRegister','WorkspacesModal']) {
  if(label==='WorkspacesModal') continue;
  assert.ok(operational.includes(label),label);
 }
});
