import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STOCK_SETTINGS_CLIENT_SCRIPT} from '../src/stock-settings-ui.mjs';
const src=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
const core=readFileSync(new URL('../src/core.mjs',import.meta.url),'utf8');
const domain=readFileSync(new URL('../src/stock-settings-domain.mjs',import.meta.url),'utf8');
const sql=readFileSync(new URL('../sql/phase42_stock_settings_numbering.sql',import.meta.url),'utf8');
test('both Stock Settings and Numbering enabled and routed to real branch-scoped UI',()=>{
 assert.match(src,/if\(id==='stock'&&section==='Settings'/);
 assert.match(src,/suiteStockSettings\(item\)/);
 assert.match(src,/STOCK_SETTINGS_CLIENT_SCRIPT/);
 assert.match(STOCK_SETTINGS_CLIENT_SCRIPT,/function suiteStockSettings/);
 assert.match(core,/getStockSettings/);assert.match(core,/changeStockSettings/);
});
test('stock settings are isolated, validated and no live inventory updates are issued',()=>{
 assert.match(domain,/matchingBranch/);assert.match(domain,/canUseMaster\(ctx.member,'stock',writing\)/);
 assert.match(domain,/stocktake_cycle_days/);assert.match(domain,/default_reorder_min_units/);
 assert.doesNotMatch(domain,/UPDATE\s+(?:stock_movements|maliks_pos_inventory)/i);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS maliks_pos_stock_branch_settings/);
 assert.match(sql,/maliks_pos_stock_reserved_numbers/);
});
test('numbering is reserved independently and retains current stock document numbers',()=>{
 assert.match(domain,/RESERVE_NUMBER/);assert.match(domain,/next_value=next_value\+1/);
 assert.match(STOCK_SETTINGS_CLIENT_SCRIPT,/not changed by these settings/i);
 assert.match(STOCK_SETTINGS_CLIENT_SCRIPT,/reservation only/i);
});
