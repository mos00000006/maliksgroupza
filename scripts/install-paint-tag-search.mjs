import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const root=process.cwd(),changes=[];
function read(p){return readFileSync(resolve(root,p),'utf8');}
function parse(s,kind=ts.ScriptKind.TS){const f=ts.createSourceFile('integration.tsx',s,ts.ScriptTarget.Latest,true,kind);if(f.parseDiagnostics.length)throw Error('Paint/search integration could not parse source. No files changed.');return f;}
function write(p,s,kind=ts.ScriptKind.TS){parse(s,kind);if(s!==read(p))changes.push([p,s]);}
function visit(file,predicate){const out=[];function walk(n){if(predicate(n))out.push(n);ts.forEachChild(n,walk);}walk(file);return out;}
function edit(s,edits){for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0]))s=s.slice(0,start)+text+s.slice(end);return s;}
function need(value,message){if(!value)throw Error(message+' No files changed.');return value;}
function imp(s,text){if(s.includes(text))return s;const directive=/(["'])use client\1;?/;return directive.test(s)?s.replace(directive,m=>m+'\n'+text):text+'\n'+s;}
// Preserve the complete existing tag schema, routes and studio menu.
const model='app/lib/price-tags.ts';let s=read(model);
if(!s.includes('parsePaintColour(body.colour)')){
 const f=parse(s),fn=need(f.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='parseTagInput'),'Tag parser differs.');
 const returns=visit(fn,n=>ts.isReturnStatement(n)&&n.expression&&ts.isObjectLiteralExpression(n.expression));const result=need(returns.find(n=>n.expression.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(f)==='product_id')),'Tag return object differs.');
 s=s.slice(0,result.expression.getStart(f)+1)+' colour: parsePaintColour(body.colour),'+s.slice(result.expression.getStart(f)+1);
 s=imp(s,'import {parsePaintColour} from "./paint-tag-fields";');
}
if(!s.includes('colour?: string')){const f=parse(s),type=need(f.statements.find(n=>ts.isTypeAliasDeclaration(n)&&n.name.text==='PriceTag'&&ts.isTypeLiteralNode(n.type)),'PriceTag model differs.');s=s.slice(0,type.type.getStart(f)+1)+' colour?: string | null;'+s.slice(type.type.getStart(f)+1);}
write(model,s);
const api='app/api/price-tags/route.ts';s=read(api);
if(!s.includes('catalogueSearch(query)')){
 const f=parse(s),fn=need(f.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='GET'),'Tag GET differs.');
 const code=need(visit(fn,n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>ts.isIdentifier(d.name)&&d.name.text==='code'))[0],'Product code lookup differs.');
 const snippet=`\n  const query = new URL(req.url).searchParams.get('q');
  if(query!==null){let search:ReturnType<typeof catalogueSearch>;try{search=catalogueSearch(query);}catch(e){return Response.json({error:(e as Error).message},{status:400});}const found=await env.DB.prepare(search.sql).bind(...search.bindings).all();return Response.json({products:found.results.slice(0,30),more:found.results.length>30},{headers:{'cache-control':'no-store'}});}\n`;
 s=s.slice(0,code.getStart(f))+snippet+s.slice(code.getStart(f));s=imp(s,'import {catalogueSearch} from "../../lib/paint-tag-fields";');
}
if(!s.includes('colour=COALESCE(excluded.colour')){
 const f=parse(s),fn=need(f.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='POST'),'Tag POST differs.');
 const prepare=need(visit(fn,n=>ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='prepare'&&n.arguments[0]?.getText(f).includes('ON CONFLICT(product_id)')&&n.arguments[0].getText(f).includes('price_cents'))[0],'Tag upsert differs.');
 let sql=prepare.arguments[0].getText(f);need(!/RETURNING/i.test(sql),'Tag upsert has an unsupported return clause.');
 const modified=sql.replace(/(INSERT INTO [\s\S]*?\()([^)]*)(\)\s*VALUES\s*\()([^)]*)(\))/i,(_m,a,b,c,d,e)=>a+b+',colour'+c+d+',?'+e);
 need(modified!==sql,'Tag upsert columns differ.');sql=modified.slice(0,-1)+',colour=COALESCE(excluded.colour,${table}.colour)'+modified.slice(-1);
 const bind=need(prepare.parent&&ts.isPropertyAccessExpression(prepare.parent)&&prepare.parent.name.text==='bind'&&ts.isCallExpression(prepare.parent.parent)?prepare.parent.parent:null,'Tag bindings differ.');
 s=edit(s,[[prepare.arguments[0].getStart(f),prepare.arguments[0].end,sql],[bind.arguments.end,bind.arguments.end,',data.colour??null']]);
}
write(api,s);
// Public serialisation uses the same colour for QR pages and initial rendering.
const shared='app/api/price-tags/shared.ts';s=read(shared);
if(!s.includes('publicTagBeforePaintColour')){
 const f=parse(s),fn=need(f.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='publicTag'),'Public tag serialiser differs.');
 const variable=need(visit(f,n=>ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text==='PUBLIC_TAG_COLUMNS')[0],'Public tag columns differ.');
 need(variable.initializer&&fn.parameters.length===1&&ts.isIdentifier(fn.parameters[0].name),'Public tag parameters differ.');const param=fn.parameters[0],name=param.name.text;
 s=edit(s,[[fn.name.getStart(f),fn.name.end,'publicTagBeforePaintColour'],[variable.initializer.getStart(f),variable.initializer.end,'('+variable.initializer.getText(f)+')+",t.colour"']]);
 s+='\nexport function publicTag('+param.getText(f)+'){return {...publicTagBeforePaintColour('+name+'),colour:String('+name+'.colour||"")};}\n';
}
write(shared,s);
const generator='app/price-tags/price-tag-generator.tsx';s=read(generator);
if(!s.includes('ProductNameSearch')){
 s=imp(s,'import ProductNameSearch from "./product-name-search";');
 need(s.includes('const lookup = async () =>'),'Single tag lookup differs.');s=s.replace('const lookup = async () =>','const lookup = async (selectedCode = code) =>').replace('encodeURIComponent(code.trim())','encodeURIComponent(selectedCode.trim())');
 const f=parse(s,ts.ScriptKind.TSX);const form=need(visit(f,n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(f)==='form'&&n.getText(f).includes('styles.lookup')&&n.getText(f).includes('lookup()'))[0],'Single tag search form differs.');
 const component='<ProductNameSearch brand={brand} disabled={busy} onChoose={productCode=>{setCode(productCode);void lookup(productCode);}} onReset={()=>{setProduct(null);setSaved(null);setPicture(null);setPictureMessage("");}}/>';
 s=s.slice(0,form.getStart(f))+component+s.slice(form.end);
}
if(!s.includes('colour: tag?.colour')){
 need(s.includes('type Draft = {')&&s.includes('const empty: Draft = {'),'Single tag draft differs.');s=s.replace('type Draft = {','type Draft = { colour: string;').replace('const empty: Draft = {','const empty: Draft = { colour: "",');
 need(s.includes('setDraft({ price: tag'),'Single tag load differs.');s=s.replace('setDraft({ price: tag','setDraft({ colour: tag?.colour || "", price: tag');
 const anchor='<label className={styles.check}><input type="checkbox" checked={draft.is_tile}';need(s.includes(anchor),'Single tag editor differs.');s=s.replace(anchor,'{!draft.is_tile && <label>Paint colour (optional)<input type="text" maxLength={80} value={draft.colour} placeholder="e.g. White, Ivory, Charcoal" onChange={e=>change({colour:e.target.value})}/></label>}\n'+anchor);
 s=s.replace('Enter a code and price,','Search by product name or code and enter a price,').replace('Add another product code to build','Find another product by name or code to build');
}
write(generator,s,ts.ScriptKind.TSX);
const card='app/price-tags/price-tag-card.tsx';s=read(card);
if(!s.includes('Colour: {tag.colour}')){need(s.includes('<span>Scan for product</span>'),'Printed tag layout differs.');s=s.replace('<span>Scan for product</span>','{tag.colour ? <span style={{fontSize:tag.colour.length>40?"2.1cqw":"2.8cqw",lineHeight:1.1,overflowWrap:"anywhere"}}>Colour: {tag.colour}</span> : <span>Scan for product</span>}');}
write(card,s,ts.ScriptKind.TSX);
const customer='app/p/[token]/product-scan-page.tsx';s=read(customer);
if(!s.includes('Colour: <b>{product.colour}')){const f=parse(s,ts.ScriptKind.TSX),heading=need(visit(f,n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(f)==='h1'&&n.getText(f).includes('{product.name}'))[0],'Customer product heading differs.');s=s.slice(0,heading.end)+'{product.colour && <p>Colour: <b>{product.colour}</b></p>}'+s.slice(heading.end);}
write(customer,s,ts.ScriptKind.TSX);
// Ensure the existing build hook applies the surgical edits on GitHub as well.
const pkg='package.json';const packageData=JSON.parse(read(pkg));packageData.scripts??={};const command='node scripts/install-paint-tag-search.mjs';if(!String(packageData.scripts.prebuild||'').includes('install-paint-tag-search.mjs')){packageData.scripts.prebuild=packageData.scripts.prebuild?packageData.scripts.prebuild+' && '+command:command;changes.push([pkg,JSON.stringify(packageData,null,2)+'\n']);}
if(process.argv.includes('--check')){console.log('Paint colour and name-search integration checks passed.');}else{for(const [p,source] of changes){const path=resolve(root,p);if(!existsSync(path+'.before-paint-search'))writeFileSync(path+'.before-paint-search',readFileSync(path));writeFileSync(path,source);}console.log('Paint colour and name search installed. Existing studio tools and access controls preserved.');}
