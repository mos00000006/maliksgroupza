import {env} from 'cloudflare:workers';
import {getHubMember, allowedWorkspaces, canManageAccess, canWrite} from '../../access';
import {isStockManager} from '../stock-domain.mjs';
import {validateOpeningRows} from './opening-domain.mjs';

const output=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const fail=(error:string,status=400)=>output({error},status);
const clean=(value:unknown,length=150)=>String(value??'').trim().slice(0,length);
type InventoryProduct={id:number;code:string;name:string;qty_milli:number|null};
type InventoryMovement={id:number;phase:string;branch_name:string;catalogue_product_id:number;code:string;name:string;delta_milli:number;balance_after_milli:number;actor_email:string;posted_at:string;reference:string};
async function context(branch:string){
 const member=await getHubMember({allowBuyerAccess:true,allowStockOrdersAccess:true});
 if(!member)return null;
 const scope=allowedWorkspaces(member);
 const assigned=await env.DB.prepare('SELECT duty FROM stock_ops_assignments WHERE lower(email)=lower(?) AND branch_name=? AND active=1')
   .bind(member.email,branch).first<{duty:string}>();
 const inScope=scope===null||scope.some(s=>s.toLowerCase()===branch.toLowerCase());
 const full=canManageAccess(member);
 const authorised=inScope&&(full||isStockManager(member,assigned?.duty||'')||Boolean(assigned));
 if(!authorised)return null;
 const exists=await env.DB.prepare('SELECT 1 AS ok FROM workspaces WHERE name=? AND active=1').bind(branch).first<{ok:number}>();
 if(!exists)return null;
 return {member,full};
}
export async function GET(req:Request){
 try{
  const u=new URL(req.url),branch=clean(u.searchParams.get('branch'),120),q=clean(u.searchParams.get('q'),65);
  if(!branch)return fail('Select a branch to view inventory.');
  const ctx=await context(branch);if(!ctx)return fail('You are not authorised to see inventory for this branch.',403);
  const configuration=await env.DB.prepare('SELECT active,activated_at,activated_by,activation_reference FROM stock_inventory_branches WHERE branch_name=?')
    .bind(branch).first<{active:number;activated_at:string;activated_by:string;activation_reference:string}>();
  const summary=await env.DB.prepare('SELECT count(*) AS skus,coalesce(sum(qty_milli),0) AS units_milli FROM stock_inventory_balances WHERE branch_name=?')
    .bind(branch).first<{skus:number;units_milli:number}>();
  const products=await env.DB.prepare(`SELECT c.id,c.code,c.name,b.qty_milli FROM catalogue_products c
    LEFT JOIN stock_inventory_balances b ON b.branch_name=? AND b.catalogue_product_id=c.id
    WHERE c.active=1 AND (lower(c.code) LIKE ? OR lower(c.name) LIKE ?)
    ORDER BY c.name LIMIT 40`).bind(branch,`%${q.toLowerCase()}%`,`%${q.toLowerCase()}%`).all<InventoryProduct>();
  const movements=await env.DB.prepare(`SELECT m.id,m.phase,m.branch_name,m.catalogue_product_id,
   coalesce(c.code,'Archived SKU') AS code,coalesce(c.name,'Archived product') AS name,
   m.delta_milli,m.balance_after_milli,m.actor_email,m.posted_at,m.reference
   FROM stock_inventory_movements m LEFT JOIN catalogue_products c ON c.id=m.catalogue_product_id
   WHERE m.branch_name=? ORDER BY m.id DESC LIMIT 80`).bind(branch).all<InventoryMovement>();
  const inTransit=await env.DB.prepare(`SELECT COUNT(DISTINCT d.id) AS documents FROM stock_ops_documents d
   WHERE d.kind='TRANSFER' AND d.status='Approved' AND (d.branch_name=? OR d.destination_branch=?)
   AND EXISTS(SELECT 1 FROM stock_inventory_movements m WHERE m.document_id=d.id AND m.phase='APPROVAL')`)
   .bind(branch,branch).first<{documents:number}>();
  return output({branch,can_open:ctx.full,active:configuration?.active===1,activated_at:configuration?.activated_at||'',
   activation_reference:configuration?.activation_reference||'',initialized_skus:Number(summary?.skus||0),
   total_units_milli:Number(summary?.units_milli||0),in_transit:Number(inTransit?.documents||0),
   products:products.results,movements:movements.results,
   notice:'Independent inventory ledger. Sales, purchasing, external ERP and general-ledger postings are not yet connected.'});
 }catch{return fail('Inventory is unavailable. Check that migration 0057 is applied.',503);}
}
export async function POST(req:Request){
 try{
  if(!req.headers.get('content-type')?.toLowerCase().includes('application/json'))return fail('Use JSON.',415);
  const origin=req.headers.get('origin');
  if(origin&&new URL(origin).origin!==new URL(req.url).origin)return fail('Untrusted origin.',403);
  const payload=await req.text();if(payload.length>30000)return fail('Request too large.',413);
  const body=JSON.parse(payload) as Record<string,unknown>;
  const branch=clean(body.branch,120),action=clean(body.action,25),reference=clean(body.reference,120);
  const ctx=await context(branch);if(!ctx)return fail('Branch inventory access denied.',403);
  if(!ctx.full||!canWrite(ctx.member))return fail('Only Hub administrators can load opening balances and activate live stock.',403);
  if(reference.length<4)return fail('A verified source / count reference is required.');
  const now=new Date().toISOString();
  if(action==='opening_bulk'){
   let rows:{code:string;qty_milli:number}[];
   try{rows=validateOpeningRows(body.rows);}catch(e){return fail(e instanceof Error?e.message:'Invalid stock opening rows.');}
   const codes=rows.map(r=>r.code.toLowerCase());
   const found=await env.DB.prepare(`SELECT id,code FROM catalogue_products WHERE active=1 AND lower(code) IN (${rows.map(()=>'?').join(',')})`)
    .bind(...codes).all<{id:number;code:string}>();
   const lookup=new Map(found.results.map(x=>[x.code.toLowerCase(),x]));
   if(rows.some(r=>!lookup.has(r.code.toLowerCase())))return fail('One or more product codes do not exist in the active catalogue.',409);
   if(found.results.length!==rows.length)return fail('Ambiguous duplicate catalogue product codes require administrator cleanup.',409);
   const ids=rows.map(r=>lookup.get(r.code.toLowerCase())!.id);
   const present=await env.DB.prepare(`SELECT catalogue_product_id FROM stock_inventory_balances WHERE branch_name=?
    AND catalogue_product_id IN (${rows.map(()=>'?').join(',')})`).bind(branch,...ids).all<{catalogue_product_id:number}>();
   if(present.results.length)return fail('Some SKUs already have opening balances. Remove those rows before re-importing.',409);
   try{
    await env.DB.batch([
     env.DB.prepare('INSERT OR IGNORE INTO stock_inventory_branches(branch_name,created_at,created_by) VALUES(?,?,?)').bind(branch,now,ctx.member.email),
     ...rows.map(row=>env.DB.prepare(`INSERT INTO stock_inventory_balances(branch_name,catalogue_product_id,qty_milli,initialized_at,initialized_by,opening_reference)
     VALUES(?,?,?,?,?,?)`).bind(branch,lookup.get(row.code.toLowerCase())!.id,row.qty_milli,now,ctx.member.email,reference))
    ]);
   }catch{return fail('Bulk opening import rejected atomically. Check duplicate SKUs and reload branch balances.',409);}
   return output({ok:true,branch,imported_count:rows.length});
  }
  if(action==='opening'){
   if(body.quantity===undefined||body.quantity===null||body.quantity==='')return fail('An explicit opening quantity is required, including zero if correct.');
   const productId=Number(body.catalogue_product_id),qty=Number(body.quantity);
   const qtyMilli=Math.round(qty*1000);
   if(!Number.isSafeInteger(productId)||productId<=0||!Number.isFinite(qty)||qty<0||qty>1_000_000||
     !Number.isSafeInteger(qtyMilli)||Math.abs(qty*1000-qtyMilli)>0.00001)
     return fail('Select a catalogue product and a nonnegative quantity, to three decimal places.');
   const product=await env.DB.prepare('SELECT id FROM catalogue_products WHERE id=? AND active=1').bind(productId).first<{id:number}>();
   if(!product)return fail('Select an active catalogue item.',404);
   try{
    await env.DB.batch([
     env.DB.prepare('INSERT OR IGNORE INTO stock_inventory_branches(branch_name,created_at,created_by) VALUES(?,?,?)').bind(branch,now,ctx.member.email),
     env.DB.prepare(`INSERT INTO stock_inventory_balances(branch_name,catalogue_product_id,qty_milli,initialized_at,initialized_by,opening_reference)
     VALUES(?,?,?,?,?,?)`).bind(branch,productId,qtyMilli,now,ctx.member.email,reference)
    ]);
   }catch{return fail('An opening balance for this SKU already exists. Use an authorised adjustment instead.',409);}
   return output({ok:true,branch,catalogue_product_id:productId,opening_quantity:qty});
  }
  if(action==='activate'){
   if(body.confirmation!=='ACTIVATE LIVE STOCK')return fail('Type ACTIVATE LIVE STOCK to confirm the audited opening balances.');
   const status=await env.DB.prepare('SELECT active FROM stock_inventory_branches WHERE branch_name=?').bind(branch).first<{active:number}>();
   if(status?.active===1)return fail('This branch is already active.',409);
   if(!status)return fail('Load verified opening quantities before activation.',409);
   try{
    const result=await env.DB.prepare(`UPDATE stock_inventory_branches SET active=1,activated_at=?,activated_by=?,activation_reference=?
     WHERE branch_name=? AND active=0`).bind(now,ctx.member.email,reference,branch).run();
    if(!result.meta.changes)return fail('Branch activation was already completed.',409);
   }catch{return fail('Cannot activate this branch without verified opening quantities.',409);}
   return output({ok:true,branch,active:true});
  }
  return fail('Unknown inventory operation.');
 }catch{return fail('Opening stock action failed. Check migration and permissions.',500);}
}
