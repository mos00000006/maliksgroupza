import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';
test('GK420d Chrome PDF has single physical label per PDF page',()=>{
 new vm.Script(s);
 assert.match(s,/width:40,height:24/);
 assert.match(s,/width:50,height:30/);
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
