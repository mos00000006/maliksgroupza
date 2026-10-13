import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import {
  createApprovalRequestedNotifications,
  createAssignmentNotification,
  createReturnedToWorkNotifications,
  createTaskApprovedNotifications,
} from "../../team/shared";
import {
  canAccessWorkspace,
  canApproveTasks,
  canWrite,
  getHubMember,
} from "../../access";

async function ensureWorkflowColumns() {
  try {
    await env.DB.prepare(
      "ALTER TABLE tasks ADD COLUMN approval_status TEXT NOT NULL DEFAULT ''",
    ).run();
  } catch {
    // Existing production databases already have the column after first use.
  }
}

export async function GET(
  _r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureWorkflowColumns();
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
  await ensureWorkflowColumns();
  const { id } = await params;
  const member = await getHubMember();
  const existing = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
    .bind(id)
    .first<Record<string, string | number>>();

  if (
    !existing ||
    !canWrite(member) ||
    !canAccessWorkspace(member, String(existing.project))
  )
    return Response.json({ error: "You cannot edit this task." }, { status: 403 });

  const p = (await req.json()) as Record<string, string>;
  if (p.project && !canAccessWorkspace(member, p.project))
    return Response.json(
      { error: "You cannot move this task to another workspace." },
      { status: 403 },
    );

  const user = await getAuthenticatedUser();
  const actor = user?.displayName || user?.email || "Hub User";
  const taskId = Number(existing.id);
  const taskTitle = String(existing.title);
  const workspace = String(p.project || existing.project);

  // Approval decisions are deliberately separate from normal task status edits.
  // This prevents Not started / In progress / Blocked from ever entering Approvals.
  if (p.approval_action) {
    if (!canApproveTasks(member))
      return Response.json(
        { error: "Only authorised approvers can approve or return tasks." },
        { status: 403 },
      );

    if (p.approval_action === "approve") {
      if (
        String(existing.status) !== "Complete" ||
        String(existing.approval_status || "") !== "Awaiting approval"
      )
        return Response.json(
          { error: "This task is not awaiting approval." },
          { status: 409 },
        );

      await env.DB.prepare(
        "UPDATE tasks SET status='Complete',approval_status='Approved' WHERE id=?",
      )
        .bind(id)
        .run();
      await createTaskApprovedNotifications({
        taskId,
        taskTitle,
        workspace,
        approvedBy: actor,
      });
    } else if (p.approval_action === "return") {
      if (
        String(existing.status) !== "Complete" ||
        String(existing.approval_status || "") !== "Awaiting approval"
      )
        return Response.json(
          { error: "This task is not awaiting approval." },
          { status: 409 },
        );

      await env.DB.prepare(
        "UPDATE tasks SET status='Returned',approval_status='Returned to work' WHERE id=?",
      )
        .bind(id)
        .run();
      await createReturnedToWorkNotifications({
        taskId,
        taskTitle,
        workspace,
        returnedBy: actor,
      });
    } else {
      return Response.json({ error: "Invalid approval action." }, { status: 400 });
    }

    const task = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
      .bind(id)
      .first<Record<string, string | number>>();
    return Response.json({ ok: true, task });
  }

  if (p.status === "Returned")
    return Response.json(
      { error: "Returned status can only be set from Approvals." },
      { status: 400 },
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

  if (p.status !== undefined && p.status !== String(existing.status)) {
    if (p.status === "Complete") {
      await env.DB.prepare(
        "UPDATE tasks SET approval_status='Awaiting approval' WHERE id=?",
      )
        .bind(id)
        .run();
      await createApprovalRequestedNotifications({
        taskId,
        taskTitle,
        workspace,
        completedBy: actor,
      });
    } else {
      await env.DB.prepare("UPDATE tasks SET approval_status='' WHERE id=?")
        .bind(id)
        .run();
    }
  }

  if (p.assignee_email) {
    const newEmail = p.assignee_email.trim().toLowerCase();
    const oldEmail = String(existing.assignee_email || "").trim().toLowerCase();
    if (newEmail && newEmail !== oldEmail) {
      const task = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
        .bind(id)
        .first<Record<string, string | number>>();
      if (task)
        await createAssignmentNotification({
          recipientEmail: newEmail,
          taskId: Number(task.id),
          taskTitle: String(task.title),
          workspace: String(task.project),
          assignedBy: actor,
        });
    }
  }

  const task = await env.DB.prepare("SELECT * FROM tasks WHERE id=?")
    .bind(id)
    .first<Record<string, string | number>>();
  return Response.json({ ok: true, task });
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

  try {
    await env.DB.prepare("DELETE FROM notifications WHERE task_id=?").bind(id).run();
  } catch {}

  await env.DB.batch(statements);
  await env.DB.prepare("DELETE FROM tasks WHERE id=?").bind(id).run();

  return Response.json({ deleted: true, id: existing.id, title: existing.title });
}
