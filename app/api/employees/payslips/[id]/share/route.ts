import { env } from "cloudflare:workers";
import { canAccessWorkspace, getHubMember } from "../../../../access";
import { canManageEmployeePayslips } from "../../../shared";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member || !canManageEmployeePayslips(member))
    return Response.json({ error: "You are not authorised to share payslips." }, { status: 403 });

  const payslip = await env.DB.prepare(
    "SELECT id,workspace,pdf_object_key FROM employee_payslips WHERE id=?",
  ).bind(id).first<{ id: number; workspace: string; pdf_object_key: string }>();
  if (!payslip || !canAccessWorkspace(member, payslip.workspace))
    return Response.json({ error: "Payslip not found or access denied." }, { status: 404 });
  if (!payslip.pdf_object_key)
    return Response.json({ error: "Generate the payslip PDF before sharing it." }, { status: 400 });

  const token = `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  const shareExpiresAt = expires.toISOString();
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE employee_payslips SET share_token=?,share_expires_at=?,updated_at=? WHERE id=?",
  ).bind(token, shareExpiresAt, now, id).run();

  const url = new URL(req.url);
  const shareUrl = `${url.origin}/api/payslip-share/${encodeURIComponent(token)}`;
  return Response.json({ shareUrl, expiresAt: shareExpiresAt });
}
