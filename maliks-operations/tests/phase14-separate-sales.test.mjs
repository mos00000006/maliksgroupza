import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import frontend from '../src/frontend.mjs';

const html=async kind=>(await frontend.fetch(new Request('https://test.example/'),{APP_TYPE:kind})).text();

test('Professional top navigation and home shortcuts do not expose Sales',async()=>{
  const page=await html('pos');
  assert.match(page,/<title>Maliks POS Professional<\/title>/);
  assert.doesNotMatch(page,/data-suite-module="sales"/);
  assert.doesNotMatch(page,/\['sales','▣','Sales'/);
  assert.doesNotMatch(page,/Open Sales workspace/);
  assert.match(page,/Open Stock module/);
  assert.match(page,/data-suite-module="stock"/);
  assert.match(page,/data-suite-module="debtors"/);
  assert.match(page,/if\(suiteView==='home'\)suiteHome\(\);else suiteModuleView\(suiteView\)/);
});

test('Sales runs as its own branded standalone workstation',async()=>{
  const page=await html('sales');
  assert.match(page,/<title>Maliks Sales<\/title>/);
  assert.match(page,/class="maliks-sales-workstation"/);
  assert.match(page,/src="\/maliks-mark.svg" alt="Maliks logo"/);
  assert.doesNotMatch(page,/id="suite-navigation"/);
  assert.match(page,/else if\(APP==='sales'\)posView\(\)/);
  for(const term of ['Send quotation to Cash Office','Print 80mm quotation slip','NOT PAID — QUOTATION ONLY'])assert.ok(page.includes(term),term);
  const mark=await frontend.fetch(new Request('https://test.example/maliks-mark.svg'),{APP_TYPE:'sales'});
  assert.equal(mark.status,200);
});

test('POS suite cannot access catalogue or quotations even with valid JWT',async()=>{
  const env={APP_TYPE:'pos',CORE:{fetch:()=>{throw Error('must not reach core');}}};
  for(const path of ['/api/catalogue','/api/quotes','/api/quotes/find','/api/payments']){
    const res=await frontend.fetch(new Request('https://test.example'+path,{headers:{'cf-access-jwt-assertion':'valid-test-token'}}),env);
    assert.equal(res.status,403,path);
  }
});

test('Sales worker uses the existing POS access identity and preserves origin',async()=>{
  const forwarded=[];
  const env={APP_TYPE:'sales',CORE:{fetch:async req=>{forwarded.push(req);return Response.json({ok:true});}}};
  const get=await frontend.fetch(new Request('https://maliks-sales.example/api/catalogue?branch=Test',{headers:{'cf-access-jwt-assertion':'test-token'}}),env);
  assert.equal(get.status,200);
  assert.equal(forwarded[0].headers.get('x-maliks-app'),'pos');
  assert.equal(forwarded[0].headers.get('cf-access-jwt-assertion'),'test-token');
  const post=await frontend.fetch(new Request('https://maliks-sales.example/api/quotes',{method:'POST',headers:{origin:'https://maliks-sales.example','cf-access-jwt-assertion':'test-token'},body:'{}'}),env);
  assert.equal(post.status,200);
  assert.equal(forwarded[1].headers.get('x-maliks-original-origin'),'https://maliks-sales.example');
  assert.equal(forwarded[1].headers.get('origin'),'https://maliks-sales.example');
  const wrongOrigin=await frontend.fetch(new Request('https://maliks-sales.example/api/quotes',{method:'POST',headers:{origin:'https://attacker.example','cf-access-jwt-assertion':'test-token'},body:'{}'}),env);
  assert.equal(wrongOrigin.status,403);
  assert.equal(forwarded.length,2);
});

test('Sales worker cannot use other department endpoints',async()=>{
  const env={APP_TYPE:'sales',CORE:{fetch:()=>{throw Error('must not reach core');}}};
  for(const path of ['/api/till-shifts','/api/payments','/api/dispatch-jobs','/api/payment-evidence']){
    const res=await frontend.fetch(new Request('https://test.example'+path,{headers:{'cf-access-jwt-assertion':'test-token'}}),env);
    assert.equal(res.status,403,path);
  }
});

test('Deployment declares distinct maliks-pos and maliks-sales workers',()=>{
  const cfg=readFileSync(new URL('../scripts/make-config.mjs',import.meta.url),'utf8');
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(cfg,/sales:'CF_ACCESS_AUD_POS'/);
  assert.match(cfg,/name:'maliks-'\+\(app==='cashoffice'/);
  assert.equal(pkg.scripts['deploy:sales'],'wrangler deploy --config .generated/sales.json');
});
