import{readFileSync,writeFileSync,existsSync}from'node:fs';import ts from'typescript';
const changes=[];function edit(path,change){const before=readFileSync(path,'utf8'),after=change(before);const parsed=ts.createSourceFile(path,after,ts.ScriptTarget.Latest,true,path.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);if(parsed.parseDiagnostics.length)throw Error('Syntax check failed: '+path);if(after!==before)changes.push([path,after]);}
function replace(s,a,b){if(!s.includes(a))throw Error('Integration differs. No files changed: '+a.slice(0,90));return s.replace(a,b);}
edit('app/api/price-tags/route.ts',s=>{
 if(s.includes('createColourProduct(req,'))return s;
 const at=s.indexOf('export async function POST(');if(at<0)throw Error('Price-tag POST missing');
 let post=s.slice(at);post=replace(post,'let data; let brand;','const colourProduct=await createColourProduct(req,member!.email);if(colourProduct)return colourProduct;\n  let data; let brand;');
 if(!post.includes('hasDesignerSession')||post.indexOf('hasDesignerSession')>post.indexOf('createColourProduct(req,'))throw Error('Designer guard differs');
 return 'import {createColourProduct} from "./create-colour-product";\n'+s.slice(0,at)+post;
});
edit('app/price-tags/price-tag-generator.tsx',s=>{
 if(s.includes('action:"create_colour_product"'))return s;
 if(!s.includes('keepColourAndPrice = false'))throw Error('Install the editable colour product code patch first. No files changed.');
 s=replace(s,'const res = await fetch(`/api/price-tags?brand=${brand}&code=${encodeURIComponent(selectedCode.trim())}`, { cache: "no-store" }); const json = await priceTagResponse(res,',`let res = await fetch(\x60/api/price-tags?brand=\x24{brand}&code=\x24{encodeURIComponent(selectedCode.trim())}\x60, { cache: "no-store" });
      if(res.status===404 && keepColourAndPrice && product){
        if(!enteredColour?.trim())throw new Error("Enter the paint colour before saving a new catalogue code.");
        const created=await fetch("/api/price-tags",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create_colour_product",source_id:product.id,code:selectedCode.trim(),colour:enteredColour})});
        const result=await priceTagResponse(created,"The colour product could not be saved.");
        res=await fetch(\x60/api/price-tags?brand=\x24{brand}&code=\x24{encodeURIComponent(result.code)}\x60,{cache:"no-store"});
      }
      const json = await priceTagResponse(res,`);
 return s;
});
edit('app/price-tags/colour-variant-code.tsx',s=>s.replace('Use code for this colour</button>','Use / save colour code</button>').replace('to load that product. Your entered price and colour carry over; review them before generating.','to load it, or automatically add a new catalogue product using the selected product’s details and picture. Enter the paint colour first. Your price carries over; review before generating.'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));const cmd='node scripts/install-auto-colour-catalogue.mjs';if(!String(pkg.scripts?.prebuild||'').includes(cmd)){pkg.scripts??={};pkg.scripts.prebuild=pkg.scripts.prebuild?pkg.scripts.prebuild+' && '+cmd:cmd;changes.push(['package.json',JSON.stringify(pkg,null,2)+'\n']);}
if(!process.argv.includes('--check'))for(const[p,s]of changes){if(!existsSync(p+'.before-auto-colour'))writeFileSync(p+'.before-auto-colour',readFileSync(p));writeFileSync(p,s);}
console.log('Automatic colour catalogue integration '+(process.argv.includes('--check')?'checks passed.':'installed.'));
