import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPLIER_SETTINGS_CLIENT_SCRIPT} from '../src/supplier-settings-ui.mjs';
const src=readFileSync(new URL('../src/frontend.mjs',import.meta.url),'utf8');
const core=readFileSync(new URL('../src/core.mjs',import.meta.url),'utf8');
test('Suppliers settings and numbering menus connect to the dedicated workspace',()=>{
 assert.match(src,/if\(id==='suppliers'&&section==='Settings'/);
 assert.match(src,/suiteSupplierSettings\(item\)/);
 assert.match(src,/SUPPLIER_SETTINGS_CLIENT_SCRIPT/);
 assert.match(src,/\/api\/supplier-settings/);
 assert.match(SUPPLIER_SETTINGS_CLIENT_SCRIPT,/function suiteSupplierSettings/);
 assert.match(core,/getSupplierSettings/);
 assert.match(core,/changeSupplierSettings/);
});
test('Supplier numbering is marked as reservations not live financial references',()=>{
 assert.match(SUPPLIER_SETTINGS_CLIENT_SCRIPT,/reservation only/i);
 assert.match(SUPPLIER_SETTINGS_CLIENT_SCRIPT,/not changed by these settings/i);
});
