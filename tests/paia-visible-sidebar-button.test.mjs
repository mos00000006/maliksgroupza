import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const s=readFileSync(new URL('../app/page.tsx', import.meta.url),'utf8');
test('PAIA link is already rendered in sidebar, no installer required',()=>{
 assert.match(s,/PAIA_MANUAL_SIDEBAR_BUTTON_V4/);
 assert.match(s,/aria-label="Open PAIA Manual"/);
 assert.match(s,/window.location.assign\("\/paia"\)/);
 assert.ok(s.indexOf('PAIA_MANUAL_SIDEBAR_BUTTON_V4')<s.indexOf('sidebarNavigation.map'));
});
test('existing Company Workspaces and Sales Tills navigation are preserved',()=>{
 assert.match(s,/Company Workspaces/);
 assert.match(s,/if \(n === "Sales \/ Tills"\)/);
});
