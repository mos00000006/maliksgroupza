import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import { initTeamTables } from "../../team/shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";
import { getSop, parseList } from "../shared";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id);
  if (!row)
    return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, row.workspace))
    return Response.json({ error: "Document not found or access denied." }, { status: 404 });
  return Response.json({
    document: {
      ...row,
      workflow: parseList(row.workflow_json),
      checklist: parseList(row.checklist_json),
    },
  });
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id);
  if (!row)
    return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, row.workspace))
    return Response.json({ error: "You cannot edit this document." }, { status: 403 });
  const p = (await req.json()) as Record<string, unknown>;
  if (p.workspace && !canAccessWorkspace(member, String(p.workspace)))
    return Response.json(
      { error: "You cannot move this document to another workspace." },
      { status: 403 },
    );
  for (const key of [
    "title",
    "document_type",
    "department",
    "workspace",
    "owner",
    "review_date",
    "notes",
    "status",
  ])
    if (p[key] !== undefined)
      await env.DB.prepare(
        `UPDATE sop_documents SET ${key}=?,updated_at=? WHERE id=?`,
      )
        .bind(String(p[key]), new Date().toISOString(), id)
        .run();
  if (Array.isArray(p.checklist))
    await env.DB.prepare(
      "UPDATE sop_documents SET checklist_json=?,updated_at=? WHERE id=?",
    )
      .bind(JSON.stringify(p.checklist), new Date().toISOString(), id)
      .run();
  return Response.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id);
  if (!row)
    return Response.json({ error: "Document not found." }, { status: 404 });
  await initTeamTables();
  const user = await getAuthenticatedUser(),
    member = user
      ? await env.DB.prepare(
          "SELECT role FROM team_members WHERE lower(email)=? AND active=1",
        )
          .bind(user.email.toLowerCase())
          .first<{ role: string }>()
      : null;
  if (!member || !["Owner / Admin", "Developer / Technical Admin"].includes(member.role))
    return Response.json(
      { error: "Only the owner or technical administrator can remove controlled records." },
      { status: 403 },
    );
  const mode = new URL(req.url).searchParams.get("mode");
  if (mode === "workflow") {
    await env.DB.prepare(
      "UPDATE sop_documents SET ai_summary='',workflow_json='[]',checklist_json='[]',status='Uploaded',updated_at=? WHERE id=?",
    )
      .bind(new Date().toISOString(), id)
      .run();
    return Response.json({ removed: "workflow" });
  }
  const { results: resources } = await env.DB.prepare(
    "SELECT object_key FROM sop_resources WHERE sop_id=?",
  )
    .bind(id)
    .all<{ object_key: string }>();
  await Promise.all([
    env.BUCKET.delete(row.object_key),
    ...resources.map((resource) => env.BUCKET.delete(resource.object_key)),
  ]);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sop_resources WHERE sop_id=?").bind(id),
    env.DB.prepare(
      "UPDATE sop_documents SET object_key='',status='Removed',updated_at=? WHERE id=?",
    ).bind(new Date().toISOString(), id),
  ]);
  return Response.json({ removed: "document" });
}
