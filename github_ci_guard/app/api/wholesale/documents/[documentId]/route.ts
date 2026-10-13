import { env } from "cloudflare:workers";
import { canAccessWorkspace, getHubMember } from "../../../access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, "Wholesale Division"))
    return new Response("Not found or access denied", { status: 404 });
  const document = await env.DB.prepare(
    "SELECT name,mime_type,object_key FROM wholesale_customer_documents WHERE id=?",
  ).bind(documentId).first<{ name: string; mime_type: string; object_key: string }>();
  if (!document) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(document.object_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, { headers: {
    "content-type": document.mime_type,
    "content-disposition": `inline; filename="${document.name.replaceAll('"', '')}"`,
  }});
}
