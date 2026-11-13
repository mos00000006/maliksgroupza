// Phase 21: staff email/password authentication, revocable sessions and manager-issued
// one-time temporary credentials. Keep all identity/authorisation checks on Core.
import {matchingBranch,canUseApp} from './policy.mjs';
import {canManageTeam,STORE_STAFF_ROLES} from './team-domain.mjs';

const ITERATIONS=600000;
const SESSION_MS=8*60*60*1000;
const WINDOW_MS=15*60*1000;
const enc=new TextEncoder();
const HEADERS={'cache-control':'no-store','x-content-type-options':'nosniff'};
const response=(value,status=200)=>Response.json(value,{status,headers:HEADERS});
const fail=(error,status=400)=>response({error},status);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=str=>Uint8Array.from(atob(str.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-str.length%4)%4)),c=>c.charCodeAt(0));
const random=n=>b64(crypto.getRandomValues(new Uint8Array(n)));
const digest=async value=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))));
const keyFor=async password=>crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
export async function hashPassword(password,salt=random(18),iterations=ITERATIONS){
  const key=await keyFor(password);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:unb64(salt),iterations,hash:'SHA-256'},key,256);
  return {salt,password_hash:b64(new Uint8Array(bits)),iterations};
}
export async function verifyPassword(password,credential){
  if(!credential||!Number.isInteger(credential.iterations)||credential.iterations<ITERATIONS||credential.iterations>1000000)return false;
  const candidate=await hashPassword(password,credential.salt,credential.iterations);
  // Constant-time compare to reduce information leakage in password verification.
  const a=enc.encode(candidate.password_hash),b=enc.encode(credential.password_hash);
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
  return diff===0;
}
const email=v=>typeof v==='string'&&v.length<=150&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())?v.trim().toLowerCase():null;
const validPassword=v=>typeof v==='string'&&v.length>=14&&v.length<=128&&/[^\s]/.test(v)&&!/[\u0000-\u001f\u007f]/.test(v);
const validRequestId=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const sameOrigin=req=>Boolean(req.headers.get('origin')&&req.headers.get('origin')===req.headers.get('x-maliks-original-origin'));
const body=async req=>{
  if(!sameOrigin(req))throw Error('Invalid request origin.');
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))throw Error('JSON required.');
  const raw=await req.text();if(raw.length>1500)throw Error('Request too large.');
  let value;try{value=JSON.parse(raw);}catch{throw Error('Invalid JSON.');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid request.');
  return value;
};
const rateBucket=async(type,value)=>type+':'+await digest(value);
async function throttled(db,bucket,max,now){
  const r=await db.prepare('SELECT attempts,window_until FROM maliks_pos_login_attempts WHERE bucket=?').bind(bucket).first();
  return Boolean(r&&Number(r.window_until)>now&&Number(r.attempts)>=max);
}
async function failedAttempt(db,bucket,now){
  await db.prepare(`INSERT INTO maliks_pos_login_attempts(bucket,attempts,window_until) VALUES (?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET
      attempts=CASE WHEN window_until<=? THEN 1 ELSE attempts+1 END,
      window_until=CASE WHEN window_until<=? THEN excluded.window_until ELSE window_until END`)
    .bind(bucket,now+WINDOW_MS,now,now).run();
}
export const sessionCookie=token=>'__Host-maliks_session='+encodeURIComponent(token)+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800';
export const clearSessionCookie='__Host-maliks_session=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0';
export function cookieToken(cookie){
  const item=String(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-maliks_session='));
  if(!item)return null;
  const token=item.slice('__Host-maliks_session='.length);
  return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
export async function loginPassword(req,env,app,ip=''){
  let data;try{data=await body(req);}catch(e){return fail(e.message);}
  const userEmail=email(data.email),pass=data.password;
  if(!userEmail||typeof pass!=='string'||pass.length>128)return fail('Invalid email or password.',401);
  const now=Date.now(),userBucket=await rateBucket('user',userEmail),ipBucket=await rateBucket('ip',String(ip||'unknown').slice(0,100));
  if(await throttled(env.DB,userBucket,5,now)||await throttled(env.DB,ipBucket,30,now))return fail('Too many login attempts. Please try again later.',429);
  const record=await env.DB.prepare(`SELECT t.id,t.email,t.active,t.role,t.department,t.access_scope,t.workspace_access,c.salt,c.password_hash,c.iterations,c.auth_version,c.must_change
    FROM team_members t LEFT JOIN maliks_pos_staff_credentials c ON c.member_id=t.id
    WHERE lower(t.email)=? LIMIT 1`).bind(userEmail).first();
  // Run a PBKDF2 operation for unknown accounts too, reducing email enumeration.
  const credential=record?.password_hash?record:await hashPassword('dummy-password-for-constant-work');
  const match=await verifyPassword(pass,credential);
  if(!match||!canUseApp(record,app)){
    await Promise.all([failedAttempt(env.DB,userBucket,now),failedAttempt(env.DB,ipBucket,now)]);
    return fail('Invalid email or password.',401);
  }
  const token=random(32),tokenHash=await digest(token);
  await env.DB.prepare(`INSERT INTO maliks_pos_staff_sessions(token_hash,member_id,app,auth_version,expires_at,created_at)
    VALUES (?,?,?,?,?,?)`).bind(tokenHash,record.id,app,record.auth_version,now+SESSION_MS,new Date(now).toISOString()).run();
  await env.DB.prepare('DELETE FROM maliks_pos_login_attempts WHERE bucket=?').bind(userBucket).run();
  return response({ok:true,token,password_change_required:Number(record.must_change)===1});
}
export async function verifySession(env,app,token){
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const tokenHash=await digest(token);
  const row=await env.DB.prepare(`SELECT t.email,c.must_change FROM maliks_pos_staff_sessions s
    JOIN maliks_pos_staff_credentials c ON c.member_id=s.member_id AND c.auth_version=s.auth_version
    JOIN team_members t ON t.id=s.member_id AND t.active=1
    WHERE s.token_hash=? AND s.app=? AND s.expires_at>? LIMIT 1`)
    .bind(tokenHash,app,Date.now()).first();
  return row?{email:row.email.toLowerCase(),app,method:'password',must_change_password:Number(row.must_change)===1}:null;
}
export async function logoutPassword(env,token){
  if(token&&/^[A-Za-z0-9_-]{43}$/.test(token))await env.DB.prepare('DELETE FROM maliks_pos_staff_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return response({ok:true});
}
export async function changeOwnPassword(req,env,auth){
  if(auth?.method!=='password')return fail('Password login required.',403);
  let data;try{data=await body(req);}catch(e){return fail(e.message);}
  if(!validPassword(data.new_password)||data.new_password===data.current_password)return fail('Choose a different password of at least 14 characters.',400);
  const row=await env.DB.prepare(`SELECT t.id,t.email,c.salt,c.password_hash,c.iterations,c.auth_version
    FROM team_members t JOIN maliks_pos_staff_credentials c ON c.member_id=t.id
    WHERE lower(t.email)=? AND t.active=1`).bind(auth.email).first();
  if(!row||typeof data.current_password!=='string'||!await verifyPassword(data.current_password,row))return fail('Current password incorrect.',403);
  const hashed=await hashPassword(data.new_password),now=new Date().toISOString();
  const steps=[
    env.DB.prepare(`UPDATE maliks_pos_staff_credentials SET salt=?,password_hash=?,iterations=?,auth_version=auth_version+1,
      must_change=0,updated_at=?,updated_by=? WHERE member_id=? AND auth_version=?`)
      .bind(hashed.salt,hashed.password_hash,hashed.iterations,now,auth.email,row.id,row.auth_version),
    env.DB.prepare('DELETE FROM maliks_pos_staff_sessions WHERE member_id=?').bind(row.id),
    env.DB.prepare(`INSERT INTO maliks_pos_password_audit(request_id,member_id,member_email,branch,actor_email,action,created_at)
      SELECT ?,id,email,department,?,'CHANGE_PASSWORD',? FROM team_members WHERE id=?`)
      .bind(crypto.randomUUID(),auth.email,now,row.id)
  ];
  const results=await env.DB.batch(steps);
  if(Number(results[0]?.meta?.changes)!==1)return fail('Password was changed in another session. Sign in again.',409);
  return response({ok:true,sign_in_again:true});
}
export async function issueTemporaryPassword(req,env,ctx){
  if(ctx?.app!=='member'||!canManageTeam(ctx.member))return fail('Team management required.',403);
  let data;try{data=await body(req);}catch(e){return fail(e.message);}
  if(!validRequestId(data.request_id)||!Number.isSafeInteger(data.member_id)||data.member_id<1)return fail('Invalid request.',400);
  const branch=matchingBranch(ctx.branches,data.branch);
  if(!branch)return fail('Branch access denied.',403);
  const target=await env.DB.prepare('SELECT id,email,role,department,active FROM team_members WHERE id=? LIMIT 1').bind(data.member_id).first();
  if(!target||target.department.toLowerCase()!==branch.toLowerCase()||Number(target.active)!==1)return fail('Active employee not found in this branch.',404);
  const actor=ctx.member.email.toLowerCase(),isAdmin=['Owner / Admin','Developer / Technical Admin'].includes(ctx.member.role);
  if(!isAdmin&&!STORE_STAFF_ROLES.includes(target.role))return fail('Managers may issue passwords only for ordinary store employees.',403);
  // Self-bootstrap requires a verified Cloudflare Access admin session, not a password session.
  if(target.email.toLowerCase()===actor&&(!isAdmin||ctx.auth_method!=='access'))return fail('Self-service password issuance is not permitted.',403);
  const existing=await env.DB.prepare('SELECT id FROM maliks_pos_password_audit WHERE request_id=?').bind(data.request_id.toLowerCase()).first();
  if(existing)return fail('This password issuance request was already processed. Issue a new password if necessary.',409);
  const temporary_password=random(18),hashed=await hashPassword(temporary_password),now=new Date().toISOString();
  const steps=[
    env.DB.prepare(`INSERT INTO maliks_pos_staff_credentials(member_id,salt,password_hash,iterations,auth_version,must_change,updated_at,updated_by)
      VALUES (?,?,?,?,1,1,?,?) ON CONFLICT(member_id) DO UPDATE SET
      salt=excluded.salt,password_hash=excluded.password_hash,iterations=excluded.iterations,
      auth_version=maliks_pos_staff_credentials.auth_version+1,must_change=1,
      updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
      .bind(target.id,hashed.salt,hashed.password_hash,hashed.iterations,now,actor),
    env.DB.prepare('DELETE FROM maliks_pos_staff_sessions WHERE member_id=?').bind(target.id),
    env.DB.prepare(`INSERT INTO maliks_pos_password_audit(request_id,member_id,member_email,branch,actor_email,action,created_at)
      VALUES (?,?,?,?,?,'ISSUE_TEMPORARY',?)`).bind(data.request_id.toLowerCase(),target.id,target.email,branch,actor,now)
  ];
  try{await env.DB.batch(steps);}catch(e){if(/UNIQUE|constraint/i.test(e.message))return fail('Password issuance already processed.',409);throw e;}
  return response({ok:true,employee:target.email,temporary_password,must_change_password:true});
}

// Cloudflare Access-only Owner/Technical Admin self-service password setup.
// Never accept a requested email or role from the browser: the verified Access
// identity selects the account. A password-only session cannot call this route.
export async function bootstrapOwnPassword(req,env,auth){
  if(!sameOrigin(req)||auth?.method!=='access'||auth?.app!=='member')return fail('Sign in to Member Team through Cloudflare Access as Owner or Technical Admin.',403);
  let data;
  try{data=await body(req);}catch(e){return fail(e.message,400);}
  if(!validPassword(data.new_password))return fail('Use a password of at least 14 characters (maximum 128).',400);
  if(data.new_password!==data.confirm_password)return fail('The two passwords do not match.',400);
  try{
    const actor=await env.DB.prepare(`SELECT id,email,role,department,active FROM team_members WHERE lower(email)=? LIMIT 1`)
      .bind(String(auth.email||'').trim().toLowerCase()).first();
    if(!actor||Number(actor.active)!==1||!['Owner / Admin','Developer / Technical Admin'].includes(actor.role))return fail('Your signed-in account is not an active Owner / Technical Admin. Check the Hub role assignment.',403);
    // A missing migration previously threw an uncaught Worker exception, which
    // returned an HTML 500 page and appeared as 'Unexpected service response'.
    const schema=await env.DB.prepare(`SELECT COUNT(*) AS total FROM sqlite_master WHERE type='table'
      AND name IN ('maliks_pos_staff_credentials','maliks_pos_staff_sessions','maliks_pos_password_audit')`).first();
    if(Number(schema?.total)!==3)return fail('Phase 21 password tables are missing. Run the Phase 21 D1 migration and redeploy before setting an administrator password.',503);
    const hashed=await hashPassword(data.new_password),now=new Date().toISOString();
    // Owner/Technical Admin accounts may have no store department. Audit must
    // never insert NULL into its required branch column.
    const auditBranch=String(actor.department||'').trim()||'Group Administration';
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO maliks_pos_staff_credentials(member_id,salt,password_hash,iterations,auth_version,must_change,updated_at,updated_by)
        VALUES (?,?,?,?,1,0,?,?) ON CONFLICT(member_id) DO UPDATE SET
        salt=excluded.salt,password_hash=excluded.password_hash,iterations=excluded.iterations,
        auth_version=maliks_pos_staff_credentials.auth_version+1,must_change=0,
        updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
        .bind(actor.id,hashed.salt,hashed.password_hash,hashed.iterations,now,actor.email),
      env.DB.prepare('DELETE FROM maliks_pos_staff_sessions WHERE member_id=?').bind(actor.id),
      env.DB.prepare(`INSERT INTO maliks_pos_password_audit(request_id,member_id,member_email,branch,actor_email,action,created_at)
        VALUES (?,?,?,?,?,'CHANGE_PASSWORD',?)`).bind(crypto.randomUUID(),actor.id,actor.email,auditBranch,actor.email,now)
    ]);
    // No plaintext or temporary password is ever returned to the browser.
    return response({ok:true,employee:actor.email,password_set:true,sign_in_again:true});
  }catch(e){
    console.error('Maliks administrator password setup failed:',String(e?.message||'Unknown error').slice(0,200));
    return fail('Could not save administrator password. Check the Phase 21 D1 migration and Core Worker logs.',503);
  }
}
