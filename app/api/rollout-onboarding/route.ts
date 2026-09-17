import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import {
  allowedWorkspaces,
  canManageAccess,
  getHubMember,
  type HubMember,
} from "../access";
import { sendPushNotification } from "../push/shared";
import { initTeamTables } from "../team/shared";

const HUMAN_RESOURCE_ROLE = "Human Resource (HR)";
const REMINDER_TASK_ID = -920000000;

type OnboardingRow = {
  email: string;
  installed_app: number;
  notifications_enabled: number;
  role_confirmed: number;
  training_complete: number;
  completed_at: string;
  started_at: string;
  last_seen_at: string;
  last_reminded_at: string;
  device_label: string;
  updated_at: string;
};

type TeamRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  active: number;
  access_scope: string;
  workspace_access: string;
  invite_status: string;
};

async function tableExists(name: string) {
  const row = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
  )
    .bind(name)
    .first<{ name: string }>();
  return Boolean(row?.name);
}

function parseWorkspaceAccess(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function notificationsRequired(role: string) {
  return role !== HUMAN_RESOURCE_ROLE;
}

async function initOnboardingTables() {
  await initTeamTables();

  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS rollout_onboarding (
      email TEXT PRIMARY KEY,
      installed_app INTEGER NOT NULL DEFAULT 0,
      notifications_enabled INTEGER NOT NULL DEFAULT 0,
      role_confirmed INTEGER NOT NULL DEFAULT 0,
      training_complete INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL DEFAULT '',
      last_seen_at TEXT NOT NULL DEFAULT '',
      last_reminded_at TEXT NOT NULL DEFAULT '',
      device_label TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS rollout_onboarding_completed_idx ON rollout_onboarding(completed_at)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS rollout_onboarding_seen_idx ON rollout_onboarding(last_seen_at)",
    ),
  ]);
}

async function getPushDeviceCount(email: string) {
  if (!(await tableExists("push_subscriptions"))) return 0;
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS total
       FROM push_subscriptions
       WHERE lower(recipient_email)=?`,
    )
      .bind(email.toLowerCase())
      .first<{ total: number }>();
    return Number(row?.total || 0);
  } catch {
    return 0;
  }
}

async function getSelfMember() {
  return getHubMember({ allowEmployeeRecordsOnly: true });
}

async function getAdminMember() {
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  return member && canManageAccess(member) ? member : null;
}

async function ensureOnboarding(email: string) {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO rollout_onboarding(email,updated_at)
     VALUES (?,?)
     ON CONFLICT(email) DO NOTHING`,
  )
    .bind(email.toLowerCase(), now)
    .run();
}

function memberWorkspaces(member: HubMember) {
  const scope = allowedWorkspaces(member);
  return scope === null ? ["Full Company"] : scope;
}

async function loadSelfStatus(member: HubMember) {
  const email = member.email.toLowerCase();
  await ensureOnboarding(email);

  const pushDevices = await getPushDeviceCount(email);
  const notifyRequired = notificationsRequired(member.role);

  await env.DB.prepare(
    `UPDATE rollout_onboarding
     SET notifications_enabled=?,
         last_seen_at=?,
         updated_at=?
     WHERE email=?`,
  )
    .bind(
      pushDevices > 0 ? 1 : 0,
      new Date().toISOString(),
      new Date().toISOString(),
      email,
    )
    .run();

  const status = await env.DB.prepare(
    "SELECT * FROM rollout_onboarding WHERE email=?",
  )
    .bind(email)
    .first<OnboardingRow>();

  const installed = Boolean(status?.installed_app);
  const roleConfirmed = Boolean(status?.role_confirmed);
  const trainingComplete = Boolean(status?.training_complete);
  const notificationsReady = !notifyRequired || pushDevices > 0;
  const ready =
    installed &&
    roleConfirmed &&
    trainingComplete &&
    notificationsReady;

  if (ready && !status?.completed_at) {
    await env.DB.prepare(
      `UPDATE rollout_onboarding
       SET completed_at=?,updated_at=?
       WHERE email=?`,
    )
      .bind(new Date().toISOString(), new Date().toISOString(), email)
      .run();
  }

  const refreshed = await env.DB.prepare(
    "SELECT * FROM rollout_onboarding WHERE email=?",
  )
    .bind(email)
    .first<OnboardingRow>();

  return {
    member: {
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      access_scope: member.access_scope,
      workspaces: memberWorkspaces(member),
    },
    status: {
      installed_app: Boolean(refreshed?.installed_app),
      notifications_enabled: pushDevices > 0,
      notifications_required: notifyRequired,
      push_devices: pushDevices,
      role_confirmed: Boolean(refreshed?.role_confirmed),
      training_complete: Boolean(refreshed?.training_complete),
      completed: ready,
      completed_at: ready ? String(refreshed?.completed_at || "") : "",
      started_at: String(refreshed?.started_at || ""),
      last_seen_at: String(refreshed?.last_seen_at || ""),
      last_reminded_at: String(refreshed?.last_reminded_at || ""),
      device_label: String(refreshed?.device_label || ""),
    },
  };
}

async function sendReminder(
  admin: HubMember,
  target: { name: string; email: string; role: string },
) {
  const email = target.email.trim().toLowerCase();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO notifications
      (recipient_email,task_id,title,message,notification_type,read_at,created_at)
     VALUES (?,?,?,?,'OnboardingReminder','',?)`,
  )
    .bind(
      email,
      REMINDER_TASK_ID,
      "Complete your PowerBuild Hub setup",
      "Finish your Hub setup: install the app, confirm your access, complete the quick guide and enable notifications where required.",
      now,
    )
    .run();

  try {
    await sendPushNotification(email, {
      title: "Complete your PowerBuild Hub setup",
      body: "Finish your installation and onboarding so your PowerBuild Hub is ready.",
      taskId: REMINDER_TASK_ID,
      unreadCount: 1,
      url: "/?onboarding=1",
    });
  } catch (error) {
    console.error("Onboarding reminder push failed", error);
  }

  await ensureOnboarding(email);
  await env.DB.prepare(
    `UPDATE rollout_onboarding
     SET last_reminded_at=?,updated_at=?
     WHERE email=?`,
  )
    .bind(now, now, email)
    .run();

  try {
    if (await tableExists("system_audit_log")) {
      await env.DB.prepare(
        `INSERT INTO system_audit_log
          (actor_email,actor_name,action,target_type,target_id,details_json,created_at)
         VALUES (?,?,?,?,?,?,?)`,
      )
        .bind(
          admin.email.toLowerCase(),
          admin.name || "",
          "Sent onboarding reminder",
          "team_member",
          email,
          JSON.stringify({ name: target.name, role: target.role }),
          now,
        )
        .run();
    }
  } catch {}
}

export async function GET(req: Request) {
  await initOnboardingTables();

  const member = await getSelfMember();
  if (!member)
    return Response.json(
      { error: "Hub access is not active." },
      { status: 403 },
    );

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "self";

  if (scope === "self") {
    return Response.json(await loadSelfStatus(member));
  }

  const admin = await getAdminMember();
  if (!admin)
    return Response.json(
      { error: "Owner or technical administrator access is required." },
      { status: 403 },
    );

  const { results: users } = await env.DB.prepare(
    `SELECT
      t.id,t.name,t.email,t.role,t.department,t.active,
      COALESCE(t.access_scope,'Assigned workspace') AS access_scope,
      COALESCE(t.workspace_access,'[]') AS workspace_access,
      COALESCE(t.invite_status,'') AS invite_status,
      o.installed_app,o.notifications_enabled,o.role_confirmed,o.training_complete,
      o.completed_at,o.started_at,o.last_seen_at,o.last_reminded_at,o.device_label
     FROM team_members t
     LEFT JOIN rollout_onboarding o ON lower(o.email)=lower(t.email)
     WHERE t.active=1
       AND lower(t.email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'
     ORDER BY
       CASE t.role
         WHEN 'Owner / Admin' THEN 0
         WHEN 'Developer / Technical Admin' THEN 1
         WHEN 'Executive / EXCO' THEN 2
         WHEN 'Regional Manager' THEN 3
         WHEN 'Store Manager' THEN 4
         WHEN 'Human Resource (HR)' THEN 5
         ELSE 6
       END,
       t.name`,
  ).all<
    TeamRow &
      Partial<OnboardingRow>
  >();

  const rows = [];
  for (const user of users) {
    const pushDevices = await getPushDeviceCount(user.email);
    const notifyRequired = notificationsRequired(user.role);
    const installed = Boolean(user.installed_app);
    const roleConfirmed = Boolean(user.role_confirmed);
    const training = Boolean(user.training_complete);
    const notifyReady = !notifyRequired || pushDevices > 0;
    const ready =
      installed &&
      roleConfirmed &&
      training &&
      notifyReady;

    const visited = Boolean(user.last_seen_at);
    const started =
      visited ||
      installed ||
      roleConfirmed ||
      training ||
      pushDevices > 0;

    rows.push({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      access_scope: user.access_scope,
      workspaces: parseWorkspaceAccess(user.workspace_access),
      invite_status: user.invite_status,
      installed_app: installed,
      push_devices: pushDevices,
      notifications_required: notifyRequired,
      notifications_ready: notifyReady,
      role_confirmed: roleConfirmed,
      training_complete: training,
      ready,
      rollout_status: ready ? "Ready" : started ? "In Progress" : "Not Started",
      completed_at: ready ? String(user.completed_at || "") : "",
      started_at: String(user.started_at || ""),
      last_seen_at: String(user.last_seen_at || ""),
      last_reminded_at: String(user.last_reminded_at || ""),
      device_label: String(user.device_label || ""),
    });
  }

  const ready = rows.filter((row) => row.ready).length;
  const installed = rows.filter((row) => row.installed_app).length;
  const notifications = rows.filter((row) => row.notifications_ready).length;
  const training = rows.filter((row) => row.training_complete).length;
  const confirmed = rows.filter((row) => row.role_confirmed).length;
  const inProgress = rows.filter(
    (row) => row.rollout_status === "In Progress",
  ).length;
  const notStarted = rows.filter(
    (row) => row.rollout_status === "Not Started",
  ).length;

  const roleMap = new Map<
    string,
    { role: string; total: number; ready: number }
  >();

  for (const row of rows) {
    const current = roleMap.get(row.role) || {
      role: row.role,
      total: 0,
      ready: 0,
    };
    current.total += 1;
    if (row.ready) current.ready += 1;
    roleMap.set(row.role, current);
  }

  return Response.json({
    server_time: new Date().toISOString(),
    stats: {
      total: rows.length,
      ready,
      outstanding: rows.length - ready,
      installed,
      notifications,
      training,
      confirmed,
      in_progress: inProgress,
      not_started: notStarted,
      completion_percent:
        rows.length > 0 ? Math.round((ready / rows.length) * 100) : 0,
    },
    by_role: Array.from(roleMap.values()),
    users: rows,
  });
}

export async function POST(req: Request) {
  await initOnboardingTables();

  const member = await getSelfMember();
  const user = await getAuthenticatedUser();

  if (!member || !user?.email)
    return Response.json(
      { error: "Hub access is not active." },
      { status: 403 },
    );

  const body = (await req.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = String(body.action || "");

  if (action === "updateSelf") {
    const email = member.email.toLowerCase();
    const now = new Date().toISOString();
    await ensureOnboarding(email);

    const installedApp = body.installedApp === true;
    const roleConfirmed = body.roleConfirmed === true;
    const trainingComplete = body.trainingComplete === true;
    const deviceLabel = String(body.deviceLabel || "").slice(0, 500);

    const current = await env.DB.prepare(
      "SELECT * FROM rollout_onboarding WHERE email=?",
    )
      .bind(email)
      .first<OnboardingRow>();

    const pushDevices = await getPushDeviceCount(email);
    const notifyRequired = notificationsRequired(member.role);

    const nextInstalled =
      installedApp || Boolean(current?.installed_app);
    const nextRoleConfirmed =
      roleConfirmed || Boolean(current?.role_confirmed);
    const nextTraining =
      trainingComplete || Boolean(current?.training_complete);
    const notifyReady =
      !notifyRequired || pushDevices > 0;
    const completed =
      nextInstalled &&
      nextRoleConfirmed &&
      nextTraining &&
      notifyReady;

    const startedAt =
      current?.started_at ||
      now;

    const completedAt = completed
      ? current?.completed_at || now
      : "";

    await env.DB.prepare(
      `UPDATE rollout_onboarding
       SET installed_app=?,
           notifications_enabled=?,
           role_confirmed=?,
           training_complete=?,
           completed_at=?,
           started_at=?,
           last_seen_at=?,
           device_label=CASE WHEN ?<>'' THEN ? ELSE device_label END,
           updated_at=?
       WHERE email=?`,
    )
      .bind(
        nextInstalled ? 1 : 0,
        pushDevices > 0 ? 1 : 0,
        nextRoleConfirmed ? 1 : 0,
        nextTraining ? 1 : 0,
        completedAt,
        startedAt,
        now,
        deviceLabel,
        deviceLabel,
        now,
        email,
      )
      .run();

    return Response.json(await loadSelfStatus(member));
  }

  const admin = await getAdminMember();
  if (!admin)
    return Response.json(
      { error: "Owner or technical administrator access is required." },
      { status: 403 },
    );

  if (action === "remindUser") {
    const email = String(body.email || "").trim().toLowerCase();

    const target = await env.DB.prepare(
      `SELECT name,email,role
       FROM team_members
       WHERE active=1 AND lower(email)=?`,
    )
      .bind(email)
      .first<{ name: string; email: string; role: string }>();

    if (!target)
      return Response.json(
        { error: "Active Hub user not found." },
        { status: 404 },
      );

    await sendReminder(admin, target);
    return Response.json({ ok: true });
  }

  if (action === "remindOutstanding") {
    const dashboardReq = new Request(
      new URL("/api/rollout-onboarding?scope=admin", req.url),
      {
        method: "GET",
        headers: req.headers,
      },
    );

    const dashboardResponse = await GET(dashboardReq);
    const dashboard = (await dashboardResponse.json()) as {
      users?: Array<{
        name: string;
        email: string;
        role: string;
        ready: boolean;
      }>;
    };

    const outstanding = (dashboard.users || []).filter(
      (target) => !target.ready,
    );

    for (const target of outstanding) {
      await sendReminder(admin, target);
    }

    return Response.json({
      ok: true,
      reminded: outstanding.length,
    });
  }

  return Response.json(
    { error: "Unknown onboarding action." },
    { status: 400 },
  );
}
