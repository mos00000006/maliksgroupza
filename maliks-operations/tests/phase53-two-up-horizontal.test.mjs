import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {STOCK_LABEL_CLIENT_SCRIPT as s} from '../src/stock-labelling-ui.mjs';

test('POS two-across mode defaults to horizontal artwork without disabling logo or QR',()=>{
 new vm.Script(s);
 assert.match(s,/\['two-up','Two portrait stickers side by side/);
 assert.match(s,/twoUpOrientation.value='horizontal-cw'/);
 assert.match(s,/\['horizontal-ccw'/);
 assert.match(s,/optBrand=toggle\('Branch logo',true\)/);
 assert.match(s,/optQR=toggle\('QR → MaliksQuote',true\)/);
 assert.match(s,/if\(twoUpOrientation.value!=='portrait'\)return await horizontalTwoUpStickerJpeg/);
 assert.match(s,/await stickerJpeg\(queue\[0\],brand\)/);
 assert.doesNotMatch(s,/window\.print\(/);
});

function renderingHarness(mode){
 const canvases=[];
 const document={createElement(type){assert.equal(type,'canvas');const calls=[];
  const canvas={width:0,height:0,calls,toDataURL:()=> 'data:image/jpeg;base64,/9j/2Q==',getContext(){return{
   fillStyle:'',textAlign:'',textBaseline:'',font:'',fillRect(...x){calls.push(['fillRect',...x]);},
   fillText(...x){calls.push(['fillText',...x]);},drawImage(...x){calls.push(['drawImage',...x]);},
   translate(...x){calls.push(['translate',...x]);},rotate(...x){calls.push(['rotate',...x]);},
   save(){calls.push(['save']);},restore(){calls.push(['restore']);},
   measureText(txt){return {width:txt.length*7};}
  };}};canvases.push(canvas);return canvas;}};
 const env={
  document,Uint8Array,atob,Math,
  labelGeometry:()=>({width:50,height:40,labelW:24,labelH:40,gap:2}),
  mm:n=>n*12, twoUpOrientation:{value:mode},
  optBrand:{checked:true},optDesc:{checked:true},optBarcode:{checked:true},optQR:{checked:true},
  optCode:{checked:true},optUnit:{checked:true},priceMode:{value:'incl'},
  urlFor:()=> 'https://maliks.co.za/p/01234567-89ab-cdef-0123-456789abcdef?branch=Test',
  svgImage:async()=>({width:100,height:100}), qrSvg:()=>'<svg>QR</svg>',barcodeSVG:()=>'<svg>BAR</svg>',
  labelPrice:()=> 'R65.00',
  wrapDescription:(ctx,desc)=>[desc.slice(0,15),desc.slice(15)],
 };
 const start=s.indexOf(' async function horizontalTwoUpStickerJpeg(');
 const end=s.indexOf(' async function portraitStickerJpeg(',start);
 assert.ok(start>=0&&end>start);
 const render=vm.runInNewContext(s.slice(start,end)+'\nhorizontalTwoUpStickerJpeg',env);
 return {render,canvases};
}

test('horizontal layout draws logo, description, barcode, QR and price onto one portrait sticker',async()=>{
 const {render,canvases}=renderingHarness('horizontal-cw');
 const result=await render({name:'110 X UG RODDING EYE',code:'PLUUAP43',barcode:'PLUUAP43',selling_price_cents:6500},{width:200,height:100});
 assert.equal(result.width,24*12);assert.equal(result.height,40*12);
 assert.equal(canvases.length,2);
 assert.equal(canvases[0].width,40*12);assert.equal(canvases[0].height,24*12);
 const painting=canvases[0].calls;
 assert.ok(painting.filter(x=>x[0]==='drawImage').length>=3,'logo, barcode and QR images retained');
 assert.ok(painting.some(x=>x[0]==='fillText'&&x[1]==='R65.00'));
 assert.ok(painting.some(x=>x[0]==='fillText'&&String(x[1]).includes('PLUUAP43')));
 assert.ok(canvases[1].calls.some(x=>x[0]==='rotate'&&x[1]===Math.PI/2));
 assert.ok(canvases[1].calls.some(x=>x[0]==='drawImage'));
});

test('opposite horizontal direction changes only rotation, not sticker physical dimensions',async()=>{
 const {render,canvases}=renderingHarness('horizontal-ccw');
 const result=await render({name:'110 X UG RODDING EYE',code:'PLUUAP43'}, {width:20,height:20});
 assert.equal(result.width,288);assert.equal(result.height,480);
 assert.ok(canvases[1].calls.some(x=>x[0]==='rotate'&&x[1]===-Math.PI/2));
});

test('two-across PDF still confines each print image to one physical sticker',async()=>{
 const start=s.indexOf(' function makeTwoUpPdf('),end=s.indexOf(' function makeStickerPdf(',start);
 const fn=vm.runInNewContext(s.slice(start,end)+'\nmakeTwoUpPdf',{TextEncoder,Blob,Uint8Array,Map});
 const sample={bytes:Uint8Array.from([255,216,255,217]),width:288,height:480};
 const pdf=await fn([{code:'TEST',image:sample,qty:1}],{width:50,height:40,labelW:24,labelH:40,gap:2});
 const str=Buffer.from(await pdf.arrayBuffer()).toString('latin1');
 assert.match(str,/\/MediaBox \[0 0 141\.7323 113\.3858\]/);
 assert.match(str,/\/Count 1/);
 assert.match(str,/q 68\.0315 0 0 113\.3858 0 0 cm \/A Do Q/);
 assert.equal((str.match(/\/Subtype \/Image/g)||[]).length,1);
 assert.doesNotMatch(str,/Maliks POS Professional|workers\.dev|2026, 16:26/);
});
