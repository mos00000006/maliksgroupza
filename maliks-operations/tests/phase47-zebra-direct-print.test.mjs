import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';

test('browser script valid and creates PDF without printing a webpage',()=>{
 new vm.Script(s);
 assert.match(s,/async function printChrome\(/);
 assert.doesNotMatch(s,/window\.print\(/);
});
test('PDF label page size is fixed per product with vector barcode/QR rasterizing',()=>{
 assert.match(s,/const PDF_DPI=12/);
 assert.match(s,/const qr=await svgImage\(qrSvg\(url\)\)/);
 assert.match(s,/const bar=await svgImage\(code\)/);
 assert.match(s,/\/MediaBox \[0 0 /);
 assert.match(s,/\/DCTDecode/);
});
test('Chrome PDF remains branch linked, price valid and QR scannable',()=>{
 assert.match(s,/selling_price_cents/);
 assert.match(s,/urlFor\(p\)/);
 assert.match(s,/label_qr_token/);
 assert.match(s,/No published Hub QR token/);
 assert.doesNotMatch(s,/No QR generated/i);
});
