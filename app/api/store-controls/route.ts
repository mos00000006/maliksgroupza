import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { allowedWorkspaces, canAccessWorkspace, canWrite, getHubMember } from "../access";
import { initStoreControlTables } from "./shared";

type AuditSection = { name?: string; score?: number; comment?: string };
type ChecklistItem = { name?: string; status?: string; comment?: string };
type DbRow = Record<string, string | number | null>;

const clamp = (value: unknown, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const parseJsonArray = <T,>(value: unknown): T[] => {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
// Store operating dates follow South Africa Standard Time (UTC+02:00),
// not the Cloudflare Worker/UTC clock, so a checklist saved after midnight
// appears against the correct local trading date.
const isoDate = (date = new Date()) => new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
const operatingDays = (days: number) => {
  const out: string[] = [];
  const d = new Date(`${isoDate()}T12:00:00Z`);
  while (out.length < days) {
    if (d.getUTCDay() !== 0) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
};

async function accessibleStores() {
  const member = await getHubMember();
  if (!member) return { member: null, stores: [] as DbRow[] };
  const { results } = await env.DB.prepare(
    "SELECT id,name,type,region,manager FROM workspaces WHERE active=1 AND type='Store' ORDER BY name",
  ).all<DbRow>();
  const allowed = allowedWorkspaces(member);
  return {
    member,
    stores: allowed === null ? results : results.filter((row) => canAccessWorkspace(member, String(row.name || ""))),
  };
}

function buildRanking(stores: DbRow[], audits: DbRow[], checklists: DbRow[], tasks: DbRow[]) {
  const today = isoDate();
  const lastOperatingDays = operatingDays(7);
  return stores.map((store) => {
    const workspace = String(store.name || "");
    const storeAudits = audits
      .filter((row) => String(row.workspace) === workspace)
      .sort((a, b) => `${b.audit_date}-${b.id}`.localeCompare(`${a.audit_date}-${a.id}`));
    const latestAudit = storeAudits[0];
    const auditScore = latestAudit ? clamp(latestAudit.score) : 0;

    const recentChecklists = checklists.filter(
      (row) => String(row.workspace) === workspace &&
        String(row.manager_signoff || "").trim() !== "" &&
        lastOperatingDays.includes(String(row.checklist_date)),
    );
    const checklistByDay = new Map(recentChecklists.map((row) => [String(row.checklist_date), clamp(row.compliance_percent)]));
    const checklistScore = Math.round(
      lastOperatingDays.reduce((sum, day) => sum + (checklistByDay.get(day) || 0), 0) / lastOperatingDays.length,
    );

    const storeTasks = tasks.filter((row) => String(row.project) === workspace);
    const completedTasks = storeTasks.filter((row) => String(row.status) === "Complete").length;
    const taskScore = storeTasks.length ? Math.round((completedTasks / storeTasks.length) * 100) : 100;

    const openCorrectives = storeAudits.filter(
      (row) => String(row.corrective_action || "").trim() && String(row.corrective_status || "Open") !== "Closed",
    );
    const overdueCorrectives = openCorrectives.filter(
      (row) => String(row.corrective_due || "") && String(row.corrective_due) < today,
    );
    const correctiveScore = storeAudits.length
      ? Math.max(0, 100 - overdueCorrectives.length * 25 - Math.max(0, openCorrectives.length - overdueCorrectives.length) * 5)
      : 0;

    const score = Math.round(auditScore * 0.35 + checklistScore * 0.3 + correctiveScore * 0.1 + taskScore * 0.25);
    const dataCoverage = (latestAudit ? 45 : 0) + (recentChecklists.length ? 30 : 0) + (storeTasks.length ? 25 : 0);
    const todayChecklist = checklists.find((row) => String(row.workspace) === workspace &&
      String(row.checklist_date) === today && String(row.manager_signoff || "").trim() !== "");
    const status = dataCoverage < 45 ? "Setup required" : score >= 85 ? "Green" : score >= 70 ? "Amber" : "Red";
    return {
      workspace,
      region: String(store.region || "Unassigned"),
      manager: String(store.manager || ""),
      score,
      status,
      dataCoverage,
      auditScore: Math.round(auditScore),
      latestAuditDate: latestAudit ? String(latestAudit.audit_date) : "",
      checklistScore,
      checklistEntries: recentChecklists.length,
      todayChecklist: todayChecklist ? Math.round(Number(todayChecklist.compliance_percent) || 0) : null,
      taskScore,
      taskCount: storeTasks.length,
      openCorrectives: openCorrectives.length,
      overdueCorrectives: overdueCorrectives.length,
    };
  }).sort((a, b) => {
    const aSetup = a.status === "Setup required" ? 1 : 0;
    const bSetup = b.status === "Setup required" ? 1 : 0;
    return aSetup - bSetup || b.score - a.score || a.workspace.localeCompare(b.workspace);
  });
}

export async function GET() {
  await initStoreControlTables();
  const { member, stores } = await accessibleStores();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const storeNames = new Set(stores.map((row) => String(row.name)));
  const [auditQuery, checklistQuery, taskQuery, attachmentQuery] = await Promise.all([
    env.DB.prepare("SELECT * FROM store_audits ORDER BY audit_date DESC,id DESC").all<DbRow>(),
    env.DB.prepare("SELECT * FROM daily_manager_checklists ORDER BY checklist_date DESC,id DESC").all<DbRow>(),
    env.DB.prepare("SELECT id,project,status,priority,due FROM tasks").all<DbRow>(),
    env.DB.prepare("SELECT id,record_type,record_id,workspace,name,type,size,uploaded_by,created_at FROM store_control_attachments ORDER BY id DESC").all<DbRow>(),
  ]);
  const rawAudits = auditQuery.results.filter((row) => storeNames.has(String(row.workspace)));
  const rawChecklists = checklistQuery.results.filter((row) => storeNames.has(String(row.workspace)));
  const audits: Array<DbRow & { sections: AuditSection[] }> = rawAudits
    .map((row) => ({ ...row, sections: parseJsonArray<AuditSection>(row.sections_json) }));
  const checklists: Array<DbRow & { items: ChecklistItem[]; record_status: "Draft" | "Finalized" }> = rawChecklists
    .map((row) => ({
      ...row,
      items: parseJsonArray<ChecklistItem>(row.items_json),
      record_status: String(row.manager_signoff || "").trim() ? "Finalized" as const : "Draft" as const,
    }));
  const tasks = taskQuery.results.filter((row) => storeNames.has(String(row.project)));
  const attachments = attachmentQuery.results.filter((row) => storeNames.has(String(row.workspace)));
  const ranking = buildRanking(stores, rawAudits, rawChecklists, tasks);
  const today = isoDate();
  return Response.json({
    stores,
    audits,
    checklists,
    attachments,
    ranking,
    canWrite: canWrite(member),
    today,
    summary: {
      stores: stores.length,
      auditedStores: new Set(audits.map((row) => String(row.workspace))).size,
      todayChecklists: checklists.filter((row) => String(row.checklist_date) === today && row.record_status === "Finalized").length,
      overdueCorrectives: ranking.reduce((sum, row) => sum + row.overdueCorrectives, 0),
      averageScore: (() => {
        const rated = ranking.filter((row) => row.dataCoverage >= 45);
        return rated.length ? Math.round(rated.reduce((sum, row) => sum + row.score, 0) / rated.length) : 0;
      })(),
    },
  });
}

export async function POST(req: Request) {
  await initStoreControlTables();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const user = await getAuthenticatedUser();
  const payload = (await req.json()) as Record<string, unknown>;
  const type = String(payload.type || "");
  const workspace = String(payload.workspace || "").trim();
  if (!workspace || !canAccessWorkspace(member, workspace))
    return Response.json({ error: "You do not have access to this store." }, { status: 403 });
  const store = await env.DB.prepare("SELECT id FROM workspaces WHERE active=1 AND type='Store' AND name=?")
    .bind(workspace)
    .first();
  if (!store) return Response.json({ error: "A valid store is required." }, { status: 400 });
  const now = new Date().toISOString();
  const createdBy = user?.email || member?.email || "Hub user";

  if (type === "audit") {
    const sections = Array.isArray(payload.sections) ? (payload.sections as AuditSection[]) : [];
    if (!sections.length) return Response.json({ error: "Audit sections are required." }, { status: 400 });
    const scores = sections.map((section) => clamp(section.score, 0, 5));
    const score = Math.round((scores.reduce((sum, value) => sum + value, 0) / (scores.length * 5)) * 100);
    const audit = await env.DB.prepare(`INSERT INTO store_audits (
      workspace,audit_date,audit_type,auditor,sections_json,score,findings,corrective_action,responsible_person,corrective_due,corrective_status,manager_signoff,created_by,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`)
      .bind(
        workspace,
        String(payload.auditDate || isoDate()),
        String(payload.auditType || "Routine"),
        String(payload.auditor || user?.displayName || member?.name || "Auditor"),
        JSON.stringify(sections.map((section) => ({
          name: String(section.name || ""),
          score: clamp(section.score, 0, 5),
          comment: String(section.comment || ""),
        }))),
        score,
        String(payload.findings || ""),
        String(payload.correctiveAction || ""),
        String(payload.responsiblePerson || ""),
        String(payload.correctiveDue || ""),
        String(payload.correctiveAction || "").trim() ? "Open" : "Closed",
        String(payload.managerSignoff || ""),
        createdBy,
        now,
        now,
      )
      .first<DbRow>();
    return Response.json({ audit: { ...audit, sections } }, { status: 201 });
  }

  if (type === "checklist") {
    const mode = String(payload.mode || "finalize");
    if (!["draft", "finalize"].includes(mode))
      return Response.json({ error: "Choose Save Progress or Finalise Checklist." }, { status: 400 });

    const checklistDate = String(payload.checklistDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checklistDate) ||
        !Number.isFinite(Date.parse(`${checklistDate}T12:00:00Z`)) ||
        new Date(`${checklistDate}T12:00:00Z`).toISOString().slice(0, 10) !== checklistDate)
      return Response.json({ error: "Choose a valid checklist date." }, { status: 400 });

    const manager = String(payload.manager || user?.displayName || member?.name || "").trim();
    const signoff = String(payload.managerSignoff || "").trim();
    const notes = String(payload.notes || "").trim();
    if (!manager || manager.length > 150 || notes.length > 4000 || signoff.length > 150)
      return Response.json({ error: "Enter a manager name and keep notes within the allowed length." }, { status: 400 });

    const rawItems = Array.isArray(payload.items) ? (payload.items as ChecklistItem[]) : [];
    if (!rawItems.length || rawItems.length > 64)
      return Response.json({ error: "Checklist items are required." }, { status: 400 });
    const items = rawItems.map((item) => ({
      name: String(item.name || "").trim(),
      status: String(item.status || "").trim(),
      comment: String(item.comment || "").trim(),
    }));
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.name || item.name.length > 250 || item.comment.length > 2000 ||
          seen.has(item.name) || !["", "Done", "Issue", "N/A"].includes(item.status))
        return Response.json({ error: "Invalid checklist item. Review the checklist and retry." }, { status: 400 });
      seen.add(item.name);
    }

    if (mode === "finalize") {
      if (!signoff) return Response.json({ error: "Enter the manager sign-off to finalise the checklist." }, { status: 400 });
      if (items.some((item) => !item.status))
        return Response.json({ error: "Select Done, Issue or N/A for every item before finalising." }, { status: 400 });
      const missingComment = items.find((item) => item.status === "Issue" && !item.comment);
      if (missingComment) return Response.json({
        error: `Add a comment explaining the issue: ${missingComment.name}`,
      }, { status: 400 });
    }

    const previous = await env.DB.prepare(
      "SELECT id,manager_signoff FROM daily_manager_checklists WHERE workspace=? AND checklist_date=? LIMIT 1",
    ).bind(workspace, checklistDate).first<{ id: number; manager_signoff: string }>();
    if (mode === "draft" && String(previous?.manager_signoff || "").trim())
      return Response.json({
        error: "This checklist has already been finalised. It cannot be replaced with an unfinished draft.",
      }, { status: 409 });

    const applicable = items.filter((item) => item.status !== "N/A" && item.status !== "");
    const done = applicable.filter((item) => item.status === "Done").length;
    const issues = applicable.filter((item) => item.status === "Issue").length;
    const compliance = applicable.length ? Math.round((done / applicable.length) * 100) : 0;
    // No sign-off is recorded on an in-progress checklist.
    const savedSignoff = mode === "finalize" ? signoff : "";
    let checklist: DbRow | null = null;
    try {
      checklist = await env.DB.prepare(`INSERT INTO daily_manager_checklists (
      workspace,checklist_date,manager,items_json,compliance_percent,issues_count,notes,manager_signoff,created_by,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(workspace,checklist_date) DO UPDATE SET
      manager=excluded.manager,items_json=excluded.items_json,compliance_percent=excluded.compliance_percent,
      issues_count=excluded.issues_count,notes=excluded.notes,manager_signoff=excluded.manager_signoff,
      updated_at=excluded.updated_at
    WHERE daily_manager_checklists.manager_signoff='' OR excluded.manager_signoff<>''
    RETURNING *`)
      .bind(
        workspace,
        checklistDate,
        manager,
        JSON.stringify(items),
        compliance,
        issues,
        notes,
        savedSignoff,
        createdBy,
        now,
        now,
      )
      .first<DbRow>();
    } catch (error) {
      console.error("Daily checklist database save failed:", error);
      return Response.json({
        error: "The Daily Checklist database could not save this record. Please retry or contact your Hub administrator.",
      }, { status: 503 });
    }
    if (!checklist?.id)
      return Response.json({
        error: mode === "draft"
          ? "This checklist has already been finalised. Refresh the page before making changes."
          : "The checklist was not confirmed as saved. Please retry.",
      }, { status: mode === "draft" ? 409 : 503 });

    return Response.json({
      checklist: { ...checklist, items, record_status: mode === "finalize" ? "Finalized" : "Draft" },
      saved: true,
      message: mode === "draft" ? "Checklist progress saved." : "Daily checklist finalised.",
    }, { status: 200 });
  }

  return Response.json({ error: "Unknown store control record type." }, { status: 400 });
}

export async function PATCH(req: Request) {
  await initStoreControlTables();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const payload = (await req.json()) as Record<string, unknown>;
  const type = String(payload.type || "");
  const id = Number(payload.id || 0);
  if (!id) return Response.json({ error: "Record ID required." }, { status: 400 });
  if (type === "audit") {
    const audit = await env.DB.prepare("SELECT workspace FROM store_audits WHERE id=?").bind(id).first<{ workspace: string }>();
    if (!audit || !canAccessWorkspace(member, audit.workspace))
      return Response.json({ error: "Audit not found or access denied." }, { status: 404 });
    const status = String(payload.correctiveStatus || "Open") === "Closed" ? "Closed" : "Open";
    const updated = await env.DB.prepare("UPDATE store_audits SET corrective_status=?,updated_at=? WHERE id=? RETURNING *")
      .bind(status, new Date().toISOString(), id)
      .first<DbRow>();
    return Response.json({ audit: updated });
  }
  return Response.json({ error: "Unsupported update." }, { status: 400 });
}
