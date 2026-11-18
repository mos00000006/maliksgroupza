import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const temp=mkdtempSync(join(tmpdir(),'hub-task-controls-'));
after(()=>rmSync(temp,{recursive:true,force:true}));
function compile(source){
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
 return compiled.outputText;
}
function stubSource(text,kind){
 return text
  .replace(/import \{ env \} from "cloudflare:workers";/,'const env = {get DB(){return globalThis.__testEnv?.DB;}};')
  .replace(/import \{ getAuthenticatedUser \} from "[^"]+";/,'const getAuthenticatedUser = async () => globalThis.__testUser;')
  .replace(/import \{\s*canAccessWorkspace,\s*canWrite,\s*getHubMember\s*\} from "[^"]+";/,
   'const canAccessWorkspace = (member, workspace) => member?.role === "Owner / Admin" || member?.department === workspace;\nconst canWrite = member => member?.role !== "Read only";\nconst getHubMember = async () => globalThis.__testMember;')
  .replace(/import \{ addTaskActivity, ensureTaskControlTables \} from "[^"]+";/,'import { addTaskActivity, ensureTaskControlTables } from "./helper.mjs";')
  .replace(/import \{ addTaskActivity, taskReadyForApproval \} from "[^"]+";/,'import { addTaskActivity, taskReadyForApproval } from "./helper.mjs";')
  .replace(/import \{\s*createApprovalRequestedNotifications,[\s\S]*?\} from "[^\"]+";/,
   'const createApprovalRequestedNotifications=async()=>{}; const createAssignmentNotification=async()=>{}; const createReturnedToWorkNotifications=async()=>{}; const createTaskApprovedNotifications=async()=>{};')
  .replace(/import \{\s*canAccessWorkspace,[\s\S]*?canApproveTasks,[\s\S]*?canWrite,[\s\S]*?getHubMember,\s*\} from "[^\"]+";/,
   'const canAccessWorkspace = (member, workspace) => member?.role === "Owner / Admin" || member?.department === workspace;\nconst canWrite = member => member?.role !== "Read only";\nconst canApproveTasks = member => ["Owner / Admin", "Store Manager"].includes(member?.role);\nconst getHubMember = async () => globalThis.__testMember;');
}
writeFileSync(join(temp,'helper.mjs'),compile(stubSource(read('app/api/tasks/task-controls.ts'))));
writeFileSync(join(temp,'checklist.mjs'),compile(stubSource(read('app/api/tasks/[id]/checklist/route.ts'))));
writeFileSync(join(temp,'task.mjs'),compile(stubSource(read('app/api/tasks/[id]/route.ts'))));
const helper=await import(pathToFileURL(join(temp,'helper.mjs')).href);
const checklist=await import(pathToFileURL(join(temp,'checklist.mjs')).href);
const taskRoute=await import(pathToFileURL(join(temp,'task.mjs')).href);

class D1 {
 constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(`
  CREATE TABLE tasks(id INTEGER PRIMARY KEY,project TEXT,title TEXT,status TEXT,approval_status TEXT,assignee TEXT,assignee_email TEXT,created_by TEXT,due TEXT,owner TEXT,priority TEXT,description TEXT,task_type TEXT,task_group TEXT);
  CREATE TABLE attachments(id INTEGER PRIMARY KEY,task_id INTEGER);
  CREATE TABLE comments(id INTEGER PRIMARY KEY,task_id INTEGER,body TEXT,author TEXT,created_at TEXT);
  INSERT INTO tasks(id,project,title,status,approval_status,assignee,assignee_email,created_by,due,owner,priority,description,task_type,task_group)
  VALUES(1,'Buster Build','Daily checks','In progress','','Store Manager','','user@test','2026-11-20','Store Manager','High','','Operations','Store Tasks');
 `);}
 prepare(sql){let args=[];const db=this.sqlite;return {bind(...items){args=items;return this;},
  async first(){return db.prepare(sql).get(...args)||null;}, async all(){return {results:db.prepare(sql).all(...args)};},
  async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}};}
 async batch(stmts){const out=[];for(const s of stmts)out.push(await s.run());return out;}
}
let db;
function reset(){db=new D1();globalThis.__testEnv={DB:db};globalThis.__testUser={email:'manager@test',displayName:'Store Manager'};globalThis.__testMember={role:'Store Manager',department:'Buster Build'};}
const context={params:Promise.resolve({id:'1'})};
const post=async data=>checklist.POST(new Request('https://hub.test/api/tasks/1/checklist',{
 method:'POST',headers:{origin:'https://hub.test','content-type':'application/json'},body:JSON.stringify(data)}),context);
const patch=async data=>taskRoute.PATCH(new Request('https://hub.test/api/tasks/1',{
 method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)}),context);

test('migration creates additive indexed checklist and activity tables and is rerunnable',()=>{
 reset();const sql=read('drizzle/0069_task_checklist_activity.sql');db.sqlite.exec(sql);db.sqlite.exec(sql);
 assert.equal(db.sqlite.prepare('SELECT title FROM tasks WHERE id=1').get().title,'Daily checks');
 assert.ok(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='task_activity'").get());
 assert.ok(db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='task_checklist_items'").get());
});
test('new checklist records can be added, completed and appear in activity history',async()=>{
 reset();assert.equal((await post({action:'add',text:'Count all stock'})).status,200);
 let data=await (await checklist.GET(new Request('https://hub.test/api/tasks/1/checklist'),context)).json();
 assert.equal(data.checklist.length,1);assert.equal(data.checklist[0].done,0);
 assert.equal((await post({action:'toggle',item_id:data.checklist[0].id,done:true})).status,200);
 data=await (await checklist.GET(new Request('https://hub.test/api/tasks/1/checklist'),context)).json();
 assert.equal(data.checklist[0].done,1);assert.equal(data.activity[0].action,'CHECKLIST_COMPLETED');
 assert.equal(data.activity[0].actor_name,'Store Manager');
});
test('completion checks unfinished steps and supporting evidence',async()=>{
 reset();assert.equal((await helper.taskReadyForApproval(1)).ok,true); // existing task no checklist
 await post({action:'add',text:'Verify counts'});
 let res=await patch({status:'Complete'});assert.equal(res.status,409);
 let j=await res.json();assert.match(j.error,/Complete all/);
 let data=await (await checklist.GET(new Request('https://hub.test/api/tasks/1/checklist'),context)).json();
 await post({action:'toggle',item_id:data.checklist[0].id,done:true});
 res=await patch({status:'Complete'});assert.equal(res.status,409);
 j=await res.json();assert.match(j.error,/Attach a photo/);
 db.sqlite.prepare('INSERT INTO attachments(id,task_id) VALUES(1,1)').run();
 res=await patch({status:'Complete'});assert.equal(res.status,200);
 j=await res.json();assert.equal(j.task.approval_status,'Awaiting approval');
});
test('approvals produce signed audit records and lock completed checklists',async()=>{
 reset();await post({action:'add',text:'Final manager check'});
 const record=await (await checklist.GET(new Request('https://hub.test/api/tasks/1/checklist'),context)).json();
 await post({action:'toggle',item_id:record.checklist[0].id,done:true});
 db.sqlite.prepare('INSERT INTO attachments(id,task_id) VALUES(1,1)').run();
 await patch({status:'Complete'});
 assert.equal((await post({action:'add',text:'Too late'})).status,409);
 const res=await patch({approval_action:'approve'});assert.equal(res.status,200);
 const out=await res.json();assert.equal(out.task.approval_status,'Approved');
 const audit=db.sqlite.prepare("SELECT action,actor_email FROM task_activity WHERE task_id=1 ORDER BY id DESC LIMIT 1").get();
 assert.equal(audit.action,'APPROVED');assert.equal(audit.actor_email,'manager@test');
});
test('read-only and cross-branch staff cannot alter the checklist',async()=>{
 reset();globalThis.__testMember={role:'Read only',department:'Buster Build'};
 assert.equal((await post({action:'add',text:'forbidden'})).status,403);
 globalThis.__testMember={role:'Store Manager',department:'Other Branch'};
 assert.equal((await post({action:'add',text:'forbidden'})).status,403);
 assert.equal((await checklist.GET(new Request('https://hub.test/api/tasks/1/checklist'),context)).status,404);
});
test('invalid checklist input and cross-origin writes are refused',async()=>{
 reset();assert.equal((await post({action:'add',text:'  '})).status,400);
 assert.equal((await post({action:'toggle',item_id:0,done:true})).status,400);
 const req=new Request('https://hub.test/api/tasks/1/checklist',{method:'POST',headers:{origin:'https://other.test','content-type':'application/json'},body:'{"action":"add","text":"Unsafe"}'});
 assert.equal((await checklist.POST(req,context)).status,403);
});
test('Hub task window contains progress, evidence, manager actions and timeline',()=>{
 const ui=read('../app/page.tsx');
 for(const field of ['Task Checklist','taskProgressTrack','Completion Evidence','Manager Sign-off','Submit for Approval','Return for Correction','Activity Timeline','updateChecklist'])
  assert.ok(ui.includes(field),field);
 const css=read('../app/phase-eight.css');assert.match(css,/\.taskChecklistRow/);
});
test('task APIs log comments and evidence and approval rules include store managers',()=>{
 assert.match(read('app/api/tasks/[id]/comments/route.ts'),/COMMENT_ADDED/);
 assert.match(read('app/api/tasks/[id]/attachments/route.ts'),/EVIDENCE_UPLOADED/);
 assert.match(read('app/api/access.ts'),/"Store Manager", "Regional Manager", "Operations Manager"/);
});
test('return-for-correction records the manager reason and reopens the task',async()=>{
 reset();await patch({status:'Complete'});
 const result=await patch({approval_action:'return',reason:'Stock count evidence does not match the count sheet'});
 assert.equal(result.status,200);
 const task=await result.json();assert.equal(task.task.status,'Returned');
 assert.equal(task.task.approval_status,'Returned to work');
 const entry=db.sqlite.prepare('SELECT action,details FROM task_activity ORDER BY id DESC LIMIT 1').get();
 assert.equal(entry.action,'RETURNED');assert.match(entry.details,/does not match/);
});
test('legacy tasks without checklists can still complete with no evidence',async()=>{
 reset();const response=await patch({status:'Complete'});
 assert.equal(response.status,200);assert.equal((await response.json()).task.approval_status,'Awaiting approval');
});
test('non-management employees cannot grant task approval',async()=>{
 reset();await patch({status:'Complete'});
 globalThis.__testMember={role:'Sales',department:'Buster Build'};
 assert.equal((await patch({approval_action:'approve'})).status,403);
});
test('rejection requires a reason and retains a distinct rejected audit state',async()=>{
 reset();await patch({status:'Complete'});
 const denied=await patch({approval_action:'reject',reason:'no'});assert.equal(denied.status,400);
 const accepted=await patch({approval_action:'reject',reason:'Count sheet incomplete'});assert.equal(accepted.status,200);
 const task=(await accepted.json()).task;assert.equal(task.status,'Returned');assert.equal(task.approval_status,'Rejected');
 assert.equal(db.sqlite.prepare('SELECT action FROM task_activity ORDER BY id DESC LIMIT 1').get().action,'REJECTED');
});
