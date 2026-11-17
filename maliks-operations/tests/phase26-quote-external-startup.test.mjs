import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import quote from '../src/mobile-quote-frontend.mjs';

test('Maliks Quote uses a same-origin external script with strict CSP and no inline click handlers',async()=>{
  const r=await quote.fetch(new Request('https://maliks-quote.example.test/'),{});
  assert.equal(r.status,200);
  const html=await r.text();
  assert.match(html,/<script src=\"\/quote-app\.js\" defer><\/script>/);
  assert.doesNotMatch(html,/<script>(?!<\/script>)/);
  assert.doesNotMatch(html,/onclick=/);
  assert.match(html,/id=\"review-save\"/);
  assert.match(html,/id=\"access-status\"/);
  assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);
  assert.doesNotMatch(r.headers.get('content-security-policy'),/script-src 'unsafe-inline'/);
  const js=await quote.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  assert.equal(js.status,200);
  assert.match(js.headers.get('content-type'),/javascript/);
  assert.match(js.headers.get('cache-control'),/no-store/);
  const text=await js.text();
  assert.match(text,/function mobileQuoteBrowser/);
  assert.match(text,/\(mobileQuoteBrowser\)\(\);/);
  assert.match(text,/id=>document\.getElementById/);
  assert.match(text,/Connection timed out after 15 seconds/);
  assert.match(text,/review-save/);
  // Confirm the script is syntactically valid without executing browser APIs.
  const {Script}=await import('node:vm');
  assert.doesNotThrow(()=>new Script(text));
});

test('Quote startup script is public but customer data and API remain protected',async()=>{
  const js=await quote.fetch(new Request('https://maliks-quote.example.test/quote-app.js'),{});
  assert.equal(js.status,200);
  const r=await quote.fetch(new Request('https://maliks-quote.example.test/api/session'),{});
  assert.equal(r.status,401);
  assert.match((await r.json()).error,/Sign in to Maliks Quote/);
});
