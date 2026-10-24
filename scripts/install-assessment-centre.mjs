import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
// Surgical integration: preserve the installed Worker's existing product/staff QR bypasses.
const root=process.cwd(),worker=resolve(root,'worker/index.ts'),hub=resolve(root,'app/page.tsx');
let source=readFileSync(worker,'utf8');const original=source;
if(!source.includes('assessmentPublicRequest')){
 const condition='if (!isPublicAsset(url.pathname)';if(!source.includes(condition))throw new Error('Worker public-asset guard differs. No files changed; provide the current worker/index.ts for integration.');
 source='import { assessmentPublicRequest } from "../app/lib/assessment-public";\nimport { purgeExpiredAssessments } from "../app/lib/assessment-retention";\n'+source;
 source=source.replace(condition,'if (!assessmentPublicRequest(request) && !isPublicAsset(url.pathname)');
 const signature='function secure(response: Response)';if(!source.includes(signature))throw new Error('Worker security header function differs. No files changed.');source=source.replace(signature,'function secure(response: Response, assessmentCamera = false)');
 const policy='"camera=(), microphone=(), geolocation=(self), payment=()"';if(!source.includes(policy))throw new Error('Worker camera policy differs. No files changed.');source=source.replace(policy,'assessmentCamera ? "camera=(self), microphone=(), geolocation=(self), payment=()" : "camera=(), microphone=(), geolocation=(self), payment=()"');
 if(!source.includes("connect-src 'self';"))throw new Error('Worker content policy differs. No files changed.');source=source.replace("connect-src 'self';","connect-src 'self'; media-src 'self' blob:;");
 const handler='return secure(await handler.fetch(request, env, ctx));';if(!source.includes(handler))throw new Error('Worker response handler differs. No files changed.');source=source.replace(handler,'return secure(await handler.fetch(request, env, ctx), /^\\/p\\/assessment\\/[a-f0-9]{64}\\/?$/.test(url.pathname));');
 const schedule=/async scheduled\([^)]*\)\s*\{/;if(!schedule.test(source))throw new Error('Hourly worker schedule differs. No files changed.');source=source.replace(schedule,match=>match+'\n    ctx.waitUntil(purgeExpiredAssessments(_env));');
 if(!/scheduled\([^)]*_env\s*:/.test(source))throw new Error('Scheduled environment parameter differs. No files changed.');
}
let page=existsSync(hub)?readFileSync(hub,'utf8'):null;
if(page&&!page.includes('href="/assessments"')){if(!page.includes('</aside>')||!page.includes('currentUser'))throw new Error('Hub sidebar differs. No files changed.');page=page.replace('</aside>','{(currentUser.access_scope === "Full company" || currentUser.role === "Human Resource (HR)") && <AssessmentCentreLink href="/assessments" style={{display:"block",margin:"12px 4px",padding:"12px",background:"#ffd82d",color:"#142b3d",borderRadius:6,fontSize:12,fontWeight:800,textDecoration:"none"}}>HR assessments &amp; candidate tests ↗</AssessmentCentreLink>}\n      </aside>');page=page.replaceAll('Employee Records only','Employee Records & assessments');}
if(page){page=page.replace(/<a href="\/assessments"([\s\S]*?)<\/a>/g,'<AssessmentCentreLink href="/assessments"$1</AssessmentCentreLink>');if(page.includes('href="/assessments"')&&!page.includes('import AssessmentCentreLink from "next/link";')){const directive=/(["'])use client\1;?/;if(!directive.test(page))throw new Error('Hub client directive differs. No files changed.');page=page.replace(directive,match=>match+'\nimport AssessmentCentreLink from "next/link";');}}
const splashPath=resolve(root,'app/launch-splash.tsx');let splash=existsSync(splashPath)?readFileSync(splashPath,'utf8'):null;if(splash&&!splash.includes('pathname === "/p/assessment"')){const anchor='const publicStorefront = ';if(splash.includes(anchor))splash=splash.replace(anchor,anchor+'pathname === "/p/assessment" || pathname.startsWith("/p/assessment/") || ');else if(!splash.includes('pathname.startsWith("/p/")')&&!splash.includes("pathname.startsWith('/p/')"))throw new Error('Launch splash differs. No files changed.');}
if(process.argv.includes('--check')){console.log('Assessment integration checks passed. Run without --check to apply.');process.exit(0);}
if(source!==original){if(!existsSync(worker+'.before-assessments'))writeFileSync(worker+'.before-assessments',original);writeFileSync(worker,source);}
if(page!==null&&page!==readFileSync(hub,'utf8')){if(!existsSync(hub+'.before-assessments'))writeFileSync(hub+'.before-assessments',readFileSync(hub));writeFileSync(hub,page);}
if(splash!==null&&splash!==readFileSync(splashPath,'utf8')){if(!existsSync(splashPath+'.before-assessments'))writeFileSync(splashPath+'.before-assessments',readFileSync(splashPath));writeFileSync(splashPath,splash);}
console.log('Assessment integration applied. Existing public QR rules preserved. Apply migration 0041, then build and deploy.');
