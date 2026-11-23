// Run from the root of the Maliks Group Hub repository after extracting this patch.
// This installer changes only the Stock Operations navigation/component wiring.
// All other files are already present in their destination folders.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const file='app/stock-operations/stock-operations.tsx';
if(!existsSync(file))throw Error(`Cannot locate ${file}. Run from repository root.`);
let code=readFileSync(file,'utf8');
if(code.includes('StockTakeCentre')&&code.includes("section==='TAKE'")){
 console.log('Phase 61 Stock Take Control Centre already integrated.');process.exit(0);
}
const replace=(before,after,description)=>{const n=code.split(before).length-1;if(n!==1)throw Error(`${description}: unexpected repository version, found ${n} matching anchors. No files written.`);code=code.replace(before,after);};
replace("import InventoryLedger from './inventory-ledger';","import InventoryLedger from './inventory-ledger';\nimport StockTakeCentre from './stock-take-centre';",'Import');
replace("useState<Kind|'REGISTER'|'DASHBOARD'|'ACCESS'|'INVENTORY'>('DASHBOARD')","useState<Kind|'REGISTER'|'DASHBOARD'|'ACCESS'|'INVENTORY'|'TAKE'>('DASHBOARD')",'View type');
const entry='<button className={section===\'INVENTORY\'?styles.active:\'\'} onClick={()=>switchTo(\'INVENTORY\')}><span>▥</span>Live inventory ledger</button>';
replace(entry,entry+'\n    <button className={section===\'TAKE\'?styles.active:\'\'} onClick={()=>switchTo(\'TAKE\')}><span>☷</span>Stock Take Control Centre</button>','Navigation');
const render="{section==='INVENTORY'&&<InventoryLedger branch={branch}/>}";
replace(render,render+"\n    {section==='TAKE'&&<StockTakeCentre branch={branch} onBack={()=>switchTo('DASHBOARD')}/>}",'Main content');
writeFileSync(file,code);
console.log('Phase 61 integrated: Stock Operations → Stock Take Control Centre.');
