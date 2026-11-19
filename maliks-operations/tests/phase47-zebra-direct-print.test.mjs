import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';
test('direct printer script syntax and no HTML page print',()=>{
 new vm.Script(s);
 assert.match(s,/function printDirect\(/);
 assert.doesNotMatch(s,/window\.print\(/);
 assert.doesNotMatch(s,/@page\s*\{/);
});
test('Zebra Browser Print discovery and write are local and opt-in',()=>{
 assert.match(s,/https:\/\/localhost:9101\//);
 assert.match(s,/bpRequest\('available'\)/);
 assert.match(s,/bpRequest\('default\?type=printer'\)/);
 assert.match(s,/bpRequest\('write'/);
 assert.match(s,/No Zebra GK420d found/);
 assert.match(s,/Print GK420d Labels/);
});
test('ZPL coordinates are bounded to 40x24 or 50x30 media at 203dpi',()=>{
 assert.match(s,/size.width\*8,height:size.height\*8/);
 assert.match(s,/\^XA/);assert.match(s,/\^XZ/);
 assert.match(s,/\^PW/);assert.match(s,/\^LL/);
 assert.match(s,/\^BQN,2,2/);
 assert.match(s,/\^BCN/);
 assert.match(s,/\^GFA/);
 assert.match(s,/\^PQ/);
});
test('labels preserve live price and QR linking; never encode printed price into QR',()=>{
 assert.match(s,/selling_price_cents/);
 assert.match(s,/urlFor\(p\)/);
 assert.match(s,/label_qr_token/);
 assert.match(s,/\^FDLA,/);
 assert.doesNotMatch(s,/No QR generated/i);
});

test('generated 40x24 ZPL is a standalone label with price and scannable QR without Chrome metadata',()=>{
 const safe=s.slice(s.indexOf(' function zplSafe('),s.indexOf(' async function logoGFA('));
 const label=s.slice(s.indexOf(' function labelZPL('),s.indexOf(' let sending=false;'));
 const context={fmt:{value:'40x24'},priceMode:{value:'incl'},optQR:{checked:true},optDesc:{checked:true},optCode:{checked:true},optUnit:{checked:true},optBarcode:{checked:true},optBrand:{checked:true},urlFor:()=> 'https://maliks.co.za/p/12345678-1234-1234-1234-123456789abc?branch=Test'};
 const cmd=vm.runInNewContext(safe+String.fromCharCode(10)+label+String.fromCharCode(10)+`labelZPL({code:"PLUUAP43",name:"110 X UG RODDING EYE",selling_price_cents:6500,barcode:"PLUUAP43",unit:"EA"},2,"^GFA,1,1,1,00");`,context);
 assert.match(cmd,/\^XA/);assert.match(cmd,/\^XZ/);assert.match(cmd,/\^PW320/);assert.match(cmd,/\^LL192/);
 assert.match(cmd,/\^FDR65\.00/);assert.match(cmd,/\^PQ2/);assert.match(cmd,/\^BQN,2,2/);
 assert.match(cmd,/\^GFA,1,1,1,00/);
 assert.doesNotMatch(cmd,/Maliks POS|2026|workers\.dev|16:26/);
});
