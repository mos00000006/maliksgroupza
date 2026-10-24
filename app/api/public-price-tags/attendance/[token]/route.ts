import {env} from 'cloudflare:workers';
import {type Branch,type Account,json,validToken,secret,hash,pinHash,sameOrigin,body,text,rate,now,day,nextState,location,failure} from '../../../attendance/shared';
async function branch(req:Request){const token=new URL(req.url).pathname.split('/').filter(Boolean).at(-1)||'';return validToken(token)?env.DB.prepare('SELECT * FROM attendance_branches WHERE token=? AND active=1').bind(token).first<Branch>():null;}
const cookieName='attendance_session';
function cookie(req:Request){return req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
async function account(req:Request,b:Branch){const token=cookie(req);if(!validToken(token))return null;return env.DB.prepare('SELECT a.* FROM attendance_sessions s JOIN attendance_accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires_at>? AND a.branch_id=?').bind(await hash(token),Date.now(),b.id).first<Account>();}
const cookieHeader=(b:Branch,value:string,age=2592000)=>`${cookieName}=${value}; Path=/api/public-price-tags/attendance/${b.token}; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
export async function GET(req:Request){try{const b=await branch(req);if(!b)return json({error:'This branch QR is unavailable. Ask your manager for the current poster.'},404);const a=await account(req,b);let history:unknown[]=[];if(a)history=(await env.DB.prepare('SELECT action,occurred_at,location_status FROM attendance_events WHERE account_id=? ORDER BY occurred_at DESC LIMIT 20').bind(a.id).all()).results;return json({branch:b.workspace,account:a?{name:a.first_name,status:a.status,state:a.state,lastEvent:a.last_event}:null,history});}catch(e){return failure(e);}}
export async function POST(req:Request){try{if(!sameOrigin(req))return json({error:'Open the branch attendance page to continue.'},403);const b=await branch(req);if(!b)return json({error:'Branch QR unavailable.'},404);let data:Record<string,unknown>;try{data=await body(req);}catch{return json({error:'Invalid request.'},400);}const action=String(data.action||'');
if(action==='logout'){const session=cookie(req);if(validToken(session))await env.DB.prepare('DELETE FROM attendance_sessions WHERE token_hash=?').bind(await hash(session)).run();return json({ok:true},200,{'set-cookie':cookieHeader(b,'',0)});}
if(['register','login'].includes(action)){
 const ip=req.headers.get('cf-connecting-ip')||'local';if(!await rate('ip:'+b.id+':'+ip,30))return json({error:'Too many attempts. Please wait 15 minutes.'},429);
 let number:string,pin:string;try{number=text(data,'employeeNumber',40);pin=text(data,'pin',12);if(!/^\d{6,12}$/.test(pin))throw Error();}catch{return json({error:'Enter an employee number and a PIN of 6–12 digits.'},400);}
 if(!await rate('account:'+b.id+':'+number.toLowerCase(),10))return json({error:'Too many attempts for this employee number. Wait 15 minutes.'},429);
 let a=await env.DB.prepare('SELECT * FROM attendance_accounts WHERE branch_id=? AND employee_number=?').bind(b.id,number).first<Account>();
 if(action==='register'){
 if(data.consent!==true)return json({error:'Please acknowledge the attendance notice.'},400);
 if(a)return json({error:'This employee number is already registered. Sign in or ask your manager for help.'},409);
 let first:string,last:string,phone:string,title:string;try{first=text(data,'firstName',60);last=text(data,'lastName',60);phone=text(data,'phone',30);title=text(data,'jobTitle',100);}catch{return json({error:'Complete your name, phone number and position.'},400);}
 const salt=secret(),id=crypto.randomUUID();await env.DB.prepare('INSERT INTO attendance_accounts (id,branch_id,employee_number,first_name,last_name,phone,job_title,salt,pin_hash,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,b.id,number,first,last,phone,title,salt,await pinHash(pin,salt),now()).run();a=await env.DB.prepare('SELECT * FROM attendance_accounts WHERE id=?').bind(id).first<Account>();
 }else if(!a||await pinHash(pin,a.salt)!==a.pin_hash)return json({error:'Employee number or PIN is incorrect.'},401);
 if(!a||['rejected','disabled'].includes(a.status))return json({error:'This registration is not enabled. Contact your manager.'},403);
 const token=secret();await env.DB.batch([env.DB.prepare('DELETE FROM attendance_sessions WHERE account_id=? AND expires_at<?').bind(a.id,Date.now()),env.DB.prepare('INSERT INTO attendance_sessions (token_hash,account_id,expires_at) VALUES (?,?,?)').bind(await hash(token),a.id,Date.now()+2592000000)]);return json({ok:true},200,{'set-cookie':cookieHeader(b,token)});
}
const a=await account(req,b);if(!a||a.status!=='approved'||!a.employee_id)return json({error:'Sign in with an approved staff registration.'},403);
const employee=await env.DB.prepare("SELECT id FROM employee_records WHERE id=? AND workspace=? AND active=1 AND employment_status IN ('Active','On leave')").bind(a.employee_id,b.workspace).first();if(!employee)return json({error:'Your employment record needs manager review before clocking.'},403);
const key=String(data.requestKey||'');if(!/^[a-f0-9-]{36}$/i.test(key))return json({error:'Refresh the page and retry.'},400);
const duplicate=await env.DB.prepare('SELECT id FROM attendance_events WHERE account_id=? AND request_key=?').bind(a.id,key).first();if(duplicate)return json({ok:true});
if(!nextState(a.state,action))return json({error:'This clock action is no longer available. Refresh your status.'},409);

const geo=location(b,data),id=crypto.randomUUID(),time=now(),date=day(new Date(time)),state=nextState(a.state,action)!;
const reason=`QR attendance: ${action} at ${new Date(time).toLocaleTimeString('en-ZA',{timeZone:'Africa/Johannesburg',hour12:false})}${geo.status==='inside'?'':' — location review required ('+geo.status+')'}`;
await env.DB.batch([
 env.DB.prepare("INSERT INTO attendance_events (id,account_id,employee_id,workspace,action,occurred_at,attendance_date,location_status,distance_m,accuracy_m,request_key) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM attendance_accounts WHERE id=? AND version=? AND status='approved' AND EXISTS (SELECT 1 FROM employee_records e WHERE e.id=attendance_accounts.employee_id AND e.active=1 AND e.workspace=? AND e.employment_status IN ('Active','On leave')))").bind(id,a.id,a.employee_id,b.workspace,action,time,date,geo.status,geo.distance,geo.accuracy,key,a.id,a.version,b.workspace),
 env.DB.prepare('UPDATE attendance_accounts SET state=?,last_event=?,version=version+1 WHERE id=? AND version=? AND EXISTS (SELECT 1 FROM attendance_events WHERE id=?)').bind(state,time,a.id,a.version,id),
 env.DB.prepare("INSERT INTO employee_attendance (employee_id,workspace,attendance_date,status,reason,recorded_by,created_at,updated_at) SELECT ?,?,?,'At work',?,'QR attendance',?,? WHERE EXISTS (SELECT 1 FROM attendance_events WHERE id=?) ON CONFLICT(employee_id,attendance_date) DO UPDATE SET reason=excluded.reason,updated_at=excluded.updated_at WHERE employee_attendance.recorded_by='QR attendance'").bind(a.employee_id,b.workspace,date,reason,time,time,id)
]);
if(!await env.DB.prepare('SELECT id FROM attendance_events WHERE id=?').bind(id).first())return json({error:'Your status changed on another device. Refresh before trying again.'},409);
return json({ok:true,message:geo.status==='inside'?'Attendance saved.':'Attendance saved and flagged for manager location review.'});
}catch(e){return failure(e);}}
