import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canUseApp,allowedBranches} from '../src/policy.mjs';
import {canManageTeam,canAssignRole,changeTeam,listTeam} from '../src/team-domain.mjs';
import frontend from '../src/frontend.mjs';
const uuid=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const owner={name:'Owner',email:'owner@example.com',role:'Owner / Admin',active:1,access_scope:'Full company'};
const manager={name:'Manager',email:'manager@example.com',role:'Store Manager',active:1,department:'Buster Build Protea Glen',access_scope:'Assigned workspace',workspace_access:'["Buster Build Protea Glen"]'};
const sales={name:'Sales',email:'sales@example.com',role:'Sales / Tills',active:1,department:'Buster Build Protea Glen',access_scope:'Assigned workspace',workspace_access:'["Buster Build Protea Glen"]'};
const context=(member=manager,branches=['Buster Build Protea Glen'])=>({app:'member',member,branches});
const post=(data,origin='https://member.example')=>new Request(origin+'/v1/team/change',{method:'POST',headers:{origin,'x-maliks-original-origin':origin},body:JSON.stringify(data)});
const create=(n,other={})=>({request_id:uuid(n),action:'CREATE',branch:'Buster Build Protea Glen',name:'Test Employee',email:'newstaff@example.com',role:'Sales / Tills',...other});
const get=(branch='Buster Build Protea Glen')=>new Request('https://member.example/v1/team?branch='+encodeURIComponent(branch));
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(`CREATE TABLE team_members (
   id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,
   role TEXT NOT NULL DEFAULT 'Member',department TEXT NOT NULL DEFAULT 'Operations',
   active INTEGER NOT NULL DEFAULT 1,created_by TEXT NOT NULL,created_at TEXT NOT NULL,
   invite_status TEXT NOT NULL DEFAULT 'Active',invite_token TEXT NOT NULL DEFAULT '',
   invite_sent_at TEXT NOT NULL DEFAULT '',accepted_at TEXT NOT NULL DEFAULT '',
   access_scope TEXT NOT NULL DEFAULT 'Assigned workspace',workspace_access TEXT NOT NULL DEFAULT '[]');`);
  this.sqlite.exec(readFileSync(new URL('../sql/phase19_member_team.sql',import.meta.url),'utf8'));
  this.sqlite.prepare(`INSERT INTO team_members(name,email,role,department,active,created_by,created_at,workspace_access) VALUES (?,?,?,?,?,?,?,?)`).run('Store Manager',manager.email,manager.role,manager.department,1,'owner@example.com','2026-11-13',manager.workspace_access);
  this.sqlite.prepare(`INSERT INTO team_members(name,email,role,department,active,created_by,created_at,workspace_access) VALUES (?,?,?,?,?,?,?,?)`).run('Regional Manager','regional@example.com','Regional Manager',manager.department,1,'owner@example.com','2026-11-13',manager.workspace_access);
  this.sqlite.prepare(`INSERT INTO team_members(name,email,role,department,active,created_by,created_at,workspace_access) VALUES (?,?,?,?,?,?,?,?)`).run('Other Branch Sales','other@example.com','Sales / Tills','Maliks Chamdor',1,'owner@example.com','2026-11-13','["Maliks Chamdor"]');
 }
 prepare(sql){const sqlite=this.sqlite;let args=[];return {bind(...v){args=v;return this;},first(){return sqlite.prepare(sql).get(...args)||null;},all(){return {results:sqlite.prepare(sql).all(...args)};},run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}
 batch(steps){this.sqlite.exec('BEGIN');try{const results=steps.map(s=>s.run());this.sqlite.exec('COMMIT');return results;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
}
const resp=async r=>({status:r.status,body:await r.json()});
test('only authenticated management roles can access member team, store staff restricted',()=>{
 assert.equal(canUseApp(manager,'member'),true);assert.equal(canUseApp(owner,'member'),true);
 assert.equal(canUseApp(sales,'member'),false);assert.equal(canManageTeam({...manager,active:0}),false);
 assert.equal(canAssignRole(manager,'Sales / Tills'),true);
 assert.equal(canAssignRole(manager,'Store Manager'),false);assert.equal(canAssignRole(manager,'Finance Manager'),false);
 assert.equal(canAssignRole(owner,'Store Manager'),true);assert.equal(canAssignRole(owner,'Owner / Admin'),false);
 assert.deepEqual(allowedBranches(sales,['Buster Build Protea Glen','Maliks Chamdor']),['Buster Build Protea Glen']);
});
test('store manager can create staff, see own store and audit; retry is idempotent',async()=>{
 const env={DB:new D1()};const first=await resp(await changeTeam(post(create(1)),env,context()));
 assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.action,'CREATE');
 const db=env.DB.sqlite;
 const row=db.prepare('SELECT * FROM team_members WHERE email=?').get('newstaff@example.com');
 assert.equal(row.department,'Buster Build Protea Glen');assert.equal(row.workspace_access,'["Buster Build Protea Glen"]');
 assert.equal(row.active,1);assert.equal(row.access_scope,'Assigned workspace');
 const retry=await resp(await changeTeam(post(create(1)),env,context()));assert.equal(retry.status,200);assert.equal(retry.body.duplicate,true);
 const list=await resp(await listTeam(get(),env,context()));assert.equal(list.status,200);assert.equal(list.body.staff.length,3);
 assert.equal(list.body.audit.length,1);assert.equal(list.body.audit[0].actor_email,manager.email);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM maliks_member_team_audit').get().n,1);
});
test('store manager cannot create management accounts or another branch employee',async()=>{
 const env={DB:new D1()};
 assert.equal((await resp(await changeTeam(post(create(2,{role:'Store Manager'})),env,context()))).status,403);
 assert.equal((await resp(await changeTeam(post(create(3,{role:'Owner / Admin'})),env,context()))).status,403);
 assert.equal((await resp(await changeTeam(post(create(4,{branch:'Maliks Chamdor'})),env,context()))).status,403);
 assert.equal((await resp(await listTeam(get('Maliks Chamdor'),env,context()))).status,403);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_member_team_audit').get().n,0);
});
test('store manager can deactivate staff, but not managers or self; owner can reactivate',async()=>{
 const env={DB:new D1()};const c=await resp(await changeTeam(post(create(5)),env,context()));assert.equal(c.status,200);
 const off={action:'DEACTIVATE',branch:'Buster Build Protea Glen',member_id:c.body.member_id,request_id:uuid(6)};
 const stopped=await resp(await changeTeam(post(off),env,context()));assert.equal(stopped.status,200,JSON.stringify(stopped.body));
 assert.equal(env.DB.sqlite.prepare('SELECT active FROM team_members WHERE id=?').get(c.body.member_id).active,0);
 const repeat=await resp(await changeTeam(post(off),env,context()));assert.equal(repeat.status,200);assert.equal(repeat.body.duplicate,true);
 assert.equal((await resp(await changeTeam(post({...off,request_id:uuid(7),member_id:2}),env,context()))).status,403);
 assert.equal((await resp(await changeTeam(post({...off,request_id:uuid(8),member_id:1}),env,context()))).status,403);
 assert.equal((await resp(await changeTeam(post({...off,request_id:uuid(9),member_id:3}),env,context()))).status,404);
 const on={action:'REACTIVATE',branch:'Buster Build Protea Glen',member_id:c.body.member_id,request_id:uuid(10)};
 assert.equal((await resp(await changeTeam(post(on),env,context()))).status,403);
 const active=await resp(await changeTeam(post(on),env,context(owner)));
 assert.equal(active.status,200,JSON.stringify(active.body));
 assert.equal(env.DB.sqlite.prepare('SELECT active FROM team_members WHERE id=?').get(c.body.member_id).active,1);
 assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) n FROM maliks_member_team_audit').get().n,3);
});
test('existing employee email cannot be silently re-created, and request IDs cannot be reused for different payloads',async()=>{
 const env={DB:new D1()};assert.equal((await resp(await changeTeam(post(create(11)),env,context()))).status,200);
 assert.equal((await resp(await changeTeam(post(create(12,{email:'NEWSTAFF@EXAMPLE.COM'})),env,context()))).status,409);
 assert.equal((await resp(await changeTeam(post(create(11,{name:'Different'})),env,context()))).status,409);
});
test('team writes enforce origin, member role and validation',async()=>{
 const env={DB:new D1()};const bad=post(create(13),'https://evil.example');
 const badOrigin=new Request('https://member.example/v1/team/change',{method:'POST',headers:{origin:'https://evil.example','x-maliks-original-origin':'https://member.example'},body:JSON.stringify(create(13))});
 assert.equal((await resp(await changeTeam(badOrigin,env,context()))).status,400);
 assert.equal((await resp(await changeTeam(bad,env,{...context(),app:'management'}))).status,403);
 assert.equal((await resp(await changeTeam(post(create(14,{email:'not an email'})),env,context()))).status,400);
 assert.equal((await resp(await changeTeam(post(create(15,{request_id:'invalid'})),env,context()))).status,400);
});
test('separate Member Worker exposes only team API; Sales and POS cannot call team',async()=>{
 const seen=[];const core={fetch:async req=>{seen.push(req);return Response.json({ok:true})}};
 const token='dummy';
 const make=(app,path,method='GET')=>frontend.fetch(new Request('https://app.example'+path,{method,headers:{'cf-access-jwt-assertion':token,...(method==='POST'?{origin:'https://app.example'}:{})},body:method==='POST'?'{}':undefined}),{APP_TYPE:app,CORE:core});
 assert.equal((await make('member','/api/team')).status,200);
 assert.equal(seen[0].headers.get('x-maliks-app'),'member');
 assert.equal((await make('member','/api/quotes')).status,403);
 assert.equal((await make('sales','/api/team')).status,403);
 assert.equal((await make('pos','/api/team')).status,403);
 assert.equal((await make('member','/api/team/change','POST')).status,200);
 assert.equal((await make('member','/api/team/change')).status,405);
 const salesHtml=await (await make('sales','/')).text();
 assert.match(salesHtml,/APP==='sales'\?session\.user\.name/);
 assert.match(salesHtml,/session\.branches\.join/);
 assert.match(salesHtml,/label\.textContent='Store'/);
});
test('Phase 19 migration can be run again without clearing audit',async()=>{
 const db=new D1();db.sqlite.exec(readFileSync(new URL('../sql/phase19_member_team.sql',import.meta.url),'utf8'));
 assert.ok(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='maliks_member_team_audit'").get());
});
