import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { STOCK_LABEL_CLIENT_SCRIPT } from '../src/stock-labelling-ui.mjs';
test('label preview and printer use the same isolated fixed grid layout',()=>{
 new vm.Script(STOCK_LABEL_CLIENT_SCRIPT);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/grid-template-rows:5\.5mm 5\.2mm 2mm/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/grid-template-rows:7mm 6\.5mm 2\.5mm/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/label43-price/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/label43-head/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/label43-qr/);
 assert.doesNotMatch(STOCK_LABEL_CLIENT_SCRIPT,/class="price"/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/transform:scale\(1\.65\)/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/width:40,height:24/);
 assert.match(STOCK_LABEL_CLIENT_SCRIPT,/width:50,height:30/);
});
