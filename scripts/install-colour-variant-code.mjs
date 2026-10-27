import{readFileSync,writeFileSync,existsSync}from'node:fs';import{resolve}from'node:path';import ts from'typescript';
const root=process.cwd(),changes=[];
const read=p=>readFileSync(resolve(root,p),'utf8');
function need(value,message){if(!value)throw Error(message+' No files changed.');return value;}
function parse(s,jsx=false){const f=ts.createSourceFile('integration.tsx',s,ts.ScriptTarget.Latest,true,jsx?ts.ScriptKind.TSX:ts.ScriptKind.TS);need(!f.parseDiagnostics.length,'Source syntax differs.');return f;}
function add(p,s,jsx=false){parse(s,jsx);if(read(p)!==s)changes.push([p,s]);}
function walk(node,match,out=[]){if(match(node))out.push(node);ts.forEachChild(node,n=>{walk(n,match,out);});return out;}
function imp(s,line){if(s.includes(line))return s;const client=/(["'])use client\1;?/;return client.test(s)?s.replace(client,m=>m+'\n'+line):line+'\n'+s;}
let path='app/price-tags/price-tag-generator.tsx',s=read(path);
if(!s.includes('ColourVariantCode')){
 need(s.includes('colour: tag?.colour')&&s.includes('const lookup = async (selectedCode = code) =>'),'Install the paint colour/name-search patch first.');
 s=imp(s,'import ColourVariantCode from "./colour-variant-code";');s=imp(s,'import {sameProductCode} from "../lib/colour-product-code";');
 s=s.replace('const lookup = async (selectedCode = code) => {','const lookup = async (selectedCode = code, keepColourAndPrice = false) => {\n    const enteredColour=draft.colour;const enteredPrice=draft.price;');
 const start='setBusy(true); setMessage(""); setSaved(null); setProduct(null); setDirty(false); setPicture(null); setPictureMessage("");';need(s.includes(start),'Single tag lookup reset differs.');s=s.replace(start,'setBusy(true); setMessage(""); if(!keepColourAndPrice){setSaved(null);setProduct(null);setDirty(false);setPicture(null);setPictureMessage("");}');
 const defaults='const defaults = tileDefaults(p);';need(s.includes(defaults),'Single tag product loading differs.');s=s.replace(defaults,defaults+'\n      setPicture(null);setPictureMessage("");');
 const loaded='setMessage("");setProduct(p); setDraft({ colour: tag?.colour || "", price: tag ?';need(s.includes(loaded),'Single tag colour loading differs.');s=s.replace(loaded,'setMessage("");setProduct(p);setCode(p.code);setDirty(keepColourAndPrice); setDraft({ colour: keepColourAndPrice ? enteredColour || tag?.colour || "" : tag?.colour || "", price: keepColourAndPrice && enteredPrice ? enteredPrice : tag ?');
 const field='{!draft.is_tile && <label>Paint colour (optional)';need(s.includes(field),'Paint colour field differs.');s=s.replace(field,'{!draft.is_tile && <ColourVariantCode value={code} loadedCode={product.code} disabled={busy} onChange={value=>{setCode(value);setDirty(true);}} onApply={()=>void lookup(code,true)}/>}\n'+field);
 need(s.includes('const save = async () => {'),'Single tag save differs.');s=s.replace('if (!product) return; setBusy(true); setMessage("");','if (!product) return; if(!sameProductCode(code,product.code)){setMessage("Load the changed colour code before generating its price tag.");return;} setBusy(true); setMessage("");');
 const body='product_id: product.id, brand, ...draft';need(s.includes(body),'Single tag request differs.');s=s.replace(body,'product_id: product.id, product_code: product.code, brand, ...draft');
 const button='<button className={styles.primary} disabled={busy}';need(s.includes(button),'Single tag generate button differs.');s=s.replace(button,'<button className={styles.primary} disabled={busy || !sameProductCode(code,product.code)}');
}
add(path,s,true);
path='app/lib/price-tags.ts';s=read(path);
if(!s.includes('product_code: colourProductCode(body.product_code)')){
 const file=parse(s),fn=need(file.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='parseTagInput'),'Tag parser differs.');const result=need(walk(fn,n=>ts.isReturnStatement(n)&&n.expression&&ts.isObjectLiteralExpression(n.expression)).find(n=>n.expression.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(file)==='product_id')),'Tag return object differs.');
 const at=result.expression.getStart(file)+1;s=s.slice(0,at)+' product_code: colourProductCode(body.product_code),'+s.slice(at);s=imp(s,'import {colourProductCode} from "./colour-product-code";');
}
add(path,s);
path='app/api/price-tags/route.ts';s=read(path);
if(!s.includes('data.product_code &&')){
 const file=parse(s),fn=need(file.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='POST'),'Tag POST differs.');const statement=need(walk(fn,n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>ts.isIdentifier(d.name)&&d.name.text==='product'))[0],'Tag product validation differs.');const before=statement.getText(file);need(before.includes('SELECT id FROM catalogue_products'),'Tag product query differs.');const after=before.replace('SELECT id FROM catalogue_products','SELECT id,code FROM catalogue_products');s=s.slice(0,statement.getStart(file))+after+s.slice(statement.end);
 const f=parse(s),post=f.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='POST');const guard=need(walk(post,n=>ts.isIfStatement(n)&&n.expression.getText(f)==='!product')[0],'Tag active product guard differs.');const check='\n  if(data.product_code && !sameProductCode(data.product_code,String((product as Record<string,unknown>).code)))return Response.json({error:"The product code changed. Load the correct colour code again before generating."},{status:409});\n';s=s.slice(0,guard.end)+check+s.slice(guard.end);s=imp(s,'import {sameProductCode} from "../../lib/colour-product-code";');
}
add(path,s);
const pkg=JSON.parse(read('package.json'));pkg.scripts??={};const command='node scripts/install-colour-variant-code.mjs';if(!String(pkg.scripts.prebuild||'').includes('install-colour-variant-code.mjs')){pkg.scripts.prebuild=pkg.scripts.prebuild?pkg.scripts.prebuild+' && '+command:command;changes.push(['package.json',JSON.stringify(pkg,null,2)+'\n']);}
if(!process.argv.includes('--check'))for(const[p,source]of changes){const full=resolve(root,p);if(!existsSync(full+'.before-colour-code'))writeFileSync(full+'.before-colour-code',readFileSync(full));writeFileSync(full,source);}
console.log(process.argv.includes('--check')?'Colour variant code integration checks passed.':'Editable colour product codes installed. Existing catalogue products and QR identity preserved.');
if(existsSync(resolve(root,'scripts/install-auto-colour-catalogue.mjs')))await import('./install-auto-colour-catalogue.mjs');
if(existsSync(resolve(root,'scripts/install-torkcraft-images.mjs')))await import('./install-torkcraft-images.mjs');
