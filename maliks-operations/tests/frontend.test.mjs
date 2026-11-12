import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
const env={APP_TYPE:'pos',CORE:{fetch:()=>Promise.resolve(Response.json({app:'pos'}))}};
test('POS renders independent HTML page',async()=>{
 const res=await frontend.fetch(new Request('https://maliks-pos.example.test/'),env);
 assert.equal(res.status,200);
 const body=await res.text();
 assert.match(body,/Maliks POS/);assert.match(body,/Send quotation to Cash Office/);
 assert.doesNotMatch(body,/Confirm payment and print paid invoice/);
});
test('API denies missing Cloudflare Access token',async()=>{
 const res=await frontend.fetch(new Request('https://maliks-pos.example.test/api/session'),env);
 assert.equal(res.status,401);
});
test('same-origin check rejects cross-site quote submission',async()=>{
 const res=await frontend.fetch(new Request('https://maliks-pos.example.test/api/quotes',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}),env);
 assert.equal(res.status,403);
});
test('worker app cannot claim a different department',async()=>{
 let seen;
 const accessEnv={APP_TYPE:'cashoffice',CORE:{fetch:async req=>{seen=req;return Response.json({ok:true});}}};
 const res=await frontend.fetch(new Request('https://cash.example.test/api/session',{headers:{'cf-access-jwt-assertion':'dummy.signed.jwt'}}),accessEnv);
 assert.equal(res.status,200);
 assert.equal(seen.headers.get('x-maliks-app'),'cashoffice');
 assert.equal(seen.headers.get('cf-access-jwt-assertion'),'dummy.signed.jwt');
});

test('same-origin quotations forward validated origin to the private core',async()=>{
 let forwarded;const postEnv={APP_TYPE:'pos',CORE:{fetch:async req=>{forwarded=req;return Response.json({ok:true});}}};
 const req=new Request('https://maliks-pos.example.test/api/quotes',{method:'POST',
   headers:{origin:'https://maliks-pos.example.test','cf-access-jwt-assertion':'dummy.signed.jwt','content-type':'application/json'},body:'{}'});
 const res=await frontend.fetch(req,postEnv);assert.equal(res.status,200);
 assert.equal(forwarded.headers.get('origin'),'https://maliks-pos.example.test');
 assert.equal(forwarded.headers.get('x-maliks-original-origin'),'https://maliks-pos.example.test');
});
