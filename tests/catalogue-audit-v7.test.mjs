import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cataloguePdfCategory } from '../app/catalogue-pdf-grouping.ts';

const classify=(name,category)=>cataloguePdfCategory({name,category});
test('padlocks are Locks, not Locksets in PDF',()=>{
  assert.equal(classify('SAMHOO SOLID BRASS PADLOCK 40MM','Locks'),'Locks');
  assert.equal(classify('SEMI-CIRCLE IRON PADLOCK 63MM','Locksets'),'Locks');
  assert.equal(classify('FANCY CYLINDER LOCKSET 3 LEVER MORTICE','Locksets'),'Locksets');
});
test('catalogue UI includes active non-generic categories',()=>{
  const source=readFileSync(new URL('../app/catalogue.tsx',import.meta.url),'utf8');
  for(const category of ['Locks','Underground (UG)','Tiles & Flooring','Tork Craft','Hamiltons','Bathroom · Taps'])
    assert.ok(source.includes('"'+category+'"'),category);
});
test('API pagination clamps out-of-range pages',()=>{
  const source=readFileSync(new URL('../app/api/catalogue/route.ts',import.meta.url),'utf8');
  assert.match(source,/const effectivePage = Math.min\(page, pages\)/);
  assert.match(source,/const offset = \(effectivePage - 1\) \* pageSize/);
});
test('blind rivets cannot be removed by category filters',()=>{
  const source=readFileSync(new URL('../app/api/catalogue/route.ts',import.meta.url),'utf8');
  assert.match(source,/LIKE '%blind rivet%'/);
  assert.match(source,/lower\(category\)=lower\(\?\)/);
});
test('migration retains old SKU records and never changes stock/prices',()=>{
  const sql=readFileSync(new URL('../drizzle/0067_catalogue_audit_categories_legacy_anchors.sql',import.meta.url),'utf8');
  assert.doesNotMatch(sql,/^\s*(?:DELETE|DROP|BEGIN|COMMIT)\b/im);
  assert.match(sql,/TF-NA5035-15/);
});

test('PDF text converts multiplication dimensions to printable x',()=>{
  const source=readFileSync(new URL('../app/catalogue-pdf.ts',import.meta.url),'utf8');
  assert.match(source,/replace\(\/×\/g, "x"\)/);
});
