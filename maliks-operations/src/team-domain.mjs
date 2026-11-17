// Phase 19 — Maliks Member Team. Shared Hub team_members is authoritative.
// Never remove historical employees: active=0 revokes Core API authorisation on every request.
import { matchingBranch, canUseApp, APP_LOGIN_TARGETS } from './policy.mjs';

const ADMIN_ROLES = new Set(['Owner / Admin','Developer / Technical Admin']);
const MANAGER_ROLES = new Set(['Store Manager','Regional Manager','Operations Manager']);
export const STORE_STAFF_ROLES = Object.freeze([
  'Sales / Tills','Sales','Floor Sales','Sales Manager','Cashier','Till Operator',
  'Receiving Clerk','Receiving','GRV Clerk','Stock Controller',
  'Dispatch','Dispatcher','Checker','Driver'
]);
export const ADMIN_ASSIGNABLE_ROLES = Object.freeze([
  ...STORE_STAFF_ROLES,'Store Manager','Regional Manager','Operations Manager',
  'Warehouse Manager','Warehouse Management','Receiving Manager','Receiving Supervisor',
  'Purchasing Manager','Buyer','Cash Office','Cash Office Clerk','Cash Office Supervisor',
  'Cash Office Manager','Finance Manager','Creditors Clerk','Debtors Clerk','Credit Controller',
  'Dispatch Head','Dispatch Manager'
]);
const STORE_SET = new Set(STORE_STAFF_ROLES);
const ADMIN_SET = new Set(ADMIN_ASSIGNABLE_ROLES);
const HEADERS = {'cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
const fail=(message,status=400)=>json({error:message},status);
export const canManageTeam=member=>Boolean(member&&Number(member.active)===1&&(ADMIN_ROLES.has(member.role)||MANAGER_ROLES.has(member.role)));
export const canAssignRole=(actor,role)=>ADMIN_ROLES.has(actor?.role)?ADMIN_SET.has(role):MANAGER_ROLES.has(actor?.role)&&STORE_SET.has(role);
const text=(v,max,name)=>{
  if(typeof v!=='string')throw Error('Invalid '+name+'.');
  const s=v.trim();if(!s||s.length>max||/[\u0000-\u001f\u007f]/.test(s))throw Error('Invalid '+name+'.');
  return s;
};
const email=v=>{const s=text(v,150,'email').toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))throw Error('Invalid email.');return s;};
const requestId=v=>{if(typeof v!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v))throw Error('Invalid request ID.');return v.toLowerCase();};
const snapshot=r=>({id:r.id,name:r.name,email:r.email,role:r.role,branch:r.department,active:Number(r.active)===1});
const cleanActor=ctx=>String(ctx.member.email||'').toLowerCase();
const isAdmin=ctx=>ADMIN_ROLES.has(ctx.member.role);
const safeBranch=(ctx,b)=>matchingBranch(ctx.branches,b);
const safeContext=ctx=>ctx?.app==='member'&&canManageTeam(ctx.member);
const sha=async value=>{
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
};
const parseBody=async req=>{
  if(!req.headers.get('origin')||req.headers.get('origin')!==req.headers.get('x-maliks-original-origin'))throw Error('Invalid request origin.');
  const raw=await req.text();if(raw.length>3500)throw Error('Request too large.');
  let data;try{data=JSON.parse(raw);}catch{throw Error('Invalid JSON.');}
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid request.');
  return data;
};
const view=r=>({...snapshot(r)});

// Effective app access shown to team administrators; default is the existing job-role policy.
export async function listTeam(req,env,ctx){
  if(!safeContext(ctx))return fail('Team management access denied.',403);
  const branch=safeBranch(ctx,new URL(req.url).searchParams.get('branch'));
  if(!branch)return fail('Select an authorised store.',403);
  const {results}=await env.DB.prepare(`SELECT id,name,email,role,department,access_scope,workspace_access,active
    FROM team_members WHERE lower(department)=lower(?)
    ORDER BY active DESC,name COLLATE NOCASE LIMIT 500`).bind(branch).all();
  const byId=new Map(results.map(person=>[person.id,[]]));
  if(results.length){
    try{
      const marks=results.map(()=>'?').join(',');
      const {results:overrides}=await env.DB.prepare(`SELECT member_id,app,allowed
        FROM maliks_member_app_access WHERE member_id IN (${marks})`)
        .bind(...results.map(person=>person.id)).all();
      for(const row of overrides){if(byId.has(row.member_id))byId.get(row.member_id).push(row);}
    }catch(error){
      if(!/no such table: maliks_member_app_access/i.test(String(error?.message||error)))throw error;
      // Safe rollout: before migration, show the existing role-derived permissions.
    }
  }
  const staff=results.map(person=>{
    const current={...person,app_permissions:byId.get(person.id)||[]};
    return {...view(person),apps:APP_LOGIN_TARGETS.filter(x=>canUseApp(current,x.id)).map(x=>x.id),
      app_access_custom:current.app_permissions.length>0,
      app_access_locked:['Owner / Admin','Developer / Technical Admin'].includes(person.role)};
  });
  const {results:audits}=await env.DB.prepare(`SELECT action,member_email,actor_email,branch,created_at
    FROM maliks_member_team_audit WHERE lower(branch)=lower(?) ORDER BY id DESC LIMIT 30`).bind(branch).all();
  return json({branch,staff,audit:audits,apps:APP_LOGIN_TARGETS,
    can_assign_roles:isAdmin(ctx)?ADMIN_ASSIGNABLE_ROLES:STORE_STAFF_ROLES,
    can_reactivate:isAdmin(ctx),can_manage_apps:isAdmin(ctx)});
}

/** Administrator-authorised, audited app-scoped sign-in grants.
 * Does not alter employee passwords, branch assignments or departmental approval controls.
 */
export async function setTeamAppAccess(req,env,ctx){
  if(!safeContext(ctx)||!isAdmin(ctx))return fail('Only the Owner or Technical Admin can assign app login permissions.',403);
  let input,branch,request_id,memberId,apps;
  try{
    input=await parseBody(req);
    branch=safeBranch(ctx,text(input.branch,150,'branch'));
    request_id=requestId(input.request_id);
    memberId=input.member_id;
    if(!Number.isSafeInteger(memberId)||memberId<1)throw Error('Invalid employee ID.');
    if(!Array.isArray(input.apps)||input.apps.length>APP_LOGIN_TARGETS.length)throw Error('Invalid app selection.');
    const allowed=new Set(APP_LOGIN_TARGETS.map(x=>x.id));
    if(input.apps.some(x=>typeof x!=='string'||!allowed.has(x))||new Set(input.apps).size!==input.apps.length)
      throw Error('Invalid or duplicate app selection.');
    apps=[...input.apps].sort();
  }catch(error){return fail(error.message,400);}
  if(!branch)return fail('Branch access denied.',403);
  const target=await env.DB.prepare('SELECT id,email,role,department,active FROM team_members WHERE id=? LIMIT 1')
    .bind(memberId).first();
  if(!target||String(target.department).toLowerCase()!==branch.toLowerCase())return fail('Employee not found in this branch.',404);
  if(Number(target.active)!==1)return fail('Reactivate this employee before assigning app access.',409);
  if(target.email.toLowerCase()===cleanActor(ctx))return fail('You cannot change your own login permissions.',403);
  if(['Owner / Admin','Developer / Technical Admin'].includes(target.role))
    return fail('Owner and Technical Admin accounts have protected all-app access.',403);
  if(apps.includes('member')&&!MANAGER_ROLES.has(target.role))
    return fail('Only management roles may access Member Team.',403);
  const normalized={action:'SET_APP_ACCESS',branch,member_id:memberId,apps};
  const payload_hash=await sha(normalized),actor=cleanActor(ctx);
  let replay;
  try{replay=await env.DB.prepare('SELECT request_id,payload_hash,actor_email FROM maliks_member_app_access_audit WHERE request_id=?').bind(request_id).first();}
  catch(error){return fail('Phase 23 Member Team app permissions migration has not been applied.',503);}
  if(replay){
    if(replay.payload_hash!==payload_hash||replay.actor_email!==actor)return fail('Request ID already used.',409);
    return json({ok:true,duplicate:true,member_id:memberId,apps});
  }
  const now=new Date().toISOString();
  // The audit request is inserted first. Every permission change is guarded by
  // the matching audited request ID, payload hash and author. This prevents a
  // concurrent request-ID collision from changing permissions after being rejected.
  const statements=[env.DB.prepare(`INSERT OR IGNORE INTO maliks_member_app_access_audit
    (request_id,member_id,member_email,branch,actor_email,apps_json,payload_hash,created_at)
    SELECT ?,id,email,?,?,?,?,? FROM team_members WHERE id=? AND active=1
      AND lower(department)=lower(?) AND role NOT IN ('Owner / Admin','Developer / Technical Admin')`)
      .bind(request_id,branch,actor,JSON.stringify(apps),payload_hash,now,memberId,branch)];
  for(const item of APP_LOGIN_TARGETS){
    // All six options are explicit (including denied apps), so a role-based
    // default cannot silently restore access after an administrator denies it.
    statements.push(env.DB.prepare(`INSERT INTO maliks_member_app_access
      (member_id,app,allowed,updated_by,updated_at)
      SELECT t.id,?,?,?,? FROM team_members t
      JOIN maliks_member_app_access_audit a ON a.member_id=t.id
        AND a.request_id=? AND a.payload_hash=? AND a.actor_email=?
      WHERE t.id=? AND t.active=1 AND lower(t.department)=lower(?)
        AND t.role NOT IN ('Owner / Admin','Developer / Technical Admin')
      ON CONFLICT(member_id,app) DO UPDATE SET
        allowed=excluded.allowed,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
        .bind(item.id,apps.includes(item.id)?1:0,actor,now,request_id,payload_hash,actor,memberId,branch));
  }
  // Revoke old sessions only when an authorised request was actually recorded.
  statements.push(env.DB.prepare(`DELETE FROM maliks_pos_staff_sessions WHERE member_id=?
    AND EXISTS(SELECT 1 FROM maliks_member_app_access_audit
      WHERE request_id=? AND payload_hash=? AND actor_email=?)`)
    .bind(memberId,request_id,payload_hash,actor));
  try{
    await env.DB.batch(statements);
    const confirmed=await env.DB.prepare('SELECT id,payload_hash,actor_email FROM maliks_member_app_access_audit WHERE request_id=?')
      .bind(request_id).first();
    if(!confirmed||confirmed.payload_hash!==payload_hash||confirmed.actor_email!==actor)
      return fail('App access was not confirmed. Refresh and retry.',409);
    return json({ok:true,member_id:memberId,apps,existing_sessions_revoked:true});
  }catch(error){
    if(/no such table/i.test(String(error?.message||error)))return fail('Apply Phase 23 Member Team app permissions migration before saving.',503);
    if(/unique|constraint/i.test(String(error?.message||error)))return fail('App access changed. Refresh and retry.',409);
    throw error;
  }
}

export async function changeTeam(req,env,ctx){
  if(!safeContext(ctx))return fail('Team management access denied.',403);
  let body,action,id,branch,normalized,hash;
  try{
    body=await parseBody(req);
    action=text(body.action,15,'action').toUpperCase();
    if(!['CREATE','DEACTIVATE','REACTIVATE'].includes(action))throw Error('Unsupported staff action.');
    id=requestId(body.request_id);
    branch=safeBranch(ctx,text(body.branch,150,'branch'));
    if(!branch)return fail('Branch access denied.',403);
    normalized={action,branch};
    if(action==='CREATE'){
      normalized.name=text(body.name,120,'employee name');normalized.email=email(body.email);
      normalized.role=text(body.role,80,'role');
      if(!canAssignRole(ctx.member,normalized.role))return fail('You cannot assign that role.',403);
    }else{
      if(!Number.isSafeInteger(body.member_id)||body.member_id<1)throw Error('Invalid employee ID.');
      normalized.member_id=body.member_id;
      if(action==='REACTIVATE'&&!isAdmin(ctx))return fail('Only an administrator may reactivate staff.',403);
    }
    hash=await sha(normalized);
  }catch(e){return fail(e.message,400);}
  const actor=cleanActor(ctx);
  const existing=await env.DB.prepare('SELECT * FROM maliks_member_team_audit WHERE request_id=?').bind(id).first();
  if(existing){
    if(existing.actor_email!==actor||existing.payload_hash!==hash)return fail('Request ID already used for another action.',409);
    return json({ok:true,duplicate:true,action:existing.action,member_id:existing.member_id});
  }
  const now=new Date().toISOString();
  if(action==='CREATE'){
    const prev=await env.DB.prepare('SELECT id FROM team_members WHERE lower(email)=lower(?) LIMIT 1').bind(normalized.email).first();
    if(prev)return fail('This email already exists. Ask an administrator to reactivate a former employee.',409);
    const after={name:normalized.name,email:normalized.email,role:normalized.role,branch,active:true};
    try{
      const batch=await env.DB.batch([
        env.DB.prepare(`INSERT INTO team_members
          (name,email,role,department,active,created_by,created_at,invite_status,invite_token,invite_sent_at,accepted_at,access_scope,workspace_access)
          SELECT ?,?,?,?,1,?,?,'Active','','','','Assigned workspace',?
          WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE lower(email)=lower(?))`)
          .bind(normalized.name,normalized.email,normalized.role,branch,actor,now,JSON.stringify([branch]),normalized.email),
        env.DB.prepare(`INSERT INTO maliks_member_team_audit
          (request_id,payload_hash,action,member_id,member_email,branch,actor_email,before_json,after_json,created_at)
          SELECT ?,?,'CREATE',last_insert_rowid(),?,?,?,?,?,? WHERE changes()=1`)
          .bind(id,hash,normalized.email,branch,actor,'{}',JSON.stringify(after),now)
      ]);
      if(Number(batch[0]?.meta?.changes)!==1)return fail('Email already exists. No employee created.',409);
    }catch(e){if(/UNIQUE|constraint/i.test(e.message))return fail('Employee already exists or request was already submitted.',409);throw e;}
  }else{
    const target=await env.DB.prepare('SELECT id,name,email,role,department,active FROM team_members WHERE id=? LIMIT 1').bind(normalized.member_id).first();
    if(!target||target.department.toLowerCase()!==branch.toLowerCase())return fail('Employee not found in this store.',404);
    if(target.email.toLowerCase()===actor)return fail('You cannot deactivate or reactivate your own account.',403);
    if(!isAdmin(ctx)&&!STORE_SET.has(target.role))return fail('Store managers cannot change management accounts.',403);
    const desired=action==='DEACTIVATE'?0:1;
    if(Number(target.active)===desired)return fail('Employee is already in that status.',409);
    const before=snapshot(target),after={...before,active:desired===1};
    const roleGuard=isAdmin(ctx)?'':` AND role IN (${STORE_STAFF_ROLES.map(()=>'?').join(',')})`;
    const guardArgs=isAdmin(ctx)?[]:STORE_STAFF_ROLES;
    // Phase 21: revocation must survive a later reactivation. The session table
    // is optional in legacy Phase 19 test fixtures; production migrations create it.
    const sessionsAvailable=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maliks_pos_staff_sessions'").first();
    const statements=[
      env.DB.prepare(`UPDATE team_members SET active=? WHERE id=? AND active=? AND lower(department)=lower(?)
        AND lower(email)<>lower(?)${roleGuard}`)
        .bind(desired,target.id,1-desired,branch,actor,...guardArgs),
      env.DB.prepare(`INSERT INTO maliks_member_team_audit
        (request_id,payload_hash,action,member_id,member_email,branch,actor_email,before_json,after_json,created_at)
        SELECT ?,?,?,?,?,?,?,?,?,? WHERE changes()=1`)
        .bind(id,hash,action,target.id,target.email,branch,actor,JSON.stringify(before),JSON.stringify(after),now)
    ];
    if(sessionsAvailable)statements.push(env.DB.prepare('DELETE FROM maliks_pos_staff_sessions WHERE member_id=?').bind(target.id));
    const result=await env.DB.batch(statements);
    if(Number(result[0]?.meta?.changes)!==1)return fail('Employee status changed. Refresh and retry.',409);
  }
  const saved=await env.DB.prepare('SELECT action,member_id,member_email FROM maliks_member_team_audit WHERE request_id=?').bind(id).first();
  if(!saved)return fail('Staff action could not be confirmed.',503);
  return json({ok:true,action:saved.action,member_id:saved.member_id,member_email:saved.member_email,branch});
}
