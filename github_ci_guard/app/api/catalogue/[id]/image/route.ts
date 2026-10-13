import { env } from "cloudflare:workers";
import { getHubMember } from "../../../access";
import { initCatalogueTable } from "../../shared";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member) return new Response("Not found", { status: 404 });
  const { id } = await params;
  const row = await env.DB.prepare(
    "SELECT image_key,image_name,image_type FROM catalogue_products WHERE id=? AND active=1",
  )
    .bind(id)
    .first<{ image_key: string; image_name: string; image_type: string }>();
  if (!row?.image_key) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(row.image_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.image_type || "application/octet-stream",
      "cache-control": "private, max-age=3600",
      "content-disposition": `inline; filename="${row.image_name.replaceAll('"', "")}"`,
    },
  });
}
