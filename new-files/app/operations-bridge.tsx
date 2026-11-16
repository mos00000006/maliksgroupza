'use client';
import {useCallback,useEffect,useState} from 'react';
import styles from './operations-bridge.module.css';

type ModuleSummary={key:string;name:string;source:'Maliks Operations'|'Hub';configured:boolean;error:boolean;total:number;by_status:Record<string,number>;last_at:string|null;note:string};
type BridgeData={read_only:boolean;as_of:string;branch:string|null;branches:string[];modules:ModuleSummary[];warnings:string[]};
const sections=[
  {name:'Customer sale and dispatch',keys:['quotes','payments','dispatch']},
  {name:'Tills and Cash Office',keys:['tills','tender_preps','cash_reviews','payment_evidence']},
  {name:'Buying and receiving',keys:['purchase_orders','grvs','supplier_invoices','transfers']},
  {name:'Inventory control — separate ledgers',keys:['stock_control','pos_stock','hub_grvs','hub_stock','hub_stock_skus']},
];
function niceDate(value:string|null){
  if(!value)return 'No entries';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?value:date.toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Johannesburg'});
}
function keySort(entries:[string,number][]):[string,number][]{
  const priority=['AWAITING_VERIFICATION','AWAITING_CASH_OFFICE','OPEN','SUBMITTED','COUNTED','EXCEPTION','AWAITING_PICK','PICKED','CHECKED','DRAFT'];
  return entries.sort(([a],[b])=>{const ia=priority.indexOf(a),ib=priority.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b);});
}
export default function OperationsBridge(){
  const [branch,setBranch]=useState('');
  const [data,setData]=useState<BridgeData|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const load=useCallback(async(selected:string)=>{
    setBusy(true);setError('');
    try{
      const url='/api/operations-bridge'+(selected?'?branch='+encodeURIComponent(selected):'');
      const response=await fetch(url,{cache:'no-store'});
      const json=await response.json() as BridgeData&{error?:string};
      if(!response.ok)throw new Error(json.error||'Could not load operations');
      setData(json);
    }catch(err){setError(err instanceof Error?err.message:'Could not load operations');}
    finally{setBusy(false);}
  },[]);
  useEffect(()=>{void load(branch);},[branch,load]);
  return <div className={styles.wrapper}>
    <div className={styles.top}>
      <div>
        <span className={styles.eyebrow}>MALIKS GROUP · CROSS-DEPARTMENT VISIBILITY</span>
        <h2>Operations control centre</h2>
        <p>Read-only activity from your current Hub and separate POS applications. Counts represent recorded documents, not reconciled financial or physical stock balances.</p>
      </div>
      <div className={styles.controls}>
        <label htmlFor="operations-branch">Branch / company scope</label>
        <select id="operations-branch" value={branch} onChange={event=>setBranch(event.target.value)}>
          <option value="">All my assigned branches</option>
          {(data?.branches||[]).map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <button type="button" onClick={()=>void load(branch)} disabled={busy}>{busy?'Updating…':'Refresh activity'}</button>
      </div>
    </div>
    <p className={styles.readOnly}>READ-ONLY MANAGEMENT VIEW · No payment, stock, invoice or dispatch posting is performed here.</p>
    {error&&<div role="alert" className={styles.error}>{error}</div>}
    {data&&<>
      <div className={styles.timestamp}>Last checked: {niceDate(data.as_of)} · {data.branch||'All assigned branches'} · {data.modules.filter(m=>m.configured&&!m.error).length}/{data.modules.length} data sources available</div>
      {sections.map(section=><section key={section.name} className={styles.section}>
        <h3>{section.name}</h3>
        <div className={styles.cards}>
          {section.keys.map(key=>{
            const m=data.modules.find(item=>item.key===key);
            if(!m)return null;
            return <article key={m.key} className={styles.card}>
              <div className={styles.cardHead}><h4>{m.name}</h4><span className={styles.source}>{m.source}</span></div>
              {!m.configured?<div className={styles.missing}>Not configured / migration not present</div>
                :m.error?<div className={styles.missing}>Cannot read — check deployed schema</div>
                :<><div className={styles.figure}>{m.total.toLocaleString('en-ZA')}<small>record{m.total===1?'':'s'}</small></div>
                <div className={styles.states}>{keySort(Object.entries(m.by_status)).map(([status,n])=><span key={status} className={styles.state}><b>{status.replaceAll('_',' ')}</b><em>{n.toLocaleString('en-ZA')}</em></span>)}</div></>}
              <p className={styles.note}>{m.note}</p>
              <div className={styles.last}>Latest record: {niceDate(m.last_at)}</div>
            </article>;
          })}
        </div>
      </section>)}
      <div className={styles.warnings}><h3>Integration controls before full go-live</h3>
        <ul>{data.warnings.map(w=><li key={w}>{w}</li>)}</ul>
      </div>
    </>}
  </div>;
}
