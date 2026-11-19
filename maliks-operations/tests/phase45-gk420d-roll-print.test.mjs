import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';
test('GK420d uses a single actual sticker per raw ZPL page, not browser sheets',()=>{
 new vm.Script(s);
 assert.match(s,/width:40,height:24,columns:1/);
 assert.match(s,/width:50,height:30,columns:1/);
 assert.match(s,/\^PW/);
 assert.match(s,/\^LL/);
 assert.match(s,/\^PQ/);
 assert.doesNotMatch(s,/width:80,height:24,columns:2/);
});
test('no Chrome print dialog or browser headers, dates, footer URL in the raw label',()=>{
 assert.doesNotMatch(s,/window\.print\(/);
 assert.match(s,/ZEBRA_BRIDGE='https:\/\/localhost:9101\/'/);
 assert.match(s,/bpRequest\('write'/);
 assert.match(s,/\^BQN,2,2/);
 assert.match(s,/\^BCN/);
 assert.match(s,/logoGFA/);
});
test('the app chooses a GK420d and never silently prints to a wrong printer',()=>{
 assert.match(s,/isGK420d/);
 assert.match(s,/No Zebra GK420d found/);
 assert.match(s,/Zebra Browser Print/);
 assert.match(s,/Accepted Hosts/);
});
