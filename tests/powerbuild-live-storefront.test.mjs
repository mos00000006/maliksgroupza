import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const base = new URL('../app/', import.meta.url);
const publicRoute = readFileSync(new URL('api/ecommerce/public/route.ts', base), 'utf8');
const imageRoute = readFileSync(new URL('api/ecommerce/product-image/[id]/route.ts', base), 'utf8');
const hub = readFileSync(new URL('page.tsx', base), 'utf8');
const storefront = readFileSync(new URL('ecommerce-storefront.tsx', base), 'utf8');
test('new catalogue items reach retail via left join, while explicit opt-out remains', () => {
  assert.match(publicRoute, /LEFT JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id/);
  assert.match(publicRoute, /COALESCE\(e\.b2c_enabled,1\)=1/);
  assert.match(publicRoute, /channel === "B2B" \? "e\.b2b_enabled=1"/);
});
test('product images use the same retail visibility conditions', () => {
  assert.match(imageRoute, /COALESCE\(e\.b2c_enabled,1\)=1 OR e\.b2b_enabled=1/);
});
test('Hub links to website and storefront has live-refresh behavior', () => {
  assert.match(hub, /View Website/);
  assert.match(storefront, /window\.addEventListener\("focus", refresh\)/);
  assert.match(storefront, /id="products"/);
});
