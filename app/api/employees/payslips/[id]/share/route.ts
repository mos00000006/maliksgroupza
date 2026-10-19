import { getHubMember } from "../../../../access";

export async function POST() {
  const member = await getHubMember({ allowEmployeeRecordsOnly: true });
  if (!member) return Response.json({ error: "Unauthorised" }, { status: 401 });
  return Response.json(
    { error: "Payslip web links are disabled. Share the PDF file directly from Employee Records." },
    { status: 410 },
  );
}
