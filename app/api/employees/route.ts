import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { canAccessWorkspace, getHubMember } from "../access";
import {
  accessibleEmployeeWorkspaces,
  canIssueEmployeeWarnings,
  canManageEmployeeFiles,
  canRecordEmployeeAttendance,
  hasEmployeeRecordsAccess,
  initEmployeeTables,
  maskIdNumber,
} from "./shared";

type DbRow = Record<string, string | number | null>;
const today = () => new Date().toISOString().slice(0, 10);
const clean = (value: unknown) => String(value ?? "").trim();
const int = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));

function validAttendanceStatus(value: string) {
  return ["At work", "Not at work", "Late"].includes(value);
}
function validWarningLevel(value: string) {
  return ["Verbal", "Written", "Final written"].includes(value);
}
function validWarningStatus(value: string) {
  return ["Active", "Withdrawn"].includes(value);
}

export async function GET(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember();
  if (!member || !hasEmployeeRecordsAccess(member))
    return Response.json({ error: "You do not have access to employee records." }, { status: 403 });

  const stores = await accessibleEmployeeWorkspaces(member);
  const url = new URL(req.url);
  const requested = clean(url.searchParams.get("workspace"));
  const workspace =
    requested && stores.some((row) => String(row.name) === requested)
      ? requested
      : String(stores[0]?.name || "");

  if (!workspace)
    return Response.json({
      stores,
      workspace: "",
      employees: [],
      attendance: [],
      warnings: [],
      summary: { total: 0, atWork: 0, notAtWork: 0, late: 0, unmarked: 0, activeWarnings: 0 },
      permissions: {
        canManageEmployees: canManageEmployeeFiles(member),
        canRecordAttendance: canRecordEmployeeAttendance(member),
        canIssueWarnings: canIssueEmployeeWarnings(member),
      },
      today: today(),
    });

  if (!canAccessWorkspace(member, workspace))
    return Response.json({ error: "You do not have access to this location." }, { status: 403 });

  const start = new Date();
  start.setDate(start.getDate() - 60);
  const historyStart = start.toISOString().slice(0, 10);

  const [employeeQuery, attendanceQuery, warningQuery] = await Promise.all([
    env.DB.prepare(
      `SELECT * FROM employee_records
       WHERE workspace=? AND active=1
       ORDER BY last_name,first_name,employee_number`,
    ).bind(workspace).all<DbRow>(),
    env.DB.prepare(
      `SELECT * FROM employee_attendance
       WHERE workspace=? AND attendance_date>=?
       ORDER BY attendance_date DESC,id DESC`,
    ).bind(workspace, historyStart).all<DbRow>(),
    env.DB.prepare(
      `SELECT * FROM employee_warnings
       WHERE workspace=?
       ORDER BY warning_date DESC,id DESC`,
    ).bind(workspace).all<DbRow>(),
  ]);

  const canSeeFullId = canManageEmployeeFiles(member);
  const todaysAttendance = new Map<number, DbRow>(
    attendanceQuery.results
      .filter((row) => String(row.attendance_date) === today())
      .map((row) => [Number(row.employee_id), row] as [number, DbRow]),
  );

  const warningsByEmployee = new Map<number, DbRow[]>();
  for (const warning of warningQuery.results) {
    const id = Number(warning.employee_id);
    warningsByEmployee.set(id, [...(warningsByEmployee.get(id) || []), warning]);
  }

  const attendanceByEmployee = new Map<number, DbRow[]>();
  for (const record of attendanceQuery.results) {
    const id = Number(record.employee_id);
    attendanceByEmployee.set(id, [...(attendanceByEmployee.get(id) || []), record]);
  }

  const employees = employeeQuery.results.map((row) => {
    const employeeId = Number(row.id);
    const employeeAttendance = attendanceByEmployee.get(employeeId) || [];
    const employeeWarnings = warningsByEmployee.get(employeeId) || [];
    const lateRecords = employeeAttendance.filter((item) => String(item.status) === "Late");
    const absentRecords = employeeAttendance.filter((item) => String(item.status) === "Not at work");
    const presentRecords = employeeAttendance.filter((item) => String(item.status) === "At work");
    const activeWarnings = employeeWarnings.filter((warning) => {
      const status = String(warning.status || "Active");
      const validUntil = String(warning.valid_until || "");
      return status === "Active" && (!validUntil || validUntil >= today());
    }).length;
    return {
      ...row,
      id_number: canSeeFullId ? String(row.id_number || "") : maskIdNumber(String(row.id_number || "")),
      today_attendance: todaysAttendance.get(employeeId) || null,
      attendance_stats: {
        atWork: presentRecords.length,
        notAtWork: absentRecords.length,
        late: lateRecords.length,
        lateMinutes: lateRecords.reduce((sum, item) => sum + Number(item.minutes_late || 0), 0),
      },
      warning_count: employeeWarnings.length,
      active_warning_count: activeWarnings,
    };
  });

  const statusCounts = { atWork: 0, notAtWork: 0, late: 0 };
  for (const row of todaysAttendance.values()) {
    if (String(row.status) === "At work") statusCounts.atWork++;
    if (String(row.status) === "Not at work") statusCounts.notAtWork++;
    if (String(row.status) === "Late") statusCounts.late++;
  }

  const activeWarnings = warningQuery.results.filter((warning) => {
    const status = String(warning.status || "Active");
    const validUntil = String(warning.valid_until || "");
    return status === "Active" && (!validUntil || validUntil >= today());
  }).length;

  return Response.json({
    stores,
    workspace,
    employees,
    attendance: attendanceQuery.results,
    warnings: warningQuery.results,
    summary: {
      total: employees.length,
      atWork: statusCounts.atWork,
      notAtWork: statusCounts.notAtWork,
      late: statusCounts.late,
      unmarked: Math.max(0, employees.length - statusCounts.atWork - statusCounts.notAtWork - statusCounts.late),
      activeWarnings,
    },
    permissions: {
      canManageEmployees: canManageEmployeeFiles(member),
      canRecordAttendance: canRecordEmployeeAttendance(member),
      canIssueWarnings: canIssueEmployeeWarnings(member),
      canSeeFullId,
    },
    today: today(),
  });
}

export async function POST(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember();
  if (!member || !hasEmployeeRecordsAccess(member))
    return Response.json({ error: "You do not have access to employee records." }, { status: 403 });

  const user = await getAuthenticatedUser();
  const payload = (await req.json()) as Record<string, unknown>;
  const action = clean(payload.action);
  const now = new Date().toISOString();
  const actor = user?.displayName || member.name || user?.email || member.email;

  if (action === "employee") {
    if (!canManageEmployeeFiles(member))
      return Response.json({ error: "You are not authorised to add employee files." }, { status: 403 });
    const workspace = clean(payload.workspace);
    const employeeNumber = clean(payload.employeeNumber);
    const firstName = clean(payload.firstName);
    const lastName = clean(payload.lastName);
    if (!workspace || !canAccessWorkspace(member, workspace))
      return Response.json({ error: "A valid accessible location is required." }, { status: 403 });
    if (!employeeNumber || !firstName || !lastName)
      return Response.json({ error: "Employee number, first name and surname are required." }, { status: 400 });

    try {
      const employee = await env.DB.prepare(`INSERT INTO employee_records (
        employee_number,workspace,first_name,last_name,id_number,phone,email,job_title,department,start_date,
        employment_type,supervisor,employment_status,emergency_contact_name,emergency_contact_phone,notes,
        active,created_by,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?) RETURNING *`)
        .bind(
          employeeNumber,
          workspace,
          firstName,
          lastName,
          clean(payload.idNumber),
          clean(payload.phone),
          clean(payload.email),
          clean(payload.jobTitle),
          clean(payload.department),
          clean(payload.startDate),
          clean(payload.employmentType) || "Permanent",
          clean(payload.supervisor),
          clean(payload.employmentStatus) || "Active",
          clean(payload.emergencyContactName),
          clean(payload.emergencyContactPhone),
          clean(payload.notes),
          user?.email || member.email,
          now,
          now,
        )
        .first<DbRow>();
      return Response.json({ employee }, { status: 201 });
    } catch (error) {
      const message = String(error);
      if (/unique/i.test(message))
        return Response.json({ error: "That employee number already exists at this location." }, { status: 409 });
      return Response.json({ error: "Employee record could not be created." }, { status: 500 });
    }
  }

  if (action === "attendance") {
    if (!canRecordEmployeeAttendance(member))
      return Response.json({ error: "You are not authorised to record attendance." }, { status: 403 });
    const employeeId = Number(payload.employeeId || 0);
    const status = clean(payload.status);
    const attendanceDate = clean(payload.attendanceDate) || today();
    if (!employeeId || !validAttendanceStatus(status))
      return Response.json({ error: "Employee and attendance status are required." }, { status: 400 });

    const employee = await env.DB.prepare(
      "SELECT id,workspace FROM employee_records WHERE id=? AND active=1",
    ).bind(employeeId).first<{ id: number; workspace: string }>();
    if (!employee || !canAccessWorkspace(member, employee.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const minutesLate = status === "Late" ? int(payload.minutesLate) : 0;
    if (status === "Late" && minutesLate <= 0)
      return Response.json({ error: "Enter how many minutes the employee was late." }, { status: 400 });

    const record = await env.DB.prepare(`INSERT INTO employee_attendance (
      employee_id,workspace,attendance_date,status,absence_type,minutes_late,reason,recorded_by,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(employee_id,attendance_date) DO UPDATE SET
      status=excluded.status,absence_type=excluded.absence_type,minutes_late=excluded.minutes_late,
      reason=excluded.reason,recorded_by=excluded.recorded_by,updated_at=excluded.updated_at
    RETURNING *`)
      .bind(
        employeeId,
        employee.workspace,
        attendanceDate,
        status,
        status === "Not at work" ? clean(payload.absenceType) : "",
        minutesLate,
        clean(payload.reason),
        actor,
        now,
        now,
      )
      .first<DbRow>();
    return Response.json({ attendance: record }, { status: 201 });
  }

  if (action === "warning") {
    if (!canIssueEmployeeWarnings(member))
      return Response.json({ error: "You are not authorised to issue warnings." }, { status: 403 });
    const employeeId = Number(payload.employeeId || 0);
    const reason = clean(payload.reason);
    const warningLevel = validWarningLevel(clean(payload.warningLevel)) ? clean(payload.warningLevel) : "Written";
    if (!employeeId || !reason)
      return Response.json({ error: "Employee and warning reason are required." }, { status: 400 });

    const employee = await env.DB.prepare(
      "SELECT id,workspace FROM employee_records WHERE id=? AND active=1",
    ).bind(employeeId).first<{ id: number; workspace: string }>();
    if (!employee || !canAccessWorkspace(member, employee.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const warning = await env.DB.prepare(`INSERT INTO employee_warnings (
      employee_id,workspace,warning_date,warning_level,reason,details,issued_by,valid_until,acknowledgement,status,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,'Active',?,?) RETURNING *`)
      .bind(
        employeeId,
        employee.workspace,
        clean(payload.warningDate) || today(),
        warningLevel,
        reason,
        clean(payload.details),
        clean(payload.issuedBy) || actor,
        clean(payload.validUntil),
        clean(payload.acknowledgement),
        now,
        now,
      )
      .first<DbRow>();
    return Response.json({ warning }, { status: 201 });
  }

  return Response.json({ error: "Unknown employee record action." }, { status: 400 });
}

export async function PATCH(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember();
  if (!member || !hasEmployeeRecordsAccess(member))
    return Response.json({ error: "You do not have access to employee records." }, { status: 403 });

  const payload = (await req.json()) as Record<string, unknown>;
  const action = clean(payload.action);
  const now = new Date().toISOString();

  if (action === "employee") {
    if (!canManageEmployeeFiles(member))
      return Response.json({ error: "You are not authorised to edit employee files." }, { status: 403 });
    const id = Number(payload.id || 0);
    const existing = await env.DB.prepare("SELECT workspace FROM employee_records WHERE id=?")
      .bind(id).first<{ workspace: string }>();
    if (!existing || !canAccessWorkspace(member, existing.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const workspace = clean(payload.workspace) || existing.workspace;
    if (!canAccessWorkspace(member, workspace))
      return Response.json({ error: "You do not have access to the selected location." }, { status: 403 });

    const active = 1; // Former employees remain in the HR register; employment_status carries their state.
    const updated = await env.DB.prepare(`UPDATE employee_records SET
      employee_number=?,workspace=?,first_name=?,last_name=?,id_number=?,phone=?,email=?,job_title=?,department=?,
      start_date=?,employment_type=?,supervisor=?,employment_status=?,emergency_contact_name=?,emergency_contact_phone=?,
      notes=?,active=?,updated_at=?
      WHERE id=? RETURNING *`)
      .bind(
        clean(payload.employeeNumber),
        workspace,
        clean(payload.firstName),
        clean(payload.lastName),
        clean(payload.idNumber),
        clean(payload.phone),
        clean(payload.email),
        clean(payload.jobTitle),
        clean(payload.department),
        clean(payload.startDate),
        clean(payload.employmentType) || "Permanent",
        clean(payload.supervisor),
        clean(payload.employmentStatus) || "Active",
        clean(payload.emergencyContactName),
        clean(payload.emergencyContactPhone),
        clean(payload.notes),
        active,
        now,
        id,
      )
      .first<DbRow>();
    return Response.json({ employee: updated });
  }

  if (action === "warning") {
    if (!canIssueEmployeeWarnings(member))
      return Response.json({ error: "You are not authorised to update warnings." }, { status: 403 });
    const id = Number(payload.id || 0);
    const warning = await env.DB.prepare("SELECT workspace FROM employee_warnings WHERE id=?")
      .bind(id).first<{ workspace: string }>();
    if (!warning || !canAccessWorkspace(member, warning.workspace))
      return Response.json({ error: "Warning not found or access denied." }, { status: 404 });
    const status = validWarningStatus(clean(payload.status)) ? clean(payload.status) : "Active";
    const updated = await env.DB.prepare(
      "UPDATE employee_warnings SET status=?,updated_at=? WHERE id=? RETURNING *",
    ).bind(status, now, id).first<DbRow>();
    return Response.json({ warning: updated });
  }

  return Response.json({ error: "Unsupported employee record update." }, { status: 400 });
}
