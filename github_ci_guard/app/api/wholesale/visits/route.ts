import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";

async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS wholesale_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id INTEGER NOT NULL,
      visit_date TEXT NOT NULL,
      visit_type TEXT NOT NULL DEFAULT 'In person',
      update_type TEXT NOT NULL DEFAULT 'General follow-up',
      contact_person TEXT NOT NULL DEFAULT '',
      outcome TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      next_follow_up TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`,
  ).run();
  try {
    await env.DB.prepare(
      "ALTER TABLE wholesale_visits ADD COLUMN update_type TEXT NOT NULL DEFAULT 'General follow-up'",
    ).run();
  } catch {
    // Existing databases already include this activity classification.
  }
  for (const column of [
    "scheduled_time TEXT NOT NULL DEFAULT ''",
    "purpose TEXT NOT NULL DEFAULT ''",
    "visit_status TEXT NOT NULL DEFAULT 'Completed'",
    "area TEXT NOT NULL DEFAULT ''",
    "visit_address TEXT NOT NULL DEFAULT ''",
  ])
    try {
      await env.DB.prepare(`ALTER TABLE wholesale_visits ADD COLUMN ${column}`).run();
    } catch {
      // Existing databases already include the visit-planning field.
    }
}

export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "Wholesale access is not enabled." }, { status: 403 });
  const { results } = await env.DB.prepare(
    `SELECT v.*,o.customer_name,o.assigned_to,o.quotation_no,o.order_no,o.invoice_no,o.stage
     FROM wholesale_visits v JOIN wholesale_opportunities o ON o.id=v.opportunity_id
     ORDER BY v.visit_date DESC,v.id DESC`,
  ).all();
  return Response.json({ visits: results });
}

export async function POST(req: Request) {
  await init();
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot add wholesale visits." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  const opportunity = await env.DB.prepare(
    "SELECT id,contact_person FROM wholesale_opportunities WHERE id=?",
  ).bind(p.opportunity_id).first<{ id: number; contact_person: string }>();
  if (!opportunity || !p.visit_date)
    return Response.json({ error: "Customer and visit date are required." }, { status: 400 });
  const user = await getAuthenticatedUser();
  const visit = await env.DB.prepare(
    `INSERT INTO wholesale_visits (
      opportunity_id,visit_date,visit_type,update_type,contact_person,outcome,notes,
      next_follow_up,scheduled_time,purpose,visit_status,area,visit_address,created_by,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
  ).bind(
    opportunity.id,
    p.visit_date,
    p.visit_type || "In person",
    p.update_type || "General follow-up",
    p.contact_person || opportunity.contact_person || "",
    p.outcome || "",
    p.notes || "",
    p.next_follow_up || "",
    p.scheduled_time || "",
    p.purpose || "Relationship visit",
    p.visit_status || "Completed",
    p.area || "",
    p.visit_address || "",
    user?.displayName || "Current user",
    new Date().toISOString(),
  ).first();
  if (String(p.visit_status || "Completed") === "Completed")
    await env.DB.prepare(
      `UPDATE wholesale_opportunities
       SET last_visit=?,next_follow_up=?,next_action=? WHERE id=?`,
    ).bind(
      p.visit_date,
      p.next_follow_up || "",
      p.outcome || p.notes || "Visit completed",
      opportunity.id,
    ).run();
  const linkedFields = [
    "stage",
    "potential_value",
    "probability",
    "quotation_no",
    "quote_status",
    "order_no",
    "invoice_no",
    "value",
    "delivery_status",
    "delivery_eta",
  ];
  for (const key of linkedFields)
    if (p[key] !== undefined && String(p[key]).trim() !== "")
      await env.DB.prepare(
        `UPDATE wholesale_opportunities SET ${key}=? WHERE id=?`,
      ).bind(p[key], opportunity.id).run();
  if (String(p.update_type || "").toLowerCase().includes("quote"))
    await env.DB.prepare(
      `UPDATE wholesale_opportunities
       SET quote_follow_up_date=?,quote_date=CASE WHEN quote_date='' THEN ? ELSE quote_date END
       WHERE id=?`,
    ).bind(p.visit_date, p.visit_date, opportunity.id).run();
  if (
    String(p.update_type || "").toLowerCase().includes("order") ||
    String(p.update_type || "").toLowerCase().includes("delivery")
  )
    await env.DB.prepare(
      `UPDATE wholesale_opportunities
       SET confirmed_date=CASE WHEN confirmed_date='' THEN ? ELSE confirmed_date END
       WHERE id=?`,
    ).bind(p.visit_date, opportunity.id).run();
  return Response.json({ visit }, { status: 201 });
}
