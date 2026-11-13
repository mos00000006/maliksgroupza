import test from 'node:test';
import assert from 'node:assert/strict';
import frontend from '../src/frontend.mjs';

const APP_NAMES={pos:'Maliks POS',tills:'Maliks Tills',cashoffice:'Maliks Cash Office',dispatch:'Maliks Dispatch'};
for(const [app,name] of Object.entries(APP_NAMES)){
  test(`${name} displays PowerBuild logo rather than placeholder icon`,async()=>{
    const env={APP_TYPE:app};
    const res=await frontend.fetch(new Request(`https://${app}.example.test/`),env);
    assert.equal(res.status,200);
    const html=await res.text();
    assert.match(html,/class="brand-logo" src="\/powerbuild-logo\.png" alt="PowerBuild logo"/);
    assert.match(html,new RegExp(name));
    if(app==='pos')assert.match(html,/rel="icon" type="image\/svg\+xml" href="\/maliks-mark\.svg"/);
    else assert.match(html,/rel="icon" type="image\/png" href="\/powerbuild-logo\.png"/);
    assert.doesNotMatch(html,/class="logo"/);
  });
  test(`${name} serves logo as PNG on same origin`,async()=>{
    const env={APP_TYPE:app};
    const res=await frontend.fetch(new Request(`https://${app}.example.test/powerbuild-logo.png`),env);
    assert.equal(res.status,200);
    assert.equal(res.headers.get('content-type'),'image/png');
    const bytes=new Uint8Array(await res.arrayBuffer());
    assert.deepEqual(Array.from(bytes.slice(0,8)),[137,80,78,71,13,10,26,10]);
    assert.ok(bytes.length>1000);
  });
}
