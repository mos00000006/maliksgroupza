import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import {
  allowedWorkspaces,
  canAccessWorkspace,
  getHubMember,
  hasFullCompanyAccess,
  isHumanResources,
} from "../access";
import { initTeamTables } from "../team/shared";

const attendanceStatuses = ["At work", "Not at work", "Late"];

async function initEmployeeRecords() {
  await initTeamTables();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS employee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace TEXT NOT NULL,
      employee_number TEXT NOT NULL DEFAULT '',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL DEFAULT '',
      employment_status TEXT NOT NULL DEFAULT 'Active',
      attendance_status TEXT NOT NULL DEFAULT 'At work',
      attendance_note TEXT NOT NULL DEFAULT '',
      updated_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS employee_records_workspace_idx ON employee_records (workspace,last_name,first_name)",
  ).run();
}

async function context() {
  const user = await getAuthenticatedUser();
  const member = await getHubMember();
  return { user, member };
}

function canView(member: Awaited<ReturnType<typeof getHubMember>>) {
  return isHumanResources(member) || hasFullCompanyAccess(member);
}

function canEdit(member: Awaited<ReturnType<typeof getHubMember>>) {
  return isHumanResources(member) || member?.role === "Owner / Admin";
}

async function notifyFullCompany(
  actorEmail: string,
  employeeName: string,
  workspace: string,
  status: string,
) {
  const { results } = await env.DB.prepare(
    `SELECT email FROM team_members
     WHERE active=1 AND access_scope='Full company' AND lower(email)<>?`,
  ).bind(actorEmail.toLowerCase()).all<{ email: string }>();
  if (!results.length) return;
  const now = new Date().toISOString();
  await env.DB.batch(results.map(({ email }) => env.DB.prepare(
    "INSERT INTO notifications (recipient_email,task_id,title,message,notification_type,read_at,created_at) VALUES (?,0,?,?,?,'',?)",
  ).bind(
    email.toLowerCase(),
    `Attendance: ${employeeName} — ${status}`,
    `${employeeName} at ${workspace} is marked ${status}.`,
    "Attendance",
    now,
  )));
}

export async function GET() {
  await initEmployeeRecords();
  const { member } = await context();
  if (!canView(member))
    return Response.json({ error: "Employee records access is not available." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM employee_records ORDER BY workspace,last_name,first_name",
  ).all();
  const allowed = allowedWorkspaces(member);
  return Response.json({
    records: allowed === null
      ? results
      : results.filter((record) => canAccessWorkspace(member, String(record.workspace))),
    can_edit: canEdit(member),
  });
}

export async function POST(req: Request) {
  await initEmployeeRecords();
  const { user, member } = await context();
  if (!user?.email || !canEdit(member))
    return Response.json({ error: "Only HR for the assigned store may edit employee records." }, { status: 403 });
  const p = (await req.json()) as Record<string, unknown>;
  const workspace = String(p.workspace || "").trim();
  const firstName = String(p.first_name || "").trim();
  const lastName = String(p.last_name || "").trim();
  if (!workspace || !firstName || !lastName)
    return Response.json({ error: "Store, first name and surname are required." }, { status: 400 });
  if (!canAccessWorkspace(member, workspace))
    return Response.json({ error: "HR may only add employees to the assigned store." }, { status: 403 });
  const attendance = attendanceStatuses.includes(String(p.attendance_status)) ? String(p.attendance_status) : "At work";
  const now = new Date().toISOString();
  const record = await env.DB.prepare(
    `INSERT INTO employee_records
     (workspace,employee_number,first_name,last_name,position,department,phone,email,start_date,employment_status,attendance_status,attendance_note,updated_by,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
  ).bind(
    workspace, String(p.employee_number || ""), firstName, lastName,
    String(p.position || ""), String(p.department || ""), String(p.phone || ""),
    String(p.email || ""), String(p.start_date || ""), String(p.employment_status || "Active"),
    attendance, String(p.attendance_note || ""), user.email.toLowerCase(), now, now,
  ).first();
  await notifyFullCompany(user.email, `${firstName} ${lastName}`, workspace, attendance);
  return Response.json({ record }, { status: 201 });
}

export async function PATCH(req: Request) {
  await initEmployeeRecords();
  const { user, member } = await context();
  if (!user?.email || !canEdit(member))
    return Response.json({ error: "Only HR for the assigned store may edit employee records." }, { status: 403 });
  const p = (await req.json()) as Record<string, unknown>;
  const id = Number(p.id);
  const existing = await env.DB.prepare("SELECT * FROM employee_records WHERE id=?").bind(id).first<Record<string, unknown>>();
  if (!existing) return Response.json({ error: "Employee record not found." }, { status: 404 });
  if (!canAccessWorkspace(member, String(existing.workspace)))
    return Response.json({ error: "HR may only edit employees in the assigned store." }, { status: 403 });
  const workspace = String(p.workspace || existing.workspace).trim();
  if (!canAccessWorkspace(member, workspace))
    return Response.json({ error: "The employee cannot be moved outside the assigned store." }, { status: 403 });
  const attendance = attendanceStatuses.includes(String(p.attendance_status))
    ? String(p.attendance_status)
    : String(existing.attendance_status);
  const firstName = String(p.first_name || existing.first_name).trim();
  const lastName = String(p.last_name || existing.last_name).trim();
  const now = new Date().toISOString();
  const record = await env.DB.prepare(
    `UPDATE employee_records SET workspace=?,employee_number=?,first_name=?,last_name=?,position=?,department=?,phone=?,email=?,start_date=?,employment_status=?,attendance_status=?,attendance_note=?,updated_by=?,updated_at=? WHERE id=? RETURNING *`,
  ).bind(
    workspace, String(p.employee_number ?? existing.employee_number), firstName, lastName,
    String(p.position ?? existing.position), String(p.department ?? existing.department),
    String(p.phone ?? existing.phone), String(p.email ?? existing.email),
    String(p.start_date ?? existing.start_date), String(p.employment_status ?? existing.employment_status),
    attendance, String(p.attendance_note ?? existing.attendance_note), user.email.toLowerCase(), now, id,
  ).first();
  if (attendance !== String(existing.attendance_status))
    await notifyFullCompany(user.email, `${firstName} ${lastName}`, workspace, attendance);
  return Response.json({ record });
}
