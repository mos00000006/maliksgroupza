import { env } from "cloudflare:workers";
import { getSop } from "../../shared";
import { canAccessWorkspace, getHubMember } from "../../../access";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id);
  if (!row) return new Response("Document not found", { status: 404 });
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, row.workspace))
    return new Response("Document not found or access denied", { status: 404 });
  const object = await env.BUCKET.get(row.object_key);
  if (!object) return new Response("Stored file not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.mime_type,
      "content-disposition": `inline; filename="${row.file_name.replaceAll('"', "")}"`,
    },
  });
}
