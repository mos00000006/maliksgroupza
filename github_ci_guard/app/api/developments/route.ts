import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { getHubMember } from "../access";
import { canAccessDevelopments, canWriteDevelopments, initDevelopmentTables } from "./shared";

export async function GET() {
  await initDevelopmentTables();
  const member = await getHubMember();
  if (!canAccessDevelopments(member)) return Response.json({ error: "Development access is not enabled." }, { status: 403 });
  const [{ results: projects }, { results: expenses }] = await Promise.all([
    env.DB.prepare(`SELECT p.*,
      (SELECT COALESCE(SUM(e.budgeted_amount),0) FROM development_expenses e WHERE e.project_id=p.id) AS item_budget,
      (SELECT COALESCE(SUM(e.committed_amount),0) FROM development_expenses e WHERE e.project_id=p.id) AS committed_total,
      (SELECT COALESCE(SUM(e.actual_amount),0) FROM development_expenses e WHERE e.project_id=p.id) AS actual_total,
      (SELECT COALESCE(SUM(e.paid_amount),0) FROM development_expenses e WHERE e.project_id=p.id) AS paid_total,
      (SELECT COUNT(*) FROM development_documents d WHERE d.project_id=p.id) AS document_count
      FROM development_projects p ORDER BY CASE p.status WHEN 'Active Build' THEN 0 WHEN 'Planning' THEN 1 ELSE 2 END,p.id DESC`).all(),
    env.DB.prepare("SELECT * FROM development_expenses ORDER BY expense_date DESC,id DESC").all(),
  ]);
  return Response.json({ projects, expenses });
}

export async function POST(req: Request) {
  await initDevelopmentTables();
  const member = await getHubMember();
  if (!canWriteDevelopments(member)) return Response.json({ error: "You cannot create development projects." }, { status: 403 });
  const p = (await req.json()) as Record<string, string | number>;
  if (!String(p.project_name || "").trim()) return Response.json({ error: "Development name is required." }, { status: 400 });
  const user = await getAuthenticatedUser(), now = new Date().toISOString();
  const project = await env.DB.prepare(`INSERT INTO development_projects
    (project_name,site_location,project_type,status,rag_status,project_manager,start_date,planned_opening_date,actual_opening_date,
     approved_budget,contingency_budget,stock_budget,progress_percent,approval_status,approved_by,notes,created_by,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`).bind(
      String(p.project_name).trim(),p.site_location || "",p.project_type || "New Store",p.status || "Planning",p.rag_status || "Green",
      p.project_manager || "",p.start_date || "",p.planned_opening_date || "",p.actual_opening_date || "",Number(p.approved_budget)||0,
      Number(p.contingency_budget)||0,Number(p.stock_budget)||0,Number(p.progress_percent)||0,p.approval_status || "Pending approval",
      p.approved_by || "",p.notes || "",user?.displayName || member?.name || "Current user",now,now,
    ).first();
  return Response.json({ project }, { status: 201 });
}
