import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';
const root=process.cwd(),changes=[];
const read=path=>readFileSync(resolve(root,path),'utf8');
const add=(path,source)=>{if(source!==read(path))changes.push([path,source]);};
function parse(source,kind=ts.ScriptKind.TS){const f=ts.createSourceFile('integration.tsx',source,ts.ScriptTarget.Latest,true,kind);if(f.parseDiagnostics.length)throw Error('Cannot parse source. Attendance integration stopped without changes.');return f;}
let worker=read('worker/index.ts');
if(!worker.includes('__attendanceBaseWorker')){
 const guard=/if\s*\(\s*(?:!assessmentPublicRequest\(request\)\s*&&\s*)?!isPublicAsset\(\s*url\.pathname\s*\)/;
 if(!guard.test(worker))throw Error('Worker access guard differs. No files changed. Share current worker/index.ts for integration.');
 worker=worker.replace(guard,m=>m.replace(/if\s*\(\s*/,'if (!attendancePublicRequest(request) && '));
 worker='import {attendancePublicRequest,attendanceResponse} from "../app/lib/attendance-public";\n'+worker;
 const file=parse(worker),exports=file.statements.filter(n=>ts.isExportAssignment(n)&&!n.isExportEquals);if(exports.length!==1)throw Error('Worker default export differs. No files changed.');const node=exports[0];
 worker=worker.slice(0,node.getStart(file))+`const __attendanceBaseWorker = (${node.expression.getText(file)});
const attendanceWorker = {
 ...__attendanceBaseWorker,
 async fetch(request:Request,env:Env,ctx:ExecutionContext){
  return attendanceResponse(request,await __attendanceBaseWorker.fetch(request,env,ctx));
 }
};
export default attendanceWorker;`+worker.slice(node.end);parse(worker);
}
add('worker/index.ts',worker);
let records=read('app/employee-records.tsx');
if(!records.includes('<AttendancePanel')){const anchor='<section className="employeeRecords">';if(!records.includes(anchor)||!records.includes('load(workspace)'))throw Error('Employee Records layout differs. No files changed.');records=records.replace(/(["'])use client\1;?/,m=>m+'\nimport AttendancePanel from "./attendance/attendance-panel";');records=records.replace(anchor,anchor+'\n      <AttendancePanel key={workspace} workspace={workspace} onUpdated={() => { void load(workspace); }} />');parse(records,ts.ScriptKind.TSX);}
add('app/employee-records.tsx',records);
const employeeApi='app/api/employees/route.ts';
if(existsSync(resolve(root,employeeApi))){const api=read(employeeApi).replace('const today = () => new Date().toISOString().slice(0, 10);','const today = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);');parse(api);add(employeeApi,api);}

const splashPath='app/launch-splash.tsx';if(existsSync(resolve(root,splashPath))){let splash=read(splashPath);if(!splash.includes('pathname.startsWith("/p/attendance/")')&&!splash.includes('pathname.startsWith("/p/")')){if(!splash.includes('const publicStorefront = '))throw Error('Splash layout differs. No files changed.');splash=splash.replace('const publicStorefront = ','const publicStorefront = pathname.startsWith("/p/attendance/") || ');}add(splashPath,splash);}
if(process.argv.includes('--check')){console.log('Attendance integration checks passed.');}else{for(const [path,source] of changes){const full=resolve(root,path);if(!existsSync(full+'.before-attendance'))writeFileSync(full+'.before-attendance',readFileSync(full));writeFileSync(full,source);}console.log('Branch QR attendance integrated. Existing routes and scheduled jobs preserved.');}
