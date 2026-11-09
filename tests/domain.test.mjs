import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allowPosRole,isManager,allowedBranches,getBranch,brandForBranch,
  quoteNumber,quoteId,validatedLines,calculateQuote,canonicalQuotePayload,productFilter,serialQuote
} from '../src/domain.mjs';

test('role boundaries: sales, management and unrelated roles',()=>{
  assert.equal(allowPosRole('Sales / Tills','Assigned workspace'),true);
  assert.equal(allowPosRole('Store Manager','Assigned workspace'),true);
  assert.equal(allowPosRole('Executive / EXCO','Full company'),true);
  assert.equal(allowPosRole('Executive / EXCO','Assigned workspace'),false);
  assert.equal(allowPosRole('Buyer','Full company'),false);
  assert.equal(allowPosRole('Viewer','Read only'),false);
  assert.equal(isManager('Sales / Tills','Assigned workspace'),false);
  assert.equal(isManager('Store Manager','Assigned workspace'),true);
});

test('branch permissions respect explicit workspace and single workspace scope',()=>{
  const branches=['Store A','Store B','Store C'];
  const m={role:'Sales / Tills',access_scope:'Assigned workspace',department:'Store C',workspace_access:'["Store B","Store A"]'};
  assert.deepEqual(allowedBranches(m,branches),['Store B']);
  assert.equal(getBranch(allowedBranches(m,branches),'Store A'),null);
  assert.equal(getBranch(allowedBranches(m,branches),'store b'),'Store B');
  assert.deepEqual(allowedBranches({role:'Store Manager',access_scope:'Selected workspaces',department:'',workspace_access:'["Store A","Store C"]'},branches),['Store A','Store C']);
  assert.deepEqual(allowedBranches({role:'Owner / Admin'},branches),branches);
  assert.deepEqual(allowedBranches({role:'Sales / Tills',access_scope:'Assigned workspace',workspace_access:'NOT JSON',department:'Store C'},branches),['Store C']);
  assert.equal(getBranch(['A','B'],null),null);
});

test('brand selection and safe quote reference formats',()=>{
  assert.equal(brandForBranch('Buster Build Protea Glen'),'busterbuild');
  assert.equal(brandForBranch('PowerBuild Central'),'powerbuild');
  assert.equal(quoteNumber(15),'Q-00000015');
  assert.equal(quoteId('q-00000015'),15);
  assert.equal(quoteId('INV-1'),null);
  assert.equal(quoteId('Q-0'),null);
  assert.throws(()=>quoteNumber(0));
});

test('server-side quantity validations reject negatives, duplicate lines and price injection',()=>{
  const valid=validatedLines([{product_id:2,quantity:2.5,expected_price_cents:11500},{product_id:1,quantity:1,expected_price_cents:2300}]);
  assert.deepEqual(valid.map(x=>x.product_id),[1,2]);
  assert.throws(()=>validatedLines([{product_id:1,quantity:0,expected_price_cents:100}]));
  assert.throws(()=>validatedLines([{product_id:1,quantity:1.0001,expected_price_cents:100}]));
  assert.throws(()=>validatedLines([{product_id:1,quantity:1,expected_price_cents:0}]));
  assert.throws(()=>validatedLines([{product_id:1,quantity:1,expected_price_cents:100},{product_id:1,quantity:2,expected_price_cents:100}]));
  assert.throws(()=>validatedLines([{product_id:'bad',quantity:1,expected_price_cents:100}]));
});

test('VAT is extracted from VAT-inclusive totals in integer cents',()=>{
  const r=calculateQuote([{product_id:1,code:'CEM-1',name:'Cement',price_cents:11500,quantity:2}]);
  assert.equal(r.total_cents,23000);
  assert.equal(r.net_cents,20000);
  assert.equal(r.vat_cents,3000);
  assert.equal(r.lines[0].line_total_cents,23000);
  assert.equal(r.total_cents,r.net_cents+r.vat_cents);
  assert.throws(()=>calculateQuote([{price_cents:999999999,quantity:5}]));
});

test('retry identity depends on canonical branch/customer/notes/lines',()=>{
  const l=validatedLines([{product_id:3,quantity:1,expected_price_cents:1555}]);
  const a=canonicalQuotePayload('Store A','Customer','','',l);
  const b=canonicalQuotePayload('Store A','Customer','','',l);
  const c=canonicalQuotePayload('Store B','Customer','','',l);
  assert.equal(a,b);assert.notEqual(a,c);
});

test('SQL wildcard search characters are escaped',()=>{
  assert.equal(productFilter('BOLT_5%'),'%bolt\\_5\\%%');
});

test('quotation serialisation preserves server-confirmed status and values',()=>{
 const row={id:1,branch:'Store A',status:'AWAITING_CASH_OFFICE',customer_name:'Test',customer_contact:'',submitted_by_name:'Rep',submitted_by_email:'rep@example.com',notes:'',total_cents:11500,net_cents:10000,vat_cents:1500,created_at:'2026-11-09T12:00:00Z',lines_json:'[{"code":"X","quantity":1}]'};
 const q=serialQuote(row);
 assert.equal(q.number,'Q-00000001');assert.equal(q.total_cents,11500);assert.equal(q.lines[0].code,'X');
});
