import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {cashupPreviewStatement,cashupForClient,CASHUP_MODE} from '../src/cashup-domain.mjs';

const sample={id:7,branch:'Buster Build',till_code:'TILL01',status:'CLOSED',opened_by_name:'Cashier',
  opened_at:'2026-11-12T08:00:00Z',closed_at:'2026-11-12T16:00:00Z',
  opening_float_cents:10000,counted_cash_cents:28000,preparation_count:2,
  prepared_cash_cents:20000,prepared_cash_received_cents:25000,prepared_change_cents:5000,
  prepared_card_cents:50000,prepared_eft_cents:10000};
const html=async app=>(await frontend.fetch(new Request('https://example.test/'),{APP_TYPE:app})).text();
test('Projection uses net PREPARED cash + float, never confirmed payments',()=>{
  const p=cashupForClient(sample);
  assert.equal(p.prepared_cash_cents,20000);
  assert.equal(p.projected_cash_cents,30000);
  assert.equal(p.provisional_variance_cents,-2000);
  assert.equal(p.signal,'PROVISIONAL_DIFFERENCE');
  assert.equal(p.verified,false);assert.equal(p.reconciled,false);assert.equal(p.receipts_confirmed,false);
  assert.equal(CASHUP_MODE,'PROVISIONAL_PREPARATIONS_ONLY');
});
test('Zero difference remains UNVERIFIED and is never labelled balanced',()=>{
  const p=cashupForClient({...sample,counted_cash_cents:30000});
  assert.equal(p.provisional_variance_cents,0);
  assert.equal(p.signal,'PROVISIONAL_ZERO_DIFFERENCE');
  assert.equal(p.reconciled,false);
});
test('No preparations cannot produce meaningful projected cash or variance',()=>{
  const p=cashupForClient({...sample,preparation_count:0,prepared_cash_cents:0,prepared_cash_received_cents:0,prepared_change_cents:0,prepared_card_cents:0,prepared_eft_cents:0});
  assert.equal(p.projected_cash_cents,null);assert.equal(p.provisional_variance_cents,null);
  assert.equal(p.signal,'NO_PREPARATIONS');
});
test('Open shift has no counted cash or provisional variance',()=>{
  const p=cashupForClient({...sample,status:'OPEN',counted_cash_cents:null,closed_at:null});
  assert.equal(p.signal,'SHIFT_OPEN');assert.equal(p.counted_cash_cents,null);
  assert.equal(p.provisional_variance_cents,null);
});
test('Rejects impossible, negative and inconsistent financial aggregates',()=>{
  for(const row of [{...sample,prepared_change_cents:6000},{...sample,prepared_cash_cents:-1},{...sample,opening_float_cents:NaN},{...sample,preparation_count:1.5},{...sample,status:'PAID'}])
    assert.throws(()=>cashupForClient(row));
});
test('Database preview is read-only, branch-scoped and bounded',()=>{
  const q=cashupPreviewStatement('Buster Build');assert.deepEqual(q.params,['Buster Build']);
  assert.match(q.sql,/WHERE lower\(branch\)=lower\(\?\) ORDER BY id DESC LIMIT 75/);
  assert.match(q.sql,/t.shift_id=s.id AND lower\(t.branch\)=lower\(s.branch\)/);
  assert.match(q.sql,/COUNT\(t.id\)/);
  assert.throws(()=>cashupPreviewStatement(''));
});
test('Cash Office alone displays Phase 7, even if Tills remains Phase 6',async()=>{
  const co=await html('cashoffice');
  for(const token of ['CASH OFFICE — VERIFICATION','Provisional cash-up & exceptions — NOT RECONCILED',
    '/api/cashup-preview','UNVERIFIED TENDER PREPARATIONS','Zero difference is NOT proof'])assert.ok(co.includes(token),token);
  assert.match(await html('tills'),/TILLS — PAYMENT WORKFLOW/);
  assert.match(await html('pos'),/SALES · QUOTATIONS/);
  assert.match(await html('dispatch'),/PAID INVOICE DISPATCH QUEUE/);
});
test('POS, Tills, Dispatch cannot query the provisional cash-up',async()=>{
  for(const kind of ['pos','tills','dispatch']){
    const env={APP_TYPE:kind,CORE:{fetch(){throw Error('must not forward');}}};
    for(const method of ['GET','POST']){
      const response=await frontend.fetch(new Request('https://x.test/api/cashup-preview',{method,headers:{'cf-access-jwt-assertion':'jwt',...(method==='POST'?{origin:'https://x.test'}:{})},body:method==='POST'?'{}':undefined}),env);
      assert.equal(response.status,method==='GET'?403:405);
    }
  }
});
test('Cash Office forwards GET to private Core and blocks POST',async()=>{
  let forwarded;const env={APP_TYPE:'cashoffice',CORE:{fetch:async request=>{forwarded=request;return Response.json({projections:[],verified:false,reconciled:false});}}};
  const url='https://cash.test/api/cashup-preview?branch=Buster%20Build';
  assert.equal((await frontend.fetch(new Request(url,{headers:{'cf-access-jwt-assertion':'jwt'}}),env)).status,200);
  assert.equal(new URL(forwarded.url).pathname,'/v1/cashup-preview');
  assert.equal(forwarded.headers.get('x-maliks-app'),'cashoffice');
  assert.equal((await frontend.fetch(new Request(url,{method:'POST',headers:{'cf-access-jwt-assertion':'jwt',origin:'https://cash.test'},body:'{}'}),env)).status,405);
});
test('Core contains strict Cash Office role and immutable read-only endpoint',async()=>{
  const {readFile}=await import('node:fs/promises');const {fileURLToPath}=await import('node:url');
  const text=await readFile(new URL('../src/core.mjs',import.meta.url),'utf8');
  assert.match(text,/context.app!==['"]cashoffice['"]/);
  assert.match(text,/listCashupPreviews/);
  assert.match(text,/path==='\/v1\/cashup-preview'&&req.method==='GET'/);
  assert.doesNotMatch(text,/path==='\/v1\/cashup-preview'&&req.method==='POST'/);
});
