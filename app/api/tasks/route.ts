import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { createAssignmentNotification, initTeamTables } from "../team/shared";
import { allowedWorkspaces, canAccessWorkspace, canWrite, getHubMember } from "../access";
const seed = [
  [
    "Finalise staff, merchandise and yard plan",
    "Sungate PowerBuild",
    "Operations",
    "Muhammad",
    "2026-08-10",
    "High",
    "In progress",
  ],
  [
    "Approve paving, lease, layout and concept",
    "Midway PowerBuild",
    "EXCO",
    "Property Team",
    "2026-08-12",
    "High",
    "Blocked",
  ],
  [
    "Confirm ERF numbers and land usage",
    "Buster Build",
    "Property",
    "Property Team",
    "2026-08-08",
    "High",
    "In progress",
  ],
  [
    "Appoint dispatch manager",
    "Wholesale Launch",
    "HR",
    "HR Manager",
    "2026-08-15",
    "Medium",
    "Not started",
  ],
  [
    "Complete timber wholesale price matrix",
    "Wholesale Launch",
    "Muhammad",
    "Muhammad",
    "2026-08-09",
    "High",
    "In progress",
  ],
  [
    "Submit monthly store CAPEX requirements",
    "25 Store Upgrade",
    "Store Managers",
    "Store Managers",
    "2026-08-16",
    "Medium",
    "Complete",
  ],
];
async function init() {
  const db = env.DB;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,project TEXT NOT NULL,owner TEXT NOT NULL,assignee TEXT NOT NULL,assignee_email TEXT NOT NULL DEFAULT '',due TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL,created_at TEXT NOT NULL,task_type TEXT NOT NULL DEFAULT 'General',task_group TEXT NOT NULL DEFAULT 'Store Tasks')`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER NOT NULL,body TEXT NOT NULL,author TEXT NOT NULL,created_at TEXT NOT NULL)`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER NOT NULL,name TEXT NOT NULL,type TEXT NOT NULL,size INTEGER NOT NULL,object_key TEXT NOT NULL,uploaded_by TEXT NOT NULL,created_at TEXT NOT NULL)`,
    ),
  ]);
  try {
    await db
      .prepare(
        "ALTER TABLE tasks ADD COLUMN assignee_email TEXT NOT NULL DEFAULT ''",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE tasks ADD COLUMN task_type TEXT NOT NULL DEFAULT 'General'",
      )
      .run();
  } catch {}
  try {
    await db
      .prepare(
        "ALTER TABLE tasks ADD COLUMN task_group TEXT NOT NULL DEFAULT 'Store Tasks'",
      )
      .run();
  } catch {}
  const row = await db
    .prepare("SELECT COUNT(*) count FROM tasks")
    .first<{ count: number }>();
  if (!row?.count) {
    const now = new Date().toISOString();
    await db.batch(
      seed.map((s) =>
        db
          .prepare(
            "INSERT INTO tasks (title,project,owner,assignee,assignee_email,due,priority,status,description,created_by,created_at,task_type,task_group) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            s[0],
            s[1],
            s[2],
            s[3],
            "",
            s[4],
            s[5],
            s[6],
            "",
            "system",
            now,
            "General",
            "Store Tasks",
          ),
      ),
    );
  }
}
export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM tasks ORDER BY CASE status WHEN 'Blocked' THEN 0 WHEN 'In progress' THEN 1 WHEN 'Not started' THEN 2 ELSE 3 END, id DESC",
  ).all();
  const allowed = allowedWorkspaces(member);
  return Response.json({
    tasks: allowed === null
      ? results
      : results.filter((task) => canAccessWorkspace(member, String(task.project))),
  });
}
export async function POST(req: Request) {
  await init();
  await initTeamTables();
  const user = await getAuthenticatedUser();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const p = (await req.json()) as Record<string, string>;
  const allowed = allowedWorkspaces(member);
  if (allowed !== null && !canAccessWorkspace(member, p.project || ""))
    return Response.json({ error: "You do not have access to this workspace." }, { status: 403 });
  if (!p.title?.trim())
    return Response.json({ error: "Title is required" }, { status: 400 });
  const now = new Date().toISOString();
  const out = await env.DB.prepare(
    "INSERT INTO tasks (title,project,owner,assignee,assignee_email,due,priority,status,description,created_by,created_at,task_type,task_group) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *",
  )
    .bind(
      p.title.trim(),
      p.project,
      p.owner || p.assignee || "Operations",
      p.assignee || p.owner || "Unassigned",
      (p.assignee_email || "").trim().toLowerCase(),
      p.due,
      p.priority,
      p.status || "Not started",
      p.description || "",
      user?.email || "Current user",
      now,
      p.task_type || "General",
      p.task_group || "Store Tasks",
    )
    .first<Record<string, string | number>>();
  if (out && p.assignee_email)
    await createAssignmentNotification({
      recipientEmail: p.assignee_email,
      taskId: Number(out.id),
      taskTitle: String(out.title),
      workspace: String(out.project),
      assignedBy: user?.displayName || user?.email || "Hub Owner",
    });
  return Response.json({ task: out }, { status: 201 });
}
