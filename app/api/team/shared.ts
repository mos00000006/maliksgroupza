import { env } from "cloudflare:workers";

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
  await env.DB.prepare(
    "INSERT INTO notifications (recipient_email,task_id,title,message,notification_type,read_at,created_at) VALUES (?,?,?,?,?,'',?)",
  )
    .bind(
      email,
      taskId,
      `New task: ${taskTitle}`,
      `${assignedBy} assigned you a task in ${workspace}.`,
      "Assignment",
      new Date().toISOString(),
    )
    .run();
}
