import { env } from "cloudflare:workers";
import { getHubMember } from "../../../access";
import { canAccessDevelopments, canWriteDevelopments, initDevelopmentTables } from "../../shared";

export async function GET(_req:Request,{params}:{params:Promise<{documentId:string}>}){
  await initDevelopmentTables(); const {documentId}=await params; const member=await getHubMember();
  if(!canAccessDevelopments(member)) return new Response("Not found or access denied",{status:404});
  const row=await env.DB.prepare("SELECT name,mime_type,object_key FROM development_documents WHERE id=?").bind(documentId).first<{name:string;mime_type:string;object_key:string}>();
  if(!row) return new Response("Not found",{status:404}); const object=await env.BUCKET.get(row.object_key); if(!object) return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":row.mime_type,"content-disposition":`inline; filename="${row.name.replaceAll('"','')}"`}});
}

export async function DELETE(_req:Request,{params}:{params:Promise<{documentId:string}>}){
  await initDevelopmentTables(); const {documentId}=await params; const member=await getHubMember();
  if(!canWriteDevelopments(member)) return Response.json({error:"You cannot remove development documents."},{status:403});
  const row=await env.DB.prepare("SELECT object_key FROM development_documents WHERE id=?").bind(documentId).first<{object_key:string}>();
  if(!row) return Response.json({error:"Document not found."},{status:404}); await env.BUCKET.delete(row.object_key); await env.DB.prepare("DELETE FROM development_documents WHERE id=?").bind(documentId).run();
  return Response.json({ok:true});
}
