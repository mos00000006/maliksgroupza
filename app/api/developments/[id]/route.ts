import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canWriteDevelopments, initDevelopmentTables } from "../shared";

export async function PATCH(req: Request,{ params }: { params: Promise<{ id: string }> }) {
  await initDevelopmentTables(); const { id } = await params; const member = await getHubMember();
  if (!canWriteDevelopments(member)) return Response.json({ error: "You cannot update development projects." }, { status: 403 });
  const p=(await req.json()) as Record<string,string|number>;
  for(const key of ["project_name","site_location","project_type","status","rag_status","project_manager","start_date","planned_opening_date","actual_opening_date","approved_budget","contingency_budget","stock_budget","progress_percent","approval_status","approved_by","notes"])
    if(p[key]!==undefined) await env.DB.prepare(`UPDATE development_projects SET ${key}=?,updated_at=? WHERE id=?`).bind(p[key],new Date().toISOString(),id).run();
  return Response.json({ok:true});
}
