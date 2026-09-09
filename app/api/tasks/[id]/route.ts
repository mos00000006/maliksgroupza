import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import { createAssignmentNotification } from "../../team/shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";
export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const task = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
    .bind(id)
    .first<Record<string, unknown>>();
  const member = await getHubMember();
  if (!task || !member || !canAccessWorkspace(member, String(task.project)))
    return Response.json(
      { error: "Task not found or access denied." },
      { status: 404 },
    );
  const comments = (
    await env.DB.prepare(
      "SELECT * FROM comments WHERE task_id=? ORDER BY id DESC",
    )
      .bind(id)
      .all()
  ).results;
  const attachments = (
    await env.DB.prepare(
      "SELECT id,task_id,name,type,size,uploaded_by,created_at FROM attachments WHERE task_id=? ORDER BY id DESC",
    )
      .bind(id)
      .all()
  ).results;
  return Response.json({ task, comments, attachments });
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember(),
    existing = await env.DB.prepare("SELECT project FROM tasks WHERE id=?")
      .bind(id)
      .first<{ project: string }>();
  if (
    !existing ||
    !canWrite(member) ||
    !canAccessWorkspace(member, existing.project)
  )
    return Response.json({ error: "You cannot edit this task." }, { status: 403 });
  const p = (await req.json()) as Record<string, string>;
  if (p.project && !canAccessWorkspace(member, p.project))
    return Response.json(
      { error: "You cannot move this task to another workspace." },
      { status: 403 },
    );
  const allowed = [
    "title",
    "project",
    "owner",
    "assignee",
    "assignee_email",
    "due",
    "priority",
    "status",
    "description",
    "task_type",
    "task_group",
  ];
  for (const k of allowed)
    if (p[k] !== undefined)
      await env.DB.prepare(`UPDATE tasks SET ${k}=? WHERE id=?`)
        .bind(p[k], id)
        .run();
  if (p.assignee_email) {
    const task = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
      .bind(id)
      .first<Record<string, string | number>>();
    const user = await getAuthenticatedUser();
    if (task)
      await createAssignmentNotification({
        recipientEmail: p.assignee_email,
        taskId: Number(task.id),
        taskTitle: String(task.title),
        workspace: String(task.project),
        assignedBy: user?.displayName || user?.email || "Hub Owner",
      });
  }
  return Response.json({ ok: true });
}
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  const existing = await env.DB.prepare(
    "SELECT id,project,title FROM tasks WHERE id=?",
  )
    .bind(id)
    .first<{ id: number; project: string; title: string }>();

  if (
    !existing ||
    !canWrite(member) ||
    !canAccessWorkspace(member, existing.project)
  )
    return Response.json(
      { error: "You cannot delete this task." },
      { status: 403 },
    );

  const attachmentQuery = await env.DB.prepare(
    "SELECT object_key FROM attachments WHERE task_id=?",
  )
    .bind(id)
    .all();
  const attachments = attachmentQuery.results as Array<{ object_key: string }>;

  await Promise.all(
    attachments
      .map((attachment: { object_key: string }) => attachment.object_key)
      .filter(Boolean)
      .map((objectKey: string) => env.BUCKET.delete(objectKey)),
  );

  const statements = [
    env.DB.prepare("DELETE FROM comments WHERE task_id=?").bind(id),
    env.DB.prepare("DELETE FROM attachments WHERE task_id=?").bind(id),
  ];

  // Notifications are initialised by the team module. Keep deletion compatible
  // with older databases where that table may not have been created yet.
  try {
    await env.DB.prepare("DELETE FROM notifications WHERE task_id=?").bind(id).run();
  } catch {}

  await env.DB.batch(statements);
  await env.DB.prepare("DELETE FROM tasks WHERE id=?").bind(id).run();

  return Response.json({ deleted: true, id: existing.id, title: existing.title });
}
