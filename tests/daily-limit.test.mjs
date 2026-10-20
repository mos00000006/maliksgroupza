import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:[new URL('../app/lib/daily-limit.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {isD1DailyLimit,dailyLimitDetails,dailyLimitResponse}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
test('recognises daily D1 quota errors including nested causes, without masking other errors',()=>{
 for(const value of [new Error("D1_ERROR: Your account has exceeded D1's free tier daily row read limit."),{code:7500},{cause:{code:7500}},'daily row write limit exceeded'])assert.equal(isD1DailyLimit(value),true);
 for(const value of [new Error('no such table: products'),new Error('UNIQUE constraint failed'),new Error('network error'),null,{code:500},'row id 7500 not found'])assert.equal(isD1DailyLimit(value),false);
});
test('reset is the next UTC midnight, displayed as 02:00 in South Africa',()=>{
 const info=dailyLimitDetails(new Date('2026-10-20T10:31:00Z'));
 assert.equal(info.reset_at,'2026-10-21T00:00:00.000Z');assert.equal(info.retry_after,48540);assert.match(info.message,/02:00/);assert.match(info.message,/21 October 2026/);
 assert.equal(dailyLimitDetails(new Date('2026-10-20T23:59:59Z')).retry_after,1);
});
test('returns a friendly no-cache HTML opening page and structured JSON for API requests',async()=>{
 const now=new Date('2026-10-20T10:31:00Z');
 const html=dailyLimitResponse(new Request('https://hub.example/'),now);
 assert.equal(html.status,503);assert.equal(html.headers.get('cache-control'),'no-store');assert.equal(html.headers.get('x-hub-daily-limit'),'reached');assert.equal(html.headers.get('retry-after'),'48540');
 const text=await html.text();assert.match(text,/Daily usage limit reached/);assert.match(text,/Staff do not need to pay/);assert.match(text,/https:\/\/dash.cloudflare.com/);assert.doesNotMatch(text,/Request failed|stack trace/);
 const api=dailyLimitResponse(new Request('https://hub.example/api/catalogue'),now);assert.equal(api.status,503);assert.equal((await api.json()).code,'DAILY_LIMIT_REACHED');
 const rsc=dailyLimitResponse(new Request('https://hub.example/',{headers:{rsc:'1'}}),now);assert.match(rsc.headers.get('content-type'),/application\/json/);
});
