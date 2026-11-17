import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign} from 'node:crypto';
import quoteFrontend from '../src/mobile-quote-frontend.mjs';
import salesFrontend from '../src/frontend.mjs';
import core from '../src/core.mjs';

const textFile=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const vars=['POS','QUOTE','TILLS','CASHOFFICE','DISPATCH','MEMBER'];

test('Cloudflare Quote AUD is separately required and injected only into private Core config',()=>{
  const config=textFile('scripts/make-config.mjs');
  const workflow=textFile('../.github/workflows/deploy-maliks-operations.yml');
  assert.match(config,/quote:'CF_ACCESS_AUD_QUOTE'/);
  assert.match(config,/sales:'CF_ACCESS_AUD_POS'/);
  assert.match(config,/ACCESS_AUD_QUOTE:process\.env\.CF_ACCESS_AUD_QUOTE\.trim\(\)/);
  assert.match(workflow,/CF_ACCESS_AUD_QUOTE: \$\{\{ secrets\.CF_ACCESS_AUD_QUOTE \}\}/);
  const dir=mkdtempSync(join(tmpdir(),'maliks-quote-aud-config-'));
  try{
    const env={...process.env,MALIKS_GROUP_D1_DATABASE_ID:'00000000-1111-4222-8333-444444444444',CF_ACCESS_TEAM_DOMAIN:'example.cloudflareaccess.com'};
    for(const name of vars)env['CF_ACCESS_AUD_'+name]='aud-'+name.toLowerCase();
    const output=execFileSync(process.execPath,[new URL('../scripts/make-config.mjs',import.meta.url).pathname],{cwd:dir,env,encoding:'utf8'});
    assert.match(output,/Created eight deployment configurations/);
    const read=name=>JSON.parse(readFileSync(join(dir,'.generated',name+'.json'),'utf8'));
    const coreConfig=read('core');
    assert.equal(coreConfig.vars.ACCESS_AUD_POS,'aud-pos');
    assert.equal(coreConfig.vars.ACCESS_AUD_QUOTE,'aud-quote');
    assert.equal(coreConfig.workers_dev,false);
    assert.equal(read('quote').name,'maliks-quote');
    assert.equal(read('quote').services[0].service,'maliks-core-api');
    assert.equal(read('sales').name,'maliks-sales');
    delete env.CF_ACCESS_AUD_QUOTE;
    assert.throws(()=>execFileSync(process.execPath,[new URL('../scripts/make-config.mjs',import.meta.url).pathname],{cwd:dir,env,encoding:'utf8',stdio:'pipe'}),/Command failed/,'Deployment should fail closed when Quote AUD secret is missing');
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('Quote Worker forwards its own immutable Access application marker and keeps employee app pos',async()=>{
  const requests=[];
  const env={CORE:{fetch:async r=>{requests.push(r);return Response.json({ok:true});}}};
  const r=await quoteFrontend.fetch(new Request('https://maliks-quote.moyanamoses006.workers.dev/api/quote/branch-queue?branch=Test',{
    headers:{'cf-access-jwt-assertion':'test-token-for:aud-quote','x-maliks-access-app':'management'}
  }),env);
  assert.equal(r.status,200);
  const sent=requests[0];
  assert.equal(sent.headers.get('x-maliks-app'),'pos');
  assert.equal(sent.headers.get('x-maliks-access-app'),'quote');
  assert.equal(sent.headers.get('x-maliks-original-origin'),'https://maliks-quote.moyanamoses006.workers.dev');
  const salesRequests=[];
  const sr=await salesFrontend.fetch(new Request('https://maliks-sales.example.test/api/catalogue',{headers:{'cf-access-jwt-assertion':'test-token-for:aud-pos'}}),{
    APP_TYPE:'sales',CORE:{fetch:async r=>{salesRequests.push(r);return Response.json({ok:true});}}
  });
  assert.equal(sr.status,200);
  assert.equal(salesRequests[0].headers.get('x-maliks-access-app'),null);
});

const mockDB={prepare(sql){return {
  bind(){return this;},
  first:async()=>({id:1,name:'Developer',email:'developer@example.test',active:1,role:'Developer / Technical Admin',department:'Branch A',workspace_access:'[]'}),
  all:async()=>({results:sql.includes('FROM workspaces')?[{name:'Branch A'}]:[]})
}}};
const env={DB:mockDB,CF_ACCESS_TEAM_DOMAIN:'https://example.cloudflareaccess.com',ACCESS_AUD_POS:'aud-pos',ACCESS_AUD_QUOTE:'aud-quote',NATIVE_LOGIN_APPS:''};
const request=(jwt,appMarker)=>new Request('https://maliks-core.internal/v1/session',{
  headers:{'x-maliks-app':'pos','cf-access-jwt-assertion':jwt,
    ...(appMarker?{'x-maliks-access-app':appMarker}:{}),
    'x-maliks-original-origin':'https://maliks-quote.moyanamoses006.workers.dev'}
});

test('Core accepts Quote Access audience for Quote and POS audience for Sales, but not interchangeably',async()=>{
  // Use genuine RS256-signed JWTs. CI installs real jose, so fake bearer strings
  // (such as "test-token-for:aud-quote") must never be used to test Core.
  // The public JWKS endpoint is mocked locally; NO live Cloudflare credentials,
  // network calls or production changes are involved in this test.
  const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const kid='maliks-test-jwk-rs256';
  const publicJwk={...publicKey.export({format:'jwk'}),kid,alg:'RS256',use:'sig'};
  const base64url=part=>Buffer.from(JSON.stringify(part)).toString('base64url');
  const signedJwt=(audience,key=privateKey)=>{
    const now=Math.floor(Date.now()/1000);
    const prefix=base64url({alg:'RS256',typ:'JWT',kid})+'.'+base64url({
      iss:env.CF_ACCESS_TEAM_DOMAIN,aud:audience,sub:'developer-test',
      email:'developer@example.test',iat:now,exp:now+3600,
    });
    return prefix+'.'+sign('RSA-SHA256',Buffer.from(prefix),key).toString('base64url');
  };
  const originalFetch=globalThis.fetch;
  let jwksRequests=0;
  globalThis.fetch=async url=>{
    const address=typeof url==='string'?url:url?.url||String(url);
    assert.equal(address,env.CF_ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs',
      'Core must fetch the configured Zero Trust issuer JWKS, not an external host');
    jwksRequests++;
    return Response.json({keys:[publicJwk]},{headers:{'content-type':'application/json'}});
  };
  try{
    const quoteToken=signedJwt('aud-quote');
    const salesToken=signedJwt('aud-pos');
    assert.equal((await core.fetch(request(quoteToken,'quote'),env)).status,200,
      'Quote must accept a valid RS256 token with the Quote AUD');
    assert.equal((await core.fetch(request(salesToken,null),env)).status,200,
      'Sales must accept a valid RS256 token with the existing POS AUD');
    assert.equal((await core.fetch(request(salesToken,'quote'),env)).status,401,
      'A Sales Access token must never grant Quote Access');
    assert.equal((await core.fetch(request(quoteToken,null),env)).status,401,
      'A Quote Access token must never grant Sales Access');
    assert.equal((await core.fetch(request(quoteToken,'management'),env)).status,401,
      'Unrecognised Access markers must not select an audience');
    assert.equal((await core.fetch(new Request('https://maliks-core.internal/v1/session',{
      headers:{'x-maliks-app':'management','x-maliks-access-app':'quote',
        'cf-access-jwt-assertion':quoteToken},
    }),env)).status,401,
      'Quote Access must not elevate the caller to management');
    const {privateKey:wrongKey}=generateKeyPairSync('rsa',{modulusLength:2048});
    assert.equal((await core.fetch(request(signedJwt('aud-quote',wrongKey),'quote'),env)).status,401,
      'A forged JWT with the correct audience must fail signature verification');
    assert.ok(jwksRequests>=1,'The real verifier must request the mocked issuer JWKS');
  }finally{
    globalThis.fetch=originalFetch;
  }
});
