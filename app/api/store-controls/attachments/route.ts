import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../auth";
import { canAccessWorkspace, canWrite, getHubMember } from "../../access";
import { initStoreControlTables, storeControlRecordWorkspace } from "../shared";

export async function POST(req: Request) {
  await initStoreControlTables();
  const member = await getHubMember();
  if (!canWrite(member)) return Response.json({ error: "Your access level is read only." }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  const recordType = String(form.get("record_type") || "");
  const recordId = Number(form.get("record_id") || 0);
  if (!(file instanceof File) || !recordId || !["audit", "checklist"].includes(recordType))
    return Response.json({ error: "File, record type and record ID are required." }, { status: 400 });
  if (file.size > 12 * 1024 * 1024)
    return Response.json({ error: "Maximum file size is 12MB." }, { status: 400 });
  const record = await storeControlRecordWorkspace(recordType, recordId);
  if (!record || !canAccessWorkspace(member, record.workspace))
    return Response.json({ error: "Record not found or access denied." }, { status: 404 });
  const user = await getAuthenticatedUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const key = `store-controls/${recordType}/${recordId}/${crypto.randomUUID()}-${safeName}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const attachment = await env.DB.prepare(`INSERT INTO store_control_attachments (
    record_type,record_id,workspace,name,type,size,object_key,uploaded_by,created_at
  ) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id,record_type,record_id,workspace,name,type,size,uploaded_by,created_at`)
    .bind(
      recordType,
      recordId,
      record.workspace,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      key,
      user?.displayName || user?.email || member?.name || "Hub user",
      new Date().toISOString(),
    )
    .first();
  return Response.json({ attachment }, { status: 201 });
}
