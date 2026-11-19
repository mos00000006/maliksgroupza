import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { STOCK_LABEL_CLIENT_SCRIPT as script } from '../src/stock-labelling-ui.mjs';

test('Stock Labelling keeps the branch logo and QR turned ON by default', () => {
  new vm.Script(script);
  assert.match(script, /optBrand=toggle\('Branch logo',true\)/);
  assert.match(script, /optQR=toggle\('QR → MaliksQuote',true\)/);
  assert.match(script, /optBarcode=toggle\('Barcode',true\)/);
});

test('Compact horizontal GK420d PDF places logo and QR on the printed image', () => {
  assert.match(script, /function stickerJpeg\(p,brandImage\)/);
  assert.match(script, /if\(optBrand\.checked&&brandImage\)/);
  assert.match(script, /ctx\.drawImage\(brandImage,mm\(pad\),mm\(\.85\)/);
  assert.match(script, /ctx\.drawImage\(qr,mm\(size\.width-qrSize-pad\)/);
  assert.match(script, /const priceText=labelPrice\(p\),qrSize=large\?9\.2:8\.8;/);
  assert.match(script, /if\(fmt\.value==='two-up'\)return await portraitStickerJpeg\(p,brandImage\)/);
});

test('Existing branch logo choice and genuine published price-card QR URL remain intact', () => {
  assert.match(script, /brandIsBuster\?'\/busterbuild-logo\.png':'\/powerbuild-logo\.png'/);
  assert.match(script, /label_qr_token/);
  assert.match(script, /if\(optQR\.checked&&!url\)throw Error\('No published Hub QR token/);
  assert.match(script, /function qrSvg\(value\)/);
  assert.doesNotMatch(script, /window\.print\(/);
});
