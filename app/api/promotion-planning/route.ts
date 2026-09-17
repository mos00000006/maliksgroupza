import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { getHubMember } from "../access";
import {
  canContributePromotionPlanning,
  canManagePromotionPlanning,
  contributionBranches,
  initPromotionPlanningTables,
  notifyOutstandingBranches,
  notifyPlanningOpened,
  parseBranches,
  type PromotionPlanRow,
} from "./shared";

const text = (value: unknown) => String(value ?? "").trim();

async function getPlan(id: number) {
  return env.DB.prepare("SELECT * FROM promotion_plans WHERE id=?")
    .bind(id)
    .first<PromotionPlanRow>();
}

export async function GET() {
  await initPromotionPlanningTables();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });

  const allowedBranches = await contributionBranches(member);
  const [plans, suggestions, feedback, comments] = await Promise.all([
    env.DB.prepare("SELECT * FROM promotion_plans ORDER BY id DESC LIMIT 12").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_suggestions ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_feedback ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_comments ORDER BY id DESC").all<Record<string, unknown>>(),
  ]);

  return Response.json({
    plans: plans.results.map((plan) => ({ ...plan, branches: parseBranches(String(plan.branches_json || "[]")) })),
    suggestions: suggestions.results,
    feedback: feedback.results,
    comments: comments.results,
    allowedBranches,
    permissions: {
      canManage: canManagePromotionPlanning(member),
      canContribute: canContributePromotionPlanning(member),
    },
  });
}

export async function POST(req: Request) {
  await initPromotionPlanningTables();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });
  const user = await getAuthenticatedUser();
  const p = await req.json() as Record<string, unknown>;
  const action = text(p.action);
  const now = new Date().toISOString();

  if (action === "createPlan") {
    if (!canManagePromotionPlanning(member))
      return Response.json({ error: "Full-company management access is required." }, { status: 403 });

    const title = text(p.title);
    const promoStart = text(p.promoStart);
    const promoEnd = text(p.promoEnd);
    const inputDeadline = text(p.inputDeadline);
    const brief = text(p.brief);
    if (!title || !inputDeadline)
      return Response.json({ error: "Planning title and manager input deadline are required." }, { status: 400 });

    const allBranches = await contributionBranches(member);
    const result = await env.DB.prepare(
      `INSERT INTO promotion_plans
       (title,promo_start,promo_end,input_deadline,brief,status,branches_json,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,'Open',?,?,?,?)`,
    ).bind(
      title, promoStart, promoEnd, inputDeadline, brief,
      JSON.stringify(allBranches), user?.email || member.email, now, now,
    ).run();

    const id = Number(result.meta?.last_row_id || 0);
    const plan = await getPlan(id);
    if (!plan) return Response.json({ error: "Planning cycle could not be created." }, { status: 500 });
    try { await notifyPlanningOpened(plan); } catch (error) { console.error(error); }
    return Response.json({ plan }, { status: 201 });
  }

  if (!canContributePromotionPlanning(member))
    return Response.json({ error: "Manager access is required to contribute." }, { status: 403 });

  const allowed = await contributionBranches(member);
  const branch = text(p.branch);
  if (!allowed.includes(branch))
    return Response.json({ error: "Select a branch you are authorised to manage." }, { status: 403 });

  if (action === "addSuggestion") {
    const planId = Number(p.planId || 0);
    const plan = await getPlan(planId);
    if (!plan || plan.status === "Finalised")
      return Response.json({ error: "This promotion planning cycle is not open for suggestions." }, { status: 400 });

    const productName = text(p.productName);
    if (!productName) return Response.json({ error: "Product name is required." }, { status: 400 });

    await env.DB.prepare(
      `INSERT INTO promotion_suggestions
       (plan_id,branch,product_code,product_name,category,brand_supplier,current_price,proposed_price,expected_qty,reason,competitor_note,display_idea,status,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'Suggested',?,?,?)`,
    ).bind(
      planId, branch, text(p.productCode), productName, text(p.category), text(p.brandSupplier),
      text(p.currentPrice), text(p.proposedPrice), text(p.expectedQty), text(p.reason),
      text(p.competitorNote), text(p.displayIdea), user?.email || member.email, now, now,
    ).run();
    return Response.json({ ok: true });
  }

  if (action === "addComment") {
    const planId = Number(p.planId || 0);
    const comment = text(p.comment);
    if (!comment) return Response.json({ error: "Enter your branch comment." }, { status: 400 });
    await env.DB.prepare(
      `INSERT INTO promotion_comments(plan_id,branch,topic,comment,created_by,created_at)
       VALUES (?,?,?,?,?,?)`,
    ).bind(planId, branch, text(p.topic) || "General", comment, user?.email || member.email, now).run();
    return Response.json({ ok: true });
  }

  if (action === "feedback") {
    const suggestionId = Number(p.suggestionId || 0);
    const support = text(p.support) || "Yes";
    const comment = text(p.comment);
    const email = (user?.email || member.email).toLowerCase();

    await env.DB.prepare(
      `INSERT INTO promotion_feedback
       (suggestion_id,branch,support,comment,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(suggestion_id,created_by) DO UPDATE SET
         branch=excluded.branch,
         support=excluded.support,
         comment=excluded.comment,
         updated_at=excluded.updated_at`,
    ).bind(suggestionId, branch, support, comment, email, now, now).run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown planning action." }, { status: 400 });
}

export async function PATCH(req: Request) {
  await initPromotionPlanningTables();
  const member = await getHubMember();
  if (!member || !canManagePromotionPlanning(member))
    return Response.json({ error: "Full-company management access is required." }, { status: 403 });

  const p = await req.json() as Record<string, unknown>;
  const action = text(p.action);
  const now = new Date().toISOString();

  if (action === "suggestionStatus") {
    const id = Number(p.id || 0);
    const status = text(p.status);
    if (!["Suggested","Under Review","Approved","Hold","Declined"].includes(status))
      return Response.json({ error: "Invalid suggestion status." }, { status: 400 });
    await env.DB.prepare(
      "UPDATE promotion_suggestions SET status=?,updated_at=? WHERE id=?",
    ).bind(status, now, id).run();
    return Response.json({ ok: true });
  }

  if (action === "planStatus") {
    const id = Number(p.id || 0);
    const status = text(p.status);
    if (!["Open","Reviewing","Finalised"].includes(status))
      return Response.json({ error: "Invalid planning status." }, { status: 400 });
    await env.DB.prepare(
      "UPDATE promotion_plans SET status=?,updated_at=? WHERE id=?",
    ).bind(status, now, id).run();
    return Response.json({ ok: true });
  }

  if (action === "remindOutstanding") {
    const id = Number(p.id || 0);
    const plan = await getPlan(id);
    if (!plan) return Response.json({ error: "Planning cycle not found." }, { status: 404 });

    const [suggestions, comments] = await Promise.all([
      env.DB.prepare("SELECT DISTINCT branch FROM promotion_suggestions WHERE plan_id=?").bind(id).all<{ branch: string }>(),
      env.DB.prepare("SELECT DISTINCT branch FROM promotion_comments WHERE plan_id=?").bind(id).all<{ branch: string }>(),
    ]);

    const responded = new Set([
      ...suggestions.results.map((r) => r.branch),
      ...comments.results.map((r) => r.branch),
    ]);
    const outstanding = parseBranches(plan.branches_json).filter((branch) => !responded.has(branch));
    await notifyOutstandingBranches(plan, outstanding);
    return Response.json({ ok: true, outstanding });
  }

  return Response.json({ error: "Unknown planning update." }, { status: 400 });
}
