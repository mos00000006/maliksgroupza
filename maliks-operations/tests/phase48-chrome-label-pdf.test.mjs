import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';

test('Phase 48: switch from Zebra Browser Print to Chrome PDF without page metadata',()=>{
 new vm.Script(s);
 assert.match(s,/const printButton=invButton\('Print GK420d Labels \(Chrome\)'/);
 assert.match(s,/viewer\.location\.replace\(url\)/);
 assert.match(s,/Two portrait stickers side by side/);
 assert.doesNotMatch(s,/ZEBRA_BRIDGE|zebraDevice|window\.print\(/);
});
test('Phase 48: PDF generator embeds exact media sizes with reusable product images',()=>{
 assert.match(s,/\/Type \/Catalog \/Pages 2 0 R/);
 assert.match(s,/\/MediaBox \[0 0 /);
 assert.match(s,/byProduct\.get\(row\.code\)/);
 assert.match(s,/row\.qty/);
 assert.match(s,/image\/jpeg/);
 assert.match(s,/application\/pdf/);
 assert.match(s,/Actual size \/ 100%/);
});
test('Phase 48: printing preserves branch brand, selling price and published QR URL',()=>{
 assert.match(s,/busterbuild-logo\.png/);
 assert.match(s,/powerbuild-logo\.png/);
 assert.match(s,/selling_price_cents/);
 assert.match(s,/urlFor\(p\)/);
 assert.match(s,/qrSvg\(url\)/);
 assert.match(s,/barcodeSVG\(p\.barcode\|\|p\.code\)/);
});
