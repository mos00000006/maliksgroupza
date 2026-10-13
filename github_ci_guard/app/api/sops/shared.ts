import { env } from "cloudflare:workers";
export type SopRow = {
  id: number;
  title: string;
  document_type: string;
  department: string;
  workspace: string;
  owner: string;
  review_date: string;
  notes: string;
  file_name: string;
  mime_type: string;
  size: number;
  object_key: string;
  status: string;
  ai_summary: string;
  workflow_json: string;
  checklist_json: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export async function ensureSops() {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS sop_documents (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,document_type TEXT NOT NULL DEFAULT 'SOP',department TEXT NOT NULL DEFAULT 'Operations',workspace TEXT NOT NULL DEFAULT 'Head Office',owner TEXT NOT NULL DEFAULT 'Operations',review_date TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',file_name TEXT NOT NULL,mime_type TEXT NOT NULL,size INTEGER NOT NULL,object_key TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Uploaded',ai_summary TEXT NOT NULL DEFAULT '',workflow_json TEXT NOT NULL DEFAULT '[]',checklist_json TEXT NOT NULL DEFAULT '[]',created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS sop_documents_workspace_idx ON sop_documents(workspace)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS sop_documents_department_idx ON sop_documents(department)",
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS sop_resources (id INTEGER PRIMARY KEY AUTOINCREMENT,sop_id INTEGER NOT NULL,label TEXT NOT NULL,resource_type TEXT NOT NULL DEFAULT 'Form / Checklist',file_name TEXT NOT NULL,mime_type TEXT NOT NULL,size INTEGER NOT NULL,object_key TEXT NOT NULL,uploaded_by TEXT NOT NULL,created_at TEXT NOT NULL)`,
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS sop_resources_sop_idx ON sop_resources(sop_id)",
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS sop_training_records (id INTEGER PRIMARY KEY AUTOINCREMENT,sop_id INTEGER NOT NULL,member_email TEXT NOT NULL,member_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Assigned',signature_name TEXT NOT NULL DEFAULT '',read_at TEXT NOT NULL DEFAULT '',trained_at TEXT NOT NULL DEFAULT '',competency_status TEXT NOT NULL DEFAULT 'Pending',assessed_by TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(sop_id,member_email))`,
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS sop_training_sop_idx ON sop_training_records(sop_id,status)",
    ),
  ]);
}
export async function getSop(id: string) {
  await ensureSops();
  return env.DB.prepare("SELECT * FROM sop_documents WHERE id=?")
    .bind(id)
    .first<SopRow>();
}
export function parseList<T>(value: string | undefined, fallback: T[] = []) {
  try {
    return JSON.parse(value || "[]") as T[];
  } catch {
    return fallback;
  }
}
