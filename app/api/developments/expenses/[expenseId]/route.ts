import { env } from "cloudflare:workers";
import { getHubMember } from "../../../access";
import { canWriteDevelopments, initDevelopmentTables } from "../../shared";

export async function PATCH(req:Request,{params}:{params:Promise<{expenseId:string}>}){
  await initDevelopmentTables(); const {expenseId}=await params; const member=await getHubMember();
  if(!canWriteDevelopments(member)) return Response.json({error:"You cannot update development expenses."},{status:403});
  const p=(await req.json()) as Record<string,string|number>;
  for(const key of ["category","supplier_contractor","description","budgeted_amount","committed_amount","actual_amount","paid_amount","expense_status","invoice_number","expense_date","due_date","owner","notes"])
    if(p[key]!==undefined) await env.DB.prepare(`UPDATE development_expenses SET ${key}=?,updated_at=? WHERE id=?`).bind(p[key],new Date().toISOString(),expenseId).run();
  return Response.json({ok:true});
}
