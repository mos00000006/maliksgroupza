import { env } from "cloudflare:workers";
import { getAuthenticatedUser } from "../../auth";
import { getHubMember } from "../access";
import {
  canContributePromotionPlanning,
  canManagePromotionPlanning,
  contributionBranches,
  initPromotionPlanningTables,
  markPromotionPlanningSeen,
  notifyOutstandingBranches,
  notifyOutstandingManagers,
  notifyPlanningOpened,
  parseBranches,
  recordPromotionPlanningActivity,
  unreadPromotionPlanningActivity,
  type PromotionPlanRow,
} from "./shared";

const text = (value: unknown) => String(value ?? "").trim();

async function getPlan(id: number) {
  return env.DB.prepare("SELECT * FROM promotion_plans WHERE id=?")
    .bind(id)
    .first<PromotionPlanRow>();
}

export async function GET(req: Request) {
  await initPromotionPlanningTables();
  const member = await getHubMember();
  if (!member) return Response.json({ error: "Hub access is not active." }, { status: 403 });

  const user = await getAuthenticatedUser();
  const email = (user?.email || member.email).toLowerCase();
  const unreadActivity = await unreadPromotionPlanningActivity(email);

  const url = new URL(req.url);
  if (url.searchParams.get("summary") === "1") {
    return Response.json({ unreadActivity });
  }

  const allowedBranches = await contributionBranches(member);
  const [plans, suggestions, feedback, comments, decisions, decisionVotes, activity, thoughts, thoughtReactions, eligibleManagers] = await Promise.all([
    env.DB.prepare("SELECT * FROM promotion_plans ORDER BY id DESC LIMIT 100").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_suggestions ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_feedback ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_comments ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_decisions ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_decision_votes ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_planning_activity ORDER BY id DESC LIMIT 120").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_thoughts ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM promotion_thought_reactions ORDER BY id DESC").all<Record<string, unknown>>(),
    env.DB.prepare(
      `SELECT email,role
       FROM team_members
       WHERE active=1
         AND role IN ('Owner / Admin','Developer / Technical Admin','Executive / EXCO','Regional Manager','Store Manager','Department Manager')
         AND role<>'Human Resource (HR)'
         AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'
       ORDER BY email`,
    ).all<Record<string, unknown>>(),
  ]);

  return Response.json({
    plans: plans.results.map((plan) => ({ ...plan, branches: parseBranches(String(plan.branches_json || "[]")) })),
    suggestions: suggestions.results,
    feedback: feedback.results,
    comments: comments.results,
    decisions: decisions.results,
    decisionVotes: decisionVotes.results,
    activity: activity.results,
    thoughts: thoughts.results,
    thoughtReactions: thoughtReactions.results,
    eligibleManagers: eligibleManagers.results,
    unreadActivity,
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
    const inputDeadline = text(p.inputDeadline);
    const brief = text(p.brief);
    if (!title)
      return Response.json({ error: "Planning title is required." }, { status: 400 });

    const promoStart = "";
    const promoEnd = "";
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
    await recordPromotionPlanningActivity(
      plan.id,
      "Plan opened",
      "",
      `Planning room opened: ${plan.title}`,
      user?.email || member.email,
    );
    try { await notifyPlanningOpened(plan); } catch (error) { console.error(error); }
    return Response.json({ plan }, { status: 201 });
  }

  if (action === "markSeen") {
    await markPromotionPlanningSeen(user?.email || member.email);
    return Response.json({ ok: true });
  }

  if (!canContributePromotionPlanning(member))
    return Response.json({ error: "Manager access is required to contribute." }, { status: 403 });

  const allowed = await contributionBranches(member);
  // Promotion Planning is a management discussion, not a branch form.
  // Keep a hidden context only for backward-compatible database columns.
  const branch =
    allowed.length === 1
      ? allowed[0]
      : allowed.length > 1
        ? "Multiple assigned stores"
        : "";

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
    await recordPromotionPlanningActivity(
      planId,
      "Product idea",
      branch,
      `${branch} suggested ${productName}`,
      user?.email || member.email,
    );
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
    await recordPromotionPlanningActivity(
      planId,
      "Branch thought",
      branch,
      `${branch} added a ${text(p.topic) || "General"} comment`,
      user?.email || member.email,
    );
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

    const suggestion = await env.DB.prepare(
      "SELECT plan_id,product_name FROM promotion_suggestions WHERE id=?",
    ).bind(suggestionId).first<{ plan_id: number; product_name: string }>();
    if (suggestion) {
      await recordPromotionPlanningActivity(
        suggestion.plan_id,
        "Product vote",
        branch,
        `${branch} voted ${support} on ${suggestion.product_name}`,
        user?.email || member.email,
      );
    }
    return Response.json({ ok: true });
  }

  if (action === "addDecision") {
    const planId = Number(p.planId || 0);
    const plan = await getPlan(planId);
    if (!plan || plan.status === "Finalised")
      return Response.json({ error: "This planning room is not open for new proposals." }, { status: 400 });

    const topic = text(p.topic);
    const proposal = text(p.proposal);
    const rationale = text(p.rationale);
    if (!topic || !proposal)
      return Response.json({ error: "Decision topic and proposal are required." }, { status: 400 });

    await env.DB.prepare(
      `INSERT INTO promotion_decisions
       (plan_id,branch,topic,proposal,rationale,status,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,'Proposed',?,?,?)`,
    ).bind(planId, branch, topic, proposal, rationale, user?.email || member.email, now, now).run();

    await recordPromotionPlanningActivity(
      planId,
      "Decision proposal",
      branch,
      `${branch} proposed ${topic}: ${proposal}`,
      user?.email || member.email,
    );
    return Response.json({ ok: true });
  }

  if (action === "decisionVote") {
    const decisionId = Number(p.decisionId || 0);
    const vote = text(p.vote) || "Support";
    const comment = text(p.comment);
    const email = (user?.email || member.email).toLowerCase();

    await env.DB.prepare(
      `INSERT INTO promotion_decision_votes
       (decision_id,branch,vote,comment,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(decision_id,created_by) DO UPDATE SET
         branch=excluded.branch,
         vote=excluded.vote,
         comment=excluded.comment,
         updated_at=excluded.updated_at`,
    ).bind(decisionId, branch, vote, comment, email, now, now).run();

    const decision = await env.DB.prepare(
      "SELECT plan_id,topic,proposal FROM promotion_decisions WHERE id=?",
    ).bind(decisionId).first<{ plan_id: number; topic: string; proposal: string }>();
    if (decision) {
      await recordPromotionPlanningActivity(
        decision.plan_id,
        "Decision vote",
        branch,
        `${branch} voted ${vote} on ${decision.topic}`,
        user?.email || member.email,
      );
    }
    return Response.json({ ok: true });
  }

  if (action === "addThought") {
    const planId = Number(p.planId || 0);
    const plan = await getPlan(planId);
    if (!plan || plan.status === "Finalised")
      return Response.json({ error: "This planning room is not open for new thoughts." }, { status: 400 });

    const thoughtType = text(p.thoughtType);
    const title = text(p.title);
    if (!thoughtType || !title)
      return Response.json({ error: "Thought type and title are required." }, { status: 400 });

    await env.DB.prepare(
      `INSERT INTO promotion_thoughts
       (plan_id,thought_type,title,item_code,item_name,current_price,suggested_price,expected_qty,details,impact,status,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,'New',?,?,?)`,
    ).bind(
      planId,
      thoughtType,
      title,
      text(p.itemCode),
      text(p.itemName),
      text(p.currentPrice),
      text(p.suggestedPrice),
      text(p.expectedQty),
      text(p.details),
      text(p.impact) || "Medium",
      user?.email || member.email,
      now,
      now,
    ).run();

    await recordPromotionPlanningActivity(
      planId,
      "Manager thought",
      "",
      `${text(p.thoughtType)}: ${title}`,
      user?.email || member.email,
    );

    return Response.json({ ok: true });
  }

  if (action === "thoughtReaction") {
    const thoughtId = Number(p.thoughtId || 0);
    const reaction = text(p.reaction) || "Agree";
    const comment = text(p.comment);
    const email = (user?.email || member.email).toLowerCase();

    await env.DB.prepare(
      `INSERT INTO promotion_thought_reactions
       (thought_id,reaction,comment,created_by,created_at,updated_at)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(thought_id,created_by) DO UPDATE SET
         reaction=excluded.reaction,
         comment=excluded.comment,
         updated_at=excluded.updated_at`,
    ).bind(thoughtId, reaction, comment, email, now, now).run();

    const thought = await env.DB.prepare(
      "SELECT plan_id,title FROM promotion_thoughts WHERE id=?",
    ).bind(thoughtId).first<{ plan_id: number; title: string }>();

    if (thought) {
      await recordPromotionPlanningActivity(
        thought.plan_id,
        "Thought reaction",
        "",
        `${reaction}: ${thought.title}`,
        user?.email || member.email,
      );
    }

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
    const suggestion = await env.DB.prepare(
      "SELECT plan_id,product_name FROM promotion_suggestions WHERE id=?",
    ).bind(id).first<{ plan_id: number; product_name: string }>();
    if (suggestion) {
      await recordPromotionPlanningActivity(
        suggestion.plan_id,
        "Product status",
        "",
        `${suggestion.product_name} moved to ${status}`,
        member.email,
      );
    }
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
    await recordPromotionPlanningActivity(
      id,
      "Planning status",
      "",
      `Planning status changed to ${status}`,
      member.email,
    );
    return Response.json({ ok: true });
  }

  if (action === "decisionStatus") {
    const id = Number(p.id || 0);
    const status = text(p.status);
    if (!["Proposed","Discuss","Agreed","Closed"].includes(status))
      return Response.json({ error: "Invalid decision status." }, { status: 400 });

    await env.DB.prepare(
      "UPDATE promotion_decisions SET status=?,updated_at=? WHERE id=?",
    ).bind(status, now, id).run();

    const decision = await env.DB.prepare(
      "SELECT plan_id,topic,proposal FROM promotion_decisions WHERE id=?",
    ).bind(id).first<{ plan_id: number; topic: string; proposal: string }>();
    if (decision) {
      await recordPromotionPlanningActivity(
        decision.plan_id,
        "Decision status",
        "",
        `${decision.topic} marked ${status}: ${decision.proposal}`,
        member.email,
      );
    }
    return Response.json({ ok: true });
  }

  if (action === "thoughtStatus") {
    const id = Number(p.id || 0);
    const status = text(p.status);
    if (!["New","Discuss","Shortlist","Agreed","Closed"].includes(status))
      return Response.json({ error: "Invalid thought status." }, { status: 400 });

    await env.DB.prepare(
      "UPDATE promotion_thoughts SET status=?,updated_at=? WHERE id=?",
    ).bind(status, now, id).run();

    const thought = await env.DB.prepare(
      "SELECT plan_id,title FROM promotion_thoughts WHERE id=?",
    ).bind(id).first<{ plan_id: number; title: string }>();

    if (thought) {
      await recordPromotionPlanningActivity(
        thought.plan_id,
        "Thought status",
        "",
        `${thought.title} moved to ${status}`,
        member.email,
      );
    }

    return Response.json({ ok: true });
  }

  if (action === "remindOutstandingManagers") {
    const id = Number(p.id || 0);
    const plan = await getPlan(id);
    if (!plan) return Response.json({ error: "Planning room not found." }, { status: 404 });

    const managerRows = await env.DB.prepare(
      `SELECT email
       FROM team_members
       WHERE active=1
         AND role IN ('Owner / Admin','Developer / Technical Admin','Executive / EXCO','Regional Manager','Store Manager','Department Manager')
         AND role<>'Human Resource (HR)'
         AND lower(email) NOT LIKE 'sites-screenshot-service-%@chatgpt.com'`,
    ).all<{ email: string }>();

    const [suggestions, comments, decisions, votes, thoughts, thoughtReactions] = await Promise.all([
      env.DB.prepare("SELECT DISTINCT lower(created_by) AS email FROM promotion_suggestions WHERE plan_id=?").bind(id).all<{ email: string }>(),
      env.DB.prepare("SELECT DISTINCT lower(created_by) AS email FROM promotion_comments WHERE plan_id=?").bind(id).all<{ email: string }>(),
      env.DB.prepare("SELECT DISTINCT lower(created_by) AS email FROM promotion_decisions WHERE plan_id=?").bind(id).all<{ email: string }>(),
      env.DB.prepare(
        `SELECT DISTINCT lower(v.created_by) AS email
         FROM promotion_decision_votes v
         JOIN promotion_decisions d ON d.id=v.decision_id
         WHERE d.plan_id=?`,
      ).bind(id).all<{ email: string }>(),
      env.DB.prepare("SELECT DISTINCT lower(created_by) AS email FROM promotion_thoughts WHERE plan_id=?").bind(id).all<{ email: string }>(),
      env.DB.prepare(
        `SELECT DISTINCT lower(r.created_by) AS email
         FROM promotion_thought_reactions r
         JOIN promotion_thoughts t ON t.id=r.thought_id
         WHERE t.plan_id=?`,
      ).bind(id).all<{ email: string }>(),
    ]);

    const contributed = new Set([
      ...suggestions.results.map((r) => r.email),
      ...comments.results.map((r) => r.email),
      ...decisions.results.map((r) => r.email),
      ...votes.results.map((r) => r.email),
      ...thoughts.results.map((r) => r.email),
      ...thoughtReactions.results.map((r) => r.email),
    ].filter(Boolean));

    const outstandingEmails = managerRows.results
      .map((row) => row.email.trim().toLowerCase())
      .filter((email) => !contributed.has(email));

    await notifyOutstandingManagers(plan, outstandingEmails);
    return Response.json({ ok: true, outstanding: outstandingEmails.length });
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
