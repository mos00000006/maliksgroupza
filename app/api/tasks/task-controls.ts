import { env } from "cloudflare:workers";

// Additive setup is safe for older Hub databases and idempotent with the D1 migration.
export async function ensureTaskControlTables() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS task_checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL,
      body TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0,
      done INTEGER NOT NULL DEFAULT 0, done_by TEXT NOT NULL DEFAULT '', done_at TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS task_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL,
      action TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', actor_name TEXT NOT NULL,
      actor_email TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)`),
  ]);
}

export async function addTaskActivity(
  taskId: number, action: string, details: string, actorName: string, actorEmail: string,
) {
  await ensureTaskControlTables();
  await env.DB.prepare(`INSERT INTO task_activity
    (task_id,action,details,actor_name,actor_email,created_at)
    VALUES (?,?,?,?,?,?)`)
    .bind(taskId, action, details.slice(0,500), actorName, actorEmail.toLowerCase(), new Date().toISOString())
    .run();
}

// Legacy tasks without checklists retain their existing completion workflow.
// Checklist-managed tasks require both full completion and at least one existing attachment.
export async function taskReadyForApproval(taskId: number) {
  await ensureTaskControlTables();
  const counts = await env.DB.prepare(`SELECT COUNT(*) total,
    SUM(CASE WHEN done=0 THEN 1 ELSE 0 END) pending
    FROM task_checklist_items WHERE task_id=?`).bind(taskId).first<{total:number;pending:number}>();
  const total=Number(counts?.total||0), pending=Number(counts?.pending||0);
  if(total===0)return {ok:true,error:''};
  if(pending>0)return {ok:false,error:`Complete all ${pending} remaining checklist item(s) before submitting this task.`};
  const proof=await env.DB.prepare('SELECT COUNT(*) total FROM attachments WHERE task_id=?')
    .bind(taskId).first<{total:number}>();
  if(!Number(proof?.total||0))return {ok:false,error:'Attach a photo, document or other completion evidence before submitting this checklist-managed task.'};
  return {ok:true,error:''};
}
