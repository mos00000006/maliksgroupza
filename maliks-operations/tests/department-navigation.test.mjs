import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import { DEPARTMENT_PREMIUM_CSS, DEPARTMENT_PREMIUM_CLIENT_SCRIPT } from '../src/department-premium.mjs';

const page=async app=>(await frontend.fetch(new Request('https://test.example/'),{APP_TYPE:app})).text();

test('all department dashboard headers use the real existing logo and Gold/Navy Lucide navigation',async()=>{
  for(const app of ['sales','tills','cashoffice','dispatch']){
    const html=await page(app);
    assert.match(html,/id="department-navigation" class="department-header" hidden/);
    assert.match(html,/class="department-brand-logo" alt="PowerBuild logo" src="\/powerbuild-logo\.png"/);
    assert.match(html,/MALIKS <em>POS<\/em>/);
    assert.match(html,/SECURE WORKSPACE/);
    assert.match(html,/data-department-view="home"/);
    assert.match(html,/const DEPARTMENT_NAV=/);
    assert.doesNotMatch(html,/id="suite-navigation"/);
  }
  assert.match(DEPARTMENT_PREMIUM_CSS,/#0A2A3F/);
  assert.match(DEPARTMENT_PREMIUM_CSS,/#D4A017/);
  assert.match(DEPARTMENT_PREMIUM_CLIENT_SCRIPT,/setDepartmentView\(id\)/);
});

test('Sales/Tills/Cash Office/Dispatch open independent workspaces instead of stacking full pages',async()=>{
  for(const app of ['sales','tills','cashoffice','dispatch']){
    const html=await page(app);
    assert.match(html,/function departmentDraw\(\)/);
    assert.match(html,/root\.replaceChildren\(\)/);
    assert.match(html,/Back to Dashboard/);
    assert.match(html,/window\.scrollTo\(\{top:0,behavior:'instant'\}\)/);
  }
  const tills=await page('tills');
  assert.match(tills,/quoteView\(departmentView\)/);
  assert.match(tills,/if\(mode==='paid'\|\|mode==='payments'\)/);
  assert.match(tills,/if\(mode==='shifts'\)/);
  const cash=await page('cashoffice');
  assert.match(cash,/mode==='cashup'/);
  assert.match(cash,/mode==='evidence'/);
});

test('POS debtor master launches an independent workspace with back navigation',async()=>{
  const html=await page('pos');
  assert.match(html,/function suiteWorkspaceStart\(title\)/);
  assert.match(html,/suiteWorkspaceStart\(item\)/);
  assert.match(html,/Back to /);
  assert.doesNotMatch(html,/detail\.scrollIntoView\(\{block:'nearest',behavior:'smooth'\}\)/);
});
