// Phase 54 — branch-scoped Back Office setup registers; no financial posting.
import {matchingBranch,limitSearch} from './policy.mjs';
import {canUseManagement} from './master-domain.mjs';

export const BACKOFFICE_MASTER_KINDS=Object.freeze({
 till:'Tills', drawing_expense:'Till Drawings Expenses', payment_type:'Payment Types',
 coinage:'Coinage',free_voucher_reference:'Cash Sales Transaction Numbers Free Voucher',
});
const WRITERS=new Set(['Owner / Admin','Developer / Technical Admin','Operations Manager','Store Manager','Regional Manager','Finance Manager']);
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(x,s=200)=>Response.json(x,{status:s,headers});
const fail=(s,c=400)=>json({error:s},c);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const codeRx=/^[A-Z0-9][A-Z0-9._/-]{0,31}$/;
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const text=(input,label,max,required)=>{
 if(typeof input!=='string')throw Error('Invalid '+label+'.');
 const result=input.trim();
 if((required&&!result)||result.length>max||/[\u0000-\u001f\u007f]/.test(result))throw Error('Invalid '+label+'.');
 return result;
};
const record=r=>({id:r.id,branch:r.branch,kind:r.kind,code:r.code,name:r.name,notes:r.notes,
 active:Number(r.active)===1,version:r.version,updated_by:r.updated_by,updated_at:r.updated_at});
const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),x=>x.toString(16).padStart(2,'0')).join('');
function scope(req,context,write=false){
 if(context?.app!=='management'||!canUseManagement(context?.member))throw Error('Back Office management access denied.');
 if(write&&!WRITERS.has(context.member.role))throw Error('Back Office changes require an authorised manager.');
 const p=new URL(req.url).searchParams,kind=p.get('kind');
 if(!own(BACKOFFICE_MASTER_KINDS,kind))throw Error('Invalid Back Office master type.');
 const branch=matchingBranch(context.branches,p.get('branch'));
 if(!branch)throw Error('Branch access denied.');
 return {kind,branch,params:p};
}
function validate(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||!own(BACKOFFICE_MASTER_KINDS,data.kind))throw Error('Invalid master type.');
 const code=text(data.code,'code',32,true).toUpperCase();
 if(!codeRx.test(code))throw Error('Codes must use letters, numbers, dash, underscore, slash or dot.');
 const name=text(data.name,'name',120,true),notes=text(data.notes??'','notes',250,false);
 if(typeof data.active!=='boolean'||typeof data.request_id!=='string'||!uuid.test(data.request_id))throw Error('Invalid status or request ID.');
 const output={kind:data.kind,branch:text(data.branch,'branch',150,true),code,name,notes,active:data.active?1:0,request_id:data.request_id.toLowerCase()};
 if(data.id!==undefined){
  if(!Number.isSafeInteger(data.id)||data.id<1||!Number.isSafeInteger(data.version)||data.version<1)throw Error('Invalid record version.');
  output.id=data.id;output.version=data.version;
 }
 return output;
}
export async function listBackofficeMasters(req,env,context){
 let s;try{s=scope(req,context);}catch(e){return fail(e.message,403);}
 const q=limitSearch(s.params.get('q')||'');if(q===null)return fail('Search is too long.');
 const pattern='%'+q.toLowerCase().replace(/[\\%_]/g,'\\$&')+'%';
 const {results}=await env.DB.prepare(`SELECT * FROM maliks_backoffice_master WHERE lower(branch)=lower(?) AND kind=?
  AND (lower(code) LIKE ? ESCAPE '\\' OR lower(name) LIKE ? ESCAPE '\\') ORDER BY code LIMIT 150`)
  .bind(s.branch,s.kind,pattern,pattern).all();
 return json({kind:s.kind,branch:s.branch,writable:WRITERS.has(context.member.role),
  operational_only:true,items:(results||[]).map(record)});
}
export async function listBackofficeMasterAudit(req,env,context){
 let s;try{s=scope(req,context);}catch(e){return fail(e.message,403);}
 const {results}=await env.DB.prepare(`SELECT id,request_id,kind,master_id,action,actor_email,created_at,before_json,after_json
 FROM maliks_backoffice_master_audit WHERE lower(branch)=lower(?) AND kind=? ORDER BY id DESC LIMIT 50`)
 .bind(s.branch,s.kind).all();
 return json({branch:s.branch,kind:s.kind,items:results||[]});
}
export async function saveBackofficeMaster(req,env,context){
 if(context?.app!=='management'||!WRITERS.has(context?.member?.role))return fail('Back Office manager access required.',403);
 let v;try{v=validate(await req.json());}catch(e){return fail(e.message);}
 const branch=matchingBranch(context.branches,v.branch);if(!branch)return fail('Branch access denied.',403);
 const actor=context.member.email.toLowerCase();
 const normalized={kind:v.kind,branch,code:v.code,name:v.name,notes:v.notes,active:v.active,id:v.id??null,version:v.version??null};
 const fingerprint=await hash(normalized);
 const existing=await env.DB.prepare('SELECT * FROM maliks_backoffice_master_audit WHERE request_id=?').bind(v.request_id).first();
 if(existing)return existing.request_hash===fingerprint?json({item:JSON.parse(existing.after_json),replayed:true}):fail('Request ID already used with different details.',409);
 const now=new Date().toISOString();
 if(v.id===undefined){
  // D1 batch is a transaction: the master and audit entry commit together.
  // A duplicate code aborts the batch before the audit can be recorded.
  try{
   await env.DB.batch([
    env.DB.prepare(`INSERT INTO maliks_backoffice_master(branch,kind,code,name,notes,active,version,updated_by,updated_at)
      VALUES(?,?,?,?,?,?,1,?,?)`).bind(branch,v.kind,v.code,v.name,v.notes,v.active,actor,now),
    env.DB.prepare(`INSERT INTO maliks_backoffice_master_audit
      (request_id,request_hash,branch,kind,master_id,action,actor_email,created_at,before_json,after_json)
      SELECT ?,?,?,?,id,'CREATE',?,?,NULL,json_object('id',id,'branch',branch,'kind',kind,'code',code,'name',name,'notes',notes,'active',active,'version',version,'updated_by',updated_by,'updated_at',updated_at)
      FROM maliks_backoffice_master WHERE lower(branch)=lower(?) AND kind=? AND code=?`)
      .bind(v.request_id,fingerprint,branch,v.kind,actor,now,branch,v.kind,v.code)
   ]);
  }catch(e){
   const prior=await env.DB.prepare('SELECT * FROM maliks_backoffice_master_audit WHERE request_id=?').bind(v.request_id).first();
   if(prior&&prior.request_hash===fingerprint)return json({item:{...JSON.parse(prior.after_json),active:!!JSON.parse(prior.after_json).active},replayed:true});
   return fail('Duplicate code, conflicting request or audit failure. No master record was changed.',409);
  }
  const row=await env.DB.prepare(`SELECT * FROM maliks_backoffice_master WHERE lower(branch)=lower(?) AND kind=? AND code=?`).bind(branch,v.kind,v.code).first();
  return json({item:record(row)},201);
 }
 const before=await env.DB.prepare('SELECT * FROM maliks_backoffice_master WHERE id=? AND lower(branch)=lower(?) AND kind=?').bind(v.id,branch,v.kind).first();
 if(!before)return fail('Record not found in this branch.',404);
 if(before.version!==v.version)return fail('Record changed; refresh and retry.',409);
 if(before.code!==v.code)return fail('Codes cannot be changed after creation; deactivate and create another.',409);
 const afterSnap={...record(before),name:v.name,notes:v.notes,active:!!v.active,version:v.version+1,updated_by:actor,updated_at:now};
 try{
  const responses=await env.DB.batch([
   env.DB.prepare(`UPDATE maliks_backoffice_master SET name=?,notes=?,active=?,version=version+1,updated_by=?,updated_at=?
     WHERE id=? AND lower(branch)=lower(?) AND kind=? AND version=?`).bind(v.name,v.notes,v.active,actor,now,v.id,branch,v.kind,v.version),
   env.DB.prepare(`INSERT INTO maliks_backoffice_master_audit
     (request_id,request_hash,branch,kind,master_id,action,actor_email,created_at,before_json,after_json)
     SELECT ?,?,?,?,id,'UPDATE',?,?,?,? FROM maliks_backoffice_master
     WHERE id=? AND lower(branch)=lower(?) AND kind=? AND version=? AND updated_by=? AND updated_at=?`)
     .bind(v.request_id,fingerprint,branch,v.kind,actor,now,JSON.stringify(record(before)),JSON.stringify(afterSnap),v.id,branch,v.kind,v.version+1,actor,now)
  ]);
  if(Number(responses[0]?.meta?.changes)!==1||Number(responses[1]?.meta?.changes)!==1)return fail('Concurrent change; refresh and retry.',409);
 }catch(e){
  const prior=await env.DB.prepare('SELECT * FROM maliks_backoffice_master_audit WHERE request_id=?').bind(v.request_id).first();
  if(prior&&prior.request_hash===fingerprint)return json({item:{...JSON.parse(prior.after_json),active:!!JSON.parse(prior.after_json).active},replayed:true});
  return fail('Concurrent edit or audit conflict; refresh and retry.',409);
 }
 return json({item:afterSnap});
}
