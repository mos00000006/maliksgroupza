import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canSeeOperationsOverview,visibleOperationsBranches,resolveOperationsBranch,operationsOverviewCounts} from '../app/lib/operations-bridge-policy.mjs';

test('only supervisors/managers are eligible',()=>{
 for(const role of ['Owner / Admin','Developer / Technical Admin','Executive / EXCO','Regional Manager','Store Manager','Department Manager'])
   assert.equal(canSeeOperationsOverview({role}),true,role);
 for(const role of ['Sales / Tills','Buyer','Branch Stock Orders','Human Resource (HR)','Read only','Cash Office','Dispatch','Unknown'])
   assert.equal(canSeeOperationsOverview({role}),false,role);
 assert.equal(canSeeOperationsOverview(null),false);
});
test('branch access is fail-closed and uses exact case-insensitive match',()=>{
 const branches=[{name:'Sungate PowerBuild',active:1},{name:'Midway PowerBuild',active:1},{name:'Inactive',active:0}];
 const visible=visibleOperationsBranches(branches,['MIDWAY POWERBUILD']);
 assert.deepEqual(visible,['Midway PowerBuild']);
 assert.equal(resolveOperationsBranch(visible,'midway powerbuild'),'Midway PowerBuild');
 assert.equal(resolveOperationsBranch(visible,'Sungate PowerBuild'),undefined);
 assert.equal(resolveOperationsBranch(visible,'Midway PowerBuild OR 1=1'),undefined);
 assert.equal(resolveOperationsBranch(visible,null),null);
 assert.deepEqual(visibleOperationsBranches(branches,undefined),[]);
 assert.deepEqual(visibleOperationsBranches(branches,null),['Sungate PowerBuild','Midway PowerBuild']);
});
test('status counts and timestamps are summaries, not stock values',()=>{
 assert.deepEqual(operationsOverviewCounts([{status:'OPEN',n:2,last_at:'2026-11-16T07:00:00Z'},{status:'CLOSED',n:3,last_at:'2026-11-15T07:00:00Z'}]),
 {total:5,by_status:{OPEN:2,CLOSED:3},last_at:'2026-11-16T07:00:00Z'});
 assert.throws(()=>operationsOverviewCounts([{status:'OPEN',n:-1}]),/Invalid count/);
});
test('Hub bridge API has only GET and no mutation SQL or public direct Core URL',()=>{
 const source=readFileSync(new URL('../app/api/operations-bridge/route.ts',import.meta.url),'utf8');
 assert.match(source,/export async function GET\(/);
 assert.doesNotMatch(source,/export async function (?:POST|PATCH|PUT|DELETE)\(/);
 assert.doesNotMatch(source,/\b(?:INSERT INTO|UPDATE [a-z_]+ SET|DELETE FROM)\b/i);
 assert.match(source,/getHubMember\(\)/);
 assert.match(source,/visibleOperationsBranches/);
 assert.match(source,/db\.prepare|env\.DB\.prepare/i);
 assert.doesNotMatch(source,/workers\.dev|fetch\('https?:/);
});
