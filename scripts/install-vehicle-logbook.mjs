import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const root=process.cwd(),changes=[];
const read=p=>readFileSync(resolve(root,p),'utf8');
const add=(p,s)=>{if(s!==read(p))changes.push([p,s]);};
function parse(s,kind=ts.ScriptKind.TS){const f=ts.createSourceFile('integration.tsx',s,ts.ScriptTarget.Latest,true,kind);if(f.parseDiagnostics.length)throw Error('Vehicle integration cannot parse existing source. No files changed.');return f;}
let worker=read('worker/index.ts');
if(!worker.includes('__fleetBaseWorker')){
 const guard=/if\s*\(\s*(?:![A-Za-z_$][\w$]*\(request\)\s*&&\s*)*!isPublicAsset\(\s*url\.pathname\s*\)/;
 if(!guard.test(worker))throw Error('Worker public-asset guard differs. No files changed. Provide current worker/index.ts for integration.');
 worker=worker.replace(guard,m=>m.replace(/if\s*\(\s*/,'if (!vehiclePublicRequest(request) && '));worker='import {vehiclePublicRequest} from "../app/lib/vehicle-public";\n'+worker;
 const file=parse(worker),exports=file.statements.filter(n=>ts.isExportAssignment(n)&&!n.isExportEquals);if(exports.length!==1)throw Error('Worker default export differs. No files changed.');const node=exports[0];
 worker=worker.slice(0,node.getStart(file))+`const __fleetBaseWorker = (${node.expression.getText(file)});
const fleetWorker = {
 ...__fleetBaseWorker,
 async fetch(request:Request,env:Env,ctx:ExecutionContext){
  const response=await __fleetBaseWorker.fetch(request,env,ctx);
  if(!/^\\/p\\/vehicle\\/[a-f0-9]{64}\\/?$/.test(new URL(request.url).pathname))return response;
  const result=new Response(response.body,response);
  result.headers.set('referrer-policy','no-referrer');
  result.headers.set('cache-control','no-store');
  result.headers.set('x-robots-tag','noindex, nofollow');
  return result;
 }
};
export default fleetWorker;`+worker.slice(node.end);parse(worker);
}
add('worker/index.ts',worker);
let records=read('app/employee-records.tsx');if(!records.includes('<FleetEntry')){const anchor='<section className="employeeRecords">';if(!records.includes(anchor)||!/(?:"|')use client(?:"|')/.test(records))throw Error('Employee Records layout differs. No files changed.');records=records.replace(/(["'])use client\1;?/,m=>m+'\nimport FleetEntry from "./vehicles/fleet-entry";').replace(anchor,anchor+'\n      <FleetEntry/>');parse(records,ts.ScriptKind.TSX);}add('app/employee-records.tsx',records);
const splashPath='app/launch-splash.tsx';if(existsSync(resolve(root,splashPath))){let s=read(splashPath);if(!s.includes('pathname.startsWith("/p/vehicle/")')&&!s.includes('pathname.startsWith("/p/")')){if(!s.includes('const publicStorefront = '))throw Error('Splash layout differs. No files changed.');s=s.replace('const publicStorefront = ','const publicStorefront = pathname.startsWith("/p/vehicle/") || ');}add(splashPath,s);}
if(!process.argv.includes('--check'))for(const [p,s] of changes){const path=resolve(root,p);if(!existsSync(path+'.before-vehicles'))writeFileSync(path+'.before-vehicles',readFileSync(path));writeFileSync(path,s);}
console.log(process.argv.includes('--check')?'Vehicle integration checks passed.':'Vehicle QR logbook integrated. Existing routes and scheduled jobs preserved.');

if(existsSync(resolve(root,'scripts/install-paint-tag-search.mjs'))) await import('./install-paint-tag-search.mjs');
