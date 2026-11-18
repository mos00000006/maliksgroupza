import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SUPPLIER_MONTH_END_CLIENT_SCRIPT} from '../src/supplier-month-end-ui.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('month-end and history menus open operational review',()=>{
 const f=read('../src/frontend.mjs');
 assert.match(f,/Suppliers Month End History'\].includes\(item\)/);
 assert.match(f,/suiteSupplierMonthEnd\(item\)/);
 assert.match(f,/supplier-month-end/);
 assert.doesNotThrow(()=>new vm.Script(SUPPLIER_MONTH_END_CLIENT_SCRIPT));
});
test('Core route and schema are operational and non-posting',()=>{
 const core=read('../src/core.mjs');const db=read('../sql/phase39_supplier_month_end_review.sql');
 assert.match(core,/recordSupplierMonthEnd/);assert.match(db,/OPERATIONAL_REVIEW_ONLY/);
 assert.match(db,/UNIQUE\(branch,period\)/);assert.doesNotMatch(db,/UPDATE\s+.*(ledger|invoice)/i);
});
test('review enforces origin, branch, management and pending safeguards',()=>{
 const domain=read('../src/supplier-month-end-domain.mjs');
 for(const marker of ['origin(req)','matchingBranch','canUseMaster','stats.pending>0','INSERT OR IGNORE','accounting_close:false'])assert.ok(domain.includes(marker),marker);
});
