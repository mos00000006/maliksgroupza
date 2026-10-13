import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { ensureSops, getSop } from "../../shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";

const maxFileSize = 15 * 1024 * 1024;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await ensureSops();
  const sop = await getSop(id),
    member = await getHubMember();
  if (!sop || !member || !canAccessWorkspace(member, sop.workspace))
    return Response.json({ error: "Process not found or access denied." }, { status: 404 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM sop_resources WHERE sop_id=? ORDER BY id DESC",
  )
    .bind(id)
    .all();
  return Response.json({ resources: results });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    sop = await getSop(id);
  if (!sop)
    return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, sop.workspace))
    return Response.json({ error: "You cannot add files to this process." }, { status: 403 });
  const form = await req.formData(),
    file = form.get("file"),
    label = String(form.get("label") || "").trim(),
    resourceType = String(form.get("resource_type") || "Form / Checklist");
  if (!(file instanceof File) || !label)
    return Response.json(
      { error: "Enter a label and choose the supporting file." },
      { status: 400 },
    );
  if (file.size > maxFileSize)
    return Response.json({ error: "Maximum file size is 15MB." }, { status: 400 });
  const user = await getAuthenticatedUser(),
    now = new Date().toISOString(),
    objectKey = `sops/${id}/resources/${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  const row = await env.DB.prepare(
    "INSERT INTO sop_resources (sop_id,label,resource_type,file_name,mime_type,size,object_key,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING *",
  )
    .bind(
      id,
      label,
      resourceType,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      objectKey,
      user?.email || "Current user",
      now,
    )
    .first();
  return Response.json({ resource: row }, { status: 201 });
}
