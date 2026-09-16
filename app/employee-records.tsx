"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = { name: string; email: string; role?: string; department?: string };
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
};
type HrRecord = {
  id: number;
  employee_id: number;
  workspace: string;
  record_type: "Leave" | "Training / Certification" | "Company Asset" | "Employment Change" | "HR Note";
  title: string;
  record_date: string;
  end_date: string;
  status: string;
  reference: string;
  details: string;
  created_by: string;
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
  residential_address: string;
  probation_end_date: string;
  contract_end_date: string;
  today_attendance: Attendance | null;
  attendance_stats: { atWork: number; notAtWork: number; late: number; lateMinutes: number };
  warning_count: number;
  active_warning_count: number;
  hr_record_count: number;
};
type ApiData = {
  stores: Store[];
  workspace: string;
  employees: Employee[];
  attendance: Attendance[];
  warnings: Warning[];
  hrRecords: HrRecord[];
  summary: {
    total: number;
    atWork: number;
    notAtWork: number;
    late: number;
    unmarked: number;
    activeWarnings: number;
    currentLeave: number;
    issuedAssets: number;
    expiringTraining: number;
  };
  permissions: {
    canManageEmployees: boolean;
    canRecordAttendance: boolean;
    canIssueWarnings: boolean;
    canManageHrRecords: boolean;
    canSeeFullId?: boolean;
  };
  today: string;
};

type Tab = "Employees" | "Warnings" | "Attendance Exceptions" | "HR Records";

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
  residentialAddress: "",
  probationEndDate: "",
  contractEndDate: "",
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
const initials = (employee: Employee) => `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "ST";
const warningIsActive = (warning: Warning, today: string) => warning.status === "Active" && (!warning.valid_until || warning.valid_until >= today);

const CSS = `
.employeeRecords{display:grid;gap:12px;padding-bottom:32px}.employeeHero{display:flex;justify-content:space-between;gap:18px;padding:18px 20px;border-radius:14px;background:linear-gradient(120deg,#172438,#223955);color:#fff}.employeeHero small,.sectionEyebrow{color:#f2c72d;font-size:7px;font-weight:900;letter-spacing:.13em}.employeeHero h2{margin:5px 0;font-size:20px}.employeeHero p{margin:0;max-width:760px;color:#c9d4e2;font-size:9px;line-height:1.5}.employeeHeroActions{min-width:360px;display:flex;align-items:end;gap:8px}.employeeHeroActions label{flex:1;display:grid;gap:5px;font-size:8px;font-weight:800}.employeeHeroActions select,.employeeForm input,.employeeForm select,.employeeForm textarea,.recordForm input,.recordForm select,.recordForm textarea{width:100%;border:1px solid #d7e0e8;border-radius:8px;background:#fff;color:#21364e;padding:9px 10px;font:inherit;font-size:8px}.employeeHeroActions select{height:39px}.employeeHeroActions button,.primaryBtn,.secondaryBtn{min-height:38px;border-radius:8px;padding:0 13px;font:inherit;font-size:8px;font-weight:850;cursor:pointer}.employeeHeroActions button,.primaryBtn{border:1px solid #dbb21f;background:#f6ca2f;color:#172438}.secondaryBtn{border:1px solid #d3dde6;background:#fff;color:#425870}.employeeKpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.employeeKpis article{border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:11px 12px}.employeeKpis span,.employeeKpis b,.employeeKpis small{display:block}.employeeKpis span{color:#7d8997;font-size:6px;font-weight:900;text-transform:uppercase}.employeeKpis b{margin-top:5px;color:#21384f;font-size:18px}.employeeKpis small{margin-top:4px;color:#929daa;font-size:6px}.employeeKpis .good b{color:#23805b}.employeeKpis .warn b{color:#a96b0c}.employeeKpis .bad b{color:#b53c49}.employeeTabs{display:flex;gap:6px;overflow-x:auto;border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:6px}.employeeTabs button{border:0;border-radius:7px;background:transparent;padding:9px 12px;color:#677789;font:inherit;font-size:8px;font-weight:850;cursor:pointer;white-space:nowrap}.employeeTabs button.active{background:#172438;color:#fff}.employeeToolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:7px 10px}.employeeToolbar label{display:flex;align-items:center;flex:1;max-width:520px;border:1px solid #dde4eb;border-radius:8px;padding:0 9px}.employeeToolbar input{width:100%;border:0;outline:0;padding:9px;font:inherit;font-size:8px}.employeeToolbar small{color:#8693a1;font-size:7px}.panel{overflow:hidden;border:1px solid #dfe6ed;border-radius:12px;background:#fff}.panelHeader{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid #e8edf2;background:#fbfcfd}.panelHeader h3{margin:3px 0 0;color:#22394f;font-size:13px}.panelHeader p{margin:3px 0 0;color:#8290a0;font-size:7px}.tableWrap{overflow-x:auto}.tableHead,.tableRow{min-width:1040px;display:grid;grid-template-columns:1.35fr .9fr .62fr .8fr .55fr 1.75fr;gap:9px;align-items:center;padding:9px 13px}.tableHead{background:#f7f9fb;color:#7f8b99;font-size:6px;font-weight:900;text-transform:uppercase}.tableRow{min-height:62px;border-top:1px solid #edf1f5;color:#50657a;font-size:8px}.identityBtn{border:0;background:transparent;padding:0;display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer}.avatar{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center;background:#e8f0f8;color:#2b5174;font-size:9px;font-weight:900;font-style:normal}.identityBtn b,.identityBtn small,.stack b,.stack small{display:block}.identityBtn b{color:#233b53;font-size:9px}.identityBtn small,.stack small{margin-top:3px;color:#929daa;font-size:6px}.attendancePill,.warningLevel,.statusPill,.recordTypePill{display:inline-block;border-radius:999px;padding:5px 7px;font-style:normal;font-size:6px;font-weight:900}.attendancePill.atWork{background:#e5f6ee;color:#207a55}.attendancePill.late{background:#fff1d4;color:#94600d}.attendancePill.notAtWork{background:#ffe8eb;color:#ab3946}.attendancePill.unmarked{background:#eef2f6;color:#6f7f91}.attendanceButtons{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.attendanceButtons button{min-height:31px;border:1px solid #d9e1e8;border-radius:7px;background:#fff;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.attendanceButtons .atWork{color:#247653;border-color:#bfe3d1}.attendanceButtons .notAtWork{color:#aa3d49;border-color:#efc6cb}.attendanceButtons .late{color:#93600d;border-color:#ead8aa}.warningCount{border:1px solid #e1e7ee;border-radius:8px;background:#fff;padding:5px;cursor:pointer}.warningCount b,.warningCount small{display:block}.warningCount b{color:#ad3946;font-size:12px}.warningCount small{color:#8b97a5;font-size:6px}.employeeEmpty{padding:22px;text-align:center;color:#8895a4;font-size:8px}.registerHead,.registerRow{min-width:930px;display:grid;gap:8px;align-items:center;padding:9px 13px}.registerHead{background:#f7f9fb;color:#7f8b99;font-size:6px;font-weight:900;text-transform:uppercase}.registerRow{border-top:1px solid #edf1f5;color:#50657a;font-size:8px}.warningRegister .registerHead,.warningRegister .registerRow{grid-template-columns:1.1fr .72fr 1.35fr .72fr .72fr .7fr}.attendanceRegister .registerHead,.attendanceRegister .registerRow{grid-template-columns:1.1fr .7fr .65fr 1.2fr .75fr}.hrRegister .registerHead,.hrRegister .registerRow{grid-template-columns:1.05fr .9fr 1.2fr .75fr .75fr .7fr}.warningLevel.verbal{background:#eef2f6;color:#5d6e81}.warningLevel.written{background:#fff1d4;color:#93600d}.warningLevel.final{background:#ffe8eb;color:#ad3543}.statusPill.active{background:#ffe8eb;color:#ad3543}.statusPill.inactive{background:#eef2f6;color:#6e7d8e}.recordTypePill{background:#e9f0f8;color:#31597a}.rowButton{border:0;background:transparent;color:#28557d;font:inherit;font-size:8px;font-weight:850;cursor:pointer;text-align:left}.overlay.employeeOverlay{z-index:55;padding:14px}.employeeModal,.profileModal{width:min(860px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 28px 80px rgba(14,29,48,.28);display:flex;flex-direction:column}.smallModal{width:min(530px,calc(100vw - 28px))}.employeeModal>header,.profileModal>header{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid #e6ebf1;background:#fbfcfd}.employeeModal h2,.profileModal h2{margin:3px 0;color:#21374f;font-size:16px}.employeeModal p,.profileModal p{margin:0;color:#8290a0;font-size:8px}.closeBtn{width:32px;height:32px;border:0;border-radius:8px;background:#edf2f6;color:#607187;font-size:18px;cursor:pointer}.modalBody{overflow-y:auto;padding:14px 16px}.modalFooter{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e6ebf1;padding:10px 14px;background:#fbfcfd}.employeeForm,.recordForm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.employeeForm label,.recordForm label,.fullField{display:grid;gap:5px;color:#3d5268;font-size:7px;font-weight:850}.employeeForm textarea,.recordForm textarea,.fullField textarea{min-height:80px;resize:vertical}.span2{grid-column:span 2}.span3{grid-column:1/-1}.privacyNote{margin:10px 0 0;border:1px solid #dce4ec;border-radius:8px;background:#f7fafc;padding:9px;color:#65768a;font-size:7px;line-height:1.5}.profileHeader{display:flex;align-items:center;gap:10px}.profileHeader .avatar{width:43px;height:43px;flex-basis:43px}.profileBody{overflow-y:auto;padding:14px;display:grid;gap:11px}.profileStats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.profileStats article{border:1px solid #dfe6ed;border-radius:9px;padding:10px}.profileStats span,.profileStats b,.profileStats small{display:block}.profileStats span{font-size:6px;color:#7f8c9a;font-weight:900;text-transform:uppercase}.profileStats b{margin-top:4px;font-size:15px;color:#263e56}.profileStats small{margin-top:3px;font-size:6px;color:#929daa}.profileGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.profileCard{border:1px solid #dfe6ed;border-radius:10px;padding:11px}.profileCard dl{margin:8px 0 0}.profileCard dl div{display:grid;grid-template-columns:125px 1fr;gap:8px;padding:6px 0;border-top:1px solid #eff2f5}.profileCard dt{font-size:7px;color:#8995a4}.profileCard dd{margin:0;font-size:8px;color:#354c64;font-weight:700;word-break:break-word}.historySection{border:1px solid #dfe6ed;border-radius:10px;overflow:hidden}.historySection header{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px 12px;background:#fbfcfd;border-bottom:1px solid #e9eef3}.historySection h3{margin:3px 0 0;font-size:11px;color:#263c54}.historyList{display:grid}.historyItem{padding:9px 11px;border-top:1px solid #edf1f5;font-size:8px;color:#566a7e}.historyItem:first-child{border-top:0}.historyItem b,.historyItem small{display:block}.historyItem small{margin-top:3px;color:#8d99a7;font-size:6px}.warningDetailGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.warningDetailGrid div{border:1px solid #e2e7ed;border-radius:8px;padding:9px}.warningDetailGrid span,.warningDetailGrid b{display:block}.warningDetailGrid span{font-size:6px;color:#8995a4;text-transform:uppercase;font-weight:900}.warningDetailGrid b{margin-top:4px;font-size:8px;color:#31475f}.warningDetailText{margin-top:10px;border:1px solid #e2e7ed;border-radius:8px;padding:10px;color:#53667b;font-size:8px;line-height:1.5;white-space:pre-wrap}.toast{position:fixed;right:18px;top:95px;z-index:70;border:1px solid #cbd8e5;border-radius:9px;background:#fff;padding:10px 12px;box-shadow:0 12px 32px rgba(25,49,76,.18);color:#30475f;font-size:8px;font-weight:800}.filters{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.filters select{height:34px;border:1px solid #d9e1e8;border-radius:7px;background:#fff;padding:0 8px;color:#52667a;font:inherit;font-size:7px}.miniActions{display:flex;gap:6px;flex-wrap:wrap}.miniActions button{border:1px solid #d6dfe8;border-radius:7px;background:#fff;padding:6px 8px;color:#40576f;font:inherit;font-size:6px;font-weight:850;cursor:pointer}
@media(max-width:1200px){.employeeKpis{grid-template-columns:repeat(4,1fr)}.employeeForm,.recordForm{grid-template-columns:1fr 1fr}.span3{grid-column:1/-1}}@media(max-width:760px){.employeeHero{flex-direction:column;padding:15px}.employeeHeroActions{min-width:0;flex-direction:column;align-items:stretch}.employeeKpis{grid-template-columns:1fr 1fr}.employeeToolbar{align-items:stretch;flex-direction:column}.employeeToolbar label{max-width:none}.employeeModal,.profileModal{width:calc(100vw - 12px);max-height:calc(100dvh - 12px)}.overlay.employeeOverlay{padding:6px}.employeeForm,.recordForm,.profileGrid,.warningDetailGrid{grid-template-columns:1fr}.span2,.span3{grid-column:1}.profileStats{grid-template-columns:1fr 1fr}.profileHeader .avatar{display:none}.toast{left:10px;right:10px;top:80px}.employeeHeroActions button{width:100%}}
`;

export default function EmployeeRecords({ currentUser }: { currentUser: CurrentHubUser }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Employees");
  const [search, setSearch] = useState("");
  const [warningFilter, setWarningFilter] = useState("All");
  const [recordFilter, setRecordFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [employeeModal, setEmployeeModal] = useState<"add" | "edit" | null>(null);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee(""));
  const [attendanceModal, setAttendanceModal] = useState<{ employee: Employee; status: "Not at work" | "Late" } | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ absenceType: "Unauthorised absence", minutesLate: "", reason: "" });
  const [warningModal, setWarningModal] = useState<Employee | null>(null);
  const [warningForm, setWarningForm] = useState({
    warningDate: new Date().toISOString().slice(0, 10), warningLevel: "Written", reason: "", details: "", issuedBy: currentUser.name || "", validUntil: "", acknowledgement: "",
  });
  const [hrModal, setHrModal] = useState<Employee | null>(null);
  const [hrForm, setHrForm] = useState({
    recordType: "Leave", title: "", recordDate: new Date().toISOString().slice(0, 10), endDate: "", status: "", reference: "", details: "",
  });

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const applyData = (result: ApiData) => {
    setData(result);
    setWorkspace(result.workspace);
    setSelected((current) => current ? result.employees.find((employee) => employee.id === current.id) || null : null);
  };

  const load = async (target?: string) => {
    setLoading(true);
    try {
      const requested = target ?? workspace;
      const response = await fetch(requested ? `/api/employees?workspace=${encodeURIComponent(requested)}` : "/api/employees", { cache: "no-store" });
      const result = (await response.json()) as ApiData & { error?: string };
      if (!response.ok) return flash(result.error || "Employee records could not be loaded.");
      applyData(result);
    } catch {
      flash("Employee records could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/employees", { cache: "no-store" })
      .then(async (response) => ({ response, result: (await response.json()) as ApiData & { error?: string } }))
      .then(({ response, result }) => {
        if (cancelled) return;
        if (!response.ok) {
          setMessage(result.error || "Employee records could not be loaded.");
          return;
        }
        setData(result);
        setWorkspace(result.workspace);
      })
      .catch(() => { if (!cancelled) setMessage("Employee records could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const employeeById = (id: number) => data?.employees.find((employee) => employee.id === id);
  const attendanceFor = (id: number) => (data?.attendance || []).filter((row) => Number(row.employee_id) === id);
  const warningsFor = (id: number) => (data?.warnings || []).filter((row) => Number(row.employee_id) === id);
  const hrFor = (id: number) => (data?.hrRecords || []).filter((row) => Number(row.employee_id) === id);

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!data || !needle) return data?.employees || [];
    return data.employees.filter((employee) => [employeeName(employee), employee.employee_number, employee.job_title, employee.department, employee.phone, employee.email].join(" ").toLowerCase().includes(needle));
  }, [data, search]);

  const filteredWarnings = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.warnings.filter((warning) => {
      const employee = data.employees.find((item) => item.id === Number(warning.employee_id));
      const status = warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired";
      const matchStatus = warningFilter === "All" || warningFilter === status || warningFilter === warning.warning_level;
      const matchSearch = !needle || [employee ? employeeName(employee) : "", warning.reason, warning.warning_level, warning.issued_by].join(" ").toLowerCase().includes(needle);
      return matchStatus && matchSearch;
    });
  }, [data, search, warningFilter]);

  const attendanceExceptions = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.attendance.filter((record) => {
      if (record.status === "At work") return false;
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      return !needle || [employee ? employeeName(employee) : "", record.status, record.absence_type, record.reason].join(" ").toLowerCase().includes(needle);
    });
  }, [data, search]);

  const filteredHrRecords = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.hrRecords.filter((record) => {
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      const matchType = recordFilter === "All" || record.record_type === recordFilter;
      const matchSearch = !needle || [employee ? employeeName(employee) : "", record.record_type, record.title, record.status, record.reference].join(" ").toLowerCase().includes(needle);
      return matchType && matchSearch;
    });
  }, [data, search, recordFilter]);

  const post = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/employees", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { error?: string }).error || "Record could not be saved.");
    return result;
  };

  const patch = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/employees", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { error?: string }).error || "Record could not be updated.");
    return result;
  };

  const markAtWork = async (employee: Employee) => {
    if (!data?.permissions.canRecordAttendance || saving) return;
    setSaving(true);
    try {
      await post({ action: "attendance", employeeId: employee.id, attendanceDate: data.today, status: "At work" });
      flash(`${employeeName(employee)} marked at work.`);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Attendance could not be saved."); }
    finally { setSaving(false); }
  };

  const saveAttendance = async () => {
    if (!attendanceModal || !data || saving) return;
    setSaving(true);
    try {
      await post({
        action: "attendance", employeeId: attendanceModal.employee.id, attendanceDate: data.today, status: attendanceModal.status,
        absenceType: attendanceModal.status === "Not at work" ? attendanceForm.absenceType : "",
        minutesLate: attendanceModal.status === "Late" ? Number(attendanceForm.minutesLate) : 0,
        reason: attendanceForm.reason,
      });
      flash(attendanceModal.status === "Late" ? `${employeeName(attendanceModal.employee)} marked ${attendanceForm.minutesLate} minutes late.` : `${employeeName(attendanceModal.employee)} marked not at work.`);
      setAttendanceModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Attendance could not be saved."); }
    finally { setSaving(false); }
  };

  const openAddEmployee = () => { setEmployeeForm(blankEmployee(workspace)); setEmployeeModal("add"); };
  const openEditEmployee = (employee: Employee) => {
    setSelected(employee);
    setEmployeeForm({
      employeeNumber: employee.employee_number, workspace: employee.workspace, firstName: employee.first_name, lastName: employee.last_name,
      idNumber: employee.id_number.includes("•") ? "" : employee.id_number, phone: employee.phone, email: employee.email, jobTitle: employee.job_title,
      department: employee.department, startDate: employee.start_date, employmentType: employee.employment_type, supervisor: employee.supervisor,
      employmentStatus: employee.employment_status, emergencyContactName: employee.emergency_contact_name, emergencyContactPhone: employee.emergency_contact_phone,
      residentialAddress: employee.residential_address || "", probationEndDate: employee.probation_end_date || "", contractEndDate: employee.contract_end_date || "", notes: employee.notes,
    });
    setEmployeeModal("edit");
  };

  const saveEmployee = async () => {
    if (!employeeModal || saving) return;
    setSaving(true);
    try {
      const editing = employeeModal === "edit" && selected;
      const response = await fetch("/api/employees", {
        method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "employee", ...(editing ? { id: selected.id } : {}), ...employeeForm }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((result as { error?: string }).error || "Employee file could not be saved.");
      flash(editing ? "Employee file updated." : "Employee added.");
      setEmployeeModal(null);
      await load(employeeForm.workspace || workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Employee file could not be saved."); }
    finally { setSaving(false); }
  };

  const openWarning = (employee: Employee) => {
    setWarningForm({ warningDate: data?.today || new Date().toISOString().slice(0, 10), warningLevel: "Written", reason: "", details: "", issuedBy: currentUser.name || "", validUntil: "", acknowledgement: "" });
    setWarningModal(employee);
  };
  const saveWarning = async () => {
    if (!warningModal || saving) return;
    setSaving(true);
    try {
      await post({ action: "warning", employeeId: warningModal.id, ...warningForm });
      flash(`Warning recorded for ${employeeName(warningModal)}.`);
      setWarningModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Warning could not be saved."); }
    finally { setSaving(false); }
  };
  const withdrawWarning = async (warning: Warning) => {
    if (!data?.permissions.canIssueWarnings || saving) return;
    setSaving(true);
    try { await patch({ action: "warning", id: warning.id, status: "Withdrawn" }); flash("Warning withdrawn."); setSelectedWarning(null); await load(workspace); }
    catch (error) { flash(error instanceof Error ? error.message : "Warning could not be updated."); }
    finally { setSaving(false); }
  };

  const openHrRecord = (employee: Employee, type = "Leave") => {
    setHrForm({ recordType: type, title: "", recordDate: data?.today || new Date().toISOString().slice(0, 10), endDate: "", status: "", reference: "", details: "" });
    setHrModal(employee);
  };
  const saveHrRecord = async () => {
    if (!hrModal || saving) return;
    setSaving(true);
    try {
      await post({ action: "hrRecord", employeeId: hrModal.id, ...hrForm });
      flash(`${hrForm.recordType} record added for ${employeeName(hrModal)}.`);
      setHrModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "HR record could not be saved."); }
    finally { setSaving(false); }
  };

  if (loading && !data) return <div className="employeeEmpty">Loading employee records…</div>;
  if (!data) return <div className="employeeEmpty">Employee records are unavailable.</div>;

  return (
    <section className="employeeRecords">
      <style>{CSS}</style>
      {message && <div className="toast">{message}</div>}

      <div className="employeeHero">
        <div>
          <small>POWERBUILD PEOPLE CONTROL</small>
          <h2>Employee Records, Attendance & HR History</h2>
          <p>Maintain employee files, daily attendance, lateness minutes, disciplinary warnings, leave, training/certifications, company assets and employment-change records.</p>
        </div>
        <div className="employeeHeroActions">
          <label>Location<select value={workspace} onChange={(e) => { setSearch(""); setSelected(null); void load(e.target.value); }}>{data.stores.map((store) => <option key={store.id} value={store.name}>{store.name}</option>)}</select></label>
          {data.permissions.canManageEmployees && <button onClick={openAddEmployee}>＋ Add employee</button>}
        </div>
      </div>

      <div className="employeeKpis">
        <article><span>Total employees</span><b>{data.summary.total}</b><small>{workspace}</small></article>
        <article className="good"><span>At work today</span><b>{data.summary.atWork}</b><small>Present</small></article>
        <article className="warn"><span>Late today</span><b>{data.summary.late}</b><small>Minutes retained</small></article>
        <article className="bad"><span>Not at work</span><b>{data.summary.notAtWork}</b><small>Reason retained</small></article>
        <article className="bad"><span>Active warnings</span><b>{data.summary.activeWarnings}</b><small>Disciplinary register</small></article>
        <article><span>On leave</span><b>{data.summary.currentLeave}</b><small>Current leave records</small></article>
        <article><span>Assets issued</span><b>{data.summary.issuedAssets}</b><small>Company assets out</small></article>
      </div>

      <div className="employeeTabs">
        {(["Employees", "Warnings", "Attendance Exceptions", "HR Records"] as Tab[]).map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setSearch(""); }}>{tab}</button>)}
      </div>

      <div className="employeeToolbar">
        <label>⌕<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={activeTab === "Employees" ? "Search employee, number, job title or department…" : `Search ${activeTab.toLowerCase()}…`} /></label>
        {activeTab === "Warnings" && <div className="filters"><select value={warningFilter} onChange={(e) => setWarningFilter(e.target.value)}><option>All</option><option>Active</option><option>Expired</option><option>Withdrawn</option><option>Verbal</option><option>Written</option><option>Final written</option></select></div>}
        {activeTab === "HR Records" && <div className="filters"><select value={recordFilter} onChange={(e) => setRecordFilter(e.target.value)}><option>All</option><option>Leave</option><option>Training / Certification</option><option>Company Asset</option><option>Employment Change</option><option>HR Note</option></select></div>}
      </div>

      {activeTab === "Employees" && (
        <div className="panel">
          <div className="panelHeader"><div><small className="sectionEyebrow">DAILY STAFF CONTROL</small><h3>Employees</h3><p>At work, not at work and late can be recorded directly against each employee.</p></div></div>
          <div className="tableWrap">
            <div className="tableHead"><span>Employee</span><span>Role</span><span>Start date</span><span>Today</span><span>Warnings</span><span>Attendance action</span></div>
            {filteredEmployees.map((employee) => {
              const attendance = employee.today_attendance;
              return <div className="tableRow" key={employee.id}>
                <button className="identityBtn" onClick={() => setSelected(employee)}><i className="avatar">{initials(employee)}</i><span><b>{employeeName(employee)}</b><small>{employee.employee_number} · {employee.department || "No department"}</small></span></button>
                <span className="stack"><b>{employee.job_title || "Not set"}</b><small>{employee.employment_type}</small></span>
                <span>{formatDate(employee.start_date)}</span>
                <span><em className={`attendancePill ${attendance?.status === "At work" ? "atWork" : attendance?.status === "Late" ? "late" : attendance?.status === "Not at work" ? "notAtWork" : "unmarked"}`}>{attendance?.status || "Not marked"}{attendance?.status === "Late" ? ` · ${attendance.minutes_late} min` : ""}</em></span>
                <button className="warningCount" onClick={() => { setSelected(employee); setActiveTab("Warnings"); }}><b>{employee.warning_count}</b><small>{employee.active_warning_count} active</small></button>
                <div className="attendanceButtons">
                  <button className="atWork" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => void markAtWork(employee)}>✓ At work</button>
                  <button className="notAtWork" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => { setAttendanceForm({ absenceType: "Unauthorised absence", minutesLate: "", reason: employee.today_attendance?.reason || "" }); setAttendanceModal({ employee, status: "Not at work" }); }}>× Not at work</button>
                  <button className="late" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => { setAttendanceForm({ absenceType: "", minutesLate: String(employee.today_attendance?.minutes_late || ""), reason: employee.today_attendance?.reason || "" }); setAttendanceModal({ employee, status: "Late" }); }}>⏱ Late</button>
                </div>
              </div>;
            })}
            {!filteredEmployees.length && <div className="employeeEmpty">No employees found for this location/search.</div>}
          </div>
        </div>
      )}

      {activeTab === "Warnings" && (
        <div className="panel warningRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">DISCIPLINARY REGISTER</small><h3>Warnings</h3><p>View every verbal, written and final written warning for this location.</p></div></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Level</span><span>Reason</span><span>Date</span><span>Status</span><span>Action</span></div>
            {filteredWarnings.map((warning) => {
              const employee = employeeById(Number(warning.employee_id));
              const status = warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired";
              return <div className="registerRow" key={warning.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${warning.employee_id}`}</button>
                <span><em className={`warningLevel ${warning.warning_level === "Final written" ? "final" : warning.warning_level === "Written" ? "written" : "verbal"}`}>{warning.warning_level}</em></span>
                <span className="stack"><b>{warning.reason}</b><small>{warning.issued_by}</small></span>
                <span>{formatDate(warning.warning_date)}</span>
                <span><em className={`statusPill ${status === "Active" ? "active" : "inactive"}`}>{status}</em></span>
                <button className="rowButton" onClick={() => setSelectedWarning(warning)}>View warning</button>
              </div>;
            })}
            {!filteredWarnings.length && <div className="employeeEmpty">No warnings match this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "Attendance Exceptions" && (
        <div className="panel attendanceRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">ATTENDANCE HISTORY</small><h3>Lateness & Absence Exceptions</h3><p>Objective history of late and not-at-work records from the last 180 days.</p></div></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Date</span><span>Status</span><span>Reason / Detail</span><span>Recorded by</span></div>
            {attendanceExceptions.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span>{formatDate(record.attendance_date)}</span>
                <span><em className={`attendancePill ${record.status === "Late" ? "late" : "notAtWork"}`}>{record.status}{record.status === "Late" ? ` · ${record.minutes_late} min` : ""}</em></span>
                <span className="stack"><b>{record.absence_type || (record.status === "Late" ? `${record.minutes_late} minutes late` : "—")}</b><small>{record.reason || "No reason entered"}</small></span>
                <span>{record.recorded_by || "—"}</span>
              </div>;
            })}
            {!attendanceExceptions.length && <div className="employeeEmpty">No attendance exceptions match this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "HR Records" && (
        <div className="panel hrRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">EMPLOYEE FILE HISTORY</small><h3>HR Records</h3><p>Leave, training/certification, company assets, employment changes and HR notes.</p></div></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Type</span><span>Record</span><span>Date</span><span>Status</span><span>Reference</span></div>
            {filteredHrRecords.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span><em className="recordTypePill">{record.record_type}</em></span>
                <span className="stack"><b>{record.title}</b><small>{record.details || "No additional detail"}</small></span>
                <span>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""}</span>
                <span>{record.status || "—"}</span>
                <span>{record.reference || "—"}</span>
              </div>;
            })}
            {!filteredHrRecords.length && <div className="employeeEmpty">No HR records match this view.</div>}
          </div>
        </div>
      )}

      {selected && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelected(null)}>
          <section className="profileModal" onMouseDown={(e) => e.stopPropagation()}>
            <header><div className="profileHeader"><i className="avatar">{initials(selected)}</i><div><small className="sectionEyebrow">EMPLOYEE FILE · {selected.employee_number}</small><h2>{employeeName(selected)}</h2><p>{selected.job_title || "Job title not set"} · {selected.workspace}</p></div></div><div className="miniActions">{data.permissions.canManageEmployees && <button className="secondaryBtn" onClick={() => openEditEmployee(selected)}>Edit file</button>}{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>Issue warning</button>}{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected)}>Add HR record</button>}<button className="closeBtn" onClick={() => setSelected(null)}>×</button></div></header>
            <div className="profileBody">
              <div className="profileStats"><article><span>At work</span><b>{selected.attendance_stats.atWork}</b><small>last 180 days</small></article><article><span>Late</span><b>{selected.attendance_stats.late}</b><small>{selected.attendance_stats.lateMinutes} minutes</small></article><article><span>Not at work</span><b>{selected.attendance_stats.notAtWork}</b><small>last 180 days</small></article><article><span>Warnings</span><b>{selected.warning_count}</b><small>{selected.active_warning_count} active</small></article><article><span>HR records</span><b>{selected.hr_record_count}</b><small>leave, training, assets</small></article></div>
              <div className="profileGrid">
                <section className="profileCard"><small className="sectionEyebrow">EMPLOYMENT</small><dl><div><dt>Employee no.</dt><dd>{selected.employee_number}</dd></div><div><dt>Job title</dt><dd>{selected.job_title || "—"}</dd></div><div><dt>Department</dt><dd>{selected.department || "—"}</dd></div><div><dt>Start date</dt><dd>{formatDate(selected.start_date)}</dd></div><div><dt>Probation ends</dt><dd>{formatDate(selected.probation_end_date)}</dd></div><div><dt>Contract ends</dt><dd>{formatDate(selected.contract_end_date)}</dd></div><div><dt>Supervisor</dt><dd>{selected.supervisor || "—"}</dd></div><div><dt>Status</dt><dd>{selected.employment_status}</dd></div></dl></section>
                <section className="profileCard"><small className="sectionEyebrow">CONTACT & IDENTIFICATION</small><dl><div><dt>ID / Passport</dt><dd>{selected.id_number || "—"}</dd></div><div><dt>Phone</dt><dd>{selected.phone || "—"}</dd></div><div><dt>Email</dt><dd>{selected.email || "—"}</dd></div><div><dt>Address</dt><dd>{selected.residential_address || "—"}</dd></div><div><dt>Emergency contact</dt><dd>{selected.emergency_contact_name || "—"}</dd></div><div><dt>Emergency phone</dt><dd>{selected.emergency_contact_phone || "—"}</dd></div></dl></section>
              </div>
              <section className="historySection"><header><div><small className="sectionEyebrow">DISCIPLINARY HISTORY</small><h3>Warnings ({selected.warning_count})</h3></div>{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>＋ Issue warning</button>}</header><div className="historyList">{warningsFor(selected.id).map((warning) => <button key={warning.id} className="historyItem rowButton" onClick={() => setSelectedWarning(warning)}><b>{warning.warning_level} · {warning.reason}</b><small>{formatDate(warning.warning_date)} · {warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired"} · Issued by {warning.issued_by}</small></button>)}{!warningsFor(selected.id).length && <div className="employeeEmpty">No warnings recorded.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">ATTENDANCE HISTORY</small><h3>Recent records</h3></div></header><div className="historyList">{attendanceFor(selected.id).slice(0,30).map((record) => <div className="historyItem" key={record.id}><b>{formatDate(record.attendance_date)} · {record.status}{record.status === "Late" ? ` (${record.minutes_late} min)` : ""}</b><small>{record.absence_type || record.reason || record.recorded_by || "No additional detail"}</small></div>)}{!attendanceFor(selected.id).length && <div className="employeeEmpty">No attendance history yet.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">HR FILE HISTORY</small><h3>Leave, Training, Assets & Employment Changes</h3></div>{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected)}>＋ Add record</button>}</header><div className="historyList">{hrFor(selected.id).map((record) => <div className="historyItem" key={record.id}><b>{record.record_type} · {record.title}</b><small>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""} · {record.status || "No status"}{record.reference ? ` · ${record.reference}` : ""}</small>{record.details && <small>{record.details}</small>}</div>)}{!hrFor(selected.id).length && <div className="employeeEmpty">No HR history records yet.</div>}</div></section>
              {selected.notes && <section className="profileCard"><small className="sectionEyebrow">EMPLOYEE FILE NOTES</small><p style={{fontSize:"8px",color:"#52667a",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{selected.notes}</p></section>}
            </div>
          </section>
        </div>
      )}

      {selectedWarning && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelectedWarning(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">WARNING RECORD</small><h2>{selectedWarning.warning_level}</h2><p>{employeeById(Number(selectedWarning.employee_id)) ? employeeName(employeeById(Number(selectedWarning.employee_id)) as Employee) : `Employee #${selectedWarning.employee_id}`}</p></div><button className="closeBtn" onClick={() => setSelectedWarning(null)}>×</button></header><div className="modalBody"><div className="warningDetailGrid"><div><span>Date</span><b>{formatDate(selectedWarning.warning_date)}</b></div><div><span>Status</span><b>{warningIsActive(selectedWarning,data.today) ? "Active" : selectedWarning.status === "Withdrawn" ? "Withdrawn" : "Expired"}</b></div><div><span>Reason</span><b>{selectedWarning.reason}</b></div><div><span>Issued by</span><b>{selectedWarning.issued_by || "—"}</b></div><div><span>Valid until</span><b>{formatDate(selectedWarning.valid_until)}</b></div><div><span>Acknowledgement</span><b>{selectedWarning.acknowledgement || "—"}</b></div></div><div className="warningDetailText">{selectedWarning.details || "No additional warning details were recorded."}</div><p className="privacyNote">This is a factual HR record. The Hub does not make disciplinary or termination decisions.</p></div><footer className="modalFooter">{warningIsActive(selectedWarning,data.today) && data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => void withdrawWarning(selectedWarning)}>Withdraw warning</button>}<button className="primaryBtn" onClick={() => setSelectedWarning(null)}>Close</button></footer></section></div>
      )}

      {attendanceModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setAttendanceModal(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">ATTENDANCE · {data.today}</small><h2>{attendanceModal.status}</h2><p>{employeeName(attendanceModal.employee)}</p></div><button className="closeBtn" onClick={() => setAttendanceModal(null)}>×</button></header><div className="modalBody recordForm">{attendanceModal.status === "Late" ? <label className="span2">Minutes late *<input type="number" min="1" value={attendanceForm.minutesLate} onChange={(e) => setAttendanceForm({...attendanceForm,minutesLate:e.target.value})} /></label> : <label className="span2">Absence type<select value={attendanceForm.absenceType} onChange={(e) => setAttendanceForm({...attendanceForm,absenceType:e.target.value})}><option>Unauthorised absence</option><option>Sick</option><option>Annual leave</option><option>Family responsibility</option><option>Off day</option><option>Training</option><option>Other</option></select></label>}<label className="span2">Reason / note<textarea value={attendanceForm.reason} onChange={(e) => setAttendanceForm({...attendanceForm,reason:e.target.value})} /></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={() => setAttendanceModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={() => void saveAttendance()}>{saving ? "Saving…" : "Save"}</button></footer></section></div>
      )}

      {warningModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setWarningModal(null)}><section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">DISCIPLINARY RECORD</small><h2>Issue warning</h2><p>{employeeName(warningModal)} · {warningModal.employee_number}</p></div><button className="closeBtn" onClick={() => setWarningModal(null)}>×</button></header><div className="modalBody recordForm"><label>Warning date<input type="date" value={warningForm.warningDate} onChange={(e)=>setWarningForm({...warningForm,warningDate:e.target.value})}/></label><label>Warning level<select value={warningForm.warningLevel} onChange={(e)=>setWarningForm({...warningForm,warningLevel:e.target.value})}><option>Verbal</option><option>Written</option><option>Final written</option></select></label><label>Valid until<input type="date" value={warningForm.validUntil} onChange={(e)=>setWarningForm({...warningForm,validUntil:e.target.value})}/></label><label className="span2">Reason *<input value={warningForm.reason} onChange={(e)=>setWarningForm({...warningForm,reason:e.target.value})} placeholder="e.g. Repeated lateness"/></label><label>Issued by<input value={warningForm.issuedBy} onChange={(e)=>setWarningForm({...warningForm,issuedBy:e.target.value})}/></label><label className="span3">Full details<textarea value={warningForm.details} onChange={(e)=>setWarningForm({...warningForm,details:e.target.value})}/></label><label className="span3">Employee acknowledgement<textarea value={warningForm.acknowledgement} onChange={(e)=>setWarningForm({...warningForm,acknowledgement:e.target.value})}/></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setWarningModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveWarning()}>{saving?"Saving…":"Record warning"}</button></footer></section></div>
      )}

      {hrModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setHrModal(null)}><section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">EMPLOYEE HR RECORD</small><h2>Add file record</h2><p>{employeeName(hrModal)} · {hrModal.employee_number}</p></div><button className="closeBtn" onClick={()=>setHrModal(null)}>×</button></header><div className="modalBody recordForm"><label>Record type<select value={hrForm.recordType} onChange={(e)=>setHrForm({...hrForm,recordType:e.target.value})}><option>Leave</option><option>Training / Certification</option><option>Company Asset</option><option>Employment Change</option><option>HR Note</option></select></label><label>Start / record date<input type="date" value={hrForm.recordDate} onChange={(e)=>setHrForm({...hrForm,recordDate:e.target.value})}/></label><label>End / expiry / return date<input type="date" value={hrForm.endDate} onChange={(e)=>setHrForm({...hrForm,endDate:e.target.value})}/></label><label className="span2">Title *<input value={hrForm.title} onChange={(e)=>setHrForm({...hrForm,title:e.target.value})} placeholder="e.g. Annual leave / Forklift certificate / Laptop issued"/></label><label>Status<input value={hrForm.status} onChange={(e)=>setHrForm({...hrForm,status:e.target.value})} placeholder="Approved, Issued, Completed…"/></label><label>Reference / certificate / asset no.<input value={hrForm.reference} onChange={(e)=>setHrForm({...hrForm,reference:e.target.value})}/></label><label className="span2">Details<textarea value={hrForm.details} onChange={(e)=>setHrForm({...hrForm,details:e.target.value})}/></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setHrModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveHrRecord()}>{saving?"Saving…":"Add HR record"}</button></footer></section></div>
      )}

      {employeeModal && (
        <div className="overlay employeeOverlay" onMouseDown={()=>setEmployeeModal(null)}><section className="employeeModal" onMouseDown={(e)=>e.stopPropagation()}><header><div><small className="sectionEyebrow">EMPLOYEE MASTER FILE</small><h2>{employeeModal==="add"?"Add employee":"Edit employee file"}</h2><p>Employment, contact, contract and emergency information.</p></div><button className="closeBtn" onClick={()=>setEmployeeModal(null)}>×</button></header><div className="modalBody employeeForm">
          <label>Employee number *<input value={employeeForm.employeeNumber} onChange={(e)=>setEmployeeForm({...employeeForm,employeeNumber:e.target.value})}/></label><label>Location *<select value={employeeForm.workspace} onChange={(e)=>setEmployeeForm({...employeeForm,workspace:e.target.value})}>{data.stores.map((store)=><option key={store.id} value={store.name}>{store.name}</option>)}</select></label><label>Employment status<select value={employeeForm.employmentStatus} onChange={(e)=>setEmployeeForm({...employeeForm,employmentStatus:e.target.value})}><option>Active</option><option>On leave</option><option>Suspended</option><option>Resigned</option><option>Terminated</option></select></label>
          <label>First name *<input value={employeeForm.firstName} onChange={(e)=>setEmployeeForm({...employeeForm,firstName:e.target.value})}/></label><label>Surname *<input value={employeeForm.lastName} onChange={(e)=>setEmployeeForm({...employeeForm,lastName:e.target.value})}/></label><label>ID / Passport<input value={employeeForm.idNumber} onChange={(e)=>setEmployeeForm({...employeeForm,idNumber:e.target.value})}/></label>
          <label>Phone<input value={employeeForm.phone} onChange={(e)=>setEmployeeForm({...employeeForm,phone:e.target.value})}/></label><label>Email<input value={employeeForm.email} onChange={(e)=>setEmployeeForm({...employeeForm,email:e.target.value})}/></label><label>Residential address<input value={employeeForm.residentialAddress} onChange={(e)=>setEmployeeForm({...employeeForm,residentialAddress:e.target.value})}/></label>
          <label>Job title<input value={employeeForm.jobTitle} onChange={(e)=>setEmployeeForm({...employeeForm,jobTitle:e.target.value})}/></label><label>Department<input value={employeeForm.department} onChange={(e)=>setEmployeeForm({...employeeForm,department:e.target.value})}/></label><label>Supervisor / manager<input value={employeeForm.supervisor} onChange={(e)=>setEmployeeForm({...employeeForm,supervisor:e.target.value})}/></label>
          <label>Start date<input type="date" value={employeeForm.startDate} onChange={(e)=>setEmployeeForm({...employeeForm,startDate:e.target.value})}/></label><label>Probation end date<input type="date" value={employeeForm.probationEndDate} onChange={(e)=>setEmployeeForm({...employeeForm,probationEndDate:e.target.value})}/></label><label>Contract end date<input type="date" value={employeeForm.contractEndDate} onChange={(e)=>setEmployeeForm({...employeeForm,contractEndDate:e.target.value})}/></label>
          <label>Employment type<select value={employeeForm.employmentType} onChange={(e)=>setEmployeeForm({...employeeForm,employmentType:e.target.value})}><option>Permanent</option><option>Fixed-term</option><option>Temporary</option><option>Casual</option><option>Contractor</option></select></label><label>Emergency contact<input value={employeeForm.emergencyContactName} onChange={(e)=>setEmployeeForm({...employeeForm,emergencyContactName:e.target.value})}/></label><label>Emergency phone<input value={employeeForm.emergencyContactPhone} onChange={(e)=>setEmployeeForm({...employeeForm,emergencyContactPhone:e.target.value})}/></label>
          <label className="span3">Employee file notes<textarea value={employeeForm.notes} onChange={(e)=>setEmployeeForm({...employeeForm,notes:e.target.value})}/></label><p className="privacyNote span3">ID numbers, warnings and HR records are sensitive employee information. Keep access limited to authorised managers and HR.</p>
        </div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setEmployeeModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveEmployee()}>{saving?"Saving…":employeeModal==="add"?"Add employee":"Save employee file"}</button></footer></section></div>
      )}
    </section>
  );
}
