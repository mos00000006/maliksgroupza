import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
const compiled = await build({ entryPoints: [new URL('../app/lib/a4-single-tag-layout.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
const { paginateA4SingleTags, A4_SINGLE_TAGS_PER_PAGE } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);

test('six different product tags become one A4 image page', () => {
  const tags = ['A', 'B', 'C', 'D', 'E', 'F'];
  assert.equal(A4_SINGLE_TAGS_PER_PAGE, 6);
  assert.deepEqual(paginateA4SingleTags(tags, () => 1), [tags]);
});

test('seven tags split into first complete page plus one extra A4 page', () => {
  assert.deepEqual(paginateA4SingleTags([1, 2, 3, 4, 5, 6, 7], () => 1), [[1,2,3,4,5,6],[7]]);
});

test('a single tag can fill an A4 page with six copies', () => {
  assert.deepEqual(paginateA4SingleTags(['MYTAG'], () => 6), [['MYTAG','MYTAG','MYTAG','MYTAG','MYTAG','MYTAG']]);
});

test('copy counts are bounded and a blank queue has no downloadable pages', () => {
  assert.deepEqual(paginateA4SingleTags([], () => 1), []);
  assert.deepEqual(paginateA4SingleTags(['A', 'B'], item => item === 'A' ? 10 : -1), [['A','A','A','A','A','A'],['B']]);
  assert.deepEqual(paginateA4SingleTags(['A'], () => Number.NaN), [['A']]);
});
