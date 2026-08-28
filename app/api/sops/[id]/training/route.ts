import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { ensureSops, getSop } from "../../shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await ensureSops();
  const sop = await getSop(id),
    member = await getHubMember();
  if (!sop || !member || !canAccessWorkspace(member, sop.workspace))
    return Response.json({ error: "Process not found or access denied." }, { status: 404 });
  const { results } = await env.DB.prepare(
    "SELECT * FROM sop_training_records WHERE sop_id=? ORDER BY member_name",
  )
    .bind(id)
    .all();
  return Response.json({ records: results });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    sop = await getSop(id);
  if (!sop) return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, sop.workspace))
    return Response.json({ error: "You cannot assign this training." }, { status: 403 });
  const p = (await req.json()) as Record<string, string>,
    email = String(p.member_email || "").trim().toLowerCase(),
    name = String(p.member_name || "").trim();
  if (!email || !name)
    return Response.json({ error: "Choose a team member." }, { status: 400 });
  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO sop_training_records (sop_id,member_email,member_name,status,signature_name,read_at,trained_at,competency_status,assessed_by,notes,created_at,updated_at)
     VALUES (?,?,?,'Assigned','','','','Pending','','',?,?)
     ON CONFLICT(sop_id,member_email) DO UPDATE SET member_name=excluded.member_name,updated_at=excluded.updated_at
     RETURNING *`,
  )
    .bind(id, email, name, now, now)
    .first();
  return Response.json({ record: row }, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    p = (await req.json()) as Record<string, string>,
    user = await getAuthenticatedUser(),
    member = await getHubMember(),
    email = String(p.member_email || user?.email || "").trim().toLowerCase(),
    now = new Date().toISOString();
  if (!email) return Response.json({ error: "Team member is required." }, { status: 400 });
  const sop = await getSop(id);
  if (!sop || !member || !canAccessWorkspace(member, sop.workspace))
    return Response.json({ error: "Process not found or access denied." }, { status: 404 });
  const existing = await env.DB.prepare(
    "SELECT * FROM sop_training_records WHERE sop_id=? AND lower(member_email)=?",
  )
    .bind(id, email)
    .first();
  if (!existing) return Response.json({ error: "Training assignment not found." }, { status: 404 });
  const action = String(p.action || "acknowledge");
  if (action === "acknowledge") {
    if (email !== user?.email.toLowerCase())
      return Response.json({ error: "Employees must sign their own acknowledgement." }, { status: 403 });
    const signature = String(p.signature_name || "").trim();
    if (!signature)
      return Response.json({ error: "Enter the employee signature name." }, { status: 400 });
    await env.DB.prepare(
      "UPDATE sop_training_records SET status='Read & acknowledged',signature_name=?,read_at=?,updated_at=? WHERE sop_id=? AND lower(member_email)=?",
    )
      .bind(signature, now, now, id, email)
      .run();
  } else if (action === "assess") {
    if (!canWrite(member))
      return Response.json({ error: "You cannot assess this training." }, { status: 403 });
    await env.DB.prepare(
      "UPDATE sop_training_records SET status='Training completed',trained_at=?,competency_status=?,assessed_by=?,notes=?,updated_at=? WHERE sop_id=? AND lower(member_email)=?",
    )
      .bind(
        now,
        p.competency_status || "Competent",
        user?.email || p.assessed_by || "Hub administrator",
        p.notes || "",
        now,
        id,
        email,
      )
      .run();
  }
  const row = await env.DB.prepare(
    "SELECT * FROM sop_training_records WHERE sop_id=? AND lower(member_email)=?",
  )
    .bind(id, email)
    .first();
  return Response.json({ record: row });
}
