import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import frontend from '../src/frontend.mjs';
const source=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
test('five formerly disabled supplier utilities have real workspace handlers',()=>{
 const enabled=source.match(/if\(id==='suppliers'\)return \[([^\n]+)\]\.includes\(item\)/)?.[1]||'';
 for(const item of ['Control Agents','Statement Reconciliation','Reprint Documents','Reprint Unallocated Balances to Unpaid Invoices','Housekeeping'])assert.ok(enabled.includes("'"+item+"'"),item+' disabled');
 assert.match(source,/section==='Utilities'\)\{suiteSupplierUtility\(item\)/);
 assert.match(source,/function suiteSupplierUtility\(menuItem\)/);
});
test('supplier utility has no fictitious allocations or deletion',()=>{
 for(const phrase of ['NOT RECONCILED','NOT AVAILABLE','No posting or deletion performed','No automatic purge','RECORD SUMMARY ONLY'])assert.ok(source.includes(phrase));
 assert.match(source,/No supplier statement upload/);
});
test('Suppliers utilities embed valid browser JavaScript',async()=>{
 const response=await frontend.fetch(new Request('https://pos.local/'),{APP_TYPE:'pos'});
 assert.equal(response.status,200);
 const html=await response.text();
 for(const item of ['Control Agents','Statement Reconciliation','Reprint Documents','Housekeeping'])assert.ok(html.includes(item));
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Script('(async()=>{\n'+match[1]+'\n})()'));
});
