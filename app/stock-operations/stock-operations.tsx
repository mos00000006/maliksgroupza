'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import styles from './stock-operations.module.css';

type Kind='GRV'|'ADJUSTMENT'|'COUNT'|'SUPPLIER_RETURN'|'TRANSFER';
type Duty='Receiving / GRV'|'Stock Controller'|'DC / Transfers'|'Stock Manager';
type Item={id:number;code:string;name:string;category:string};
type Line={catalogue_product_id:number;code:string;name:string;document_quantity:string;expected_quantity:string;rejected_quantity:string;reason:string};
type Doc={id:string;document_number:string;kind:Kind;branch_name:string;destination_branch:string;status:string;created_by:string;created_at:string;notes:string;external_reference:string;supplier:string;reviewed_by:string;decision_note:string;can_approve?:boolean;can_receive?:boolean;lines?:Record<string,unknown>[];audit?:Record<string,unknown>[]};
type Access={email:string;branch_name:string;duty:Duty;active:number};
type API={error?:string;notice?:string;me?:{email:string;name:string;role:string;full:boolean;manager:boolean;can_assign:boolean};locations?:{name:string;type:string}[];documents?:Doc[];document?:Doc;products?:Item[];product_page?:number;product_total?:number;assignments?:Access[];my_assignments?:Access[];ok?:boolean};
const KINDS:{kind:Kind;title:string;sub:string;icon:string}[]=[
  {kind:'GRV',title:'Receiving & GRVs',sub:'Supplier delivery control',icon:'▣'},
  {kind:'ADJUSTMENT',title:'Stock adjustments',sub:'Discrepancy requests',icon:'±'},
  {kind:'COUNT',title:'Stock counts',sub:'Physical counts / variances',icon:'☷'},
  {kind:'SUPPLIER_RETURN',title:'Supplier returns',sub:'Return documents',icon:'↩'},
  {kind:'TRANSFER',title:'Stock transfers',sub:'Branch / DC movements',icon:'⇄'},
];
const duties:Duty[]=['Receiving / GRV','Stock Controller','DC / Transfers','Stock Manager'];
const moneyCount=(value:number)=>new Intl.NumberFormat('en-ZA',{maximumFractionDigits:3}).format(value);
const date=(value:string)=>value?new Date(value).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'—';
const blankLine=(item:Item):Line=>({catalogue_product_id:item.id,code:item.code,name:item.name,document_quantity:'1',expected_quantity:'0',rejected_quantity:'0',reason:''});
function failure(j:API,status:number){return j.error||`Request failed (${status})`;}
export default function StockOperations(){
 const [data,setData]=useState<API>({}); const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [message,setMessage]=useState('');
 const [section,setSection]=useState<Kind|'REGISTER'|'DASHBOARD'|'ACCESS'>('DASHBOARD');
 const [branch,setBranch]=useState('');const [search,setSearch]=useState('');const [page,setPage]=useState(1);
 const [items,setItems]=useState<Item[]>([]);const [productTotal,setProductTotal]=useState(0);
 const [selected,setSelected]=useState<Line[]>([]);const [editing,setEditing]=useState(false);const [detail,setDetail]=useState<Doc|null>(null);
 const [externalRef,setExternalRef]=useState('');const [supplier,setSupplier]=useState('');const [invoice,setInvoice]=useState('');
 const [driver,setDriver]=useState('');const [timeIn,setTimeIn]=useState('');const [timeOut,setTimeOut]=useState('');
 const [labelled,setLabelled]=useState('No');const [labelledBy,setLabelledBy]=useState('');const [notes,setNotes]=useState('');
 const [dest,setDest]=useState('');const [busy,setBusy]=useState(false);const [reviewNote,setReviewNote]=useState('');
 const [assignEmail,setAssignEmail]=useState('');const [assignBranch,setAssignBranch]=useState('');const [assignDuty,setAssignDuty]=useState<Duty>('Receiving / GRV');
 const requestId=useRef(typeof crypto!=='undefined'?crypto.randomUUID():'');
 async function load(selectedId='',newBranch?:string){
  const b=newBranch??branch;
  const r=await fetch(`/api/stock-operations?branch=${encodeURIComponent(b)}&id=${encodeURIComponent(selectedId)}`,{cache:'no-store'});
  const j:API=await r.json();if(!r.ok)throw Error(failure(j,r.status));
  setData(j);if(!b&&j.locations?.length===1)setBranch(j.locations[0].name);
  if(selectedId&&j.document)setDetail(j.document);
 }
 useEffect(()=>{let alive=true;void (async()=>{try{await load();}catch(e){if(alive)setError(e instanceof Error?e.message:String(e));}finally{if(alive)setLoading(false);}})();return()=>{alive=false;};/* initial load only */},[]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const cancel=new AbortController();const timer=setTimeout(async()=>{
  try{const r=await fetch(`/api/stock-operations?mode=products&q=${encodeURIComponent(search)}&page=${page}&branch=${encodeURIComponent(branch)}`,{signal:cancel.signal,cache:'no-store'});const j:API=await r.json();if(!r.ok)return;setItems(j.products||[]);setProductTotal(j.product_total||0);}
  catch{ /* Search cancellation is routine; the main request shows errors. */ }
 },230);return()=>{cancel.abort();clearTimeout(timer);};},[search,page,branch]);
 const kind=KINDS.some(k=>k.kind===section)?section as Kind:null;
 const locations=data.locations||[];const docs=data.documents||[];
 const filtered=docs.filter(d=>(!kind||d.kind===kind)&&(!branch||d.branch_name===branch||d.destination_branch===branch));
 const pending=docs.filter(d=>d.status==='Submitted');
 const allows=(k:Kind)=>{
  if(data.me?.full)return true;
  const duty=(data.my_assignments||[]).find(a=>a.branch_name===branch)?.duty;
  if(data.me?.manager||duty==='Stock Manager')return true;
  if(k==='GRV'||k==='SUPPLIER_RETURN')return duty==='Receiving / GRV';
  if(k==='ADJUSTMENT'||k==='COUNT')return duty==='Stock Controller';
  return duty==='DC / Transfers';
 };
 const ready=Boolean(branch&&selected.length&&kind&&allows(kind));
 const count=(xs:Doc[])=>xs.length;
 const typeOf=(k:Kind)=>KINDS.find(x=>x.kind===k)?.title||k;
 const transferDestOptions=locations.filter(v=>v.name!==branch);
 function switchTo(next:typeof section){setSection(next);setEditing(false);setSelected([]);setError('');setMessage('');requestId.current=crypto.randomUUID();}
 function newDocument(k:Kind){switchTo(k);setExternalRef('');setSupplier('');setInvoice('');setDriver('');setTimeIn('');setTimeOut('');setLabelled('No');setLabelledBy('');setDest('');setNotes('');setEditing(true);}
 function add(item:Item){setSelected(prev=>prev.some(l=>l.catalogue_product_id===item.id)?prev:[...prev,blankLine(item)]);}
 function changeLine(id:number,key:keyof Line,value:string){setSelected(lines=>lines.map(l=>l.catalogue_product_id===id?{...l,[key]:value}:l));}
 async function send(body:Record<string,unknown>,after?:()=>void){setBusy(true);setError('');setMessage('');try{
  const r=await fetch('/api/stock-operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j:API=await r.json();if(!r.ok)throw Error(failure(j,r.status));
  await load(j.document?.id||'');after?.();setMessage(j.document?`${j.document.document_number} — ${j.document.status}`:'Stock assignment saved.');return j;
 }catch(e){setError(e instanceof Error?e.message:String(e));return null;}finally{setBusy(false);}}
 async function create(){if(!kind||!ready)return;
  const j=await send({action:'create',client_request_id:requestId.current,kind,branch_name:branch,destination_branch:dest,external_reference:externalRef,supplier,supplier_invoice:invoice,driver_name:driver,time_in:timeIn,time_out:timeOut,labelled,labelled_by:labelledBy,notes,
   lines:selected.map(l=>({catalogue_product_id:l.catalogue_product_id,document_quantity:Number(l.document_quantity),expected_quantity:Number(l.expected_quantity),rejected_quantity:Number(l.rejected_quantity),reason:l.reason}))});
  if(j?.ok){setEditing(false);setSelected([]);requestId.current=crypto.randomUUID();}
 }
 async function act(action:'submit'|'approve'|'reject'|'receive'){if(!detail)return;const j=await send({action,id:detail.id,note:reviewNote});if(j?.ok)setReviewNote('');}
 async function openDoc(d:Doc){setDetail(d);setReviewNote('');await load(d.id);}
 const tableRecords=useMemo(()=>filtered.slice(0,150),[filtered]);
 if(loading)return <div className={styles.loading}>Opening stock controls…</div>;
 if(!data.me)return <main className={styles.denied}><h1>Stock control access required</h1><p>{error||'Ask a Hub administrator to assign your branch and stock duties.'}</p><Link href="/">Return to Hub</Link></main>;
 return <main className={styles.shell}>
  <aside className={styles.sidebar}>
   <div className={styles.brand}><span className={styles.brandBadge}>M</span><div><b>MALIKS</b><small>STORE OPERATIONS</small></div></div>
   <div className={styles.sideLabel}>WORKSPACES</div>
   <button className={section==='DASHBOARD'?styles.active:''} onClick={()=>switchTo('DASHBOARD')}><span>◫</span>Overview</button>
   {KINDS.map(k=><button key={k.kind} className={section===k.kind?styles.active:''} onClick={()=>switchTo(k.kind)}><span>{k.icon}</span>{k.title}</button>)}
   <button className={section==='REGISTER'?styles.active:''} onClick={()=>switchTo('REGISTER')}><span>≡</span>Movement register</button>
   {data.me.can_assign&&<button className={section==='ACCESS'?styles.active:''} onClick={()=>switchTo('ACCESS')}><span>⚙</span>Staff permissions</button>}
   <div className={styles.sideFooter}><p>{data.me.name||data.me.email}</p><small>{data.me.role}</small><Link href="/">← Back to Maliks Hub</Link><Link href="/tills">Sales / Tills</Link></div>
  </aside>
  <section className={styles.main}>
   <header className={styles.header}><div><span className={styles.eyebrow}>MALIKS GROUP HUB / RETAILOS</span><h1>Stock Control & GRVs</h1><p>Receiving, inventory controls and stock movement documentation</p></div>
    <div className={styles.selectBlock}><label htmlFor="stock-branch">ACTIVE BRANCH</label><select id="stock-branch" value={branch} onChange={e=>{setBranch(e.target.value);setDetail(null);setEditing(false);setPage(1);void load('',e.target.value);}}><option value="">All authorised branches</option>{locations.map(x=><option value={x.name} key={x.name}>{x.name}</option>)}</select></div>
   </header>
   <div className={styles.notice}><span>CONTROL REGISTER</span> Documents and approvals are saved in the Hub. Live stock balances, purchase accounting and financial posting are not connected.</div>
   {(error||message)&&<div className={`${styles.flash} ${error?styles.bad:styles.good}`} role="status">{error||message}<button onClick={()=>{setError('');setMessage('');}}>×</button></div>}
   {section==='DASHBOARD'&&<>
    <div className={styles.kpiGrid}><div><small>Pending manager review</small><strong>{count(pending)}</strong><span>Submitted documents</span></div><div><small>GRVs in register</small><strong>{count(docs.filter(d=>d.kind==='GRV'))}</strong><span>Supplier deliveries</span></div><div><small>Counts & adjustments</small><strong>{count(docs.filter(d=>['COUNT','ADJUSTMENT'].includes(d.kind)))}</strong><span>Control records</span></div><div><small>Transfers</small><strong>{count(docs.filter(d=>d.kind==='TRANSFER'))}</strong><span>Branch / DC</span></div></div>
    <div className={styles.sectionTitle}><div><span>DAILY OPERATIONS</span><h2>Choose a stock workflow</h2></div><span>Branch-specific staff permissions</span></div>
    <div className={styles.actionGrid}>{KINDS.map(k=><button key={k.kind} onClick={()=>newDocument(k.kind)} className={styles.action}><span className={styles.actionGlyph}>{k.icon}</span><strong>{k.title}</strong><small>{k.sub}</small></button>)}</div>
    <Register docs={tableRecords.slice(0,12)} onOpen={openDoc}/>
   </>}
   {kind&&<>
    <div className={styles.sectionTitle}><div><span>STOCK WORKFLOW / {kind}</span><h2>{typeOf(kind)}</h2></div><button className={styles.primary} disabled={!branch||!allows(kind)} onClick={()=>newDocument(kind)}>＋ New {kind.replace('_',' ').toLowerCase()}</button></div>
    {!branch&&<div className={styles.hint}>Select a branch before creating a document.</div>}
    {!allows(kind)&&branch&&<div className={styles.hint}>You can view this branch, but your assigned role cannot create {typeOf(kind).toLowerCase()}.</div>}
    {editing?<div className={styles.compose}>
     <div className={styles.composeHeader}><div><span>NEW DOCUMENT</span><h3>{typeOf(kind)} · {branch}</h3></div><button onClick={()=>setEditing(false)} className={styles.ghost}>Cancel</button></div>
     <div className={styles.formGrid}>
      {(kind==='GRV'||kind==='SUPPLIER_RETURN')&&<><label>Supplier<input value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="Supplier name" maxLength={100}/></label><label>Supplier delivery / return ref<input value={externalRef} onChange={e=>setExternalRef(e.target.value)} placeholder="Delivery note / return number" maxLength={90}/></label><label>Supplier invoice<input value={invoice} onChange={e=>setInvoice(e.target.value)} placeholder="Invoice reference (optional)" maxLength={100}/></label></>}
      {kind==='TRANSFER'&&<><label>Destination branch<select value={dest} onChange={e=>setDest(e.target.value)}><option value="">Choose destination</option>{transferDestOptions.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label><label>Transfer reference<input value={externalRef} onChange={e=>setExternalRef(e.target.value)} placeholder="Optional transport reference"/></label></>}
      {kind==='GRV'&&<><label>Driver name<input value={driver} onChange={e=>setDriver(e.target.value)}/></label><label>Time in<input value={timeIn} onChange={e=>setTimeIn(e.target.value)} placeholder="07:30"/></label><label>Time out<input value={timeOut} onChange={e=>setTimeOut(e.target.value)} placeholder="08:15"/></label><label>Items labelled?<select value={labelled} onChange={e=>setLabelled(e.target.value)}><option>Yes</option><option>No</option></select></label><label>Labelled by<input value={labelledBy} onChange={e=>setLabelledBy(e.target.value)}/></label></>}
      <label className={styles.notes}>Reason, delivery notes or count-sheet reference<textarea rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Enter notes and reasons" maxLength={600}/></label>
     </div>
     <div className={styles.productZone}><div className={styles.sectionTitle}><div><span>PRODUCT CATALOGUE</span><h3>Select products and enter physical quantities</h3></div><small>{productTotal} catalogue matches</small></div>
       <input className={styles.search} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search by SKU or product name…" aria-label="Search catalogue"/>
       <div className={styles.productList}>{items.map(p=><div className={styles.product} key={p.id}><div><strong>{p.name}</strong><small>{p.code} · {p.category}</small></div><button disabled={selected.some(x=>x.catalogue_product_id===p.id)} onClick={()=>add(p)}>{selected.some(x=>x.catalogue_product_id===p.id)?'Added':'+ Add'}</button></div>)}</div>
       <div className={styles.paging}><button disabled={page===1} onClick={()=>setPage(x=>x-1)}>← Previous</button><span>Page {page} of {Math.max(1,Math.ceil(productTotal/40))}</span><button disabled={page*40>=productTotal} onClick={()=>setPage(x=>x+1)}>Next →</button></div>
     </div>
     <div className={styles.lineBlock}><div className={styles.sectionTitle}><h3>Document lines</h3><span>{selected.length} selected products</span></div>
       {!selected.length&&<p className={styles.empty}>Add products from the catalogue to start.</p>}
       {selected.map(l=><div key={l.catalogue_product_id} className={styles.lineRow}><div className={styles.lineName}><b>{l.name}</b><small>{l.code}</small></div><label>{kind==='COUNT'||kind==='ADJUSTMENT'?'Physical qty':'Delivered / requested qty'}<input type="number" min="0" step="0.001" value={l.document_quantity} onChange={e=>changeLine(l.catalogue_product_id,'document_quantity',e.target.value)}/></label><label>{kind==='COUNT'||kind==='ADJUSTMENT'?'System qty (reference)':'Expected qty'}<input type="number" min="0" step="0.001" value={l.expected_quantity} onChange={e=>changeLine(l.catalogue_product_id,'expected_quantity',e.target.value)}/></label>{kind==='GRV'&&<label>Rejected qty<input type="number" min="0" step="0.001" value={l.rejected_quantity} onChange={e=>changeLine(l.catalogue_product_id,'rejected_quantity',e.target.value)}/></label>}{kind==='GRV'&&<label>Damage / rejection reason<input value={l.reason} onChange={e=>changeLine(l.catalogue_product_id,'reason',e.target.value)} placeholder="If rejected" maxLength={200}/></label>}<button className={styles.remove} onClick={()=>setSelected(s=>s.filter(x=>x.catalogue_product_id!==l.catalogue_product_id))} aria-label="Remove product">×</button></div>)}
     </div>
     <div className={styles.footer}><span>No stock or financial balance changes when saving.</span><button className={styles.primary} disabled={busy||!ready} onClick={()=>void create()}>{busy?'Saving…':'Save numbered draft'}</button></div>
    </div>:<Register docs={tableRecords} onOpen={openDoc}/>}
   </>}
   {section==='REGISTER'&&<><div className={styles.sectionTitle}><div><span>AUDIT TRAIL</span><h2>Stock movement register</h2></div><small>Submitted and approved documents remain searchable by branch</small></div><Register docs={tableRecords} onOpen={openDoc}/></>}
   {section==='ACCESS'&&data.me.can_assign&&<><div className={styles.sectionTitle}><div><span>ADMINISTRATION</span><h2>Assign stock duties</h2></div></div>
     <div className={styles.compose}><p className={styles.hint}>Employees must already be active Hub team members. These assignments grant access only to Stock Operations at the selected branch. They do not change the employee’s Hub-wide role.</p>
      <div className={styles.formGrid}><label>Staff email<input type="email" value={assignEmail} onChange={e=>setAssignEmail(e.target.value)} placeholder="staff@example.com"/></label><label>Branch<select value={assignBranch} onChange={e=>setAssignBranch(e.target.value)}><option value="">Select a branch</option>{locations.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label><label>Duty<select value={assignDuty} onChange={e=>setAssignDuty(e.target.value as Duty)}>{duties.map(d=><option key={d}>{d}</option>)}</select></label></div>
      <button className={styles.primary} disabled={busy||!assignEmail||!assignBranch} onClick={()=>void send({action:'assign',email:assignEmail,branch_name:assignBranch,duty:assignDuty})}>Save assignment</button>
     </div><div className={styles.tableBox}><table><thead><tr><th>Employee</th><th>Branch</th><th>Stock duty</th><th>Status</th></tr></thead><tbody>{(data.assignments||[]).map(a=><tr key={`${a.email}-${a.branch_name}`}><td>{a.email}</td><td>{a.branch_name}</td><td>{a.duty}</td><td>{a.active?'Active':'Disabled'}</td></tr>)}</tbody></table></div></>}
   {detail&&<div className={styles.modalBackdrop} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null);}}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Stock document detail"><header className={styles.modalHead}><div><span>DOCUMENT RECORD</span><h2>{detail.document_number}</h2><p>{typeOf(detail.kind)} · {detail.branch_name} {detail.destination_branch?`→ ${detail.destination_branch}`:''}</p></div><button aria-label="Close" onClick={()=>setDetail(null)}>×</button></header>
     <div className={styles.modalBody}><div className={styles.detailGrid}><div><small>Status</small><strong className={styles.status}>{detail.status}</strong></div><div><small>Created by</small><strong>{detail.created_by}</strong></div><div><small>Created</small><strong>{date(detail.created_at)}</strong></div><div><small>Supplier / reference</small><strong>{detail.supplier||detail.external_reference||'—'}</strong></div></div>
     <table className={styles.detailTable}><thead><tr><th>Code</th><th>Product</th><th>Actual / requested</th><th>Expected</th><th>Rejected</th></tr></thead><tbody>{(detail.lines||[]).map((l,i)=><tr key={i}><td>{String(l.product_code)}</td><td>{String(l.product_name)}</td><td>{moneyCount(Number(l.document_quantity))}</td><td>{moneyCount(Number(l.expected_quantity))}</td><td>{moneyCount(Number(l.rejected_quantity))}</td></tr>)}</tbody></table>
     <div className={styles.paperEvidence}><p><b>Document note:</b> {detail.notes||'—'}</p><p><b>Supplier / carrier:</b> {detail.supplier||'—'} · <b>Driver:</b> {String((detail as Doc & {driver_name?:string}).driver_name||'—')}</p><p><b>Time in / out:</b> {String((detail as Doc & {time_in?:string}).time_in||'—')} / {String((detail as Doc & {time_out?:string}).time_out||'—')} · <b>Labelled:</b> {String((detail as Doc & {labelled?:string}).labelled||'—')}</p><div className={styles.signature}>Receiving manager signature: ____________________ &nbsp;&nbsp; Driver signature: ____________________</div></div><h3>Approval history</h3><div className={styles.audit}>{(detail.audit||[]).map((e,i)=><div key={i}><b>{String(e.action)}</b> — {String(e.actor_email)} <small>{String(e.created_at)}</small></div>)}</div>
     <label className={styles.review}>Review or receipt note<textarea rows={2} value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder="Reason for rejection or received quantities/discrepancies"/></label>
     </div><footer className={styles.modalFooter}><button className={styles.ghost} onClick={()=>window.print()}>Print register copy</button>
     {detail.status==='Draft'&&detail.created_by===data.me.email&&<button className={styles.primary} disabled={busy} onClick={()=>void act('submit')}>Submit for approval</button>}
     {detail.status==='Submitted'&&detail.can_approve&&<><button className={styles.danger} disabled={busy||!reviewNote.trim()} onClick={()=>void act('reject')}>Reject</button><button className={styles.primary} disabled={busy} onClick={()=>void act('approve')}>Approve document</button></>}
     {detail.kind==='TRANSFER'&&detail.status==='Approved'&&detail.can_receive&&<button className={styles.primary} disabled={busy||!reviewNote.trim()} onClick={()=>void act('receive')}>Acknowledge receipt</button>}
     <button onClick={()=>setDetail(null)} className={styles.ghost}>Close</button></footer></section></div>}
  </section>
 </main>;
}
function Register({docs,onOpen}:{docs:Doc[];onOpen:(d:Doc)=>Promise<void>}){return <div className={styles.tableBox}><div className={styles.tableHeading}><h3>Documents & approvals</h3><small>{docs.length} records shown</small></div><div className={styles.tableScroll}><table><thead><tr><th>Reference</th><th>Type</th><th>Branch</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td><strong>{d.document_number}</strong></td><td>{d.kind.replace('_',' ')}</td><td>{d.branch_name}</td><td><span className={`${styles.pill} ${d.status==='Rejected'?styles.rejected:d.status==='Approved'||d.status==='Received'?styles.approved:''}`}>{d.status}</span></td><td>{date(d.created_at)}</td><td><button className={styles.open} onClick={()=>void onOpen(d)}>Open →</button></td></tr>)}</tbody></table></div>{!docs.length&&<div className={styles.empty}>No stock documents for this branch yet.</div>}</div>;}
