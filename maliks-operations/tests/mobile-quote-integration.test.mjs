import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import mobileFrontend from '../src/mobile-quote-frontend.mjs';
import salesFrontend from '../src/frontend.mjs';
import {resolveMobilePriceTag,listBranchSalesQuotes} from '../src/mobile-quote-domain.mjs';

const id='123e4567-e89b-42d3-a456-426614174000';
const uuid=()=>id;
const owner={email:'sales@example.test',name:'Sales Staff',active:1,role:'Sales',department:'Branch A'};
const context=(app='pos',branches=['Branch A'])=>({app,branches,member:owner});
class D1{
 constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec(`
  CREATE TABLE catalogue_products(id INTEGER PRIMARY KEY,code TEXT,name TEXT,category TEXT,active INTEGER);
  CREATE TABLE powerbuild_price_tags(product_id INTEGER,token TEXT,published INTEGER,price_cents INTEGER,unit TEXT,coverage_per_box REAL);
  CREATE TABLE busterbuild_price_tags(product_id INTEGER,token TEXT,published INTEGER,price_cents INTEGER,unit TEXT,coverage_per_box REAL);
  CREATE TABLE price_tag_branch_prices(product_id INTEGER,brand TEXT,branch_name TEXT,price_cents INTEGER);
  CREATE TABLE till_quotation_submissions(id INTEGER PRIMARY KEY,branch TEXT,submitted_by_name TEXT,customer_name TEXT,customer_contact TEXT,notes TEXT,status TEXT,net_cents INTEGER,vat_cents INTEGER,total_cents INTEGER,lines_json TEXT,created_at TEXT);
  INSERT INTO catalogue_products VALUES(11,'CEM001','Cement 50KG','Cement',1),(12,'BAD01','Unpublished','General',1);
  INSERT INTO powerbuild_price_tags VALUES(11,'${id}',1,11500,'BAG',0),(12,'ffffffff-ffff-4fff-8fff-ffffffffffff',0,899,'EA',0);
  INSERT INTO price_tag_branch_prices VALUES(11,'powerbuild','Branch A',11995);
  INSERT INTO till_quotation_submissions VALUES(1,'Branch A','Other Sales','Client A','0821234567','','AWAITING_CASH_OFFICE',10430,1565,11995,'[{"product_id":11,"code":"CEM001","name":"Cement 50KG","quantity":1,"price_cents":11995,"line_total_cents":11995}]','2026-11-16T10:00:00Z');
  INSERT INTO till_quotation_submissions VALUES(2,'Branch B','Other Sales','Secret Branch B','0829998888','','AWAITING_CASH_OFFICE',3000,450,3450,'[]','2026-11-16T10:00:00Z');
 `);}
 prepare(sql){const db=this.sqlite;let v=[];return {bind(...args){v=args;return this;},first(){return db.prepare(sql).get(...v)||null;},all(){return {results:db.prepare(sql).all(...v)};},run(){const r=db.prepare(sql).run(...v);return {meta:{changes:Number(r.changes)}};}};}
}
const req=(path)=>new Request('https://maliks-core.test'+path);
test('Original shelf tag resolves current branch price without trusting QR price',async()=>{
 const env={DB:new D1()};const response=await resolveMobilePriceTag(req('/v1/quote/tag?branch=Branch%20A&tag='+id+'&price=0'),env,context());
 assert.equal(response.status,200);const row=(await response.json()).product;assert.equal(row.price_cents,11995);assert.equal(row.code,'CEM001');
 assert.equal((await resolveMobilePriceTag(req('/v1/quote/tag?branch=Branch%20B&tag='+id),env,context())).status,403);
 assert.equal((await resolveMobilePriceTag(req('/v1/quote/tag?branch=Branch%20A&tag='+id+'&tag_branch=Branch%20B'),env,context())).status,400);
 assert.equal((await resolveMobilePriceTag(req('/v1/quote/tag?branch=Branch%20A&tag=ffffffff-ffff-4fff-8fff-ffffffffffff'),env,context())).status,404);
 assert.equal((await resolveMobilePriceTag(req('/v1/quote/tag?branch=Branch%20A&tag=javascript%3Aalert(1)'),env,context())).status,400);
});
test('Branch quotation print queue shares only authorised branch records',async()=>{
 const env={DB:new D1()};let res=await listBranchSalesQuotes(req('/v1/quote/branch-queue?branch=Branch%20A'),env,context());
 assert.equal(res.status,200);const rows=(await res.json()).quotes;assert.equal(rows.length,1);assert.equal(rows[0].number,'Q-00000001');
 assert.equal(rows[0].lines[0].name,'Cement 50KG');
 assert.equal((await listBranchSalesQuotes(req('/v1/quote/branch-queue?branch=Branch%20B'),env,context())).status,403);
 assert.equal((await listBranchSalesQuotes(req('/v1/quote/branch-queue?branch=Branch%20A'),env,context('tills'))).status,403);
});
test('Maliks Quote website contains responsive QR, scanner, save, WhatsApp/email and printable invoice, without payments',async()=>{
 const res=await mobileFrontend.fetch(new Request('https://maliks-quote.test/'),{});assert.equal(res.status,200);
 const html=await res.text();for(const term of ['MALIKS <span>QUOTE</span>','id="camera"','Start camera scan','Add scanned product','Save quotation','Branch Quotes','WhatsApp','Email','@media print'])assert.ok(html.includes(term),term);
 assert.doesNotMatch(html,/\/api\/payments|\/api\/dispatch-jobs/);
 const match=html.match(/<script>([\s\S]*?)<\/script>/);assert.ok(match);
 const folder=mkdtempSync(join(tmpdir(),'maliks-quote-'));
 try{const file=join(folder,'test-script.js');writeFileSync(file,match[1]);execFileSync(process.execPath,['--check',file]);}
 finally{rmSync(folder,{recursive:true,force:true});}
 const logo=await mobileFrontend.fetch(new Request('https://maliks-quote.test/powerbuild-logo.png'),{});
 assert.equal(logo.status,200);assert.equal(logo.headers.get('content-type'),'image/png');
});
test('Mobile worker forwards only the Sales quote/catalogue routes to private Core with staff identity and same-origin validation',async()=>{
 const forwarded=[];const env={CORE:{fetch:async req=>{forwarded.push(req);return Response.json({test:true});}}};
 const auth={'cf-access-jwt-assertion':'verified-test-jwt'};
 const a=await mobileFrontend.fetch(req('/api/quote/tag?branch=Branch%20A&tag='+id),env);
 assert.equal(a.status,401); // Request must be to the quote worker with correct Host and authentication.
 const r=await mobileFrontend.fetch(new Request('https://maliks-quote.test/api/quote/tag?branch=Branch%20A&tag='+id,{headers:auth}),env);
 assert.equal(r.status,200);assert.equal(forwarded[0].headers.get('x-maliks-app'),'pos');
 assert.equal(forwarded[0].headers.get('cf-access-jwt-assertion'),'verified-test-jwt');
 assert.equal(new URL(forwarded[0].url).pathname,'/v1/quote/tag');
 const save=await mobileFrontend.fetch(new Request('https://maliks-quote.test/api/quotes',{method:'POST',headers:{...auth,origin:'https://maliks-quote.test'},body:'{}'}),env);
 assert.equal(save.status,200);assert.equal(forwarded[1].headers.get('x-maliks-original-origin'),'https://maliks-quote.test');
 const blocked=await mobileFrontend.fetch(new Request('https://maliks-quote.test/api/quotes',{method:'POST',headers:{...auth,origin:'https://evil.test'},body:'{}'}),env);
 assert.equal(blocked.status,403);
 const forbidden=await mobileFrontend.fetch(new Request('https://maliks-quote.test/api/payments',{headers:auth}),env);
 assert.equal(forbidden.status,404);
 assert.equal(forwarded.length,2);
});
test('Maliks Sales PC lists shared branch quotes for printing alongside own quotes',async()=>{
 const page=await (await salesFrontend.fetch(new Request('https://maliks-sales.test/'),{APP_TYPE:'sales'})).text();
 assert.match(page,/Branch quotation print queue · Mobile \+ PC/);
 assert.match(page,/api\/quote\/branch-queue/);
 assert.match(page,/Print 80mm quote/);
 const forwarded=[];const env={APP_TYPE:'sales',CORE:{fetch:async req=>{forwarded.push(req);return Response.json({quotes:[]});}}};
 const res=await salesFrontend.fetch(new Request('https://maliks-sales.test/api/quote/branch-queue?branch=Branch%20A',{headers:{'cf-access-jwt-assertion':'jwt'}}),env);
 assert.equal(res.status,200);assert.equal(new URL(forwarded[0].url).pathname,'/v1/quote/branch-queue');
});
test('Printed QR product page includes staff shortcut to Quote without replacing QR codes',()=>{
 const page=readFileSync(new URL('../../app/p/[token]/product-scan-page.tsx',import.meta.url),'utf8');
 assert.match(page,/Staff · Add to Maliks Quote/);
 assert.match(page,/maliks-quote\.moyanamoses006\.workers\.dev/);
 assert.match(page,/encodeURIComponent\(token\)/);
 const tagFn=readFileSync(new URL('../../app/lib/price-tags.ts',import.meta.url),'utf8');
 assert.match(tagFn,/new URL\(`\/p\/\$\{tag.token\}`/);
});
