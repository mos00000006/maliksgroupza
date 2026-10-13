import { env } from "cloudflare:workers";
import { allowedWorkspaces, canWrite, getHubMember } from "../access";
const stores = [
  "Power Build Chamdor",
  "Power Build Mohlakeng",
  "Power Build Kagiso Mall",
  "Power Build Midway",
  "Power Build Azaadville",
  "Power Build Munsieville",
  "Power Build Randfontein",
  "Power Build Krugersdorp",
  "Power Build Roodepoort",
  "Power Build Ext 3 / Jackal Creek",
  "Power Build Lanseria",
  "Power Build Kya Sands",
  "Power Build Ext 6 / Cosmo City",
  "Active Build Carletonville",
  "Best Build Nelspruit",
  "Buster Build",
  "Best Build Kanyamazane",
  "Best Build Groblersdal",
  "Best Build Matsulu",
];
async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS workspaces (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT NOT NULL,region TEXT NOT NULL DEFAULT 'Unassigned',manager TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL)`,
  ).run();
  const c = await env.DB.prepare(
    "SELECT COUNT(*) count FROM workspaces",
  ).first<{ count: number }>();
  if (!c?.count) {
    const now = new Date().toISOString();
    await env.DB.batch([
      ...stores.map((name) =>
        env.DB.prepare(
          "INSERT INTO workspaces (name,type,region,manager,active,created_at) VALUES (?,?,?,?,1,?)",
        ).bind(name, "Store", "Unassigned", "", now),
      ),
      ...["Power Build Warehouse", "Head Office", "Wholesale Division"].map(
        (name) =>
          env.DB.prepare(
            "INSERT INTO workspaces (name,type,region,manager,active,created_at) VALUES (?,?,?,?,1,?)",
          ).bind(
            name,
            name.includes("Warehouse") ? "DC" : name,
            "Group",
            "",
            now,
          ),
      ),
    ]);
  }
}
export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM workspaces WHERE active=1 ORDER BY CASE type WHEN 'Head Office' THEN 0 WHEN 'DC' THEN 1 WHEN 'Wholesale Division' THEN 2 ELSE 3 END,name",
  ).all();
  const allowed = allowedWorkspaces(member);
  return Response.json({
    workspaces: allowed === null ? results : results.filter((workspace) => allowed.includes(String(workspace.name))),
  });
}
export async function POST(req: Request) {
  await init();
  const member = await getHubMember();
  if (!member || !["Owner / Admin", "Developer / Technical Admin"].includes(member.role) || !canWrite(member))
    return Response.json({ error: "Only an administrator can create a store." }, { status: 403 });
  const p = (await req.json()) as Record<string, string>;
  if (!p.name?.trim())
    return Response.json({ error: "Workspace name required" }, { status: 400 });
  const duplicate = await env.DB.prepare(
    "SELECT id FROM workspaces WHERE lower(name)=lower(?) AND active=1",
  )
    .bind(p.name.trim())
    .first();
  if (duplicate)
    return Response.json(
      { error: "A store or workspace with this name already exists." },
      { status: 409 },
    );
  const w = await env.DB.prepare(
    "INSERT INTO workspaces (name,type,region,manager,active,created_at) VALUES (?,?,?,?,1,?) RETURNING *",
  )
    .bind(
      p.name.trim(),
      p.type || "Store",
      p.region || "Unassigned",
      p.manager || "",
      new Date().toISOString(),
    )
    .first();
  return Response.json({ workspace: w }, { status: 201 });
}
