import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT} from '../src/stock-labelling-ui.mjs';

test('GK420d print uses one label per page at real stock dimensions',()=>{
  new vm.Script(STOCK_LABEL_CLIENT_SCRIPT);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/width:40,height:24,columns:1/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/width:50,height:30,columns:1/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/for\(const html of labels\)/);
  assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/width:80,height:24,columns:2/);
  assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/labels\.slice\(i,i\+size\.columns\)/);
});
test('print CSS hides the POS screen and paginates individual stickers',()=>{
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/body > :not\(\.label43-print-host\)/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/@page \{ size: \$\{size\.width\}mm \$\{size\.height\}mm; margin: 0/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/position: static !important/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/page-break-after: always !important/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/page-break-after: auto !important/);
});
test('browser chrome headers/footers instructions and logo-ready wait remain visible',()=>{
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/turn OFF Headers and footers/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/Margins: None/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/Scale: 100%/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/img\.decode\(\)/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/busterbuild-logo\.png/);
  assert.match(STOCK_LABEL_CLIENT_SCRIPT,/powerbuild-logo\.png/);
});
