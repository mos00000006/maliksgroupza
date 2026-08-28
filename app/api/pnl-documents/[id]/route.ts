import { env } from "cloudflare:workers";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await env.DB.prepare(
    `SELECT d.*,r.workspace FROM pnl_documents d
     JOIN pnl_reports r ON r.id=d.report_id WHERE d.id=?`,
  )
    .bind(id)
    .first<{ object_key: string; name: string; type: string; workspace: string }>();
  const member = await getHubMember();
  if (!document || !member || !canAccessWorkspace(member, document.workspace))
    return new Response("Not found or access denied", { status: 404 });
  const object = await env.BUCKET.get(document.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": document.type,
      "content-disposition": `inline; filename="${document.name.replaceAll('"', "")}"`,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await env.DB.prepare(
    `SELECT d.object_key,r.workspace FROM pnl_documents d
     JOIN pnl_reports r ON r.id=d.report_id WHERE d.id=?`,
  )
    .bind(id)
    .first<{ object_key: string; workspace: string }>();
  const member = await getHubMember();
  if (!document || !canWrite(member) || !canAccessWorkspace(member, document.workspace))
    return Response.json({ error: "You cannot remove this document." }, { status: 403 });
  await env.BUCKET.delete(document.object_key);
  await env.DB.prepare("DELETE FROM pnl_documents WHERE id=?").bind(id).run();
  return Response.json({ deleted: true });
}
