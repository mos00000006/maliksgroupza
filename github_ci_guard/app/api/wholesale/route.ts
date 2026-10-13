import { env } from "cloudflare:workers";
import { canAccessWorkspace, canWrite, getHubMember } from "../access";

const enrolmentColumns = [
  "customer_number TEXT NOT NULL DEFAULT ''",
  "application_status TEXT NOT NULL DEFAULT 'Pending approval'",
  "registered_name TEXT NOT NULL DEFAULT ''",
  "registration_number TEXT NOT NULL DEFAULT ''",
  "vat_number TEXT NOT NULL DEFAULT ''",
  "nature_of_business TEXT NOT NULL DEFAULT ''",
  "years_in_business INTEGER NOT NULL DEFAULT 0",
  "branch_count INTEGER NOT NULL DEFAULT 1",
  "head_office_address TEXT NOT NULL DEFAULT ''",
  "postal_code TEXT NOT NULL DEFAULT ''",
  "website TEXT NOT NULL DEFAULT ''",
  "legal_entity TEXT NOT NULL DEFAULT ''",
  "owner1_name TEXT NOT NULL DEFAULT ''",
  "owner1_id TEXT NOT NULL DEFAULT ''",
  "owner1_position TEXT NOT NULL DEFAULT ''",
  "owner1_mobile TEXT NOT NULL DEFAULT ''",
  "owner2_name TEXT NOT NULL DEFAULT ''",
  "owner2_id TEXT NOT NULL DEFAULT ''",
  "owner2_position TEXT NOT NULL DEFAULT ''",
  "owner2_mobile TEXT NOT NULL DEFAULT ''",
  "purchasing_contact_name TEXT NOT NULL DEFAULT ''",
  "purchasing_contact_mobile TEXT NOT NULL DEFAULT ''",
  "purchasing_contact_email TEXT NOT NULL DEFAULT ''",
  "accounts_contact_name TEXT NOT NULL DEFAULT ''",
  "accounts_contact_mobile TEXT NOT NULL DEFAULT ''",
  "accounts_contact_email TEXT NOT NULL DEFAULT ''",
  "delivery_address TEXT NOT NULL DEFAULT ''",
  "delivery_contact TEXT NOT NULL DEFAULT ''",
  "delivery_contact_mobile TEXT NOT NULL DEFAULT ''",
  "receiving_hours TEXT NOT NULL DEFAULT ''",
  "delivery_requirements TEXT NOT NULL DEFAULT ''",
  "product_categories TEXT NOT NULL DEFAULT '[]'",
  "average_monthly_spend REAL NOT NULL DEFAULT 0",
  "ordering_method TEXT NOT NULL DEFAULT ''",
  "ordering_frequency TEXT NOT NULL DEFAULT ''",
  "payment_terms TEXT NOT NULL DEFAULT 'COD / EFT Before Dispatch'",
  "credit_requested INTEGER NOT NULL DEFAULT 0",
  "price_group TEXT NOT NULL DEFAULT 'Standard Wholesale'",
  "declaration_accepted INTEGER NOT NULL DEFAULT 0",
  "application_submitted_at TEXT NOT NULL DEFAULT ''",
  "approved_by TEXT NOT NULL DEFAULT ''",
  "approved_at TEXT NOT NULL DEFAULT ''",
  "approval_comments TEXT NOT NULL DEFAULT ''",
];

const enrolmentFields = enrolmentColumns.map((column) => column.split(" ")[0]).filter((field) => !["customer_number", "approved_by", "approved_at"].includes(field));
async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS wholesale_opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT,customer_name TEXT NOT NULL,contact TEXT NOT NULL DEFAULT '',region TEXT NOT NULL DEFAULT '',quotation_no TEXT NOT NULL DEFAULT '',order_no TEXT NOT NULL DEFAULT '',value REAL NOT NULL DEFAULT 0,gp_percent REAL NOT NULL DEFAULT 0,stage TEXT NOT NULL DEFAULT 'Lead',assigned_to TEXT NOT NULL DEFAULT '',next_action TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL)`,
  ).run();
  for (const column of [
    "contact_person TEXT NOT NULL DEFAULT ''",
    "email TEXT NOT NULL DEFAULT ''",
    "customer_type TEXT NOT NULL DEFAULT 'Independent Hardware'",
    "province TEXT NOT NULL DEFAULT 'Gauteng'",
    "zone TEXT NOT NULL DEFAULT ''",
    "coordinator TEXT NOT NULL DEFAULT ''",
    "monthly_target REAL NOT NULL DEFAULT 0",
    "last_visit TEXT NOT NULL DEFAULT ''",
    "next_follow_up TEXT NOT NULL DEFAULT ''",
    "potential_value REAL NOT NULL DEFAULT 0",
    "probability INTEGER NOT NULL DEFAULT 10",
    "quote_date TEXT NOT NULL DEFAULT ''",
    "quote_follow_up_date TEXT NOT NULL DEFAULT ''",
    "quote_status TEXT NOT NULL DEFAULT 'Pending'",
    "invoice_no TEXT NOT NULL DEFAULT ''",
    "confirmed_date TEXT NOT NULL DEFAULT ''",
    "delivery_status TEXT NOT NULL DEFAULT 'Not planned'",
    "delivery_eta TEXT NOT NULL DEFAULT ''",
    "delivered_date TEXT NOT NULL DEFAULT ''",
    "delivery_notes TEXT NOT NULL DEFAULT ''",
    ...enrolmentColumns,
  ])
    try {
      await env.DB.prepare(
        `ALTER TABLE wholesale_opportunities ADD COLUMN ${column}`,
      ).run();
    } catch {}
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS wholesale_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      visit_date TEXT NOT NULL,
      visit_type TEXT NOT NULL DEFAULT 'In person',
      contact_person TEXT NOT NULL DEFAULT '',
      outcome TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      next_follow_up TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`,
  ).run();
  for (const column of [
    "update_type TEXT NOT NULL DEFAULT 'General follow-up'",
    "scheduled_time TEXT NOT NULL DEFAULT ''",
    "purpose TEXT NOT NULL DEFAULT ''",
    "visit_status TEXT NOT NULL DEFAULT 'Completed'",
    "area TEXT NOT NULL DEFAULT ''",
    "visit_address TEXT NOT NULL DEFAULT ''",
  ])
    try {
      await env.DB.prepare(`ALTER TABLE wholesale_visits ADD COLUMN ${column}`).run();
    } catch {}
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS wholesale_customer_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'Supporting document',
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      object_key TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS wholesale_customer_sequence (id INTEGER PRIMARY KEY,next_number INTEGER NOT NULL DEFAULT 1)",
  ).run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO wholesale_customer_sequence (id,next_number) VALUES (1,1)",
  ).run();
  const { results: legacyCustomers } = await env.DB.prepare(
    "SELECT id FROM wholesale_opportunities WHERE customer_number='' AND application_submitted_at='' ORDER BY id",
  ).all<{ id: number }>();
  for (const legacy of legacyCustomers) {
    const sequence = await env.DB.prepare(
      "UPDATE wholesale_customer_sequence SET next_number=next_number+1 WHERE id=1 RETURNING next_number-1 AS allocated",
    ).first<{ allocated: number }>();
    if (sequence)
      await env.DB.prepare(
        "UPDATE wholesale_opportunities SET customer_number=?,application_status='Approved',approved_by='Existing customer migration',approved_at=? WHERE id=?",
      ).bind(`MWH-${String(sequence.allocated).padStart(6, "0")}`, new Date().toISOString(), legacy.id).run();
  }
}
export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "Wholesale access is not enabled." }, { status: 403 });
  const { results } = await env.DB.prepare(
    `SELECT o.*,
      (SELECT COUNT(*) FROM wholesale_visits v WHERE v.opportunity_id=o.id) AS visit_count,
      (SELECT COUNT(*) FROM wholesale_customer_documents d WHERE d.opportunity_id=o.id) AS document_count
     FROM wholesale_opportunities o ORDER BY o.id DESC`,
  ).all();
  return Response.json({ opportunities: results });
}
export async function POST(req: Request) {
  await init();
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot edit wholesale records." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  if (!String(p.customer_name || "").trim())
    return Response.json(
      { error: "Customer name is required" },
      { status: 400 },
    );
  const inserted = await env.DB.prepare(
    `INSERT INTO wholesale_opportunities (
      customer_name,contact_person,contact,email,customer_type,province,region,zone,
      quotation_no,order_no,value,gp_percent,stage,assigned_to,coordinator,monthly_target,
      last_visit,next_follow_up,next_action,potential_value,probability,quote_date,
      quote_follow_up_date,quote_status,invoice_no,confirmed_date,delivery_status,
      delivery_eta,delivered_date,delivery_notes,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
  )
    .bind(
      String(p.customer_name).trim(),
      p.contact_person || "",
      p.contact || "",
      p.email || "",
      p.customer_type || "Independent Hardware",
      p.province || "Gauteng",
      p.region || "",
      p.zone || "",
      p.quotation_no || "",
      p.order_no || "",
      Number(p.value) || 0,
      Number(p.gp_percent) || 0,
      p.stage || "Lead",
      p.assigned_to || "",
      p.coordinator || "",
      Number(p.monthly_target) || 0,
      p.last_visit || "",
      p.next_follow_up || "",
      p.next_action || "",
      Number(p.potential_value) || Number(p.value) || 0,
      Number(p.probability) || 10,
      p.quote_date || "",
      p.quote_follow_up_date || "",
      p.quote_status || "Pending",
      p.invoice_no || "",
      p.confirmed_date || "",
      p.delivery_status || "Not planned",
      p.delivery_eta || "",
      p.delivered_date || "",
      p.delivery_notes || "",
      new Date().toISOString(),
    )
    .first<{ id: number }>();
  if (!inserted) return Response.json({ error: "Customer application could not be created." }, { status: 500 });
  const submittedAt = new Date().toISOString();
  for (const key of enrolmentFields)
    if (p[key] !== undefined)
      await env.DB.prepare(`UPDATE wholesale_opportunities SET ${key}=? WHERE id=?`)
        .bind(p[key], inserted.id)
        .run();
  await env.DB.prepare(
    "UPDATE wholesale_opportunities SET application_status='Pending approval',application_submitted_at=? WHERE id=?",
  ).bind(submittedAt, inserted.id).run();
  let visitLogged = false;
  if (String(p.create_unplanned_visit || "") === "1") {
    const visitDate = String(p.field_visit_date || submittedAt.slice(0, 10));
    const visitTime = String(p.field_visit_time || submittedAt.slice(11, 16));
    const repName = String(p.assigned_to || member?.name || "");
    await env.DB.prepare(
      `UPDATE wholesale_opportunities
       SET assigned_to=?,last_visit=?,next_action='Customer application awaiting approval',stage='Visit Completed'
       WHERE id=?`,
    ).bind(repName, visitDate, inserted.id).run();
    await env.DB.prepare(
      `INSERT INTO wholesale_visits (
        opportunity_id,visit_date,visit_type,update_type,contact_person,outcome,notes,
        next_follow_up,scheduled_time,purpose,visit_status,area,visit_address,created_by,created_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      inserted.id,
      visitDate,
      "In person",
      "Unplanned new customer visit",
      p.purchasing_contact_name || p.contact_person || "",
      "Customer application submitted for approval",
      "New customer visited in the field; enrolment and supporting information captured in the Hub.",
      p.next_follow_up || "",
      visitTime,
      "New customer prospect",
      "Completed",
      p.zone || p.region || "",
      p.head_office_address || p.delivery_address || "",
      member?.name || "Current user",
      submittedAt,
    ).run();
    visitLogged = true;
  }
  const row = await env.DB.prepare("SELECT * FROM wholesale_opportunities WHERE id=?")
    .bind(inserted.id)
    .first();
  return Response.json({ opportunity: row, visit_logged: visitLogged }, { status: 201 });
}
