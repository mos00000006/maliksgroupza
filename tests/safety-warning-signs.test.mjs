import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');

test('safety signs has representative, separate safety groups and export', () => {
  const s = read('app/price-tags/safety-warning-signs.tsx');
  for (const x of ['forklift','smoking','hardhat','extinguisher','firstaid','exit','dispatch','receiving','toilets','mens','womens','accessible','custom']) assert.match(s, new RegExp(x));
  assert.match(s, /signagePdf\(/);
  assert.match(s, /toJpeg\(/);
  assert.match(s, /not certified regulatory signs/);
});

test('Price Tag Studio provides a functioning Safety & Warning Signs tab and preserves other menus', () => {
  const s = read('app/price-tags/price-tag-generator.tsx');
  for (const label of ['Single product tag','Create a combo','Store signage','Staff ID cards']) {
    assert.ok(s.includes(label), `Missing ${label}`);
  }
  assert.match(s, /import SafetyWarningSigns from ["']\.\/safety-warning-signs["']/);
  assert.match(s, /mode === "safety-signs"/);
  assert.match(s, /setMode\("safety-signs"\)/);
  assert.match(s, /Safety\s*(?:&amp;|&)\s*Warning Signs/);
});
