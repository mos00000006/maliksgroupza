import { env } from "cloudflare:workers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const row = await env.DB.prepare(
      `SELECT i.object_key,i.file_name,i.content_type
       FROM store_special_images i
       JOIN store_specials s ON s.id=i.special_id
       WHERE i.id=? AND s.active=1 AND s.start_date<=date('now') AND s.end_date>=date('now')`,
    )
      .bind(id)
      .first<{ object_key: string; file_name: string; content_type: string }>();
    if (!row?.object_key) return new Response("Not found", { status: 404 });
    const object = await env.BUCKET.get(row.object_key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, {
      headers: {
        "content-type": row.content_type || "image/jpeg",
        "cache-control": "public, max-age=1800",
        "content-disposition": `inline; filename="${row.file_name.replaceAll('"', "")}"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
