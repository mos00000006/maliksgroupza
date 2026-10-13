import { env } from "cloudflare:workers";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot update wholesale visits." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  for (const key of ["visit_date", "visit_type", "update_type", "contact_person", "outcome", "notes", "next_follow_up", "scheduled_time", "purpose", "visit_status", "area", "visit_address"])
    if (p[key] !== undefined)
      await env.DB.prepare(`UPDATE wholesale_visits SET ${key}=? WHERE id=?`)
        .bind(p[key], id)
        .run();
  if (p.visit_status === "Completed") {
    const visit = await env.DB.prepare(
      "SELECT opportunity_id,visit_date,next_follow_up,outcome,notes FROM wholesale_visits WHERE id=?",
    ).bind(id).first<{ opportunity_id: number; visit_date: string; next_follow_up: string; outcome: string; notes: string }>();
    if (visit)
      await env.DB.prepare(
        "UPDATE wholesale_opportunities SET last_visit=?,next_follow_up=?,next_action=? WHERE id=?",
      ).bind(visit.visit_date, visit.next_follow_up, visit.outcome || visit.notes || "Visit completed", visit.opportunity_id).run();
  }
  return Response.json({ ok: true });
}
