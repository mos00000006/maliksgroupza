import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { canAccessWorkspace, getHubMember } from "../access";
import { initTeamTables } from "../team/shared";

async function currentEmail() {
  const user = await getAuthenticatedUser();
  return user?.email?.toLowerCase() || null;
}

export async function GET() {
  await initTeamTables();
  const email = await currentEmail(),
    member = await getHubMember();
  if (!email || !member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    `SELECT n.*,t.status,t.project,t.assignee,t.due
     FROM notifications n
     LEFT JOIN tasks t ON t.id=n.task_id
     WHERE n.recipient_email=?
     ORDER BY n.id DESC LIMIT 100`,
  )
    .bind(email)
    .all();
  return Response.json({
    notifications: results.filter(
      (notification) =>
        !notification.project ||
        canAccessWorkspace(member, String(notification.project)),
    ),
    email,
  });
}

export async function POST(req: Request) {
  await initTeamTables();
  const email = await currentEmail(),
    member = await getHubMember();
  if (!email || !member)
    return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const p = (await req.json()) as { id?: number; all?: boolean };
  const readAt = new Date().toISOString();
  if (p.all) {
    await env.DB.prepare(
      "UPDATE notifications SET read_at=? WHERE recipient_email=? AND read_at=''",
    )
      .bind(readAt, email)
      .run();
  } else if (p.id) {
    await env.DB.prepare(
      "UPDATE notifications SET read_at=? WHERE id=? AND recipient_email=?",
    )
      .bind(readAt, p.id, email)
      .run();
  }
  return Response.json({ ok: true });
}
