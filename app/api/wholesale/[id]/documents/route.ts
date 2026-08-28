import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  if (!member || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "Wholesale access is not enabled." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT id,opportunity_id,document_type,name,mime_type,size,uploaded_by,created_at FROM wholesale_customer_documents WHERE opportunity_id=? ORDER BY id DESC",
  ).bind(id).all();
  return Response.json({ documents: results });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "You cannot upload customer documents." }, { status: 403 });
  const customer = await env.DB.prepare("SELECT id FROM wholesale_opportunities WHERE id=?")
    .bind(id).first();
  if (!customer) return Response.json({ error: "Customer application not found." }, { status: 404 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a document or picture." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024)
    return Response.json({ error: "Maximum file size is 15MB." }, { status: 400 });
  const documentType = String(form.get("document_type") || "Supporting document");
  const objectKey = `wholesale-customers/${id}/${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const user = await getAuthenticatedUser();
  const document = await env.DB.prepare(
    `INSERT INTO wholesale_customer_documents
      (opportunity_id,document_type,name,mime_type,size,object_key,uploaded_by,created_at)
      VALUES (?,?,?,?,?,?,?,?) RETURNING id,opportunity_id,document_type,name,mime_type,size,uploaded_by,created_at`,
  ).bind(
    id, documentType, file.name, file.type || "application/octet-stream", file.size,
    objectKey, user?.displayName || "Current user", new Date().toISOString(),
  ).first();
  return Response.json({ document }, { status: 201 });
}
