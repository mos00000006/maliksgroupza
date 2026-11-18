import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import frontend from '../src/frontend.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('both disabled Debtors Settings actions are enabled and routed to dedicated screens',()=>{
 const f=read('../src/frontend.mjs');assert.match(f,/'Debtors Master CSV File Import','Settings','Numbering'\]\.includes\(item\)/);
 assert.match(f,/id==='debtors'&&section==='Settings'/);assert.match(f,/suiteDebtorSettings\(item\)/);
});
test('actual POS HTML returns runnable browser script containing branch Settings and Numbering',async()=>{
 const response=await frontend.fetch(new Request('https://pos.local/'),{APP_TYPE:'pos'});assert.equal(response.status,200);
 const html=await response.text();const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.ok(scripts.length>0);
 for(const script of scripts)assert.doesNotThrow(()=>new Script('(async()=>{\n'+script+'\n})()'));
 for(const text of ['function suiteDebtorSettings(menuItem)','Save Debtors settings','Reserve next reference','Settings audit','Numbering','statement_cutoff_day'])assert.ok(html.includes(text),text);
});
test('POS proxy and Core expose only the Settings endpoint, with double management boundary',()=>{
 const f=read('../src/frontend.mjs'),core=read('../src/core.mjs'),domain=read('../src/debtor-settings-domain.mjs');
 assert.match(f,/\/api\/debtor-settings':'\/v1\/debtor-settings'/);
 assert.match(f,/path!=='\/v1\/debtor-settings'/);
 assert.match(core,/path==='\/v1\/debtor-settings'&&req.method==='GET'/);
 assert.match(core,/path==='\/v1\/debtor-settings'&&req.method==='POST'/);
 assert.match(domain,/ctx.app!=='management'/);
 assert.match(domain,/checkOrigin\(req\)/);
});
test('migration is applied before private Core deployment, and adds no secrets',()=>{
 const wf=read('../../.github/workflows/deploy-maliks-operations.yml');
 const p=JSON.parse(read('../package.json'));
 assert.ok(wf.indexOf('migrate:phase33')>0&&wf.indexOf('migrate:phase33')<wf.indexOf('Deploy central API'));
 assert.match(p.scripts['migrate:phase33'],/phase33_debtor_settings_numbering\.sql/);
 assert.ok(!wf.includes('ACCESS_AUD_DEBTOR_SETTINGS'));
});
test('new debtor editor alone pre-fills saved terms and credit limits without overwriting staff changes',()=>{
 const f=read('../src/frontend.mjs');assert.match(f,/if\(kind==='debtor'&&!record\)/);assert.match(f,/manuallyChanged/);assert.match(f,/controls\.credit_limit_cents\.value/);assert.match(f,/controls\.payment_terms_days\.value/);
});
test('existing financial posting, invoice and quotation numbering code is not modified by Phase 33',()=>{
 const domain=read('../src/debtor-settings-domain.mjs');assert.doesNotMatch(domain,/UPDATE\s+till_quotation_submissions|UPDATE\s+maliks_p9_invoices|UPDATE\s+maliks_pos_master_records/i);
 assert.match(domain,/automatic_document_numbering:false/);assert.match(domain,/reservation_only:true/);
});
