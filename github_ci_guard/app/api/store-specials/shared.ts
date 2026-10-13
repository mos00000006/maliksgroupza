import { env } from "cloudflare:workers";
import type { HubMember } from "../access";
import { allowedWorkspaces, canAccessWorkspace, canWrite } from "../access";
import { sendPushNotification } from "../push/shared";
import { initTeamTables } from "../team/shared";

export type StoreSpecialRow = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_branches: number;
  workspaces_json: string;
  active: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  upcoming_notified_at: string;
  started_notified_at: string;
};

type TeamRecipient = {
  email: string;
  role: string;
  department: string;
  access_scope: string;
  workspace_access: string;
};

export async function initStoreSpecialTables() {
  await initTeamTables();
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_specials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      all_branches INTEGER NOT NULL DEFAULT 0,
      workspaces_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      upcoming_notified_at TEXT NOT NULL DEFAULT '',
      started_notified_at TEXT NOT NULL DEFAULT ''
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_store_specials_dates ON store_specials(active,start_date,end_date)",
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS store_special_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      special_id INTEGER NOT NULL,
      object_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      content_type TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS idx_store_special_images_special ON store_special_images(special_id,sort_order,id)",
    ),
  ]);
}

export function saDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function parseSpecialWorkspaces(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)))
      : [];
  } catch {
    return [];
  }
}

export function canManageStoreSpecials(member: HubMember | null | undefined) {
  if (!member || !canWrite(member)) return false;
  return [
    "Owner / Admin",
    "Developer / Technical Admin",
    "Executive / EXCO",
    "Regional Manager",
    "Store Manager",
  ].includes(member.role);
}

export function canSelectAllBranches(member: HubMember | null | undefined) {
  return allowedWorkspaces(member) === null;
}

export function memberCanSeeStoreSpecial(
  member: HubMember | null | undefined,
  special: Pick<StoreSpecialRow, "all_branches" | "workspaces_json">,
) {
  if (!member) return false;
  if (Number(special.all_branches) === 1) return true;
  const targets = parseSpecialWorkspaces(special.workspaces_json);
  return targets.some((workspace) => canAccessWorkspace(member, workspace));
}

export async function listStoreBranches(member: HubMember) {
  const { results } = await env.DB.prepare(
    `SELECT id,name,type,region,manager
     FROM workspaces
     WHERE active=1
     ORDER BY name`,
  ).all<Record<string, string | number | null>>();

  // Use the complete ACTIVE branch register. Some real stores were created
  // with different or blank workspace type labels, so do not require
  // type='Store'. Only remove locations that are clearly not retail branches.
  const nonBranchPattern =
    /(head\s*office|wholesale|distribution\s*centre|distribution\s*center|\bdc\b|developments?)/i;

  const branches = results.filter((row) => {
    const name = String(row.name || "").trim();
    const type = String(row.type || "").trim();
    if (!name) return false;
    return !nonBranchPattern.test(`${name} ${type}`);
  });

  const allowed = allowedWorkspaces(member);

  // Full-company users see every active branch.
  if (allowed === null) return branches;

  // Assigned-store / regional users see only the branches already assigned
  // to them through normal Hub workspace access.
  const normalisedAllowed = new Set(
    allowed.map((name) => name.trim().toLowerCase()).filter(Boolean),
  );

  return branches.filter((row) =>
    normalisedAllowed.has(String(row.name || "").trim().toLowerCase()),
  );
}

function recipientWorkspaceAccess(recipient: TeamRecipient) {
  if (
    recipient.role === "Owner / Admin" ||
    recipient.role === "Developer / Technical Admin" ||
    (recipient.role === "Executive / EXCO" && recipient.access_scope === "Full company")
  )
    return null;

  let parsed: string[] = [];
  try {
    const value = JSON.parse(recipient.workspace_access || "[]");
    if (Array.isArray(value))
      parsed = value.map((item) => String(item).trim()).filter(Boolean);
  } catch {}

  if (recipient.access_scope === "Assigned workspace")
    return parsed.slice(0, 1).length ? parsed.slice(0, 1) : [recipient.department].filter(Boolean);
  return parsed.length ? parsed : [recipient.department].filter(Boolean);
}

function recipientMatchesSpecial(recipient: TeamRecipient, special: StoreSpecialRow) {
  if (Number(special.all_branches) === 1) return true;
  const allowed = recipientWorkspaceAccess(recipient);
  if (allowed === null) return true;
  const targets = parseSpecialWorkspaces(special.workspaces_json).map((item) => item.toLowerCase());
  return allowed.some((item) => targets.includes(item.trim().toLowerCase()));
}

function formatDate(date: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00+02:00`);
  return parsed.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function locationSummary(special: StoreSpecialRow) {
  if (Number(special.all_branches) === 1) return "All PowerBuild branches";
  const targets = parseSpecialWorkspaces(special.workspaces_json);
  if (targets.length === 1) return targets[0];
  if (targets.length === 2) return `${targets[0]} and ${targets[1]}`;
  return `${targets.length} selected branches`;
}

async function activeRecipients() {
  const { results } = await env.DB.prepare(
    `SELECT email,role,department,access_scope,workspace_access
     FROM team_members
     WHERE active=1
       AND role<>'Human Resource (HR)'
       AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'`,
  ).all<TeamRecipient>();
  return results;
}

async function createSpecialNotification(
  recipientEmail: string,
  special: StoreSpecialRow,
  kind: "StoreSpecialUpcoming" | "StoreSpecialStarted",
) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return;

  const upcoming = kind === "StoreSpecialUpcoming";
  const title = upcoming
    ? `Upcoming special: ${special.title}`
    : `Special started: ${special.title}`;
  const location = locationSummary(special);
  const message = upcoming
    ? `${location} will run "${special.title}" from ${formatDate(special.start_date)} to ${formatDate(special.end_date)}.`
    : `"${special.title}" has started at ${location} and runs until ${formatDate(special.end_date)}.`;

  const taskId = -2000000000 - Number(special.id);
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO notifications
      (recipient_email,task_id,title,message,notification_type,read_at,created_at)
     VALUES (?,?,?,?,?,'',?)`,
  )
    .bind(email, taskId, title, message, kind, createdAt)
    .run();

  const unread = await env.DB.prepare(
    `SELECT COUNT(*) AS unread_count
     FROM notifications
     WHERE recipient_email=? AND (read_at='' OR read_at IS NULL)`,
  )
    .bind(email)
    .first<{ unread_count: number }>();

  await sendPushNotification(email, {
    title,
    body: message,
    taskId,
    unreadCount: Number(unread?.unread_count || 1),
    url: `/?view=${encodeURIComponent("Store Specials")}&special=${special.id}`,
  });
}

async function sendToRelevantRecipients(
  special: StoreSpecialRow,
  kind: "StoreSpecialUpcoming" | "StoreSpecialStarted",
) {
  const recipients = (await activeRecipients()).filter((recipient) =>
    recipientMatchesSpecial(recipient, special),
  );
  await Promise.all(
    recipients.map((recipient) =>
      createSpecialNotification(recipient.email, special, kind),
    ),
  );
}

export async function notifyUpcomingStoreSpecial(specialId: number) {
  await initStoreSpecialTables();
  const today = saDateString();
  const row = await env.DB.prepare(
    `SELECT *
     FROM store_specials
     WHERE id=? AND active=1
       AND start_date>?
       AND (upcoming_notified_at='' OR upcoming_notified_at IS NULL)`,
  )
    .bind(specialId, today)
    .first<StoreSpecialRow>();
  if (!row) return false;

  try {
    await sendToRelevantRecipients(row, "StoreSpecialUpcoming");
    await env.DB.prepare(
      "UPDATE store_specials SET upcoming_notified_at=? WHERE id=? AND active=1",
    )
      .bind(new Date().toISOString(), specialId)
      .run();
    return true;
  } catch (error) {
    console.error("Upcoming store-special notification failed", error);
    return false;
  }
}

export async function syncStoreSpecialLifecycleNotifications() {
  await initStoreSpecialTables();
  const today = saDateString();
  const { results } = await env.DB.prepare(
    `SELECT *
     FROM store_specials
     WHERE active=1
       AND start_date<=?
       AND end_date>=?
       AND (started_notified_at='' OR started_notified_at IS NULL)
     ORDER BY start_date,id`,
  )
    .bind(today, today)
    .all<StoreSpecialRow>();

  for (const special of results) {
    try {
      await sendToRelevantRecipients(special, "StoreSpecialStarted");
      await env.DB.prepare(
        `UPDATE store_specials
         SET started_notified_at=?
         WHERE id=? AND active=1
           AND (started_notified_at='' OR started_notified_at IS NULL)`,
      )
        .bind(new Date().toISOString(), special.id)
        .run();
    } catch (error) {
      console.error(`Store-special start notification failed for ${special.id}`, error);
    }
  }
}
