import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteId, quoteNumber, quoteLookupStatement } from '../src/quote-domain.mjs';
import frontend from '../src/frontend.mjs';

// These all resolve to the existing quotation #1, not new records.
test('Cashier quotation lookup accepts pasted/lowercase/unhyphenated formats',()=>{
  for (const input of ['q000000001','Q000000001','Q-00000001','q-00000001','1','00000001',' Q000000001 ']){
    assert.equal(quoteId(input),1,input);
    const {sql,params}=quoteLookupStatement('tills','Buster Build','cashier@example.test',input);
    assert.match(sql,/id=\?/);
    assert.deepEqual(params,[1,'Buster Build']);
  }
  assert.equal(quoteNumber(quoteId('q000000001')),'Q-00000001');
});

test('invalid quotation input cannot bypass parameterized lookup',()=>{
  for(const input of ['',null,'q','Q-0','0','-1','Q-1 OR 1=1','Q-1.0','Q-1/2','Q-999999999999999999', 'Q--00000001']){
    assert.equal(quoteId(input),null,String(input));
  }
  assert.throws(()=>quoteLookupStatement('dispatch','Buster Build','cashier@example.test','q000000001'),/Not authorised/);
  assert.deepEqual(quoteLookupStatement('pos','Buster Build','sales@example.test','q000000001').params,[1,'Buster Build','sales@example.test']);
});

test('Tills shows canonical quotation format without creating a payment or dispatch release',async()=>{
  const r=await frontend.fetch(new Request('https://maliks-tills.example.test/'),{APP_TYPE:'tills'});
  assert.equal(r.status,200);
  const html=await r.text();
  assert.ok(html.includes('const digits=/^(?:Q-?)?(\\d{1,12})$/.exec(typed);'));
  assert.match(html,/field.value=number/);
  assert.match(html,/const number='Q-'\+String\(id\)\.padStart\(8,'0'\)/);
  assert.match(html,/NOT PAYMENT/);
});
