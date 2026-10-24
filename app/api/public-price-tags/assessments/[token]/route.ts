import {env} from 'cloudflare:workers';
import {ASSESSMENT_TOKEN} from '../../../../lib/assessment-public';
import {publicQuestions,type Question} from '../../../../lib/hardware-training';
import {hash,secret,json,limitedJson,sameOrigin,safeFailure,resultFor,type Assessment} from '../../../assessments/shared';
async function load(token:string){if(!ASSESSMENT_TOKEN.test(token))return null;return env.DB.prepare('SELECT * FROM candidate_assessments WHERE token_hash=? AND retention_until>? AND link_expires_at>?').bind(await hash(token),new Date().toISOString(),new Date().toISOString()).first<Assessment>();}
export async function GET(_req:Request,{params}:{params:Promise<{token:string}>}){try{const row=await load((await params).token);return row?json({name:row.candidate_name,position:row.position_applied,brand:row.brand,topic:row.topic,total:row.total,status:row.status,retentionUntil:row.retention_until,maxMinutes:15}):json({error:'This candidate link is unavailable or has expired. Ask HR for a new assessment.'},404);}catch(error){return safeFailure(error);}}
async function bytes(req:Request,max:number){const reader=req.body?.getReader();if(!reader)throw new Error('Recording part is empty.');const parts:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new Error('Recording part is too large.');}parts.push(part.value);}const output=new Uint8Array(size);let offset=0;for(const part of parts){output.set(part,offset);offset+=part.byteLength;}return output;}
export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){try{
 if(!sameOrigin(req))return json({error:'Open this assessment on its own candidate page.'},403);
 const row=await load((await params).token);if(!row)return json({error:'Candidate link unavailable or expired.'},404);
 const action=new URL(req.url).searchParams.get('action');
 if(action==='start'){
 let body:Record<string,unknown>;try{body=await limitedJson(req);}catch{return json({error:'Check your confirmation.'},400);}
 if(body.consent!==true||typeof body.name!=='string'||body.name.trim().replace(/\s+/g,' ').toLowerCase()!==row.candidate_name.replace(/\s+/g,' ').toLowerCase())return json({error:'Confirm your full name and agree to the recording notice before starting.'},400);
 if(row.status!=='ready')return json({error:'This assessment has already started or ended. Ask HR to create another attempt.'},409);
 const session=secret(),now=new Date().toISOString();const updated=await env.DB.prepare("UPDATE candidate_assessments SET status='running',session_hash=?,consented_at=?,started_at=? WHERE id=? AND status='ready'").bind(await hash(session),now,now,row.id).run();if(!updated.meta.changes)return json({error:'This assessment has already started.'},409);
 return json({session,questions:publicQuestions(JSON.parse(row.questions_json) as Question[]),startedAt:now});
 }
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!ASSESSMENT_TOKEN.test(bearer)||!row.session_hash||await hash(bearer)!==row.session_hash)return json({error:'This browser has no active assessment session.'},403);
 if(row.status!=='running')return action==='finish'?json({saved:true,status:row.status}):json({error:'The assessment has ended.'},409);
 if(action==='chunk'){
 const seq=Number(new URL(req.url).searchParams.get('seq'));if(!Number.isInteger(seq)||seq<0||seq>=100||!req.headers.get('content-type')?.startsWith('video/webm'))return json({error:'Invalid recording part.'},400);
 if(Date.now()-Date.parse(row.started_at!)>16*60*1000)return json({error:'Recording time limit reached. End the assessment.'},409);
 let data:Uint8Array;try{data=await bytes(req,2*1024*1024);}catch(error){return json({error:(error as Error).message},413);}if(!data.byteLength)return json({error:'Empty recording part.'},400);
 if(seq===0&&!(data[0]===0x1a&&data[1]===0x45&&data[2]===0xdf&&data[3]===0xa3))return json({error:'Use a compatible browser that records WebM video.'},400);
 const digest=await hash(data.buffer as ArrayBuffer);const old=await env.DB.prepare('SELECT digest,object_key FROM candidate_assessment_chunks WHERE assessment_id=? AND seq=?').bind(row.id,seq).first<{digest:string;object_key:string}>();if(old){if(old.digest!==digest)return json({error:'Recording part does not match the saved part.'},409);if(!await env.BUCKET.head(old.object_key))await env.BUCKET.put(old.object_key,data,{httpMetadata:{contentType:'video/webm'}});return json({uploaded:true,seq});}
 if(seq!==row.chunk_count||row.total_bytes+data.byteLength>64*1024*1024)return json({error:'Recording sequence or storage limit reached.'},409);
 const key=`assessment-recordings/${row.id}/${seq}-${digest}.webm`,now=new Date().toISOString();await env.BUCKET.put(key,data,{httpMetadata:{contentType:'video/webm'}});
 try{const result=await env.DB.batch([env.DB.prepare("INSERT INTO candidate_assessment_chunks (assessment_id,seq,object_key,bytes,digest,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM candidate_assessments WHERE id=? AND status='running' AND chunk_count=?)").bind(row.id,seq,key,data.byteLength,digest,now,row.id,seq),env.DB.prepare("UPDATE candidate_assessments SET chunk_count=chunk_count+1,total_bytes=total_bytes+?,last_chunk_at=? WHERE id=? AND status='running' AND chunk_count=? AND EXISTS(SELECT 1 FROM candidate_assessment_chunks WHERE assessment_id=? AND seq=? AND object_key=?)").bind(data.byteLength,now,row.id,seq,row.id,seq,key)]);if(!result[0].meta.changes||!result[1].meta.changes){await env.BUCKET.delete(key);return json({error:'Assessment ended or the recording changed.'},409);}}catch(error){try{const committed=await env.DB.prepare('SELECT object_key FROM candidate_assessment_chunks WHERE assessment_id=? AND seq=?').bind(row.id,seq).first<{object_key:string}>();if(committed?.object_key!==key)await env.BUCKET.delete(key);}catch{try{await env.BUCKET.delete(key);}catch(cleanupError){console.error('Assessment recording cleanup must retry',cleanupError);}}throw error;}
 return json({uploaded:true,seq});
 }
 let body:Record<string,unknown>;try{body=await limitedJson(req);}catch{return json({error:'Invalid assessment action.'},400);}
 if(action==='event'){
 const allowed=['tab-hidden','fullscreen-left','camera-ended','recorder-error','camera-muted','camera-unmuted'];if(!allowed.includes(String(body.event)))return json({error:'Invalid event.'},400);const events=JSON.parse(row.events_json) as unknown[];if(events.length<100){events.push({event:body.event,at:new Date().toISOString()});await env.DB.prepare("UPDATE candidate_assessments SET events_json=? WHERE id=? AND status='running'").bind(JSON.stringify(events),row.id).run();}return json({recorded:true});
 }
 if(action==='finish'){
 const answers=body.answers,questions=JSON.parse(row.questions_json) as Question[];if(!Array.isArray(answers)||answers.length!==questions.length||answers.some((a,i)=>!Number.isInteger(a)||a< -1||a>=questions[i].options.length))return json({error:'Invalid test answers.'},400);
 if(row.chunk_count<1)return json({error:'No camera footage was saved. Ask HR to end this attempt; it cannot be marked complete.'},409);
 const interrupted=body.interrupted===true||Date.now()-Date.parse(row.started_at!)>15*60*1000+5000||!row.last_chunk_at||Date.now()-Date.parse(row.last_chunk_at)>45000;
 const result=resultFor({...row,answers_json:JSON.stringify(answers)})!;const events=JSON.parse(row.events_json) as unknown[];if(interrupted&&events.length<100)events.push({event:'assessment-interrupted',at:new Date().toISOString()});
 await env.DB.prepare("UPDATE candidate_assessments SET status=?,submitted_at=?,answers_json=?,correct=?,passed=?,events_json=? WHERE id=? AND status='running'").bind(interrupted?'interrupted':'submitted',new Date().toISOString(),JSON.stringify(answers),result.correct,result.passed?1:0,JSON.stringify(events),row.id).run();return json({saved:true,status:interrupted?'interrupted':'submitted'});
 }
 return json({error:'Invalid action.'},400);
 }catch(error){return safeFailure(error);}}
