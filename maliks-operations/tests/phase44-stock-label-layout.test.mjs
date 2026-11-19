import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { STOCK_LABEL_CLIENT_SCRIPT as script } from '../src/stock-labelling-ui.mjs';

test('compact single-label preview keeps an isolated print layout and both size options',()=>{
  new vm.Script(script);
  assert.match(script,/label43-sticker\{/);
  assert.match(script,/grid-template-rows:6\.8mm 6\.2mm 3mm/);
  assert.match(script,/grid-template-rows:8\.2mm 7\.6mm 3\.8mm/);
  assert.match(script,/--label-w:40mm;--label-h:24mm/);
  assert.match(script,/--label-w:50mm;--label-h:30mm/);
  assert.match(script,/label43-preview \.label43-sticker\{transform:scale\(1\.65\)/);
  assert.match(script,/label43-head/);
  assert.match(script,/label43-price/);
  assert.match(script,/label43-qr/);
  assert.doesNotMatch(script,/class="price"/);
});

test('two-up portrait label remains available with separate per-sticker images',()=>{
  assert.match(script,/label43-sticker\.label43-portrait/);
  assert.match(script,/function makeTwoUpPdf\(/);
  assert.match(script,/async function portraitStickerJpeg\(/);
  assert.match(script,/const g=labelGeometry\(\),w=g\.labelW,h=g\.labelH/);
});
