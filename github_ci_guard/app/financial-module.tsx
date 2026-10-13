"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Workspace = { name: string; type?: string };
type Report = {
  id: number; workspace: string; period: string; turnover: number; cost_of_sales: number; gross_profit: number;
  salaries: number; rent: number; security: number; insurance: number; systems: number;
  other_fixed: number; utilities: number; repairs_maintenance: number;
  transport_delivery: number; consumables: number; other_variable: number;
  petty_cash: number; capex: number; budget_turnover: number;
  budget_gross_profit: number; budget_operating_expenses: number; budget_capex: number;
  notes: string; document_count?: number;
};
type DocumentRow = { id: number; name: string; size: number; uploaded_by: string; created_at: string };
type NumberKey = Exclude<keyof Report, "id" | "workspace" | "period" | "notes" | "document_count">;

const numberKeys: NumberKey[] = ["turnover", "cost_of_sales", "gross_profit", "salaries", "rent", "security", "insurance", "systems", "other_fixed", "utilities", "repairs_maintenance", "transport_delivery", "consumables", "other_variable", "petty_cash", "capex", "budget_turnover", "budget_gross_profit", "budget_operating_expenses", "budget_capex"];
const currentMonth = new Date().toISOString().slice(0, 7);
const blankReport = (workspace = "Head Office", period = currentMonth): Report => ({
  id: 0, workspace, period, turnover: 0, cost_of_sales: 0, gross_profit: 0, salaries: 0, rent: 0,
  security: 0, insurance: 0, systems: 0, other_fixed: 0, utilities: 0,
  repairs_maintenance: 0, transport_delivery: 0, consumables: 0, other_variable: 0,
  petty_cash: 0, capex: 0, budget_turnover: 0, budget_gross_profit: 0,
  budget_operating_expenses: 0, budget_capex: 0, notes: "",
});
const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value || 0);
const fixedTotal = (r: Report) => Number(r.salaries) + Number(r.rent) + Number(r.security) + Number(r.insurance) + Number(r.systems) + Number(r.other_fixed);
const variableTotal = (r: Report) => Number(r.utilities) + Number(r.repairs_maintenance) + Number(r.transport_delivery) + Number(r.consumables) + Number(r.other_variable);
const calculation = (r: Report) => {
  const turnover = Number(r.turnover), costOfSales = Number(r.cost_of_sales),
    gp = turnover - costOfSales, fixed = fixedTotal(r),
    variable = variableTotal(r), petty = Number(r.petty_cash), opex = fixed + variable + petty,
    net = gp - opex, capex = Number(r.capex);
  return { turnover, costOfSales, gp,
    gpPercent: turnover ? (gp / turnover) * 100 : 0, fixed, variable, petty, opex, net,
    netPercent: turnover ? (net / turnover) * 100 : 0, capex, cashAfterCapex: net - capex };
};
const sumReports = (reports: Report[]): Report => {
  const total = blankReport("Company Total", reports[0]?.period || currentMonth);
  for (const report of reports) for (const key of numberKeys) total[key] += Number(report[key]) || 0;
  return total;
};

export default function FinancialModule({ workspaces }: { workspaces: Workspace[] }) {
  const [reports, setReports] = useState<Report[]>([]), [workspace, setWorkspace] = useState("All Workspaces"),
    [period, setPeriod] = useState(currentMonth), [draft, setDraft] = useState<Report>(blankReport()),
    [documents, setDocuments] = useState<DocumentRow[]>([]), [open, setOpen] = useState(false),
    [busy, setBusy] = useState(true), [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false), [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const workspaceNames = useMemo(() => Array.from(new Set(workspaces.map((item) => item.name))), [workspaces]);
  const load = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/pnl"), data = await response.json();
      if (response.ok) setReports(data.reports || []);
      else setError(data.error || "The monthly P&L reports could not be loaded.");
    } finally { setBusy(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, []);
  const selected = reports.find((report) => report.workspace === workspace && report.period === period),
    monthReports = reports.filter((report) => report.period === period),
    dashboardReport = workspace === "All Workspaces" ? sumReports(monthReports) : selected || blankReport(workspace, period),
    totals = calculation(dashboardReport),
    history = workspace === "All Workspaces" ? [] : reports.filter((report) => report.workspace === workspace),
    availableRows = workspaceNames.map((name) => reports.find((report) => report.workspace === name && report.period === period) || blankReport(name, period));
  const loadDocuments = async (reportId: number) => {
    if (!reportId) return setDocuments([]);
    const response = await fetch(`/api/pnl/${reportId}/documents`), data = await response.json();
    setDocuments(response.ok ? data.documents || [] : []);
  };
  useEffect(() => {
    const timer = window.setTimeout(() => void loadDocuments(selected?.id || 0), 0);
    return () => window.clearTimeout(timer);
  }, [selected?.id]);
  const startReport = (report?: Report) => {
    const fallback = workspace === "All Workspaces" ? workspaceNames[0] || "Head Office" : workspace;
    setDraft(report ? { ...report } : blankReport(fallback, period)); setError(""); setSuccess(""); setOpen(true);
  };
  const save = async () => {
    if (!draft.workspace || !draft.period) return setError("Select a workspace and month.");
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/pnl", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }), data = await response.json();
      if (!response.ok) throw new Error(data.error || "The monthly P&L could not be saved.");
      setWorkspace(draft.workspace); setPeriod(draft.period); setOpen(false); await load();
      setSuccess(`${draft.workspace} P&L for ${draft.period} saved successfully.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The monthly P&L could not be saved."); }
    finally { setSaving(false); }
  };
  const uploadDocument = async (file?: File) => {
    if (!selected || !file) return;
    setUploading(true); setError(""); const form = new FormData(); form.append("file", file);
    try {
      const response = await fetch(`/api/pnl/${selected.id}/documents`, { method: "POST", body: form }), data = await response.json();
      if (!response.ok) throw new Error(data.error || "Document upload failed.");
      await Promise.all([loadDocuments(selected.id), load()]); setSuccess("Supporting document stored with this monthly P&L.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Document upload failed."); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ""; }
  };
  const removeDocument = async (id: number) => {
    if (!selected || !window.confirm("Remove this supporting document?")) return;
    const response = await fetch(`/api/pnl-documents/${id}`, { method: "DELETE" });
    if (response.ok) { await Promise.all([loadDocuments(selected.id), load()]); setSuccess("Supporting document removed."); }
    else setError("The document could not be removed.");
  };
  const setNumber = (key: NumberKey, value: string) => setDraft((current) => ({ ...current, [key]: Number(value) || 0 }));
  const field = (key: NumberKey, label: string) => <label key={key}>{label}<span className="moneyInput"><i>R</i><input type="number" min="0" step="0.01" value={draft[key] || ""} onChange={(event) => setNumber(key, event.target.value)} /></span></label>;

  return <>
    <div className="pnlToolbar">
      <label>Store / Division<select value={workspace} onChange={(event) => setWorkspace(event.target.value)}><option>All Workspaces</option>{workspaceNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      <label>Reporting month<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} /></label>
      <button className="pnlPrimary" onClick={() => startReport(selected)}>{selected ? "Edit monthly P&L" : "＋ Enter monthly P&L"}</button>
    </div>
    {success && <div className="memberSuccess pnlSuccess">✓ {success}</div>}
    {error && !open && <div className="formError">{error}</div>}
    <div className="pnlKpis">
      <article><small>Turnover</small><b>{money(totals.turnover)}</b><em>Monthly sales</em></article>
      <article><small>Cost of Sales</small><b>{money(totals.costOfSales)}</b><em>Entered from the monthly accounts</em></article>
      <article><small>Gross Profit</small><b>{money(totals.gp)}</b><em>{totals.gpPercent.toFixed(1)}% GP</em></article>
      <article><small>Total operating expenses</small><b>{money(totals.opex)}</b><em>Fixed + variable + petty cash</em></article>
      <article className={totals.net < 0 ? "negative" : "positive"}><small>Net operating profit</small><b>{money(totals.net)}</b><em>{totals.netPercent.toFixed(1)}% of turnover</em></article>
      <article><small>Capital expenditure</small><b>{money(totals.capex)}</b><em>Shown separately for management</em></article>
      <article className={totals.cashAfterCapex < 0 ? "negative" : "positive"}><small>Profit after CAPEX view</small><b>{money(totals.cashAfterCapex)}</b><em>Management cash-impact view</em></article>
    </div>
    <section className="panel pnlStatementPanel"><div className="panelhead"><span><h2>{workspace === "All Workspaces" ? "Group monthly P&L" : `${workspace} monthly P&L`}</h2><p>{period} · Monthly reports remain stored permanently and do not reset.</p></span>{workspace !== "All Workspaces" && <button onClick={() => startReport(selected)}>{selected ? "Edit report" : "Create report"}</button>}</div>
      <div className="pnlStatement"><div><span>Turnover / Sales</span><b>{money(totals.turnover)}</b></div><div><span>Less: Cost of Sales</span><b>({money(totals.costOfSales)})</b></div><div className="pnlSubtotal"><span>Gross Profit</span><b>{money(totals.gp)} <small>{totals.gpPercent.toFixed(1)}%</small></b></div><div><span>Fixed expenses</span><b>({money(totals.fixed)})</b></div><div><span>Variable expenses</span><b>({money(totals.variable)})</b></div><div><span>Petty cash</span><b>({money(totals.petty)})</b></div><div className="pnlSubtotal"><span>Net Operating Profit</span><b>{money(totals.net)}</b></div><div className="pnlCapexLine"><span>Capital Expenditure (CAPEX)</span><b>({money(totals.capex)})</b></div><div className="pnlFinal"><span>Profit after CAPEX management view</span><b>{money(totals.cashAfterCapex)}</b></div></div>
    </section>
    {workspace === "All Workspaces" ? <section className="panel"><div className="panelhead"><span><h2>Store-by-store P&L dashboard</h2><p>All stores, DC, Head Office and Wholesale for {period}</p></span></div>{busy ? <div className="loading">Loading monthly P&L reports…</div> : <div className="tablewrap"><table className="pnlMasterTable"><thead><tr><th>Store / Workspace</th><th>Turnover</th><th>Cost of Sales</th><th>GP</th><th>GP%</th><th>Fixed</th><th>Variable</th><th>Petty Cash</th><th>Net Profit</th><th>CAPEX</th><th>Status</th></tr></thead><tbody>{availableRows.map((row) => { const calc = calculation(row); return <tr key={row.workspace} onClick={() => { setWorkspace(row.workspace); startReport(row); }}><td><b>{row.workspace}</b></td><td>{money(calc.turnover)}</td><td>{money(calc.costOfSales)}</td><td>{money(calc.gp)}</td><td>{calc.gpPercent.toFixed(1)}%</td><td>{money(calc.fixed)}</td><td>{money(calc.variable)}</td><td>{money(calc.petty)}</td><td className={calc.net < 0 ? "negativeValue" : "positiveValue"}>{money(calc.net)}</td><td>{money(calc.capex)}</td><td><em className={`pnlStatus ${row.id ? "complete" : "outstanding"}`}>{row.id ? "Captured" : "Outstanding"}</em></td></tr>; })}</tbody></table></div>}</section> : <>
      <section className="panel pnlExpensePanel"><div className="panelhead"><span><h2>Expense breakdown</h2><p>Detailed monthly operating costs for {workspace}</p></span></div><div className="pnlExpenseColumns"><article><h3>Fixed expenses</h3><p><span>Salaries</span><b>{money(Number(dashboardReport.salaries))}</b></p><p><span>Rent</span><b>{money(Number(dashboardReport.rent))}</b></p><p><span>Security</span><b>{money(Number(dashboardReport.security))}</b></p><p><span>Insurance</span><b>{money(Number(dashboardReport.insurance))}</b></p><p><span>Systems</span><b>{money(Number(dashboardReport.systems))}</b></p><p><span>Other fixed</span><b>{money(Number(dashboardReport.other_fixed))}</b></p><footer><span>Total fixed</span><b>{money(totals.fixed)}</b></footer></article><article><h3>Variable expenses</h3><p><span>Utilities</span><b>{money(Number(dashboardReport.utilities))}</b></p><p><span>Repairs & maintenance</span><b>{money(Number(dashboardReport.repairs_maintenance))}</b></p><p><span>Transport & delivery</span><b>{money(Number(dashboardReport.transport_delivery))}</b></p><p><span>Consumables</span><b>{money(Number(dashboardReport.consumables))}</b></p><p><span>Other variable</span><b>{money(Number(dashboardReport.other_variable))}</b></p><footer><span>Total variable</span><b>{money(totals.variable)}</b></footer></article></div></section>
      <section className="panel pnlDocumentsPanel"><div className="panelhead"><span><h2>Supporting financial documents</h2><p>Upload management accounts, expense schedules, petty-cash sheets, invoices and CAPEX evidence.</p></span>{selected && <button disabled={uploading} onClick={() => fileInput.current?.click()}>{uploading ? "Uploading…" : "＋ Upload document"}</button>}</div><input ref={fileInput} hidden type="file" accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,image/*" onChange={(event) => void uploadDocument(event.target.files?.[0])} />{!selected ? <div className="moduleEmpty"><b>Save the monthly P&L first</b><p>Documents can then be stored permanently against this store and month.</p></div> : !documents.length ? <div className="moduleEmpty"><b>No supporting documents uploaded</b><p>Upload the first file for this reporting month.</p></div> : <div className="pnlDocumentList">{documents.map((document) => <article key={document.id}><span><b>{document.name}</b><small>{(document.size / 1024 / 1024).toFixed(1)} MB · {document.uploaded_by}</small></span><a href={`/api/pnl-documents/${document.id}`} target="_blank" rel="noreferrer">Open</a><button onClick={() => void removeDocument(document.id)}>Remove</button></article>)}</div>}</section>
      <section className="panel"><div className="panelhead"><span><h2>Monthly P&L history</h2><p>Permanent record for {workspace}</p></span></div>{!history.length ? <div className="moduleEmpty"><b>No monthly history yet</b><p>Create the first monthly P&L above.</p></div> : <div className="tablewrap"><table><thead><tr><th>Month</th><th>Turnover</th><th>Cost of Sales</th><th>Gross Profit</th><th>GP%</th><th>Operating Expenses</th><th>Net Profit</th><th>CAPEX</th><th>Documents</th></tr></thead><tbody>{history.map((row) => { const calc = calculation(row); return <tr key={row.id} onClick={() => setPeriod(row.period)}><td><b>{row.period}</b></td><td>{money(calc.turnover)}</td><td>{money(calc.costOfSales)}</td><td>{money(calc.gp)}</td><td>{calc.gpPercent.toFixed(1)}%</td><td>{money(calc.opex)}</td><td>{money(calc.net)}</td><td>{money(calc.capex)}</td><td>{row.document_count || 0}</td></tr>; })}</tbody></table></div>}</section>
    </>}
    {open && <div className="overlay" onMouseDown={() => setOpen(false)}><div className="crmModal pnlModal" onMouseDown={(event) => event.stopPropagation()}><header><span><small>MONTHLY FINANCIAL REPORT</small><h2>{draft.id ? "Update" : "Create"} monthly P&amp;L</h2><p>Enter the complete month once. Gross margin and profit are calculated automatically.</p></span><button onClick={() => setOpen(false)}>×</button></header>{error && <div className="formError">{error}</div>}<div className="pnlForm">
      <section><h3>Reporting period</h3><div className="pnlFormGrid"><label>Store / Workspace<select value={draft.workspace} onChange={(event) => setDraft({ ...draft, workspace: event.target.value })}>{workspaceNames.map((name) => <option key={name}>{name}</option>)}</select></label><label>Month<input type="month" value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })} /></label></div></section>
      <section><h3>Sales & cost of sales</h3><div className="pnlFormGrid">{field("turnover", "Turnover / Sales")}{field("cost_of_sales", "Cost of Sales")}</div><div className="pnlLiveCalc"><span>Calculated Gross Profit <b>{money(calculation(draft).gp)}</b></span><span>Calculated GP% <b>{calculation(draft).gpPercent.toFixed(1)}%</b></span></div></section>
      <section><h3>Fixed expenses</h3><p>Capture the full fixed cost for this reporting month.</p><div className="pnlFormGrid three">{field("salaries", "Salaries & wages")}{field("rent", "Rent")}{field("security", "Security")}{field("insurance", "Insurance")}{field("systems", "Systems & subscriptions")}{field("other_fixed", "Other fixed expenses")}</div><div className="pnlSectionTotal">Total fixed expenses <b>{money(fixedTotal(draft))}</b></div></section>
      <section><h3>Variable expenses</h3><div className="pnlFormGrid three">{field("utilities", "Utilities")}{field("repairs_maintenance", "Repairs & maintenance")}{field("transport_delivery", "Transport & delivery")}{field("consumables", "Consumables")}{field("other_variable", "Other variable expenses")}</div><div className="pnlSectionTotal">Total variable expenses <b>{money(variableTotal(draft))}</b></div></section>
      <section><h3>Petty cash & capital expenditure</h3><div className="pnlFormGrid">{field("petty_cash", "Petty cash")}{field("capex", "Capital expenditure (CAPEX)")}</div></section>
      <section><h3>Budget comparison</h3><div className="pnlFormGrid two">{field("budget_turnover", "Budget turnover")}{field("budget_gross_profit", "Budget gross profit")}{field("budget_operating_expenses", "Budget operating expenses")}{field("budget_capex", "Budget CAPEX")}</div></section>
      <section><h3>Management notes</h3><textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Explain major variances, once-off costs or CAPEX items…" /></section><div className="pnlSavePreview"><span><small>Net operating profit</small><b>{money(calculation(draft).net)}</b></span><span><small>Profit after CAPEX view</small><b>{money(calculation(draft).cashAfterCapex)}</b></span></div></div><footer><button onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving monthly P&L…" : "Save monthly P&L"}</button></footer></div></div>}
  </>;
}
