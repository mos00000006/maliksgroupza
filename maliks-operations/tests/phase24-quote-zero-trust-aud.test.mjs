import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
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
  // The jose package in this local test environment is a test double that
  // asserts issuer, algorithm setting and requested AUD; real JWT cryptographic
  // validation is provided by jose in the deployed Worker.
  assert.equal((await core.fetch(request('test-token-for:aud-quote','quote'),env)).status,200);
  assert.equal((await core.fetch(request('test-token-for:aud-pos',null),env)).status,200);
  assert.equal((await core.fetch(request('test-token-for:aud-pos','quote'),env)).status,401);
  assert.equal((await core.fetch(request('test-token-for:aud-quote',null),env)).status,401);
  assert.equal((await core.fetch(request('test-token-for:aud-quote','management'),env)).status,401);
  assert.equal((await core.fetch(new Request('https://maliks-core.internal/v1/session',{headers:{'x-maliks-app':'management','x-maliks-access-app':'quote','cf-access-jwt-assertion':'test-token-for:aud-quote'}}),env)).status,401);
});
