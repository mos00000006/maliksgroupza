import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind, ScriptTarget } from 'typescript';

const root = new URL('../', import.meta.url);
const source = (path) => readFileSync(new URL(path, root), 'utf8');
const ts = source('app/lib/tills-route-policy.ts');
const js = transpileModule(ts, { compilerOptions: { module: ModuleKind.ESNext, target: ScriptTarget.ES2022 } }).outputText;
const { cashierPathPolicy, SALES_TILLS_ROLE } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

test('till-only role allows its sales window but redirects the Hub home', () => {
  assert.equal(SALES_TILLS_ROLE, 'Sales / Tills');
  assert.equal(cashierPathPolicy('/', 'GET'), 'redirect');
  assert.equal(cashierPathPolicy('/tills', 'GET'), 'allow');
  assert.equal(cashierPathPolicy('/tills/', 'HEAD'), 'allow');
  assert.equal(cashierPathPolicy('/api/tills/catalogue', 'GET'), 'allow');
  assert.equal(cashierPathPolicy('/api/tills/session', 'GET'), 'allow');
  assert.equal(cashierPathPolicy('/api/team/accept', 'POST'), 'allow');
});

test('cashier cannot invoke other Hub routes or mutate sales', () => {
  for (const path of ['/api/tasks', '/api/pnl', '/api/team', '/api/financials', '/api/developments', '/shop', '/price-tags', '/training']) {
    assert.equal(cashierPathPolicy(path, 'GET'), 'deny', path);
  }
  for (const path of ['/api/tills/catalogue', '/api/tills/session', '/api/team', '/api/tasks']) {
    assert.equal(cashierPathPolicy(path, 'POST'), 'deny', path);
  }
  assert.equal(cashierPathPolicy('/api/tills/catalogue', 'PATCH'), 'deny');
});

test('edge, server and admin assignment all enforce till role and branch', () => {
  assert.match(source('worker/index.ts'), /cashierPathPolicy\(url\.pathname, request\.method\)/);
  assert.match(source('app/api/access.ts'), /allowSalesTillsAccess/);
  assert.match(source('app/api/tills/shared.ts'), /active=1 AND type='Store'/);
  assert.match(source('app/api/tills/catalogue/route.ts'), /permittedBranch\(assigned,query\.get\("branch"\)\)/);
  assert.match(source('app/api/team/route.ts'), /Choose one active retail store for the Sales \/ Tills user/);
  assert.match(source('app/page.tsx'), /window\.location\.assign\("\/tills"\)/);
});

test('till screen never submits payments, sales or writes stock', () => {
  const ui = source('app/tills/till-checkout.tsx');
  assert.match(ui, /NO LIVE SALES/);
  assert.match(ui, /Complete sale — not enabled/);
  assert.doesNotMatch(ui, /fetch\("\/api\/sales"/);
  assert.doesNotMatch(ui, /fetch\("\/api\/tills\/sales"/);
  assert.doesNotMatch(source('app/api/tills/catalogue/route.ts'), /export async function POST/);
});
