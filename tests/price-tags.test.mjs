import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { build } from "esbuild";
const compiledHelpers = await build({entryPoints:[new URL("../app/lib/price-tags.ts",import.meta.url).pathname],bundle:true,platform:"node",format:"esm",write:false});
const { measureTiles, parseTagInput, isPublicPriceTagRequest, tileDefaults, tagBrand, tagTable, tagCustomerUrl } = await import(`data:text/javascript;base64,${Buffer.from(compiledHelpers.outputFiles[0].text).toString("base64")}`);

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
 db.exec(readFileSync(new URL("../drizzle/0034_price_tag_product_pictures.sql",import.meta.url),"utf8"));
 db.exec(readFileSync(new URL("../drizzle/0035_busterbuild_price_tags.sql",import.meta.url),"utf8"));
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
 const busterInput={...input,brand:"busterbuild",price:"259.99"};
 const busterPost=()=>admin.POST(new Request("https://example.com/api/price-tags",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(busterInput)}));
 const buster=(await(await busterPost()).json()).tag;
 assert.notEqual(buster.token,saved.token);assert.equal(buster.brand,"busterbuild");
 assert.equal(db.prepare("SELECT price_cents FROM powerbuild_price_tags WHERE product_id=1").get().price_cents,23456);
 const bp={params:Promise.resolve({token:buster.token})};
 const busterPublic=await(await pub.GET(new Request("https://example.com"),bp)).json();
 assert.equal(busterPublic.product.brand,"busterbuild");assert.equal(busterPublic.product.price_cents,25999);
 busterInput.price="279.99";assert.equal((await(await busterPost()).json()).tag.token,buster.token);
 busterInput.published=false;await busterPost();
 assert.equal((await pub.GET(new Request("https://example.com"),bp)).status,404);
 assert.equal((await pub.GET(new Request("https://example.com"),params)).status,200);
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
test("background cutout preserves enclosed white product areas and protects pale originals",async()=>{
 const compiled=await build({entryPoints:[new URL('../app/lib/product-cutout.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false});
 const {removeWhiteEdge}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
 const pixels=new Uint8ClampedArray(7*7*4).fill(255);
 for(let y=1;y<=5;y++)for(let x=1;x<=5;x++)if(y===1||y===5||x===1||x===5){const i=(y*7+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
 assert.equal(removeWhiteEdge(pixels,7,7).removed,24);assert.equal(pixels[3],0);assert.equal(pixels[(3*7+3)*4+3],255);
 const white=new Uint8ClampedArray(7*7*4).fill(255);assert.equal(removeWhiteEdge(white,7,7).protectedWhiteProduct,true);assert.equal(white[3],255);
});
test("PNG picture uploads require permission and an active saved tag",async()=>{
 let savedKey='',stored=0;globalThis.__priceTagMember=null;
 globalThis.__priceTagEnv={DB:{prepare(sql){return {bind(...values){this.values=values;return this;},async first(){return {product_id:1};},async run(){if(sql.startsWith('UPDATE'))savedKey=this.values[0];return {success:true};}};}},BUCKET:{async put(){stored++;},async delete(){}}};
 const picture=await route('../app/api/price-tags/picture/route.ts');
 const request=()=>{const data=new FormData();data.set('product_id','1');data.set('picture',new File([new Uint8Array([137,80,78,71,13,10,26,10,...new Array(32).fill(0)])],'product.png',{type:'image/png'}));return new Request('https://example.com/api/price-tags/picture',{method:'POST',body:data});};
 assert.equal((await picture.POST(request())).status,403);assert.equal(stored,0);
 globalThis.__priceTagMember={email:'owner@example.com',role:'Owner / Admin',access_scope:'Full company'};
 assert.equal((await picture.POST(request())).status,200);assert.equal(stored,1);assert.match(savedKey,/^price-tags\/1\/.+\.png$/);
 delete globalThis.__priceTagEnv;delete globalThis.__priceTagMember;
});

test("BusterBuild QR links preserve sales scanner codes and validate brand selection",()=>{
 const url=tagCustomerUrl("https://hub.example",{token,code:"A 18079/2",brand:"busterbuild"});
 assert.equal(new URL(url).searchParams.get("code"),"A 18079/2");
 assert.equal(new URL(url).pathname,`/p/${token}`);
 assert.equal(tagCustomerUrl("https://hub.example",{token,code:"X"}),`https://hub.example/p/${token}`);
 assert.throws(()=>tagBrand("sql-injection"));assert.equal(tagTable(tagBrand(null)),"powerbuild_price_tags");
});

test("public BusterBuild price feed exposes only active published prices and read-only CORS",async()=>{
 let query='';globalThis.__priceTagEnv={DB:{prepare(sql){query=sql;return {async all(){return {results:[{code:'A18079',price_cents:25999,unit:'M2',is_tile:1,coverage_per_box:1.44,pieces_per_box:2,updated_at:'today'}]};}};}}};
 const feed=await route('../app/api/public-price-tags/prices/route.ts');const response=await feed.GET();const data=await response.json();
 assert.equal(data.brand,'busterbuild');assert.equal(data.prices[0].price_cents,25999);
 assert.match(query,/t.published=1 AND p.active=1/);assert.equal(response.headers.get('access-control-allow-origin'),'*');assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(feed.POST,undefined);
 assert.equal(isPublicPriceTagRequest('/api/public-price-tags/prices','GET'),true);assert.equal(isPublicPriceTagRequest('/api/public-price-tags/prices','POST'),false);
 globalThis.__priceTagEnv.DB.prepare=()=>{throw Error('database unavailable');};assert.equal((await feed.GET()).status,503);
 delete globalThis.__priceTagEnv;
});
