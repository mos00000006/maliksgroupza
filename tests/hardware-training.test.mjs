import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const root=new URL('../',import.meta.url).pathname;
const folder=mkdtempSync(join(tmpdir(),'hub-training-'));
await build({entryPoints:[root+'app/lib/hardware-training.ts'],bundle:true,platform:'node',format:'esm',outfile:folder+'/bank.mjs'});
const bank=await import(pathToFileURL(folder+'/bank.mjs'));
test('36 questions have valid unique IDs, topics, answers and explanations',()=>{assert.equal(bank.QUESTIONS.length,36);assert.equal(new Set(bank.QUESTIONS.map(q=>q.id)).size,36);for(const topic of bank.TOPICS)assert.equal(bank.QUESTIONS.filter(q=>q.topic===topic).length,6);for(const q of bank.QUESTIONS){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert(q.answer>=0&&q.answer<4);assert(q.explanation.length>30);}});
test('balanced tests, full practice and shuffled correct answers remain consistent',()=>{let value=0;const random=()=>{value=(value+.137)%1;return value;};const selected=bank.selectQuestions('All','test',random);assert.equal(selected.length,18);for(const topic of bank.TOPICS)assert.equal(selected.filter(q=>q.topic===topic).length,3);for(const q of selected){const source=bank.QUESTIONS.find(x=>x.id===q.id);assert.equal(q.options[q.answer],source.options[source.answer]);}assert.equal(bank.selectQuestions('All','practice').length,36);assert.equal(bank.selectQuestions('Tiles','test').length,6);assert.throws(()=>bank.selectQuestions('Fake','test'));assert.throws(()=>bank.selectQuestions('All','fake'));});
test('test payloads do not disclose answers; grading requires all valid choices and uses exact 80% threshold',()=>{const questions=bank.selectQuestions('Tiles','test');for(const q of bank.publicQuestions(questions)){assert(!('answer'in q));assert(!('explanation'in q));}assert('answer'in bank.publicQuestions(questions,true)[0]);const answers=questions.map(q=>q.answer);assert.equal(bank.grade(questions,answers).percent,100);assert.throws(()=>bank.grade(questions,[]));assert.throws(()=>bank.grade(questions,answers.map(()=>-1)));assert.throws(()=>bank.grade(questions,answers.map(()=>4)));assert.throws(()=>bank.grade(questions,answers.map(()=>null)));answers[0]=(answers[0]+1)%4;assert.equal(bank.grade(questions,answers).passed,true);answers[1]=(answers[1]+1)%4;assert.equal(bank.grade(questions,answers).passed,false);});
await build({entryPoints:[root+'app/api/training/route.ts'],bundle:true,platform:'node',format:'esm',outfile:folder+'/api.mjs',plugins:[{name:'test-auth-and-d1',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onResolve({filter:/(^|\/)access$/},()=>({path:'access',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='env'?'export const env=globalThis.trainingEnv;':`export async function getHubMember(){return globalThis.trainingMember;}export function canManageAccess(m){return !!m&&['Owner / Admin','Developer / Technical Admin'].includes(m.role);}`,loader:'js'}));}}]});
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(root+'drizzle/0040_staff_hardware_training.sql','utf8'));
globalThis.trainingEnv={DB:{prepare(query){let args=[];return{bind(...values){args=values;return this;},async first(){return sql.prepare(query).get(...args)||null;},async all(){return{results:sql.prepare(query).all(...args)};},async run(){const r=sql.prepare(query).run(...args);return{meta:{changes:r.changes}};}};}}};
const api=await import(pathToFileURL(folder+'/api.mjs'));
const member={name:'Test Staff',email:'staff@example.test',role:'Sales',department:'Hardware',access_scope:'Full company',workspace_access:'[]'};
function req(method='GET',body,params='',origin='https://hub.example'){return new Request('https://hub.example/api/training'+params,{method,...(body?{headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}:{})});}
async function post(body,origin){const response=await api.POST(req('POST',body,'',origin));return{status:response.status,body:await response.json()};}
test('legacy training is restricted to Full company/HR, keeps history readable, and directs all new scored tests to recording',async()=>{
 globalThis.trainingMember=null;assert.equal((await api.GET(req())).status,401);
 globalThis.trainingMember={...member,access_scope:'Assigned workspace'};assert.equal((await api.GET(req())).status,401);
 globalThis.trainingMember={...member,role:'Human Resource (HR)',access_scope:'Assigned workspace'};assert.equal((await api.GET(req())).status,200);
 globalThis.trainingMember=member;assert.equal((await post({action:'start'},'https://evil.example')).status,403);
 const practice=await post({action:'start',brand:'busterbuild',topic:'Paint',mode:'practice'});assert.equal(practice.status,200);assert('answer'in practice.body.questions[0]);assert.equal(sql.prepare('SELECT COUNT(*) n FROM staff_training_attempts').get().n,0);
 const denied=await post({action:'start',brand:'busterbuild',topic:'All',mode:'test'});assert.equal(denied.status,409);assert.match(denied.body.error,/recorded assessment/);
 const questions=bank.selectQuestions('Tiles','test'),answers=questions.map(q=>q.answer),id=crypto.randomUUID(),pending=crypto.randomUUID();
 for(const [ref,done] of [[id,true],[pending,false]])sql.prepare('INSERT INTO staff_training_attempts (id,email,staff_name,brand,topic,bank_version,questions_json,answers_json,correct,total,passed,started_at,submitted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(ref,member.email,member.name,'powerbuild','Tiles',bank.BANK_VERSION,JSON.stringify(questions),done?JSON.stringify(answers):null,done?6:null,6,done?1:null,new Date().toISOString(),done?new Date().toISOString():null);
 const result=await(await api.GET(req('GET',null,'?id='+id))).json();assert.equal(result.result.correct,6);assert.equal((await post({action:'submit',id:pending,answers})).status,409);assert.equal((await post({action:'submit',id,answers:[]})).body.result.correct,6);
 globalThis.trainingMember={...member,email:'reviewer@example.test',role:'Sales'};assert.equal((await api.GET(req('GET',null,'?team=1'))).status,200);assert.equal((await api.GET(req('GET',null,'?id='+id))).status,200);assert.equal((await api.GET(req('GET',null,'?id='+pending))).status,404);
 globalThis.trainingMember={...member,access_scope:'Assigned workspace'};assert.equal((await api.GET(req('GET',null,'?id='+id))).status,401);
 globalThis.trainingMember=member;sql.exec('DROP TABLE staff_training_attempts');const missing=await api.GET(req());assert.equal(missing.status,503);assert.match((await missing.json()).error,/0040/);
});
