import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import { quoteListStatement, calculateQuote } from '../src/quote-domain.mjs';

const front=async app => {
  const res=await frontend.fetch(new Request('https://maliks-'+app+'.example.test/'),{APP_TYPE:app});
  assert.equal(res.status,200);
  return res.text();
};

test('POS shows line removal, VAT breakdown, recent quotations and retry safeguard',async()=>{
  const page=await front('pos');
  for (const expected of ['My recent quotations','Remove','Net amount (excl. VAT)','VAT included (15%)',
    'Retry same quotation','release-pending','request_id:crypto.randomUUID()','printQuote(row)']) {
    assert.ok(page.includes(expected),`Missing ${expected}`);
  }
  assert.match(page,/let branch='',basket=\[\],pendingQuote=null/);
  assert.match(page,/body:JSON\.stringify\(pendingQuote\)/);
  assert.doesNotMatch(page,/issue paid invoice|mark as paid/i);
});

test('Cash Office and Tills include read-only quotation details and search',async()=>{
  for(const app of ['cashoffice','tills']){
    const page=await front(app);
    assert.match(page,/Filter by quote number, customer or contact/);
    assert.match(page,/Quotation records alone/);
    assert.match(page,/quoteDetails\(row\)/);
    assert.doesNotMatch(page,/Confirm payment and print paid invoice/);
  }
});

test('Dispatch queue accepts only confirmed payment invoices without stock posting',async()=>{
  const page=await front('dispatch');
  assert.match(page,/Confirmed paid invoices appear in the dispatch queue/);
  assert.match(page,/PAID INVOICE DISPATCH QUEUE/);
});

test('POS quotation history statement is scoped to branch AND current staff email',()=>{
  const {sql,params}=quoteListStatement('pos','Buster Build','admin@example.test');
  assert.match(sql,/lower\(branch\)=lower\(\?\)/);
  assert.match(sql,/lower\(submitted_by_email\)=lower\(\?\)/);
  assert.deepEqual(params,['Buster Build','admin@example.test']);
  assert.match(sql,/LIMIT 50/);
});

test('Cash Office and Tills queues cannot list other branches; dispatch cannot list',()=>{
  for(const app of ['tills','cashoffice']){
    const {sql,params}=quoteListStatement(app,'Active Build Carletonville','irrelevant@example.test');
    assert.match(sql,/lower\(branch\)=lower\(\?\)/);
    assert.doesNotMatch(sql,/submitted_by_email/);
    assert.deepEqual(params,['Active Build Carletonville']);
  }
  assert.throws(()=>quoteListStatement('dispatch','Branch','someone'),/Not authorised/);
  assert.throws(()=>quoteListStatement('pos','Branch',''),/Current user required/);
});

test('VAT inclusive quote breakdown adds to exact total',()=>{
  const receipt=calculateQuote([{product_id:1,code:'A',name:'Tile',unit:'box',price_cents:39999,quantity:2}]);
  assert.equal(receipt.total_cents,79998);
  assert.equal(receipt.vat_cents,Math.round(79998*15/115));
  assert.equal(receipt.total_cents,receipt.net_cents+receipt.vat_cents);
});
