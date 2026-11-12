import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {
  REVIEW_DECISIONS,validateReviewDecision,validateReviewNote,latestReviewsStatement,reviewHistoryStatement,reviewForClient,
} from '../src/review-domain.mjs';
const goodId='123e4567-e89b-42d3-a456-426614174000';
const page=async app=>(await frontend.fetch(new Request(`https://${app}.example.test/`),{APP_TYPE:app})).text();

test('Review types are constrained and follow-up flags require a useful reason',()=>{
  assert.deepEqual(REVIEW_DECISIONS,['CHECKED_DECLARATION','FLAGGED_FOR_FOLLOWUP']);
  assert.equal(validateReviewDecision('CHECKED_DECLARATION'),'CHECKED_DECLARATION');
  assert.throws(()=>validateReviewDecision('APPROVED_CASHUP'));
  assert.equal(validateReviewNote(' verified fields ','CHECKED_DECLARATION'),'verified fields');
  assert.throws(()=>validateReviewNote('short','FLAGGED_FOR_FOLLOWUP'));
  assert.equal(validateReviewNote('Count needs review','FLAGGED_FOR_FOLLOWUP'),'Count needs review');
  assert.throws(()=>validateReviewNote('A'.repeat(401),'CHECKED_DECLARATION'));
  assert.throws(()=>validateReviewNote('NUL\0','CHECKED_DECLARATION'));
  assert.throws(()=>validateReviewNote(null,'CHECKED_DECLARATION'));
});
test('Recent statuses and history queries are branch-scoped, parameterized and bounded',()=>{
  const latest=latestReviewsStatement('Buster Build',[1,2,3]);
  assert.deepEqual(latest.params,['Buster Build',1,2,3]);
  assert.match(latest.sql,/lower\(branch\)=lower\(\?\)/);
  assert.match(latest.sql,/MAX\(id\)/);
  assert.deepEqual(reviewHistoryStatement('Buster Build',7).params,['Buster Build',7]);
  assert.match(reviewHistoryStatement('Buster Build',7).sql,/LIMIT 50/);
  assert.throws(()=>latestReviewsStatement('Buster Build',[]));
  assert.throws(()=>latestReviewsStatement('Buster Build',Array.from({length:76},(_,i)=>i+1)));
  assert.throws(()=>reviewHistoryStatement('',4));
  assert.deepEqual(reviewForClient({id:2,shift_id:3,decision:'FLAGGED_FOR_FOLLOWUP',note:'Count differs',reviewed_by_name:'Bob',created_at:'time'}),{
    id:2,shift_id:3,decision:'FLAGGED_FOR_FOLLOWUP',note:'Count differs',reviewed_by_name:'Bob',created_at:'time'
  });
});
test('Cash Office retains phase 5 review and audit controls, and disclaims reconciliation',async()=>{
  const html=await page('cashoffice');
  for(const text of ['PHASE 8 — PAYMENT EVIDENCE CONTROL','Shift Review & Exceptions','awaiting review','flagged for follow-up',
    'Declaration checked (not reconciled)','Record review (audit history)','Review history','/api/till-reviews','review_status',
    'This review does not confirm payments'])assert.ok(html.includes(text),text);
  assert.match(html,/No sales, deposits, invoices or stock balances are posted/);
});
test('Tills displays Phase 6 preparation but no financial payment submission',async()=>{
  const html=await page('tills');
  assert.match(html,/PHASE 6 — TENDER PREPARATION/);
  assert.match(html,/Cash change calculator — TRAINING ONLY/);
  assert.doesNotMatch(html,/Confirm payment and print receipt|Record payment/);
});
test('Only Cash Office can call the review endpoint; cross-origin writes refused',async()=>{
  const path='https://app.example.test/api/till-reviews';
  for(const app of ['tills','pos','dispatch']){
    const env={APP_TYPE:app,CORE:{fetch(){throw Error('should never forward');}}};
    const response=await frontend.fetch(new Request(path,{headers:{'cf-access-jwt-assertion':'jwt'}}),env);
    assert.equal(response.status,403);
    const post=await frontend.fetch(new Request(path,{method:'POST',headers:{origin:'https://app.example.test','cf-access-jwt-assertion':'jwt'},body:'{}'}),env);
    assert.equal(post.status,403);
  }
  const env={APP_TYPE:'cashoffice',CORE:{fetch(){throw Error('should never forward');}}};
  const denied=await frontend.fetch(new Request(path,{method:'POST',headers:{origin:'https://evil.test','cf-access-jwt-assertion':'jwt'},body:'{}'}),env);
  assert.equal(denied.status,403);
});
test('Review write forwards only same-origin Cash Office JWT and correct fixed route',async()=>{
  let passed;const env={APP_TYPE:'cashoffice',CORE:{fetch:async request=>{passed=request;return Response.json({review:{id:1}});}}};
  const request=new Request('https://cashoffice.example.test/api/till-reviews',{
    method:'POST',headers:{origin:'https://cashoffice.example.test','cf-access-jwt-assertion':'jwt'},
    body:JSON.stringify({request_id:goodId,branch:'Buster Build',shift_id:1,decision:'CHECKED_DECLARATION',note:''}),
  });
  const result=await frontend.fetch(request,env);
  assert.equal(result.status,200);
  assert.equal(passed.headers.get('x-maliks-app'),'cashoffice');
  assert.equal(passed.headers.get('origin'),'https://cashoffice.example.test');
  assert.equal(new URL(passed.url).pathname,'/v1/till-reviews');
});
test('No unsafe cash register edits from Cash Office',async()=>{
  const env={APP_TYPE:'cashoffice',CORE:{fetch(){throw Error('never forward');}}};
  const req=new Request('https://cashoffice.example.test/api/till-shifts/close',{method:'POST',headers:{origin:'https://cashoffice.example.test','cf-access-jwt-assertion':'jwt'},body:'{}'});
  assert.equal((await frontend.fetch(req,env)).status,403);
});
