import { env } from "cloudflare:workers";
import { allowedWorkspaces, canWrite, getHubMember } from "../access";

const numericFields = [
  "turnover",
  "cost_of_sales",
  "gross_profit",
  "salaries",
  "rent",
  "security",
  "insurance",
  "systems",
  "other_fixed",
  "utilities",
  "repairs_maintenance",
  "transport_delivery",
  "consumables",
  "other_variable",
  "petty_cash",
  "capex",
  "budget_turnover",
  "budget_gross_profit",
  "budget_operating_expenses",
  "budget_capex",
] as const;

async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS pnl_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace TEXT NOT NULL,
      period TEXT NOT NULL,
      turnover REAL NOT NULL DEFAULT 0,
      cost_of_sales REAL NOT NULL DEFAULT 0,
      gross_profit REAL NOT NULL DEFAULT 0,
      salaries REAL NOT NULL DEFAULT 0,
      rent REAL NOT NULL DEFAULT 0,
      security REAL NOT NULL DEFAULT 0,
      insurance REAL NOT NULL DEFAULT 0,
      systems REAL NOT NULL DEFAULT 0,
      other_fixed REAL NOT NULL DEFAULT 0,
      utilities REAL NOT NULL DEFAULT 0,
      repairs_maintenance REAL NOT NULL DEFAULT 0,
      transport_delivery REAL NOT NULL DEFAULT 0,
      consumables REAL NOT NULL DEFAULT 0,
      other_variable REAL NOT NULL DEFAULT 0,
      petty_cash REAL NOT NULL DEFAULT 0,
      capex REAL NOT NULL DEFAULT 0,
      budget_turnover REAL NOT NULL DEFAULT 0,
      budget_gross_profit REAL NOT NULL DEFAULT 0,
      budget_operating_expenses REAL NOT NULL DEFAULT 0,
      budget_capex REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(workspace, period)
    )`,
  ).run();
  try {
    await env.DB.prepare(
      "ALTER TABLE pnl_reports ADD COLUMN cost_of_sales REAL NOT NULL DEFAULT 0",
    ).run();
  } catch {
    // Existing databases already contain the column after the first update.
  }
  await env.DB.prepare(
    `UPDATE pnl_reports
     SET cost_of_sales=MAX(turnover-gross_profit,0)
     WHERE cost_of_sales=0 AND turnover>0 AND gross_profit>0`,
  ).run();
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS pnl_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      object_key TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ).run();
  try {
    await env.DB.prepare(
      `INSERT INTO pnl_reports (
        workspace,period,turnover,cost_of_sales,gross_profit,other_fixed,other_variable,petty_cash,
        capex,notes,created_at,updated_at
      )
      SELECT
        workspace,
        period,
        SUM(CASE WHEN entry_type IN ('Revenue','Income') THEN amount ELSE 0 END),
        SUM(CASE WHEN entry_type='Cost of Sales' THEN amount ELSE 0 END),
        SUM(CASE WHEN entry_type IN ('Revenue','Income') THEN amount
                 WHEN entry_type='Cost of Sales' THEN -amount ELSE 0 END),
        SUM(CASE WHEN entry_type IN ('Operating Expense','Maintenance')
                  AND expense_nature='Fixed' AND LOWER(category) NOT LIKE '%petty%'
                 THEN amount ELSE 0 END),
        SUM(CASE WHEN entry_type IN ('Operating Expense','Maintenance')
                  AND expense_nature<>'Fixed' AND LOWER(category) NOT LIKE '%petty%'
                 THEN amount ELSE 0 END),
        SUM(CASE WHEN LOWER(category) LIKE '%petty%' THEN amount ELSE 0 END),
        SUM(CASE WHEN entry_type='CAPEX' THEN amount ELSE 0 END),
        'Imported from the earlier financial register',
        MIN(created_at),
        MAX(created_at)
      FROM financial_entries
      GROUP BY workspace,period
      ON CONFLICT(workspace,period) DO NOTHING`,
    ).run();
  } catch {
    // The earlier register may not have been initialised on a new installation.
  }
}

export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    `SELECT r.*,
      (SELECT COUNT(*) FROM pnl_documents d WHERE d.report_id=r.id) AS document_count
     FROM pnl_reports r ORDER BY period DESC, workspace ASC`,
  ).all();
  const allowed = allowedWorkspaces(member);
  return Response.json({
    reports:
      allowed === null
        ? results
        : results.filter((row) => allowed.includes(String(row.workspace))),
  });
}

export async function POST(req: Request) {
  await init();
  const member = await getHubMember();
  if (!canWrite(member))
    return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const payload = (await req.json()) as Record<string, unknown>;
  const workspace = String(payload.workspace || "").trim();
  const period = String(payload.period || "").trim();
  const allowed = allowedWorkspaces(member);
  if (!workspace || !/^\d{4}-\d{2}$/.test(period))
    return Response.json(
      { error: "Store or workspace and reporting month are required." },
      { status: 400 },
    );
  if (allowed !== null && !allowed.includes(workspace))
    return Response.json(
      { error: "You do not have access to this workspace." },
      { status: 403 },
    );
  payload.gross_profit =
    Math.max(Number(payload.turnover) || 0, 0) -
    Math.max(Number(payload.cost_of_sales) || 0, 0);
  const values = numericFields.map((field) => Number(payload[field]) || 0);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO pnl_reports (
      workspace,period,turnover,cost_of_sales,gross_profit,salaries,rent,security,insurance,systems,
      other_fixed,utilities,repairs_maintenance,transport_delivery,consumables,
      other_variable,petty_cash,capex,budget_turnover,budget_gross_profit,
      budget_operating_expenses,budget_capex,notes,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(workspace,period) DO UPDATE SET
      turnover=excluded.turnover,cost_of_sales=excluded.cost_of_sales,
      gross_profit=excluded.gross_profit,
      salaries=excluded.salaries,rent=excluded.rent,security=excluded.security,
      insurance=excluded.insurance,systems=excluded.systems,other_fixed=excluded.other_fixed,
      utilities=excluded.utilities,repairs_maintenance=excluded.repairs_maintenance,
      transport_delivery=excluded.transport_delivery,consumables=excluded.consumables,
      other_variable=excluded.other_variable,petty_cash=excluded.petty_cash,
      capex=excluded.capex,budget_turnover=excluded.budget_turnover,
      budget_gross_profit=excluded.budget_gross_profit,
      budget_operating_expenses=excluded.budget_operating_expenses,
      budget_capex=excluded.budget_capex,notes=excluded.notes,updated_at=excluded.updated_at
    RETURNING *`,
  )
    .bind(
      workspace,
      period,
      ...values,
      String(payload.notes || ""),
      now,
      now,
    )
    .first();
  return Response.json({ report: row }, { status: 201 });
}
