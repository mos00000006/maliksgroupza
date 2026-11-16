import { env } from 'cloudflare:workers';
import { allowedWorkspaces, getHubMember } from '../access';
import { canSeeOperationsOverview, visibleOperationsBranches, resolveOperationsBranch, operationsOverviewCounts } from '../../lib/operations-bridge-policy.mjs';

type Workspace = {name:string;active:number};
type ModuleRow = { status:string;n:number;last_at:string|null};
type TableRow = {name:string};
type ModuleDefinition={key:string;name:string;source:'Maliks Operations'|'Hub';table:string;branch:string;status:string;updated:string;filter?:string;note:string};

// Read-only snapshot from the existing SHARED D1. Deliberately NO INSERT/UPDATE/DELETE.
// Table/column identifiers below are trusted, static constants, NEVER client parameters.
const modules:readonly ModuleDefinition[]=[
  {key:'quotes',name:'Sales quotations',source:'Maliks Operations',table:'till_quotation_submissions',branch:'branch',status:'status',updated:'created_at',note:'Submitted quotations, not confirmed payments'},
  {key:'tills',name:'Till shifts',source:'Maliks Operations',table:'maliks_till_shift_register',branch:'branch',status:'status',updated:'opened_at',note:'Open/closed shifts; cash-up settlement is not verified here'},
  {key:'cash_reviews',name:'Cash Office shift reviews',source:'Maliks Operations',table:'maliks_till_shift_reviews',branch:'branch',status:'decision',updated:'created_at',note:'Checked declarations and flagged exceptions; NOT settled deposits'},
  {key:'tender_preps',name:'Tender preparations',source:'Maliks Operations',table:'maliks_tender_preparations',branch:'branch',status:'status',updated:'created_at',note:'Preparations only; not cash receipts or bank settlement'},
  {key:'payment_evidence',name:'Card / EFT document reviews',source:'Maliks Operations',table:'maliks_payment_evidence_observations',branch:'branch',status:'decision',updated:'created_at',note:'Observation-only evidence; not confirmation of bank settlement'},
  {key:'payments',name:'Payment pilot',source:'Maliks Operations',table:'maliks_p9_payments',branch:'branch',status:'status',updated:'created_at',note:'Internal decisions only; card/EFT settlement is not proven'},
  {key:'dispatch',name:'Dispatch picking',source:'Maliks Operations',table:'maliks_p9_dispatch_jobs',branch:'branch',status:'status',updated:'created_at',note:'CHECKED is not delivered; signed POD and sale stock deduction are not available'},
  {key:'purchase_orders',name:'Purchase orders',source:'Maliks Operations',table:'maliks_pos_purchase_orders',branch:'branch',status:'status',updated:'created_at',note:'Purchase authorisation register'},
  {key:'grvs',name:'Receiving / GRVs',source:'Maliks Operations',table:'maliks_pos_receipts',branch:'branch',status:'status',updated:'created_at',note:'COUNTED → VERIFIED → POSTED receiving flow'},
  {key:'supplier_invoices',name:'Supplier invoice matching',source:'Maliks Operations',table:'maliks_pos_supplier_invoices',branch:'branch',status:'status',updated:'created_at',note:'Three-way matching; not posted to accounts payable or input VAT'},
  {key:'transfers',name:'Inter-branch transfers',source:'Maliks Operations',table:'maliks_pos_transfers',branch:'source_branch',status:'status',updated:'created_at',note:'Shows transfers issued from selected branches; receiving side is in the POS application'},
  {key:'stock_control',name:'POS stock control',source:'Maliks Operations',table:'maliks_pos_stock_control_docs',branch:'branch',status:'status',updated:'created_at',note:'POS stocktake/adjustment register; separate from Hub ledger'},
  {key:'pos_stock',name:'POS stock balance SKUs',source:'Maliks Operations',table:'maliks_pos_stock_balances',branch:'branch',status:"'RECORDED'",updated:'updated_at',note:'Counts SKU balance records, NOT stock quantities or stock value'},
  {key:'hub_grvs',name:'Hub receiving / GRVs',source:'Hub',table:'stock_ops_documents',branch:'branch_name',status:'status',updated:'created_at',filter:"kind='GRV'",note:'Hub stock register; separate from POS GRV register'},
  {key:'hub_stock',name:'Hub stock control',source:'Hub',table:'stock_ops_documents',branch:'branch_name',status:'status',updated:'created_at',filter:"kind<>'GRV'",note:'Hub stock operations; do not combine quantities with POS ledger'},
  {key:'hub_stock_skus',name:'Hub stock balance SKUs',source:'Hub',table:'stock_inventory_balances',branch:'branch_name',status:"'RECORDED'",updated:'initialized_at',note:'Counts SKU balance records, NOT stock quantities or stock value'},
];
const headers={'Cache-Control':'private, no-store'};
const error=(message:string,status:number)=>Response.json({error:message},{status,headers});

export async function GET(req:Request){
  try{
    const member=await getHubMember();
    if(!canSeeOperationsOverview(member))return error('Management operations access required.',403);
    const ws=await env.DB.prepare('SELECT name,active FROM workspaces WHERE active=1 ORDER BY name').all<Workspace>();
    const visible=visibleOperationsBranches(ws.results,allowedWorkspaces(member));
    if(!visible.length)return error('Your user account has no active workspace assignment.',403);
    const requested=new URL(req.url).searchParams.get('branch');
    const branch=resolveOperationsBranch(visible,requested);
    if(branch===undefined)return error('This branch is not assigned to your account.',403);
    const branches=branch?[branch]:visible;
    const tables=await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${modules.map(()=>'?').join(',')})`)
      .bind(...modules.map(m=>m.table)).all<TableRow>();
    const existing=new Set(tables.results.map(r=>r.name));
    const placeholders=branches.map(()=>'?').join(',');
    const summaries=[];
    for(const module of modules){
      if(!existing.has(module.table)){
        summaries.push({key:module.key,name:module.name,source:module.source,configured:false,error:false,
          total:0,by_status:{},last_at:null,note:module.note});
        continue;
      }
      try{
        const query=`SELECT ${module.status} AS status,COUNT(*) AS n,MAX(${module.updated}) AS last_at
          FROM ${module.table} WHERE lower(${module.branch}) IN (${placeholders}) ${module.filter?`AND ${module.filter}`:''}
          GROUP BY ${module.status}`;
        const rows=await env.DB.prepare(query).bind(...branches.map(b=>b.toLowerCase())).all<ModuleRow>();
        summaries.push({key:module.key,name:module.name,source:module.source,configured:true,error:false,
          ...operationsOverviewCounts(rows.results),note:module.note});
      }catch{
        // Fail closed: a broken migration/query must not be disguised as zero business activity.
        summaries.push({key:module.key,name:module.name,source:module.source,configured:true,error:true,
          total:0,by_status:{},last_at:null,note:`${module.note}. Schema verification required.`});
      }
    }
    return Response.json({read_only:true,as_of:new Date().toISOString(),branch:branch||null,
      branches:visible,modules:summaries,
      warnings:[
        'Read-only status snapshot: this page does not create invoices, confirm payments, approve GRVs or move stock.',
        'Hub and Maliks Operations currently maintain separate inventory ledgers. Do not add their stock balances together.',
        'POS payment decisions are a pilot and are not proof of bank settlement or tax-invoice compliance.',
        'Dispatch CHECKED means the pick was checked; it is not proof of customer collection or signed delivery.',
      ]},{headers});
  }catch{
    return error('Operations overview unavailable. Check Hub D1 access and deployed migrations.',503);
  }
}
