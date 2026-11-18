import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import frontend from '../src/frontend.mjs';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const names=['Current Agents','Block Sales','Reprint Documents','Reprint Journals','Labelling','Delete Expired Quotations','Debtors Master CSV File Import'];
test('seven grey Debtors utilities become enabled plus existing CSV export remains functional',()=>{
 const s=read('../src/frontend.mjs');for(const name of names)assert.ok(s.includes("'"+name+"'"),name);
 assert.match(s,/section==='Utilities'&&item!=='Debtors Master CSV\/Text File Export'/);
 assert.match(s,/suiteDebtorUtility\(item\)/);
 assert.match(s,/item==='Debtors Master CSV\/Text File Export'\)\{suiteMasterExport\('debtor'\)/);
});
test('actual worker serves browser-parsable UI with all seven controls',async()=>{
 const response=await frontend.fetch(new Request('https://pos.local/'),{APP_TYPE:'pos'});
 assert.equal(response.status,200);const html=await response.text();
 const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.ok(inline.length);
 for(const script of inline)assert.doesNotThrow(()=>new Script('(async()=>{\n'+script+'\n})()'));
 for(const name of names)assert.ok(html.includes(name),name);
 for(const x of ['function suiteDebtorUtility(menuItem)','function parseDebtorCSV(raw)','function printDocument(row)','Utility audit trail'])assert.ok(html.includes(x),x);
});
test('backend utility routes remain management-only, with double department gate and origin checks',()=>{
 const f=read('../src/frontend.mjs'),c=read('../src/core.mjs'),d=read('../src/debtor-utilities-domain.mjs');
 assert.match(f,/\/api\/debtor-utilities':'\/v1\/debtor-utilities'/);
 assert.match(f,/path!=='\/v1\/debtor-utilities'/);
 assert.match(f,/\/api\/debtor-utilities','\/api\/reference-masters'/);
 assert.match(c,/path==='\/v1\/debtor-utilities'&&req.method==='GET'/);
 assert.match(c,/path==='\/v1\/debtor-utilities'&&req.method==='POST'/);
 assert.match(d,/ctx.app==='management'/);assert.match(d,/requireOrigin\(req\)/);
});
test('new migration is executed before private Core deployment, no additional secrets',()=>{
 const wf=read('../../.github/workflows/deploy-maliks-operations.yml'),pkg=JSON.parse(read('../package.json'));
 assert.ok(wf.indexOf('run: npm run migrate:phase32')<wf.indexOf('Deploy central API'));
 assert.match(pkg.scripts['migrate:phase32'],/phase32_debtor_utilities\.sql/);
 assert.ok(!wf.includes('CF_ACCESS_AUD_UTILITIES'));
});
test('Buster Build logo is served as a real PNG and reprint/labels choose branch branding',async()=>{
 const res=await frontend.fetch(new Request('https://pos.local/busterbuild-logo.png'),{APP_TYPE:'pos'});
 assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/image\/png/);
 const b=new Uint8Array(await res.arrayBuffer());assert.ok(b.length>8000);assert.deepEqual([...b.slice(0,8)],[137,80,78,71,13,10,26,10]);
 const ui=read('../src/debtor-utilities-ui.mjs');assert.match(ui,/function printFilingLabels\(chosen\)/);
 assert.match(ui,/busterbuild-logo\.png/);assert.match(ui,/powerbuild-logo\.png/);
});
