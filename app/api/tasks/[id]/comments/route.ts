import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { addTaskActivity } from "../../task-controls";
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
      { error: "You cannot comment on this task." },
      { status: 403 },
    );
  const user = await getAuthenticatedUser();
  const { body } = (await req.json()) as { body: string };
  if (!body?.trim())
    return Response.json({ error: "Comment required" }, { status: 400 });
  const c = await env.DB.prepare(
    "INSERT INTO comments (task_id,body,author,created_at) VALUES (?,?,?,?) RETURNING *",
  )
    .bind(
      id,
      body.trim(),
      user?.displayName || "Current user",
      new Date().toISOString(),
    )
    .first();
  await addTaskActivity(Number(id),"COMMENT_ADDED",body.trim().slice(0,160),user?.displayName||user?.email||"Hub User",user?.email||"");
  return Response.json({ comment: c }, { status: 201 });
}
