import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import {
  canManageAccess,
  getHubMember,
  type HubMember,
} from "../access";
import { sendPushNotification } from "../push/shared";
import { initTeamTables } from "../team/shared";

const RELEASE = "2026.09.17 · System Control Centre V1";
const OWNER_EMAIL = "msallikutti@gmail.com";
const SNAPSHOT_RETENTION = 20;

const CRITICAL_TABLES = [
  "tasks",
  "workspaces",
  "team_members",
  "employee_records",
  "employee_attendance",
  "employee_warnings",
  "employee_hr_records",
  "store_specials",
  "promotion_plans",
  "promotion_suggestions",
  "promotion_decisions",
  "promotion_thoughts",
  "pnl_reports",
  "development_projects",
  "wholesale_opportunities",
  "sop_documents",
];

const NAV_MODULES = [
  "Executive Overview",
  "My Work",
  "Store Operations",
  "Store Specials",
  "Store Audits",
  "Daily Checklists",
  "Store Ranking",
  "Employee Records",
  "Wholesale Division",
  "Developments",
  "Financials & P&L",
  "Receiving & Dispatch",
  "SOP & Manuals",
  "Approvals",
  "Reports",
  "Our Catalogue",
  "System Control Centre",
];

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
  created_at: string;
};


function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function safeTriggerName(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

async function tableExists(name: string) {
  const row = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
  )
    .bind(name)
    .first<{ name: string }>();
  return Boolean(row?.name);
}

async function tableColumns(name: string) {
  const { results } = await env.DB.prepare(
    `PRAGMA table_info(${quoteIdentifier(name)})`,
  ).all<{ name: string }>();
  return results.map((row) => row.name);
}

async function installCriticalAuditTriggers() {
  for (const table of CRITICAL_TABLES) {
    if (!(await tableExists(table))) continue;

    const columns = await tableColumns(table);
    if (!columns.includes("id")) continue;

    const actorColumn = [
      "updated_by",
      "created_by",
      "uploaded_by",
      "author",
      "completed_by",
    ].find((column) => columns.includes(column));

    const labelColumn = [
      "title",
      "name",
      "product_name",
      "employee_name",
      "email",
      "topic",
    ].find((column) => columns.includes(column));

    const qTable = quoteIdentifier(table);
    const triggerBase = safeTriggerName(`system_watch_${table}`);

    const newActor = actorColumn
      ? `COALESCE(CAST(NEW.${quoteIdentifier(actorColumn)} AS TEXT),'')`
      : "''";
    const oldActor = actorColumn
      ? `COALESCE(CAST(OLD.${quoteIdentifier(actorColumn)} AS TEXT),'')`
      : "''";
    const newLabel = labelColumn
      ? `COALESCE(CAST(NEW.${quoteIdentifier(labelColumn)} AS TEXT),'')`
      : "''";
    const oldLabel = labelColumn
      ? `COALESCE(CAST(OLD.${quoteIdentifier(labelColumn)} AS TEXT),'')`
      : "''";

    const statements = [
      `CREATE TRIGGER IF NOT EXISTS ${quoteIdentifier(`${triggerBase}_insert`)}
       AFTER INSERT ON ${qTable}
       BEGIN
         INSERT INTO system_data_change_log
           (table_name,row_id,change_type,actor_hint,item_hint,changed_at)
         VALUES
           ('${table}',CAST(NEW.id AS TEXT),'INSERT',${newActor},${newLabel},strftime('%Y-%m-%dT%H:%M:%fZ','now'));
       END`,
      `CREATE TRIGGER IF NOT EXISTS ${quoteIdentifier(`${triggerBase}_update`)}
       AFTER UPDATE ON ${qTable}
       BEGIN
         INSERT INTO system_data_change_log
           (table_name,row_id,change_type,actor_hint,item_hint,changed_at)
         VALUES
           ('${table}',CAST(NEW.id AS TEXT),'UPDATE',${newActor},${newLabel},strftime('%Y-%m-%dT%H:%M:%fZ','now'));
       END`,
      `CREATE TRIGGER IF NOT EXISTS ${quoteIdentifier(`${triggerBase}_delete`)}
       AFTER DELETE ON ${qTable}
       BEGIN
         INSERT INTO system_data_change_log
           (table_name,row_id,change_type,actor_hint,item_hint,changed_at)
         VALUES
           ('${table}',CAST(OLD.id AS TEXT),'DELETE',${oldActor},${oldLabel},strftime('%Y-%m-%dT%H:%M:%fZ','now'));
       END`,
    ];

    for (const statement of statements) {
      try {
        await env.DB.prepare(statement).run();
      } catch (error) {
        console.error(`Could not install audit trigger for ${table}`, error);
      }
    }
  }
}

async function initSystemControlTables() {
  await initTeamTables();

  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS system_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_email TEXT NOT NULL,
      actor_name TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT '',
      target_id TEXT NOT NULL DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS system_data_change_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id TEXT NOT NULL DEFAULT '',
      change_type TEXT NOT NULL,
      actor_hint TEXT NOT NULL DEFAULT '',
      item_hint TEXT NOT NULL DEFAULT '',
      changed_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS system_error_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL DEFAULT '',
      error_kind TEXT NOT NULL DEFAULT 'Client Error',
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      stack TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      resolved_at TEXT NOT NULL DEFAULT '',
      resolved_by TEXT NOT NULL DEFAULT ''
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS system_backup_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_key TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      table_count INTEGER NOT NULL DEFAULT 0,
      row_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS system_audit_created_idx ON system_audit_log(created_at DESC)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS system_change_created_idx ON system_data_change_log(changed_at DESC)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS system_error_created_idx ON system_error_log(created_at DESC)",
    ),
  ]);

  await installCriticalAuditTriggers();

  try {
    await env.DB.prepare(
      `DELETE FROM system_data_change_log
       WHERE id NOT IN (
         SELECT id FROM system_data_change_log ORDER BY id DESC LIMIT 5000
       )`,
    ).run();
  } catch {}
}

async function writeAudit(
  member: HubMember,
  action: string,
  targetType = "",
  targetId = "",
  details: Record<string, unknown> = {},
) {
  await env.DB.prepare(
    `INSERT INTO system_audit_log
      (actor_email,actor_name,action,target_type,target_id,details_json,created_at)
     VALUES (?,?,?,?,?,?,?)`,
  )
    .bind(
      member.email.toLowerCase(),
      member.name || "",
      action,
      targetType,
      targetId,
      JSON.stringify(details),
      new Date().toISOString(),
    )
    .run();
}

async function countTable(
  table: string,
  where = "",
  binds: unknown[] = [],
) {
  if (!(await tableExists(table))) return 0;
  try {
    const statement = env.DB.prepare(
      `SELECT COUNT(*) AS total FROM ${quoteIdentifier(table)} ${where}`,
    );
    const row = binds.length
      ? await statement.bind(...binds).first<{ total: number }>()
      : await statement.first<{ total: number }>();
    return Number(row?.total || 0);
  } catch {
    return 0;
  }
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

function modulesForMember(member: TeamRow) {
  if (member.role === "Human Resource (HR)") return ["Employee Records"];

  const fullCompany =
    member.role === "Owner / Admin" ||
    member.role === "Developer / Technical Admin" ||
    (member.role === "Executive / EXCO" && member.access_scope === "Full company");

  const accessAdmin = [
    "Owner / Admin",
    "Developer / Technical Admin",
  ].includes(member.role);

  if (fullCompany)
    return NAV_MODULES.filter(
      (module) => module !== "System Control Centre" || accessAdmin,
    );

  const workspaceAccess = parseWorkspaceAccess(member.workspace_access);
  const employeeRecordsAccess = [
    "Regional Manager",
    "Store Manager",
    "Department Manager",
  ].includes(member.role);

  return NAV_MODULES.filter((module) => {
    if (module === "System Control Centre") return false;
    if (module === "Employee Records") return employeeRecordsAccess;
    if (module === "Wholesale Division")
      return workspaceAccess.includes("Wholesale Division");

    return ![
      "Executive Overview",
      "Developments",
      "Approvals",
      "Reports",
    ].includes(module);
  });
}

function workspacesForMember(member: TeamRow) {
  if (
    member.role === "Owner / Admin" ||
    member.role === "Developer / Technical Admin" ||
    (member.role === "Executive / EXCO" && member.access_scope === "Full company")
  )
    return ["All company workspaces"];

  const selected = parseWorkspaceAccess(member.workspace_access);
  if (member.access_scope === "Assigned workspace")
    return selected.slice(0, 1).length
      ? selected.slice(0, 1)
      : [member.department].filter(Boolean);

  return selected.length
    ? selected
    : [member.department].filter(Boolean);
}

async function createDatabaseSnapshot(member: HubMember) {
  const { results: tableRows } = await env.DB.prepare(
    `SELECT name
     FROM sqlite_master
     WHERE type='table'
       AND name NOT LIKE 'sqlite_%'
       AND name NOT LIKE 'system_%'
       AND name NOT IN (
         'd1_migrations',
         'push_vapid_config',
         'push_subscriptions',
         'notifications',
         'promotion_planning_reads'
       )
     ORDER BY name`,
  ).all<{ name: string }>();

  const snapshot: {
    metadata: Record<string, unknown>;
    tables: Record<string, unknown[]>;
  } = {
    metadata: {
      release: RELEASE,
      created_at: new Date().toISOString(),
      created_by: member.email,
      note: "Business-data snapshot generated by PowerBuild System Control Centre. Authentication/push secrets are excluded.",
    },
    tables: {},
  };

  let totalRows = 0;

  for (const table of tableRows.map((row) => row.name)) {
    const safeTable = quoteIdentifier(table);
    const rows: unknown[] = [];
    let offset = 0;

    while (true) {
      const { results } = await env.DB.prepare(
        `SELECT * FROM ${safeTable} LIMIT 1000 OFFSET ?`,
      )
        .bind(offset)
        .all<Record<string, unknown>>();

      for (const row of results) {
        if (table === "team_members" && "invite_token" in row) {
          rows.push({ ...row, invite_token: "[REDACTED]" });
        } else {
          rows.push(row);
        }
      }

      offset += results.length;

      if (results.length < 1000) break;
      if (offset > 50000)
        throw new Error(
          `Snapshot stopped because ${table} exceeds 50,000 rows. Use a Cloudflare D1 export for a larger production backup.`,
        );
    }

    snapshot.tables[table] = rows;
    totalRows += rows.length;
  }

  const json = JSON.stringify(snapshot);
  const bytes = new TextEncoder().encode(json);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const objectKey = `system-backups/d1-business-snapshot-${stamp}.json`;

  await env.BUCKET.put(objectKey, bytes, {
    httpMetadata: {
      contentType: "application/json",
      contentDisposition: `attachment; filename="powerbuild-d1-snapshot-${stamp}.json"`,
    },
    customMetadata: {
      created_by: member.email.toLowerCase(),
      release: RELEASE,
    },
  });

  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO system_backup_snapshots
      (object_key,size_bytes,table_count,row_count,created_by,created_at)
     VALUES (?,?,?,?,?,?)`,
  )
    .bind(
      objectKey,
      bytes.byteLength,
      Object.keys(snapshot.tables).length,
      totalRows,
      member.email.toLowerCase(),
      createdAt,
    )
    .run();

  const { results: expired } = await env.DB.prepare(
    `SELECT id,object_key
     FROM system_backup_snapshots
     ORDER BY id DESC
     LIMIT -1 OFFSET ?`,
  )
    .bind(SNAPSHOT_RETENTION)
    .all<{ id: number; object_key: string }>();

  for (const old of expired) {
    try {
      await env.BUCKET.delete(old.object_key);
      await env.DB.prepare(
        "DELETE FROM system_backup_snapshots WHERE id=?",
      ).bind(old.id).run();
    } catch {}
  }

  await writeAudit(
    member,
    "Created database snapshot",
    "backup",
    String(result.meta?.last_row_id || ""),
    {
      object_key: objectKey,
      size_bytes: bytes.byteLength,
      table_count: Object.keys(snapshot.tables).length,
      row_count: totalRows,
    },
  );

  return {
    object_key: objectKey,
    size_bytes: bytes.byteLength,
    table_count: Object.keys(snapshot.tables).length,
    row_count: totalRows,
    created_at: createdAt,
  };
}

async function getAdminMember() {
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  return member && canManageAccess(member) ? member : null;
}

export async function GET(req: Request) {
  await initSystemControlTables();

  const member = await getAdminMember();
  if (!member)
    return Response.json(
      { error: "Owner or technical administrator access is required." },
      { status: 403 },
    );

  const url = new URL(req.url);
  const downloadBackup = Number(url.searchParams.get("downloadBackup") || 0);

  if (downloadBackup) {
    const backup = await env.DB.prepare(
      "SELECT object_key FROM system_backup_snapshots WHERE id=?",
    )
      .bind(downloadBackup)
      .first<{ object_key: string }>();

    if (!backup)
      return new Response("Backup not found", { status: 404 });

    const object = await env.BUCKET.get(backup.object_key);
    if (!object)
      return new Response("Backup file not found", { status: 404 });

    await writeAudit(
      member,
      "Downloaded database snapshot",
      "backup",
      String(downloadBackup),
    );

    const filename =
      backup.object_key.split("/").pop() || "powerbuild-database-snapshot.json";

    return new Response(object.body, {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  }

  let databaseOk = false;
  let databaseMessage = "Unavailable";
  try {
    const row = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    databaseOk = Number(row?.ok || 0) === 1;
    databaseMessage = databaseOk ? "Connected" : "Query failed";
  } catch (error) {
    databaseMessage = error instanceof Error ? error.message : "Query failed";
  }

  let storageOk = false;
  let storageMessage = "Unavailable";
  try {
    await env.BUCKET.list({ limit: 1 });
    storageOk = true;
    storageMessage = "R2 bucket reachable";
  } catch (error) {
    storageMessage = error instanceof Error ? error.message : "R2 unavailable";
  }

  const [
    activeUsers,
    inactiveUsers,
    activeWorkspaces,
    openTasks,
    completeTasks,
    unreadNotifications,
    pushSubscriptions,
    pushUsers,
    errors24h,
    unresolvedErrors,
    dataChanges24h,
  ] = await Promise.all([
    countTable("team_members", "WHERE active=1"),
    countTable("team_members", "WHERE active=0"),
    countTable("workspaces", "WHERE active=1"),
    countTable("tasks", "WHERE status<>'Complete'"),
    countTable("tasks", "WHERE status='Complete'"),
    countTable("notifications", "WHERE read_at='' OR read_at IS NULL"),
    countTable("push_subscriptions"),
    tableExists("push_subscriptions").then(async (exists) => {
      if (!exists) return 0;
      const row = await env.DB.prepare(
        "SELECT COUNT(DISTINCT lower(recipient_email)) AS total FROM push_subscriptions",
      ).first<{ total: number }>();
      return Number(row?.total || 0);
    }),
    countTable(
      "system_error_log",
      "WHERE created_at>=datetime('now','-1 day')",
    ),
    countTable(
      "system_error_log",
      "WHERE resolved_at='' OR resolved_at IS NULL",
    ),
    countTable(
      "system_data_change_log",
      "WHERE changed_at>=datetime('now','-1 day')",
    ),
  ]);

  const { results: users } = await env.DB.prepare(
    `SELECT
      id,name,email,role,department,active,
      COALESCE(access_scope,'Assigned workspace') AS access_scope,
      COALESCE(workspace_access,'[]') AS workspace_access,
      COALESCE(invite_status,'') AS invite_status,
      created_at
     FROM team_members
     WHERE lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'
     ORDER BY active DESC,
       CASE role
         WHEN 'Owner / Admin' THEN 0
         WHEN 'Developer / Technical Admin' THEN 1
         WHEN 'Executive / EXCO' THEN 2
         WHEN 'Regional Manager' THEN 3
         WHEN 'Store Manager' THEN 4
         ELSE 5
       END,
       name`,
  ).all<TeamRow>();

  const userRows = users.map((user) => ({
    ...user,
    workspace_access_parsed: parseWorkspaceAccess(user.workspace_access),
    access_preview: {
      modules: modulesForMember(user),
      workspaces: workspacesForMember(user),
    },
  }));

  const { results: adminAudit } = await env.DB.prepare(
    `SELECT *
     FROM system_audit_log
     ORDER BY id DESC
     LIMIT 150`,
  ).all();

  const { results: dataChanges } = await env.DB.prepare(
    `SELECT *
     FROM system_data_change_log
     ORDER BY id DESC
     LIMIT 250`,
  ).all();

  const { results: errors } = await env.DB.prepare(
    `SELECT *
     FROM system_error_log
     ORDER BY id DESC
     LIMIT 150`,
  ).all();

  const { results: backups } = await env.DB.prepare(
    `SELECT *
     FROM system_backup_snapshots
     ORDER BY id DESC
     LIMIT 20`,
  ).all();

  const lastBackup =
    (backups[0] as Record<string, unknown> | undefined) || null;

  const pushCoverage =
    activeUsers > 0 ? Math.round((pushUsers / activeUsers) * 100) : 0;

  return Response.json({
    release: RELEASE,
    server_time: new Date().toISOString(),
    current_user: {
      name: member.name,
      email: member.email,
      role: member.role,
    },
    health: {
      database: {
        ok: databaseOk,
        message: databaseMessage,
      },
      storage: {
        ok: storageOk,
        message: storageMessage,
      },
      notifications: {
        ok: pushSubscriptions > 0,
        subscriptions: pushSubscriptions,
        users_with_push: pushUsers,
        coverage_percent: pushCoverage,
        unread: unreadNotifications,
      },
      backup: {
        ok: Boolean(lastBackup),
        last_snapshot: lastBackup,
        retention: SNAPSHOT_RETENTION,
      },
    },
    stats: {
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      active_workspaces: activeWorkspaces,
      open_tasks: openTasks,
      complete_tasks: completeTasks,
      errors_24h: errors24h,
      unresolved_errors: unresolvedErrors,
      data_changes_24h: dataChanges24h,
    },
    users: userRows,
    admin_audit: adminAudit,
    data_changes: dataChanges,
    errors,
    backups,
  });
}

export async function POST(req: Request) {
  await initSystemControlTables();

  const user = await getAuthenticatedUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "logClientError") {
    const member = await getHubMember({ allowEmployeeRecordsOnly: true });
    if (!member || !user?.email)
      return Response.json({ ok: false }, { status: 403 });

    const message = String(body.message || "").slice(0, 4000);
    if (!message) return Response.json({ ok: true });

    await env.DB.prepare(
      `INSERT INTO system_error_log
        (user_email,error_kind,message,source,stack,user_agent,created_at,resolved_at,resolved_by)
       VALUES (?,?,?,?,?,?,?,'','')`,
    )
      .bind(
        user.email.toLowerCase(),
        String(body.kind || "Client Error").slice(0, 100),
        message,
        String(body.source || "").slice(0, 1000),
        String(body.stack || "").slice(0, 8000),
        String(body.userAgent || "").slice(0, 1000),
        new Date().toISOString(),
      )
      .run();

    try {
      await env.DB.prepare(
        `DELETE FROM system_error_log
         WHERE id NOT IN (
           SELECT id FROM system_error_log ORDER BY id DESC LIMIT 500
         )`,
      ).run();
    } catch {}

    return Response.json({ ok: true });
  }

  const member = await getAdminMember();
  if (!member)
    return Response.json(
      { error: "Owner or technical administrator access is required." },
      { status: 403 },
    );

  if (action === "createSnapshot") {
    try {
      const snapshot = await createDatabaseSnapshot(member);
      return Response.json({ ok: true, snapshot });
    } catch (error) {
      await env.DB.prepare(
        `INSERT INTO system_error_log
          (user_email,error_kind,message,source,stack,user_agent,created_at,resolved_at,resolved_by)
         VALUES (?,?,?,?,?,?,?,'','')`,
      )
        .bind(
          member.email.toLowerCase(),
          "Backup Error",
          error instanceof Error ? error.message : "Database snapshot failed",
          "System Control Centre",
          error instanceof Error ? error.stack || "" : "",
          "",
          new Date().toISOString(),
        )
        .run();

      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Database snapshot could not be created.",
        },
        { status: 500 },
      );
    }
  }

  if (action === "testPush") {
    const taskId = -910000000;
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO notifications
        (recipient_email,task_id,title,message,notification_type,read_at,created_at)
       VALUES (?,?,?,?,'SystemTest','',?)`,
    )
      .bind(
        member.email.toLowerCase(),
        taskId,
        "PowerBuild Hub test notification",
        "System Control Centre successfully sent this test alert.",
        createdAt,
      )
      .run();

    const unread = await env.DB.prepare(
      `SELECT COUNT(*) AS total
       FROM notifications
       WHERE lower(recipient_email)=?
         AND (read_at='' OR read_at IS NULL)`,
    )
      .bind(member.email.toLowerCase())
      .first<{ total: number }>();

    await sendPushNotification(member.email, {
      title: "PowerBuild Hub test notification",
      body: "System Control Centre successfully sent this test alert.",
      taskId,
      unreadCount: Number(unread?.total || 1),
      url: "/?view=System%20Control%20Centre",
    });

    await writeAudit(
      member,
      "Sent test push notification",
      "notification",
      member.email.toLowerCase(),
    );

    return Response.json({ ok: true });
  }

  if (action === "resolveErrors") {
    await env.DB.prepare(
      `UPDATE system_error_log
       SET resolved_at=?,resolved_by=?
       WHERE resolved_at='' OR resolved_at IS NULL`,
    )
      .bind(new Date().toISOString(), member.email.toLowerCase())
      .run();

    await writeAudit(
      member,
      "Marked system errors resolved",
      "system_errors",
    );

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown system action." }, { status: 400 });
}

export async function PATCH(req: Request) {
  await initSystemControlTables();

  const member = await getAdminMember();
  if (!member)
    return Response.json(
      { error: "Owner or technical administrator access is required." },
      { status: 403 },
    );

  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "setUserActive") {
    const email = String(body.email || "").trim().toLowerCase();
    const active = Boolean(body.active);

    if (!email)
      return Response.json({ error: "User email is required." }, { status: 400 });

    if (email === OWNER_EMAIL && !active)
      return Response.json(
        { error: "The primary Hub owner cannot be disabled." },
        { status: 403 },
      );

    if (email === member.email.toLowerCase() && !active)
      return Response.json(
        { error: "You cannot disable the account you are currently using." },
        { status: 403 },
      );

    const existing = await env.DB.prepare(
      `SELECT id,name,email,role,active
       FROM team_members
       WHERE lower(email)=?`,
    )
      .bind(email)
      .first<{
        id: number;
        name: string;
        email: string;
        role: string;
        active: number;
      }>();

    if (!existing)
      return Response.json({ error: "Hub user not found." }, { status: 404 });

    await env.DB.prepare(
      "UPDATE team_members SET active=? WHERE lower(email)=?",
    )
      .bind(active ? 1 : 0, email)
      .run();

    if (!active && (await tableExists("push_subscriptions"))) {
      await env.DB.prepare(
        "DELETE FROM push_subscriptions WHERE lower(recipient_email)=?",
      )
        .bind(email)
        .run();
    }

    await writeAudit(
      member,
      active ? "Re-enabled Hub user" : "Disabled Hub user",
      "team_member",
      email,
      {
        name: existing.name,
        role: existing.role,
        previous_active: existing.active,
        active,
        push_subscriptions_removed: !active,
      },
    );

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown system update." }, { status: 400 });
}
