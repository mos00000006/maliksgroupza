import { env } from "cloudflare:workers";
import type { HubMember } from "../access";
import { allowedWorkspaces, canAccessWorkspace, canWrite } from "../access";

export async function initEmployeeTables() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_number TEXT NOT NULL,
      workspace TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      id_number TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      job_title TEXT NOT NULL DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL DEFAULT '',
      employment_type TEXT NOT NULL DEFAULT 'Permanent',
      supervisor TEXT NOT NULL DEFAULT '',
      employment_status TEXT NOT NULL DEFAULT 'Active',
      emergency_contact_name TEXT NOT NULL DEFAULT '',
      emergency_contact_phone TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace, employee_number)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_records_workspace ON employee_records(workspace,active,last_name,first_name)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      workspace TEXT NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      absence_type TEXT NOT NULL DEFAULT '',
      minutes_late INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(employee_id, attendance_date)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_attendance_workspace_date ON employee_attendance(workspace,attendance_date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_date ON employee_attendance(employee_id,attendance_date)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      workspace TEXT NOT NULL,
      warning_date TEXT NOT NULL,
      warning_level TEXT NOT NULL DEFAULT 'Written',
      reason TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      issued_by TEXT NOT NULL,
      valid_until TEXT NOT NULL DEFAULT '',
      acknowledgement TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_warnings_employee ON employee_warnings(employee_id,warning_date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_warnings_workspace ON employee_warnings(workspace,status)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_hr_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      workspace TEXT NOT NULL,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      record_date TEXT NOT NULL,
      end_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '',
      reference TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_hr_records_employee ON employee_hr_records(employee_id,record_date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_employee_hr_records_workspace ON employee_hr_records(workspace,record_type,status)`),
  ]);

  const info = await db.prepare("PRAGMA table_info(employee_records)").all<{ name: string }>();
  const columns = new Set(info.results.map((row) => String(row.name)));
  const additions: Array<[string, string]> = [
    ["residential_address", "TEXT NOT NULL DEFAULT ''"],
    ["probation_end_date", "TEXT NOT NULL DEFAULT ''"],
    ["contract_end_date", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, definition] of additions) {
    if (!columns.has(name)) {
      await db.prepare(`ALTER TABLE employee_records ADD COLUMN ${name} ${definition}`).run();
    }
  }
}

export function hasEmployeeRecordsAccess(member: HubMember | null | undefined) {
  if (!member) return false;
  const role = member.role || "";
  const department = member.department || "";
  return (
    ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO", "Regional Manager", "Store Manager", "Department Manager", "Human Resource (HR)"].includes(role) ||
    /(^|\b)(hr|human resources|people)(\b|$)/i.test(department)
  );
}

export function canManageEmployeeFiles(member: HubMember | null | undefined) {
  if (!member || !canWrite(member)) return false;
  const role = member.role || "";
  const department = member.department || "";
  return (
    ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO", "Regional Manager", "Store Manager", "Human Resource (HR)"].includes(role) ||
    /(^|\b)(hr|human resources|people)(\b|$)/i.test(department)
  );
}

export function canRecordEmployeeAttendance(member: HubMember | null | undefined) {
  if (!member || !canWrite(member)) return false;
  const role = member.role || "";
  const department = member.department || "";
  return (
    ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO", "Regional Manager", "Store Manager", "Department Manager", "Human Resource (HR)"].includes(role) ||
    /(^|\b)(hr|human resources|people)(\b|$)/i.test(department)
  );
}

export function canIssueEmployeeWarnings(member: HubMember | null | undefined) {
  return canManageEmployeeFiles(member);
}

export function canManageEmployeeHrRecords(member: HubMember | null | undefined) {
  return canManageEmployeeFiles(member);
}

export async function accessibleEmployeeWorkspaces(member: HubMember) {
  const { results } = await env.DB.prepare(
    `SELECT id,name,type,region,manager
     FROM workspaces
     WHERE active=1
     ORDER BY CASE
       WHEN type='Store' THEN 1
       WHEN type='Head Office' THEN 2
       WHEN type='Distribution Centre' OR type='DC' THEN 3
       WHEN type='Wholesale Division' OR type='Wholesale' THEN 4
       ELSE 5 END, name`,
  ).all<Record<string, string | number | null>>();
  const allowed = allowedWorkspaces(member);
  return allowed === null
    ? results
    : results.filter((row) => canAccessWorkspace(member, String(row.name || "")));
}

export function maskIdNumber(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, clean.length - 4))}${clean.slice(-4)}`;
}
