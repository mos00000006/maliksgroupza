import { env } from "cloudflare:workers";
import { sendPushNotification } from "../push/shared";

export async function initTeamTables() {
  const db = env.DB;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'Member',
        department TEXT NOT NULL DEFAULT 'Operations',
        active INTEGER NOT NULL DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_email TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'Assignment',
        read_at TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_email, read_at)",
    ),
  ]);
  const inviteColumns = [
    "ALTER TABLE team_members ADD COLUMN invite_status TEXT NOT NULL DEFAULT 'Active'",
    "ALTER TABLE team_members ADD COLUMN invite_token TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE team_members ADD COLUMN invite_sent_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE team_members ADD COLUMN accepted_at TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE team_members ADD COLUMN access_scope TEXT NOT NULL DEFAULT 'Assigned workspace'",
    "ALTER TABLE team_members ADD COLUMN workspace_access TEXT NOT NULL DEFAULT '[]'",
  ];
  for (const statement of inviteColumns) {
    try {
      await db.prepare(statement).run();
    } catch {
      // Existing hosted databases already have the column after first run.
    }
  }
  await db.batch([
    db.prepare(
      "UPDATE team_members SET active=0 WHERE lower(email) LIKE 'sites-screenshot-service-%@chatgpt.com'",
    ),
    db.prepare(
      "UPDATE team_members SET role='Developer / Technical Admin',access_scope='Full company' WHERE lower(email)='zak@fuzzelogicsolutions.com' AND department='IT'",
    ),
    db.prepare(
      "UPDATE team_members SET role='Member / Contributor',access_scope='Assigned workspace' WHERE role='Owner / Admin' AND lower(email)<>'msallikutti@gmail.com'",
    ),
  ]);
}

type NotificationRecipient = {
  email: string;
  role: string;
  department: string;
  access_scope: string;
  workspace_access: string;
};

function parseWorkspaceAccess(value: string) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? Array.from(
          new Set(
            parsed
              .map((item) => String(item).trim())
              .filter(Boolean),
          ),
        )
      : [];
  } catch {
    return [];
  }
}

function recipientCanAccessWorkspace(
  recipient: NotificationRecipient,
  workspace: string,
) {
  if (
    recipient.role === "Owner / Admin" ||
    recipient.role === "Developer / Technical Admin"
  )
    return true;
  if (
    recipient.role === "Executive / EXCO" &&
    recipient.access_scope === "Full company"
  )
    return true;

  const selected = parseWorkspaceAccess(recipient.workspace_access);
  const allowed =
    recipient.access_scope === "Assigned workspace"
      ? selected.slice(0, 1).length
        ? selected.slice(0, 1)
        : [recipient.department].filter(Boolean)
      : selected.length
        ? selected
        : [recipient.department].filter(Boolean);
  const target = workspace.trim().toLowerCase();
  return allowed.some((name) => name.trim().toLowerCase() === target);
}

async function createNotificationAndPush({
  recipientEmail,
  taskId,
  title,
  message,
  notificationType,
}: {
  recipientEmail: string;
  taskId: number;
  title: string;
  message: string;
  notificationType: "Assignment" | "TaskCreated";
}) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return;

  await env.DB.prepare(
    "INSERT INTO notifications (recipient_email,task_id,title,message,notification_type,read_at,created_at) VALUES (?,?,?,?,?,'',?)",
  )
    .bind(
      email,
      taskId,
      title,
      message,
      notificationType,
      new Date().toISOString(),
    )
    .run();

  const unreadRow = await env.DB.prepare(
    "SELECT COUNT(*) AS unread_count FROM notifications WHERE recipient_email=? AND (read_at='' OR read_at IS NULL)",
  )
    .bind(email)
    .first<{ unread_count: number }>();
  const unreadCount = Number(unreadRow?.unread_count || 1);

  await sendPushNotification(email, {
    title,
    body: message,
    taskId,
    unreadCount,
    url: "/",
  });
}

export async function createAssignmentNotification({
  recipientEmail,
  taskId,
  taskTitle,
  workspace,
  assignedBy,
}: {
  recipientEmail: string;
  taskId: number;
  taskTitle: string;
  workspace: string;
  assignedBy: string;
}) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return;
  await initTeamTables();
  await createNotificationAndPush({
    recipientEmail: email,
    taskId,
    title: `New task: ${taskTitle}`,
    message: `${assignedBy} assigned you a task in ${workspace}.`,
    notificationType: "Assignment",
  });
}

/**
 * Notify every active Hub user who is authorised to see the task workspace.
 * The direct email assignee receives assignment wording; all other authorised
 * recipients receive a general new-task alert. Each recipient receives only
 * one Inbox item and one push attempt for the task.
 */
export async function createTaskCreatedNotifications({
  taskId,
  taskTitle,
  workspace,
  createdBy,
  assigneeEmail = "",
  assigneeLabel = "",
}: {
  taskId: number;
  taskTitle: string;
  workspace: string;
  createdBy: string;
  assigneeEmail?: string;
  assigneeLabel?: string;
}) {
  await initTeamTables();
  const directEmail = assigneeEmail.trim().toLowerCase();
  const { results } = await env.DB.prepare(
    `SELECT email,role,department,access_scope,workspace_access
     FROM team_members
     WHERE active=1
       AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'`,
  ).all<NotificationRecipient>();

  const recipients = results.filter((recipient) =>
    recipientCanAccessWorkspace(recipient, workspace),
  );

  await Promise.all(
    recipients.map(async (recipient) => {
      const email = recipient.email.trim().toLowerCase();
      const isDirectAssignee = Boolean(directEmail && email === directEmail);
      const title = isDirectAssignee
        ? `New task: ${taskTitle}`
        : `New task added: ${taskTitle}`;
      const assignmentSuffix = assigneeLabel.trim()
        ? ` Assigned to ${assigneeLabel.trim()}.`
        : "";
      const message = isDirectAssignee
        ? `${createdBy} assigned you a task in ${workspace}.`
        : `${createdBy} added a new task in ${workspace}.${assignmentSuffix}`;

      await createNotificationAndPush({
        recipientEmail: email,
        taskId,
        title,
        message,
        notificationType: isDirectAssignee ? "Assignment" : "TaskCreated",
      });
    }),
  );
}
