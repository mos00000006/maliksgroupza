import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';
const root = new URL('../', import.meta.url);
const source = (path) => readFileSync(new URL(path, root), 'utf8');
const js = transpileModule(source('app/lib/tills-route-policy.ts'), { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { canOpenTills, cashierPathPolicy } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

test('full-access owner and technical admin can open Sales / Tills', () => {
  assert.equal(canOpenTills('Owner / Admin', 'Full company'), true);
  assert.equal(canOpenTills('Developer / Technical Admin', 'Full company'), true);
});
test('EXCO full-company user can switch to Sales / Tills', () => {
  assert.equal(canOpenTills('Executive / EXCO', 'Full company'), true);
  assert.equal(canOpenTills('Executive / EXCO', 'Assigned workspace'), false);
});
test('assigned store and regional managers can open their permitted tills', () => {
  assert.equal(canOpenTills('Store Manager', 'Assigned workspace'), true);
  assert.equal(canOpenTills('Regional Manager', 'Selected workspaces'), true);
});
test('cashiers remain restricted to the checkout and cannot navigate Home', () => {
  assert.equal(canOpenTills('Sales / Tills', 'Assigned workspace'), true);
  assert.equal(cashierPathPolicy('/', 'GET'), 'redirect');
  assert.equal(cashierPathPolicy('/api/team', 'GET'), 'deny');
});
test('scope alone never grants a restricted role till access', () => {
  for (const role of ['Read only', 'Viewer', 'Buyer', 'Human Resource (HR)', 'Branch Stock Orders', 'Member / Contributor']) {
    assert.equal(canOpenTills(role, 'Full company'), false, role);
  }
});
test('server checks role and scope; Hub has sidebar link and till provides return link', () => {
  assert.match(source('app/api/tills/shared.ts'), /canOpenTills\(member\.role, member\.access_scope\)/);
  assert.match(source('app/api/tills/shared.ts'), /allowedWorkspaces\(member\)/);
  assert.match(source('app/tills/till-checkout.tsx'), /role!=="Sales \/ Tills"&&<Link href="\/">Switch back to Hub<\/Link>/);
});
