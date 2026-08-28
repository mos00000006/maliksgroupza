import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember(),
    task = await env.DB.prepare("SELECT project FROM tasks WHERE id=?")
      .bind(id)
      .first<{ project: string }>();
  if (!task || !canWrite(member) || !canAccessWorkspace(member, task.project))
    return Response.json(
      { error: "You cannot attach files to this task." },
      { status: 403 },
    );
  const user = await getAuthenticatedUser();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return Response.json({ error: "File required" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024)
    return Response.json(
      { error: "Maximum file size is 15MB" },
      { status: 400 },
    );
  const key = `tasks/${id}/${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  const a = await env.DB.prepare(
    "INSERT INTO attachments (task_id,name,type,size,object_key,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?) RETURNING id,task_id,name,type,size,uploaded_by,created_at",
  )
    .bind(
      id,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      key,
      user?.displayName || "Current user",
      new Date().toISOString(),
    )
    .first();
  return Response.json({ attachment: a }, { status: 201 });
}
