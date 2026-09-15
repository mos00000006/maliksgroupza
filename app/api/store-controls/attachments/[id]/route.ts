import { env } from "cloudflare:workers";
import { canAccessWorkspace, getHubMember } from "../../../access";
import { initStoreControlTables } from "../../shared";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initStoreControlTables();
  const { id } = await params;
  const attachment = await env.DB.prepare("SELECT * FROM store_control_attachments WHERE id=?")
    .bind(id)
    .first<{ object_key: string; name: string; type: string; workspace: string }>();
  const member = await getHubMember();
  if (!attachment || !member || !canAccessWorkspace(member, attachment.workspace))
    return new Response("Not found or access denied", { status: 404 });
  const object = await env.BUCKET.get(attachment.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": attachment.type || "application/octet-stream",
      "content-disposition": `inline; filename="${attachment.name.replaceAll('"', "")}"`,
      "cache-control": "private, max-age=300",
    },
  });
}
