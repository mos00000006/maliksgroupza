import { env } from "cloudflare:workers";
import { allowedWorkspaces, canWrite, getHubMember } from "../access";
async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS financial_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,workspace TEXT NOT NULL,entry_type TEXT NOT NULL,category TEXT NOT NULL,amount REAL NOT NULL DEFAULT 0,period TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',expense_nature TEXT NOT NULL DEFAULT 'Variable',recurring INTEGER NOT NULL DEFAULT 0,effective_to TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL)`,
  ).run();
  for (const statement of [
    "ALTER TABLE financial_entries ADD COLUMN expense_nature TEXT NOT NULL DEFAULT 'Variable'",
    "ALTER TABLE financial_entries ADD COLUMN recurring INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE financial_entries ADD COLUMN effective_to TEXT NOT NULL DEFAULT ''",
  ]) {
    try {
      await env.DB.prepare(statement).run();
    } catch {
      // Existing hosted databases already have the column after first run.
    }
  }
}
export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM financial_entries ORDER BY period DESC,id DESC",
  ).all();
  const allowed = allowedWorkspaces(member);
  return Response.json({ entries: allowed === null ? results : results.filter((entry) => allowed.includes(String(entry.workspace))) });
}
export async function POST(req: Request) {
  await init();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  const allowed = allowedWorkspaces(member);
  if (allowed !== null && !allowed.includes(String(p.workspace)))
    return Response.json({ error: "You do not have access to this workspace." }, { status: 403 });
  if (!p.workspace || !p.entry_type || !p.category)
    return Response.json(
      { error: "Workspace, type and category are required" },
      { status: 400 },
    );
  const row = await env.DB.prepare(
    "INSERT INTO financial_entries (workspace,entry_type,category,amount,period,description,expense_nature,recurring,effective_to,created_at) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING *",
  )
    .bind(
      p.workspace,
      p.entry_type,
      p.category,
      Number(p.amount) || 0,
      p.period || new Date().toISOString().slice(0, 7),
      p.description || "",
      p.expense_nature || (p.entry_type === "CAPEX" ? "Capital" : "Variable"),
      Number(p.recurring) ? 1 : 0,
      p.effective_to || "",
      new Date().toISOString(),
    )
    .first();
  return Response.json({ entry: row }, { status: 201 });
}
