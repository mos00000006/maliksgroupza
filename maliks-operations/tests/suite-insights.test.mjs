import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import {SUITE_INSIGHTS_CLIENT_SCRIPT} from '../src/suite-insights.mjs';

const env={APP_TYPE:'pos',CORE:{fetch:()=>Promise.resolve(Response.json({app:'management'}))}};

test('read-only operational dashboards and exports render in POS HTML',async()=>{
  const res=await frontend.fetch(new Request('https://pos.example/'),env);
  assert.equal(res.status,200);
  const html=await res.text();
  for(const text of ['suiteOperationalDashboard','suiteMasterExport','suiteHelpView',
    'Management Dashboard','Branch Dashboard','Stock Master CSV/Text File Export',
    'Supplier Master CSV File Export','Debtors Master CSV/Text File Export']){
    assert.ok(html.includes(text),'missing '+text);
  }
  assert.match(html,/Financial posting is not yet enabled/);
});
test('client dashboard and CSV script is syntactically valid',()=>{
  assert.ok(SUITE_INSIGHTS_CLIENT_SCRIPT.includes('function suiteOperationalDashboard'));
  new Function(SUITE_INSIGHTS_CLIENT_SCRIPT);
});
test('financial actions remain restricted to their department Workers',async()=>{
  const response=await frontend.fetch(new Request('https://pos.example/api/payments',{method:'GET'}),env);
  assert.equal(response.status,403);
});
