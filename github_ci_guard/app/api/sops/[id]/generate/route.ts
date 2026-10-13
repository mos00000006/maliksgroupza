import { env } from "cloudflare:workers";
import { getSop } from "../../shared";
import { canAccessWorkspace, canWrite, getHubMember } from "../../../access";
function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)),
    );
  return btoa(binary);
}
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    row = await getSop(id);
  if (!row)
    return Response.json({ error: "Document not found." }, { status: 404 });
  const member = await getHubMember();
  if (!canWrite(member) || !canAccessWorkspace(member, row.workspace))
    return Response.json({ error: "You cannot generate this workflow." }, { status: 403 });
  const key = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!key)
    return Response.json(
      {
        configured: false,
        error: "Connect the OpenAI API before generating workflows.",
      },
      { status: 503 },
    );
  const object = await env.BUCKET.get(row.object_key);
  if (!object)
    return Response.json({ error: "Stored file not found." }, { status: 404 });
  const data = toBase64(await object.arrayBuffer());
  const prompt = `Analyse this ${row.document_type} for PowerBuild ${row.department}. Convert it into an operational workflow and auditable checklist. Preserve every control, approval, exception and recordkeeping requirement. Use role names. Due offsets are calendar days from activation. Evidence must name the proof of completion.`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      store: false,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            {
              type: "input_file",
              filename: row.file_name,
              file_data: `data:${row.mime_type};base64,${data}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "powerbuild_sop_workflow",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              workflow: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    step_no: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    owner_role: { type: "string" },
                    frequency: { type: "string" },
                    due_offset_days: { type: "number" },
                    evidence_required: { type: "string" },
                    approval_required: { type: "boolean" },
                  },
                  required: [
                    "step_no",
                    "title",
                    "description",
                    "owner_role",
                    "frequency",
                    "due_offset_days",
                    "evidence_required",
                    "approval_required",
                  ],
                },
              },
              checklist: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    owner_role: { type: "string" },
                    evidence_required: { type: "string" },
                    required: { type: "boolean" },
                    checked: { type: "boolean" },
                  },
                  required: [
                    "id",
                    "text",
                    "owner_role",
                    "evidence_required",
                    "required",
                    "checked",
                  ],
                },
              },
            },
            required: ["summary", "workflow", "checklist"],
          },
        },
      },
    }),
  });
  if (!response.ok)
    return Response.json(
      {
        configured: true,
        error: "The AI could not process this document. Please try again.",
      },
      { status: 502 },
    );
  const result = (await response.json()) as { output_text?: string };
  let generated: { summary: string; workflow: unknown[]; checklist: unknown[] };
  try {
    generated = JSON.parse(result.output_text || "");
  } catch {
    return Response.json(
      {
        configured: true,
        error: "The AI returned an incomplete workflow. Please try again.",
      },
      { status: 502 },
    );
  }
  await env.DB.prepare(
    "UPDATE sop_documents SET ai_summary=?,workflow_json=?,checklist_json=?,status='Workflow ready',updated_at=? WHERE id=?",
  )
    .bind(
      generated.summary,
      JSON.stringify(generated.workflow),
      JSON.stringify(generated.checklist),
      new Date().toISOString(),
      id,
    )
    .run();
  return Response.json({ configured: true, generated });
}
