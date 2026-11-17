import test from 'node:test';
import assert from 'node:assert/strict';
import quoteWorker from '../src/mobile-quote-frontend.mjs';

const request=path=>new Request('https://maliks-quote.example'+path,{method:'GET'});
const sizes=[['/quote-icon-192.png',192],['/quote-icon-512.png',512],['/quote-icon-maskable-512.png',512],['/apple-touch-icon.png',180]];

test('Maliks Quote renders a real install manifest, not a generic letter app icon',async()=>{
  const response=await quoteWorker.fetch(request('/manifest.webmanifest'),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/application\/manifest\+json/);
  const m=await response.json();
  assert.equal(m.name,'Maliks Quote');
  assert.equal(m.short_name,'Maliks Quote');
  assert.equal(m.display,'standalone');
  assert.equal(m.start_url,'/');
  assert.equal(m.scope,'/');
  assert.equal(m.background_color,'#0A2A3F');
  assert.equal(m.icons.length,3);
  for(const required of ['/quote-icon-192.png','/quote-icon-512.png','/quote-icon-maskable-512.png'])
    assert.ok(m.icons.some(x=>x.src===required),required);
  assert.ok(m.icons.some(x=>x.purpose==='maskable'));
});

test('The quote app displays the same real PowerBuild logo as its installed app icon',async()=>{
  const response=await quoteWorker.fetch(request('/'),{});
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/<link rel="manifest" href="\/manifest.webmanifest">/);
  assert.match(html,/<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png">/);
  assert.match(html,/<link rel="icon" type="image\/png" sizes="192x192" href="\/quote-icon-192.png">/);
  assert.match(html,/<meta name="apple-mobile-web-app-title" content="Maliks Quote">/);
  assert.match(html,/src="\/powerbuild-logo.png"/);
  assert.match(html,/QR/);
});

test('Android, maskable and iPhone app icons are valid PNGs with declared sizes',async()=>{
  for(const [route,size] of sizes){
    const response=await quoteWorker.fetch(request(route),{});
    assert.equal(response.status,200,route);
    assert.match(response.headers.get('content-type'),/image\/png/,route);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'PNG signature '+route);
    assert.equal(bytes.readUInt32BE(16),size,'PNG width '+route);
    assert.equal(bytes.readUInt32BE(20),size,'PNG height '+route);
    assert.ok(bytes.length>2000,route);
  }
});

test('Install icon assets are public but quote API access remains protected',async()=>{
  assert.equal((await quoteWorker.fetch(request('/quote-icon-192.png'),{})).status,200);
  assert.equal((await quoteWorker.fetch(request('/api/session'),{})).status,401);
  assert.equal((await quoteWorker.fetch(request('/api/quote/branch-queue'),{})).status,401);
  assert.equal((await quoteWorker.fetch(request('/unknown.png'),{})).status,404);
});
