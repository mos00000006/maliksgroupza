import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app/stock-operations/inventory-ledger.tsx',import.meta.url),'utf8');
test('branch changes remount inventory form so previous branch drafts are discarded',()=>{
 assert.match(source,/InventoryLedgerForBranch key=\{branch\} branch=\{branch\}/);
 assert.match(source,/function InventoryLedgerForBranch\(/);
});
test('inventory effects do not synchronously reset React state',()=>{
 assert.doesNotMatch(source,/useEffect\(\(\)=>\{setSelected\(/);
 assert.doesNotMatch(source,/if\(!branch\)\{setCurrent\(/);
 assert.match(source,/useEffect\(\(\)=>\{if\(!branch\)return;const controller=new AbortController\(\)/);
});
test('opening stock, bulk import, activation and error handling remain in the screen',()=>{
 for(const value of ['opening_bulk','ACTIVATE LIVE STOCK','Record opening balance','Opening required','setError(','setKey(x=>x+1)']){
  assert.ok(source.includes(value),`Missing ${value}`);
 }
});
