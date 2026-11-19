import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {BACKOFFICE_MASTERS_CLIENT_SCRIPT} from '../src/backoffice-master-ui.mjs';
import {BACKOFFICE_MASTER_KINDS} from '../src/backoffice-master-domain.mjs';
const sql=readFileSync(new URL('../sql/phase54_backoffice_masters.sql',import.meta.url),'utf8');
test('five distinct Back Office masters have an operational (not posting) UI',()=>{
 assert.equal(Object.keys(BACKOFFICE_MASTER_KINDS).length,5);
 new vm.Script(BACKOFFICE_MASTERS_CLIENT_SCRIPT);
 for(const menu of Object.values(BACKOFFICE_MASTER_KINDS))assert.ok(BACKOFFICE_MASTERS_CLIENT_SCRIPT.includes(menu));
 assert.match(BACKOFFICE_MASTERS_CLIENT_SCRIPT,/DOES NOT/);
 assert.doesNotMatch(BACKOFFICE_MASTERS_CLIENT_SCRIPT,/window\.print\(|\bGL.*INSERT/);
});
test('schema creates two separate branch reference and audit tables and is repeatable',()=>{
 const db=new DatabaseSync(':memory:');db.exec(sql);db.exec(sql);
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='maliks_backoffice_master'").get());
 assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='maliks_backoffice_master_audit'").get());
 assert.throws(()=>db.prepare("INSERT INTO maliks_backoffice_master(branch,kind,code,name,updated_by,updated_at) VALUES('Store','deposit','X','X','a','now')").run());
 db.close();
});
test('code uniqueness is scoped to branch and master kind',()=>{
 const db=new DatabaseSync(':memory:');db.exec(sql);
 const insert=db.prepare('INSERT INTO maliks_backoffice_master(branch,kind,code,name,updated_by,updated_at) VALUES(?,?,?,?,?,?)');
 insert.run('Branch A','till','T01','Till 1','a','now');
 assert.throws(()=>insert.run('Branch A','till','t01','Duplicate','a','now'));
 insert.run('Branch A','payment_type','T01','Card','a','now');
 insert.run('Branch B','till','T01','Till 1','a','now');
 db.close();
});

import {listBackofficeMasters,saveBackofficeMaster,listBackofficeMasterAudit} from '../src/backoffice-master-domain.mjs';
function fakeEnv(){
 const db=new DatabaseSync(':memory:');db.exec(sql);
 const DB={
  prepare(statement){let values=[];return {
   bind(...p){values=p;return this;},
   async first(){return db.prepare(statement).get(...values)||null;},
   async all(){return {results:db.prepare(statement).all(...values)};},
   async run(){const result=db.prepare(statement).run(...values);return {meta:{changes:result.changes}};},
  };},
  async batch(statements){db.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
 };
 return {DB,close:()=>db.close()};
}
const admin=(branches=['Branch A'])=>({app:'management',member:{role:'Store Manager',active:1,email:'manager@example.com'},branches});
const request=(path,body)=>new Request('https://test.invalid'+path,body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{});
const uid=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
test('Back Office master CRUD audits atomically and blocks cross branch and duplicate codes',async()=>{
 const env=fakeEnv();const context=admin();
 const data={kind:'till',branch:'Branch A',code:'T01',name:'Till One',notes:'Workstation 1',active:true,request_id:uid(1)};
 const created=await saveBackofficeMaster(request('/v1/backoffice-masters',data),env,context);
 assert.equal(created.status,201);const saved=(await created.json()).item;assert.equal(saved.code,'T01');
 const replay=await saveBackofficeMaster(request('/v1/backoffice-masters',data),env,context);
 assert.equal(replay.status,200);assert.equal((await replay.json()).replayed,true);
 const duplicate=await saveBackofficeMaster(request('/v1/backoffice-masters',{...data,request_id:uid(2)}),env,context);
 assert.equal(duplicate.status,409);
 const update=await saveBackofficeMaster(request('/v1/backoffice-masters',{...data,id:saved.id,version:saved.version,request_id:uid(3),name:'Till One Edited'}),env,context);
 assert.equal(update.status,200);assert.equal((await update.json()).item.version,2);
 const stale=await saveBackofficeMaster(request('/v1/backoffice-masters',{...data,id:saved.id,version:saved.version,request_id:uid(4)}),env,context);
 assert.equal(stale.status,409);
 const records=await listBackofficeMasters(request('/v1/backoffice-masters?branch=Branch%20A&kind=till'),env,context);
 assert.equal((await records.json()).items[0].name,'Till One Edited');
 const audit=await listBackofficeMasterAudit(request('/v1/backoffice-masters/audit?branch=Branch%20A&kind=till'),env,context);
 assert.equal((await audit.json()).items.length,2);
 const other=await listBackofficeMasters(request('/v1/backoffice-masters?branch=Branch%20B&kind=till'),env,context);
 assert.equal(other.status,403);
 env.close();
});
test('Back Office master write refuses unprivileged roles and disallows non-management sessions',async()=>{
 const env=fakeEnv();
 const data={kind:'payment_type',branch:'Branch A',code:'CARD',name:'Card',notes:'',active:true,request_id:uid(5)};
 assert.equal((await saveBackofficeMaster(request('/v1/backoffice-masters',data),env,{...admin(),member:{role:'Finance Manager',active:1,email:'finance@example.com'}})).status,201);
 assert.equal((await saveBackofficeMaster(request('/v1/backoffice-masters',{...data,code:'EFT',request_id:uid(6)}),env,{...admin(),member:{role:'Debtors Clerk',active:1,email:'clerk@example.com'}})).status,403);
 assert.equal((await listBackofficeMasters(request('/v1/backoffice-masters?branch=Branch%20A&kind=payment_type'),env,{...admin(),app:'tills'})).status,403);
 env.close();
});
