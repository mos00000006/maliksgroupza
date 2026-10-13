import { env } from "cloudflare:workers";
import { getHubMember } from "../../../access";
import {
  canManageStoreSpecials,
  initStoreSpecialTables,
  memberCanSeeStoreSpecial,
  type StoreSpecialRow,
} from "../../shared";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initStoreSpecialTables();
  const member = await getHubMember();
  if (!member) return new Response("Not found", { status: 404 });

  const { id } = await params;
  const row = await env.DB.prepare(
    `SELECT i.object_key,i.file_name,i.content_type,
            s.id AS special_id,s.all_branches,s.workspaces_json,s.active
     FROM store_special_images i
     JOIN store_specials s ON s.id=i.special_id
     WHERE i.id=? AND s.active=1`,
  )
    .bind(Number(id))
    .first<{
      object_key: string;
      file_name: string;
      content_type: string;
      special_id: number;
      all_branches: number;
      workspaces_json: string;
      active: number;
    }>();

  if (!row || !memberCanSeeStoreSpecial(member, row as StoreSpecialRow))
    return new Response("Not found", { status: 404 });

  const object = await env.BUCKET.get(row.object_key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": row.content_type || "image/jpeg",
      "cache-control": "private, max-age=3600",
      "content-disposition": `inline; filename="${row.file_name.replaceAll('"', "")}"`,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await initStoreSpecialTables();
  const member = await getHubMember();
  if (!member || !canManageStoreSpecials(member))
    return Response.json({ error: "Access denied." }, { status: 403 });

  const { id } = await params;
  const row = await env.DB.prepare(
    `SELECT i.id,i.object_key,
            s.id AS special_id,s.all_branches,s.workspaces_json,s.active
     FROM store_special_images i
     JOIN store_specials s ON s.id=i.special_id
     WHERE i.id=? AND s.active=1`,
  )
    .bind(Number(id))
    .first<{
      id: number;
      object_key: string;
      special_id: number;
      all_branches: number;
      workspaces_json: string;
      active: number;
    }>();

  if (!row || !memberCanSeeStoreSpecial(member, row as StoreSpecialRow))
    return Response.json({ error: "Image not found or access denied." }, { status: 404 });

  try {
    await env.BUCKET.delete(row.object_key);
  } catch {}
  await env.DB.prepare("DELETE FROM store_special_images WHERE id=?").bind(Number(id)).run();

  return Response.json({ ok: true });
}
