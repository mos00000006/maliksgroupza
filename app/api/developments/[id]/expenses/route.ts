import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { getHubMember } from "../../../access";
import { canWriteDevelopments, initDevelopmentTables } from "../../shared";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  await initDevelopmentTables(); const {id}=await params; const member=await getHubMember();
  if(!canWriteDevelopments(member)) return Response.json({error:"You cannot add development expenses."},{status:403});
  const p=(await req.json()) as Record<string,string|number>; if(!p.category) return Response.json({error:"Expense category is required."},{status:400});
  const user=await getAuthenticatedUser(),now=new Date().toISOString();
  const expense=await env.DB.prepare(`INSERT INTO development_expenses
    (project_id,category,supplier_contractor,description,budgeted_amount,committed_amount,actual_amount,paid_amount,expense_status,
     invoice_number,expense_date,due_date,owner,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`).bind(
      id,p.category,p.supplier_contractor||"",p.description||"",Number(p.budgeted_amount)||0,Number(p.committed_amount)||0,
      Number(p.actual_amount)||0,Number(p.paid_amount)||0,p.expense_status||"Budgeted",p.invoice_number||"",p.expense_date||"",
      p.due_date||"",p.owner||"",p.notes||"",user?.displayName||member?.name||"Current user",now,now,
    ).first();
  return Response.json({expense},{status:201});
}
