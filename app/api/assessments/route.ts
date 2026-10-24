import {env} from 'cloudflare:workers';
import {assessmentMember} from '../assessment-access';
import {BANK_VERSION,selectQuestions} from '../../lib/hardware-training';
import {deleteAssessment} from '../../lib/assessment-retention';
import {assessment,headers,ID,json,limitedJson,sameOrigin,secret,hash,resultFor,safeFailure} from './shared';
export async function GET(req:Request){try{
 const member=await assessmentMember();if(!member)return json({error:'Only staff assigned Full company access or the Human Resource (HR) role can open assessments.'},403);
 const params=new URL(req.url).searchParams,id=params.get('id');
 if(id){if(!ID.test(id))return json({error:'Invalid assessment reference.'},400);const row=await assessment(id);if(!row)return json({error:'Assessment not found or its retention period has ended.'},404);
 const seq=params.get('chunk');if(seq!==null){if(!/^\d{1,3}$/.test(seq))return json({error:'Invalid recording part.'},400);const chunk=await env.DB.prepare('SELECT object_key FROM candidate_assessment_chunks WHERE assessment_id=? AND seq=?').bind(id,Number(seq)).first<{object_key:string}>();if(!chunk)return json({error:'Recording part unavailable.'},404);const object=await env.BUCKET.get(chunk.object_key);return object?new Response(object.body,{headers:{...headers,'content-type':'video/webm','content-disposition':'inline'}}):json({error:'Recording part unavailable.'},404);}
 return json({assessment:{id:row.id,name:row.candidate_name,email:row.email,phone:row.phone,position:row.position_applied,reference:row.reference,kind:row.kind,brand:row.brand,topic:row.topic,status:row.status,startedAt:row.started_at,submittedAt:row.submitted_at,consentedAt:row.consented_at,retentionUntil:row.retention_until,chunkCount:row.chunk_count,totalBytes:row.total_bytes,lastChunkAt:row.last_chunk_at,events:JSON.parse(row.events_json),result:resultFor(row)}});
 }
 const rows=await env.DB.prepare('SELECT id,candidate_name,email,phone,position_applied,reference,kind,brand,topic,status,correct,total,passed,chunk_count,last_chunk_at,started_at,submitted_at,retention_until,created_at FROM candidate_assessments WHERE retention_until>? ORDER BY created_at DESC LIMIT 100').bind(new Date().toISOString()).all();return json({name:member.name,checkedAt:new Date().toISOString(),assessments:rows.results});
 }catch(error){return safeFailure(error);}}
export async function POST(req:Request){try{
 const member=await assessmentMember();if(!member)return json({error:'Full company or HR access is required.'},403);if(['Viewer','Read only'].includes(member.role)||member.access_scope==='Read only')return json({error:'This account has read-only access.'},403);if(!sameOrigin(req))return json({error:'Use the assessment area in the Hub.'},403);
 let body:Record<string,unknown>;try{body=await limitedJson(req);}catch{return json({error:'Invalid assessment request.'},400);}
 if(body.action==='delete'){if(typeof body.id!=='string'||!ID.test(body.id))return json({error:'Invalid assessment.'},400);const row=await assessment(body.id);if(!row)return json({error:'Assessment not found.'},404);if(row.status==='running')return json({error:'End the active assessment before deleting it.'},409);await deleteAssessment(env,body.id);return json({deleted:true});}
 if(body.action==='end'){if(typeof body.id!=='string'||!ID.test(body.id))return json({error:'Invalid assessment.'},400);await env.DB.prepare("UPDATE candidate_assessments SET status='interrupted',submitted_at=? WHERE id=? AND status IN ('ready','running')").bind(new Date().toISOString(),body.id).run();return json({ended:true});}
 if(body.action!=='create')return json({error:'Invalid action.'},400);
 const text=(key:string,max:number,required=false)=>{const value=typeof body[key]==='string'?body[key].trim():'';if(value.length>max||(required&&!value))throw new Error(`Check ${key}.`);return value;};
 let name:string,email:string,phone:string,position:string,reference:string,questions:ReturnType<typeof selectQuestions>;
 try{name=text('name',100,true);email=text('email',150);phone=text('phone',40);position=text('position',100,true);reference=text('reference',80);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Check the email address.');questions=selectQuestions(String(body.topic),'test');}catch(error){return json({error:(error as Error).message},400);}
 if(!['powerbuild','busterbuild'].includes(String(body.brand))||!['candidate','staff'].includes(String(body.kind))||![7,14,30].includes(Number(body.retentionDays)))return json({error:'Choose brand, assessment type and retention period.'},400);
 const now=new Date(),id=crypto.randomUUID(),token=secret();await env.DB.prepare('INSERT INTO candidate_assessments (id,candidate_name,email,phone,position_applied,reference,kind,brand,topic,bank_version,questions_json,token_hash,link_expires_at,retention_until,created_at,created_by,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,name,email,phone,position,reference,String(body.kind),String(body.brand),String(body.topic),BANK_VERSION,JSON.stringify(questions),await hash(token),new Date(now.getTime()+86400000).toISOString(),new Date(now.getTime()+Number(body.retentionDays)*86400000).toISOString(),now.toISOString(),member.email,questions.length).run();
 return json({id,candidateUrl:new URL('/p/assessment/'+token,req.url).href});
 }catch(error){return safeFailure(error);}}
