import { env } from "cloudflare:workers";
import {
  allowedWorkspaces,
  canAccessWorkspace,
  getHubMember,
} from "../access";

type HistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type QueryRow = Record<string, unknown>;

async function safeAll(sql: string): Promise<QueryRow[]> {
  try {
    return (await env.DB.prepare(sql).all()).results as QueryRow[];
  } catch {
    return [];
  }
}

function cleanHistory(value: unknown): HistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is HistoryItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            ((item as HistoryItem).role === "user" ||
              (item as HistoryItem).role === "assistant") &&
            typeof (item as HistoryItem).content === "string",
        ),
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }));
}

export async function POST(req: Request) {
  const member = await getHubMember();
  if (!member)
    return Response.json(
      { error: "Hub access is not active." },
      { status: 403 },
    );

  let payload: { message?: unknown; history?: unknown };
  try {
    payload = (await req.json()) as { message?: unknown; history?: unknown };
  } catch {
    return Response.json({ error: "Invalid AI request." }, { status: 400 });
  }

  const message = String(payload.message || "").trim().slice(0, 6000);
  if (!message)
    return Response.json({ error: "Ask the Sidekick a question first." }, { status: 400 });

  const key = (env as unknown as { OPENAI_API_KEY?: string }).OPENAI_API_KEY;
  if (!key)
    return Response.json(
      {
        configured: false,
        error: "AI connection has not been activated yet.",
      },
      { status: 503 },
    );

  const allowed = allowedWorkspaces(member);

  let tasks = await safeAll(
    `SELECT id,title,project,owner,assignee,assignee_email,due,priority,status,description,task_type,task_group,created_at
     FROM tasks ORDER BY id DESC LIMIT 200`,
  );
  let workspaces = await safeAll(
    `SELECT name,type,region,manager FROM workspaces WHERE active=1 ORDER BY name`,
  );
  let sops = await safeAll(
    `SELECT title,document_type,department,workspace,owner,review_date,status,ai_summary,workflow_json,checklist_json
     FROM sop_documents ORDER BY id DESC LIMIT 60`,
  );
  let pnl = await safeAll(
    `SELECT workspace,period,turnover,cost_of_sales,gross_profit,salaries,rent,security,insurance,systems,
      other_fixed,utilities,repairs_maintenance,transport_delivery,consumables,other_variable,petty_cash,capex,
      budget_turnover,budget_gross_profit,budget_operating_expenses,budget_capex,notes
     FROM pnl_reports ORDER BY period DESC, id DESC LIMIT 100`,
  );

  if (allowed !== null) {
    tasks = tasks.filter((row) =>
      canAccessWorkspace(member, String(row.project || "")),
    );
    workspaces = workspaces.filter((row) =>
      canAccessWorkspace(member, String(row.name || "")),
    );
    sops = sops.filter((row) =>
      canAccessWorkspace(member, String(row.workspace || "")),
    );
    pnl = pnl.filter((row) =>
      canAccessWorkspace(member, String(row.workspace || "")),
    );
  }

  // These divisions do not map cleanly to store workspace names, so keep them
  // available only to full-company users or members of the relevant division.
  const department = member.department.toLowerCase();
  const maySeeWholesale = allowed === null || department.includes("wholesale");
  const maySeeDevelopments =
    allowed === null ||
    department.includes("development") ||
    department.includes("property");

  const wholesale = maySeeWholesale
    ? await safeAll(
        `SELECT customer_name,customer_type,province,region,zone,value,gp_percent,stage,assigned_to,coordinator,
          monthly_target,last_visit,next_follow_up,next_action,application_status
         FROM wholesale_opportunities ORDER BY id DESC LIMIT 100`,
      )
    : [];

  const developments = maySeeDevelopments
    ? await safeAll(
        `SELECT project_name,site_location,project_type,status,rag_status,project_manager,start_date,
          planned_opening_date,actual_opening_date,approved_budget,contingency_budget,stock_budget,
          progress_percent,approval_status,notes,updated_at
         FROM development_projects ORDER BY id DESC LIMIT 80`,
      )
    : [];

  const history = cleanHistory(payload.history);
  const historyText = history.length
    ? history
        .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
        .join("\n\n")
    : "No previous Sidekick messages in this session.";

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are Maliks Group AI Sidekick, an internal operations assistant for PowerBuild / Maliks Group Hub.

RULES:
- Use only the supplied Hub data below. Do not invent figures, tasks, stores, people, dates, SOP content or business results.
- Respect the user's access scope. The supplied data has already been filtered for this user; never imply access to anything outside it.
- Clearly say when the Hub does not contain enough data to answer.
- For overdue work, compare due dates with TODAY (${today}).
- Prioritise blocked, overdue, high-priority and unassigned work when asked for action items.
- For financial analysis, show calculations clearly and distinguish actuals from budgets.
- Never claim you changed, approved, deleted or created a Hub record. You are read-only in this endpoint.
- Keep operational answers concise and practical. Use headings and bullets when useful.
- Currency values are South African rand unless the data indicates otherwise.

CURRENT USER:
${JSON.stringify({
  name: member.name,
  role: member.role,
  department: member.department,
  access_scope: member.access_scope,
})}

WORKSPACES:
${JSON.stringify(workspaces)}

TASKS:
${JSON.stringify(tasks)}

SOP DOCUMENTS / WORKFLOWS:
${JSON.stringify(sops)}

P&L REPORTS:
${JSON.stringify(pnl)}

WHOLESALE PIPELINE (only supplied when authorised):
${JSON.stringify(wholesale)}

DEVELOPMENT PROJECTS (only supplied when authorised):
${JSON.stringify(developments)}

RECENT SIDEKICK CONVERSATION:
${historyText}

USER REQUEST:
${message}`;

  let apiResponse: Response;
  try {
    apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input: prompt,
        store: false,
      }),
    });
  } catch {
    return Response.json(
      {
        configured: true,
        error: "The AI service could not be reached. Please try again.",
      },
      { status: 502 },
    );
  }

  if (!apiResponse.ok) {
    let detail = "";
    try {
      const body = (await apiResponse.json()) as {
        error?: { message?: string; code?: string };
      };
      detail = body.error?.message || body.error?.code || "";
    } catch {}

    const error =
      apiResponse.status === 429
        ? "The AI usage limit has been reached. Please try again shortly."
        : apiResponse.status === 401
          ? "The AI connection key is not valid. An administrator must update it."
          : "The AI service could not complete this request.";

    console.error("AI Sidekick request failed", apiResponse.status, detail);
    return Response.json(
      { configured: true, error },
      { status: apiResponse.status === 429 ? 429 : 502 },
    );
  }

  const result = (await apiResponse.json()) as { output_text?: string };
  return Response.json(
    {
      configured: true,
      model: "gpt-5.6-luna",
      answer: result.output_text?.trim() || "No response was returned.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
