import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../app/hub-display-size.tsx', import.meta.url), 'utf8');
test('display size changes are applied by a React effect, not changeSize handler', () => {
  assert.match(src, /useEffect\(\(\) => \{\s*if \(!active\) return;[\s\S]*?document\.documentElement\.style\.zoom\s*=\s*String\(level\s*\/\s*100\)/);
  const handler = src.match(/function changeSize\(next: Level\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.ok(handler, 'changeSize handler is present');
  assert.doesNotMatch(handler, /document\.documentElement\.style\.zoom/);
  assert.match(handler, /setLevel\(next\)/);
  assert.match(handler, /localStorage\.setItem/);
});
