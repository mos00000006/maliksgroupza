import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');
const ui=read('../src/frontend.mjs');
const core=read('../src/core.mjs');
const workflow=read('../../.github/workflows/deploy-maliks-operations.yml');
test('Back Office menus activate five master files but not live finance operations',()=>{
 assert.match(ui,/\['Till Cash-Up','Tills','Till Drawings Expenses','Payment Types','Coinage','Cash Sales Transaction Numbers Free Voucher'\]/);
 assert.match(ui,/if\(id==='backoffice'&&section==='Master Files'\)\{suiteBackofficeMaster\(item\);return;\}/);
 assert.match(ui,/\$\{BACKOFFICE_MASTERS_CLIENT_SCRIPT\}/);
 assert.match(ui,/Back Office management app only/);
 assert.doesNotMatch(ui,/if\(id==='backoffice'\)return true/);
});
test('two API boundaries enforce management-only Back Office master routes',()=>{
 assert.match(ui,/\/api\/backoffice-masters/);
 assert.match(ui,/!path\.startsWith\('\/v1\/backoffice-masters'\)/);
 assert.match(core,/\/v1\/backoffice-masters\/audit/);
 assert.match(core,/saveBackofficeMaster\(req,env,context\)/);
});
test('schema migration is wired before Core deployment',()=>{
 assert.match(read('../package.json'),/"migrate:phase54"/);
 const p=workflow.indexOf('Apply Back Office master-file schema (Phase 54)');
 const c=workflow.indexOf('Deploy central API — private Worker');
 assert.ok(p>=0&&c>p);
});
