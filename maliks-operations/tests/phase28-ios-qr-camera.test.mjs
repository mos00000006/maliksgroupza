import test from 'node:test';
import assert from 'node:assert/strict';
import quoteFrontend from '../src/mobile-quote-frontend.mjs';

test('Quote mobile scanner supports Safari without native BarcodeDetector',async()=>{
  const page=await quoteFrontend.fetch(new Request('https://maliks-quote.example.test/'),{});
  const html=await page.text();
  assert.equal(page.status,200);
  assert.match(html,/script src="\/quote-app\.js" defer/);
  assert.match(page.headers.get('content-security-policy')||'',/script-src 'self' https:\/\/cdn\.jsdelivr\.net https:\/\/unpkg\.com/);
  const response=await quoteFrontend.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  assert.equal(response.status,200);
  const js=await response.text();
  assert.match(js,/navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(js,/loadQrDecoder\(\)/);
  assert.match(js,/window\.jsQR\(pixels\.data,canvas\.width,canvas\.height/);
  assert.match(js,/inversionAttempts:'attemptBoth'/);
  assert.match(js,/facingMode:\{ideal:'environment'\}/);
  assert.match(js,/await addScanned\(found\)/);
  assert.match(js,/video\.setAttribute\('playsinline',''\)/);
  assert.match(js,/cameraLoop\(video,detector\)/);
  assert.doesNotMatch(js,/Built-in camera QR detection is unavailable/);
});

test('native scanner still works without a third-party decoder and camera frames stay on device',async()=>{
  const r=await quoteFrontend.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  const js=await r.text();
  assert.match(js,/new window\.BarcodeDetector\(\{formats:\['qr_code'\]\}\)/);
  assert.match(js,/if\(!detector\)\{message\('Preparing iPhone-compatible QR scanner/);
  assert.match(js,/context\.getImageData\(0,0,canvas\.width,canvas\.height\)/);
  assert.doesNotMatch(js,/toDataURL\(|toBlob\(/);
  assert.match(js,/if\(state\.stream\)\{for\(const tr of state\.stream\.getTracks\(\)\)tr\.stop\(\)/);
});

test('iPhone camera reads a QR frame and adds the corresponding product to its quote',async()=>{
  const {runInNewContext}=await import('node:vm');
  const response=await quoteFrontend.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  const served=await response.text();
  const nodes=new Map();let lastFrame,stopped=false,qrFrames=0,productLookups=0,cameraRequests=0;
  const makeNode=(id='')=>({id,hidden:id==='workspace'||id==='change-password',value:'',textContent:'',disabled:false,style:{},classList:{toggle(){}},listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(){},replaceChildren(){this.value='';this.children=[];},
    append(...v){this.children=[...(this.children||[]),...v];if(id==='branch'&&!this.value&&v.length)this.value=v[0].value||'';},
    scrollIntoView(){},getContext(){return {drawImage(){},getImageData(){return {data:new Uint8ClampedArray(640*480*4)}}};},
    play:async()=>{},pause(){},readyState:4,videoWidth:640,videoHeight:480});
  const element=id=>{if(!nodes.has(id))nodes.set(id,makeNode(id));return nodes.get(id)};
  const video=element('camera'),qr='123e4567-e89b-12d3-a456-426614174000';
  const document={getElementById:element,querySelector(){return null;},createElement(tag){return makeNode(tag);},addEventListener(){},head:{append(){throw Error('No CDN script should load when the decoder is already available.')}}};
  const window={addEventListener(){},scrollTo(){},jsQR(){qrFrames++;return {data:'https://maliks.co.za/p/'+qr};}};
  const navigator={mediaDevices:{getUserMedia:async()=>{cameraRequests++;return {getTracks(){return [{stop(){stopped=true}}]}};}}};
  const fetch=async url=>{
    if(url==='/api/session')return Response.json({app:'pos',user:{name:'Staff',role:'Developer / Technical Admin'},branches:['Active Build Carletonville'],password_change_required:false});
    if(String(url).startsWith('/api/quote/tag?')){productLookups++;return Response.json({product:{id:1,name:'Sample Tile',code:'T001',unit:'each',price_cents:12500}});}
    throw Error('Unexpected request '+url);
  };
  runInNewContext(served,{document,window,navigator,fetch,location:{search:''},Response,Request,AbortController,URL,URLSearchParams,Intl,
    setTimeout,clearTimeout,performance:{now:()=>250},Uint8ClampedArray,crypto,requestAnimationFrame(fn){lastFrame=fn;return 1;},cancelAnimationFrame(){}});
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(element('workspace').hidden,false);
  element('camera-start').listeners.click();
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(cameraRequests,1,'iPhone rear camera must open even without BarcodeDetector');
  assert.equal(video.hidden,false);
  assert.equal(typeof lastFrame,'function');
  lastFrame();
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(qrFrames,1,'Live video frame must be decoded with jsQR');
  assert.equal(productLookups,1,'Decoded QR must resolve through secured product lookup');
  assert.equal(stopped,true,'Camera must stop after a successful QR scan');
  assert.match(element('basket-list').children?.[0]?.children?.[0]?.children?.[0]?.textContent||'',/Sample Tile/);
});
