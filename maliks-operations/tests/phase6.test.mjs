import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {
  validateTenderPreparation, tenderListStatement, tenderForClient,TENDER_STATE,
} from '../src/tender-domain.mjs';
const valid={request_id:'123e4567-e89b-42d3-a456-426614174000',quotation_number:'Q-00000001',shift_id:4,
  cash_applied_cents:4000,cash_received_cents:5000,card_cents:7000,card_reference:'TERM-4321',eft_cents:500,
  eft_reference:'BANK555',branch:'Buster Build'};
const read=async app=>(await frontend.fetch(new Request('https://test.example/'),{APP_TYPE:app})).text();

test('Allows an exact 3-way split with change and immutable preparation state',()=>{
  const p=validateTenderPreparation(valid,11500);
  assert.equal(p.cash_applied_cents+p.card_cents+p.eft_cents,11500);
  assert.equal(p.change_cents,1000);
  assert.equal(p.quotation_id,1);
  assert.equal(TENDER_STATE,'PREPARATION_ONLY');
});
test('Refuses mismatch, negative/decimal cents and excessive funds',()=>{
  for(const payload of [{cash_applied_cents:3999},{card_cents:-1},{card_cents:7000.5},{cash_received_cents:2000},{cash_applied_cents:0,cash_received_cents:5000,card_cents:11000}])
    assert.throws(()=>validateTenderPreparation({...valid,...payload},11500));
  assert.throws(()=>validateTenderPreparation(valid,0));
  assert.throws(()=>validateTenderPreparation(valid,11501));
});
test('Requires card and EFT references, prohibits card numbers',()=>{
  assert.throws(()=>validateTenderPreparation({...valid,card_reference:''},11500));
  assert.throws(()=>validateTenderPreparation({...valid,eft_reference:'x'},11500));
  assert.throws(()=>validateTenderPreparation({...valid,card_reference:'4111 1111 1111 1111'},11500));
  assert.throws(()=>validateTenderPreparation({...valid,card_cents:0,cash_applied_cents:11000},11500));
  assert.throws(()=>validateTenderPreparation({...valid,card_reference:'bad\nref'},11500));
});
test('All-cash and no-cash split are permitted when exact',()=>{
  const allCash={...valid,cash_applied_cents:11500,cash_received_cents:12000,card_cents:0,card_reference:'',eft_cents:0,eft_reference:''};
  assert.equal(validateTenderPreparation(allCash,11500).change_cents,500);
  const noCash={...valid,cash_applied_cents:0,cash_received_cents:0,card_cents:11000,eft_cents:500};
  assert.equal(validateTenderPreparation(noCash,11500).change_cents,0);
});
test('Lists are scoped to assigned branch and cashier or Cash Office',()=>{
  const own=tenderListStatement('tills','Buster Build','cashier@test.local');
  assert.deepEqual(own.params,['Buster Build','cashier@test.local']);
  assert.match(own.sql,/lower\(prepared_by_email\)=lower\(\?\)/);
  const co=tenderListStatement('cashoffice','Buster Build','reviewer@test.local');
  assert.deepEqual(co.params,['Buster Build']);
  assert.match(co.sql,/LIMIT 75/);
  assert.throws(()=>tenderListStatement('pos','Buster Build','cashier@test.local'));
  assert.throws(()=>tenderListStatement('tills','Buster Build',''));
});
test('Browser marks preparation as NOT PAID, not a receipt or dispatch release',async()=>{
  const tills=await read('tills');
  for(const text of ['PHASE 6 — TENDER PREPARATION','NOT A LIVE PAYMENT SYSTEM','Save preparation only — no payment',
      'Card portion (R)','EFT portion (R)','/api/tender-preparations','No stock or dispatch release'])
    assert.ok(tills.includes(text),text);
  const co=await read('cashoffice');
  assert.match(co,/PHASE 7 — PROVISIONAL CASH-UP/);
  assert.match(co,/Cash Office — Tender preparations \(read-only\)/);
});
test('POS and Dispatch cannot access tender preparations even with JWT header',async()=>{
  const path='https://example.test/api/tender-preparations';
  for(const app of ['pos','dispatch']){
    const env={APP_TYPE:app,CORE:{fetch:()=>{throw Error('Cannot forward');}}};
    for(const method of ['GET','POST']){
      const req=new Request(path,{method,headers:{'cf-access-jwt-assertion':'jwt',...(method==='POST'?{origin:'https://example.test'}:{})},body:method==='POST'?'{}':undefined});
      assert.equal((await frontend.fetch(req,env)).status,403);
    }
  }
});
test('Cash Office cannot POST a tender preparation',async()=>{
  const env={APP_TYPE:'cashoffice',CORE:{fetch:()=>{throw Error('Cannot forward');}}};
  const req=new Request('https://example.test/api/tender-preparations',{method:'POST',headers:{origin:'https://example.test','cf-access-jwt-assertion':'jwt'},body:'{}'});
  assert.equal((await frontend.fetch(req,env)).status,403);
});
test('Tills tender write forwards only to fixed private Core path and same origin',async()=>{
  let forwarded;const env={APP_TYPE:'tills',CORE:{fetch:async request=>{forwarded=request;return Response.json({payment_recorded:false});}}};
  const url='https://tills.example.test/api/tender-preparations';
  const req=new Request(url,{method:'POST',headers:{origin:'https://tills.example.test','cf-access-jwt-assertion':'jwt'},body:JSON.stringify(valid)});
  assert.equal((await frontend.fetch(req,env)).status,200);
  assert.equal(new URL(forwarded.url).pathname,'/v1/tender-preparations');
  assert.equal(forwarded.headers.get('x-maliks-app'),'tills');
  assert.equal(forwarded.headers.get('origin'),'https://tills.example.test');
  const cross=new Request(url,{method:'POST',headers:{origin:'https://evil.example','cf-access-jwt-assertion':'jwt'},body:'{}'});
  assert.equal((await frontend.fetch(cross,env)).status,403);
});
test('Client records show only status PREPARATION_ONLY',()=>{
  const row={id:4,quotation_number:'Q-00000001',branch:'Buster Build',shift_id:9,
    prepared_by_name:'Staff',status:'PREPARATION_ONLY',created_at:'2026-11-12',cash_applied_cents:5000,
    cash_received_cents:6000,card_cents:6000,card_reference:'T123',eft_cents:500,eft_reference:'E123',
    change_cents:1000,quote_total_cents:11500};
  assert.equal(tenderForClient(row).status,'PREPARATION_ONLY');
  assert.equal(tenderForClient(row).number,'Q-00000001');
});
