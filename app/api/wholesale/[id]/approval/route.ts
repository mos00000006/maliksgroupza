import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../../../auth";
import { canAccessWorkspace, getHubMember } from "../../../access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember();
  if (!member || member.role !== "Owner / Admin" || !canAccessWorkspace(member, "Wholesale Division"))
    return Response.json({ error: "Only the Hub owner and Head of Wholesale can approve customer applications." }, { status: 403 });
  const customer = await env.DB.prepare(
    "SELECT id,customer_number,declaration_accepted FROM wholesale_opportunities WHERE id=?",
  ).bind(id).first<{ id: number; customer_number: string; declaration_accepted: number }>();
  if (!customer) return Response.json({ error: "Customer application not found." }, { status: 404 });
  const body = (await req.json()) as { action?: string; comments?: string };
  const action = String(body.action || "");
  if (!['Approve', 'Decline', 'Request changes'].includes(action))
    return Response.json({ error: "Choose Approve, Decline or Request changes." }, { status: 400 });
  if (action === "Approve" && !customer.declaration_accepted)
    return Response.json({ error: "The customer declaration must be accepted before approval." }, { status: 400 });
  const user = await getAuthenticatedUser();
  const approvedBy = user?.displayName || member.name || "Head of Wholesale";
  let customerNumber = customer.customer_number;
  if (action === "Approve" && !customerNumber) {
    const sequence = await env.DB.prepare(
      "UPDATE wholesale_customer_sequence SET next_number=next_number+1 WHERE id=1 RETURNING next_number-1 AS allocated",
    ).first<{ allocated: number }>();
    if (!sequence) return Response.json({ error: "Customer number could not be allocated." }, { status: 500 });
    customerNumber = `MWH-${String(sequence.allocated).padStart(6, "0")}`;
  }
  const status = action === "Approve" ? "Approved" : action === "Decline" ? "Declined" : "Changes requested";
  const now = new Date().toISOString();
  await env.DB.prepare(
    `UPDATE wholesale_opportunities SET application_status=?,customer_number=?,approval_comments=?,
      approved_by=?,approved_at=? WHERE id=?`,
  ).bind(
    status,
    customerNumber,
    body.comments || "",
    action === "Approve" ? approvedBy : "",
    action === "Approve" ? now : "",
    id,
  ).run();
  return Response.json({ ok: true, status, customer_number: customerNumber });
}
