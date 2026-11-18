// Phase 27 — branch-scoped operational reference masters (no financial or stock posting).
import {matchingBranch,limitSearch} from './policy.mjs';
import {canUseMaster} from './master-domain.mjs';

export const REFERENCE_KINDS=Object.freeze({
  debtor_category:'debtor',debtor_classification:'debtor',
  supplier_category:'supplier',supplier_classification:'supplier',
  supplier_claim:'supplier',supplier_return_reason:'supplier',supplier_statement_recon_reason:'supplier',
  region:'debtor',area:'debtor',delivery_method:'debtor',
  debtor_route:'debtor',debtor_return_reason:'debtor',
  debtor_invoice_classification:'debtor',debtor_invoice_note:'debtor',
});
// Phase 29 kinds are stored separately: the existing Phase 27 table has a kind CHECK
// constraint, so never rebuild that live table or risk disturbing existing data.
const SUPPLIER_EXTRA_KINDS=new Set(['supplier_claim','supplier_return_reason','supplier_statement_recon_reason']);
const EXTRA_KINDS=new Set(['debtor_route','debtor_return_reason','debtor_invoice_classification','debtor_invoice_note']);
const referenceTable=kind=>SUPPLIER_EXTRA_KINDS.has(kind)?'maliks_pos_supplier_extra_masters':EXTRA_KINDS.has(kind)?'maliks_pos_debtor_extra_masters':'maliks_pos_reference_masters';
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const ok=(value,status=200)=>Response.json(value,{status,headers});
const fail=(message,status=400)=>ok({error:message},status);
const codePattern=/^[A-Z0-9][A-Z0-9._/-]{0,31}$/;
const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const str=(v,label,max,required=false)=>{
  if(typeof v!=='string')throw Error('Invalid '+label+'.');
  const value=v.trim();
  if((required&&!value)||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw Error('Invalid '+label+'.');
  return value;
};
const snapshot=r=>({id:Number(r.id),kind:r.kind,branch:r.branch,code:r.code,name:r.name,
  description:r.description,active:Number(r.active)===1,version:Number(r.version),
  parent_region_id:r.parent_region_id==null?null:Number(r.parent_region_id),updated_at:r.updated_at});
const payloadHash=async x=>{
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x)));
  return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
};
const readScope=(req,context,write=false)=>{
  const params=new URL(req.url).searchParams,kind=params.get('kind');
  if(!Object.hasOwn(REFERENCE_KINDS,kind))throw Error('Select a valid reference master.');
  const branch=matchingBranch(context.branches,params.get('branch'));
  if(!branch)throw Error('Branch access denied.');
  if(!canUseMaster(context.member,REFERENCE_KINDS[kind],write))throw Error('Master-file permission denied.');
  return {params,kind,branch};
};
function validate(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid reference master request.');
  const kind=raw.kind;
  if(!Object.hasOwn(REFERENCE_KINDS,kind))throw Error('Invalid reference master type.');
  const code=str(raw.code,'code',32,true).toUpperCase();
  if(!codePattern.test(code))throw Error('Code must start with a letter/number and use only letters, numbers, dot, slash, dash or underscore.');
  if(kind==='debtor_invoice_note'&&!String(raw.description||'').trim())throw Error('Enter the invoice note text.');
  if(typeof raw.active!=='boolean')throw Error('Select an active/inactive status.');
  if(typeof raw.request_id!=='string'||!uuidPattern.test(raw.request_id))throw Error('Invalid request ID.');
  const data={kind,branch:str(raw.branch,'branch',150,true),code,name:str(raw.name,'name',120,true),
    description:str(raw.description??'','description',kind==='debtor_invoice_note'?1000:250),active:raw.active?1:0,
    request_id:raw.request_id.toLowerCase(),parent_region_id:null};
  if(kind==='area'){
    if(!Number.isSafeInteger(raw.parent_region_id)||raw.parent_region_id<1)throw Error('Select a region for this area.');
    data.parent_region_id=raw.parent_region_id;
  }else if(raw.parent_region_id!==undefined&&raw.parent_region_id!==null){throw Error('Only areas may be assigned to a region.');}
  if(raw.id!==undefined&&raw.id!==null){
    if(!Number.isSafeInteger(raw.id)||raw.id<1||!Number.isSafeInteger(raw.version)||raw.version<1)throw Error('Invalid record version.');
    data.id=raw.id;data.version=raw.version;
  }
  return data;
}
export async function listReferences(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  let scope;try{scope=readScope(req,context);}catch(e){return fail(e.message,403);}
  const {kind,branch,params}=scope;
  const table=referenceTable(kind);
  const q=limitSearch(params.get('q')||'');if(q===null)return fail('Search is too long.');
  const term=q.toLowerCase();
  const {results}=await env.DB.prepare(`SELECT r.id,r.kind,r.branch,r.code,r.name,r.description,r.parent_region_id,
    r.active,r.version,r.updated_at,p.name AS region_name
    FROM ${table} r
    LEFT JOIN maliks_pos_reference_masters p ON p.id=r.parent_region_id
    WHERE r.kind=? AND lower(r.branch)=lower(?)
    AND (?='' OR instr(lower(r.code),?)>0 OR instr(lower(r.name),?)>0 OR instr(lower(r.description),?)>0)
    ORDER BY r.active DESC,r.name COLLATE NOCASE LIMIT 500`).bind(kind,branch,term,term,term,term).all();
  return ok({branch,kind,records:results.map(r=>({...snapshot(r),region_name:r.region_name||null}))});
}
export async function referenceAudit(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  let scope;try{scope=readScope(req,context);}catch(e){return fail(e.message,403);}
  const {kind,branch}=scope;
  const {results}=await env.DB.prepare(`SELECT action,actor_email,actor_name,before_json,after_json,created_at
    FROM maliks_pos_reference_audit WHERE kind=? AND lower(branch)=lower(?) ORDER BY id DESC LIMIT 50`)
    .bind(kind,branch).all();
  return ok({kind,branch,audit:results.map(r=>({action:r.action,actor_email:r.actor_email,actor_name:r.actor_name,
    before:r.before_json?JSON.parse(r.before_json):null,after:JSON.parse(r.after_json),created_at:r.created_at}))});
}
export async function saveReference(req,env,context){
  if(context.app!=='management')return fail('Management workspace required.',403);
  if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))return fail('Invalid request origin.',403);
  const raw=await req.text();if(raw.length>6000)return fail('Request too large.',413);
  let data;try{data=validate(JSON.parse(raw));}catch(e){return fail(e.message,400);}
  if(!canUseMaster(context.member,REFERENCE_KINDS[data.kind],true))return fail('Write permission denied.',403);
  const branch=matchingBranch(context.branches,data.branch);if(!branch)return fail('Branch access denied.',403);
  data.branch=branch;
  const table=referenceTable(data.kind); // Safe, fixed whitelist: not user-controlled SQL.
  if(data.kind==='area'){
    const region=await env.DB.prepare(`SELECT id FROM maliks_pos_reference_masters
      WHERE id=? AND kind='region' AND lower(branch)=lower(?) AND active=1 LIMIT 1`)
      .bind(data.parent_region_id,branch).first();
    if(!region)return fail('Select an active region belonging to this branch.',409);
  }
  if(data.kind==='region'&&!data.active&&data.id!==undefined){
    const child=await env.DB.prepare(`SELECT id FROM maliks_pos_reference_masters WHERE kind='area'
      AND parent_region_id=? AND active=1 LIMIT 1`).bind(data.id).first();
    if(child)return fail('Deactivate the active areas in this region before deactivating the region.',409);
  }
  const actor=context.member.email.toLowerCase(),actorName=context.member.name,now=new Date().toISOString();
  const hash=await payloadHash({kind:data.kind,branch,code:data.code,name:data.name,description:data.description,
    active:data.active,parent_region_id:data.parent_region_id,id:data.id??null,version:data.version??null});
  if(data.id===undefined){
    const create=env.DB.prepare(`INSERT OR IGNORE INTO ${table}
      (kind,branch,code,name,description,parent_region_id,active,version,created_by_email,updated_by_email,
      created_at,updated_at,create_request_id,create_payload_hash,last_request_id)
      SELECT ?,?,?,?,?,?,?,1,?,?,?,?,?,?,? WHERE (?<>'area' OR EXISTS
       (SELECT 1 FROM maliks_pos_reference_masters p WHERE p.id=? AND p.kind='region' AND p.active=1 AND lower(p.branch)=lower(?)))`)
      .bind(data.kind,branch,data.code,data.name,data.description,data.parent_region_id,data.active,
        actor,actor,now,now,data.request_id,hash,data.request_id,data.kind,data.parent_region_id,branch);
    const audit=env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_reference_audit
      (request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
      SELECT ?,kind,branch,id,'CREATE',?,?,?,?,?,? FROM ${table}
      WHERE create_request_id=? AND created_by_email=?`)
      .bind(data.request_id,actor,actorName,hash,null,JSON.stringify({...data,active:Boolean(data.active),version:1}),now,data.request_id,actor);
    try{await env.DB.batch([create,audit]);}catch(e){if(/UNIQUE|constraint/i.test(String(e)))return fail('This code already exists for the branch.',409);throw e;}
    const saved=await env.DB.prepare(`SELECT * FROM ${table} WHERE create_request_id=?`).bind(data.request_id).first();
    if(!saved)return fail('Code already exists, or the parent region is no longer active. Refresh.',409);
    if(saved.create_payload_hash!==hash||saved.created_by_email!==actor)return fail('Request ID already used for another change.',409);
    return ok({record:snapshot(saved),duplicate:Number(saved.version)>1});
  }
  const replay=await env.DB.prepare('SELECT * FROM maliks_pos_reference_audit WHERE request_id=?').bind(data.request_id).first();
  if(replay){
    if(Number(replay.record_id)!==data.id||replay.kind!==data.kind||replay.actor_email!==actor||replay.payload_hash!==hash)
      return fail('Request ID was used for another change.',409);
    return ok({record:JSON.parse(replay.after_json),duplicate:true});
  }
  const prior=await env.DB.prepare(`SELECT * FROM ${table} WHERE id=? AND kind=? AND lower(branch)=lower(?)`)
    .bind(data.id,data.kind,branch).first();
  if(!prior)return fail('Reference record not found in this branch.',404);
  if(Number(prior.version)!==data.version)return fail('Record changed. Refresh before editing.',409);
  const after={id:data.id,kind:data.kind,branch,code:data.code,name:data.name,description:data.description,
    active:Boolean(data.active),parent_region_id:data.parent_region_id,version:data.version+1,updated_at:now};
  const update=env.DB.prepare(`UPDATE ${table} SET code=?,name=?,description=?,active=?,parent_region_id=?,
    version=version+1,updated_by_email=?,updated_at=?,last_request_id=?
    WHERE id=? AND kind=? AND lower(branch)=lower(?) AND version=?
    AND NOT EXISTS(SELECT 1 FROM maliks_pos_reference_audit WHERE request_id=?)
    AND (?<>'area' OR EXISTS(SELECT 1 FROM maliks_pos_reference_masters p
      WHERE p.id=? AND p.kind='region' AND p.active=1 AND lower(p.branch)=lower(?)))
    AND (?<>'region' OR ?>0 OR NOT EXISTS(SELECT 1 FROM maliks_pos_reference_masters a
      WHERE a.kind='area' AND a.parent_region_id=? AND a.active=1))`)
      .bind(data.code,data.name,data.description,data.active,data.parent_region_id,actor,now,data.request_id,
        data.id,data.kind,branch,data.version,data.request_id,
        data.kind,data.parent_region_id,branch,data.kind,data.active,data.id);
  const audit=env.DB.prepare(`INSERT OR IGNORE INTO maliks_pos_reference_audit
    (request_id,kind,branch,record_id,action,actor_email,actor_name,payload_hash,before_json,after_json,created_at)
    SELECT ?,kind,branch,id,'UPDATE',?,?,?,?,?,? FROM ${table}
    WHERE id=? AND kind=? AND lower(branch)=lower(?) AND version=? AND last_request_id=?`)
      .bind(data.request_id,actor,actorName,hash,JSON.stringify(snapshot(prior)),JSON.stringify(after),now,
        data.id,data.kind,branch,data.version+1,data.request_id);
  let outcomes;try{outcomes=await env.DB.batch([update,audit]);}
  catch(e){if(/UNIQUE|constraint/i.test(String(e)))return fail('Code already exists for this branch.',409);throw e;}
  if(Number(outcomes[0]?.meta?.changes)!==1)return fail('Record or region changed. Refresh and retry.',409);
  return ok({record:after});
}
