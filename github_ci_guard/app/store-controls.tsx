"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "audits" | "checklists" | "ranking";
type Store = { id: number; name: string; type: string; region: string; manager: string };
type AuditSection = { name: string; score: number; comment: string };
type Audit = {
  id: number;
  workspace: string;
  audit_date: string;
  audit_type: string;
  auditor: string;
  score: number;
  findings: string;
  corrective_action: string;
  responsible_person: string;
  corrective_due: string;
  corrective_status: string;
  manager_signoff: string;
  created_at: string;
  sections: AuditSection[];
};
type ChecklistItem = { name: string; status: "" | "Done" | "Issue" | "N/A"; comment: string };
type Checklist = {
  id: number;
  workspace: string;
  checklist_date: string;
  manager: string;
  compliance_percent: number;
  issues_count: number;
  notes: string;
  manager_signoff: string;
  items: ChecklistItem[];
};
type Attachment = {
  id: number;
  record_type: "audit" | "checklist";
  record_id: number;
  workspace: string;
  name: string;
  type: string;
  size: number;
  uploaded_by: string;
  created_at: string;
};
type Ranking = {
  workspace: string;
  region: string;
  manager: string;
  score: number;
  status: string;
  dataCoverage: number;
  auditScore: number;
  latestAuditDate: string;
  checklistScore: number;
  checklistEntries: number;
  todayChecklist: number | null;
  taskScore: number;
  taskCount: number;
  openCorrectives: number;
  overdueCorrectives: number;
};
type Data = {
  stores: Store[];
  audits: Audit[];
  checklists: Checklist[];
  attachments: Attachment[];
  ranking: Ranking[];
  canWrite: boolean;
  today: string;
  summary: { stores: number; auditedStores: number; todayChecklists: number; overdueCorrectives: number; averageScore: number };
};
type User = { name: string; email: string; role?: string };

const AUDIT_AREAS = [
  "Exterior, entrance & customer first impression",
  "Sales floor standards & merchandising",
  "Pricing, POS material & promotional execution",
  "Receiving controls & GRV discipline",
  "Dispatch controls & customer collections",
  "Yard, bulk stock & material storage",
  "Stock control, counts & housekeeping",
  "Cashiers, tills & cash-office controls",
  "Safety, security & loss prevention",
  "Staff attendance, uniform & customer service",
  "SOP compliance & control-document usage",
  "Management follow-up & previous corrective actions",
];

const DAILY_ITEMS = [
  "Store opened on time and opening checks completed",
  "Staff attendance and department coverage confirmed",
  "Sales floor clean, faced up and customer ready",
  "Promotional pricing and shelf labels checked",
  "Receiving area clear; outstanding GRVs / credits reviewed",
  "Dispatch area controlled; outstanding deliveries / collections reviewed",
  "Yard clean, safe and bulk stock correctly stored",
  "Cashiers / tills operational and float controls checked",
  "High-risk / fast-moving stock spot counts completed",
  "Safety, security, fire exits and access controls checked",
  "Customer complaints / incidents reviewed and actioned",
  "Closing checks, housekeeping and unresolved issues handed over",
];

const emptyAuditSections = () => AUDIT_AREAS.map((name) => ({ name, score: 0, comment: "" }));
const emptyChecklistItems = () => DAILY_ITEMS.map((name) => ({ name, status: "" as const, comment: "" }));
const tabFromView = (view: string): Tab => view === "Daily Checklists" ? "checklists" : view === "Store Ranking" ? "ranking" : "audits";
const viewFromTab = (tab: Tab) => tab === "checklists" ? "Daily Checklists" : tab === "ranking" ? "Store Ranking" : "Store Audits";
const dateLabel = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const scoreTone = (score: number) => score >= 85 ? "green" : score >= 70 ? "amber" : "red";

export default function StoreControls({
  initialView,
  currentUser,
  onNavigate,
}: {
  initialView: string;
  currentUser: User;
  onNavigate: (view: string) => void;
}) {
  const tab = tabFromView(initialView);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [saving, setSaving] = useState(false);

  const [auditOpen, setAuditOpen] = useState(false);
  const [auditType, setAuditType] = useState("Routine");
  const [auditDate, setAuditDate] = useState("");
  const [auditor, setAuditor] = useState(currentUser.name || "");
  const [auditSections, setAuditSections] = useState<AuditSection[]>(emptyAuditSections());
  const [findings, setFindings] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [correctiveDue, setCorrectiveDue] = useState("");
  const [auditSignoff, setAuditSignoff] = useState("");
  const [auditFiles, setAuditFiles] = useState<File[]>([]);

  const [checklistDate, setChecklistDate] = useState("");
  const [checklistManager, setChecklistManager] = useState(currentUser.name || "");
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(emptyChecklistItems());
  const [checklistNotes, setChecklistNotes] = useState("");
  const [checklistSignoff, setChecklistSignoff] = useState("");
  const [checklistFiles, setChecklistFiles] = useState<File[]>([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store-controls", { cache: "no-store" });
      const result = (await response.json().catch(() => ({}))) as Partial<Data> & { error?: string };
      if (!response.ok) throw new Error(result.error || "Store controls could not be loaded.");
      const next = result as Data;
      setData(next);
      setSelectedStore((current) => current && next.stores.some((store) => store.name === current) ? current : next.stores[0]?.name || "");
      setAuditDate((current) => current || next.today);
      setChecklistDate((current) => current || next.today);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store controls could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!data || !selectedStore || !checklistDate) return;
    const timer = window.setTimeout(() => {
      const existing = data.checklists.find((row) => row.workspace === selectedStore && row.checklist_date === checklistDate);
      if (existing) {
        const byName = new Map(existing.items.map((item) => [item.name, item]));
        setChecklistItems(DAILY_ITEMS.map((name) => byName.get(name) || { name, status: "", comment: "" }));
        setChecklistManager(existing.manager || currentUser.name || "");
        setChecklistNotes(existing.notes || "");
        setChecklistSignoff(existing.manager_signoff || "");
      } else {
        setChecklistItems(emptyChecklistItems());
        setChecklistManager(currentUser.name || "");
        setChecklistNotes("");
        setChecklistSignoff("");
      }
      setChecklistFiles([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [data, selectedStore, checklistDate, currentUser.name]);

  const selectTab = (next: Tab) => {
    onNavigate(viewFromTab(next));
  };

  const auditsForStore = useMemo(
    () => (data?.audits || []).filter((row) => !selectedStore || row.workspace === selectedStore),
    [data, selectedStore],
  );
  const checklistHistory = useMemo(
    () => (data?.checklists || []).filter((row) => !selectedStore || row.workspace === selectedStore),
    [data, selectedStore],
  );
  const auditScore = Math.round((auditSections.reduce((sum, item) => sum + Number(item.score || 0), 0) / (auditSections.length * 5)) * 100);
  const applicableChecklist = checklistItems.filter((item) => item.status !== "N/A");
  const checklistDone = applicableChecklist.filter((item) => item.status === "Done").length;
  const checklistPreview = applicableChecklist.length ? Math.round((checklistDone / applicableChecklist.length) * 100) : 0;

  const attachmentsFor = (type: "audit" | "checklist", id: number) =>
    (data?.attachments || []).filter((file) => file.record_type === type && Number(file.record_id) === Number(id));

  const uploadFiles = async (recordType: "audit" | "checklist", recordId: number, files: File[]) => {
    for (const file of files.slice(0, 5)) {
      const form = new FormData();
      form.append("record_type", recordType);
      form.append("record_id", String(recordId));
      form.append("file", file);
      const response = await fetch("/api/store-controls/attachments", { method: "POST", body: form });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || `Could not upload ${file.name}`);
      }
    }
  };

  const saveAudit = async () => {
    if (!data?.canWrite || saving) return;
    if (!selectedStore || !auditor.trim() || !auditSignoff.trim()) {
      setNotice("Select a store and complete the auditor and manager sign-off fields.");
      return;
    }
    if (auditSections.some((item) => item.score < 0 || item.score > 5)) {
      setNotice("Every audit section must be scored from 0 to 5.");
      return;
    }
    if (correctiveAction.trim() && !correctiveDue) {
      setNotice("Set a due date for the corrective action.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/store-controls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "audit",
          workspace: selectedStore,
          auditDate,
          auditType,
          auditor,
          sections: auditSections,
          findings,
          correctiveAction,
          responsiblePerson,
          correctiveDue,
          managerSignoff: auditSignoff,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { audit?: Audit; error?: string };
      if (!response.ok || !result.audit) throw new Error(result.error || "Audit could not be saved.");
      let evidenceWarning = "";
      if (auditFiles.length) {
        try { await uploadFiles("audit", Number(result.audit.id), auditFiles); }
        catch { evidenceWarning = " Evidence upload failed; the audit itself was saved."; }
      }
      setAuditOpen(false);
      setAuditSections(emptyAuditSections());
      setFindings("");
      setCorrectiveAction("");
      setResponsiblePerson("");
      setCorrectiveDue("");
      setAuditSignoff("");
      setAuditFiles([]);
      setNotice(`Audit saved for ${selectedStore} at ${result.audit.score}%.${evidenceWarning}`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Audit could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const saveChecklist = async () => {
    if (!data?.canWrite || saving) return;
    if (!selectedStore || !checklistManager.trim() || !checklistSignoff.trim()) {
      setNotice("Select a store and complete the manager and sign-off fields.");
      return;
    }
    if (checklistItems.some((item) => !item.status)) {
      setNotice("Complete every daily checklist item before saving.");
      return;
    }
    const issueWithoutComment = checklistItems.find((item) => item.status === "Issue" && !item.comment.trim());
    if (issueWithoutComment) {
      setNotice(`Add a comment for the issue: ${issueWithoutComment.name}`);
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/store-controls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "checklist",
          workspace: selectedStore,
          checklistDate,
          manager: checklistManager,
          items: checklistItems,
          notes: checklistNotes,
          managerSignoff: checklistSignoff,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { checklist?: Checklist; error?: string };
      if (!response.ok || !result.checklist) throw new Error(result.error || "Checklist could not be saved.");
      let evidenceWarning = "";
      if (checklistFiles.length) {
        try { await uploadFiles("checklist", Number(result.checklist.id), checklistFiles); }
        catch { evidenceWarning = " Evidence upload failed; the checklist itself was saved."; }
      }
      setNotice(`Daily checklist saved at ${result.checklist.compliance_percent}% compliance.${evidenceWarning}`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Checklist could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const closeCorrective = async (audit: Audit) => {
    if (!data?.canWrite || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/store-controls", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "audit", id: audit.id, correctiveStatus: "Closed" }),
      });
      if (!response.ok) throw new Error("Corrective action could not be closed.");
      setNotice("Corrective action closed.");
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Corrective action could not be closed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <div className="storeControlsLoading">Loading store controls…</div>;
  if (error && !data) return <section className="storeControlsError"><b>Store controls could not load</b><p>{error}</p><button onClick={() => void load()}>Try again</button></section>;
  if (!data) return null;

  const top = data.ranking.slice(0, 3);
  const selectedRank = data.ranking.find((row) => row.workspace === selectedStore);

  return <div className="storeControls">
    <section className="storeControlsHero">
      <div><small>POWERBUILD OPERATING CONTROL SYSTEM</small><h2>Store Control Centre</h2><p>Digital audits, daily manager discipline and one executive ranking across the store network.</p></div>
      <label>Store scope<select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>{data.stores.map((store) => <option key={store.id} value={store.name}>{store.name}</option>)}</select></label>
    </section>

    <nav className="storeControlTabs">
      <button className={tab === "audits" ? "active" : ""} onClick={() => selectTab("audits")}><i>✓</i><span><b>Digital Store Audits</b><small>Score, evidence and corrective actions</small></span></button>
      <button className={tab === "checklists" ? "active" : ""} onClick={() => selectTab("checklists")}><i>☑</i><span><b>Daily Manager Checklists</b><small>Opening-to-closing compliance</small></span></button>
      <button className={tab === "ranking" ? "active" : ""} onClick={() => selectTab("ranking")}><i>#</i><span><b>Executive Store Ranking</b><small>Group operational league table</small></span></button>
    </nav>

    {notice && <div className="storeControlNotice" onClick={() => setNotice("")}>{notice}<button aria-label="Dismiss">×</button></div>}

    <section className="storeControlKpis">
      <article><span>Stores in scope</span><b>{data.summary.stores}</b><small>{data.summary.auditedStores} audited</small></article>
      <article><span>Today&apos;s checklists</span><b>{data.summary.todayChecklists}/{data.summary.stores}</b><small>{Math.max(0, data.summary.stores - data.summary.todayChecklists)} outstanding</small></article>
      <article><span>Overdue corrective actions</span><b className={data.summary.overdueCorrectives ? "danger" : "good"}>{data.summary.overdueCorrectives}</b><small>Requires management follow-up</small></article>
      <article><span>Average control score</span><b>{data.summary.averageScore}%</b><small>Audit + checklist + tasks</small></article>
    </section>

    {tab === "audits" && <>
      <section className="storeControlPanel auditOverviewPanel">
        <header><div><small>DIGITAL STORE AUDIT</small><h3>{selectedStore || "Store audit"}</h3><p>Score operational standards out of 5, capture findings and assign corrective action.</p></div>{data.canWrite && <button className="storeControlPrimary" onClick={() => setAuditOpen((value) => !value)}>{auditOpen ? "Close audit form" : "+ Start new audit"}</button>}</header>
        {selectedRank && <div className="selectedStoreControlScore"><span><b>{selectedRank.auditScore}%</b><small>Latest audit</small></span><span><b>{selectedRank.openCorrectives}</b><small>Open corrective actions</small></span><span><b>{selectedRank.overdueCorrectives}</b><small>Overdue actions</small></span><span><b>{selectedRank.latestAuditDate ? dateLabel(selectedRank.latestAuditDate) : "No audit"}</b><small>Last audited</small></span></div>}
      </section>

      {auditOpen && data.canWrite && <section className="storeControlPanel storeAuditForm">
        <header><div><h3>New digital audit</h3><p>Each section is scored 0–5. Add comments where standards are not met.</p></div><div className={`auditLiveScore ${scoreTone(auditScore)}`}><b>{auditScore}%</b><small>live score</small></div></header>
        <div className="storeControlFormGrid"><label>Audit date<input type="date" value={auditDate} onChange={(event) => setAuditDate(event.target.value)} /></label><label>Audit type<select value={auditType} onChange={(event) => setAuditType(event.target.value)}><option>Routine</option><option>Regional</option><option>Follow-up</option><option>Opening readiness</option><option>Executive</option></select></label><label>Auditor<input value={auditor} onChange={(event) => setAuditor(event.target.value)} /></label><button type="button" className="markCompliantBtn" onClick={() => setAuditSections((items) => items.map((item) => ({ ...item, score: 5 })))}>Mark all compliant 5/5</button></div>
        <div className="auditSectionList">{auditSections.map((section, index) => <article key={section.name}><span className="auditAreaNumber">{index + 1}</span><div><b>{section.name}</b><input placeholder="Audit comment / exception" value={section.comment} onChange={(event) => setAuditSections((items) => items.map((item, i) => i === index ? { ...item, comment: event.target.value } : item))} /></div><label><strong>{section.score}/5</strong><input type="range" min="0" max="5" step="1" value={section.score} onChange={(event) => setAuditSections((items) => items.map((item, i) => i === index ? { ...item, score: Number(event.target.value) } : item))} /></label></article>)}</div>
        <div className="storeControlTextGrid"><label>Overall findings<textarea value={findings} onChange={(event) => setFindings(event.target.value)} placeholder="Key observations, strengths and non-compliance" /></label><label>Corrective action<textarea value={correctiveAction} onChange={(event) => setCorrectiveAction(event.target.value)} placeholder="What must be corrected before this audit can be fully closed?" /></label></div>
        <div className="storeControlFormGrid"><label>Responsible person<input value={responsiblePerson} onChange={(event) => setResponsiblePerson(event.target.value)} /></label><label>Corrective due date<input type="date" value={correctiveDue} onChange={(event) => setCorrectiveDue(event.target.value)} /></label><label>Manager sign-off<input value={auditSignoff} onChange={(event) => setAuditSignoff(event.target.value)} placeholder="Manager full name" /></label><label>Photo evidence / documents<input type="file" multiple accept="image/*,.pdf" onChange={(event) => setAuditFiles(Array.from(event.target.files || []))} /><small>Up to 5 files · 12MB each</small></label></div>
        <footer><button className="storeControlPrimary" disabled={saving} onClick={() => void saveAudit()}>{saving ? "Saving audit…" : "Save digital audit"}</button></footer>
      </section>}

      <section className="storeControlPanel"><header><div><h3>Audit history</h3><p>{selectedStore} · newest audits first</p></div><b className="historyCount">{auditsForStore.length}</b></header><div className="auditHistory">{auditsForStore.map((audit) => { const files = attachmentsFor("audit", audit.id); const overdue = audit.corrective_status !== "Closed" && audit.corrective_due && audit.corrective_due < data.today; return <article key={audit.id}><div className={`auditScoreBadge ${scoreTone(Number(audit.score))}`}>{Math.round(Number(audit.score))}%</div><div className="auditHistoryMain"><header><span><b>{audit.audit_type} audit</b><small>{dateLabel(audit.audit_date)} · {audit.auditor}</small></span><em className={audit.corrective_status === "Closed" ? "closed" : overdue ? "overdue" : "open"}>{audit.corrective_status === "Closed" ? "Corrective closed" : overdue ? "Corrective overdue" : audit.corrective_action ? "Corrective open" : "No corrective action"}</em></header>{audit.findings && <p><strong>Findings:</strong> {audit.findings}</p>}{audit.corrective_action && <p><strong>Action:</strong> {audit.corrective_action} {audit.responsible_person && <>· {audit.responsible_person}</>} {audit.corrective_due && <>· Due {dateLabel(audit.corrective_due)}</>}</p>}<div className="evidenceLinks">{files.map((file) => <a key={file.id} href={`/api/store-controls/attachments/${file.id}`} target="_blank" rel="noreferrer">{file.type.startsWith("image/") ? "▧" : "▤"} {file.name}</a>)}{audit.corrective_action && audit.corrective_status !== "Closed" && data.canWrite && <button disabled={saving} onClick={() => void closeCorrective(audit)}>✓ Mark corrective closed</button>}</div><small className="signoffText">Manager sign-off: {audit.manager_signoff || "—"}</small></div></article>; })}{!auditsForStore.length && <div className="storeControlEmpty">No digital audits captured for this store yet.</div>}</div></section>
    </>}

    {tab === "checklists" && <>
      <section className="storeControlPanel dailyChecklistPanel"><header><div><small>DAILY STORE CONTROL</small><h3>{selectedStore}</h3><p>Complete the manager checklist every operating day. Missed days count against compliance in the executive ranking.</p></div><div className={`auditLiveScore ${scoreTone(checklistPreview)}`}><b>{checklistPreview}%</b><small>current compliance</small></div></header>
        <div className="storeControlFormGrid checklistHeaderFields"><label>Checklist date<input type="date" value={checklistDate} onChange={(event) => setChecklistDate(event.target.value)} /></label><label>Manager<input value={checklistManager} onChange={(event) => setChecklistManager(event.target.value)} disabled={!data.canWrite} /></label>{data.canWrite && <button type="button" className="markCompliantBtn" onClick={() => setChecklistItems((items) => items.map((item) => ({ ...item, status: "Done" })))}>Mark all Done</button>}</div>
        <div className="dailyChecklistItems">{checklistItems.map((item, index) => <article key={item.name} className={item.status === "Issue" ? "hasIssue" : item.status === "Done" ? "isDone" : ""}><span>{index + 1}</span><div><b>{item.name}</b><input disabled={!data.canWrite} value={item.comment} onChange={(event) => setChecklistItems((items) => items.map((row, i) => i === index ? { ...row, comment: event.target.value } : row))} placeholder={item.status === "Issue" ? "Issue comment required" : "Optional note"} /></div><select disabled={!data.canWrite} value={item.status} onChange={(event) => setChecklistItems((items) => items.map((row, i) => i === index ? { ...row, status: event.target.value as ChecklistItem["status"] } : row))}><option value="">Select</option><option value="Done">Done</option><option value="Issue">Issue</option><option value="N/A">N/A</option></select></article>)}</div>
        <div className="storeControlFormGrid"><label>Manager notes<textarea value={checklistNotes} disabled={!data.canWrite} onChange={(event) => setChecklistNotes(event.target.value)} placeholder="Outstanding items, handover notes or management actions" /></label><label>Manager sign-off<input value={checklistSignoff} disabled={!data.canWrite} onChange={(event) => setChecklistSignoff(event.target.value)} placeholder="Manager full name" /></label><label>Photo evidence<input type="file" multiple accept="image/*,.pdf" disabled={!data.canWrite} onChange={(event) => setChecklistFiles(Array.from(event.target.files || []))} /><small>Optional · up to 5 files</small></label></div>
        {data.canWrite && <footer><button className="storeControlPrimary" disabled={saving} onClick={() => void saveChecklist()}>{saving ? "Saving checklist…" : "Save daily manager checklist"}</button></footer>}
      </section>
      <section className="storeControlPanel"><header><div><h3>Checklist history</h3><p>Daily compliance and exceptions for {selectedStore}</p></div></header><div className="checklistHistoryTable"><div className="checklistHistoryHead"><span>Date</span><span>Manager</span><span>Compliance</span><span>Issues</span><span>Evidence</span></div>{checklistHistory.slice(0, 31).map((row) => <div className="checklistHistoryRow" key={row.id}><b>{dateLabel(row.checklist_date)}</b><span>{row.manager}</span><strong className={scoreTone(Number(row.compliance_percent))}>{Math.round(Number(row.compliance_percent))}%</strong><span>{row.issues_count}</span><span>{attachmentsFor("checklist", row.id).map((file) => <a key={file.id} href={`/api/store-controls/attachments/${file.id}`} target="_blank" rel="noreferrer">▧</a>)}{!attachmentsFor("checklist", row.id).length && "—"}</span></div>)}{!checklistHistory.length && <div className="storeControlEmpty">No manager checklists captured for this store yet.</div>}</div></section>
    </>}

    {tab === "ranking" && <>
      <section className="rankingExplainer"><div><small>EXECUTIVE STORE RANKING</small><h3>Operational league table</h3><p>Weighted score: 35% latest audit + 30% daily checklist compliance + 25% task completion + 10% corrective-action discipline.</p></div><div><span>Green <b>85%+</b></span><span>Amber <b>70–84%</b></span><span>Red <b>Below 70%</b></span></div></section>
      <section className="rankingPodium">{top.map((row, index) => <article key={row.workspace} className={`rank${index + 1}`}><i>#{index + 1}</i><small>{row.region}</small><h3>{row.workspace}</h3><b>{row.score}%</b><em className={scoreTone(row.score)}>{row.status}</em><p>Audit {row.auditScore}% · Checklist {row.checklistScore}%</p></article>)}</section>
      <section className="storeControlPanel rankingTablePanel"><header><div><h3>All stores</h3><p>Click a store name by selecting it above to review its underlying audits and checklists.</p></div><button onClick={() => void load()}>↻ Refresh ranking</button></header><div className="rankingTable"><div className="rankingHead"><span>Rank / Store</span><span>Score</span><span>Audit</span><span>Checklist</span><span>Tasks</span><span>Corrective</span><span>Today</span></div>{data.ranking.map((row, index) => <div className="rankingRow" key={row.workspace}><span><i>#{index + 1}</i><button onClick={() => setSelectedStore(row.workspace)}>{row.workspace}<small>{row.region} {row.manager ? `· ${row.manager}` : ""}</small></button></span><strong className={scoreTone(row.score)}>{row.score}%<small>{row.status}</small></strong><span>{row.auditScore}%<small>{row.latestAuditDate ? dateLabel(row.latestAuditDate) : "No audit"}</small></span><span>{row.checklistScore}%<small>{row.checklistEntries}/7 operating days</small></span><span>{row.taskScore}%<small>{row.taskCount} tasks</small></span><span className={row.overdueCorrectives ? "dangerText" : ""}>{row.openCorrectives} open<small>{row.overdueCorrectives} overdue</small></span><span>{row.todayChecklist === null ? <em className="missingToday">Missing</em> : <em className={scoreTone(row.todayChecklist)}>{row.todayChecklist}%</em>}</span></div>)}</div></section>
    </>}
  </div>;
}
