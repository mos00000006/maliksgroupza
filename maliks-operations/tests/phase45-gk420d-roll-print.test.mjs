import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';
test('GK420d Chrome PDF has single-label pages or two independent portrait slots per row',()=>{
 new vm.Script(s);
 assert.match(s,/\['40x24','Single 40 × 24 mm sticker'\]/);
 assert.match(s,/\['50x30','Single 50 × 30 mm sticker'\]/);
 assert.match(s,/function makeTwoUpPdf\(/);
 assert.match(s,/labelW\+g\.gap/);
 assert.match(s,/for\(let i=0;i<row\.qty;i\+\+\)/);
 assert.match(s,/makeStickerPdf/);
 assert.doesNotMatch(s,/width:80,height:24,columns:2/);
});
test('Chrome PDF contains no browser webpage header/date/URL',()=>{
 assert.doesNotMatch(s,/window\.print\(/);
 assert.match(s,/application\/pdf/);
 assert.match(s,/URL\.createObjectURL/);
 assert.match(s,/viewer\.location\.replace\(url\)/);
 assert.match(s,/Chrome PDF/);
});
test('GK420d selection is shown instead of installing local printer software',()=>{
 assert.match(s,/select GK420d/);
 assert.doesNotMatch(s,/https:\/\/localhost:9101/);
 assert.doesNotMatch(s,/bpRequest\(/);
});
