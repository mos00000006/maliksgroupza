import { env } from "cloudflare:workers";

export async function initStoreControlTables() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS store_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace TEXT NOT NULL,
      audit_date TEXT NOT NULL,
      audit_type TEXT NOT NULL DEFAULT 'Routine',
      auditor TEXT NOT NULL,
      sections_json TEXT NOT NULL DEFAULT '[]',
      score REAL NOT NULL DEFAULT 0,
      findings TEXT NOT NULL DEFAULT '',
      corrective_action TEXT NOT NULL DEFAULT '',
      responsible_person TEXT NOT NULL DEFAULT '',
      corrective_due TEXT NOT NULL DEFAULT '',
      corrective_status TEXT NOT NULL DEFAULT 'Open',
      manager_signoff TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_store_audits_workspace_date ON store_audits(workspace,audit_date)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS daily_manager_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace TEXT NOT NULL,
      checklist_date TEXT NOT NULL,
      manager TEXT NOT NULL,
      items_json TEXT NOT NULL DEFAULT '[]',
      compliance_percent REAL NOT NULL DEFAULT 0,
      issues_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      manager_signoff TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace, checklist_date)
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_manager_checklists_workspace_date ON daily_manager_checklists(workspace,checklist_date)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS store_control_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      workspace TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      object_key TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_store_control_attachments_record ON store_control_attachments(record_type,record_id)`),
  ]);
}

export async function storeControlRecordWorkspace(recordType: string, recordId: number) {
  await initStoreControlTables();
  if (recordType === "audit") {
    return env.DB.prepare("SELECT workspace FROM store_audits WHERE id=?")
      .bind(recordId)
      .first<{ workspace: string }>();
  }
  if (recordType === "checklist") {
    return env.DB.prepare("SELECT workspace FROM daily_manager_checklists WHERE id=?")
      .bind(recordId)
      .first<{ workspace: string }>();
  }
  return null;
}
