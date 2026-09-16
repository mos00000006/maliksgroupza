"use client";
import { useEffect, useMemo, useState } from "react";

type EmployeeRecord = {
  id: number;
  workspace: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  start_date: string;
  employment_status: string;
  attendance_status: string;
  attendance_note: string;
  updated_at: string;
};

const empty = (workspace: string): Omit<EmployeeRecord, "id" | "updated_at"> => ({
  workspace,
  employee_number: "",
  first_name: "",
  last_name: "",
  position: "",
  department: "",
  phone: "",
  email: "",
  start_date: "",
  employment_status: "Active",
  attendance_status: "At work",
  attendance_note: "",
});

export default function EmployeeRecords({
  assignedStore,
  fullCompany = false,
}: {
  assignedStore: string;
  fullCompany?: boolean;
}) {
  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EmployeeRecord | null>(null);
  const [draft, setDraft] = useState(empty(assignedStore));
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch("/api/employee-records");
    const result = await response.json();
    if (response.ok) {
      setRecords(result.records || []);
      setCanEdit(Boolean(result.can_edit));
    } else setError(result.error || "Employee records could not be loaded.");
    setLoading(false);
  };
  useEffect(() => {
    const starter = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(starter);
  }, []);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => !term || [
      record.employee_number, record.first_name, record.last_name, record.position,
      record.department, record.workspace, record.attendance_status,
    ].join(" ").toLowerCase().includes(term));
  }, [records, search]);

  const startAdd = () => {
    setEditing(null);
    setDraft(empty(assignedStore));
    setError("");
    setOpen(true);
  };
  const startEdit = (record: EmployeeRecord) => {
    setEditing(record);
    setDraft({ ...record });
    setError("");
    setOpen(true);
  };
  const save = async () => {
    const response = await fetch("/api/employee-records", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editing ? { ...draft, id: editing.id } : draft),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "The employee record could not be saved.");
      return;
    }
    setOpen(false);
    await load();
  };

  const count = (status: string) => records.filter((record) => record.attendance_status === status).length;
  return (
    <section className="employeeRecords">
      <div className="employeeKpis">
        <span><small>Employees</small><b>{records.length}</b></span>
        <span className="attendance atWork"><small>At work</small><b>{count("At work")}</b></span>
        <span className="attendance late"><small>Late</small><b>{count("Late")}</b></span>
        <span className="attendance absent"><small>Not at work</small><b>{count("Not at work")}</b></span>
      </div>
      <div className="employeeToolbar">
        <div>
          <h2>Employee records</h2>
          <p>{fullCompany ? "Company employee register" : `${assignedStore} only`} · confidential HR access</p>
        </div>
        <label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees…" /></label>
        {canEdit && <button className="primary" onClick={startAdd}>＋ Add employee</button>}
      </div>
      {error && <p className="employeeError">{error}</p>}
      <div className="employeeTable">
        <table>
          <thead><tr><th>Employee</th><th>Store</th><th>Position</th><th>Contact</th><th>Employment</th><th>Attendance today</th><th>Last update</th></tr></thead>
          <tbody>
            {shown.map((record) => (
              <tr key={record.id} onClick={() => canEdit && startEdit(record)} className={canEdit ? "editable" : ""}>
                <td><b>{record.first_name} {record.last_name}</b><small>{record.employee_number || "No employee number"}</small></td>
                <td>{record.workspace}<small>{record.department}</small></td>
                <td>{record.position || "—"}</td>
                <td>{record.phone || "—"}<small>{record.email}</small></td>
                <td><b>{record.employment_status}</b><small>{record.start_date ? `Started ${record.start_date}` : ""}</small></td>
                <td><em className={`attendanceBadge ${record.attendance_status.replaceAll(" ", "").toLowerCase()}`}>{record.attendance_status}</em><small>{record.attendance_note}</small></td>
                <td>{record.updated_at ? new Date(record.updated_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !shown.length && <p className="employeeBlank">No employee records found for this store.</p>}
        {loading && <p className="employeeBlank">Loading employee records…</p>}
      </div>
      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <div className="employeeModal" onMouseDown={(event) => event.stopPropagation()}>
            <header><span><h2>{editing ? "Edit employee record" : "Add employee"}</h2><p>HR may maintain records for the assigned store only.</p></span><button onClick={() => setOpen(false)}>×</button></header>
            <div className="employeeForm">
              <label>Store<input value={draft.workspace} readOnly={!fullCompany} onChange={(e) => setDraft({ ...draft, workspace: e.target.value })} /></label>
              <label>Employee number<input value={draft.employee_number} onChange={(e) => setDraft({ ...draft, employee_number: e.target.value })} /></label>
              <label>First name<input value={draft.first_name} onChange={(e) => setDraft({ ...draft, first_name: e.target.value })} /></label>
              <label>Surname<input value={draft.last_name} onChange={(e) => setDraft({ ...draft, last_name: e.target.value })} /></label>
              <label>Position<input value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} /></label>
              <label>Department<input value={draft.department} onChange={(e) => setDraft({ ...draft, department: e.target.value })} /></label>
              <label>Phone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
              <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
              <label>Start date<input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></label>
              <label>Employment status<select value={draft.employment_status} onChange={(e) => setDraft({ ...draft, employment_status: e.target.value })}><option>Active</option><option>On leave</option><option>Suspended</option><option>Terminated</option></select></label>
              <label>Attendance today<select value={draft.attendance_status} onChange={(e) => setDraft({ ...draft, attendance_status: e.target.value })}><option>At work</option><option>Late</option><option>Not at work</option></select></label>
              <label className="wide">Attendance note<textarea value={draft.attendance_note} onChange={(e) => setDraft({ ...draft, attendance_note: e.target.value })} placeholder="Reason, arrival time or supporting note" /></label>
            </div>
            {error && <p className="employeeError">{error}</p>}
            <footer><button onClick={() => setOpen(false)}>Cancel</button><button className="primary" onClick={() => void save()}>Save employee record</button></footer>
          </div>
        </div>
      )}
    </section>
  );
}
