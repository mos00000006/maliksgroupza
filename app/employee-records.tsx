"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
  department?: string;
  access_scope?: string;
  workspace_access?: string | string[];
};
type Store = { id: number; name: string; type: string; region: string; manager: string };
type Attendance = {
  id: number;
  employee_id: number;
  workspace: string;
  attendance_date: string;
  status: "At work" | "Not at work" | "Late";
  absence_type: string;
  minutes_late: number;
  reason: string;
  recorded_by: string;
  created_at: string;
};
type Warning = {
  id: number;
  employee_id: number;
  workspace: string;
  warning_date: string;
  warning_level: "Verbal" | "Written" | "Final written";
  reason: string;
  details: string;
  issued_by: string;
  valid_until: string;
  acknowledgement: string;
  status: "Active" | "Withdrawn";
  created_at: string;
};
type Employee = {
  id: number;
  employee_number: string;
  workspace: string;
  first_name: string;
  last_name: string;
  id_number: string;
  phone: string;
  email: string;
  job_title: string;
  department: string;
  start_date: string;
  employment_type: string;
  supervisor: string;
  employment_status: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  today_attendance: Attendance | null;
  attendance_stats: { atWork: number; notAtWork: number; late: number; lateMinutes: number };
  warning_count: number;
  active_warning_count: number;
};
type ApiData = {
  stores: Store[];
  workspace: string;
  employees: Employee[];
  attendance: Attendance[];
  warnings: Warning[];
  summary: {
    total: number;
    atWork: number;
    notAtWork: number;
    late: number;
    unmarked: number;
    activeWarnings: number;
  };
  permissions: {
    canManageEmployees: boolean;
    canRecordAttendance: boolean;
    canIssueWarnings: boolean;
    canSeeFullId?: boolean;
  };
  today: string;
};

const blankEmployee = (workspace = "") => ({
  employeeNumber: "",
  workspace,
  firstName: "",
  lastName: "",
  idNumber: "",
  phone: "",
  email: "",
  jobTitle: "",
  department: "",
  startDate: "",
  employmentType: "Permanent",
  supervisor: "",
  employmentStatus: "Active",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
});

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
};
const employeeName = (employee: Employee) => `${employee.first_name} ${employee.last_name}`.trim();
const initials = (employee: Employee) =>
  `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "ST";
const warningIsActive = (warning: Warning, today: string) =>
  warning.status === "Active" && (!warning.valid_until || warning.valid_until >= today);

export default function EmployeeRecords({ currentUser }: { currentUser: CurrentHubUser }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [employeeModal, setEmployeeModal] = useState<"add" | "edit" | null>(null);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee(""));
  const [attendanceModal, setAttendanceModal] = useState<{ employee: Employee; status: "Not at work" | "Late" } | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    absenceType: "Unauthorised absence",
    minutesLate: "",
    reason: "",
  });
  const [warningModal, setWarningModal] = useState<Employee | null>(null);
  const [warningForm, setWarningForm] = useState({
    warningDate: new Date().toISOString().slice(0, 10),
    warningLevel: "Written",
    reason: "",
    details: "",
    issuedBy: currentUser.name || "",
    validUntil: "",
    acknowledgement: "",
  });
  const [saving, setSaving] = useState(false);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const load = async (target?: string) => {
    setLoading(true);
    try {
      const requested = target ?? workspace;
      const url = requested ? `/api/employees?workspace=${encodeURIComponent(requested)}` : "/api/employees";
      const response = await fetch(url, { cache: "no-store" });
      const result = (await response.json()) as ApiData & { error?: string };
      if (!response.ok) {
        flash(result.error || "Employee records could not be loaded.");
        return;
      }
      setData(result);
      setWorkspace(result.workspace);
      setSelected((current) =>
        current ? result.employees.find((employee) => employee.id === current.id) || null : null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load("");
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!data || !needle) return data?.employees || [];
    return data.employees.filter((employee) =>
      [
        employeeName(employee),
        employee.employee_number,
        employee.job_title,
        employee.department,
        employee.phone,
        employee.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, search]);

  const attendanceFor = (employeeId: number) =>
    (data?.attendance || []).filter((record) => Number(record.employee_id) === employeeId);
  const warningsFor = (employeeId: number) =>
    (data?.warnings || []).filter((warning) => Number(warning.employee_id) === employeeId);

  const markAtWork = async (employee: Employee) => {
    if (!data?.permissions.canRecordAttendance || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "attendance",
          employeeId: employee.id,
          attendanceDate: data.today,
          status: "At work",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Attendance could not be saved.");
      flash(`${employeeName(employee)} marked at work.`);
      await load(workspace);
    } finally {
      setSaving(false);
    }
  };

  const openAttendance = (employee: Employee, status: "Not at work" | "Late") => {
    setAttendanceForm({
      absenceType: "Unauthorised absence",
      minutesLate: status === "Late" ? String(employee.today_attendance?.minutes_late || "") : "",
      reason: employee.today_attendance?.reason || "",
    });
    setAttendanceModal({ employee, status });
  };

  const saveAttendance = async () => {
    if (!attendanceModal || !data || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "attendance",
          employeeId: attendanceModal.employee.id,
          attendanceDate: data.today,
          status: attendanceModal.status,
          absenceType: attendanceModal.status === "Not at work" ? attendanceForm.absenceType : "",
          minutesLate: attendanceModal.status === "Late" ? Number(attendanceForm.minutesLate) : 0,
          reason: attendanceForm.reason,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Attendance could not be saved.");
      flash(
        attendanceModal.status === "Late"
          ? `${employeeName(attendanceModal.employee)} marked ${attendanceForm.minutesLate} minutes late.`
          : `${employeeName(attendanceModal.employee)} marked not at work.`,
      );
      setAttendanceModal(null);
      await load(workspace);
    } finally {
      setSaving(false);
    }
  };

  const openAddEmployee = () => {
    setEmployeeForm(blankEmployee(workspace));
    setEmployeeModal("add");
  };
  const openEditEmployee = (employee: Employee) => {
    setEmployeeForm({
      employeeNumber: employee.employee_number,
      workspace: employee.workspace,
      firstName: employee.first_name,
      lastName: employee.last_name,
      idNumber: employee.id_number.includes("•") ? "" : employee.id_number,
      phone: employee.phone,
      email: employee.email,
      jobTitle: employee.job_title,
      department: employee.department,
      startDate: employee.start_date,
      employmentType: employee.employment_type,
      supervisor: employee.supervisor,
      employmentStatus: employee.employment_status,
      emergencyContactName: employee.emergency_contact_name,
      emergencyContactPhone: employee.emergency_contact_phone,
      notes: employee.notes,
    });
    setEmployeeModal("edit");
    setSelected(employee);
  };

  const saveEmployee = async () => {
    if (!employeeModal || saving) return;
    setSaving(true);
    try {
      const editing = employeeModal === "edit" && selected;
      const response = await fetch("/api/employees", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "employee",
          ...(editing ? { id: selected.id } : {}),
          ...employeeForm,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Employee file could not be saved.");
      flash(editing ? "Employee file updated." : "Employee added.");
      setEmployeeModal(null);
      await load(employeeForm.workspace || workspace);
    } finally {
      setSaving(false);
    }
  };

  const openWarning = (employee: Employee) => {
    setWarningForm({
      warningDate: data?.today || new Date().toISOString().slice(0, 10),
      warningLevel: "Written",
      reason: "",
      details: "",
      issuedBy: currentUser.name || "",
      validUntil: "",
      acknowledgement: "",
    });
    setWarningModal(employee);
  };

  const saveWarning = async () => {
    if (!warningModal || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "warning",
          employeeId: warningModal.id,
          ...warningForm,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Warning could not be saved.");
      flash(`Warning recorded for ${employeeName(warningModal)}.`);
      setWarningModal(null);
      await load(workspace);
    } finally {
      setSaving(false);
    }
  };

  const withdrawWarning = async (warning: Warning) => {
    if (!data?.permissions.canIssueWarnings || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "warning", id: warning.id, status: "Withdrawn" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return flash(result.error || "Warning could not be updated.");
      flash("Warning withdrawn.");
      await load(workspace);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data)
    return <div className="employeeRecordsLoading">Loading employee records…</div>;

  if (!data)
    return <div className="employeeRecordsLoading">Employee records are unavailable.</div>;

  return (
    <section className="employeeRecords">
      {message && <div className="employeeToast">{message}</div>}

      <div className="employeeHero">
        <div>
          <small>POWERBUILD PEOPLE CONTROL</small>
          <h2>Employee Records & Attendance</h2>
          <p>
            Maintain each employee file, mark daily attendance, record lateness in minutes and keep a controlled warning history.
          </p>
        </div>
        <div className="employeeHeroActions">
          <label>
            Location
            <select
              value={workspace}
              onChange={(event) => {
                setSearch("");
                setSelected(null);
                void load(event.target.value);
              }}
            >
              {data.stores.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>
          {data.permissions.canManageEmployees && (
            <button onClick={openAddEmployee}>＋ Add employee</button>
          )}
        </div>
      </div>

      <div className="employeeKpis">
        <article><span>Total employees</span><b>{data.summary.total}</b><small>{workspace || "No location selected"}</small></article>
        <article className="present"><span>At work today</span><b>{data.summary.atWork}</b><small>Marked present</small></article>
        <article className="late"><span>Late today</span><b>{data.summary.late}</b><small>Minutes retained in history</small></article>
        <article className="absent"><span>Not at work</span><b>{data.summary.notAtWork}</b><small>Absence reason recorded</small></article>
        <article><span>Not marked</span><b>{data.summary.unmarked}</b><small>Attendance still outstanding</small></article>
        <article className="warning"><span>Active warnings</span><b>{data.summary.activeWarnings}</b><small>Across this location</small></article>
      </div>

      <div className="employeeToolbar">
        <label>
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee, number, job title or department…"
          />
        </label>
        <small>{filteredEmployees.length} employee{filteredEmployees.length === 1 ? "" : "s"} shown</small>
      </div>

      <div className="employeeListPanel">
        <header>
          <div>
            <small>DAILY STAFF CONTROL</small>
            <h3>Employees</h3>
            <p>Use the three attendance buttons for today. Clicking Late asks for the number of minutes.</p>
          </div>
        </header>

        <div className="employeeTableWrap">
          <div className="employeeTableHead">
            <span>Employee</span><span>Role</span><span>Start date</span><span>Today</span><span>Warnings</span><span>Attendance action</span>
          </div>
          {filteredEmployees.map((employee) => {
            const attendance = employee.today_attendance;
            return (
              <div className="employeeTableRow" key={employee.id}>
                <button className="employeeIdentity" onClick={() => setSelected(employee)}>
                  <i>{initials(employee)}</i>
                  <span>
                    <b>{employeeName(employee)}</b>
                    <small>{employee.employee_number} · {employee.department || "No department"}</small>
                  </span>
                </button>
                <span className="employeeRoleCell">
                  <b>{employee.job_title || "Not set"}</b>
                  <small>{employee.employment_type}</small>
                </span>
                <span>{formatDate(employee.start_date)}</span>
                <span>
                  <em className={`attendancePill ${attendance?.status === "At work" ? "atWork" : attendance?.status === "Late" ? "late" : attendance?.status === "Not at work" ? "notAtWork" : "unmarked"}`}>
                    {attendance?.status || "Not marked"}
                    {attendance?.status === "Late" && ` · ${attendance.minutes_late} min`}
                  </em>
                  {attendance?.reason && <small className="attendanceReason">{attendance.reason}</small>}
                </span>
                <button className="warningCountButton" onClick={() => setSelected(employee)}>
                  <b>{employee.warning_count}</b>
                  <small>{employee.active_warning_count} active</small>
                </button>
                <div className="attendanceButtons">
                  <button
                    className={attendance?.status === "At work" ? "selected atWork" : "atWork"}
                    onClick={() => void markAtWork(employee)}
                    disabled={!data.permissions.canRecordAttendance || saving}
                  >
                    ✓ At work
                  </button>
                  <button
                    className={attendance?.status === "Not at work" ? "selected notAtWork" : "notAtWork"}
                    onClick={() => openAttendance(employee, "Not at work")}
                    disabled={!data.permissions.canRecordAttendance || saving}
                  >
                    × Not at work
                  </button>
                  <button
                    className={attendance?.status === "Late" ? "selected late" : "late"}
                    onClick={() => openAttendance(employee, "Late")}
                    disabled={!data.permissions.canRecordAttendance || saving}
                  >
                    ⏱ Late
                  </button>
                </div>
              </div>
            );
          })}
          {!filteredEmployees.length && (
            <div className="employeeEmpty">
              {data.employees.length ? "No employees match your search." : "No employee files have been added to this location yet."}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelected(null)}>
          <section className="employeeProfile" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div className="employeeProfileHeading">
                <i>{initials(selected)}</i>
                <span>
                  <small>EMPLOYEE FILE · {selected.employee_number}</small>
                  <h2>{employeeName(selected)}</h2>
                  <p>{selected.job_title || "Job title not set"} · {selected.workspace}</p>
                </span>
              </div>
              <div className="employeeProfileHeaderActions">
                {data.permissions.canManageEmployees && <button onClick={() => openEditEmployee(selected)}>Edit file</button>}
                <button className="closeEmployeeModal" onClick={() => setSelected(null)}>×</button>
              </div>
            </header>

            <div className="employeeProfileBody">
              <div className="employeeProfileStats">
                <article><span>At work</span><b>{selected.attendance_stats.atWork}</b><small>last 60 days recorded</small></article>
                <article><span>Late</span><b>{selected.attendance_stats.late}</b><small>{selected.attendance_stats.lateMinutes} total minutes</small></article>
                <article><span>Not at work</span><b>{selected.attendance_stats.notAtWork}</b><small>last 60 days recorded</small></article>
                <article className="warning"><span>Warnings</span><b>{selected.warning_count}</b><small>{selected.active_warning_count} active</small></article>
              </div>

              <div className="employeeFileGrid">
                <section>
                  <small>EMPLOYMENT</small>
                  <dl>
                    <div><dt>Employee no.</dt><dd>{selected.employee_number}</dd></div>
                    <div><dt>Job title</dt><dd>{selected.job_title || "—"}</dd></div>
                    <div><dt>Department</dt><dd>{selected.department || "—"}</dd></div>
                    <div><dt>Start date</dt><dd>{formatDate(selected.start_date)}</dd></div>
                    <div><dt>Employment type</dt><dd>{selected.employment_type || "—"}</dd></div>
                    <div><dt>Supervisor</dt><dd>{selected.supervisor || "—"}</dd></div>
                    <div><dt>Status</dt><dd>{selected.employment_status || "Active"}</dd></div>
                  </dl>
                </section>
                <section>
                  <small>CONTACT & IDENTIFICATION</small>
                  <dl>
                    <div><dt>ID / Passport</dt><dd>{selected.id_number || "—"}</dd></div>
                    <div><dt>Phone</dt><dd>{selected.phone || "—"}</dd></div>
                    <div><dt>Email</dt><dd>{selected.email || "—"}</dd></div>
                    <div><dt>Emergency contact</dt><dd>{selected.emergency_contact_name || "—"}</dd></div>
                    <div><dt>Emergency phone</dt><dd>{selected.emergency_contact_phone || "—"}</dd></div>
                  </dl>
                </section>
              </div>

              {selected.notes && (
                <div className="employeeNotes">
                  <small>EMPLOYEE FILE NOTES</small>
                  <p>{selected.notes}</p>
                </div>
              )}

              <section className="employeeHistorySection">
                <header>
                  <div><small>ATTENDANCE HISTORY</small><h3>Recent attendance</h3></div>
                </header>
                <div className="employeeHistoryTable">
                  <div className="employeeHistoryHead"><span>Date</span><span>Status</span><span>Detail</span><span>Recorded by</span></div>
                  {attendanceFor(selected.id).slice(0, 30).map((record) => (
                    <div className="employeeHistoryRow" key={record.id}>
                      <span>{formatDate(record.attendance_date)}</span>
                      <span><em className={`attendancePill ${record.status === "At work" ? "atWork" : record.status === "Late" ? "late" : "notAtWork"}`}>{record.status}</em></span>
                      <span>
                        {record.status === "Late" ? `${record.minutes_late} minutes late` : record.absence_type || "—"}
                        {record.reason && <small>{record.reason}</small>}
                      </span>
                      <span>{record.recorded_by || "—"}</span>
                    </div>
                  ))}
                  {!attendanceFor(selected.id).length && <div className="employeeEmpty">No attendance history yet.</div>}
                </div>
              </section>

              <section className="employeeHistorySection warningHistory">
                <header>
                  <div><small>DISCIPLINARY HISTORY</small><h3>Warnings ({selected.warning_count})</h3></div>
                  {data.permissions.canIssueWarnings && <button onClick={() => openWarning(selected)}>＋ Issue warning</button>}
                </header>
                <div className="warningCards">
                  {warningsFor(selected.id).map((warning) => {
                    const active = warningIsActive(warning, data.today);
                    return (
                      <article key={warning.id}>
                        <div>
                          <em className={`warningLevel ${warning.warning_level === "Final written" ? "final" : warning.warning_level === "Written" ? "written" : "verbal"}`}>{warning.warning_level}</em>
                          <b>{warning.reason}</b>
                          <small>{formatDate(warning.warning_date)} · Issued by {warning.issued_by || "—"}</small>
                        </div>
                        <p>{warning.details || "No additional details."}</p>
                        <footer>
                          <span className={active ? "activeWarning" : "inactiveWarning"}>
                            {warning.status === "Withdrawn" ? "Withdrawn" : active ? "Active" : "Expired"}
                          </span>
                          {warning.valid_until && <small>Valid until {formatDate(warning.valid_until)}</small>}
                          {warning.acknowledgement && <small>Acknowledgement: {warning.acknowledgement}</small>}
                          {active && data.permissions.canIssueWarnings && (
                            <button onClick={() => void withdrawWarning(warning)}>Withdraw warning</button>
                          )}
                        </footer>
                      </article>
                    );
                  })}
                  {!warningsFor(selected.id).length && <div className="employeeEmpty">No warnings recorded for this employee.</div>}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}

      {attendanceModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setAttendanceModal(null)}>
          <section className="employeeSmallModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>ATTENDANCE · {data.today}</small>
                <h2>{attendanceModal.status}</h2>
                <p>{employeeName(attendanceModal.employee)}</p>
              </div>
              <button onClick={() => setAttendanceModal(null)}>×</button>
            </header>
            <div className="employeeModalBody">
              {attendanceModal.status === "Late" ? (
                <label>
                  Minutes late *
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={attendanceForm.minutesLate}
                    onChange={(event) => setAttendanceForm({ ...attendanceForm, minutesLate: event.target.value })}
                    placeholder="e.g. 25"
                    autoFocus
                  />
                </label>
              ) : (
                <label>
                  Absence type
                  <select
                    value={attendanceForm.absenceType}
                    onChange={(event) => setAttendanceForm({ ...attendanceForm, absenceType: event.target.value })}
                  >
                    <option>Unauthorised absence</option>
                    <option>Sick</option>
                    <option>Annual leave</option>
                    <option>Family responsibility</option>
                    <option>Off day</option>
                    <option>Training</option>
                    <option>Other</option>
                  </select>
                </label>
              )}
              <label>
                Reason / note
                <textarea
                  value={attendanceForm.reason}
                  onChange={(event) => setAttendanceForm({ ...attendanceForm, reason: event.target.value })}
                  placeholder={attendanceModal.status === "Late" ? "Reason given for being late…" : "Reason employee is not at work…"}
                />
              </label>
            </div>
            <footer>
              <button onClick={() => setAttendanceModal(null)}>Cancel</button>
              <button className="employeePrimary" onClick={() => void saveAttendance()} disabled={saving}>
                {saving ? "Saving…" : `Save ${attendanceModal.status.toLowerCase()}`}
              </button>
            </footer>
          </section>
        </div>
      )}

      {employeeModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setEmployeeModal(null)}>
          <section className="employeeFormModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>EMPLOYEE MASTER FILE</small>
                <h2>{employeeModal === "add" ? "Add employee" : "Edit employee file"}</h2>
                <p>Employment, contact and emergency information.</p>
              </div>
              <button onClick={() => setEmployeeModal(null)}>×</button>
            </header>
            <div className="employeeFormBody">
              <div className="employeeFormGrid">
                <label>Employee number *<input value={employeeForm.employeeNumber} onChange={(e) => setEmployeeForm({ ...employeeForm, employeeNumber: e.target.value })} /></label>
                <label>Location *<select value={employeeForm.workspace} onChange={(e) => setEmployeeForm({ ...employeeForm, workspace: e.target.value })}>{data.stores.map((store) => <option key={store.id} value={store.name}>{store.name}</option>)}</select></label>
                <label>First name *<input value={employeeForm.firstName} onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} /></label>
                <label>Surname *<input value={employeeForm.lastName} onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} /></label>
                <label>ID / Passport number<input value={employeeForm.idNumber} onChange={(e) => setEmployeeForm({ ...employeeForm, idNumber: e.target.value })} placeholder={employeeModal === "edit" && selected?.id_number.includes("•") ? "Leave blank to keep protected value" : ""} /></label>
                <label>Phone<input value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} /></label>
                <label>Email<input type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></label>
                <label>Job title<input value={employeeForm.jobTitle} onChange={(e) => setEmployeeForm({ ...employeeForm, jobTitle: e.target.value })} /></label>
                <label>Department<input value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} placeholder="Sales, Receiving, Dispatch…" /></label>
                <label>Start date<input type="date" value={employeeForm.startDate} onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value })} /></label>
                <label>Employment type<select value={employeeForm.employmentType} onChange={(e) => setEmployeeForm({ ...employeeForm, employmentType: e.target.value })}><option>Permanent</option><option>Fixed-term</option><option>Temporary</option><option>Casual</option><option>Contractor</option></select></label>
                <label>Supervisor / manager<input value={employeeForm.supervisor} onChange={(e) => setEmployeeForm({ ...employeeForm, supervisor: e.target.value })} /></label>
                <label>Employment status<select value={employeeForm.employmentStatus} onChange={(e) => setEmployeeForm({ ...employeeForm, employmentStatus: e.target.value })}><option>Active</option><option>On leave</option><option>Suspended</option><option>Resigned</option><option>Terminated</option></select></label>
                <label>Emergency contact<input value={employeeForm.emergencyContactName} onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContactName: e.target.value })} /></label>
                <label>Emergency phone<input value={employeeForm.emergencyContactPhone} onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContactPhone: e.target.value })} /></label>
              </div>
              <label className="employeeNotesField">Employee file notes<textarea value={employeeForm.notes} onChange={(e) => setEmployeeForm({ ...employeeForm, notes: e.target.value })} placeholder="Important non-medical employment notes, transfer information, uniform/equipment notes, etc." /></label>
              <p className="employeePrivacyNote">ID numbers and disciplinary records are sensitive HR information. Access is restricted to authorised management/HR roles in the Hub.</p>
            </div>
            <footer>
              <button onClick={() => setEmployeeModal(null)}>Cancel</button>
              <button className="employeePrimary" onClick={() => void saveEmployee()} disabled={saving}>
                {saving ? "Saving…" : employeeModal === "add" ? "Add employee" : "Save employee file"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {warningModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setWarningModal(null)}>
          <section className="employeeSmallModal warningModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <small>DISCIPLINARY RECORD</small>
                <h2>Issue warning</h2>
                <p>{employeeName(warningModal)} · {warningModal.employee_number}</p>
              </div>
              <button onClick={() => setWarningModal(null)}>×</button>
            </header>
            <div className="employeeModalBody">
              <div className="employeeModalTwo">
                <label>Warning date<input type="date" value={warningForm.warningDate} onChange={(e) => setWarningForm({ ...warningForm, warningDate: e.target.value })} /></label>
                <label>Warning level<select value={warningForm.warningLevel} onChange={(e) => setWarningForm({ ...warningForm, warningLevel: e.target.value })}><option>Verbal</option><option>Written</option><option>Final written</option></select></label>
              </div>
              <label>Reason *<input value={warningForm.reason} onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })} placeholder="e.g. Repeated lateness" /></label>
              <label>Details<textarea value={warningForm.details} onChange={(e) => setWarningForm({ ...warningForm, details: e.target.value })} placeholder="Record the facts and action required…" /></label>
              <div className="employeeModalTwo">
                <label>Issued by<input value={warningForm.issuedBy} onChange={(e) => setWarningForm({ ...warningForm, issuedBy: e.target.value })} /></label>
                <label>Valid until<input type="date" value={warningForm.validUntil} onChange={(e) => setWarningForm({ ...warningForm, validUntil: e.target.value })} /><small>Use the expiry period required by company policy.</small></label>
              </div>
              <label>Employee acknowledgement<textarea value={warningForm.acknowledgement} onChange={(e) => setWarningForm({ ...warningForm, acknowledgement: e.target.value })} placeholder="Employee response / acknowledgement…" /></label>
              <p className="employeePrivacyNote">The Hub records the warning history. It does not decide whether disciplinary action is legally justified; apply your HR policy and applicable labour process.</p>
            </div>
            <footer>
              <button onClick={() => setWarningModal(null)}>Cancel</button>
              <button className="employeePrimary warningPrimary" onClick={() => void saveWarning()} disabled={saving}>
                {saving ? "Saving…" : "Record warning"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
