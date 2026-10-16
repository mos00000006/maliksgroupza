import { env } from "cloudflare:workers";
import { canAccessWorkspace, getHubMember } from "../../../../access";
import { canManageEmployeePayslips } from "../../../shared";

const cleanFileName = (value: string) => String(value || "payslip.pdf").replaceAll('"', "").replace(/[\r\n]/g, " ");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member || !canManageEmployeePayslips(member))
    return new Response("Not found or access denied", { status: 404 });

  const payslip = await env.DB.prepare(
    "SELECT workspace,pdf_object_key,pdf_file_name FROM employee_payslips WHERE id=?",
  ).bind(id).first<{ workspace: string; pdf_object_key: string; pdf_file_name: string }>();
  if (!payslip || !canAccessWorkspace(member, payslip.workspace) || !payslip.pdf_object_key)
    return new Response("Not found or access denied", { status: 404 });

  const object = await env.BUCKET.get(payslip.pdf_object_key);
  if (!object) return new Response("Payslip PDF not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${cleanFileName(payslip.pdf_file_name || `PowerBuild_Payslip_${id}.pdf`)}"`,
      "cache-control": "private, no-store",
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member || !canManageEmployeePayslips(member))
    return Response.json({ error: "You are not authorised to upload payslip PDFs." }, { status: 403 });

  const payslip = await env.DB.prepare(
    "SELECT id,workspace,pdf_object_key FROM employee_payslips WHERE id=?",
  ).bind(id).first<{ id: number; workspace: string; pdf_object_key: string }>();
  if (!payslip || !canAccessWorkspace(member, payslip.workspace))
    return Response.json({ error: "Payslip not found or access denied." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return Response.json({ error: "Payslip PDF file is required." }, { status: 400 });
  if (file.type && file.type !== "application/pdf")
    return Response.json({ error: "Only PDF files can be saved as payslips." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return Response.json({ error: "Payslip PDF must be smaller than 8MB." }, { status: 400 });

  const fileName = cleanFileName(file.name || `PowerBuild_Payslip_${id}.pdf`);
  const objectKey = `employee-payslips/${payslip.workspace.replace(/[^a-z0-9_-]+/gi, "-")}/${id}/${crypto.randomUUID()}.pdf`;
  await env.BUCKET.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: "application/pdf",
      contentDisposition: `attachment; filename="${fileName}"`,
    },
    customMetadata: { payslip_id: String(id), workspace: payslip.workspace },
  });

  if (payslip.pdf_object_key && payslip.pdf_object_key !== objectKey) {
    try { await env.BUCKET.delete(payslip.pdf_object_key); } catch { /* old file cleanup is non-blocking */ }
  }

  const now = new Date().toISOString();
  const updated = await env.DB.prepare(
    "UPDATE employee_payslips SET pdf_object_key=?,pdf_file_name=?,updated_at=? WHERE id=? RETURNING *",
  ).bind(objectKey, fileName, now, id).first();
  return Response.json({ payslip: updated }, { status: 201 });
}
