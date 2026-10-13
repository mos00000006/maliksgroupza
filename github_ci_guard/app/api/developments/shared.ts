import { env } from "cloudflare:workers";
import type { HubMember } from "../access";

export function canAccessDevelopments(member: HubMember | null | undefined) {
  return Boolean(member && ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO"].includes(member.role));
}

export function canWriteDevelopments(member: HubMember | null | undefined) {
  return Boolean(member && ["Owner / Admin", "Developer / Technical Admin", "Executive / EXCO"].includes(member.role) && member.access_scope !== "Read only");
}

export async function initDevelopmentTables() {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS development_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,project_name TEXT NOT NULL,site_location TEXT NOT NULL DEFAULT '',
      project_type TEXT NOT NULL DEFAULT 'New Store',status TEXT NOT NULL DEFAULT 'Planning',rag_status TEXT NOT NULL DEFAULT 'Green',
      project_manager TEXT NOT NULL DEFAULT '',start_date TEXT NOT NULL DEFAULT '',planned_opening_date TEXT NOT NULL DEFAULT '',
      actual_opening_date TEXT NOT NULL DEFAULT '',approved_budget REAL NOT NULL DEFAULT 0,contingency_budget REAL NOT NULL DEFAULT 0,
      stock_budget REAL NOT NULL DEFAULT 0,progress_percent INTEGER NOT NULL DEFAULT 0,approval_status TEXT NOT NULL DEFAULT 'Pending approval',
      approved_by TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS development_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL,category TEXT NOT NULL,supplier_contractor TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',budgeted_amount REAL NOT NULL DEFAULT 0,committed_amount REAL NOT NULL DEFAULT 0,
      actual_amount REAL NOT NULL DEFAULT 0,paid_amount REAL NOT NULL DEFAULT 0,expense_status TEXT NOT NULL DEFAULT 'Budgeted',
      invoice_number TEXT NOT NULL DEFAULT '',expense_date TEXT NOT NULL DEFAULT '',due_date TEXT NOT NULL DEFAULT '',owner TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS development_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,project_id INTEGER NOT NULL,expense_id INTEGER NOT NULL DEFAULT 0,
      document_type TEXT NOT NULL DEFAULT 'Invoice / Quotation',name TEXT NOT NULL,mime_type TEXT NOT NULL,size INTEGER NOT NULL,
      object_key TEXT NOT NULL,uploaded_by TEXT NOT NULL,created_at TEXT NOT NULL
    )`),
  ]);
}
