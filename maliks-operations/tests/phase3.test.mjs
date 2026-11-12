import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import { quoteLookupStatement } from '../src/quote-domain.mjs';

const site=async app=> (await frontend.fetch(new Request(`https://${app}.example.test/`),{APP_TYPE:app})).text();

test('quotation number lookup is parameterized and branch-scoped for Tills and Cash Office',()=>{
  for(const app of ['tills','cashoffice']){
    const {sql,params}=quoteLookupStatement(app,'Active Build Carletonville','ignored@example.com','Q-00000084');
    assert.match(sql,/id=\?/);
    assert.match(sql,/lower\(branch\)=lower\(\?\)/);
    assert.match(sql,/LIMIT 1/);
    assert.deepEqual(params,[84,'Active Build Carletonville']);
  }
});
test('POS quotation number lookup also filters by current salesperson',()=>{
  const {sql,params}=quoteLookupStatement('pos','Buster Build','sales@example.test','Q-31');
  assert.match(sql,/lower\(submitted_by_email\)=lower\(\?\)/);
  assert.deepEqual(params,[31,'Buster Build','sales@example.test']);
});
test('invalid quotation IDs and unauthorised department are denied',()=>{
  for(const invalid of [null,'','Q-0','Q--1','Q-1 OR 1=1','Q-ABC','Q-1.0','Q-999999999999999999']){
    assert.throws(()=>quoteLookupStatement('tills','Buster Build','user@example.test',invalid),/quotation number/i);
  }
  assert.throws(()=>quoteLookupStatement('dispatch','Buster Build','user@example.test','Q-1'),/Not authorised/);
  assert.throws(()=>quoteLookupStatement('tills','','user@example.test','Q-1'),/Not authorised/);
});
test('Tills and Cash Office retain exact quote lookup and payment verification is separately controlled',async()=>{
  for(const app of ['tills','cashoffice']){
    const html=await site(app);
    assert.match(html,/Find quotation by exact number/);
    assert.match(html,/api\/quotes\/find\?branch=/);
    assert.match(html,/older quotations that are no longer in the recent-50 list/);
    assert.match(html,/Quotation details are not payment confirmation/);
    assert.doesNotMatch(html,/Issue tax invoice|Mark as paid/);
  }
});
test('Tills includes a locally computed cash preview explicitly marked non-transacting',async()=>{
  const html=await site('tills');
  assert.match(html,/Cash change calculator — TRAINING ONLY/);
  assert.match(html,/NO PAYMENT RECORDED/);
  assert.match(html,/Cash shortfall \(preview\)/);
  assert.match(html,/Change to return \(preview\)/);
  assert.match(html,/const difference=paid-row.total_cents/);
});
test('Exact read-only lookup forwards to central API with fixed department and Access JWT',async()=>{
  let captured;
  const env={APP_TYPE:'tills',CORE:{fetch:async req=>{captured=req;return Response.json({quotation:{number:'Q-00000001'}});}}};
  const req=new Request('https://maliks-tills.example.test/api/quotes/find?branch=Buster%20Build&number=Q-00000001',{headers:{'cf-access-jwt-assertion':'jwt.placeholder.test'}});
  const response=await frontend.fetch(req,env);
  assert.equal(response.status,200);
  assert.equal(captured.method,'GET');
  assert.equal(new URL(captured.url).pathname,'/v1/quotes/find');
  assert.equal(new URL(captured.url).searchParams.get('branch'),'Buster Build');
  assert.equal(new URL(captured.url).searchParams.get('number'),'Q-00000001');
  assert.equal(captured.headers.get('x-maliks-app'),'tills');
});
test('Exact lookup refuses unauthenticated public requests',async()=>{
  const response=await frontend.fetch(new Request('https://maliks-tills.example.test/api/quotes/find?branch=A&number=Q-1'),{APP_TYPE:'tills'});
  assert.equal(response.status,401);
});
