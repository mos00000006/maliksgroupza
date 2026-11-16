import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';
import { LUCIDE_ICON_MARKUP } from '../src/pos-lucide-icons.mjs';
import { POS_PREMIUM_CSS } from '../src/pos-premium-theme.mjs';
import { POS_PREMIUM_CLIENT_SCRIPT } from '../src/pos-premium-screens.mjs';

const html = async kind => (await frontend.fetch(new Request('https://test.example/'),{APP_TYPE:kind})).text();

test('Navigation retains exactly the 12 requested modules in order, with official Lucide SVGs', async()=>{
  const page=await html('pos');
  const labels=[...page.matchAll(/data-suite-module="([^"]+)" class="suite-nav-button"/g)].map(x=>x[1]);
  assert.deepEqual(labels,['home','debtors','suppliers','stock','backoffice','dispatching','headoffice','system','widget','help','lock','exit']);
  for(const key of ['house','users','clipboard-list','boxes','briefcase-business','truck','building','settings','layout-dashboard','circle-question-mark','lock-keyhole','power']){
    assert.match(LUCIDE_ICON_MARKUP[key],/<svg viewBox="0 0 24 24"/);
  }
  assert.match(page,/src="\/powerbuild-logo\.png" alt="PowerBuild logo"/);
  assert.match(page,/SECURE WORKSPACE/);
  assert.match(page,/ACCOUNTING &amp; POS SOLUTIONS/);
  assert.match(page,/PROFESSIONAL/);
});
test('New screens are wired into existing protected POS and are not added to unrelated department apps',async()=>{
  const page=await html('pos');
  assert.match(page,/if\(suiteView==='home'\)suiteHome\(\);else if\(suiteView==='checkout'\)posPremiumCheckout\(\)/);
  assert.match(page,/function posPremiumDashboard\(\)/);
  assert.match(page,/function posPremiumCheckout\(\)/);
  assert.match(page,/checkout/);
  assert.doesNotMatch(await html('dispatch'),/class="suite-header"/);
  const response=await frontend.fetch(new Request('https://test.example/api/payments',{method:'GET'}),{APP_TYPE:'pos'});
  assert.equal(response.status,403);
});
test('Only permitted colours appear in the new premium theme; no generated branding',()=>{
  const colours=[...POS_PREMIUM_CSS.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m=>m[0].toUpperCase());
  assert.ok(colours.length>20);
  assert.deepEqual([...new Set(colours)].sort(), ['#0A2A3F','#D4A017','#E3E5E7','#F0F2F3','#F5F6F7','#FFFFFF'].sort());
  assert.doesNotMatch(POS_PREMIUM_CSS,/emoji|font-awesome|cdn\.jsdelivr|linear-gradient\(.*?#/i);
});
test('Basket remains local and payment actions do not post to the API',()=>{
  assert.match(POS_PREMIUM_CLIENT_SCRIPT,/let premiumDraft=\[\]/);
  assert.match(POS_PREMIUM_CLIENT_SCRIPT,/\/api\/master\/records\?kind=stock/);
  assert.match(POS_PREMIUM_CLIENT_SCRIPT,/btn\.disabled=true;btn\.title='Payment integration is not enabled'/);
  assert.match(POS_PREMIUM_CLIENT_SCRIPT,/checkout\.disabled=true/);
  assert.doesNotMatch(POS_PREMIUM_CLIENT_SCRIPT,/api\('\/api\/(payments|invoices|quotes|dispatch-jobs)/);
  assert.match(POS_PREMIUM_CLIENT_SCRIPT,/No payment has been accepted/);
});
