import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const src = readFileSync(new URL('../app/catalogue-pdf.ts', import.meta.url), 'utf8');
const imgPath = new URL('../public/powerbuild-company-profile-page.png', import.meta.url);

test('approved PowerBuild blue/yellow profile artwork is present and A4 portrait', () => {
  const img = readFileSync(imgPath);
  assert.deepEqual([...img.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const width = img.readUInt32BE(16), height = img.readUInt32BE(20);
  assert.ok(width >= 1000 && height >= 1400);
  assert.ok(Math.abs(width / height - 595.28 / 841.89) < .01, `Expected A4 aspect, got ${width} x ${height}`);
  assert.ok(statSync(imgPath).size > 20_000);
  assert.match(src, /const COMPANY_PROFILE_IMAGE = "\/powerbuild-company-profile-page\.png"/);
});

test('downloaded PDF inserts company profile immediately after cover', () => {
  const cover = src.indexOf('addPage(await drawCoverPage(productCount, cover), "Pg1")');
  const company = src.indexOf('addPage(drawCompanyProfilePage(profile), "Pg2")');
  const contents = src.indexOf('addPage(await drawContentsPage(plans, logo, totalPages');
  assert.ok(cover >= 0 && company > cover && contents > company);
  assert.match(src, /addPage\(await drawContentsPage\(plans, logo, totalPages, index, contentsPages\), `Pg\$\{index \+ 2\}`\)/);
  assert.match(src, /let nextPage = 3 \+ contentsPages/);
  assert.match(src, /drawFooter\(ctx, 2 \+ contentsPage, totalPages\)/);
});

test('catalogue preview leaflet uses same page order and all profile images are released', () => {
  const cover = src.indexOf('pushPage(await drawCoverPage(productCount, cover))');
  const company = src.indexOf('pushPage(drawCompanyProfilePage(profile))');
  const contents = src.indexOf('pushPage(await drawContentsPage(plans, logo, totalPages');
  assert.ok(cover >= 0 && company > cover && contents > company);
  assert.equal((src.match(/releaseImage\(profile\);/g) || []).length, 2);
  assert.match(src, /throw new Error\("PowerBuild company profile artwork is missing/);
});
