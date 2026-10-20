import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
const compiledHelpers = await build({entryPoints:[new URL("../app/lib/price-tags.ts",import.meta.url).pathname],bundle:true,platform:"node",format:"esm",write:false});
const { measureTiles, parseTagInput, isPublicPriceTagRequest, tileDefaults } = await import(`data:text/javascript;base64,${Buffer.from(compiledHelpers.outputFiles[0].text).toString("base64")}`);

const token = "2b2b2b2b-1234-4567-8901-2b2b2b2b2b2b";
test("tile estimates use full boxes, multiple rooms, wastage and the selected pricing basis", () => {
  const m2 = measureTiles([{ length: 4, width: 3 }, { length: 2, width: 2 }],10,1.44,19999,"M2");
  assert.deepEqual(m2,{ area:16,required:17.6,boxes:13,supplied:18.72,totalCents:374381 });
  assert.equal(measureTiles([{ length:4,width:3 }],0,1.2,15000,"BOX").boxes,10);
  assert.equal(measureTiles([{ length:4,width:3 }],0,1.2,15000,"BOX").totalCents,150000);
  assert.equal(measureTiles([{ length:4,width:0 }],10,1.44,10000,"M2"),null);
  assert.equal(measureTiles([{ length:4,width:3 }],-1,1.44,10000,"M2"),null);
  assert.equal(measureTiles([{ length:4,width:3 }],10,0,10000,"M2"),null);
});
test("tag input rejects fractional pieces, missing tile coverage and invalid money", () => {
 const valid={product_id:1,price:"389.99",unit:"M2",is_tile:true,coverage_per_box:1.44,pieces_per_box:4,tile_width_mm:600,tile_length_mm:600,published:true};
 assert.equal(parseTagInput(valid).price_cents,38999);
 for(const price of ["0","-1","1.234","NaN","Infinity","", "1e4"]) assert.throws(()=>parseTagInput({...valid,price}));
 assert.throws(()=>parseTagInput({...valid,coverage_per_box:0}));
 assert.throws(()=>parseTagInput({...valid,pieces_per_box:1.5}));
 assert.throws(()=>parseTagInput({...valid,published:"false"}));
 const defaults=tileDefaults({name:"Porcelain 1200x1800mm",category:"Tiles & Flooring",description:""});
 assert.equal(defaults.coverage_per_box,0); // Never infer a box's coverage from nominal dimensions.
});
test("anonymous access is limited to exact public QR routes, never management or writes",()=>{
 assert.equal(isPublicPriceTagRequest(`/p/${token}`,"GET"),true);
 assert.equal(isPublicPriceTagRequest(`/api/public-price-tags/${token}/image`,"GET"),true);
 for(const path of ["/price-tags","/api/price-tags","/api/catalogue","/p/not-a-token",`/p/${token}/image`,`/api/public-price-tags/${token}/admin`]) assert.equal(isPublicPriceTagRequest(path,"GET"),false,path);
 assert.equal(isPublicPriceTagRequest(`/api/public-price-tags/${token}`,"POST"),false);
});
async function route(entry) {
 const result=await build({entryPoints:[new URL(entry,import.meta.url).pathname],bundle:true,platform:"node",format:"esm",write:false,plugins:[{name:"test-bindings",setup(b){
  b.onResolve({filter:/^cloudflare:workers$/},()=>({path:"env",namespace:"test"}));
  b.onLoad({filter:/.*/,namespace:"test"},()=>({contents:"export const env=globalThis.__priceTagEnv;"}));
  b.onLoad({filter:/app\/api\/access\.ts$/},()=>({contents:"export async function getHubMember(){return globalThis.__priceTagMember;}"}));
 }}]});
 return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${Math.random()}`);
}
test("price-tag APIs enforce permissions, stable QR tokens, public whitelisting and unpublishing",async()=>{
 const db=new DatabaseSync(":memory:");
 db.exec(readFileSync(new URL("../drizzle/0012_catalogue_prepared_stock.sql",import.meta.url),"utf8").split("--> statement-breakpoint")[0]);
 db.exec(readFileSync(new URL("../drizzle/0033_powerbuild_price_tags.sql",import.meta.url),"utf8"));
 db.prepare("INSERT INTO catalogue_products (code,name,description,category,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run("TEST1","Test Tile","PRIVATE DESCRIPTION","Tiles","owner","today","today");
 globalThis.__priceTagEnv={DB:{prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return db.prepare(sql).get(...args)||null;},async run(){db.prepare(sql).run(...args);return {success:true};}};}}};
 globalThis.__priceTagMember=null;
 const admin=await route("../app/api/price-tags/route.ts"); const pub=await route("../app/api/public-price-tags/[token]/route.ts");
 const input={product_id:1,price:"123.45",unit:"M2",is_tile:true,coverage_per_box:1.44,pieces_per_box:4,published:true};
 const post=()=>admin.POST(new Request("https://example.com/api/price-tags",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)}));
 assert.equal((await post()).status,403);
 globalThis.__priceTagMember={email:"viewer@example.com",role:"Viewer",access_scope:"Full company"}; assert.equal((await post()).status,403);
 globalThis.__priceTagMember={email:"owner@example.com",role:"Owner / Admin",access_scope:"Full company"};
 const saved=(await (await post()).json()).tag;assert.ok(saved.token);
 input.price="234.56";const changed=(await (await post()).json()).tag;assert.equal(changed.token,saved.token);
 const params={params:Promise.resolve({token:saved.token})};const response=await pub.GET(new Request("https://example.com"),params);
 const json=await response.json();assert.equal(json.product.price_cents,23456);assert.equal(response.headers.get("cache-control"),"no-store");
 for(const privateKey of ["description","updated_by","created_by","image_key"]) assert.equal(privateKey in json.product,false);
 input.published=false;await post();assert.equal((await pub.GET(new Request("https://example.com"),params)).status,404);
 db.close();delete globalThis.__priceTagEnv;delete globalThis.__priceTagMember;
});
test("public product images require a published active tag and reject unsafe image sources",async()=>{
 let row=null; let assetCalls=0;
 globalThis.__priceTagEnv={DB:{prepare(){return {bind(){return this;},async first(){return row;}}}},ASSETS:{async fetch(){assetCalls++;return new Response('test-image',{headers:{'content-type':'image/png'}});}}};
 const image=await route("../app/api/public-price-tags/[token]/image/route.ts");const params={params:Promise.resolve({token})};const request=new Request('https://example.com/api/public-price-tags/'+token+'/image');
 assert.equal((await image.GET(request,params)).status,404);assert.equal(assetCalls,0);
 row={image_key:'external:http://127.0.0.1/private',image_type:'image/png'};assert.equal((await image.GET(request,params)).status,404);
 row={image_key:'static:/catalogue/../../private.png',image_type:'image/png'};assert.equal((await image.GET(request,params)).status,404);
 row={image_key:'static:/catalogue/conan-usa/test.webp',image_type:'image/webp'};assert.equal((await image.GET(request,params)).status,200);assert.equal(assetCalls,1);
 delete globalThis.__priceTagEnv;
});
