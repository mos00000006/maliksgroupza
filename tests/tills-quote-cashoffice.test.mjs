import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {quoteNumber,quoteId,validateQuoteLines,calculateQuote,canReviewCashOffice,canonicalQuotePayload} from '../app/api/tills/quotes/quote-domain.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const file=(path)=>readFileSync(join(here,'..',path),'utf8');

test('quotation numbers are stable, unique by primary key and searchable',()=>{
  assert.equal(quoteNumber(1),'Q-00000001');
  assert.equal(quoteNumber(122),'Q-00000122');
  assert.equal(quoteId('Q-00000122'),122);
  assert.equal(quoteId('123'),null);
  assert.throws(()=>quoteNumber(0));
});
test('quotation line validation rejects repeats, missing prices and invalid quantity',()=>{
  const good=[{product_id:3,quantity:1.25,expected_price_cents:45999},{product_id:2,quantity:2,expected_price_cents:1000}];
  assert.deepEqual(validateQuoteLines(good).map(x=>x.product_id),[2,3]);
  assert.throws(()=>validateQuoteLines([]));
  assert.throws(()=>validateQuoteLines([...good,good[0]]));
  assert.throws(()=>validateQuoteLines([{product_id:3,quantity:0,expected_price_cents:100}]));
  assert.throws(()=>validateQuoteLines([{product_id:3,quantity:1.0001,expected_price_cents:100}]));
  assert.throws(()=>validateQuoteLines([{product_id:3,quantity:1,expected_price_cents:0}]));
});
test('cash office uses integer VAT and captures line price snapshots',()=>{
  const result=calculateQuote([
    {product_id:1,code:'CEMENT',name:'Cement bag',unit:'each',category:'Cement',price_cents:11500,quantity:2},
    {product_id:2,code:'TILE',name:'Tiles',unit:'box',category:'Tiles',price_cents:59995,quantity:1.5},
  ]);
  assert.equal(result.total_cents,112993); // 23000 + round(89992.5)
  assert.equal(result.vat_cents,Math.round(112993*15/115));
  assert.equal(result.net_cents+result.vat_cents,result.total_cents);
  assert.equal(result.lines[1].line_total_cents,89993);
});
test('Cash Office queue is not visible to sales-only and read-only roles',()=>{
  assert.equal(canReviewCashOffice('Sales / Tills','Assigned workspace'),false);
  assert.equal(canReviewCashOffice('Read only','Full company'),false);
  assert.equal(canReviewCashOffice('Executive / EXCO','Assigned workspace'),false);
  assert.equal(canReviewCashOffice('Executive / EXCO','Full company'),true);
  assert.equal(canReviewCashOffice('Store Manager','Assigned workspace'),true);
});
test('payload hash changes when customer or quotation lines change',()=>{
  const a=canonicalQuotePayload('PowerBuild','Walk-in customer','','',[{product_id:1,quantity:1,expected_price_cents:100}]);
  const b=canonicalQuotePayload('PowerBuild','Walk-in customer','','',[{product_id:1,quantity:2,expected_price_cents:100}]);
  assert.notEqual(a,b);
});
test('edge policy allows only quotation submission for restricted sales staff',()=>{
  const policy=file('app/lib/tills-route-policy.ts');
  assert.match(policy,/pathname === "\/api\/tills\/quotes" && method === "POST"/);
  assert.doesNotMatch(policy,/pathname === "\/api\/tills\/quotes" && method === "PATCH"/);
});
test('hub API validates store, session, server pricing and duplicate request IDs',()=>{
  const api=file('app/api/tills/quotes/route.ts');
  assert.match(api,/await tillMember\(\)/);
  assert.match(api,/permittedBranch\(allowed/);
  assert.match(api,/trustedOrigin\(req\)/);
  assert.match(api,/request_id TEXT NOT NULL UNIQUE/);
  assert.match(api,/payloadHash/);
  assert.match(api,/product.price_cents!==line.expected_price_cents/);
  assert.match(api,/INSERT OR IGNORE INTO till_quotation_submissions/);
  assert.match(api,/status='REVIEWED'/);
  assert.doesNotMatch(api,/INSERT INTO stock_ledger|payment_amount|post_invoice/);
});
test('checkout sends a real quotation reference, cashier cannot open cash office queue',()=>{
  const checkout=file('app/tills/till-checkout.tsx');
  assert.match(checkout,/Send quotation to Cash Office/);
  assert.match(checkout,/setSentQuote\(data.quotation/);
  assert.match(checkout,/Q-00000001/);
  assert.match(checkout,/!isTillOnly\|\|!\["cashoffice","reports","settings"\]/);
});
