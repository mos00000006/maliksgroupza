import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../app/api/catalogue/route.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../app/catalogue.tsx', import.meta.url), 'utf8');
const pdf = readFileSync(new URL('../app/catalogue-pdf.ts', import.meta.url), 'utf8');

test('catalogue browsing and exports explicitly request photographed products', () => {
  assert.match(ui, /photosOnly:\s*"1"/);
  assert.match(ui, /pageSize:\s*"48",\s*photosOnly:\s*"1"/);
  assert.match(api, /url\.searchParams\.get\("photosOnly"\)\s*===\s*"1"/);
  assert.match(api, /image_key/);
  assert.ok((api.match(/WHERE active=1\$\{photoFilterSql\}/g) || []).length >= 8);
});

test('photo filter is opt-in, preserving stock orders and POS product access', () => {
  assert.match(api, /const photoFilterSql = photosOnly\s*\?/);
  assert.match(api, /\:\s*"";/);
  assert.doesNotMatch(api, /UPDATE catalogue_products SET active=0/);
});

test('existing missing photos do not result in catalogue placeholders', () => {
  assert.match(ui, /const visibleProducts = useMemo/);
  assert.match(ui, /!brokenPhotoIds\.has\(product\.id\)/);
  assert.match(ui, /onError=\{\(\) => setBrokenPhotoIds/);
  assert.doesNotMatch(ui, /<small>Product image<\/small>/);
});

test('new catalogue products require photos', () => {
  assert.match(api, /A product picture is required for the catalogue/);
  assert.match(ui, /Please select a product picture before adding/);
});

test('A4 print PDF is 300dpi, 2 columns x 3 rows, and contains only decodable images', () => {
  assert.match(pdf, /const CANVAS_W = 2480;/);
  assert.match(pdf, /const CANVAS_H = 3508;/);
  assert.match(pdf, /const PRODUCT_PAGE_COLUMNS = 2;/);
  assert.match(pdf, /const PRODUCT_PAGE_ROWS = 3;/);
  assert.match(pdf, /const printable = candidates\.filter\(\(p\) => imageMap\.has\(p\.id\)\)/);
  assert.doesNotMatch(pdf, /Upload in catalogue/);
});

test('table of contents paginates before catalogue pages are numbered', () => {
  assert.match(pdf, /const CONTENTS_PAGE_CAPACITY = CONTENTS_ROWS_PER_COLUMN \* 2/);
  assert.match(pdf, /Math\.ceil\(grouped\.size \/ CONTENTS_PAGE_CAPACITY\)/);
  assert.match(pdf, /let nextPage = 2 \+ contentsPages/);
  assert.match(pdf, /drawContentsPage\(plans, logo, totalPages, index, contentsPages\)/);
});
