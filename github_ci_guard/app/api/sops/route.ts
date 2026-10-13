import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { ensureSops, parseList, type SopRow } from "./shared";
import { allowedWorkspaces, canWrite, getHubMember } from "../access";
const maxFileSize = 15 * 1024 * 1024;
export async function GET() {
  await ensureSops();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM sop_documents WHERE status<>'Removed' ORDER BY id DESC",
  ).all<SopRow>();
  return Response.json({
    documents: results.filter((row) => {
      const allowed = allowedWorkspaces(member);
      return allowed === null || allowed.includes(row.workspace);
    }).map((row) => ({
      ...row,
      workflow: parseList(row.workflow_json),
      checklist: parseList(row.checklist_json),
    })),
  });
}
export async function POST(req: Request) {
  await ensureSops();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const user = await getAuthenticatedUser();
  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "").trim();
  const workspace = String(form.get("workspace") || "Head Office"),
    allowed = allowedWorkspaces(member);
  if (allowed !== null && !allowed.includes(workspace))
    return Response.json({ error: "You do not have access to this workspace." }, { status: 403 });
  if (!(file instanceof File))
    return Response.json(
      { error: "Choose an SOP, manual or checklist file." },
      { status: 400 },
    );
  if (!title)
    return Response.json(
      { error: "Document title is required." },
      { status: 400 },
    );
  if (file.size > maxFileSize)
    return Response.json(
      { error: "Maximum file size is 15MB." },
      { status: 400 },
    );
  const now = new Date().toISOString(),
    objectKey = `sops/${crypto.randomUUID()}-${file.name}`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  const row = await env.DB.prepare(
    `INSERT INTO sop_documents (title,document_type,department,workspace,owner,review_date,notes,file_name,mime_type,size,object_key,status,ai_summary,workflow_json,checklist_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'Uploaded','','[]','[]',?,?,?) RETURNING *`,
  )
    .bind(
      title,
      String(form.get("document_type") || "SOP"),
      String(form.get("department") || "Operations"),
      workspace,
      String(form.get("owner") || "Operations"),
      String(form.get("review_date") || ""),
      String(form.get("notes") || ""),
      file.name,
      file.type || "application/octet-stream",
      file.size,
      objectKey,
      user?.email || "Current user",
      now,
      now,
    )
    .first<SopRow>();
  return Response.json({ document: row }, { status: 201 });
}
