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

const HUMAN_RESOURCE_ROLE = "Human Resource (HR)";
const isHumanResourceRecipient = (role: string) => role === HUMAN_RESOURCE_ROLE;

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
  url = "/",
}: {
  recipientEmail: string;
  taskId: number;
  title: string;
  message: string;
  notificationType:
    | "Assignment"
    | "TaskCreated"
    | "ApprovalRequested"
    | "TaskApproved"
    | "ReturnedToWork"
    | "EmployeeAttendance";
  url?: string;
}) {
  const email = recipientEmail.trim().toLowerCase();
  if (!email) return;

  const recipient = await env.DB.prepare(
    "SELECT role FROM team_members WHERE lower(email)=? AND active=1",
  )
    .bind(email)
    .first<{ role: string }>();
  if (recipient && isHumanResourceRecipient(String(recipient.role || ""))) return;

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
    url,
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
       AND role<>'Human Resource (HR)'
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


function recipientCanApprove(recipient: NotificationRecipient) {
  return (
    recipient.role === "Owner / Admin" ||
    recipient.role === "Developer / Technical Admin" ||
    (recipient.role === "Executive / EXCO" &&
      recipient.access_scope === "Full company")
  );
}

async function activeRecipients() {
  const { results } = await env.DB.prepare(
    `SELECT email,role,department,access_scope,workspace_access
     FROM team_members
     WHERE active=1
       AND role<>'Human Resource (HR)'
       AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'`,
  ).all<NotificationRecipient>();
  return results;
}

export async function createApprovalRequestedNotifications({
  taskId,
  taskTitle,
  workspace,
  completedBy,
}: {
  taskId: number;
  taskTitle: string;
  workspace: string;
  completedBy: string;
}) {
  await initTeamTables();
  const recipients = (await activeRecipients()).filter(
    (recipient) =>
      recipientCanApprove(recipient) &&
      recipientCanAccessWorkspace(recipient, workspace),
  );
  await Promise.all(
    recipients.map((recipient) =>
      createNotificationAndPush({
        recipientEmail: recipient.email,
        taskId,
        title: `Awaiting approval: ${taskTitle}`,
        message: `${completedBy} marked this task complete at ${workspace}. It is now awaiting approval.`,
        notificationType: "ApprovalRequested",
      }),
    ),
  );
}

export async function createTaskApprovedNotifications({
  taskId,
  taskTitle,
  workspace,
  approvedBy,
}: {
  taskId: number;
  taskTitle: string;
  workspace: string;
  approvedBy: string;
}) {
  await initTeamTables();
  const recipients = (await activeRecipients()).filter((recipient) =>
    recipientCanAccessWorkspace(recipient, workspace),
  );
  await Promise.all(
    recipients.map((recipient) =>
      createNotificationAndPush({
        recipientEmail: recipient.email,
        taskId,
        title: `Task approved: ${taskTitle}`,
        message: `${approvedBy} approved the completed task at ${workspace}.`,
        notificationType: "TaskApproved",
      }),
    ),
  );
}

export async function createReturnedToWorkNotifications({
  taskId,
  taskTitle,
  workspace,
  returnedBy,
}: {
  taskId: number;
  taskTitle: string;
  workspace: string;
  returnedBy: string;
}) {
  await initTeamTables();
  const recipients = (await activeRecipients()).filter((recipient) =>
    recipientCanAccessWorkspace(recipient, workspace),
  );
  await Promise.all(
    recipients.map((recipient) =>
      createNotificationAndPush({
        recipientEmail: recipient.email,
        taskId,
        title: `Task returned to work: ${taskTitle}`,
        message: `Task returned to work at ${workspace}. ${returnedBy} requested further action.`,
        notificationType: "ReturnedToWork",
      }),
    ),
  );
}


function recipientHasFullCompanyAccess(recipient: NotificationRecipient) {
  return (
    recipient.role === "Owner / Admin" ||
    recipient.role === "Developer / Technical Admin" ||
    recipient.access_scope === "Full company"
  );
}

/**
 * Full-company users receive a staff attendance alert whenever an employee's
 * daily attendance state changes. Human Resource (HR) is deliberately excluded
 * from Hub notifications because that role is Employee-Records-only.
 */
export async function createEmployeeAttendanceNotifications({
  employeeId,
  employeeName,
  workspace,
  status,
  minutesLate = 0,
  absenceType = "",
  reason = "",
  recordedBy,
}: {
  employeeId: number;
  employeeName: string;
  workspace: string;
  status: "At work" | "Not at work" | "Late";
  minutesLate?: number;
  absenceType?: string;
  reason?: string;
  recordedBy: string;
}) {
  await initTeamTables();
  const recipients = (await activeRecipients()).filter(recipientHasFullCompanyAccess);

  const cleanReason = reason.trim();
  const cleanAbsence = absenceType.trim();
  let message = `${employeeName} is at work at ${workspace}.`;
  if (status === "Late") {
    message = `${employeeName} is late at ${workspace} by ${Math.max(0, Math.round(minutesLate))} minute${Math.max(0, Math.round(minutesLate)) === 1 ? "" : "s"}.`;
  } else if (status === "Not at work") {
    message = `${employeeName} is not at work at ${workspace}${cleanAbsence ? ` · ${cleanAbsence}` : ""}.`;
  }
  if (cleanReason) message += ` Reason: ${cleanReason}`;
  message += ` Recorded by ${recordedBy}.`;

  await Promise.all(
    recipients.map((recipient) =>
      createNotificationAndPush({
        recipientEmail: recipient.email,
        // Negative employee IDs cannot collide with normal positive task IDs and
        // give each employee their own push-notification tag.
        taskId: -Math.abs(employeeId),
        title: `Staff attendance: ${employeeName} — ${status}`,
        message,
        notificationType: "EmployeeAttendance",
        url: `/?view=${encodeURIComponent("Employee Records")}&workspace=${encodeURIComponent(workspace)}`,
      }),
    ),
  );
}
