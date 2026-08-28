import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { getHubMember } from "../../../access";
import { canAccessDevelopments, canWriteDevelopments, initDevelopmentTables } from "../../shared";

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  await initDevelopmentTables(); const {id}=await params; const member=await getHubMember();
  if(!canAccessDevelopments(member)) return Response.json({error:"Development access is not enabled."},{status:403});
  const {results}=await env.DB.prepare("SELECT id,project_id,expense_id,document_type,name,mime_type,size,uploaded_by,created_at FROM development_documents WHERE project_id=? ORDER BY id DESC").bind(id).all();
  return Response.json({documents:results});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  await initDevelopmentTables(); const {id}=await params; const member=await getHubMember();
  if(!canWriteDevelopments(member)) return Response.json({error:"You cannot upload development documents."},{status:403});
  const form=await req.formData(),file=form.get("file"); if(!(file instanceof File)) return Response.json({error:"Choose a document or picture."},{status:400});
  if(file.size>15*1024*1024) return Response.json({error:"Maximum file size is 15MB."},{status:400});
  const documentType=String(form.get("document_type")||"Invoice / Quotation"),expenseId=Number(form.get("expense_id"))||0;
  const objectKey=`developments/${id}/${crypto.randomUUID()}-${file.name}`; await env.BUCKET.put(objectKey,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  const user=await getAuthenticatedUser(); const document=await env.DB.prepare(`INSERT INTO development_documents
    (project_id,expense_id,document_type,name,mime_type,size,object_key,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)
    RETURNING id,project_id,expense_id,document_type,name,mime_type,size,uploaded_by,created_at`).bind(
      id,expenseId,documentType,file.name,file.type||"application/octet-stream",file.size,objectKey,user?.displayName||member?.name||"Current user",new Date().toISOString()
    ).first();
  return Response.json({document},{status:201});
}
