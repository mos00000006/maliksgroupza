import assert from "node:assert/strict";
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {isPublicPowerBuildWebsiteRequest} from "../app/lib/powerbuild-website-public.ts";
const req=(path,method="GET")=>new Request(`https://hub.example${path}`,{method});
test("only customer website and read-only catalogue routes are public",()=>{
  for(const path of ["/powerbuild/index.html","/powerbuild/styles.css","/powerbuild/app.js","/powerbuild/assets/powerbuild-horizontal.png","/api/ecommerce/public","/api/ecommerce/product-image/17","/api/ecommerce/special-image/9","/catalogue/conan-usa/item.webp","/wholesale-products/p02-01.jpg"]) assert.equal(isPublicPowerBuildWebsiteRequest(req(path)),true,path);
  for(const path of ["/","/api/ecommerce/control","/api/team","/worker/index.ts","/powerbuild/../../worker/index.ts"]) assert.equal(isPublicPowerBuildWebsiteRequest(req(path)),false,path);
  assert.equal(isPublicPowerBuildWebsiteRequest(req("/api/ecommerce/public","POST")),false);
});
test("catalogue discovers active new Hub products while respecting explicit opt-out",()=>{
  const source=readFileSync(resolve("app/api/ecommerce/public/route.ts"),"utf8");
  assert.match(source,/LEFT JOIN ecommerce_product_settings e/);
  assert.match(source,/COALESCE\(e\.b2c_enabled,1\)=1/);
  assert.match(source,/e\.b2b_enabled=1/);
  assert.match(source,/publicProductImage/);
});
test("website JavaScript parses",()=>{
  const result=spawnSync(process.execPath,["--check",resolve("public/powerbuild/app.js")],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
});
test("installer adds one Hub button and one public worker gate",()=>{
  const root=mkdtempSync(join(tmpdir(),"pb-website-"));
  try{
    mkdirSync(join(root,"worker"),{recursive:true});mkdirSync(join(root,"app"),{recursive:true});
    writeFileSync(join(root,"worker/index.ts"),`function isPublicAsset(p:string){return false} function isPublicPriceTagRequest(p:string,m:string){return false} const worker={async fetch(request:Request){const url=new URL(request.url);if (!isPublicAsset(url.pathname) && !isPublicPriceTagRequest(url.pathname, request.method)) return new Response('private');return new Response('ok')}};export default worker;`);
    writeFileSync(join(root,"app/page.tsx"),`"use client";export default function Page(){return <div><div className="actions"><button>Quick</button></div></div>}`);
    writeFileSync(join(root,"app/ecommerce-control.tsx"),`export default function C(){return <a href="/shop" target="_blank" rel="noreferrer">Open B2C Store ↗</a>}`);
    const script=resolve("scripts/install-powerbuild-website.py");
    for(let i=0;i<2;i++){const result=spawnSync("python3",[script,root],{encoding:"utf8"});assert.equal(result.status,0,result.stderr||result.stdout)}
    const page=readFileSync(join(root,"app/page.tsx"),"utf8"),worker=readFileSync(join(root,"worker/index.ts"),"utf8"),control=readFileSync(join(root,"app/ecommerce-control.tsx"),"utf8");
    assert.equal((page.match(/View Website/g)||[]).length,1);assert.match(page,/href="\/powerbuild\/index\.html"/);
    assert.equal((worker.match(/!isPublicPowerBuildWebsiteRequest\(request\)/g)||[]).length,1);
    assert.equal((worker.match(/powerbuild-website-public/g)||[]).length,1);
    assert.match(control,/View PowerBuild Website/);
  }finally{rmSync(root,{recursive:true,force:true})}
});
