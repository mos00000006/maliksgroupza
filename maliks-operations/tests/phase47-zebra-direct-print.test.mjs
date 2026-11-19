import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { STOCK_LABEL_CLIENT_SCRIPT as script } from '../src/stock-labelling-ui.mjs';

test('Chrome label output is a PDF rather than a POS web-page print',()=>{
  new vm.Script(script);
  assert.match(script,/async function printChrome\(/);
  assert.match(script,/makeStickerPdf\(/);
  assert.doesNotMatch(script,/window\.print\(/);
});

test('both label formats rasterize barcode, published QR and branch logo into PDF images',()=>{
  assert.match(script,/const PDF_DPI=12/);
  assert.match(script,/barcodeSVG\(p\.barcode\|\|p\.code\)/);
  assert.match(script,/const bar=await svgImage\(barcode\)/);
  assert.match(script,/const img=await svgImage\(barcode\)/);
  assert.match(script,/const qr=await svgImage\(qrSvg\(url\)\)/);
  assert.match(script,/const img=await svgImage\(qrSvg\(url\)\)/);
  assert.match(script,/ctx\.drawImage\(brandImage/);
  assert.match(script,/\/MediaBox \[0 0 /);
  assert.match(script,/\/DCTDecode/);
});

test('logo and MaliksQuote QR are on by default; price is branch sourced',()=>{
  assert.match(script,/optBrand=toggle\('Branch logo',true\)/);
  assert.match(script,/optQR=toggle\('QR → MaliksQuote',true\)/);
  assert.match(script,/selling_price_cents/);
  assert.match(script,/urlFor\(p\)/);
  assert.match(script,/label_qr_token/);
  assert.match(script,/No published Hub QR token/);
  assert.match(script,/busterbuild-logo\.png/);
  assert.match(script,/powerbuild-logo\.png/);
});
