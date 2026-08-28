import { env } from "cloudflare:workers";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";
type Settings = {
  id: number;
  base_target: number;
  base_gp_threshold: number;
  accelerator_gp_threshold: number;
  rep_base_rate: number;
  rep_accelerator_rate: number;
  coordinator_rate: number;
  head_rate: number;
  updated_at: string;
};
async function init() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS commission_settings (id INTEGER PRIMARY KEY,base_target REAL NOT NULL DEFAULT 1000000,base_gp_threshold REAL NOT NULL DEFAULT 10,accelerator_gp_threshold REAL NOT NULL DEFAULT 15,rep_base_rate REAL NOT NULL DEFAULT 5,rep_accelerator_rate REAL NOT NULL DEFAULT 6,coordinator_rate REAL NOT NULL DEFAULT 2,head_rate REAL NOT NULL DEFAULT 2,updated_at TEXT NOT NULL)`,
  ).run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO commission_settings (id,updated_at) VALUES (1,?)",
  )
    .bind(new Date().toISOString())
    .run();
}
export async function GET() {
  await init();
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "Wholesale access is not enabled." }, { status: 403 });
  return Response.json({
    settings: await env.DB.prepare(
      "SELECT * FROM commission_settings WHERE id=1",
    ).first<Settings>(),
  });
}
export async function PATCH(req: Request) {
  await init();
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot change commission settings." }, { status: 403 });
  const p = (await req.json()) as Partial<Settings>;
  for (const key of [
    "base_target",
    "base_gp_threshold",
    "accelerator_gp_threshold",
    "rep_base_rate",
    "rep_accelerator_rate",
    "coordinator_rate",
    "head_rate",
  ])
    if (p[key as keyof Settings] !== undefined)
      await env.DB.prepare(
        `UPDATE commission_settings SET ${key}=?,updated_at=? WHERE id=1`,
      )
        .bind(Number(p[key as keyof Settings]) || 0, new Date().toISOString())
        .run();
  return Response.json({ ok: true });
}
