import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import { initTeamTables } from "../shared";

export async function POST(req: Request) {
  await initTeamTables();
  const user = await getAuthenticatedUser();
  if (!user)
    return Response.json({ error: "Sign in to continue." }, { status: 401 });

  const body = (await req.json()) as { token?: string };
  const token = String(body.token || "").trim();
  if (!token)
    return Response.json({ error: "Invitation token required." }, { status: 400 });

  const member = await env.DB.prepare(
    "SELECT id FROM team_members WHERE lower(email)=? AND invite_token=? AND active=1",
  )
    .bind(user.email.toLowerCase(), token)
    .first<{ id: number }>();
  if (!member)
    return Response.json(
      { error: "This invitation does not match the signed-in email." },
      { status: 403 },
    );

  await env.DB.prepare(
    "UPDATE team_members SET invite_status='Active',accepted_at=? WHERE id=?",
  )
    .bind(new Date().toISOString(), member.id)
    .run();
  return Response.json({ accepted: true });
}
