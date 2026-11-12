import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {EVIDENCE_MODE,validateEvidenceInput,evidenceListStatement,
        evidenceHistoryStatement,evidenceForClient} from '../src/payment-evidence-domain.mjs';
const uuid='123e4567-e89b-42d3-a456-426614174000';
const valid={request_id:uuid,branch:'Buster Build',preparation_id:23,method:'CARD',
  decision:'DOCUMENT_CHECKED',source:'TERMINAL_REPORT',source_reference:'TERM-SETTLE-48',
  observed_amount_cents:45000,note:'Compared against terminal close-out report at end of shift.'};
const render=async app=>(await frontend.fetch(new Request('https://test.example/'),{APP_TYPE:app})).text();

test('Phase 8 records manual evidence, not verified payment or paid status',()=>{
  const v=validateEvidenceInput(valid);
  assert.equal(v.decision,'DOCUMENT_CHECKED');assert.equal(v.method,'CARD');
  assert.equal(v.observed_amount_cents,45000);
  assert.equal(EVIDENCE_MODE,'MANUAL_EVIDENCE_OBSERVATIONS_ONLY');
});
test('Rejects invalid methods, approval words and bad source combinations',()=>{
  for(const change of [{method:'CASH'},{method:'WIRE'},{decision:'PAID'},
   {source:'NOT_AVAILABLE'},{source:'BANK_STATEMENT'},{method:'EFT',source:'TERMINAL_REPORT'}]){
    assert.throws(()=>validateEvidenceInput({...valid,...change}));
  }
  assert.equal(validateEvidenceInput({...valid,decision:'FOLLOW_UP_REQUIRED',source:'NOT_AVAILABLE',source_reference:''}).source,'NOT_AVAILABLE');
  assert.equal(validateEvidenceInput({...valid,method:'EFT',source:'BANK_STATEMENT'}).method,'EFT');
});
test('Rejects personal payment card numbers and sensitive malformed text',()=>{
  for(const change of [{source_reference:'4111 1111 1111 1111'},
    {note:'Card 4111 1111 1111 1111 was in report'},
    {note:'short'}, {note:'x'.repeat(401)},{source_reference:'x'},
    {source_reference:'BAD\nREF'},{observed_amount_cents:-1},
    {observed_amount_cents:10.5},{preparation_id:0},{request_id:'not-uuid'}])
    assert.throws(()=>validateEvidenceInput({...valid,...change}));
});
test('Branch queries are SQL-parameterized and bounded, observations append-only',()=>{
  const q=evidenceListStatement('Buster Build');
  assert.deepEqual(q.params,['Buster Build']);
  assert.match(q.sql,/WHERE lower\(branch\)=lower\(\?\) ORDER BY id DESC LIMIT 75/);
  assert.match(q.sql,/SELECT MAX\(o.id\)/);
  assert.match(q.sql,/maliks_payment_evidence_observations/);
  const history=evidenceHistoryStatement('Buster Build',23,'CARD');
  assert.deepEqual(history.params,['Buster Build',23,'CARD']);
  assert.match(history.sql,/ORDER BY id DESC LIMIT 50/);
  assert.throws(()=>evidenceListStatement(''));
  assert.throws(()=>evidenceHistoryStatement('Buster Build',23,'CASH'));
  assert.throws(()=>evidenceHistoryStatement('Buster Build',0,'CARD'));
});
test('Evidence client rows cannot claim payment, settlement, invoices or dispatch',()=>{
  const v=evidenceForClient({preparation_id:2,quotation_number:'Q-00000002',method:'CARD',
    expected_amount_cents:15000,observation_id:11,decision:'DOCUMENT_CHECKED',
    observed_amount_cents:15000,source_reference:'SETTLE-11'});
  for(const key of ['payment_recorded','verified_by_bank','invoice_created','dispatch_released'])
    assert.equal(v[key],false);
  assert.equal(v.decision,'DOCUMENT_CHECKED');
  assert.equal(evidenceForClient({preparation_id:3,method:'EFT',expected_amount_cents:1200}).decision,'NO_OBSERVATION');
});
test('Cash Office new UI retains prior Phase 7 worksheet and review functionality',async()=>{
  const co=await render('cashoffice');
  for(const marker of ['CASH OFFICE — VERIFICATION','Payment evidence & exceptions — NOT SETTLED',
     'Provisional cash-up & exceptions — NOT RECONCILED','Cash Office — Shift Review & Exceptions',
     '/api/payment-evidence/history','NOT PAID','/api/cashup-preview','/api/till-reviews',
     'MANUAL DOCUMENT REVIEW ONLY'])assert.ok(co.includes(marker),marker);
  assert.match(await render('tills'),/TILLS — PAYMENT WORKFLOW/);
  assert.match(await render('pos'),/PHASE 2 — QUOTATION RELEASE/);
  assert.match(await render('dispatch'),/PAID INVOICE DISPATCH QUEUE/);
});
test('Only Cash Office can read or post payment evidence',async()=>{
  for(const app of ['pos','tills','dispatch']){
    const env={APP_TYPE:app,CORE:{fetch(){throw Error('No forwarding!');}}};
    for(const path of ['/api/payment-evidence','/api/payment-evidence/history']){
      const res=await frontend.fetch(new Request('https://example.test'+path,{headers:{'cf-access-jwt-assertion':'jwt'}}),env);
      assert.equal(res.status,403);
    }
    const post=await frontend.fetch(new Request('https://example.test/api/payment-evidence',{
      method:'POST',headers:{origin:'https://example.test','cf-access-jwt-assertion':'jwt'},body:'{}'}),env);
    assert.equal(post.status,403);
  }
});
test('Only POST observation is permitted, never POST audit history',async()=>{
  const env={APP_TYPE:'cashoffice',CORE:{fetch(){throw Error('Must not forward.');}}};
  const res=await frontend.fetch(new Request('https://x.test/api/payment-evidence/history',{
    method:'POST',headers:{origin:'https://x.test','cf-access-jwt-assertion':'jwt'},body:'{}'}),env);
  assert.equal(res.status,405);
});
test('Cash Office forwards only to private Core and rejects cross-site writes',async()=>{
  let forwarded;
  const env={APP_TYPE:'cashoffice',CORE:{fetch:async request=>{forwarded=request;return Response.json({paid:false,bank_verified:false,observations:[]});}}};
  const get=new Request('https://cash.test/api/payment-evidence?branch=Buster%20Build',{headers:{'cf-access-jwt-assertion':'jwt'}});
  assert.equal((await frontend.fetch(get,env)).status,200);
  assert.equal(new URL(forwarded.url).pathname,'/v1/payment-evidence');
  assert.equal(forwarded.headers.get('x-maliks-app'),'cashoffice');
  const ok=new Request('https://cash.test/api/payment-evidence',{method:'POST',headers:{origin:'https://cash.test',
    'cf-access-jwt-assertion':'jwt','content-type':'application/json'},body:JSON.stringify(valid)});
  assert.equal((await frontend.fetch(ok,env)).status,200);
  assert.equal(new URL(forwarded.url).pathname,'/v1/payment-evidence');
  assert.equal(forwarded.headers.get('origin'),'https://cash.test');
  const bad=new Request('https://cash.test/api/payment-evidence',{method:'POST',headers:{origin:'https://evil.test',
    'cf-access-jwt-assertion':'jwt'},body:'{}'});
  assert.equal((await frontend.fetch(bad,env)).status,403);
});
test('Core endpoints require Cash Office, cross-branch guard and other employee',async()=>{
  const {readFile}=await import('node:fs/promises');
  const core=await readFile(new URL('../src/core.mjs',import.meta.url),'utf8');
  assert.match(core,/context.app!=='cashoffice'/);
  assert.match(core,/matchingBranch\(context.branches,body.branch\)/);
  assert.match(core,/prep.prepared_by_email.toLowerCase\(\)===email/);
  assert.match(core,/lower\(p.prepared_by_email\)<>lower\(\?\)/);
  assert.match(core,/INSERT OR IGNORE INTO maliks_payment_evidence_observations/);
  assert.match(core,/path==='\/v1\/payment-evidence'&&req.method==='POST'/);
  assert.doesNotMatch(core,/UPDATE maliks_payment_evidence_observations|DELETE FROM maliks_payment_evidence_observations/);
});

test('Rendered browser script preserves digit and decimal regex escapes',async()=>{
  const page=await render('cashoffice');
  const script=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.ok(script.includes(String.raw`/^(?:Q-?)?(\d{1,12})$/`),'Quotation lookup requires a numeric ID');
  assert.ok(script.includes(String.raw`/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/`),'Cash preview input uses strict decimals');
  assert.ok(script.includes(String.raw`/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/`),'Phase 6 input retains strict decimals');
});

test('Phase 8 D1 migration is append-only and safe to rerun',async()=>{
  const {readFile}=await import('node:fs/promises');
  const sql=await readFile(new URL('../sql/phase8_payment_evidence.sql',import.meta.url),'utf8');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS maliks_payment_evidence_observations/);
  assert.match(sql,/UNIQUE/);
  assert.match(sql,/CHECK\(status='OBSERVATION_ONLY'\)/);
  assert.doesNotMatch(sql,/DROP TABLE|ALTER TABLE|UPDATE\s+\w+|DELETE\s+FROM/i);
});
