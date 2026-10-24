import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const root=process.cwd(),worker=resolve(root,'worker/index.ts'),hub=resolve(root,'app/page.tsx');
let source=readFileSync(worker,'utf8');const original=source;
const marker='__assessmentBaseWorker';
function parse(code){const file=ts.createSourceFile(worker,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);if(file.parseDiagnostics.length)throw new Error('Worker syntax could not be parsed. No files changed.');return file;}
function addImport(code,module,names){const file=parse(code);const declaration=file.statements.find(node=>ts.isImportDeclaration(node)&&node.moduleSpecifier.text===module&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings));if(declaration){const bindings=declaration.importClause.namedBindings;const existing=bindings.elements.map(node=>node.getText(file));for(const name of names)if(!bindings.elements.some(node=>node.name.text===name))existing.push(name);return code.slice(0,bindings.getStart(file))+'{ '+existing.join(', ')+' }'+code.slice(bindings.end);}return `import { ${names.join(', ')} } from "${module}";\n`+code;}
if(!source.includes(marker)){
 if(!source.includes('assessmentPublicRequest(request)')){const guard=/if\s*\(\s*!isPublicAsset\(\s*url\.pathname\s*\)/;if(!guard.test(source))throw new Error('Worker public-asset guard differs. No files changed; provide the current worker/index.ts for integration.');source=source.replace(guard,match=>match.replace(/if\s*\(\s*/,'if (!assessmentPublicRequest(request) && '));}
 source=addImport(source,'../app/lib/assessment-public',['assessmentPublicRequest','assessmentResponse']);
 source=addImport(source,'../app/lib/assessment-retention',['purgeExpiredAssessments']);
 // Move an earlier version's cleanup call into the wrapper, preserving every other scheduled job.
 source=source.replace(/^\s*ctx\.waitUntil\(purgeExpiredAssessments\([^\n]*\)\);\s*$/gm,'');
 const file=parse(source),defaults=file.statements.filter(node=>ts.isExportAssignment(node)&&!node.isExportEquals);if(defaults.length!==1)throw new Error('Worker default export differs. No files changed.');const declaration=defaults[0],expression=declaration.expression.getText(file);
 const wrapper=`const ${marker} = (${expression});
export default {
  ...${marker},
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Preserve the complete existing response path, including QR handling and security headers.
    return assessmentResponse(request, await ${marker}.fetch(request, env, ctx));
  },
  async scheduled(controller: unknown, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(purgeExpiredAssessments(env));
    const previousScheduled = Reflect.get(${marker}, "scheduled");
    if (typeof previousScheduled === "function") return previousScheduled.call(${marker}, controller, env, ctx);
  },
};`;
 source=source.slice(0,declaration.getStart(file))+wrapper+source.slice(declaration.end);parse(source);
}
let page=existsSync(hub)?readFileSync(hub,'utf8'):null;
if(page&&!page.includes('href="/assessments"')){if(!page.includes('</aside>')||!page.includes('currentUser'))throw new Error('Hub sidebar differs. No files changed.');page=page.replace('</aside>','{(currentUser.access_scope === "Full company" || currentUser.role === "Human Resource (HR)") && <AssessmentCentreLink href="/assessments" style={{display:"block",margin:"12px 4px",padding:"12px",background:"#ffd82d",color:"#142b3d",borderRadius:6,fontSize:12,fontWeight:800,textDecoration:"none"}}>HR assessments &amp; candidate tests ↗</AssessmentCentreLink>}\n      </aside>');page=page.replaceAll('Employee Records only','Employee Records & assessments');}
if(page){page=page.replace(/<a href="\/assessments"([\s\S]*?)<\/a>/g,'<AssessmentCentreLink href="/assessments"$1</AssessmentCentreLink>');if(page.includes('href="/assessments"')&&!page.includes('import AssessmentCentreLink from "next/link";')){const directive=/(["'])use client\1;?/;if(!directive.test(page))throw new Error('Hub client directive differs. No files changed.');page=page.replace(directive,match=>match+'\nimport AssessmentCentreLink from "next/link";');}}
const splashPath=resolve(root,'app/launch-splash.tsx');let splash=existsSync(splashPath)?readFileSync(splashPath,'utf8'):null;if(splash&&!splash.includes('pathname === "/p/assessment"')){const anchor='const publicStorefront = ';if(splash.includes(anchor))splash=splash.replace(anchor,anchor+'pathname === "/p/assessment" || pathname.startsWith("/p/assessment/") || ');else if(!splash.includes('pathname.startsWith("/p/")')&&!splash.includes("pathname.startsWith('/p/')"))throw new Error('Launch splash differs. No files changed.');}
if(process.argv.includes('--check')){console.log('Assessment integration checks passed. Run without --check to apply.');process.exit(0);}
if(source!==original){if(!existsSync(worker+'.before-assessments'))writeFileSync(worker+'.before-assessments',original);writeFileSync(worker,source);}
if(page!==null&&page!==readFileSync(hub,'utf8')){if(!existsSync(hub+'.before-assessments'))writeFileSync(hub+'.before-assessments',readFileSync(hub));writeFileSync(hub,page);}
if(splash!==null&&splash!==readFileSync(splashPath,'utf8')){if(!existsSync(splashPath+'.before-assessments'))writeFileSync(splashPath+'.before-assessments',readFileSync(splashPath));writeFileSync(splashPath,splash);}
console.log('Assessment integration applied. Existing response handlers, QR rules and scheduled jobs preserved.');
