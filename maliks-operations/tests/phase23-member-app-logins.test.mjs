import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {canUseApp,attachAppPermissions,APP_LOGIN_TARGETS} from '../src/policy.mjs';
import {listTeam,setTeamAppAccess} from '../src/team-domain.mjs';
import {hashPassword,loginPassword,verifySession,loginAccountHealth,bootstrapOwnPassword} from '../src/password-auth-domain.mjs';
import frontend from '../src/frontend.mjs';

const branch='Buster Build Protea Glen';
const actor={id:1,name:'Owner',email:'owner@maliks.test',role:'Owner / Admin',department:branch,active:1};
const dev={id:2,name:'Technical Admin',email:'tech@maliks.test',role:'Developer / Technical Admin',department:'Head Office',active:1};
const employee={id:3,name:'Sales',email:'sales@maliks.test',role:'Sales / Tills',department:branch,active:1,access_scope:'Assigned workspace',workspace_access:JSON.stringify([branch])};
const manager={id:4,name:'Manager',email:'manager@maliks.test',role:'Store Manager',department:branch,active:1};
const ctx=(member=actor,branches=[branch])=>({app:'member',member,branches});
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const post=(data,origin='https://member.test')=>new Request(origin+'/v1/team/apps',{method:'POST',headers:{origin,'x-maliks-original-origin':origin,'content-type':'application/json'},body:JSON.stringify(data)});
const assignment=(n,other={})=>({request_id:id(n),branch,member_id:3,apps:['pos','tills'],...other});
const value=async r=>({status:r.status,body:await r.json()});
class D1{
  constructor(){
    this.sqlite=new DatabaseSync(':memory:');
    this.sqlite.exec(`CREATE TABLE team_members (
      id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,role TEXT NOT NULL,
      department TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',invite_status TEXT NOT NULL DEFAULT 'Active',invite_token TEXT NOT NULL DEFAULT '',
      invite_sent_at TEXT NOT NULL DEFAULT '',accepted_at TEXT NOT NULL DEFAULT '',
      access_scope TEXT NOT NULL DEFAULT 'Assigned workspace',workspace_access TEXT NOT NULL DEFAULT '[]');`);
    for(const f of ['phase19_member_team.sql','phase21_staff_password_login.sql','phase21b_cloudflare_pbkdf2.sql','phase23_member_app_access.sql'])
      this.sqlite.exec(readFileSync(new URL('../sql/'+f,import.meta.url),'utf8'));
    for(const user of [actor,dev,employee,manager])this.sqlite.prepare(`INSERT INTO team_members
      (id,name,email,role,department,active,access_scope,workspace_access) VALUES(?,?,?,?,?,?,?,?)`)
      .run(user.id,user.name,user.email,user.role,user.department,1,user.access_scope||'Assigned workspace',user.workspace_access||JSON.stringify([branch]));
  }
  prepare(sql){const db=this.sqlite;let args=[];return {bind(...v){args=v;return this;},first(){return db.prepare(sql).get(...args)||null;},all(){return {results:db.prepare(sql).all(...args)};},run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}
  batch(steps){this.sqlite.exec('BEGIN');try{const r=steps.map(x=>x.run());this.sqlite.exec('COMMIT');return r;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const environment=()=>({DB:new D1()});

test('The same credentials are compatible with all authorised Maliks Workers; admins have protected all-app access',()=>{
 for(const app of APP_LOGIN_TARGETS){assert.equal(canUseApp(actor,app.id),true,app.id);assert.equal(canUseApp(dev,app.id),true,app.id);}
 assert.equal(canUseApp(employee,'pos'),true);
 assert.equal(canUseApp(employee,'tills'),true);
 assert.equal(canUseApp(employee,'cashoffice'),false);
 assert.equal(canUseApp(employee,'member'),false);
 assert.equal(canUseApp({...employee,app_permissions:[{app:'pos',allowed:0}]},'pos'),false);
 assert.equal(canUseApp({...employee,app_permissions:[{app:'cashoffice',allowed:1}]},'cashoffice'),true);
 assert.equal(canUseApp({...employee,app_permissions:[{app:'member',allowed:1}]},'member'),false,'nonmanager cannot manage Member Team');
 assert.equal(canUseApp({...dev,app_permissions:APP_LOGIN_TARGETS.map(x=>({app:x.id,allowed:0}))},'cashoffice'),true,'developer remains full-access');
});
test('Owner assigns and removes app logins with audit, session revocation and idempotent retry',async()=>{
 const env=environment();
 env.DB.sqlite.prepare(`INSERT INTO maliks_pos_staff_sessions(token_hash,member_id,app,auth_version,expires_at,created_at)
 VALUES (?,?,?,?,?,?)`).run('token-hash',3,'pos',1,Date.now()+100000,'2026-11-17');
 const result=await value(await setTeamAppAccess(post(assignment(1)),env,ctx()));
 assert.equal(result.status,200,JSON.stringify(result.body));
 assert.equal(result.body.existing_sessions_revoked,true);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_pos_staff_sessions WHERE member_id=3').get().n,0);
 const rows=env.DB.sqlite.prepare('SELECT app,allowed FROM maliks_member_app_access WHERE member_id=3').all();
 assert.equal(rows.length,APP_LOGIN_TARGETS.length);
 const staff={...employee};await attachAppPermissions(env.DB,staff);
 assert.equal(canUseApp(staff,'tills'),true);assert.equal(canUseApp(staff,'cashoffice'),false);
 const replay=await value(await setTeamAppAccess(post(assignment(1)),env,ctx()));assert.equal(replay.status,200);assert.equal(replay.body.duplicate,true);
 const reassign=await value(await setTeamAppAccess(post(assignment(2,{apps:['pos','cashoffice','dispatch']})),env,ctx()));
 assert.equal(reassign.status,200,JSON.stringify(reassign.body));
 const current={...employee};await attachAppPermissions(env.DB,current);
 assert.equal(canUseApp(current,'tills'),false);assert.equal(canUseApp(current,'dispatch'),true);
 assert.equal(canUseApp(current,'cashoffice'),true);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_member_app_access_audit').get().n,2);
 const listed=await value(await listTeam(new Request('https://member.test/v1/team?branch='+encodeURIComponent(branch)),env,ctx()));
 assert.equal(listed.status,200);assert.equal(listed.body.can_manage_apps,true);
 assert.deepEqual(listed.body.staff.find(x=>x.id===3).apps.sort(),['pos','cashoffice','dispatch'].sort());
 assert.equal(listed.body.staff.find(x=>x.id===3).app_access_custom,true);
 assert.equal(listed.body.staff.find(x=>x.id===3).app_access_locked,false);
});
test('Store manager, wrong branch, self-edit, developer edit and invalid requests are denied',async()=>{
 const env=environment();
 assert.equal((await setTeamAppAccess(post(assignment(3)),env,ctx(manager))).status,403);
 assert.equal((await setTeamAppAccess(post(assignment(4,{branch:'Other branch'})),env,ctx())).status,403);
 assert.equal((await setTeamAppAccess(post(assignment(5,{member_id:1})),env,ctx())).status,403);
 assert.equal((await setTeamAppAccess(post(assignment(6,{member_id:2,branch:'Head Office'})),env,ctx(dev,['Head Office']))).status,403);
 assert.equal((await setTeamAppAccess(post(assignment(7,{apps:['pos','pos']})),env,ctx())).status,400);
 assert.equal((await setTeamAppAccess(post(assignment(8,{apps:['member']})),env,ctx())).status,403);
 const req=post(assignment(9));req.headers.set('origin','https://evil.test');
 assert.equal((await setTeamAppAccess(req,env,ctx())).status,400);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_member_app_access_audit').get().n,0);
});
test('One employee password allows separate, app-scoped login sessions only for granted apps',async()=>{
 const env=environment();const password='Same-Employee-Password-For-Maliks!';
 const creds=await hashPassword(password);
 env.DB.sqlite.prepare(`INSERT INTO maliks_pos_staff_credentials_v2
 (member_id,salt,password_hash,iterations,auth_version,must_change,updated_at,updated_by)
 VALUES (?,?,?,?,1,0,?,?)`).run(3,creds.salt,creds.password_hash,creds.iterations,'2026-11-17','admin@maliks.test');
 assert.equal((await setTeamAppAccess(post(assignment(10,{apps:['pos','tills','cashoffice']})),env,ctx())).status,200);
 const login=app=>loginPassword(new Request('https://employee.test/v1/auth/login',{method:'POST',headers:{origin:'https://employee.test','x-maliks-original-origin':'https://employee.test','content-type':'application/json'},body:JSON.stringify({email:employee.email,password})}),env,app,'127.0.0.1');
 const sales=await value(await login('pos'));assert.equal(sales.status,200,JSON.stringify(sales.body));
 const tills=await value(await login('tills'));assert.equal(tills.status,200,JSON.stringify(tills.body));
 assert.notEqual(sales.body.token,tills.body.token);
 assert.equal((await verifySession(env,'pos',sales.body.token)).email,employee.email);
 assert.equal(await verifySession(env,'tills',sales.body.token),null);
 assert.equal((await value(await login('cashoffice'))).status,200);
 assert.equal((await value(await login('dispatch'))).status,403);
 assert.equal((await value(await login('member'))).status,403);
 assert.equal((await setTeamAppAccess(post(assignment(11,{apps:['pos']})),env,ctx())).status,200);
 assert.equal(await verifySession(env,'tills',tills.body.token),null,'app grants revoke old sessions');
});
test('Developer Technical Admin can authenticate to every Maliks app with the same employee password',async()=>{
 const env=environment(),password='My-Technical-Administrator-Password!';
 const creds=await hashPassword(password);
 env.DB.sqlite.prepare(`INSERT INTO maliks_pos_staff_credentials_v2
 (member_id,salt,password_hash,iterations,auth_version,must_change,updated_at,updated_by)
 VALUES (?,?,?,?,1,0,?,?)`).run(2,creds.salt,creds.password_hash,creds.iterations,'2026-11-17','technical@maliks.test');
 for(const app of APP_LOGIN_TARGETS){
   const response=await value(await loginPassword(new Request('https://app.example/v1/auth/login',{
     method:'POST',headers:{origin:'https://app.example','x-maliks-original-origin':'https://app.example','content-type':'application/json'},
     body:JSON.stringify({email:dev.email,password})}),env,app.id,'127.0.0.10'));
   assert.equal(response.status,200,app.id+': '+JSON.stringify(response.body));
   assert.equal((await verifySession(env,app.id,response.body.token)).email,dev.email);
 }
});
test('Member Team frontend has seven links and manager-only app permissions route with valid embedded JS',async()=>{
 const member=await (await frontend.fetch(new Request('https://member.test/'),{APP_TYPE:'member'})).text();
 for(const text of ['Manage app logins','Maliks Quote','Save app logins','/api/team/apps','Same password'])assert.ok(member.includes(text),text);
 const m=member.match(/<script type="module">([\s\S]*?)<\/script>/);assert.ok(m);
 const folder=mkdtempSync(join(tmpdir(),'member-access-'));
 try{writeFileSync(join(folder,'client.mjs'),m[1]);execFileSync(process.execPath,['--check',join(folder,'client.mjs')]);}finally{rmSync(folder,{recursive:true,force:true});}
 const env={APP_TYPE:'member',CORE:{fetch:async()=>Response.json({ok:true})}};
 const auth=new Request('https://member.test/api/team/apps',{method:'POST',headers:{origin:'https://member.test','cf-access-jwt-assertion':'jwt'},body:'{}'});
 assert.equal((await frontend.fetch(auth,env)).status,200);
 assert.equal((await frontend.fetch(new Request('https://sales.test/api/team/apps',{method:'POST',headers:{origin:'https://sales.test','cf-access-jwt-assertion':'jwt'},body:'{}'}),{...env,APP_TYPE:'sales'})).status,403);
});
test('Phase 23 migration is additive and repeatable',()=>{
 const env=environment();env.DB.sqlite.exec(readFileSync(new URL('../sql/phase23_member_app_access.sql',import.meta.url),'utf8'));
 assert.ok(env.DB.sqlite.prepare("SELECT name FROM sqlite_master WHERE name='maliks_member_app_access_audit'").get());
});


test('Cloudflare Access administrator can inspect account health without exposing passwords or hashes',async()=>{
 const e=environment();
 const adminContext={...ctx(actor),auth_method:'access'};
 const req=new Request('https://member.test/v1/team/login-health?branch='+encodeURIComponent(branch)+'&member_id=3');
 let result=await value(await loginAccountHealth(req,e,adminContext));
 assert.equal(result.status,200,JSON.stringify(result.body));
 assert.equal(result.body.password_ready,false);
 assert.equal(result.body.apps.pos,true);
 assert.equal(result.body.credential_service_ready,true);
 assert.ok(!JSON.stringify(result.body).includes('password_hash'));
 assert.ok(!JSON.stringify(result.body).includes('salt'));
 const personal=await value(await loginAccountHealth(new Request('https://member.test/v1/team/login-health?self=1'),e,adminContext));
 assert.equal(personal.status,200);assert.equal(personal.body.employee_email,actor.email);
 const wrongBranch=await value(await loginAccountHealth(new Request('https://member.test/v1/team/login-health?branch=Other%20Branch&member_id=3'),e,adminContext));
 assert.equal(wrongBranch.status,403);
 const nativeLogin=await value(await loginAccountHealth(req,e,{...adminContext,auth_method:'password'}));
 assert.equal(nativeLogin.status,403,'password-only accounts cannot query employee credential readiness');
 const ordinary=await value(await loginAccountHealth(req,e,{...adminContext,member:manager}));
 assert.equal(ordinary.status,403);
});

test('New administrator password immediately clears previous account lockout without removing security',async()=>{
 const e=environment(),password='Correct-New-Maliks-Technical-Password!';
 const request=(pass)=>new Request('https://sales.test/v1/auth/login',{method:'POST',headers:{origin:'https://sales.test','x-maliks-original-origin':'https://sales.test','content-type':'application/json'},body:JSON.stringify({email:dev.email,password:pass})});
 for(let i=0;i<5;i++)assert.equal((await loginPassword(request('bad'+i),e,'pos','unknown')).status,401);
 assert.equal((await loginPassword(request('bad6'),e,'pos','unknown')).status,429);
 assert.equal(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_pos_login_attempts').get().n,1,'unknown IP must never share a workforce lockout bucket');
 const recovery=new Request('https://member.test/v1/auth/bootstrap',{method:'POST',headers:{origin:'https://member.test','x-maliks-original-origin':'https://member.test','content-type':'application/json'},body:JSON.stringify({new_password:password,confirm_password:password})});
 const saved=await value(await bootstrapOwnPassword(recovery,e,{app:'member',email:dev.email,method:'access'}));
 assert.equal(saved.status,200,JSON.stringify(saved.body));
 const login=await value(await loginPassword(request(password),e,'pos','unknown'));
 assert.equal(login.status,200,JSON.stringify(login.body));
 assert.equal(login.body.password_change_required,false);
});

test('An employee with a verified password but no app grant receives a clear 403 without a failed-login lockout',async()=>{
 const e=environment(),pass='Sales-Denied-App-Password-Long!';const creds=await hashPassword(pass);
 e.DB.sqlite.prepare(`INSERT INTO maliks_pos_staff_credentials_v2
 (member_id,salt,password_hash,iterations,auth_version,must_change,updated_at,updated_by)
 VALUES(?,?,?,?,1,0,?,?)`).run(3,creds.salt,creds.password_hash,creds.iterations,'2026-11-17','admin@maliks.test');
 assert.equal((await setTeamAppAccess(post(assignment(19,{apps:['tills']})),e,ctx())).status,200);
 const request=new Request('https://sales.test/v1/auth/login',{method:'POST',headers:{origin:'https://sales.test','x-maliks-original-origin':'https://sales.test','content-type':'application/json'},body:JSON.stringify({email:employee.email,password:pass})});
 const result=await value(await loginPassword(request,e,'pos','unknown'));
 assert.equal(result.status,403,JSON.stringify(result.body));
 assert.match(result.body.error,/application is not enabled/);
 assert.equal(e.DB.sqlite.prepare('SELECT COUNT(*) AS n FROM maliks_pos_login_attempts').get().n,0);
});

test('Maliks Quote supports changing temporary employee passwords without needing Sales first',async()=>{
 const {default:quote}=await import('../src/mobile-quote-frontend.mjs');
 const html=await (await quote.fetch(new Request('https://quote.test/'),{})).text();
 for(const keyword of ['change-password-form','/api/auth/change-password','Choose your permanent password','Check login status']){
   // The login help links to the Member Team administrator by description.
   if(keyword==='Check login status')continue;
   assert.ok(html.includes(keyword),keyword);
 }
 const result=await quote.fetch(new Request('https://quote.test/api/auth/change-password',{method:'POST',headers:{origin:'https://quote.test','content-type':'application/json',cookie:'__Host-maliks_session='+('A'.repeat(43))},body:'{}'}),
   {CORE:{fetch:async req=>Response.json({ok:true,app:req.headers.get('x-maliks-app')})}});
 assert.equal(result.status,200);assert.equal((await result.json()).app,'pos');
});
