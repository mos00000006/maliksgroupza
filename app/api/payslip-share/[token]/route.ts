import { env } from "cloudflare:workers";

const cleanFileName = (value: string) => String(value || "PowerBuild_Payslip.pdf").replaceAll('"', "").replace(/[\r\n]/g, " ");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const payslip = await env.DB.prepare(
    `SELECT pdf_object_key,pdf_file_name,share_expires_at
     FROM employee_payslips
     WHERE share_token=? AND status='Issued'`,
  ).bind(token).first<{ pdf_object_key: string; pdf_file_name: string; share_expires_at: string }>();

  if (!payslip || !payslip.pdf_object_key)
    return new Response("This payslip link is invalid or no longer available.", { status: 404 });
  if (!payslip.share_expires_at || payslip.share_expires_at < new Date().toISOString())
    return new Response("This payslip link has expired. Please request a new copy from HR.", { status: 410 });

  const object = await env.BUCKET.get(payslip.pdf_object_key);
  if (!object) return new Response("Payslip PDF not found.", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${cleanFileName(payslip.pdf_file_name)}"`,
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "referrer-policy": "no-referrer",
    },
  });
}
