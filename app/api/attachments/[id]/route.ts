import { env } from "cloudflare:workers";
import { canAccessWorkspace, getHubMember } from "../../access";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const m = await env.DB.prepare("SELECT a.*,t.project FROM attachments a JOIN tasks t ON t.id=a.task_id WHERE a.id=?")
    .bind(id)
    .first<{ object_key: string; name: string; type: string; project: string }>();
  if (!m) return new Response("Not found", { status: 404 });
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, m.project))
    return new Response("Not found or access denied", { status: 404 });
  const o = await env.BUCKET.get(m.object_key);
  if (!o) return new Response("Not found", { status: 404 });
  return new Response(o.body, {
    headers: {
      "content-type": m.type,
      "content-disposition": `inline; filename="${m.name.replaceAll('"', "")}"`,
    },
  });
}
