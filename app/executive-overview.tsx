"use client";

import { useEffect, useMemo, useState } from "react";
import type { HubTask } from "./operational-view";

type Workspace = { id: number; name: string; type: string; region: string; manager: string };
type Pnl = Record<string, string | number> & { workspace: string; period: string };
type Deal = Record<string, string | number> & { id: number; customer_name: string; assigned_to: string; stage: string };
type Visit = { id: number; assigned_to: string; visit_date: string; visit_status: string; update_type: string };
type Development = Record<string, string | number> & { id: number; project_name: string; site_location: string; status: string; rag_status: string };
type Sop = { id: number; title: string; workspace: string; status: string; review_date: string; workflow?: string[]; checklist?: string[] };

const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(value || 0);
const number = (value: unknown) => Number(value) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const age = (value: string) => value ? Math.max(0, Math.floor((Date.now() - new Date(`${value}T00:00:00`).getTime()) / 86400000)) : 0;
const calcPnl = (row: Pnl) => {
  const turnover = number(row.turnover), cost = number(row.cost_of_sales), gp = turnover - cost;
  const fixed = ["salaries", "rent", "security", "insurance", "systems", "other_fixed"].reduce((sum, key) => sum + number(row[key]), 0);
  const variable = ["utilities", "repairs_maintenance", "transport_delivery", "consumables", "other_variable"].reduce((sum, key) => sum + number(row[key]), 0);
  const petty = number(row.petty_cash), capex = number(row.capex), net = gp - fixed - variable - petty;
  return { turnover, cost, gp, gpPercent: turnover ? gp / turnover * 100 : 0, fixed, variable, petty, capex, net };
};

export default function ExecutiveOverview({ tasks, workspaces, navigateTo, openWorkspaces }: { tasks: HubTask[]; workspaces: Workspace[]; navigateTo: (view: string) => void; openWorkspaces: () => void }) {
  const [reports, setReports] = useState<Pnl[]>([]), [deals, setDeals] = useState<Deal[]>([]), [visits, setVisits] = useState<Visit[]>([]),
    [developments, setDevelopments] = useState<Development[]>([]), [sops, setSops] = useState<Sop[]>([]), [busy, setBusy] = useState(true),
    [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const load = async () => {
      setBusy(true);
      try {
        const responses = await Promise.all([fetch("/api/pnl"), fetch("/api/wholesale"), fetch("/api/wholesale/visits"), fetch("/api/developments"), fetch("/api/sops")]);
        const data = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
        if (responses[0].ok) setReports(data[0].reports || []);
        if (responses[1].ok) setDeals(data[1].opportunities || []);
        if (responses[2].ok) setVisits(data[2].visits || []);
        if (responses[3].ok) setDevelopments(data[3].projects || []);
        if (responses[4].ok) setSops(data[4].documents || []);
      } finally { setBusy(false); }
    };
    void load();
  }, []);

  const periods = useMemo(() => Array.from(new Set([period, ...reports.map((row) => row.period)])).sort().reverse(), [reports, period]);
  const monthReports = reports.filter((row) => row.period === period);
  const pnlRows = monthReports.map((row) => ({ row, ...calcPnl(row) })).sort((a, b) => b.net - a.net);
  const group = pnlRows.reduce((sum, row) => ({ turnover: sum.turnover + row.turnover, cost: sum.cost + row.cost, gp: sum.gp + row.gp, fixed: sum.fixed + row.fixed, variable: sum.variable + row.variable, petty: sum.petty + row.petty, capex: sum.capex + row.capex, net: sum.net + row.net }), { turnover: 0, cost: 0, gp: 0, fixed: 0, variable: 0, petty: 0, capex: 0, net: 0 });
  const gpPercent = group.turnover ? group.gp / group.turnover * 100 : 0;
  const reportingUnits = workspaces.filter((workspace) => ["Store", "Distribution Centre", "Head Office", "Wholesale"].includes(workspace.type));
  const capturedUnits = new Set(monthReports.map((row) => row.workspace));
  const reportingPercent = reportingUnits.length ? Math.round(reportingUnits.filter((unit) => capturedUnits.has(unit.name)).length / reportingUnits.length * 100) : 0;

  const openTasks = tasks.filter((task) => task.status !== "Complete"), blocked = openTasks.filter((task) => task.status === "Blocked"),
    overdue = openTasks.filter((task) => task.due && task.due < today()), high = openTasks.filter((task) => task.priority === "High");
  const taskCompletion = tasks.length ? Math.round(tasks.filter((task) => task.status === "Complete").length / tasks.length * 100) : 0;

  const activeDeals = deals.filter((deal) => !["Lost", "Delivered"].includes(String(deal.stage))),
    pipelineValue = activeDeals.reduce((sum, deal) => sum + number(deal.potential_value || deal.value), 0),
    confirmedDeals = deals.filter((deal) => Boolean(deal.order_no || deal.invoice_no) || ["Confirmed Order", "Invoiced", "Delivery Planned", "Delivered"].includes(String(deal.stage))),
    confirmedValue = confirmedDeals.reduce((sum, deal) => sum + number(deal.value), 0),
    pendingApplications = deals.filter((deal) => ["Pending approval", "Changes requested"].includes(String(deal.application_status || "Pending approval"))),
    overdueQuotes = deals.filter((deal) => deal.quotation_no && deal.quote_date && !["Accepted", "Declined"].includes(String(deal.quote_status)) && age(String(deal.quote_follow_up_date || deal.quote_date)) >= 2),
    lateDeliveries = deals.filter((deal) => (deal.order_no || deal.invoice_no) && deal.confirmed_date && !["Dispatched", "Delivered"].includes(String(deal.delivery_status)) && age(String(deal.confirmed_date)) >= 3);
  const monthVisits = visits.filter((visit) => visit.visit_date.startsWith(period) && (visit.visit_status || "Completed") === "Completed" && String(visit.update_type || "").toLowerCase().includes("visit"));
  const repNames = Array.from(new Set(deals.map((deal) => String(deal.assigned_to || "Unassigned"))));
  const repRows = repNames.map((rep) => { const rows = deals.filter((deal) => String(deal.assigned_to || "Unassigned") === rep); return { rep, customers: rows.length, visits: monthVisits.filter((visit) => visit.assigned_to === rep).length, quotes: rows.filter((deal) => deal.quotation_no).length, orders: rows.filter((deal) => deal.order_no || deal.invoice_no).length, pipeline: rows.reduce((sum, deal) => sum + number(deal.potential_value || deal.value), 0) }; }).sort((a, b) => b.pipeline - a.pipeline);

  const developmentBudget = developments.reduce((sum, project) => sum + number(project.approved_budget) + number(project.contingency_budget) + number(project.stock_budget), 0),
    developmentCommitted = developments.reduce((sum, project) => sum + number(project.committed_total), 0),
    developmentActual = developments.reduce((sum, project) => sum + number(project.actual_total), 0),
    developmentPaid = developments.reduce((sum, project) => sum + number(project.paid_total), 0),
    developmentRisks = developments.filter((project) => ["Red", "Amber"].includes(String(project.rag_status)));
  const workflowsReady = sops.filter((sop) => (sop.workflow || []).length > 0).length,
    reviewsDue = sops.filter((sop) => sop.review_date && sop.review_date <= today()).length;

  const alerts = [
    ...blocked.slice(0, 3).map((task) => ({ level: "red", title: `Blocked: ${task.title}`, detail: `${task.project} · ${task.owner || task.assignee || "Owner required"}`, view: "My Work" })),
    ...developmentRisks.slice(0, 3).map((project) => ({ level: String(project.rag_status).toLowerCase(), title: `${project.rag_status} development: ${project.project_name}`, detail: `${project.site_location || "Site"} · ${project.status}`, view: "Developments" })),
    ...overdueQuotes.slice(0, 2).map((deal) => ({ level: "amber", title: `Quote follow-up overdue: ${deal.customer_name}`, detail: `${deal.quotation_no} · ${age(String(deal.quote_follow_up_date || deal.quote_date))} days`, view: "Wholesale Division" })),
    ...lateDeliveries.slice(0, 2).map((deal) => ({ level: "red", title: `Wholesale delivery delayed: ${deal.customer_name}`, detail: String(deal.order_no || deal.invoice_no), view: "Wholesale Division" })),
  ];

  const jump = (view: string) => <button className="execJump" onClick={() => navigateTo(view)}>Open dashboard →</button>;
  return <div className="masterExecutive">
    <section className="executiveCommandBar"><span><small>GROUP EXECUTIVE COMMAND CENTRE</small><h2>PowerBuild Group Performance</h2><p>One live view across stores, financials, Wholesale, developments, people and operating controls.</p></span><label>Reporting month<select value={period} onChange={(event) => setPeriod(event.target.value)}>{periods.map((item) => <option key={item}>{item}</option>)}</select></label><button onClick={openWorkspaces}>Manage workspaces</button></section>
    {busy && <div className="executiveLoading">Loading every company dashboard…</div>}
    <section className="executiveHealthStrip">
      <article><i className="blue">R</i><span><small>Group turnover</small><b>{money(group.turnover)}</b><em>{period}</em></span></article>
      <article><i className="green">GP</i><span><small>Gross profit</small><b>{money(group.gp)}</b><em>{gpPercent.toFixed(1)}% margin</em></span></article>
      <article><i className={group.net < 0 ? "red" : "green"}>NP</i><span><small>Net operating profit</small><b>{money(group.net)}</b><em>Before development costs</em></span></article>
      <article><i className="purple">W</i><span><small>Wholesale pipeline</small><b>{money(pipelineValue)}</b><em>{activeDeals.length} active opportunities</em></span></article>
      <article><i className={developmentRisks.length ? "orange" : "green"}>D</i><span><small>Active developments</small><b>{developments.filter((project) => !["Completed", "On Hold"].includes(project.status)).length}</b><em>{developmentRisks.length} require attention</em></span></article>
      <article><i className={alerts.length ? "red" : "green"}>!</i><span><small>Executive alerts</small><b>{alerts.length}</b><em>{blocked.length} blocked tasks</em></span></article>
    </section>

    <section className="executiveOverviewGrid">
      <article className="execModule financialExecutive"><header><span><small>FINANCIAL PERFORMANCE</small><h3>Group P&amp;L</h3></span>{jump("Financials & P&L")}</header><div className="execMetrics"><span><small>Cost of sales</small><b>{money(group.cost)}</b></span><span><small>Operating expenses</small><b>{money(group.fixed + group.variable + group.petty)}</b></span><span><small>Monthly CAPEX</small><b>{money(group.capex)}</b></span><span><small>P&amp;L captured</small><b>{reportingPercent}%</b></span></div><div className="execProgress"><i style={{ width: `${reportingPercent}%` }} /><small>{monthReports.length} reports captured for {period}</small></div><div className="execMiniTable"><b>Store / workspace performance</b>{pnlRows.slice(0, 5).map((item) => <button key={item.row.workspace} onClick={() => navigateTo("Financials & P&L")}><span>{item.row.workspace}</span><em>{item.gpPercent.toFixed(1)}% GP</em><strong className={item.net < 0 ? "negative" : "positive"}>{money(item.net)}</strong></button>)}{!pnlRows.length && <p>No P&amp;L reports captured for this month.</p>}</div></article>

      <article className="execModule wholesaleExecutive"><header><span><small>WHOLESALE DIVISION</small><h3>Sales, Reps &amp; CRM</h3></span>{jump("Wholesale Division")}</header><div className="execMetrics"><span><small>Customers</small><b>{deals.length}</b></span><span><small>Confirmed sales</small><b>{money(confirmedValue)}</b></span><span><small>Rep visits</small><b>{monthVisits.length}</b></span><span><small>Pending applications</small><b>{pendingApplications.length}</b></span></div><div className="execAlertsInline"><span className={overdueQuotes.length ? "warn" : "clear"}><b>{overdueQuotes.length}</b> quotes overdue</span><span className={lateDeliveries.length ? "danger" : "clear"}><b>{lateDeliveries.length}</b> late deliveries</span></div><div className="execMiniTable"><b>Rep activity and pipeline</b>{repRows.slice(0, 5).map((rep) => <button key={rep.rep} onClick={() => navigateTo("Wholesale Division")}><span>{rep.rep}</span><em>{rep.visits} visits · {rep.quotes} quotes · {rep.orders} orders</em><strong>{money(rep.pipeline)}</strong></button>)}{!repRows.length && <p>No Wholesale rep activity captured yet.</p>}</div></article>

      <article className="execModule developmentExecutive"><header><span><small>STORE DEVELOPMENT</small><h3>New Sites &amp; Expansion</h3></span>{jump("Developments")}</header><div className="execMetrics"><span><small>Total funding</small><b>{money(developmentBudget)}</b></span><span><small>Committed</small><b>{money(developmentCommitted)}</b></span><span><small>Actual spend</small><b>{money(developmentActual)}</b></span><span><small>Paid</small><b>{money(developmentPaid)}</b></span></div><div className="execProgress"><i style={{ width: `${Math.min(100, developmentBudget ? developmentActual / developmentBudget * 100 : 0)}%` }} /><small>{money(Math.max(0, developmentBudget - developmentActual))} remaining across projects</small></div><div className="execMiniTable"><b>Development portfolio</b>{developments.slice(0, 5).map((project) => <button key={project.id} onClick={() => navigateTo("Developments")}><span>{project.project_name}</span><em>{project.status} · {number(project.progress_percent)}%</em><strong className={`rag-${String(project.rag_status).toLowerCase()}`}>{project.rag_status}</strong></button>)}{!developments.length && <p>No development projects captured yet.</p>}</div></article>

      <article className="execModule operationsExecutive"><header><span><small>GROUP EXECUTION</small><h3>Tasks &amp; Accountability</h3></span>{jump("My Work")}</header><div className="execMetrics"><span><small>Open tasks</small><b>{openTasks.length}</b></span><span><small>High priority</small><b>{high.length}</b></span><span><small>Blocked</small><b>{blocked.length}</b></span><span><small>Overdue</small><b>{overdue.length}</b></span></div><div className="execProgress"><i style={{ width: `${taskCompletion}%` }} /><small>{taskCompletion}% of all company tasks completed</small></div><div className="execMiniTable"><b>Management attention</b>{[...blocked, ...overdue.filter((task) => !blocked.includes(task))].slice(0, 5).map((task) => <button key={task.id} onClick={() => navigateTo("My Work")}><span>{task.title}</span><em>{task.project} · {task.assignee || task.owner || "Unassigned"}</em><strong className="negative">{task.status === "Blocked" ? "Blocked" : "Overdue"}</strong></button>)}{!blocked.length && !overdue.length && <p>All company tasks are moving within plan.</p>}</div></article>

      <article className="execModule controlsExecutive"><header><span><small>GOVERNANCE &amp; CONTROLS</small><h3>SOPs, Training &amp; Workspaces</h3></span>{jump("SOP & Manuals")}</header><div className="execMetrics"><span><small>SOPs &amp; manuals</small><b>{sops.length}</b></span><span><small>AI workflows ready</small><b>{workflowsReady}</b></span><span><small>Reviews due</small><b>{reviewsDue}</b></span><span><small>Company workspaces</small><b>{workspaces.length}</b></span></div><div className="execCoverage"><span><b>{new Set(sops.map((sop) => sop.workspace)).size}</b><small>workspaces with documents</small></span><span><b>{sops.reduce((sum, sop) => sum + (sop.checklist || []).length, 0)}</b><small>checklist controls</small></span><span><b>{workspaces.filter((workspace) => workspace.type === "Store").length}</b><small>stores in the Hub</small></span></div><div className="execMiniTable"><b>Latest controlled documents</b>{sops.slice(0, 4).map((sop) => <button key={sop.id} onClick={() => navigateTo("SOP & Manuals")}><span>{sop.title}</span><em>{sop.workspace}</em><strong>{(sop.workflow || []).length ? "Workflow ready" : sop.status}</strong></button>)}</div></article>

      <article className="execModule alertsExecutive"><header><span><small>EXECUTIVE EXCEPTIONS</small><h3>Items Requiring Attention</h3></span><b className="alertCount">{alerts.length}</b></header><div className="executiveAlertList">{alerts.slice(0, 8).map((alert, index) => <button key={`${alert.title}-${index}`} onClick={() => navigateTo(alert.view)}><i className={alert.level}>!</i><span><b>{alert.title}</b><small>{alert.detail}</small></span><em>Review →</em></button>)}{!alerts.length && <p className="allClearExecutive">✓ No critical executive exceptions at present.</p>}</div></article>
    </section>
  </div>;
}
