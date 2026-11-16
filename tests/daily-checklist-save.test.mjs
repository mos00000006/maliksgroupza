import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { stripTypeScriptTypes } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const file = new URL("../app/api/store-controls/route.ts", import.meta.url);
const directory = mkdtempSync(join(tmpdir(), "maliks-checklist-"));
const source = stripTypeScriptTypes(readFileSync(file, "utf8"));
const replacements = [
  ['from "cloudflare:workers"', 'from "./stubs.mjs"'],
  ['from "../../auth"', 'from "./stubs.mjs"'],
  ['from "../access"', 'from "./stubs.mjs"'],
  ['from "./shared"', 'from "./stubs.mjs"'],
];
let executable = source;
for (const [before, after] of replacements) {
  assert.ok(executable.includes(before), `Expected import missing: ${before}`);
  executable = executable.replace(before, after);
}
writeFileSync(join(directory, "route.mjs"), executable);
writeFileSync(join(directory, "stubs.mjs"), `
export const env = {get DB(){return globalThis.__checklistDB}};
export const getAuthenticatedUser = async () => ({email:"manager@maliks.test",displayName:"Store Manager"});
export const getHubMember = async () => ({email:"manager@maliks.test",name:"Store Manager",role:"Owner / Admin"});
export const canWrite = () => true;
export const allowedWorkspaces = () => null;
export const canAccessWorkspace = (_,workspace) => workspace==="Branch A";
export const initStoreControlTables = async () => {};
`);
const { GET, POST } = await import(pathToFileURL(join(directory, "route.mjs")).href);
process.on("exit", () => rmSync(directory, {force:true,recursive:true}));

class DB {
  constructor(){
    this.sqlite=new DatabaseSync(":memory:");
    this.sqlite.exec(`
      CREATE TABLE workspaces(id INTEGER PRIMARY KEY,name TEXT,type TEXT,region TEXT,manager TEXT,active INTEGER);
      INSERT INTO workspaces VALUES (1,'Branch A','Store','Gauteng','Manager',1);
      CREATE TABLE store_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT, workspace TEXT NOT NULL, audit_date TEXT NOT NULL,
        audit_type TEXT DEFAULT 'Routine', auditor TEXT NOT NULL, sections_json TEXT DEFAULT '[]',
        score REAL DEFAULT 0, findings TEXT DEFAULT '', corrective_action TEXT DEFAULT '',
        responsible_person TEXT DEFAULT '',corrective_due TEXT DEFAULT '',corrective_status TEXT DEFAULT 'Open',
        manager_signoff TEXT DEFAULT '', created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
      CREATE TABLE daily_manager_checklists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,workspace TEXT NOT NULL,checklist_date TEXT NOT NULL,
        manager TEXT NOT NULL, items_json TEXT NOT NULL,compliance_percent REAL NOT NULL,
        issues_count INTEGER NOT NULL,notes TEXT NOT NULL,manager_signoff TEXT NOT NULL,
        created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
        UNIQUE(workspace,checklist_date));
      CREATE TABLE tasks(id INTEGER,project TEXT,status TEXT,priority TEXT,due TEXT);
      CREATE TABLE store_control_attachments (id INTEGER PRIMARY KEY,record_type TEXT,record_id INTEGER,
        workspace TEXT,name TEXT,type TEXT,size INTEGER,uploaded_by TEXT,created_at TEXT);
    `);
  }
  prepare(sql) {
    const sqlite=this.sqlite;
    let values=[];
    return {
      bind(...args){values=args;return this;},
      first(){return sqlite.prepare(sql).get(...values)||null;},
      all(){return {results:sqlite.prepare(sql).all(...values)};},
      run(){const value=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(value.changes)}};}
    };
  }
}
const date = new Date().toISOString().slice(0,10);
const items = [
  {name:"Opening checks",status:"Done",comment:""},
  {name:"Closing checks",status:"",comment:""},
];
const payload = (mode, override={}) => ({
  type:"checklist",mode,workspace:"Branch A",checklistDate:date,
  manager:"Test Manager",managerSignoff:mode==="finalize"?"Test Manager":"",
  items,notes:"Opening inspected",...override,
});
async function save(body){
  const response=await POST(new Request("https://maliks.test/api/store-controls",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
  return {status:response.status,value:await response.json()};
}

test("Daily Checklist saves unfinished progress and reloads correctly",async()=>{
  globalThis.__checklistDB=new DB();
  const saved=await save(payload("draft"));
  assert.equal(saved.status,200,JSON.stringify(saved.value));
  assert.equal(saved.value.checklist.record_status,"Draft");
  assert.equal(saved.value.checklist.items[1].status,"");
  const result=await GET();
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.checklists.length,1);
  assert.equal(data.checklists[0].items[1].status,"");
  assert.equal(data.checklists[0].record_status,"Draft");
  assert.equal(data.summary.todayChecklists,0,"Draft must not count as completed");
  const replacement=await save(payload("draft",{items:[{...items[0],comment:"Updated"},{...items[1]}]}));
  assert.equal(replacement.status,200);
  const count=globalThis.__checklistDB.sqlite.prepare("SELECT COUNT(*) AS n FROM daily_manager_checklists").get().n;
  assert.equal(count,1,"Saving again must update the same date, not create duplicates");
});

test("Finalising validates missing statuses, sign-off, and issue comments",async()=>{
  globalThis.__checklistDB=new DB();
  const incomplete=await save(payload("finalize"));
  assert.equal(incomplete.status,400);
  const unsigned=await save(payload("finalize",{managerSignoff:"",items:[{...items[0]},{...items[1],status:"Done"}]}));
  assert.equal(unsigned.status,400);
  const issue=await save(payload("finalize",{items:[{...items[0]},{...items[1],status:"Issue"}]}));
  assert.equal(issue.status,400);
  const finalised=await save(payload("finalize",{items:[{...items[0]},{...items[1],status:"Issue",comment:"Closing door damaged"}]}));
  assert.equal(finalised.status,200,JSON.stringify(finalised.value));
  assert.equal(finalised.value.checklist.record_status,"Finalized");
  const data=await (await GET()).json();
  assert.equal(data.summary.todayChecklists,1);
  const after=await save(payload("draft"));
  assert.equal(after.status,409,"Cannot overwrite final sign-off with incomplete draft");
});

test("Rejects unauthorised branch and invalid date",async()=>{
  globalThis.__checklistDB=new DB();
  assert.equal((await save(payload("draft",{workspace:"Branch B"}))).status,403);
  assert.equal((await save(payload("draft",{checklistDate:"2026-02-30"}))).status,400);
});
