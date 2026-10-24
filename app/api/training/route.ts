import {env} from 'cloudflare:workers';
import {getHubMember,canManageAccess} from '../access';
import {BANK_VERSION,TOPICS,selectQuestions,publicQuestions,grade,type Question} from '../../lib/hardware-training';
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers});
type Row={id:string;email:string;staff_name:string;brand:string;topic:string;questions_json:string;answers_json:string|null;correct:number|null;total:number;passed:number|null;started_at:string;submitted_at:string|null};
function view(row:Row){const questions=JSON.parse(row.questions_json) as Question[];return{id:row.id,staffName:row.staff_name,brand:row.brand,topic:row.topic,startedAt:row.started_at,submittedAt:row.submitted_at,questions:publicQuestions(questions),...(row.submitted_at?{result:grade(questions,JSON.parse(row.answers_json!))}:{})};}
export async function GET(req:Request){
 try{
 const member=await getHubMember();if(!member)return reply({error:'Sign in to the Hub with your staff account.'},401);
 const params=new URL(req.url).searchParams,id=params.get('id');
 if(id){if(!/^[a-f0-9-]{36}$/i.test(id))return reply({error:'Invalid test reference.'},400);const row=await env.DB.prepare('SELECT * FROM staff_training_attempts WHERE id=? AND (email=? OR (?=1 AND submitted_at IS NOT NULL))').bind(id,member.email.toLowerCase(),canManageAccess(member)?1:0).first<Row>();return row?reply(view(row)):reply({error:'Test not found for your account.'},404);}
 const team=params.get('team')==='1';if(team&&!canManageAccess(member))return reply({error:'Administrator access is required to view team results.'},403);
 const sql=team?'SELECT id,staff_name,email,brand,topic,correct,total,passed,started_at,submitted_at FROM staff_training_attempts WHERE submitted_at IS NOT NULL ORDER BY submitted_at DESC LIMIT 200':'SELECT id,staff_name,email,brand,topic,correct,total,passed,started_at,submitted_at FROM staff_training_attempts WHERE email=? ORDER BY started_at DESC LIMIT 50';
 const query=env.DB.prepare(sql);const results=await(team?query:query.bind(member.email.toLowerCase())).all();return reply({topics:TOPICS,canReview:canManageAccess(member),name:member.name,attempts:results.results});
 }catch(error){return failure(error);}
}
export async function POST(req:Request){
 try{
 const member=await getHubMember();if(!member)return reply({error:'Sign in to the Hub with your staff account.'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Open training from the Hub to save a test.'},403);
 if(Number(req.headers.get('content-length'))>16000)return reply({error:'Request too large.'},413);
 let body:Record<string,unknown>;try{body=await req.json();if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}catch{return reply({error:'Invalid training request.'},400);}
 const email=member.email.toLowerCase();
 if(body.action==='start'){
 if(body.brand!=='powerbuild'&&body.brand!=='busterbuild')return reply({error:'Choose PowerBuild or BusterBuild.'},400);
 let questions:Question[];try{questions=selectQuestions(String(body.topic),String(body.mode));}catch(error){return reply({error:(error as Error).message},400);}
 if(body.mode==='practice')return reply({practice:true,questions:publicQuestions(questions,true)});
 const day=new Date(Date.now()+2*60*60*1000).toISOString().slice(0,10);const today=new Date(day+'T00:00:00+02:00').toISOString();const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM staff_training_attempts WHERE email=? AND started_at>=?').bind(email,today).first<{n:number}>();if(Number(count?.n)>=10)return reply({error:'You have started 10 tests today. Resume an existing test or practise, then start another tomorrow.'},429);
 const id=crypto.randomUUID(),startedAt=new Date().toISOString();await env.DB.prepare('INSERT INTO staff_training_attempts (id,email,staff_name,brand,topic,bank_version,questions_json,total,started_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,email,member.name,body.brand,String(body.topic),BANK_VERSION,JSON.stringify(questions),questions.length,startedAt).run();return reply({id,brand:body.brand,topic:body.topic,startedAt,questions:publicQuestions(questions)});
 }
 if(body.action==='submit'){
 if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id))return reply({error:'Invalid test reference.'},400);
 const row=await env.DB.prepare('SELECT * FROM staff_training_attempts WHERE id=? AND email=?').bind(body.id,email).first<Row>();if(!row)return reply({error:'Test not found for your account.'},404);
 if(row.submitted_at)return reply(view(row));
 let result:ReturnType<typeof grade>;try{result=grade(JSON.parse(row.questions_json),body.answers);}catch(error){return reply({error:(error as Error).message},400);}
 await env.DB.prepare('UPDATE staff_training_attempts SET answers_json=?,correct=?,passed=?,submitted_at=? WHERE id=? AND email=? AND submitted_at IS NULL').bind(JSON.stringify(body.answers),result.correct,result.passed?1:0,new Date().toISOString(),body.id,email).run();const saved=await env.DB.prepare('SELECT * FROM staff_training_attempts WHERE id=? AND email=?').bind(body.id,email).first<Row>();return reply(view(saved!));
 }
 return reply({error:'Choose a valid training action.'},400);
 }catch(error){return failure(error);}
}
function failure(error:unknown){console.error('Staff training request failed',error);const message=error instanceof Error?error.message:'';if(/no such table.*staff_training_attempts/i.test(message))return reply({error:'Training setup is incomplete. Ask your administrator to apply database migration 0040.'},503);return reply({error:'Training could not connect to its saved records. Please retry. Your test is only recorded when a saved result appears.'},503);}
