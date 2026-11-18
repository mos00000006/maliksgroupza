import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import frontend from '../src/frontend.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('all four debtor transaction menus are enabled and dispatch to a functional register',()=>{
 const source=read('../src/frontend.mjs');
 const section=source.slice(source.indexOf('function isConnectedSuiteAction'),source.indexOf('function suiteWorkspaceStart'));
 for(const option of ['Payments and Reversals','Journals','PDC Register','Group Accounts Invoice Settlements'])assert.ok(section.includes(option));
 assert.match(source,/suiteDebtorTransactions\(item\)/);
 assert.match(source,/\/api\/debtor-transactions\/audit/);
 assert.match(source,/\/api\/debtor-transactions\/action/);
 assert.match(source,/NO financial posting occurred/);
});
test('public POS Worker proxies the registers but does not expose them to Sales, Member Team or Tills',async()=>{
 const source=read('../src/frontend.mjs');
 assert.match(source,/!path\.startsWith\('\/v1\/debtor-transactions'\)/);
 assert.match(source,/kind==='sales'/);
 assert.match(source,/kind==='member'/);
 const s=await frontend.fetch(new Request('https://app.test/'),{APP_TYPE:'pos'});
 assert.equal(s.status,200);
 const html=await s.text();
 assert.match(html,/Group Accounts Invoice Settlements/);
 assert.match(html,/PDC Register/);
 assert.match(html,/Transaction register/);
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.ok(scripts.length>0);
 assert.match(html,/<script type="module">/);
 for(const inline of scripts)assert.doesNotThrow(()=>new vm.Script('(async()=>{\n'+inline+'\n})()'), 'POS browser JS must parse as a module');
});
test('Core routes require management context; migration runs before Core deployment',()=>{
 const core=read('../src/core.mjs');const pkg=JSON.parse(read('../package.json'));
 const flow=read('../../.github/workflows/deploy-maliks-operations.yml');
 for(const route of ['/v1/debtor-transactions','/v1/debtor-transactions/action','/v1/debtor-transactions/audit'])assert.ok(core.includes(route));
 assert.ok(pkg.scripts['migrate:phase30']);
 assert.ok(flow.indexOf('migrate:phase29')<flow.indexOf('migrate:phase30'));
 assert.ok(flow.indexOf('migrate:phase30')<flow.indexOf('deploy:core'));
 const domain=read('../src/debtor-transaction-domain.mjs');
 assert.match(domain,/context\.app!=='management'/);
 assert.match(domain,/original-origin/);
 assert.match(domain,/Independent review required/);
 assert.doesNotMatch(domain,/UPDATE\s+(?:maliks_pos_master_records|maliks_pos_invoices|journal_entries|customer_balances)/i);
});
