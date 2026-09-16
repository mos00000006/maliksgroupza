import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { getSop, parseList } from "../../shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";
type Step = {
  step_no: number;
  title: string;
  description: string;
  owner_role: string;
  due_offset_days: number;
  evidence_required: string;
  approval_required: boolean;
};
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id),
    user = await getAuthenticatedUser();
  if (!row)
    return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, row.workspace))
    return Response.json({ error: "You cannot activate this workflow." }, { status: 403 });
  const steps = parseList<Step>(row.workflow_json);
  if (!steps.length)
    return Response.json(
      { error: "Generate a workflow before creating tasks." },
      { status: 400 },
    );
  const now = new Date();
  await env.DB.batch(
    steps.map((step) => {
      const due = new Date(now);
      due.setDate(
        due.getDate() + Math.max(0, Number(step.due_offset_days) || 0),
      );
      return env.DB.prepare(
        "INSERT INTO tasks (title,project,owner,assignee,due,priority,status,description,created_by,created_at,task_type,task_group) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      ).bind(
        `${step.step_no}. ${step.title}`,
        row.workspace,
        row.owner,
        step.owner_role || row.owner,
        due.toISOString().slice(0, 10),
        step.approval_required ? "High" : "Medium",
        "Not started",
        `${step.description}\n\nEvidence required: ${step.evidence_required}${step.approval_required ? "\nManagement approval required." : ""}\nSource SOP: ${row.title}`,
        user?.email || "AI workflow activation",
        now.toISOString(),
        row.department,
        "Store Tasks",
      );
    }),
  );
  await env.DB.prepare(
    "UPDATE sop_documents SET status='Workflow activated',updated_at=? WHERE id=?",
  )
    .bind(new Date().toISOString(), id)
    .run();
  return Response.json({ ok: true, created: steps.length });
}
