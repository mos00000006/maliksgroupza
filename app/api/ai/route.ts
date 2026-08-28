import { env } from "cloudflare:workers";
import { allowedWorkspaces, canAccessWorkspace, getHubMember } from "../access";
export async function POST(req: Request) {
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { message } = (await req.json()) as { message: string };
  const key = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!key)
    return Response.json(
      { configured: false, error: "AI connection has not been activated yet." },
      { status: 503 },
    );
  let tasks = (
    await env.DB.prepare(
      "SELECT title,project,owner,assignee,due,priority,status,description FROM tasks ORDER BY id DESC LIMIT 150",
    ).all()
  ).results;
  let workspaces = (
    await env.DB.prepare(
      "SELECT name,type,region,manager FROM workspaces WHERE active=1",
    ).all()
  ).results;
  const allowed = allowedWorkspaces(member);
  if (allowed !== null) {
    tasks = tasks.filter((task) => canAccessWorkspace(member, String(task.project)));
    workspaces = workspaces.filter((workspace) => canAccessWorkspace(member, String(workspace.name)));
  }
  let sops: unknown[] = [];
  try {
    sops = (
      await env.DB.prepare(
        "SELECT title,department,workspace,status,ai_summary,workflow_json FROM sop_documents ORDER BY id DESC LIMIT 40",
      ).all()
    ).results;
    if (allowed !== null)
      sops = sops.filter((sop) => canAccessWorkspace(member, String((sop as Record<string, unknown>).workspace)));
  } catch {}
  const prompt = `You are Maliks Group AI Sidekick. Use only supplied Hub data. Flag overdue, blocked and unassigned work. Never claim to have changed a record. SOP workflows become tasks only after authorised approval.\n\nWORKSPACES:\n${JSON.stringify(workspaces)}\n\nTASKS:\n${JSON.stringify(tasks)}\n\nSOP WORKFLOWS:\n${JSON.stringify(sops)}\n\nUSER REQUEST:\n${message}`;
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-5-mini", input: prompt, store: false }),
  });
  if (!r.ok)
    return Response.json(
      {
        configured: true,
        error: "The AI service could not complete this request.",
      },
      { status: 502 },
    );
  const j = (await r.json()) as { output_text?: string };
  return Response.json({
    configured: true,
    answer: j.output_text || "No response was returned.",
  });
}
