// Phase 39: Supplier month-end OPERATIONAL REVIEW only. No GL/AP close, bank settlement, or period lock.
import {matchingBranch} from './policy.mjs';
import {canUseMaster} from './master-domain.mjs';
const out=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
const roles=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Regional Manager','Store Manager','Finance Manager']);
const periodValid=s=>/^20\d{2}-(0[1-9]|1[0-2])$/.test(s);
const access=(context,branch,write=false)=>context.app==='management'&&canUseMaster(context.member,'supplier',write)?matchingBranch(context.branches,branch):null;
const origin=req=>!!req.headers.get('origin')&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin');
const snapshot=async(db,branch,period)=>{
 const rows=await db.prepare(`SELECT status, COUNT(*) AS n FROM maliks_pos_supplier_transaction_register WHERE lower(branch)=lower(?) AND substr(event_date,1,7)=? GROUP BY status`).bind(branch,period).all();
 const counts=Object.fromEntries((rows.results||[]).map(r=>[r.status,Number(r.n)]));
 return {counts,pending:(counts.DRAFT||0)+(counts.SUBMITTED||0),total:Object.values(counts).reduce((a,b)=>a+b,0)};
};
export async function getSupplierMonthEnd(req,env,context){
 try{
  const p=new URL(req.url).searchParams;const branch=access(context,p.get('branch'));if(!branch)return out({error:'Supplier month-end access denied.'},403);
  const mode=p.get('mode')||'review';if(!['review','history'].includes(mode))return out({error:'Invalid mode.'},400);
  if(mode==='history'){
   const history=await env.DB.prepare('SELECT branch,period,status,pending_count,total_count,review_note,reviewed_by,reviewed_at FROM maliks_pos_supplier_month_end_reviews WHERE lower(branch)=lower(?) ORDER BY period DESC LIMIT 120').bind(branch).all();
   return out({branch,history:history.results,accounting_close:false,posting_enabled:false});
  }
  const period=p.get('period')||'';if(!periodValid(period))return out({error:'Choose a valid YYYY-MM period.'},400);
  const current=await snapshot(env.DB,branch,period);
  const previous=await env.DB.prepare('SELECT * FROM maliks_pos_supplier_month_end_reviews WHERE lower(branch)=lower(?) AND period=?').bind(branch,period).first();
  return out({branch,period,...current,review:previous||null,accounting_close:false,posting_enabled:false,warning:'Operational review only. No creditor balances, AP/GL posting or period locking.'});
 }catch(e){return out({error:'Month-end review could not be loaded: '+e.message},400);}
}
export async function recordSupplierMonthEnd(req,env,context){
 try{
  if(!origin(req))return out({error:'Invalid request origin.'},403);
  const body=await req.json().catch(()=>null);if(!body||typeof body!=='object'||Array.isArray(body))return out({error:'Invalid request.'},400);
  const branch=access(context,body.branch,true);if(!branch||!roles.has(context.member?.role))return out({error:'Authorised Suppliers manager required.'},403);
  const period=String(body.period||'');if(!periodValid(period))return out({error:'Invalid review period.'},400);
  if(!/^[-\w]{12,100}$/.test(String(body.request_id||'')))return out({error:'Invalid request ID.'},400);
  const note=String(body.review_note||'').trim();if(note.length<10||note.length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(note))return out({error:'Enter a review note (10–1000 characters).'},400);
  if(body.confirm_unposted!==true)return out({error:'Confirm that this is NOT an accounting period close.'},400);
  const db=env.DB;
  const existing=await db.prepare('SELECT request_id,reviewed_by FROM maliks_pos_supplier_month_end_reviews WHERE lower(branch)=lower(?) AND period=?').bind(branch,period).first();
  if(existing)return out({error:'This month already has a recorded review. History is immutable.',existing:true},409);
  const stats=await snapshot(db,branch,period);
  if(stats.pending>0)return out({error:'Resolve draft/submitted supplier preparation records before recording review.',pending:stats.pending},409);
  const at=new Date().toISOString(),by=String(context.member.email||'').toLowerCase();
  const saved=await db.prepare(`INSERT OR IGNORE INTO maliks_pos_supplier_month_end_reviews(branch,period,status,pending_count,total_count,review_note,reviewed_by,reviewed_at,request_id)
    VALUES(?,?,'OPERATIONAL_REVIEW_ONLY',?,?,?,?,?,?)`).bind(branch,period,stats.pending,stats.total,note,by,at,body.request_id).run();
  if(Number(saved.meta?.changes)!==1)return out({error:'Review already recorded by another user. Refresh history.'},409);
  return out({ok:true,branch,period,status:'OPERATIONAL_REVIEW_ONLY',reviewed_by:by,reviewed_at:at,accounting_close:false,posting_enabled:false});
 }catch(e){return out({error:'Review could not be recorded: '+e.message},400);}
}
