import { env } from "cloudflare:workers";
import { ensureSops } from "../../../shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../../access";

type ResourceRow = {
  id: number;
  sop_id: number;
  file_name: string;
  mime_type: string;
  object_key: string;
  workspace: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const { id, resourceId } = await params;
  await ensureSops();
  const row = await env.DB.prepare(
    "SELECT r.*,d.workspace FROM sop_resources r JOIN sop_documents d ON d.id=r.sop_id WHERE r.id=? AND r.sop_id=?",
  )
    .bind(resourceId, id)
    .first<ResourceRow>();
  if (!row) return new Response("Resource not found", { status: 404 });
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, row.workspace))
    return new Response("Resource not found or access denied", { status: 404 });
  const object = await env.BUCKET.get(row.object_key);
  if (!object) return new Response("Stored file not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.mime_type,
      "content-disposition": `inline; filename="${row.file_name.replaceAll('"', "")}"`,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; resourceId: string }> },
) {
  const { id, resourceId } = await params;
  await ensureSops();
  const row = await env.DB.prepare(
    "SELECT r.*,d.workspace FROM sop_resources r JOIN sop_documents d ON d.id=r.sop_id WHERE r.id=? AND r.sop_id=?",
  )
    .bind(resourceId, id)
    .first<ResourceRow>();
  if (!row) return Response.json({ error: "Resource not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, row.workspace))
    return Response.json({ error: "You cannot remove this resource." }, { status: 403 });
  await env.BUCKET.delete(row.object_key);
  await env.DB.prepare("DELETE FROM sop_resources WHERE id=?").bind(resourceId).run();
  return Response.json({ deleted: true });
}
