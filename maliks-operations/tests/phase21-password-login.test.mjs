import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import frontend from '../src/frontend.mjs';
import {loginPassword,verifySession,logoutPassword,changeOwnPassword,issueTemporaryPassword,bootstrapOwnPassword,hashPassword,verifyPassword,cookieToken} from '../src/password-auth-domain.mjs';
const branch='Buster Build Protea Glen';
const manager={email:'manager@example.com',name:'Store Manager',role:'Store Manager',department:branch,active:1};
const owner={email:'owner@example.com',name:'Owner',role:'Owner / Admin',department:'Head Office',active:1};
const ctx=(member=manager,branches=[branch])=>({app:'member',member,branches,auth_method:'access'});
const post=(path,data,origin='https://member.example')=>new Request(origin+path,{method:'POST',headers:{origin,'x-maliks-original-origin':origin,'content-type':'application/json'},body:JSON.stringify(data)});
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
class D1{
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(`CREATE TABLE team_members(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE,name TEXT,role TEXT,department TEXT,access_scope TEXT DEFAULT 'Assigned workspace',workspace_access TEXT DEFAULT '[]',active INTEGER NOT NULL DEFAULT 1);`);
    this.sqlite.exec(readFileSync(new URL('../sql/phase21_staff_password_login.sql',import.meta.url),'utf8'));
    this.sqlite.prepare('INSERT INTO team_members(id,email,name,role,department,active) VALUES (1,?,?,?,?,1)').run(owner.email,owner.name,owner.role,owner.department);
    this.sqlite.prepare('INSERT INTO team_members(id,email,name,role,department,active) VALUES (2,?,?,?,?,1)').run(manager.email,manager.name,manager.role,manager.department);
    this.sqlite.prepare('INSERT INTO team_members(id,email,name,role,department,active) VALUES (3,?,?,?,?,1)').run('sales@example.com','Sales','Sales / Tills',branch);
    this.sqlite.prepare('INSERT INTO team_members(id,email,name,role,department,active) VALUES (4,?,?,?,?,1)').run('other@example.com','Other','Sales / Tills','Other Branch');
  }
  prepare(sql){const sqlite=this.sqlite;let params=[];return {bind(...v){params=v;return this;},first(){return sqlite.prepare(sql).get(...params)||null;},all(){return {results:sqlite.prepare(sql).all(...params)};},run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes)}};}};}
  batch(stmts){this.sqlite.exec('BEGIN');try{const r=stmts.map(s=>s.run());this.sqlite.exec('COMMIT');return r;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const data=async response=>({status:response.status,body:await response.json()});
const env=()=>({DB:new D1()});
test('PBKDF2 hash is salted, not plaintext; migration is repeatable',async()=>{
 const p=await hashPassword('super-secure-test-password');const q=await hashPassword('super-secure-test-password');
 assert.notEqual(p.salt,q.salt);assert.notEqual(p.password_hash,q.password_hash);assert.equal(p.iterations,600000);
 assert.equal(await verifyPassword('super-secure-test-password',p),true);assert.equal(await verifyPassword('wrong',p),false);
 const db=new D1();db.sqlite.exec(readFileSync(new URL('../sql/phase21_staff_password_login.sql',import.meta.url),'utf8'));
});
test('manager issues temporary password for own sales employee, not managers or other branches',async()=>{
 const e=env();const created=await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(1),branch,member_id:3}),e,ctx()));
 assert.equal(created.status,200,JSON.stringify(created.body));assert.ok(created.body.temporary_password.length>=20);
 assert.equal(await verifyPassword(created.body.temporary_password,e.DB.sqlite.prepare('SELECT * FROM maliks_pos_staff_credentials WHERE member_id=3').get()),true);
 assert.equal((await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(2),branch,member_id:2}),e,ctx()))).status,403);
 assert.equal((await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(3),branch,member_id:4}),e,ctx()))).status,404);
 assert.equal((await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(1),branch,member_id:3}),e,ctx()))).status,409);
 assert.ok(!JSON.stringify(e.DB.sqlite.prepare('SELECT * FROM maliks_pos_password_audit').all()).includes(created.body.temporary_password));
});
test('password login issues app-scoped revocable session and requires first-login change',async()=>{
 const e=env();const issued=await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(4),branch,member_id:3}),e,ctx()));
 const pass=issued.body.temporary_password;
 const login=await data(await loginPassword(post('/v1/auth/login',{email:'sales@example.com',password:pass}),e,'pos','10.0.0.1'));
 assert.equal(login.status,200,JSON.stringify(login.body));assert.equal(login.body.password_change_required,true);
 assert.equal((await verifySession(e,'pos',login.body.token)).email,'sales@example.com');
 assert.equal(await verifySession(e,'member',login.body.token),null);
 assert.match(cookieToken('__Host-maliks_session='+login.body.token),/^[A-Za-z0-9_-]{43}$/);
 const changed=await data(await changeOwnPassword(post('/v1/auth/change-password',{current_password:pass,new_password:'a much longer personal password!'}),e,{email:'sales@example.com',method:'password'}));
 assert.equal(changed.status,200,JSON.stringify(changed.body));
 assert.equal(await verifySession(e,'pos',login.body.token),null);
 const next=await data(await loginPassword(post('/v1/auth/login',{email:'sales@example.com',password:'a much longer personal password!'}),e,'pos','10.0.0.1'));
 assert.equal(next.status,200);assert.equal(next.body.password_change_required,false);
 await logoutPassword(e,next.body.token);assert.equal(await verifySession(e,'pos',next.body.token),null);
});
test('deactivated employees and reset passwords immediately invalidate existing sessions',async()=>{
 const e=env();const issued=await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(5),branch,member_id:3}),e,ctx()));
 const first=await data(await loginPassword(post('/v1/auth/login',{email:'sales@example.com',password:issued.body.temporary_password}),e,'pos','10.0.0.2'));
 e.DB.sqlite.exec('UPDATE team_members SET active=0 WHERE id=3');assert.equal(await verifySession(e,'pos',first.body.token),null);
 e.DB.sqlite.exec('UPDATE team_members SET active=1 WHERE id=3');
 const second=await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(6),branch,member_id:3}),e,ctx()));
 assert.equal(second.status,200);assert.equal(await verifySession(e,'pos',first.body.token),null);
 const old=await data(await loginPassword(post('/v1/auth/login',{email:'sales@example.com',password:issued.body.temporary_password}),e,'pos','10.0.0.2'));
 assert.equal(old.status,401);
});
test('login rejects bad origins and rate-limits repeated failed credentials',async()=>{
 const e=env();const wrong=()=>loginPassword(post('/v1/auth/login',{email:'unknown@example.com',password:'wrong'}),e,'pos','10.0.0.3');
 const bad=post('/v1/auth/login',{email:'unknown@example.com',password:'wrong'});bad.headers.set('origin','https://evil.example');
 assert.equal((await bad).headers.get('origin'),'https://evil.example');
 assert.equal((await data(await loginPassword(bad,e,'pos','10.0.0.3'))).status,400);
 for(let i=0;i<5;i++)assert.equal((await data(await wrong())).status,401);
 assert.equal((await data(await wrong())).status,429);
});
test('Cloudflare Access administrator may bootstrap their own login; password login cannot',async()=>{
 const e=env();const r=await data(await bootstrapOwnPassword(post('/v1/auth/bootstrap',{}),e,{email:owner.email,method:'access'}));
 assert.equal(r.status,200);assert.ok(r.body.temporary_password);
 assert.equal((await data(await bootstrapOwnPassword(post('/v1/auth/bootstrap',{}),e,{email:owner.email,method:'password'}))).status,403);
 assert.equal((await data(await bootstrapOwnPassword(post('/v1/auth/bootstrap',{}),e,{email:manager.email,method:'access'}))).status,403);
});
test('public Worker shows employee login, forwards only cookie session, and sets HttpOnly cookie',async()=>{
 const seen=[];const core={fetch:async req=>{seen.push(req);return req.url.includes('/auth/login')?Response.json({ok:true,token:'A'.repeat(43),password_change_required:true}):Response.json({ok:true});}};
 const r=await frontend.fetch(post('/api/auth/login',{email:'sales@example.com',password:'x'},'https://pos.example'),{APP_TYPE:'pos',CORE:core});
 assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly/);assert.ok(!JSON.stringify(await r.json()).includes('A'.repeat(43)));
 const session=await frontend.fetch(new Request('https://pos.example/api/session',{headers:{cookie:'__Host-maliks_session='+('A'.repeat(43))}}),{APP_TYPE:'pos',CORE:core});
 assert.equal(session.status,200);assert.equal(seen[1].headers.get('x-maliks-session'),'A'.repeat(43));
 const html=await (await frontend.fetch(new Request('https://pos.example/'),{APP_TYPE:'pos',CORE:core})).text();
 assert.match(html,/Sign in to/);assert.match(html,/Create your own password/);
 assert.equal((await frontend.fetch(new Request('https://pos.example/api/team/password-reset',{method:'POST',headers:{origin:'https://pos.example',cookie:'__Host-maliks_session='+('A'.repeat(43))},body:'{}'}),{APP_TYPE:'pos',CORE:core})).status,403);
});

test('ordinary sales staff cannot sign in to Member Team even with a valid password',async()=>{
 const e=env();const issued=await data(await issueTemporaryPassword(post('/v1/team/password-reset',{request_id:id(11),branch,member_id:3}),e,ctx()));
 const login=await data(await loginPassword(post('/v1/auth/login',{email:'sales@example.com',password:issued.body.temporary_password}),e,'member','10.0.0.10'));
 assert.equal(login.status,401);assert.equal(e.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_pos_staff_sessions').get().n,0);
});
test('native-only rollout flag is configured separately from Cloudflare Access bootstrap',()=>{
 const core=readFileSync(new URL('../src/core.mjs',import.meta.url),'utf8');
 const config=readFileSync(new URL('../scripts/make-config.mjs',import.meta.url),'utf8');
 assert.match(core,/env\.NATIVE_LOGIN_APPS/);
 assert.match(config,/MALIKS_NATIVE_LOGIN_APPS/);
});
