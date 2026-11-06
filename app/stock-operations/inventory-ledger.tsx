'use client';
import {useEffect,useState} from 'react';
import styles from './stock-operations.module.css';

type Product={id:number;code:string;name:string;qty_milli:number|null};
type Movement={id:number;phase:string;branch_name:string;catalogue_product_id:number;code:string;name:string;delta_milli:number;balance_after_milli:number;actor_email:string;posted_at:string;reference:string};
type Inventory={error?:string;branch?:string;active?:boolean;can_open?:boolean;activated_at?:string;activation_reference?:string;initialized_skus?:number;total_units_milli?:number;in_transit?:number;products?:Product[];movements?:Movement[];notice?:string;ok?:boolean};
const qty=(n:number)=>new Intl.NumberFormat('en-ZA',{maximumFractionDigits:3}).format(n/1000);
export default function InventoryLedger({branch}:{branch:string}){
 const [search,setSearch]=useState('');const [current,setCurrent]=useState<Inventory>({});const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');const [success,setSuccess]=useState('');const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);const [quantity,setQuantity]=useState('0');const [source,setSource]=useState('');
 const [confirm,setConfirm]=useState('');const [key,setKey]=useState(0);const [bulkText,setBulkText]=useState('');
 useEffect(()=>{setSelected(null);setSource('');setBulkText('');setConfirm('');setSuccess('');},[branch]);
 useEffect(()=>{if(!branch){setCurrent({});return;}const controller=new AbortController();const timer=setTimeout(()=>{
  setLoading(true);void fetch(`/api/stock-operations/inventory?branch=${encodeURIComponent(branch)}&q=${encodeURIComponent(search)}`,{cache:'no-store',signal:controller.signal})
   .then(async r=>{const v:Inventory=await r.json();if(!r.ok)throw Error(v.error||'Inventory lookup failed');setCurrent(v);setError('');})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:String(e));})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
 },220);return()=>{controller.abort();clearTimeout(timer);};},[branch,search,key]);
 const products=current.products||[];
 const chosen=products.find(x=>x.id===selected);
 async function save(action:'opening'|'opening_bulk'|'activate'){
  setError('');setSuccess('');setBusy(true);
  try{
   const rows=action==='opening_bulk'?bulkText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
     .filter((line,i)=>!(i===0&&/^(sku|code|product code)[,;\t]/i.test(line)))
     .map(line=>{const pieces=line.split(/[,;\t]/);return {code:pieces[0]?.trim()||'',quantity:pieces[1]?.trim()||''};}):[];
   const r=await fetch('/api/stock-operations/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    action,branch,reference:source,confirmation:confirm,catalogue_product_id:selected,quantity:Number(quantity),rows})});
   const j:Inventory=await r.json();if(!r.ok)throw Error(j.error||'Stock request was rejected');
   setSuccess(action==='opening'?'Verified opening balance recorded with an immutable audit entry.':action==='opening_bulk'?'Batch imported with individually audited opening balances.':'Live stock posting is now active for this branch.');
   if(action==='opening_bulk')setBulkText('');setSelected(null);setQuantity('0');setKey(x=>x+1);
  }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
 }
 if(!branch)return <div className={styles.inventoryEmpty}>Select a branch above to view its stock ledger.</div>;
 return <div className={styles.inventoryShell}>
  <div className={styles.inventoryHero}><div><span className={styles.inventoryOverline}>LIVE INVENTORY / {branch}</span>
   <h2>Branch stock ledger</h2><p>Verified opening balances, approval-driven stock movements and a searchable history of every SKU.</p></div>
   <span className={current.active?styles.inventoryLive:styles.inventoryPending}>{current.active?'● LIVE POSTING':'○ ACTIVATION REQUIRED'}</span>
  </div>
  {current.notice&&<p className={styles.inventoryNotice}>{current.notice}</p>}
  {error&&<p className={styles.inventoryError} role="alert">{error}</p>}
  {success&&<p className={styles.inventorySuccess} role="status">{success}</p>}
  <div className={styles.inventoryMetrics}>
   <div><small>Initialised SKUs</small><strong>{current.initialized_skus??'—'}</strong><span>Products with verified opening records</span></div>
   <div><small>Stock quantity (units)</small><strong>{current.total_units_milli===undefined?'—':qty(current.total_units_milli)}</strong><span>Sum of branch stock units, not stock value</span></div>
   <div><small>Transfers in transit</small><strong>{current.in_transit??'—'}</strong><span>Approved but not received</span></div>
  </div>
  {current.can_open&&<section className={styles.inventorySetup}>
   <div><span className={styles.inventoryOverline}>ADMINISTRATION / OPENING STOCK</span><h3>Enter verified opening quantities</h3>
    <p>Select the catalogue item below, enter its physical opening quantity, and give the signed count/import reference. Opening entries cannot be changed. Use adjustments for later corrections.</p></div>
   <div className={styles.inventoryEntry}>
    <label>Selected product <select value={selected??''} onChange={e=>setSelected(e.target.value?Number(e.target.value):null)}>
     <option value="">Select a product from the search below</option>
     {products.filter(p=>p.qty_milli===null).map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
     {chosen&&chosen.qty_milli!==null&&<option value={chosen.id}>{chosen.code} — {chosen.name} (already initialised)</option>}
    </select></label>
    <label>Physical quantity <input type="number" min="0" step="0.001" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
    <label>Signed opening-stock reference <input value={source} onChange={e=>setSource(e.target.value)} maxLength={120} placeholder="e.g. COUNT-2026-001"/></label>
    <button type="button" className={styles.inventoryPrimary} disabled={busy||!selected||Boolean(chosen&&chosen.qty_milli!==null)||source.trim().length<4} onClick={()=>void save('opening')}>{busy?'Saving…':'Record opening balance'}</button>
   </div>
   <div className={styles.inventoryBulk}>
    <div><h3>Import opening stock from Excel</h3><p>Paste up to 100 lines per batch. Use product code, then quantity, separated by a comma or Tab. The same signed reference is recorded on every imported line. Each batch is all-or-nothing.</p></div>
    <textarea aria-label="Paste stock opening quantities" rows={5} value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder={'PRODUCT CODE,QUANTITY\nTC0298,50\nTC0301,12.5'}/>
    <button className={styles.inventoryPrimary} disabled={busy||!bulkText.trim()||source.trim().length<4} onClick={()=>void save('opening_bulk')}>Import verified opening stock</button>
   </div>
   {!current.active&&<div className={styles.inventoryActivation}>
    <div><h3>Activate stock posting for {branch}</h3><p>After activation, approving a GRV, count, adjustment or return changes the branch balance immediately. Transfers debit the sending branch on approval and credit the receiving branch on acknowledgement. Missing SKU opening balances cause posting to fail.</p></div>
    <label>Confirm exactly: ACTIVATE LIVE STOCK<input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="ACTIVATE LIVE STOCK"/></label>
    <button type="button" disabled={busy||confirm!=='ACTIVATE LIVE STOCK'||source.trim().length<4||!current.initialized_skus} onClick={()=>void save('activate')}>Activate this branch</button>
   </div>}
  </section>}
  <section className={styles.inventoryTableSection}>
   <div className={styles.inventoryHeading}><div><h3>Product balances</h3><p>Uninitialised is not zero. Those products cannot be posted in an active branch.</p></div><label>Search barcode, code or name<input value={search} onChange={e=>{setSearch(e.target.value);setSelected(null);}} placeholder="Search catalogue…"/></label></div>
   <div className={styles.inventoryScroll}><table><thead><tr><th>Code</th><th>Product</th><th>On hand</th><th>State</th></tr></thead><tbody>
    {products.map(p=><tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td className={styles.inventoryNumber}>{p.qty_milli===null?'—':qty(p.qty_milli)}</td>
      <td>{p.qty_milli===null?'Opening required':'Recorded'}</td></tr>)}
    {!products.length&&<tr><td colSpan={4}>{loading?'Loading products…':'No products found.'}</td></tr>}
   </tbody></table></div>
   <p className={styles.inventoryTableHelp}>Showing the first 40 catalogue matches. Use search to find a specific SKU.</p>
  </section>
  <section className={styles.inventoryTableSection}>
   <div className={styles.inventoryHeading}><div><h3>Immutable stock movement history</h3><p>Opening stock, authorised approvals and acknowledged transfer receipts.</p></div></div>
   <div className={styles.inventoryScroll}><table><thead><tr><th>Time</th><th>Product</th><th>Movement</th><th>Quantity ±</th><th>Balance after</th><th>Reference</th></tr></thead><tbody>
    {(current.movements||[]).map(m=><tr key={m.id}><td>{new Date(m.posted_at).toLocaleString('en-ZA')}</td><td>{m.code}<small className={styles.inventorySmall}>{m.name}</small></td><td>{m.phase}</td><td className={styles.inventoryNumber}>{m.delta_milli>0?'+':''}{qty(m.delta_milli)}</td><td className={styles.inventoryNumber}>{qty(m.balance_after_milli)}</td><td>{m.reference}</td></tr>)}
    {!(current.movements||[]).length&&<tr><td colSpan={6}>No stock movements recorded for this branch.</td></tr>}
   </tbody></table></div>
   <p className={styles.inventoryTableHelp}>Showing the 80 most recent branch movements. The complete movement history remains in D1.</p>
  </section>
 </div>;
}
