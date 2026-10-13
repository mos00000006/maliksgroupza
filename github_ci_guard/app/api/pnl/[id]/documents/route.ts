import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  const report = await env.DB.prepare("SELECT workspace FROM pnl_reports WHERE id=?")
    .bind(id)
    .first<{ workspace: string }>();
  if (!report || !member || !canAccessWorkspace(member, report.workspace))
    return Response.json({ error: "Not found or access denied." }, { status: 404 });
  const { results } = await env.DB.prepare(
    "SELECT id,report_id,name,type,size,uploaded_by,created_at FROM pnl_documents WHERE report_id=? ORDER BY id DESC",
  )
    .bind(id)
    .all();
  return Response.json({ documents: results });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  const report = await env.DB.prepare("SELECT workspace FROM pnl_reports WHERE id=?")
    .bind(id)
    .first<{ workspace: string }>();
  if (!report || !canWrite(member) || !canAccessWorkspace(member, report.workspace))
    return Response.json({ error: "You cannot upload to this P&L." }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return Response.json({ error: "File required." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024)
    return Response.json({ error: "Maximum file size is 15MB." }, { status: 400 });
  const user = await getAuthenticatedUser();
  const key = `pnl/${id}/${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  const document = await env.DB.prepare(
    `INSERT INTO pnl_documents (report_id,name,type,size,object_key,uploaded_by,created_at)
     VALUES (?,?,?,?,?,?,?) RETURNING id,report_id,name,type,size,uploaded_by,created_at`,
  )
    .bind(
      id,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      key,
      user?.displayName || "Current user",
      new Date().toISOString(),
    )
    .first();
  return Response.json({ document }, { status: 201 });
}
