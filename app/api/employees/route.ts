import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { canAccessWorkspace, getHubMember } from "../access";
import { createEmployeeAttendanceNotifications } from "../team/shared";
import {
  accessibleEmployeeWorkspaces,
  canIssueEmployeeWarnings,
  canManageEmployeeFiles,
  canManageEmployeeHrRecords,
  canRecordEmployeeAttendance,
  hasEmployeeRecordsAccess,
  initEmployeeTables,
  maskIdNumber,
} from "./shared";

type DbRow = Record<string, string | number | null>;
const today = () => new Date().toISOString().slice(0, 10);
const clean = (value: unknown) => String(value ?? "").trim();
const int = (value: unknown) => Math.max(0, Math.round(Number(value) || 0));

const attendanceStatuses = ["At work", "Not at work", "Late"];
const warningLevels = ["Verbal", "Written", "Final written"];
const warningStatuses = ["Active", "Withdrawn"];
const hrRecordTypes = ["Leave", "Training / Certification", "Company Asset", "Employment Change", "HR Note"];

function warningActive(row: DbRow, date: string) {
  const status = String(row.status || "Active");
  const validUntil = String(row.valid_until || "");
  return status === "Active" && (!validUntil || validUntil >= date);
}

export async function GET(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member || !hasEmployeeRecordsAccess(member))
    return Response.json({ error: "You do not have access to employee records." }, { status: 403 });

  const stores = await accessibleEmployeeWorkspaces(member);
  const url = new URL(req.url);
  const requested = clean(url.searchParams.get("workspace"));
  const workspace =
    requested && stores.some((row) => String(row.name) === requested)
      ? requested
      : String(stores[0]?.name || "");

  const permissions = {
    canManageEmployees: canManageEmployeeFiles(member),
    canRecordAttendance: canRecordEmployeeAttendance(member),
    canIssueWarnings: canIssueEmployeeWarnings(member),
    canManageHrRecords: canManageEmployeeHrRecords(member),
    canSeeFullId: canManageEmployeeFiles(member),
  };

  if (!workspace) {
    return Response.json({
      stores,
      workspace: "",
      employees: [],
      attendance: [],
      warnings: [],
      hrRecords: [],
      summary: { total: 0, atWork: 0, notAtWork: 0, late: 0, unmarked: 0, activeWarnings: 0, currentLeave: 0, issuedAssets: 0, expiringTraining: 0 },
      permissions,
      today: today(),
    });
  }

  if (!canAccessWorkspace(member, workspace))
    return Response.json({ error: "You do not have access to this location." }, { status: 403 });

  const start = new Date();
  start.setDate(start.getDate() - 180);
  const historyStart = start.toISOString().slice(0, 10);

  const [employeeQuery, attendanceQuery, warningQuery, hrRecordQuery] = await Promise.all([
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
    env.DB.prepare(
      `SELECT * FROM employee_hr_records
       WHERE workspace=?
       ORDER BY record_date DESC,id DESC`,
    ).bind(workspace).all<DbRow>(),
  ]);

  const date = today();
  const canSeeFullId = permissions.canSeeFullId;
  const todaysAttendance = new Map<number, DbRow>(
    attendanceQuery.results
      .filter((row) => String(row.attendance_date) === date)
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

  const hrByEmployee = new Map<number, DbRow[]>();
  for (const record of hrRecordQuery.results) {
    const id = Number(record.employee_id);
    hrByEmployee.set(id, [...(hrByEmployee.get(id) || []), record]);
  }

  const employees = employeeQuery.results.map((row) => {
    const employeeId = Number(row.id);
    const employeeAttendance = attendanceByEmployee.get(employeeId) || [];
    const employeeWarnings = warningsByEmployee.get(employeeId) || [];
    const employeeHr = hrByEmployee.get(employeeId) || [];
    const lateRecords = employeeAttendance.filter((item) => String(item.status) === "Late");
    const absentRecords = employeeAttendance.filter((item) => String(item.status) === "Not at work");
    const presentRecords = employeeAttendance.filter((item) => String(item.status) === "At work");
    const activeWarnings = employeeWarnings.filter((warning) => warningActive(warning, date)).length;
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
      hr_record_count: employeeHr.length,
    };
  });

  const statusCounts = { atWork: 0, notAtWork: 0, late: 0 };
  for (const row of todaysAttendance.values()) {
    if (String(row.status) === "At work") statusCounts.atWork++;
    if (String(row.status) === "Not at work") statusCounts.notAtWork++;
    if (String(row.status) === "Late") statusCounts.late++;
  }

  const activeWarnings = warningQuery.results.filter((warning) => warningActive(warning, date)).length;
  const currentLeave = hrRecordQuery.results.filter((record) => {
    const type = String(record.record_type || "");
    const status = String(record.status || "");
    const startDate = String(record.record_date || "");
    const endDate = String(record.end_date || "");
    return type === "Leave" && !/cancelled|declined/i.test(status) && startDate <= date && (!endDate || endDate >= date);
  }).length;
  const issuedAssets = hrRecordQuery.results.filter(
    (record) => String(record.record_type) === "Company Asset" && /^issued$/i.test(String(record.status || "")),
  ).length;
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const trainingLimit = thirtyDays.toISOString().slice(0, 10);
  const expiringTraining = hrRecordQuery.results.filter((record) => {
    const expiry = String(record.end_date || "");
    return String(record.record_type) === "Training / Certification" && expiry >= date && expiry <= trainingLimit;
  }).length;

  return Response.json({
    stores,
    workspace,
    employees,
    attendance: attendanceQuery.results,
    warnings: warningQuery.results,
    hrRecords: hrRecordQuery.results,
    summary: {
      total: employees.length,
      atWork: statusCounts.atWork,
      notAtWork: statusCounts.notAtWork,
      late: statusCounts.late,
      unmarked: Math.max(0, employees.length - statusCounts.atWork - statusCounts.notAtWork - statusCounts.late),
      activeWarnings,
      currentLeave,
      issuedAssets,
      expiringTraining,
    },
    permissions,
    today: date,
  });
}

export async function POST(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
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
        residential_address,probation_end_date,contract_end_date,
        active,created_by,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?) RETURNING *`)
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
          clean(payload.residentialAddress),
          clean(payload.probationEndDate),
          clean(payload.contractEndDate),
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
    if (!employeeId || !attendanceStatuses.includes(status))
      return Response.json({ error: "Employee and attendance status are required." }, { status: 400 });

    const employee = await env.DB.prepare(
      "SELECT id,workspace,first_name,last_name FROM employee_records WHERE id=? AND active=1",
    ).bind(employeeId).first<{ id: number; workspace: string; first_name: string; last_name: string }>();
    if (!employee || !canAccessWorkspace(member, employee.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const minutesLate = status === "Late" ? int(payload.minutesLate) : 0;
    if (status === "Late" && minutesLate <= 0)
      return Response.json({ error: "Enter how many minutes the employee was late." }, { status: 400 });

    const absenceType = status === "Not at work" ? clean(payload.absenceType) : "";
    const reason = clean(payload.reason);
    const previous = await env.DB.prepare(
      `SELECT status,absence_type,minutes_late,reason
       FROM employee_attendance WHERE employee_id=? AND attendance_date=?`,
    )
      .bind(employeeId, attendanceDate)
      .first<{ status: string; absence_type: string; minutes_late: number; reason: string }>();

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
        absenceType,
        minutesLate,
        reason,
        actor,
        now,
        now,
      )
      .first<DbRow>();

    const changed =
      !previous ||
      previous.status !== status ||
      String(previous.absence_type || "") !== absenceType ||
      Number(previous.minutes_late || 0) !== minutesLate ||
      String(previous.reason || "") !== reason;

    if (changed) {
      try {
        await createEmployeeAttendanceNotifications({
          employeeId,
          employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
          workspace: employee.workspace,
          status: status as "At work" | "Not at work" | "Late",
          minutesLate,
          absenceType,
          reason,
          recordedBy: actor,
        });
      } catch (error) {
        // Attendance is operationally more important than notification delivery.
        console.error("Employee attendance notification failed", error);
      }
    }

    return Response.json({ attendance: record, notified: changed }, { status: 201 });
  }

  if (action === "warning") {
    if (!canIssueEmployeeWarnings(member))
      return Response.json({ error: "You are not authorised to issue warnings." }, { status: 403 });
    const employeeId = Number(payload.employeeId || 0);
    const reason = clean(payload.reason);
    const warningLevel = warningLevels.includes(clean(payload.warningLevel)) ? clean(payload.warningLevel) : "Written";
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

  if (action === "hrRecord") {
    if (!canManageEmployeeHrRecords(member))
      return Response.json({ error: "You are not authorised to add HR records." }, { status: 403 });
    const employeeId = Number(payload.employeeId || 0);
    const recordType = clean(payload.recordType);
    const title = clean(payload.title);
    if (!employeeId || !hrRecordTypes.includes(recordType) || !title)
      return Response.json({ error: "Employee, record type and title are required." }, { status: 400 });
    const employee = await env.DB.prepare(
      "SELECT id,workspace FROM employee_records WHERE id=? AND active=1",
    ).bind(employeeId).first<{ id: number; workspace: string }>();
    if (!employee || !canAccessWorkspace(member, employee.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const record = await env.DB.prepare(`INSERT INTO employee_hr_records (
      employee_id,workspace,record_type,title,record_date,end_date,status,reference,details,created_by,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`)
      .bind(
        employeeId,
        employee.workspace,
        recordType,
        title,
        clean(payload.recordDate) || today(),
        clean(payload.endDate),
        clean(payload.status),
        clean(payload.reference),
        clean(payload.details),
        actor,
        now,
        now,
      )
      .first<DbRow>();
    return Response.json({ hrRecord: record }, { status: 201 });
  }

  return Response.json({ error: "Unknown employee record action." }, { status: 400 });
}

export async function PATCH(req: Request) {
  await initEmployeeTables();
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member || !hasEmployeeRecordsAccess(member))
    return Response.json({ error: "You do not have access to employee records." }, { status: 403 });

  const payload = (await req.json()) as Record<string, unknown>;
  const action = clean(payload.action);
  const now = new Date().toISOString();

  if (action === "employee") {
    if (!canManageEmployeeFiles(member))
      return Response.json({ error: "You are not authorised to edit employee files." }, { status: 403 });
    const id = Number(payload.id || 0);
    const existing = await env.DB.prepare("SELECT workspace,id_number FROM employee_records WHERE id=?")
      .bind(id).first<{ workspace: string; id_number: string }>();
    if (!existing || !canAccessWorkspace(member, existing.workspace))
      return Response.json({ error: "Employee not found or access denied." }, { status: 404 });

    const workspace = clean(payload.workspace) || existing.workspace;
    if (!canAccessWorkspace(member, workspace))
      return Response.json({ error: "You do not have access to the selected location." }, { status: 403 });

    const employmentStatus = clean(payload.employmentStatus) || "Active";
    const active = /^(Terminated|Resigned)$/i.test(employmentStatus) ? 0 : 1;
    const suppliedId = clean(payload.idNumber);
    const idNumber = suppliedId || existing.id_number || "";
    const updated = await env.DB.prepare(`UPDATE employee_records SET
      employee_number=?,workspace=?,first_name=?,last_name=?,id_number=?,phone=?,email=?,job_title=?,department=?,
      start_date=?,employment_type=?,supervisor=?,employment_status=?,emergency_contact_name=?,emergency_contact_phone=?,
      notes=?,residential_address=?,probation_end_date=?,contract_end_date=?,active=?,updated_at=?
      WHERE id=? RETURNING *`)
      .bind(
        clean(payload.employeeNumber),
        workspace,
        clean(payload.firstName),
        clean(payload.lastName),
        idNumber,
        clean(payload.phone),
        clean(payload.email),
        clean(payload.jobTitle),
        clean(payload.department),
        clean(payload.startDate),
        clean(payload.employmentType) || "Permanent",
        clean(payload.supervisor),
        employmentStatus,
        clean(payload.emergencyContactName),
        clean(payload.emergencyContactPhone),
        clean(payload.notes),
        clean(payload.residentialAddress),
        clean(payload.probationEndDate),
        clean(payload.contractEndDate),
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
    const status = warningStatuses.includes(clean(payload.status)) ? clean(payload.status) : "Active";
    const updated = await env.DB.prepare(
      "UPDATE employee_warnings SET status=?,updated_at=? WHERE id=? RETURNING *",
    ).bind(status, now, id).first<DbRow>();
    return Response.json({ warning: updated });
  }

  if (action === "hrRecordStatus") {
    if (!canManageEmployeeHrRecords(member))
      return Response.json({ error: "You are not authorised to update HR records." }, { status: 403 });
    const id = Number(payload.id || 0);
    const record = await env.DB.prepare("SELECT workspace FROM employee_hr_records WHERE id=?")
      .bind(id).first<{ workspace: string }>();
    if (!record || !canAccessWorkspace(member, record.workspace))
      return Response.json({ error: "HR record not found or access denied." }, { status: 404 });
    const status = clean(payload.status);
    const updated = await env.DB.prepare(
      "UPDATE employee_hr_records SET status=?,updated_at=? WHERE id=? RETURNING *",
    ).bind(status, now, id).first<DbRow>();
    return Response.json({ hrRecord: updated });
  }

  return Response.json({ error: "Unsupported employee record update." }, { status: 400 });
}
