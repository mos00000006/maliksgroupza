import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as source} from '../src/stock-labelling-ui.mjs';

test('Stock Labelling has landscape physical label and 90-degree compensated PDF modes',()=>{
 new vm.Script(source);
 assert.match(source,/GK420d print orientation/);
 assert.match(source,/\['compensate-cw','Fix sideways labels/);
 assert.match(source,/\['normal','Standard landscape/);
 assert.match(source,/\['compensate-ccw','Fix sideways labels/);
 assert.match(source,/const rotate=printOrientation\.value!=='normal'/);
 assert.match(source,/const pageW=rotate\?contentH:contentW,pageH=rotate\?contentW:contentH/);
 assert.doesNotMatch(source,/window\.print\(/);
});

test('portrait compensated PDF has exactly one physical label image per page',async()=>{
 const start=source.indexOf(' function makeStickerPdf('),end=source.indexOf(' let sending=false;');
 assert.ok(start>=0&&end>start);
 const make=(mode)=>vm.runInNewContext(source.slice(start,end)+'\nmakeStickerPdf',{
  fmt:{value:'40x24'},printOrientation:{value:mode},TextEncoder,Blob,Uint8Array,Map
 });
 const sample={bytes:Uint8Array.from([0xff,0xd8,0xff,0xd9]),width:480,height:288};
 for(const [mode,width,height] of [
  ['normal',40,24],['compensate-cw',24,40],['compensate-ccw',24,40]
 ]){
  const pdf=await make(mode)([{code:'TEST',image:sample,qty:2}],{width:40,height:24});
  const str=Buffer.from(await pdf.arrayBuffer()).toString('latin1');
  const pt=n=>(n*72/25.4).toFixed(4);
  assert.match(str,new RegExp('/MediaBox \\[0 0 '+pt(width).replace('.','\\.')+' '+pt(height).replace('.','\\.')+'\\]'));
  assert.match(str,/\/Count 2/);
  assert.equal((str.match(/\/Type \/Page /g)||[]).length,2);
  assert.equal((str.match(/\/Subtype \/Image /g)||[]).length,1);
  assert.doesNotMatch(str,/Maliks POS Professional|workers\.dev|2026, 16:26/);
 }
});

test('price, logo, product, barcode and published QR are retained',()=>{
 for(const fragment of ['function stickerJpeg(', 'function qrSvg(', 'function barcodeSVG(', 'labelPrice(p)', 'label_qr_token', 'powerbuild-logo.png', 'busterbuild-logo.png'])assert.ok(source.includes(fragment),fragment);
});
