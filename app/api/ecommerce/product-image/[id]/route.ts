import { env } from "cloudflare:workers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const row = await env.DB.prepare(
    `SELECT p.image_key,p.image_name,p.image_type
     FROM catalogue_products p
     JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id
     WHERE p.id=? AND p.active=1 AND (e.b2c_enabled=1 OR e.b2b_enabled=1)`,
  )
    .bind(id)
    .first<{ image_key: string; image_name: string; image_type: string }>();
  if (!row?.image_key || row.image_key.startsWith("static:")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(row.image_key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": row.image_type || "application/octet-stream",
      "cache-control": "public, max-age=3600",
      "content-disposition": `inline; filename="${row.image_name.replaceAll('"', "")}"`,
    },
  });
}
