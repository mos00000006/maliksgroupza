import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {validateRequestId,validateTillCode,validateMoneyCents,validateCloseNote,shiftListStatement} from '../src/shift-domain.mjs';
const ID='123e4567-e89b-42d3-a456-426614174000';
const page=async app=>(await frontend.fetch(new Request('https://maliks-'+app+'.example.test/'),{APP_TYPE:app})).text();

test('shift data helpers reject invalid identifiers, floats and till codes',()=>{
  assert.equal(validateRequestId(ID),ID);
  for(const invalid of ['','user supplied','123e4567-e89b-12d3-a456-426614174000'])assert.throws(()=>validateRequestId(invalid));
  assert.equal(validateTillCode('till_01'),'TILL_01');
  for(const invalid of ['a b','A'.repeat(21),"X';DROP TABLE x;"])assert.throws(()=>validateTillCode(invalid));
  assert.equal(validateMoneyCents(25000),25000);
  for(const invalid of [-1,1.5,'100',NaN,100000001])assert.throws(()=>validateMoneyCents(invalid));
  assert.throws(()=>validateCloseNote('a'.repeat(401)));
});
test('cashier shift list never leaks another cashier shifts',()=>{
  const cashier=shiftListStatement('tills','Buster Build','cashier@test.example');
  assert.match(cashier.sql,/lower\(branch\)=lower\(\?\)/);
  assert.match(cashier.sql,/lower\(opened_by_email\)=lower\(\?\)/);
  assert.deepEqual(cashier.params,['Buster Build','cashier@test.example']);
  const cashoffice=shiftListStatement('cashoffice','Buster Build','cashier@test.example');
  assert.deepEqual(cashoffice.params,['Buster Build']);
  assert.throws(()=>shiftListStatement('pos','Buster Build','sales@example.com'));
  assert.throws(()=>shiftListStatement('dispatch','Buster Build','driver@example.com'));
});
test('tills displays phase4 shift open/close controls and no payment submission',async()=>{
  const html=await page('tills');
  for(const label of ['PHASE 4 — TILL SHIFTS','My Till Shift Register','Opening float (R)','Closing cash count (R)',
    'Open my till shift','Close my shift','NOT A LIVE PAYMENT SYSTEM','/api/till-shifts/open','/api/till-shifts/close',
    'Find quotation by exact number','Cash change calculator — TRAINING ONLY','(?:0|[1-9]\\d{0,7})'])assert.ok(html.includes(label),label);
  assert.doesNotMatch(html,/Issue tax invoice|Confirm payment and print paid invoice/);
});
test('Cash Office displays read-only shift register, not cashier write forms by app role',async()=>{
  const html=await page('cashoffice');
  assert.match(html,/PHASE 5 — CASH OFFICE REVIEWS/);
  assert.match(html,/Cash Office — Shift Review & Exceptions/);
  assert.match(html,/Cash Office view is read-only/);
  assert.match(html,/Open \/ close must be performed by the signed-in cashier/);
});
test('POS release unchanged and dispatch still isolated',async()=>{
  assert.match(await page('pos'),/PHASE 2 — QUOTATION RELEASE/);
  assert.match(await page('dispatch'),/PHASE 1 — CONTROLLED RELEASE/);
});
test('unauthenticated shift request rejected and cross-origin write denied',async()=>{
  const env={APP_TYPE:'tills',CORE:{fetch:()=>{throw Error('should not reach core');}}};
  const noJwt=await frontend.fetch(new Request('https://tills.example.test/api/till-shifts?branch=X'),env);
  assert.equal(noJwt.status,401);
  const badOrigin=await frontend.fetch(new Request('https://tills.example.test/api/till-shifts/open',{method:'POST',headers:{origin:'https://bad.example'},body:'{}'}),env);
  assert.equal(badOrigin.status,403);
});
test('only declared shift routes forward through fixed Tills app identity',async()=>{
  let received;const env={APP_TYPE:'tills',CORE:{fetch:async req=>{received=req;return Response.json({shifts:[]});}}};
  const request=new Request('https://tills.example.test/api/till-shifts?branch=Buster%20Build',{headers:{'cf-access-jwt-assertion':'test-jwt'}});
  const response=await frontend.fetch(request,env);
  assert.equal(response.status,200);
  assert.equal(received.headers.get('x-maliks-app'),'tills');
  assert.equal(new URL(received.url).pathname,'/v1/till-shifts');
});
test('cash office cannot POST from a browser and server is department protected',async()=>{
  const env={APP_TYPE:'cashoffice',CORE:{fetch:async()=>Response.json({error:'Only Tills can open a cashier shift.'},{status:403})}};
  const req=new Request('https://cashoffice.example.test/api/till-shifts/open',{method:'POST',headers:{origin:'https://cashoffice.example.test','cf-access-jwt-assertion':'test'},body:'{}'});
  assert.equal((await frontend.fetch(req,env)).status,403);
});
