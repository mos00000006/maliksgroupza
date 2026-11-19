import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';

test('Stock Labelling can print two physical portrait labels on one roll row',()=>{
 new vm.Script(s);
 assert.match(s,/Two portrait stickers side by side/);
 assert.match(s,/function labelGeometry\(\)/);
 assert.match(s,/labelW\+gap/);
 assert.match(s,/async function portraitStickerJpeg\(/);
 assert.match(s,/function makeTwoUpPdf\(/);
 assert.doesNotMatch(s,/window\.print\(/);
});
test('portrait sticker contains branch logo, product, price and separate barcode and QR zones',()=>{
 assert.match(s,/brandImage/);
 assert.match(s,/wrapDescription\(ctx,p\.name/);
 assert.match(s,/labelPrice\(p\)/);
 assert.match(s,/barcodeSVG\(p\.barcode\|\|p\.code\)/);
 assert.match(s,/qrSvg\(url\)/);
 assert.match(s,/No published Hub QR token/);
});
test('PDF has 2-up pages and never stretches product across both stickers',async()=>{
 const code=s.slice(s.indexOf(' function makeTwoUpPdf('),s.indexOf(' function makeStickerPdf('));
 const make=new Function(code+'\nreturn makeTwoUpPdf;')();
 const image={bytes:new Uint8Array([0xff,0xd8,0xff,0xd9]),width:1,height:1};
 const pdf=make([{code:'ONE',qty:2,image},{code:'TWO',qty:1,image}],{width:50,height:40,labelW:24,labelH:40,gap:2});
 const raw=new TextDecoder('latin1').decode(await pdf.arrayBuffer());
 assert.match(raw,/\/MediaBox \[0 0 141\.7323 113\.3858\]/);
 assert.equal((raw.match(/\/Type \/Page \/Parent/g)||[]).length,2);
 assert.match(raw,/\/A Do Q[\s\S]*\/B Do Q/);
 assert.match(raw,/68\.0315 0 0 113\.3858 0 0 cm \/A Do Q/);
 assert.match(raw,/68\.0315 0 0 113\.3858 73\.7008 0 cm \/B Do Q/);
});
