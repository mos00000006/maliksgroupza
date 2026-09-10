import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManageCatalogue, initCatalogueTable, productResponse } from "../shared";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Catalogue editing is restricted." }, { status: 403 });
  const { id } = await params;
  const existing = await env.DB.prepare(
    "SELECT * FROM catalogue_products WHERE id=? AND active=1",
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!existing) return Response.json({ error: "Product not found." }, { status: 404 });

  const form = await req.formData();
  const code = String(form.get("code") || existing.code || "").trim();
  const name = String(form.get("name") || existing.name || "").trim();
  const description = String(form.get("description") ?? existing.description ?? "").trim();
  const category = String(form.get("category") || existing.category || "General").trim() || "General";
  const image = form.get("image");
  if (!code || !name)
    return Response.json({ error: "Product code and product name are required." }, { status: 400 });

  let imageKey = String(existing.image_key || "");
  let imageName = String(existing.image_name || "");
  let imageType = String(existing.image_type || "");
  let imageSize = Number(existing.image_size || 0);
  let newImageKey = "";
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/"))
      return Response.json({ error: "Catalogue pictures must be image files." }, { status: 400 });
    if (image.size > 8 * 1024 * 1024)
      return Response.json({ error: "Catalogue product pictures are limited to 8MB." }, { status: 400 });
    newImageKey = `catalogue/${crypto.randomUUID()}-${image.name}`;
    await env.BUCKET.put(newImageKey, await image.arrayBuffer(), {
      httpMetadata: { contentType: image.type || "application/octet-stream" },
    });
    imageKey = newImageKey;
    imageName = image.name;
    imageType = image.type || "application/octet-stream";
    imageSize = image.size;
  }

  const now = new Date().toISOString();
  try {
    const row = await env.DB.prepare(
      `UPDATE catalogue_products SET
       code=?,name=?,description=?,category=?,image_name=?,image_type=?,image_size=?,image_key=?,updated_by=?,updated_at=?
       WHERE id=? RETURNING *`,
    )
      .bind(
        code,
        name,
        description,
        category,
        imageName,
        imageType,
        imageSize,
        imageKey,
        member.email,
        now,
        id,
      )
      .first<Record<string, unknown>>();
    const oldKey = String(existing.image_key || "");
    if (newImageKey && oldKey && oldKey !== newImageKey)
      await env.BUCKET.delete(oldKey).catch(() => undefined);
    return Response.json({ product: row ? productResponse(row) : null });
  } catch (error) {
    if (newImageKey) await env.BUCKET.delete(newImageKey).catch(() => undefined);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("constraint"))
      return Response.json({ error: `Product code ${code} already exists.` }, { status: 409 });
    return Response.json({ error: "The catalogue product could not be saved." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Catalogue editing is restricted." }, { status: 403 });
  const { id } = await params;
  const existing = await env.DB.prepare(
    "SELECT image_key FROM catalogue_products WHERE id=? AND active=1",
  )
    .bind(id)
    .first<{ image_key: string }>();
  if (!existing) return Response.json({ error: "Product not found." }, { status: 404 });
  await env.DB.prepare(
    "UPDATE catalogue_products SET active=0,updated_by=?,updated_at=? WHERE id=?",
  )
    .bind(member.email, new Date().toISOString(), id)
    .run();
  if (existing.image_key)
    await env.BUCKET.delete(existing.image_key).catch(() => undefined);
  return Response.json({ ok: true });
}
