import test from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
const result=await build({entryPoints:[new URL('../app/lib/price-tag-response.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false});
const {priceTagResponse}=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
test('plain-text and empty 413 responses explain the upload limit instead of producing JSON syntax errors',async()=>{
 for(const text of ['Payload Too Large',''])await assert.rejects(priceTagResponse(new Response(text,{status:413}),'Save failed'),/picture is too large/);
});
test('tag requests preserve useful JSON errors and handle HTML/server errors without exposing markup',async()=>{
 await assert.rejects(priceTagResponse(Response.json({error:'Daily usage limit reached'},{status:503}),'Save failed'),/Daily usage limit reached/);
 await assert.rejects(priceTagResponse(new Response('<html>Internal error</html>',{status:500}),'Please retry'),/^Error: Please retry$/);
 assert.deepEqual(await priceTagResponse(Response.json({saved:true}),'failed'),{saved:true});
});
