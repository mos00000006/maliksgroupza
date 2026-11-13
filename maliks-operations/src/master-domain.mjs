// Phase 15: independent branch-scoped master-file administration.
// These records do NOT post stock, payments, VAT, customer balances or GL journals.
import { matchingBranch, limitSearch } from './policy.mjs';

export const MASTER_KINDS = Object.freeze(['stock','supplier','debtor']);
const MASTER_ROLES = Object.freeze({
  stock: ['Stock Controller','Warehouse Manager','Warehouse Management','Purchasing Manager','Buyer'],
  supplier: ['Purchasing Manager','Buyer','Finance Manager','Creditors Clerk'],
  debtor: ['Finance Manager','Debtors Clerk','Credit Controller'],
});
const MANAGERS = new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager']);
const HEADERS = {'cache-control':'no-store','x-content-type-options':'nosniff'};
const json = (value,status=200)=>Response.json(value,{status,headers:HEADERS});
const fail = (message,status=400)=>json({error:message},status);

export function canUseManagement(member){
  if(!member||Number(member.active)!==1)return false;
  if(MANAGERS.has(member.role))return true;
  if(member.role==='Executive / EXCO'&&member.access_scope==='Full company')return true;
  return Object.values(MASTER_ROLES).some(roles=>roles.includes(member.role));
}
export function canUseMaster(member,kind,write=false){
  if(!MASTER_KINDS.includes(kind)||!canUseManagement(member))return false;
  if(MANAGERS.has(member.role))return true;
  if(member.role==='Executive / EXCO'&&member.access_scope==='Full company')return !write;
  return MASTER_ROLES[kind].includes(member.role);
}
const str=(value,name,max,required=false)=>{
  if(typeof value!=='string')throw Error(name+' must be text.');
  const s=value.trim();
  if((required&&!s)||s.length>max||/[\u0000-\u001f\u007f]/.test(s))throw Error('Invalid '+name+'.');
  return s;
};
const int=(value,name,max)=>{
  if(!Number.isSafeInteger(value)||value<0||value>max)throw Error('Invalid '+name+'.');
  return value;
};
const email=value=>{
  const e=str(value,'email',150).toLowerCase();
  if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))throw Error('Invalid email address.');
  return e;
};
const uuid=value=>{
  if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))throw Error('Invalid request ID.');
  return value.toLowerCase();
};
const detailsFor=(kind,raw)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid master-file details.');
  if(kind==='stock')return {
    unit:str(raw.unit,'unit',24,true),category:str(raw.category,'category',80),barcode:str(raw.barcode,'barcode',64),
    cost_cents:int(raw.cost_cents,'cost',100000000000),selling_price_cents:int(raw.selling_price_cents,'selling price',100000000000),
    reorder_min:int(raw.reorder_min,'minimum stock level',100000000),
  };
  if(kind==='supplier')return {
    contact_name:str(raw.contact_name,'contact',120),phone:str(raw.phone,'phone',40),email:email(raw.email),
    vat_number:str(raw.vat_number,'VAT number',40),payment_terms_days:int(raw.payment_terms_days,'payment terms',365),
  };
  return {
    contact_name:str(raw.contact_name,'contact',120),phone:str(raw.phone,'phone',40),email:email(raw.email),
    credit_limit_cents:int(raw.credit_limit_cents,'credit limit',100000000000),payment_terms_days:int(raw.payment_terms_days,'payment terms',365),
  };
};
export function validateMasterInput(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid master-file request.');
  if(!MASTER_KINDS.includes(raw.kind))throw Error('Invalid master-file type.');
  const existingCatalogueStock=raw.kind==='stock'&&Number.isSafeInteger(raw.id)&&raw.id>0;
  const code=str(raw.code,'code',existingCatalogueStock?160:40,true).toUpperCase();
  if(!existingCatalogueStock&&!/^[A-Z0-9][A-Z0-9._/-]{0,39}$/.test(code))throw Error('Code must use letters, numbers, dash, slash, dot or underscore.');
  if(typeof raw.active!=='boolean')throw Error('Active status must be selected.');
  const data={kind:raw.kind,branch:str(raw.branch,'branch',150,true),code,
    name:str(raw.name,'name',existingCatalogueStock?255:160,true),active:raw.active?1:0,
    details:detailsFor(raw.kind,raw.details),request_id:uuid(raw.request_id)};
  if(raw.id!==undefined&&raw.id!==null){
    if(!Number.isSafeInteger(raw.id)||raw.id<1)throw Error('Invalid record ID.');
    if(!Number.isSafeInteger(raw.version)||raw.version<1)throw Error('Invalid record version.');
    data.id=raw.id;data.version=raw.version;
  }
  return data;
}
const snapshot=(r)=>({id:r.id,kind:r.kind,branch:r.branch,code:r.code,name:r.name,
  active:Boolean(r.active),details:typeof r.details_json==='string'?JSON.parse(r.details_json):r.details,
  version:r.version,updated_at:r.updated_at});
const recordForClient=snapshot;
const readKindAndBranch=(req,context)=>{
  const p=new URL(req.url).searchParams;
  const kind=p.get('kind');
  if(!MASTER_KINDS.includes(kind))throw Error('Select a valid master file.');
  const branch=matchingBranch(context.branches,p.get('branch'));
  if(!branch)throw Error('Branch access denied.');
  if(!canUseMaster(context.member,kind))throw Error('Master-file permission denied.');
  return {kind,branch,params:p};
};
const hashPayload=async payload=>{
  const raw=JSON.stringify(payload);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
};

export async function listMasterRecords(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  let kind,branch,params;
  try{({kind,branch,params}=readKindAndBranch(req,context));}catch(e){return fail(e.message,403);}
  const q=limitSearch(params.get('q')||'');
  if(q===null)return fail('Search is too long.');
  const term=q.toLowerCase();
  if(kind==='stock'){
    // Hub catalogue is the one and only product list. The branch master is an overlay
    // for operational settings and the stable stock_master_id used by PO/GRV/transfer.
    const page=Math.min(10000,Math.max(1,Number.parseInt(params.get('page')||'1',10)||1));
    const {total}=await env.DB.prepare(`SELECT COUNT(*) AS total FROM catalogue_products p WHERE p.active=1
      AND (?='' OR instr(lower(p.code),?)>0 OR instr(lower(p.name),?)>0 OR instr(lower(p.category),?)>0)`)
      .bind(term,term,term,term).first();
    const tagTable=/buster\s*build/i.test(branch)?'busterbuild_price_tags':'powerbuild_price_tags';
    const brand=/buster\s*build/i.test(branch)?'busterbuild':'powerbuild';
    const {results}=await env.DB.prepare(`SELECT p.id AS catalogue_id,p.code,p.name,p.category,p.updated_at,
      CASE WHEN t.product_id IS NULL THEN 0 ELSE COALESCE(bp.price_cents,t.price_cents,0) END AS hub_price_cents,COALESCE(t.unit,'EA') AS hub_unit,
      m.id,m.kind,m.branch,m.active,m.details_json,m.version,m.updated_at AS master_updated_at
      FROM catalogue_products p LEFT JOIN maliks_pos_master_records m
        ON m.kind='stock' AND lower(m.branch)=lower(?) AND lower(m.code)=lower(p.code)
      LEFT JOIN ${tagTable} t ON t.product_id=p.id AND t.published=1
      LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
      WHERE p.active=1 AND (?='' OR instr(lower(p.code),?)>0 OR instr(lower(p.name),?)>0 OR instr(lower(p.category),?)>0)
      ORDER BY p.name,p.id LIMIT 100 OFFSET ?`).bind(branch,brand,branch,term,term,term,term,(page-1)*100).all();
    const records=results.map(r=>({id:r.id??null,kind:'stock',branch,code:r.code,name:r.name,
      active:r.id?Boolean(r.active):true,linked:Boolean(r.id),catalogue_id:r.catalogue_id,
      category:r.category,details:{...(r.details_json?JSON.parse(r.details_json):{unit:r.hub_unit,barcode:'',cost_cents:0,reorder_min:0}),
        category:r.category,selling_price_cents:Number(r.hub_price_cents)},
      version:r.version||0,updated_at:r.master_updated_at||r.updated_at}));
    return json({kind,branch,records,total:Number(total),page,page_size:100,pages:Math.max(1,Math.ceil(Number(total)/100)),catalogue_source:true});
  }
  const {results}=await env.DB.prepare(`SELECT id,kind,branch,code,name,active,details_json,version,updated_at
    FROM maliks_pos_master_records WHERE kind=? AND lower(branch)=lower(?)
    AND (?='' OR instr(lower(code),?)>0 OR instr(lower(name),?)>0)
    ORDER BY name LIMIT 100`).bind(kind,branch,term,term,term).all();
  return json({kind,branch,records:results.map(recordForClient)});
}
export async function listMasterAudit(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  let kind,branch;
  try{({kind,branch}=readKindAndBranch(req,context));}catch(e){return fail(e.message,403);}
  const {results}=await env.DB.prepare(`SELECT id,record_id,kind,branch,action,actor_email,actor_name,created_at,before_json,after_json
    FROM maliks_pos_master_audit WHERE kind=? AND lower(branch)=lower(?) ORDER BY id DESC LIMIT 50`)
    .bind(kind,branch).all();
  return json({kind,branch,audit:results.map(r=>({...r,before:r.before_json?JSON.parse(r.before_json):null,
    after:r.after_json?JSON.parse(r.after_json):null,before_json:undefined,after_json:undefined}))});
}
export async function listMasterCatalogue(req,env,context){
  if(context.app!=='management'||!canUseMaster(context.member,'stock'))return fail('Stock master access denied.',403);
  const params=new URL(req.url).searchParams;
  const branch=matchingBranch(context.branches,params.get('branch'));
  if(!branch)return fail('Branch access denied.',403);
  const q=limitSearch(params.get('q')||'');
  if(q===null)return fail('Search is too long.');
  if(q.length<2)return json({branch,products:[],read_only:true});
  const term=q.toLowerCase();
  const {results}=await env.DB.prepare(`SELECT p.id,p.code,p.name,p.category FROM catalogue_products p
    WHERE p.active=1 AND (instr(lower(p.code),?)>0 OR instr(lower(p.name),?)>0)
    ORDER BY p.name LIMIT 100`).bind(term,term).all();
  return json({branch,products:results,read_only:true,stock_on_hand_available:false});
}
// An explicit, audited branch activation. No new catalogue products are created;
// existing branch records are never overwritten, and no stock balances are posted.
export async function syncStockCatalogue(req,env,context){
  if(context.app!=='management'||!canUseMaster(context.member,'stock',true))return fail('Stock master write permission denied.',403);
  if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))return fail('Invalid request origin.',403);
  let raw;try{const txt=await req.text();if(txt.length>2000)throw Error('Request too large.');raw=JSON.parse(txt);}catch{return fail('Invalid request.');}
  let id;try{id=uuid(raw?.request_id);}catch(e){return fail(e.message);}
  const branch=matchingBranch(context.branches,raw?.branch);
  if(!branch)return fail('Branch access denied.',403);
  const duplicate=await env.DB.prepare(`SELECT lower(code) AS code,COUNT(*) AS n FROM catalogue_products
    WHERE active=1 GROUP BY lower(code) HAVING COUNT(*)>1 LIMIT 1`).first();
  if(duplicate)return fail('Duplicate catalogue product code (case-insensitive): '+duplicate.code+'. Resolve duplicates in Hub before linking.',409);
  const actor=context.member.email.toLowerCase(),now=new Date().toISOString();
  const tagTable=/buster\s*build/i.test(branch)?'busterbuild_price_tags':'powerbuild_price_tags';
  const before=await env.DB.prepare(`SELECT COUNT(*) AS n FROM maliks_pos_master_records WHERE kind='stock' AND lower(branch)=lower(?)`).bind(branch).first();
  // Unique (kind,branch,code) and deterministic create_request_id make repeated
  // activations safe, including concurrent attempts by different managers.
  const keyPrefix='HUB-CATALOGUE:'+branch.toLowerCase()+':';
  const hash='hub-catalogue-v1';
  const brand=/buster\s*build/i.test(branch)?'busterbuild':'powerbuild';
  try{await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_master_records
      (kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
      SELECT 'stock',?,p.code,p.name,1,
      json_object('unit',COALESCE(t.unit,'EA'),'category',p.category,'barcode','',
        'cost_cents',0,'selling_price_cents',CASE WHEN t.product_id IS NULL THEN 0 ELSE COALESCE(bp.price_cents,t.price_cents,0) END,'reorder_min',0),
      1,?,?,?,?,?||p.id,?,?||p.id
      FROM catalogue_products p LEFT JOIN ${tagTable} t ON t.product_id=p.id AND t.published=1
      LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
      WHERE p.active=1`).bind(branch,actor,actor,now,now,keyPrefix,hash,keyPrefix,brand,branch),
    env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_master_audit
      (request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
      SELECT m.create_request_id,'stock',m.branch,m.id,'CREATE',m.created_by_email,?,m.create_payload_hash,NULL,
      json_object('kind','stock','branch',m.branch,'code',m.code,'name',m.name,'active',1,
        'details',json(m.details_json),'version',1),m.created_at
      FROM maliks_pos_master_records m WHERE m.kind='stock' AND lower(m.branch)=lower(?)
        AND m.create_request_id LIKE 'HUB-CATALOGUE:%'`).bind(context.member.name,branch)
  ]);}catch(e){return fail('Catalogue activation failed. Check D1 migrations and catalogue tables: '+String(e.message||e).slice(0,160),409);}
  const after=await env.DB.prepare(`SELECT COUNT(*) AS n FROM maliks_pos_master_records WHERE kind='stock' AND lower(branch)=lower(?)`).bind(branch).first();
  return json({branch,linked:Number(after.n),newly_linked:Math.max(0,Number(after.n)-Number(before.n)),request_id:id,
    note:'Hub catalogue linked to this branch. No stock quantities or financial entries were posted.'});
}
export async function saveMasterRecord(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))return fail('Invalid request origin.',403);
  const raw=await req.text();
  if(raw.length>12000)return fail('Request too large.',413);
  let data;
  try{data=validateMasterInput(JSON.parse(raw));}catch(e){return fail(e.message);}
  if(!canUseMaster(context.member,data.kind,true))return fail('You do not have write permission for this master file.',403);
  const branch=matchingBranch(context.branches,data.branch);
  if(!branch)return fail('Branch access denied.',403);
  data.branch=branch;
  if(data.kind==='stock'){
    // Never accept a new product identity from POS: Hub owns product codes,
    // names and departments. POS may only maintain branch operational settings.
    const product=await env.DB.prepare(`SELECT code,name,category FROM catalogue_products
      WHERE lower(code)=lower(?) AND active=1 LIMIT 1`).bind(data.code).first();
    if(!product)return fail('Stock item is not in the active Group Hub catalogue. Add it in Hub first.',409);
    data.code=product.code;data.name=product.name;data.details.category=product.category;
    const tagTable=/buster\s*build/i.test(branch)?'busterbuild_price_tags':'powerbuild_price_tags';
    const brand=/buster\s*build/i.test(branch)?'busterbuild':'powerbuild';
    const hubPrice=await env.DB.prepare(`SELECT CASE WHEN t.product_id IS NULL THEN 0 ELSE COALESCE(bp.price_cents,t.price_cents,0) END AS price_cents
      FROM catalogue_products p LEFT JOIN ${tagTable} t ON t.product_id=p.id AND t.published=1
      LEFT JOIN price_tag_branch_prices bp ON bp.product_id=p.id AND bp.brand=? AND lower(bp.branch_name)=lower(?)
      WHERE lower(p.code)=lower(?) AND p.active=1 LIMIT 1`).bind(brand,branch,data.code).first();
    data.details.selling_price_cents=Number(hubPrice?.price_cents||0);
    if(data.id!==undefined){
      const linked=await env.DB.prepare(`SELECT code FROM maliks_pos_master_records WHERE id=? AND kind='stock' AND lower(branch)=lower(?)`).bind(data.id,branch).first();
      if(!linked||linked.code.toLowerCase()!==product.code.toLowerCase())return fail('Stock code cannot be changed. Edit the product in Group Hub.',409);
    }
  }
  const actor=context.member.email.toLowerCase();
  const actorName=context.member.name;
  const now=new Date().toISOString();
  const hash=await hashPayload({kind:data.kind,branch:data.branch,code:data.code,name:data.name,
    active:data.active,details:data.details,id:data.id??null,version:data.version??null});
  const detailsJson=JSON.stringify(data.details);
  if(data.id===undefined){
    // INSERT and audit record commit atomically. Code and request IDs are unique.
    await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_master_records
        (kind,branch,code,name,active,details_json,version,created_by_email,updated_by_email,created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
        VALUES (?,?,?,?,?,?,1,?,?,?,?,?,?,?)`).bind(data.kind,branch,data.code,data.name,data.active,detailsJson,
        actor,actor,now,now,data.request_id,hash,data.request_id),
      env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_master_audit
        (request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
        SELECT ?,kind,branch,id,'CREATE',?,?,?,?,?,? FROM maliks_pos_master_records
        WHERE create_request_id=? AND created_by_email=?`)
        .bind(data.request_id,actor,actorName,hash,null,JSON.stringify({kind:data.kind,branch,code:data.code,name:data.name,active:Boolean(data.active),details:data.details,version:1}),now,data.request_id,actor),
    ]);
    const saved=await env.DB.prepare('SELECT * FROM maliks_pos_master_records WHERE create_request_id=?').bind(data.request_id).first();
    if(!saved)return fail('Code already exists for this branch. Choose a unique code.',409);
    if(saved.create_payload_hash!==hash||saved.created_by_email!==actor)return fail('Request ID has already been used.',409);
    return json({record:recordForClient(saved)});
  }
  const prior=await env.DB.prepare('SELECT * FROM maliks_pos_master_records WHERE id=? AND kind=? AND lower(branch)=lower(?)')
    .bind(data.id,data.kind,branch).first();
  if(!prior)return fail('Record not found for this branch.',404);
  const replay=await env.DB.prepare('SELECT * FROM maliks_pos_master_audit WHERE request_id=?').bind(data.request_id).first();
  if(replay){
    if(replay.record_id!==data.id||replay.actor_email!==actor||replay.payload_hash!==hash)return fail('Request ID already used.',409);
    return json({record:JSON.parse(replay.after_json),duplicate:true});
  }
  if(prior.version!==data.version)return fail('This record changed. Refresh before saving.',409);
  const after={id:data.id,kind:data.kind,branch,code:data.code,name:data.name,active:Boolean(data.active),
    details:data.details,version:data.version+1,updated_at:now};
  // The audit INSERT is conditional on last_request_id matching this successful UPDATE.
  // D1 batch transactions roll back both statements if either fails.
  let outcomes;try{outcomes=await env.DB.batch([
    env.DB.prepare(`UPDATE maliks_pos_master_records SET code=?,name=?,active=?,details_json=?,version=version+1,
      updated_by_email=?,updated_at=?,last_request_id=?
      WHERE id=? AND kind=? AND lower(branch)=lower(?) AND version=?
      AND NOT EXISTS(SELECT 1 FROM maliks_pos_master_audit WHERE request_id=?)`)
      .bind(data.code,data.name,data.active,detailsJson,actor,now,data.request_id,
        data.id,data.kind,branch,data.version,data.request_id),
    env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_master_audit
      (request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
      SELECT ?,kind,branch,id,'UPDATE',?,?,?,?,?,? FROM maliks_pos_master_records
      WHERE id=? AND kind=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
      .bind(data.request_id,actor,actorName,hash,JSON.stringify(snapshot(prior)),JSON.stringify(after),now,
        data.id,data.kind,branch,data.version+1,data.request_id),
  ]);}catch(error){if(/UNIQUE constraint failed/i.test(String(error)))return fail('Code already exists for this branch.',409);throw error;}
  if(Number(outcomes?.[0]?.meta?.changes)!==1)return fail('This record changed. Refresh before saving.',409);
  return json({record:after});
}
