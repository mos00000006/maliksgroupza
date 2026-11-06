import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('no live inventory, account posting or price mutation endpoints',()=>{
 const api=read('app/api/stock-operations/route.ts');
 assert.match(api,/getHubMember/); assert.match(api,/allowedWorkspaces/);
 assert.match(api,/canCreate/);assert.match(api,/canTransition/);
 assert.doesNotMatch(api,/UPDATE\s+(?:catalogue_products|inventory_balances|stock_balances|journal_entries)/i);
});
test('audit DB trigger and immutable line snapshots',()=>{
 const sql=read('drizzle/0056_stock_operations_control_register.sql');
 assert.match(sql,/TRIGGER IF NOT EXISTS stock_ops_docs_guard_update/);
 assert.match(sql,/TRIGGER IF NOT EXISTS stock_ops_docs_audit_change/);
 assert.match(sql,/TRIGGER IF NOT EXISTS stock_ops_lines_no_update/);
 assert.match(sql,/created_by<>NEW\.last_action_by/);
});
test('workspace has requested sections, staff assignment and print',()=>{
 const ui=read('app/stock-operations/stock-operations.tsx');
 for(const label of ['Receiving & GRVs','Stock adjustments','Stock counts','Supplier returns','Stock transfers','Movement register','Staff permissions','Print register copy'])assert.ok(ui.includes(label),label);
});
