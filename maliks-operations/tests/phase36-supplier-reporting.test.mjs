import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import frontend from '../src/frontend.mjs';
const source=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');

test('six formerly disabled Suppliers reports are connected',()=>{
 const enabled=source.match(/if\(id==='suppliers'\)return \[([^\n]+)\]\.includes\(item\)/)?.[1]||'';
 for(const item of ['Ledger','Statements','Control Account','Age Analysis','Payments','Suppliers PDC']){
   assert.ok(enabled.includes(`'${item}'`),`${item} is still disabled`);
 }
 assert.match(source,/id==='suppliers'&&section==='Reporting'/);
 assert.match(source,/function suiteSupplierReport\(menuItem\)/);
});
test('supplier reports never describe draft amounts as cleared/posting balances',()=>{
 for(const text of ['NOT PAID / NOT POSTED','NOT AP\/GL POSTED','NOT AVAILABLE','NOT RECONCILED','NOT a creditor ledger','NOT a statement']){
   assert.ok(source.includes(text),`missing limitation ${text}`);
 }
 assert.match(source,/No supplier PDCs are shown because no maintained supplier PDC register exists/);
 assert.doesNotMatch(source,/\/api\/supplier-reports\/post/);
});
test('live Suppliers POS HTML is browser parseable and labels are present',async()=>{
 const res=await frontend.fetch(new Request('https://pos.local/'),{APP_TYPE:'pos'});
 assert.equal(res.status,200);
 const html=await res.text();
 for(const item of ['Suppliers PDC','Control Account','Age Analysis','Payments'])assert.ok(html.includes(item));
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.ok(scripts.length>0);
 for(const js of scripts)assert.doesNotThrow(()=>new Script('(async()=>{\n'+js+'\n})()'));
});
