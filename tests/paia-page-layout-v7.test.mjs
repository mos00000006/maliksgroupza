import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const pagePath = resolve(root, 'app/paia/page.tsx');
const cssPath = resolve(root, 'app/paia/paia.module.css');
const source = readFileSync(pagePath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

test('PAIA page does not render global fixed sidebar aside element', () => {
  assert.doesNotMatch(source, /<aside(?:\s|>)/i);
  assert.match(source, /className=\{styles\.sideColumn\}/);
});

test('internal Hub navigation uses Next Link', () => {
  assert.match(source, /import Link from ['"]next\/link['"]/);
  assert.match(source, /<Link className=\{styles\.back\} href="\/"/);
  assert.doesNotMatch(source, /<a\s+[^>]*href="\/"/);
});

test('logo is bundled and uses unoptimized direct asset loading', () => {
  assert.match(source, /const logo = "\/legal\/powerbuild-paia-logo\.webp"/);
  assert.match(source, /unoptimized priority/);
  assert.ok(existsSync(resolve(root, 'public/legal/powerbuild-paia-logo.webp')));
});

test('PAIA PDF exists with draft status and head-office-only details', () => {
  assert.match(source, /const manual = "\/legal\/Maliks_Paint_Hardware_PowerBuild_PAIA_Manual_V1_1_DRAFT\.pdf"/);
  assert.ok(existsSync(resolve(root, 'public/legal/Maliks_Paint_Hardware_PowerBuild_PAIA_Manual_V1_1_DRAFT.pdf')));
  assert.match(source, /26 Jacobs Road/);
  assert.doesNotMatch(source, /16 Jacobs Street|29 Jacobs Street/i);
  assert.match(source, /Draft document — not yet approved/);
});

test('responsive layout prevents horizontal clipping', () => {
  assert.match(css, /overflow-x:clip/);
  assert.match(css, /@media\(max-width:850px\)/);
  assert.match(css, /@media\(max-width:650px\)/);
  assert.match(css, /\.sideColumn\{display:flex/);
});
