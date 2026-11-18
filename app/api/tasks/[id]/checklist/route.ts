import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";
import { addTaskActivity, ensureTaskControlTables } from "../../task-controls";

type TaskRow={id:number;project:string;status:string;approval_status:string};
const bad=(error:string,status=400)=>Response.json({error},{status});
async function authorize(id:string,write:boolean){
  const member=await getHubMember();
  const task=await env.DB.prepare('SELECT id,project,status,approval_status FROM tasks WHERE id=?')
    .bind(id).first<TaskRow>();
  return {task,allowed:!!task&&!!member&&canAccessWorkspace(member,task.project)&&(!write||canWrite(member))};
}
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const auth=await authorize(id,false);
  if(!auth.allowed)return bad('Task not found or access denied.',404);
  await ensureTaskControlTables();
  const [items,events]=await Promise.all([
    env.DB.prepare('SELECT id,body,position,done,done_by,done_at,created_by,created_at FROM task_checklist_items WHERE task_id=? ORDER BY position,id').bind(id).all(),
    env.DB.prepare('SELECT id,action,details,actor_name,created_at FROM task_activity WHERE task_id=? ORDER BY id DESC LIMIT 100').bind(id).all(),
  ]);
  return Response.json({checklist:items.results,activity:events.results},{headers:{'cache-control':'no-store'}});
}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const auth=await authorize(id,true);
  if(!auth.allowed||!auth.task)return bad('You cannot edit this task checklist.',403);
  if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)
    return bad('Invalid request origin.',403);
  if(auth.task.status==='Complete'||auth.task.approval_status==='Approved')
    return bad('Reopen or return this task before changing its checklist.',409);
  const user=await getAuthenticatedUser();
  const actor=user?.displayName||user?.email||'Hub User',email=user?.email||'';
  let body:Record<string,unknown>;
  try{body=await req.json() as Record<string,unknown>;}catch{return bad('Invalid JSON.');}
  await ensureTaskControlTables();
  const taskId=Number(id),action=body.action;
  if(action==='add'){
    if(typeof body.text!=='string'||!body.text.trim()||body.text.trim().length>240)
      return bad('Checklist item must contain 1–240 characters.');
    const count=await env.DB.prepare('SELECT COUNT(*) total FROM task_checklist_items WHERE task_id=?').bind(taskId).first<{total:number}>();
    if(Number(count?.total||0)>=40)return bad('Maximum 40 checklist items per task.');
    const position=Number(count?.total||0)+1,now=new Date().toISOString();
    await env.DB.prepare(`INSERT INTO task_checklist_items
      (task_id,body,position,created_by,created_at) VALUES (?,?,?,?,?)`)
      .bind(taskId,body.text.trim(),position,actor,now).run();
    await addTaskActivity(taskId,'CHECKLIST_ADDED',body.text.trim(),actor,email);
  }else if(action==='toggle'){
    const itemId=Number(body.item_id);
    if(!Number.isSafeInteger(itemId)||itemId<1||typeof body.done!=='boolean')return bad('Invalid checklist selection.');
    const row=await env.DB.prepare('SELECT id,body,done FROM task_checklist_items WHERE id=? AND task_id=?')
      .bind(itemId,taskId).first<{id:number;body:string;done:number}>();
    if(!row)return bad('Checklist item not found.',404);
    if(!!row.done!==body.done){
      await env.DB.prepare(`UPDATE task_checklist_items SET done=?,done_by=?,done_at=?
        WHERE id=? AND task_id=?`).bind(body.done?1:0,body.done?actor:'',body.done?new Date().toISOString():'',itemId,taskId).run();
      await addTaskActivity(taskId,body.done?'CHECKLIST_COMPLETED':'CHECKLIST_REOPENED',row.body,actor,email);
    }
  }else if(action==='remove'){
    const itemId=Number(body.item_id);
    if(!Number.isSafeInteger(itemId)||itemId<1)return bad('Invalid checklist selection.');
    const row=await env.DB.prepare('SELECT body FROM task_checklist_items WHERE id=? AND task_id=?')
      .bind(itemId,taskId).first<{body:string}>();
    if(!row)return bad('Checklist item not found.',404);
    await env.DB.prepare('DELETE FROM task_checklist_items WHERE id=? AND task_id=?').bind(itemId,taskId).run();
    await addTaskActivity(taskId,'CHECKLIST_REMOVED',row.body,actor,email);
  }else return bad('Unsupported checklist action.');
  return GET(req,{params:Promise.resolve({id})});
}
