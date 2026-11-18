import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import frontend from '../src/frontend.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('all eight Debtors Reporting menu entries become interactive and invoke the reporting workspace',()=>{
 const s=read('../src/frontend.mjs');
 for(const name of ['Master','Transactions','Sales','Ledger','Statements','Control Account','Age Analysis','Debtors PDCs']){
  assert.ok(s.includes("'"+name+"'"),'Missing enabled item '+name);
 }
 assert.match(s,/if\(id==='debtors'&&section==='Reporting'&&item!=='Audits'\)\{suiteDebtorReport\(item\);return;\}/);
 assert.match(s,/function suiteDebtorReport\(menuItem\)/);
 assert.match(s,/Export current page · CSV/);
 assert.match(s,/Print current page/);
 assert.match(s,/\/api\/debtor-reports\?/);
 assert.match(s,/reporting response/);
});
test('POS browser script is valid JavaScript and renders all reporting labels',async()=>{
 const response=await frontend.fetch(new Request('https://pos.local/'),{APP_TYPE:'pos'});
 assert.equal(response.status,200);const html=await response.text();
 for(const item of ['Debtors PDCs','Control Account','Age Analysis','Reporting'])assert.ok(html.includes(item),item);
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.ok(scripts.length);
 for(const inline of scripts)assert.doesNotThrow(()=>new Script('(async()=>{\n'+inline+'\n})()'));
});
test('POS alone proxies the read-only debtor report API and Core enforces management/branch rules',()=>{
 const f=read('../src/frontend.mjs');const c=read('../src/core.mjs');const r=read('../src/debtor-report-domain.mjs');
 assert.match(f,/\/api\/debtor-reports':'\/v1\/debtor-reports/);
 assert.match(f,/path!=='\/v1\/debtor-reports'/);
 assert.match(f,/kind==='sales' && !\[/);
 assert.match(f,/kind==='member' && !\[/);
 assert.match(c,/if\(path==='\/v1\/debtor-reports'&&req.method==='GET'\)/);
 assert.match(r,/ctx\.app!=='management'/);
 assert.match(r,/matchingBranch\(ctx\.branches/);
 assert.match(r,/canUseMaster\(ctx\.member,'debtor'\)/);
 assert.doesNotMatch(r,/\b(?:UPDATE|INSERT INTO|DELETE FROM)\s+(?:maliks_pos_debtor_transaction_register|maliks_p9_invoices|maliks_pos_master_records)/i);
});
test('reporting does not add schema, require secrets or post accounting entries',()=>{
 const r=read('../src/debtor-report-domain.mjs');
 assert.match(r,/READ ONLY/);assert.match(r,/accounting_complete:false/);assert.match(r,/financial_posting:false/);
 assert.match(r,/Not available — no posted AR ledger/);assert.match(r,/NOT CLEARED/);
 const pkg=JSON.parse(read('../package.json'));
 assert.ok(pkg.scripts['migrate:phase30']);
 assert.ok(!pkg.scripts['migrate:phase31'],'Read-only reports need no Phase 31 migration');
});
