import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const installer=new URL('../scripts/install-phase61.mjs',import.meta.url).pathname;
const valid=`import InventoryLedger from './inventory-ledger';
const [section,setSection]=useState<Kind|'REGISTER'|'DASHBOARD'|'ACCESS'|'INVENTORY'>('DASHBOARD');
<button className={section==='INVENTORY'?styles.active:''} onClick={()=>switchTo('INVENTORY')}><span>▥</span>Live inventory ledger</button>
{section==='INVENTORY'&&<InventoryLedger branch={branch}/>}`;
test('Phase 61 installer adds navigation and is safe to repeat',()=>{
 const cwd=mkdtempSync(join(tmpdir(),'phase61-'));
 try{
  mkdirSync(join(cwd,'app/stock-operations'),{recursive:true});const file=join(cwd,'app/stock-operations/stock-operations.tsx');writeFileSync(file,valid);
  execFileSync(process.execPath,[installer],{cwd});const first=readFileSync(file,'utf8');
  assert.match(first,/StockTakeCentre/);assert.match(first,/section==='TAKE'/);
  execFileSync(process.execPath,[installer],{cwd});assert.equal(readFileSync(file,'utf8'),first);
 }finally{rmSync(cwd,{recursive:true,force:true});}
});
test('Phase 61 installer refuses unknown source without modifications',()=>{
 const cwd=mkdtempSync(join(tmpdir(),'phase61-'));
 try{mkdirSync(join(cwd,'app/stock-operations'),{recursive:true});const file=join(cwd,'app/stock-operations/stock-operations.tsx');writeFileSync(file,'unsupported');assert.throws(()=>execFileSync(process.execPath,[installer],{cwd,stdio:'pipe'}));assert.equal(readFileSync(file,'utf8'),'unsupported');}finally{rmSync(cwd,{recursive:true,force:true});}
});
