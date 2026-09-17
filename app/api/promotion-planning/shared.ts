import { env } from "cloudflare:workers";
import type { HubMember } from "../access";
import { allowedWorkspaces, canWrite } from "../access";
import { sendPushNotification } from "../push/shared";
import { initTeamTables } from "../team/shared";
import { listStoreBranches } from "../store-specials/shared";

export type PromotionPlanRow = {
  id: number;
  title: string;
  promo_start: string;
  promo_end: string;
  input_deadline: string;
  brief: string;
  status: string;
  branches_json: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type TeamRecipient = {
  email: string;
  role: string;
  department: string;
  access_scope: string;
  workspace_access: string;
};

export async function initPromotionPlanningTables() {
  await initTeamTables();
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      promo_start TEXT NOT NULL DEFAULT '',
      promo_end TEXT NOT NULL DEFAULT '',
      input_deadline TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Open',
      branches_json TEXT NOT NULL DEFAULT '[]',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      product_code TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      brand_supplier TEXT NOT NULL DEFAULT '',
      current_price TEXT NOT NULL DEFAULT '',
      proposed_price TEXT NOT NULL DEFAULT '',
      expected_qty TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      competitor_note TEXT NOT NULL DEFAULT '',
      display_idea TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Suggested',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suggestion_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      support TEXT NOT NULL DEFAULT 'Yes',
      comment TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_feedback_user ON promotion_feedback(suggestion_id,created_by)",
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT 'General',
      comment TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_promotion_suggestions_plan ON promotion_suggestions(plan_id,id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_promotion_comments_plan ON promotion_comments(plan_id,id)"),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      topic TEXT NOT NULL,
      proposal TEXT NOT NULL,
      rationale TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Proposed',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_decision_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      vote TEXT NOT NULL DEFAULT 'Support',
      comment TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_decision_vote_user ON promotion_decision_votes(decision_id,created_by)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_promotion_decisions_plan ON promotion_decisions(plan_id,id)",
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_planning_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      branch TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_promotion_activity_plan ON promotion_planning_activity(plan_id,id)",
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS promotion_planning_reads (
      email TEXT PRIMARY KEY,
      last_seen_at TEXT NOT NULL
    )`),
  ]);
}

export function parseBranches(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)))
      : [];
  } catch {
    return [];
  }
}

export function canManagePromotionPlanning(member: HubMember | null | undefined) {
  if (!member || !canWrite(member)) return false;
  const fullCompany = allowedWorkspaces(member) === null;
  return fullCompany && [
    "Owner / Admin",
    "Developer / Technical Admin",
    "Executive / EXCO",
  ].includes(member.role);
}

export function canContributePromotionPlanning(member: HubMember | null | undefined) {
  if (!member || !canWrite(member)) return false;
  return [
    "Owner / Admin",
    "Developer / Technical Admin",
    "Executive / EXCO",
    "Regional Manager",
    "Store Manager",
    "Department Manager",
  ].includes(member.role);
}

export async function contributionBranches(member: HubMember) {
  const rows = await listStoreBranches(member);
  return rows.map((row) => String(row.name || "")).filter(Boolean);
}

function recipientBranches(recipient: TeamRecipient) {
  if (
    recipient.role === "Owner / Admin" ||
    recipient.role === "Developer / Technical Admin" ||
    (recipient.role === "Executive / EXCO" && recipient.access_scope === "Full company")
  ) return null;

  let parsed: string[] = [];
  try {
    const value = JSON.parse(recipient.workspace_access || "[]");
    if (Array.isArray(value)) parsed = value.map(String).map((v) => v.trim()).filter(Boolean);
  } catch {}

  if (recipient.access_scope === "Assigned workspace")
    return parsed.slice(0, 1).length ? parsed.slice(0, 1) : [recipient.department].filter(Boolean);
  return parsed.length ? parsed : [recipient.department].filter(Boolean);
}

async function planningRecipients(targetBranches?: string[]) {
  const { results } = await env.DB.prepare(
    `SELECT email,role,department,access_scope,workspace_access
     FROM team_members
     WHERE active=1
       AND role IN ('Owner / Admin','Developer / Technical Admin','Executive / EXCO','Regional Manager','Store Manager','Department Manager')
       AND role<>'Human Resource (HR)'
       AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'`,
  ).all<TeamRecipient>();

  if (!targetBranches?.length) return results;
  const wanted = new Set(targetBranches.map((b) => b.toLowerCase()));
  return results.filter((recipient) => {
    const branches = recipientBranches(recipient);
    return branches === null || branches.some((b) => wanted.has(b.toLowerCase()));
  });
}

async function pushPlanningNotification(
  recipientEmail: string,
  planId: number,
  title: string,
  message: string,
  type: string,
) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return;
  const createdAt = new Date().toISOString();
  const taskId = -3000000000 - planId;

  await env.DB.prepare(
    `INSERT INTO notifications
      (recipient_email,task_id,title,message,notification_type,read_at,created_at)
     VALUES (?,?,?,?,?,'',?)`,
  ).bind(email, taskId, title, message, type, createdAt).run();

  const unread = await env.DB.prepare(
    `SELECT COUNT(*) AS unread_count FROM notifications
     WHERE recipient_email=? AND (read_at='' OR read_at IS NULL)`,
  ).bind(email).first<{ unread_count: number }>();

  try {
    await sendPushNotification(email, {
      title,
      body: message,
      taskId,
      unreadCount: Number(unread?.unread_count || 1),
      url: `/?view=${encodeURIComponent("Store Specials")}&promotionPlanning=1`,
    });
  } catch (error) {
    console.error("Promotion planning push failed", error);
  }
}

export async function recordPromotionPlanningActivity(
  planId: number,
  activityType: string,
  branch: string,
  summary: string,
  createdBy: string,
) {
  await env.DB.prepare(
    `INSERT INTO promotion_planning_activity
      (plan_id,activity_type,branch,summary,created_by,created_at)
     VALUES (?,?,?,?,?,?)`,
  )
    .bind(
      planId,
      activityType,
      branch || "",
      summary,
      createdBy.toLowerCase(),
      new Date().toISOString(),
    )
    .run();
}

export async function unreadPromotionPlanningActivity(email: string) {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return 0;

  const read = await env.DB.prepare(
    "SELECT last_seen_at FROM promotion_planning_reads WHERE email=?",
  )
    .bind(normalised)
    .first<{ last_seen_at: string }>();

  const lastSeen = read?.last_seen_at || "1970-01-01T00:00:00.000Z";
  const result = await env.DB.prepare(
    `SELECT COUNT(*) AS total
     FROM promotion_planning_activity
     WHERE created_at>?
       AND lower(created_by)<>?`,
  )
    .bind(lastSeen, normalised)
    .first<{ total: number }>();

  return Number(result?.total || 0);
}

export async function markPromotionPlanningSeen(email: string) {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return;
  await env.DB.prepare(
    `INSERT INTO promotion_planning_reads(email,last_seen_at)
     VALUES (?,?)
     ON CONFLICT(email) DO UPDATE SET last_seen_at=excluded.last_seen_at`,
  )
    .bind(normalised, new Date().toISOString())
    .run();
}

export async function notifyPlanningOpened(plan: PromotionPlanRow) {
  const recipients = await planningRecipients(parseBranches(plan.branches_json));
  const message = plan.input_deadline
    ? `Add your branch ideas and decisions for "${plan.title}" by ${plan.input_deadline}.`
    : `Join "${plan.title}" and add your branch ideas, proposals and product suggestions.`;
  await Promise.all(
    recipients.map((recipient) =>
      pushPlanningNotification(
        recipient.email,
        plan.id,
        `Next promotion planning: ${plan.title}`,
        message,
        "PromotionPlanningOpened",
      ),
    ),
  );
}

export async function notifyOutstandingBranches(plan: PromotionPlanRow, outstanding: string[]) {
  if (!outstanding.length) return;
  const recipients = await planningRecipients(outstanding);
  const message = plan.input_deadline
    ? `Your branch input is still required for "${plan.title}". Please contribute before ${plan.input_deadline}.`
    : `Your branch input is still required for "${plan.title}". Please add your ideas, votes or comments.`;
  await Promise.all(
    recipients.map((recipient) =>
      pushPlanningNotification(
        recipient.email,
        plan.id,
        `Promotion planning reminder: ${plan.title}`,
        message,
        "PromotionPlanningReminder",
      ),
    ),
  );
}
