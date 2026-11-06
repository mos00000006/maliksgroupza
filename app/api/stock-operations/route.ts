import { env } from 'cloudflare:workers';
import { getHubMember, allowedWorkspaces, canManageAccess, canWrite, type HubMember } from '../access';
import { isFullAccess, isStockManager, canCreate, canTransition, validateStockLines, STOCK_DUTIES } from './stock-domain.mjs';

type Row = Record<string, string | number | null>;
type Work = {name:string;type:string;active:number};
type Assignment = {email:string;branch_name:string;duty:string;active:number};
const clean = (x:unknown, max=160) => String(x??'').trim().slice(0,max);
const err = (message:string,status=400) => Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
const out = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).replaceAll('-','');

async function authorise(){
  const member = await getHubMember({allowBuyerAccess:true,allowStockOrdersAccess:true});
  if(!member) return null;
  const allLocations = await env.DB.prepare("SELECT name,type,active FROM workspaces WHERE active=1 ORDER BY name").all<Work>();
  const scope = allowedWorkspaces(member);
  const assign = await env.DB.prepare('SELECT email,branch_name,duty,active FROM stock_ops_assignments WHERE lower(email)=lower(?) AND active=1')
    .bind(member.email).all<Assignment>();
  const full = isFullAccess(member);
  const manager = isStockManager(member,'');
  const inScope = (branch:string) => scope===null || scope.some(v=>v.toLowerCase()===branch.toLowerCase());
  const assignments = assign.results.filter(a=>inScope(a.branch_name));
  const locations = allLocations.results.filter(w=>(full||((manager&&inScope(w.name))||assignments.some(a=>a.branch_name.toLowerCase()===w.name.toLowerCase()))));
  return {member,full,manager,assignments,locations,allLocations:allLocations.results,inScope};
}
function permission(ctx:NonNullable<Awaited<ReturnType<typeof authorise>>>,branch:string){
 const entry=ctx.assignments.find(a=>a.branch_name.toLowerCase()===branch.toLowerCase());
 const exists=ctx.locations.some(w=>w.name.toLowerCase()===branch.toLowerCase());
 return {exists,duty:entry?.duty||'',manager:exists&&(ctx.full||(ctx.manager&&ctx.inScope(branch))||entry?.duty==='Stock Manager')};
}
function accessibleDocument(ctx:NonNullable<Awaited<ReturnType<typeof authorise>>>,doc:Row){
 const branch=String(doc.branch_name||''),dest=String(doc.destination_branch||'');
 return permission(ctx,branch).exists || (dest.length>0 && permission(ctx,dest).exists);
}
async function fetchDoc(id:string){
 return env.DB.prepare('SELECT * FROM stock_ops_documents WHERE id=?').bind(id).first<Row>();
}
async function documentWithLines(row:Row){
 const lines=await env.DB.prepare('SELECT * FROM stock_ops_document_lines WHERE document_id=? ORDER BY line_no').bind(row.id).all<Row>();
 const audit=await env.DB.prepare('SELECT * FROM stock_ops_audit WHERE document_id=? ORDER BY id').bind(row.id).all<Row>();
 return {...row,lines:lines.results,audit:audit.results};
}

export async function GET(req:Request){
 try{
  const ctx=await authorise(); if(!ctx)return err('Your Hub staff login is required.',403);
  if(!ctx.locations.length && !ctx.full)return err('Ask an administrator to assign your stock department and branch.',403);
  const url=new URL(req.url); const branch=clean(url.searchParams.get('branch'));
  if(branch && !ctx.locations.some(w=>w.name===branch))return err('Branch not permitted.',403);
  const kind=clean(url.searchParams.get('kind'));
  const q=clean(url.searchParams.get('q'),80);
  const page=Math.min(1000,Math.max(1,Number.parseInt(url.searchParams.get('page')||'1',10)||1));
  const id=clean(url.searchParams.get('id'),80);
  if(url.searchParams.get('mode')==='products'){
   const totalRow=await env.DB.prepare(`SELECT COUNT(*) AS n FROM catalogue_products WHERE active=1 AND (lower(name) LIKE ? OR lower(code) LIKE ?)`)
     .bind(`%${q.toLowerCase()}%`,`%${q.toLowerCase()}%`).first<{n:number}>();
   const products=await env.DB.prepare(`SELECT id,code,name,category FROM catalogue_products WHERE active=1 AND (lower(name) LIKE ? OR lower(code) LIKE ?) ORDER BY name LIMIT 40 OFFSET ?`)
     .bind(`%${q.toLowerCase()}%`,`%${q.toLowerCase()}%`,(page-1)*40).all<Row>();
   return out({products:products.results,product_page:page,product_total:Number(totalRow?.n||0)});
  }
  const selectedWorkspaces=ctx.locations.map(w=>w.name);
  const branchFilter=branch? [branch] : selectedWorkspaces;
  const where=ctx.full&&!branch?'':`WHERE branch_name IN (${branchFilter.map(()=>'?').join(',')}) OR destination_branch IN (${branchFilter.map(()=>'?').join(',')})`;
  const documentsQuery=env.DB.prepare(`SELECT * FROM stock_ops_documents ${where} ORDER BY created_at DESC LIMIT 300`);
  const docs=await (where?documentsQuery.bind(...branchFilter,...branchFilter):documentsQuery).all<Row>();
  const visible=docs.results.filter(d=>accessibleDocument(ctx,d)&&(!branch||(String(d.branch_name)===branch||String(d.destination_branch)===branch))&&(!kind||String(d.kind)===kind))
    .map(d=>({...d,can_approve:permission(ctx,String(d.branch_name)).manager&&String(d.created_by)!==ctx.member.email,
      can_receive:(permission(ctx,String(d.destination_branch)).exists&&(permission(ctx,String(d.destination_branch)).manager||['Receiving / GRV','DC / Transfers'].includes(permission(ctx,String(d.destination_branch)).duty)))&&String(d.created_by)!==ctx.member.email&&String(d.reviewed_by)!==ctx.member.email}));
  const selected=id?visible.find(d=>d.id===id):undefined;
  const assignments=canManageAccess(ctx.member)?await env.DB.prepare('SELECT email,branch_name,duty,active FROM stock_ops_assignments ORDER BY branch_name,email').all<Assignment>():{results:[] as Assignment[]};
  return out({me:{email:ctx.member.email,name:ctx.member.name,role:ctx.member.role,full:ctx.full,manager:ctx.manager,can_assign:canManageAccess(ctx.member)},locations:ctx.locations.map(w=>({name:w.name,type:w.type})),assignments:assignments.results,my_assignments:ctx.assignments,documents:visible,document:selected?await documentWithLines(selected):null,notice:'Stock posting activates only after verified opening stock by branch. No accounting or sales integration is enabled.'});
 }catch(e){return err('Stock Operations could not load. Confirm migration 0056 was applied.',503);}
}

export async function POST(req:Request){
 try{
  if(!req.headers.get('content-type')?.toLowerCase().includes('application/json'))return err('Use JSON for stock operations.',415);
  const origin=req.headers.get('origin');if(origin&&new URL(origin).origin!==new URL(req.url).origin)return err('Origin is not trusted.',403);
  const raw=await req.text();if(raw.length>90000)return err('Document is too large.',413);
  const body=JSON.parse(raw) as Record<string,unknown>;
  const ctx=await authorise();if(!ctx)return err('Hub access required.',403);
  const action=clean(body.action,20);
  if(!canWrite(ctx.member))return err('Read-only Hub users cannot change stock documents.',403);
  if(action==='assign'){
   if(!canManageAccess(ctx.member))return err('Only Hub administrators assign stock duties.',403);
   const email=clean(body.email).toLowerCase(), branch=clean(body.branch_name),duty=clean(body.duty);
   if(!ctx.allLocations.some(w=>w.name===branch)||!STOCK_DUTIES.includes(duty))return err('Select a real workspace and stock duty.');
   const staff=await env.DB.prepare('SELECT name,email,role,department,access_scope,workspace_access FROM team_members WHERE lower(email)=? AND active=1').bind(email).first<HubMember>();
   if(!staff||staff.role==='Human Resource (HR)')return err('Select an invited, active non-HR staff member.',403);
   const staffScope=allowedWorkspaces(staff);
   if(staffScope!==null&&!staffScope.some(x=>x.toLowerCase()===branch.toLowerCase()))return err('Assign this branch to the employee in Hub Team Members first.',409);
   if(!ctx.full && !ctx.inScope(branch))return err('Outside your branch.',403);
   const enabled=body.active!==false?1:0;
   await env.DB.prepare(`INSERT INTO stock_ops_assignments(email,branch_name,duty,assigned_by,assigned_at,active) VALUES(?,?,?,?,?,?)
     ON CONFLICT(email,branch_name) DO UPDATE SET duty=excluded.duty,assigned_by=excluded.assigned_by,assigned_at=excluded.assigned_at,active=excluded.active`)
     .bind(email,branch,duty,ctx.member.email,new Date().toISOString(),enabled).run();
   return out({ok:true});
  }
  if(action==='create'){
   const kind=clean(body.kind),branch=clean(body.branch_name),dest=clean(body.destination_branch);
   const rights=permission(ctx,branch);
   if(!rights.exists)return err('You are not assigned to this branch.',403);
   if(!canCreate(kind,rights.duty,rights.manager))return err('Your stock duty cannot create this document.',403);
   if(kind==='TRANSFER'&&(!dest||dest===branch||!ctx.allLocations.some(w=>w.name===dest)))return err('Select another valid destination branch.');
   if(kind!=='TRANSFER'&&dest)return err('Destination is only used for transfers.');
   const ref=clean(body.external_reference,90),supplier=clean(body.supplier,100),invoice=clean(body.supplier_invoice,100);
   if((kind==='GRV'||kind==='SUPPLIER_RETURN')&&(!supplier||!ref))return err('Supplier and delivery/return reference are required.');
   if((kind==='ADJUSTMENT'||kind==='COUNT')&&!clean(body.notes,600))return err('A reason or count-sheet reference is required.');
   const lines=validateStockLines(body.lines,kind);
   const productIds=lines.map(l=>l.catalogue_product_id);
   const fetched=await env.DB.prepare(`SELECT id,code,name FROM catalogue_products WHERE active=1 AND id IN (${productIds.map(()=>'?').join(',')})`).bind(...productIds).all<{id:number,code:string,name:string}>();
   const lookup=new Map(fetched.results.map(r=>[Number(r.id),r]));
   if(productIds.some(id=>!lookup.has(id)))return err('One or more catalogue products are inactive or missing.',409);
   const requestId=clean(body.client_request_id,64);
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId))return err('Valid unique request ID required.');
   const dupe=await env.DB.prepare('SELECT id FROM stock_ops_documents WHERE created_by=? AND client_request_id=?').bind(ctx.member.email,requestId).first<{id:string}>();
   if(dupe)return out({ok:true,duplicate:true,document:await documentWithLines((await fetchDoc(dupe.id))!)});
   const id=crypto.randomUUID(),date=today(),code=kind==='SUPPLIER_RETURN'?'RTN':kind==='ADJUSTMENT'?'ADJ':kind==='TRANSFER'?'TRF':kind==='COUNT'?'CNT':'GRV';
   const number=`ST-${code}-${date}-${id.slice(0,8).toUpperCase()}`,now=new Date().toISOString();
   const statements=[env.DB.prepare(`INSERT INTO stock_ops_documents(id,document_number,client_request_id,kind,branch_name,destination_branch,status,external_reference,supplier,supplier_invoice,driver_name,time_in,time_out,labelled,labelled_by,notes,created_by,created_at,last_action_by)
     VALUES(?,?,?,?,?,?,'Draft',?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,number,requestId,kind,branch,dest,ref,supplier,invoice,clean(body.driver_name),clean(body.time_in,12),clean(body.time_out,12),body.labelled==='Yes'?'Yes':'No',clean(body.labelled_by),clean(body.notes,600),ctx.member.email,now,ctx.member.email),
     ...lines.map((line,i)=>{const p=lookup.get(line.catalogue_product_id)!;return env.DB.prepare('INSERT INTO stock_ops_document_lines(document_id,line_no,catalogue_product_id,product_code,product_name,unit,document_quantity,expected_quantity,rejected_quantity,reason) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(id,i+1,p.id,p.code,p.name,'EA',line.document_quantity,line.expected_quantity,line.rejected_quantity,line.reason);})];
   await env.DB.batch(statements);
   return out({ok:true,document:await documentWithLines((await fetchDoc(id))!)},201);
  }
  if(['submit','approve','reject','receive'].includes(action)){
   const doc=await fetchDoc(clean(body.id,80));if(!doc)return err('Document not found.',404);
   if(!accessibleDocument(ctx,doc))return err('You cannot access this branch document.',403);
   const branch=String(doc.branch_name||''),dest=String(doc.destination_branch||''),reviewer=String(doc.reviewed_by||''),kind=String(doc.kind||''),creator=String(doc.created_by||''),actor=ctx.member.email;
   if(!canTransition(String(doc.status),action,kind,creator,actor,reviewer))return err('Action not permitted for this document status or employee.',409);
   if(action==='submit'&&creator!==actor)return err('Only the author submits the draft.',403);
   if((action==='approve'||action==='reject')&&!permission(ctx,branch).manager)return err('An authorised branch manager must review.',403);
   if(action==='receive'){const destRights=permission(ctx,dest);
    if(!destRights.exists||!(destRights.manager||['Receiving / GRV','DC / Transfers'].includes(destRights.duty)))return err('Only authorised destination receiving or transfer staff can acknowledge this transfer.',403);}
   const status=action==='submit'?'Submitted':action==='approve'?'Approved':action==='reject'?'Rejected':'Received';
   const now=new Date().toISOString(),note=clean(body.note,600);
   if((action==='reject'||action==='receive')&&!note)return err('Enter a rejection reason or receipt acknowledgement.');
   const result=await env.DB.prepare(`UPDATE stock_ops_documents SET status=?,last_action_by=?,decision_note=?,submitted_at=CASE WHEN ?='Submitted' THEN ? ELSE submitted_at END,
       reviewed_by=CASE WHEN ? IN ('Approved','Rejected') THEN ? ELSE reviewed_by END,
       reviewed_at=CASE WHEN ? IN ('Approved','Rejected') THEN ? ELSE reviewed_at END,
       received_by=CASE WHEN ?='Received' THEN ? ELSE received_by END,
       received_at=CASE WHEN ?='Received' THEN ? ELSE received_at END
       WHERE id=? AND status=? RETURNING *`)
      .bind(status,actor,note,status,now,status,actor,status,now,status,actor,status,now,doc.id,doc.status).first<Row>();
   if(!result)return err('Document changed. Refresh before continuing.',409);
   return out({ok:true,document:await documentWithLines(result)});
  }
  return err('Unknown stock operations action.');
 }catch(e){
  const message=e instanceof Error?e.message:'Unexpected error';
  if(message.includes('UNIQUE constraint')||message.includes('unique constraint'))return err('Duplicate submission detected. Refresh the register.',409);
  if(message.includes('Invalid stock document transition'))return err('The document changed or requires a different approver.',409);
  if(['Both transfer branches must be activated','Cannot post a stock document','Missing verified opening balance','Destination SKU has no opening balance','Stock changed since counted','Insufficient available stock','Cannot receive old transfer','Missing destination opening balances'].some(s=>message.includes(s)))return err(message,409);
  if(message.includes('Stock operations')||message.includes('Quantit')||message.includes('document type')||message.includes('catalogue')||message.includes('Rejected')||message.includes('Give a reason')||message.includes('Select 1'))return err(message);
  return err('Stock document was not saved. Check migration and branch access.',500);
 }
}
