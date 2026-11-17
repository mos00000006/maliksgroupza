import test from 'node:test';
import assert from 'node:assert/strict';
import quote from '../src/mobile-quote-frontend.mjs';

test('Quote exposes explicit Cloudflare Access session continuation without requiring employee password',async()=>{
  const r=await quote.fetch(new Request('https://maliks-quote.example.test/'),{});
  const html=await r.text();
  const js=await (await quote.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{})).text();
  assert.equal(r.status,200);
  assert.match(html, /id="access-continue"/);
  assert.match(html, /Continue with Cloudflare Access/);
  assert.match(html, /id="access-status"/);
  assert.match(js, /window\.addEventListener\('focus'/);
  assert.match(js, /window\.addEventListener\('pageshow'/);
  assert.match(js, /checkingSession/);
  assert.match(js, /await request\('\/api\/session'\)/);
  assert.match(html, /id="login-form"/);
  assert.match(js, /'\/api\/auth\/login'/);
});

test('Quote access continuation does not expose backend sessions or weaken protected API routes',async()=>{
  const r=await quote.fetch(new Request('https://maliks-quote.example.test/api/session'),{CORE:{fetch:async()=>{throw Error('Should not be called without auth');}}});
  assert.equal(r.status,401);
  const body=await r.json();
  assert.match(body.error,/Sign in to Maliks Quote/);
});
