"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = {
  name: string;
  email: string;
  role?: string;
  department?: string;
  access_scope?: string;
  workspace_access?: string | string[];
};

type Plan = {
  id: number;
  title: string;
  promo_start: string;
  promo_end: string;
  input_deadline: string;
  brief: string;
  status: string;
  branches: string[];
  created_by: string;
  created_at: string;
};

type Suggestion = {
  id: number;
  plan_id: number;
  branch: string;
  product_code: string;
  product_name: string;
  category: string;
  brand_supplier: string;
  current_price: string;
  proposed_price: string;
  expected_qty: string;
  reason: string;
  competitor_note: string;
  display_idea: string;
  status: string;
  created_by: string;
  created_at: string;
};

type Feedback = {
  id: number;
  suggestion_id: number;
  branch: string;
  support: string;
  comment: string;
  created_by: string;
  created_at: string;
};

type Comment = {
  id: number;
  plan_id: number;
  branch: string;
  topic: string;
  comment: string;
  created_by: string;
  created_at: string;
};

type Decision = {
  id: number;
  plan_id: number;
  branch: string;
  topic: string;
  proposal: string;
  rationale: string;
  status: string;
  created_by: string;
  created_at: string;
};

type DecisionVote = {
  id: number;
  decision_id: number;
  branch: string;
  vote: string;
  comment: string;
  created_by: string;
  created_at: string;
};

type Activity = {
  id: number;
  plan_id: number;
  activity_type: string;
  branch: string;
  summary: string;
  created_by: string;
  created_at: string;
};

type Thought = {
  id: number;
  plan_id: number;
  thought_type: string;
  title: string;
  item_code: string;
  item_name: string;
  current_price: string;
  suggested_price: string;
  expected_qty: string;
  details: string;
  impact: string;
  status: string;
  created_by: string;
  created_at: string;
};

type ThoughtReaction = {
  id: number;
  thought_id: number;
  reaction: string;
  comment: string;
  created_by: string;
  created_at: string;
};

type EligibleManager = {
  email: string;
  role: string;
};

type ApiData = {
  plans: Plan[];
  suggestions: Suggestion[];
  feedback: Feedback[];
  comments: Comment[];
  decisions: Decision[];
  decisionVotes: DecisionVote[];
  activity: Activity[];
  thoughts: Thought[];
  thoughtReactions: ThoughtReaction[];
  eligibleManagers: EligibleManager[];
  unreadActivity: number;
  allowedBranches: string[];
  permissions: { canManage: boolean; canContribute: boolean };
};

const categories = [
  "Building Materials","Cement","Paints & Allied","Waterproofing","Plumbing","PVC Pipes & Fittings",
  "Sanware","Tiles & Flooring","Electrical & Lighting","Tools","Power Tools","Hardware","Fasteners",
  "Doors / Frames / Windows","Roofing","Steel","Timber","Chemicals","Yard","Other",
];

const decisionTopics = [
  "Promotion Date / Period",
  "Campaign Theme / Name",
  "Focus Categories",
  "Hero Products",
  "Pricing / Deal Structure",
  "Combo Deals",
  "Supplier Support",
  "Stock Commitment",
  "Marketing / Advertising",
  "Display / Merchandising",
  "Customer Target",
  "Budget / Spend",
  "Other",
];

const thoughtTypes = [
  "Product / Item Idea",
  "Pricing Idea",
  "Customer Demand",
  "Stock / Availability",
  "Competitor Insight",
  "Promotion Mechanics",
  "Marketing Idea",
  "Display / Merchandising",
  "Supplier Opportunity",
  "Margin / Profitability",
  "Risk / Concern",
  "Other",
];

const thoughtReactionScore: Record<string, number> = {
  "Strong idea": 3,
  "Agree": 2,
  "Consider": 1,
  "Not for this promotion": -1,
};

const supportScore: Record<string, number> = { "Strong Yes": 3, "Yes": 2, "Maybe": 1, "No": -1 };
const decisionScore: Record<string, number> = { "Support": 2, "Prefer alternative": 0, "Need discussion": -1 };

function fmt(value: string) {
  if (!value) return "Not agreed yet";
  return new Date(`${value}T12:00:00+02:00`).toLocaleDateString("en-ZA", { day:"2-digit", month:"short", year:"numeric" });
}

function shortEmail(value: string) {
  return value.split("@")[0] || value;
}

export default function PromotionPlanning({
  currentUser,
  onBack,
}: {
  currentUser: CurrentHubUser;
  onBack: () => void;
}) {
  const [data, setData] = useState<ApiData | null>(null);
  const [planId, setPlanId] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [planModal, setPlanModal] = useState(false);
  const [ideaModal, setIdeaModal] = useState(false);
  const [decisionModal, setDecisionModal] = useState(false);
  const [thoughtModal, setThoughtModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState<number | null>(null);
  const [decisionVoteOpen, setDecisionVoteOpen] = useState<number | null>(null);
  const [thoughtReactionOpen, setThoughtReactionOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [unreadAtOpen, setUnreadAtOpen] = useState(0);

  const [planForm, setPlanForm] = useState({
    title:"",
    inputDeadline:"",
    brief:"",
  });

  const [ideaForm, setIdeaForm] = useState({
    productCode:"", productName:"", category:"", brandSupplier:"",
    currentPrice:"", proposedPrice:"", expectedQty:"", reason:"", competitorNote:"", displayIdea:"",
  });

  const [decisionForm, setDecisionForm] = useState({
    topic:"Promotion Date / Period",
    proposal:"",
    rationale:"",
  });

  const [thoughtForm, setThoughtForm] = useState({
    thoughtType:"Product / Item Idea",
    title:"",
    itemCode:"",
    itemName:"",
    currentPrice:"",
    suggestedPrice:"",
    expectedQty:"",
    details:"",
    impact:"Medium",
  });

  const [commentForm, setCommentForm] = useState({ topic:"Products", comment:"" });
  const [feedbackForm, setFeedbackForm] = useState({ support:"Yes", comment:"" });
  const [decisionVoteForm, setDecisionVoteForm] = useState({ vote:"Support", comment:"" });
  const [thoughtReactionForm, setThoughtReactionForm] = useState({ reaction:"Agree", comment:"" });

  const flash = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const markSeen = async () => {
    try {
      await fetch("/api/promotion-planning", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({ action:"markSeen" }),
      });
    } catch {}
  };

  const load = async (markAsSeen = false) => {
    setLoading(true);
    try {
      const response = await fetch("/api/promotion-planning", { cache:"no-store" });
      const result = await response.json();
      if (!response.ok) return flash(result.error || "Promotion planning could not be loaded.");

      setData(result);
      setUnreadAtOpen((current) => current || Number(result.unreadActivity || 0));
      setPlanId((current) => current || Number(result.plans?.[0]?.id || 0));


      if (markAsSeen) await markSeen();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(true), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = data?.plans.find((p) => p.id === planId) || data?.plans[0];

  const suggestions = useMemo(
    () => (data?.suggestions || []).filter((s) => s.plan_id === plan?.id),
    [data, plan?.id],
  );

  const comments = useMemo(
    () => (data?.comments || []).filter((c) => c.plan_id === plan?.id),
    [data, plan?.id],
  );

  const decisions = useMemo(
    () => (data?.decisions || []).filter((d) => d.plan_id === plan?.id),
    [data, plan?.id],
  );

  const thoughts = useMemo(
    () => (data?.thoughts || []).filter((t) => t.plan_id === plan?.id),
    [data, plan?.id],
  );

  const activity = useMemo(
    () => (data?.activity || []).filter((a) => a.plan_id === plan?.id).slice(0, 35),
    [data, plan?.id],
  );

  const feedback = data?.feedback || [];
  const decisionVotes = useMemo(
    () => data?.decisionVotes || [],
    [data?.decisionVotes],
  );

  const thoughtReactions = useMemo(
    () => data?.thoughtReactions || [],
    [data?.thoughtReactions],
  );

  const scoreFor = (suggestionId: number) =>
    feedback
      .filter((f) => f.suggestion_id === suggestionId)
      .reduce((sum, f) => sum + (supportScore[f.support] || 0), 0);

  const decisionScoreFor = (decisionId: number) =>
    decisionVotes
      .filter((v) => v.decision_id === decisionId)
      .reduce((sum, v) => sum + (decisionScore[v.vote] || 0), 0);

  const contributors = useMemo(() => {
    const set = new Set<string>();

    suggestions.forEach((item) => set.add(item.created_by.toLowerCase()));
    comments.forEach((item) => set.add(item.created_by.toLowerCase()));
    decisions.forEach((item) => set.add(item.created_by.toLowerCase()));
    thoughts.forEach((item) => set.add(item.created_by.toLowerCase()));

    decisionVotes.forEach((vote) => {
      if (decisions.some((decision) => decision.id === vote.decision_id)) {
        set.add(vote.created_by.toLowerCase());
      }
    });

    thoughtReactions.forEach((reaction) => {
      if (thoughts.some((thought) => thought.id === reaction.thought_id)) {
        set.add(reaction.created_by.toLowerCase());
      }
    });

    return set;
  }, [suggestions, comments, decisions, thoughts, decisionVotes, thoughtReactions]);


  const totalManagers = data?.eligibleManagers.length || 0;
  const outstandingManagers = (data?.eligibleManagers || []).filter(
    (manager) => !contributors.has(manager.email.toLowerCase()),
  );
  const approved = suggestions.filter((s) => s.status === "Approved").length;
  const agreedDecisions = decisions.filter((d) => d.status === "Agreed").length;
  const openDecisions = decisions.filter((d) => d.status !== "Agreed" && d.status !== "Closed").length;
  const thoughtScoreFor = (thoughtId: number) =>
    thoughtReactions
      .filter((reaction) => reaction.thought_id === thoughtId)
      .reduce((sum, reaction) => sum + (thoughtReactionScore[reaction.reaction] || 0), 0);

  const topIdeas = [...suggestions].sort((a,b) => scoreFor(b.id) - scoreFor(a.id));
  const topDecisions = [...decisions].sort((a,b) => decisionScoreFor(b.id) - decisionScoreFor(a.id));
  const topThoughts = [...thoughts].sort((a,b) => thoughtScoreFor(b.id) - thoughtScoreFor(a.id));

  const post = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/promotion-planning", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        flash(result.error || "Could not save.");
        return false;
      }
      await load(false);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const patch = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/promotion-planning", {
        method:"PATCH",
        headers:{ "content-type":"application/json" },
        body:JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        flash(result.error || "Could not update.");
        return false;
      }
      await load(false);
      return true;
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <div className="promotionPlanLoading">Loading next promotion planning…</div>;

  return (
    <section className="promotionPlanning">
      <style>{`
        .promotionPlanning{display:grid;gap:14px;padding-bottom:40px}
        .promotionPlanLoading{padding:25px;background:#fff;border:1px solid #dbe4ec;border-radius:12px}
        .planToast{position:fixed;right:22px;top:95px;z-index:90;background:#fff;border:1px solid #d7e0e9;border-radius:11px;padding:11px 14px;box-shadow:0 18px 44px #17243825;color:#314a63;font-size:10px;font-weight:800}
        .planHero{background:linear-gradient(125deg,#14263d,#244564);border-radius:17px;color:#fff;padding:20px 22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
        .planHero small{color:#f6ca2d;font-size:8px;font-weight:900;letter-spacing:.15em}.planHero h2{font-size:23px;margin:5px 0}.planHero p{margin:0;color:#c9d7e5;font-size:9px;line-height:1.55;max-width:820px}
        .planActions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.planActions button,.planBack{height:38px;border-radius:9px;border:1px solid #d8e2eb;background:#fff;color:#27415b;padding:0 12px;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.planActions .primary{background:#f5ca2e;border-color:#ddb619;color:#172438}
        .newUpdates{display:inline-flex;align-items:center;gap:6px;margin-top:9px;background:#ffffff17;border:1px solid #ffffff2d;border-radius:999px;padding:6px 9px;color:#fff;font-size:7px;font-weight:850}.newUpdates i{display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#ef4d5d;color:#fff;font-style:normal;font-size:7px}
        .planTopBar{display:flex;gap:8px;align-items:center;justify-content:space-between;background:#fff;border:1px solid #dce5ed;border-radius:12px;padding:8px 10px}.planTopBar select{min-width:280px;border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:9px;color:#294159;background:#fff}
        .planKpis{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.planKpis article{background:#fff;border:1px solid #dbe4ec;border-radius:12px;padding:13px}.planKpis span,.planKpis b,.planKpis small{display:block}.planKpis span{font-size:7px;font-weight:900;color:#7d8997;text-transform:uppercase}.planKpis b{font-size:20px;color:#213b54;margin-top:4px}.planKpis small{font-size:7px;color:#8f9aa7;margin-top:4px}
        .participation{background:#fff;border:1px solid #dbe4ec;border-radius:13px;padding:14px}.participationHeader{display:flex;justify-content:space-between;gap:12px;align-items:center}.participationHeader b{font-size:10px;color:#2c455e}.participationHeader button{border:1px solid #d4dee8;background:#fff;border-radius:8px;padding:7px 10px;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.progress{height:9px;background:#edf2f6;border-radius:99px;margin-top:10px;overflow:hidden}.progress span{display:block;height:100%;background:#f4c82b;border-radius:99px}.outstanding{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.outstanding span{background:#fff2d2;color:#8a6200;border-radius:99px;padding:5px 8px;font-size:7px;font-weight:800}
        .decisionRoom{background:#fff;border:1px solid #dbe4ec;border-radius:14px;padding:14px}.decisionRoomHeader{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.decisionRoomHeader h3{margin:0;color:#213b54;font-size:14px}.decisionRoomHeader p{margin:4px 0 0;color:#788899;font-size:8px}.decisionRoomHeader button{border:0;background:#f5ca2e;color:#172438;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:900;cursor:pointer}
        .decisionGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.decisionCard{border:1px solid #dfe7ee;border-radius:11px;padding:11px;background:#fbfcfd}.decisionTop{display:flex;justify-content:space-between;gap:8px}.decisionTopic{font-size:7px;color:#8d6d00;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.decisionCard h4{margin:4px 0 5px;color:#203951;font-size:11px}.decisionCard p{margin:0;color:#65788b;font-size:8px;line-height:1.5}.decisionMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.decisionMeta span{background:#eef3f7;color:#546c84;border-radius:999px;padding:4px 7px;font-size:6.5px;font-weight:800}.decisionScore{min-width:56px;text-align:center;background:#172d46;color:#fff;border-radius:9px;padding:7px}.decisionScore b{display:block;font-size:14px}.decisionScore small{font-size:6px;color:#c6d5e3}.decisionActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.decisionActions button,.decisionActions select{border:1px solid #d7e0e9;border-radius:7px;background:#fff;padding:6px 8px;font:inherit;font-size:7px;font-weight:800;color:#405a73}
        .decisionStatus{display:inline-flex;padding:4px 7px;border-radius:99px;background:#edf2f6;color:#617388;font-size:6.5px;font-weight:850}.decisionStatus.Agreed{background:#dff4e7;color:#196a49}.decisionStatus.Discuss{background:#fff0ca;color:#8a6200}.decisionStatus.Closed{background:#e7ebef;color:#69798a}
        .thoughtBoard{background:#fff;border:1px solid #dbe4ec;border-radius:14px;padding:14px}.thoughtBoardHeader{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.thoughtBoardHeader h3{margin:0;color:#213b54;font-size:14px}.thoughtBoardHeader p{margin:4px 0 0;color:#788899;font-size:8px}.thoughtBoardHeader button{border:0;background:#172d46;color:#fff;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:900;cursor:pointer}.thoughtGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.thoughtCard{border:1px solid #dfe7ee;border-radius:11px;padding:11px;background:#fbfcfd}.thoughtType{font-size:7px;color:#8d6d00;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.thoughtCard h4{margin:4px 0 5px;color:#203951;font-size:11px}.thoughtCard p{margin:0;color:#65788b;font-size:8px;line-height:1.5}.thoughtPrice{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:8px}.thoughtPrice span{background:#eef3f7;border-radius:8px;padding:6px;font-size:6.5px;color:#536b83}.thoughtPrice b{display:block;color:#233d56;font-size:8px;margin-top:2px}.thoughtActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.thoughtActions button,.thoughtActions select{border:1px solid #d7e0e9;border-radius:7px;background:#fff;padding:6px 8px;font:inherit;font-size:7px;font-weight:800;color:#405a73}.thoughtImpact{display:inline-flex;border-radius:999px;padding:4px 7px;background:#eef2f6;color:#5c7187;font-size:6.5px;font-weight:850}.thoughtImpact.High{background:#ffe2d9;color:#a5452d}.thoughtImpact.Low{background:#eaf2f8;color:#60788f}.thoughtStatus{display:inline-flex;border-radius:999px;padding:4px 7px;background:#edf2f6;color:#617388;font-size:6.5px;font-weight:850}.thoughtStatus.Shortlist,.thoughtStatus.Agreed{background:#dff4e7;color:#196a49}.thoughtStatus.Discuss{background:#fff0ca;color:#8a6200}
        .planColumns{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(320px,.85fr);gap:12px}.planPanel{background:#fff;border:1px solid #dbe4ec;border-radius:13px;padding:14px}.planPanelHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.planPanelHeader h3{font-size:13px;color:#223c55;margin:0}.planPanelHeader button{border:1px solid #d4dee8;background:#172d46;color:#fff;border-radius:8px;padding:7px 10px;font:inherit;font-size:7px;font-weight:850;cursor:pointer}
        .ideaList{display:grid;gap:9px}.ideaCard{border:1px solid #dde5ed;border-radius:11px;padding:12px;background:#fbfcfd}.ideaTop{display:flex;justify-content:space-between;gap:10px}.ideaCard h4{margin:2px 0 4px;color:#203951;font-size:11px}.ideaCard p{margin:0;color:#6b7c8e;font-size:8px;line-height:1.5}.ideaMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.ideaMeta span{background:#edf3f8;color:#526a82;border-radius:99px;padding:4px 7px;font-size:6.5px;font-weight:800}.ideaScore{min-width:56px;text-align:center;background:#172d46;color:#fff;border-radius:9px;padding:7px}.ideaScore b{display:block;font-size:14px}.ideaScore small{font-size:6px;color:#c6d5e3}.ideaActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.ideaActions button,.ideaActions select{border:1px solid #d7e0e9;border-radius:7px;background:#fff;padding:6px 8px;font:inherit;font-size:7px;font-weight:800;color:#405a73}
        .ideaStatus{display:inline-flex;padding:4px 7px;border-radius:99px;background:#eef2f6;color:#617388;font-size:6.5px;font-weight:850}.ideaStatus.Approved{background:#dff4e7;color:#196a49}.ideaStatus.Declined{background:#f8e2e4;color:#a43c48}.ideaStatus.Review{background:#fff0ca;color:#8a6200}
        .rightStack{display:grid;gap:12px}.commentComposer{display:grid;gap:7px;margin-bottom:12px}.commentComposer select,.commentComposer textarea{border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:8px}.commentComposer textarea{min-height:74px;resize:vertical}.commentComposer button{justify-self:end;border:0;background:#f5ca2e;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:900;color:#172438}
        .comments,.activityFeed{display:grid;gap:7px;max-height:380px;overflow:auto}.comment,.activityItem{background:#f7f9fb;border:1px solid #e0e7ee;border-radius:9px;padding:9px}.comment b,.activityItem b{font-size:8px;color:#2f4962}.comment small,.activityItem small{display:block;color:#8995a2;font-size:6.5px;margin:2px 0 5px}.comment p,.activityItem p{font-size:8px;color:#536a80;margin:0;line-height:1.5}.activityItem{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:start}.activityIcon{width:28px;height:28px;border-radius:9px;background:#172d46;color:#f5ca2e;display:grid;place-items:center;font-size:11px}
        .planEmpty{padding:24px;text-align:center;border:1px dashed #cbd7e2;border-radius:11px;color:#7a8998}.planEmpty b{display:block;color:#405a73;margin-bottom:4px}
        .planOverlay{position:fixed;inset:0;background:#0d1a2b99;z-index:95;display:grid;place-items:center;padding:12px}.planModal{width:min(760px,calc(100vw - 24px));max-height:calc(100dvh - 24px);background:#fff;border-radius:15px;overflow:hidden;display:flex;flex-direction:column}.planModal header{display:flex;justify-content:space-between;padding:15px 17px;border-bottom:1px solid #e3e9ef}.planModal header h3{margin:0;color:#203951}.planModal header button{border:0;background:#edf2f6;width:32px;height:32px;border-radius:8px}.planModalBody{padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:auto}.planModalBody label{display:grid;gap:5px;font-size:7px;font-weight:850;color:#40566e}.planModalBody input,.planModalBody select,.planModalBody textarea{border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:8px}.planModalBody textarea{min-height:80px}.span2{grid-column:1/-1}.planModal footer{display:flex;justify-content:flex-end;gap:7px;padding:10px 15px;border-top:1px solid #e5ebf0}.planModal footer button{border:1px solid #d5dfe8;background:#fff;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:850}.planModal footer .primary{background:#f5ca2e;border-color:#dfb91f;color:#172438}
        @media(max-width:1100px){.planKpis{grid-template-columns:repeat(3,1fr)}.decisionGrid{grid-template-columns:1fr}.thoughtGrid{grid-template-columns:1fr 1fr}}
        @media(max-width:900px){.planColumns{grid-template-columns:1fr}.planHero{grid-template-columns:1fr}.planActions{justify-content:flex-start}}
        @media(max-width:720px){.thoughtGrid{grid-template-columns:1fr}.planTopBar{align-items:stretch;flex-direction:column}.planTopBar select{min-width:0;width:100%}.planKpis{grid-template-columns:1fr 1fr}.planModalBody{grid-template-columns:1fr}.span2{grid-column:auto}.planToast{left:12px;right:12px;top:82px}.ideaTop,.decisionTop{align-items:flex-start}}
      `}</style>

      {message && <div className="planToast">{message}</div>}

      <div className="planHero">
        <div>
          <small>POWERBUILD ASYNC PROMOTION ROOM</small>
          <h2>Next Promotion Planning</h2>
          <p>
            Replace long promotion meetings with one structured decision room. Managers propose dates, themes, products, pricing, stock and marketing ideas, vote on each other’s proposals, and Head Office locks the agreed decisions.
          </p>
          {unreadAtOpen > 0 && (
            <span className="newUpdates">
              <i>{unreadAtOpen > 99 ? "99+" : unreadAtOpen}</i>
              new manager update{unreadAtOpen === 1 ? "" : "s"} since your last visit
            </span>
          )}
        </div>

        <div className="planActions">
          <button onClick={onBack}>← Store Specials</button>
          {data?.permissions.canManage && (
            <button className="primary" onClick={() => setPlanModal(true)}>＋ New planning room</button>
          )}
          {data?.permissions.canContribute && plan && plan.status !== "Finalised" && (
            <>
              <button className="primary" onClick={() => setThoughtModal(true)}>＋ Add manager thought</button>
              <button className="primary" onClick={() => setDecisionModal(true)}>＋ Propose a decision</button>
              <button className="primary" onClick={() => setIdeaModal(true)}>＋ Suggest product</button>
            </>
          )}
        </div>
      </div>

      {data?.plans.length ? (
        <>
          <div className="planTopBar">
            <select value={plan?.id || 0} onChange={(e) => setPlanId(Number(e.target.value))}>
              {data.plans.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.status}</option>)}
            </select>
            {plan && (
              <span style={{fontSize:"8px",fontWeight:800,color:"#62758a"}}>
                {plan.input_deadline ? `Manager input target: ${fmt(plan.input_deadline)}` : "No deadline forced · agree the timing together"}
              </span>
            )}
          </div>

          <div className="planKpis">
            <article><span>Managers active</span><b>{contributors.size}/{totalManagers}</b><small>People contributing</small></article>
            <article><span>Open decisions</span><b>{openDecisions}</b><small>Still needs agreement</small></article>
            <article><span>Agreed decisions</span><b>{agreedDecisions}</b><small>Locked outcomes</small></article>
            <article><span>Product ideas</span><b>{suggestions.length}</b><small>Items proposed</small></article>
            <article><span>Approved items</span><b>{approved}</b><small>Current shortlist</small></article>
            <article><span>Manager thoughts</span><b>{thoughts.length}</b><small>Quick ideas & concerns</small></article>
          </div>

          <div className="participation">
            <div className="participationHeader">
              <b>Manager participation · {totalManagers ? Math.round((contributors.size / totalManagers) * 100) : 0}% complete</b>
              {data.permissions.canManage && outstandingManagers.length > 0 && (
                <button onClick={async () => {
                  const response = await patch({ action:"remindOutstandingManagers", id:plan?.id });
                  if (response) {
                    flash(`Reminder sent to ${outstandingManagers.length} manager${outstandingManagers.length === 1 ? "" : "s"} still to contribute.`);
                  }
                }}>🔔 Remind managers still to contribute</button>
              )}
            </div>
            <div className="progress">
              <span style={{width:`${totalManagers ? Math.min(100,(contributors.size/totalManagers)*100) : 0}%`}} />
            </div>
            {outstandingManagers.length > 0 && (
              <div className="outstanding">
                {outstandingManagers.map((manager) => (
                  <span key={manager.email}>{shortEmail(manager.email)} · {manager.role}</span>
                ))}
              </div>
            )}
          </div>

          <div className="thoughtBoard">
            <div className="thoughtBoardHeader">
              <div>
                <h3>Manager Thoughts</h3>
                <p>Quickly put an idea or concern on the table — item, pricing, customer demand, stock, competitors, marketing, margin or anything else. Other managers can react without another meeting.</p>
              </div>
              {data.permissions.canContribute && plan?.status !== "Finalised" && (
                <button onClick={() => setThoughtModal(true)}>＋ Add thought</button>
              )}
            </div>

            <div className="thoughtGrid">
              {topThoughts.map((thought) => {
                const reactions = thoughtReactions.filter((reaction) => reaction.thought_id === thought.id);
                const mine = reactions.find((reaction) => reaction.created_by.toLowerCase() === currentUser.email.toLowerCase());

                return (
                  <article className="thoughtCard" key={thought.id}>
                    <div className="decisionTop">
                      <div>
                        <span className="thoughtType">{thought.thought_type}</span>
                        <h4>{thought.title}</h4>
                        <p>{shortEmail(thought.created_by)}</p>
                      </div>
                      <div className="decisionScore">
                        <b>{thoughtScoreFor(thought.id)}</b>
                        <small>support</small>
                      </div>
                    </div>

                    {thought.item_name && (
                      <p style={{marginTop:"7px"}}>
                        <b>Item:</b> {thought.item_name}{thought.item_code ? ` · ${thought.item_code}` : ""}
                      </p>
                    )}

                    {(thought.current_price || thought.suggested_price || thought.expected_qty) && (
                      <div className="thoughtPrice">
                        <span>Current<b>{thought.current_price || "—"}</b></span>
                        <span>Suggested<b>{thought.suggested_price || "—"}</b></span>
                        <span>Qty / Need<b>{thought.expected_qty || "—"}</b></span>
                      </div>
                    )}

                    {thought.details && <p style={{marginTop:"8px"}}>{thought.details}</p>}

                    <div className="decisionMeta">
                      <span className={`thoughtImpact ${thought.impact}`}>{thought.impact} impact</span>
                      <span className={`thoughtStatus ${thought.status}`}>{thought.status}</span>
                      <span>{reactions.length} reaction{reactions.length === 1 ? "" : "s"}</span>
                    </div>

                    <div className="thoughtActions">
                      {data.permissions.canContribute && (
                        <button onClick={() => {
                          setThoughtReactionOpen(thought.id);
                          setThoughtReactionForm({
                            reaction:mine?.reaction || "Agree",
                            comment:mine?.comment || "",
                          });
                        }}>
                          {mine ? `Your view: ${mine.reaction}` : "React / comment"}
                        </button>
                      )}

                      {data.permissions.canManage && (
                        <select
                          value={thought.status}
                          onChange={async (event) => {
                            await patch({ action:"thoughtStatus", id:thought.id, status:event.target.value });
                          }}
                        >
                          <option>New</option>
                          <option>Discuss</option>
                          <option>Shortlist</option>
                          <option>Agreed</option>
                          <option>Closed</option>
                        </select>
                      )}
                    </div>
                  </article>
                );
              })}

              {!thoughts.length && (
                <div className="planEmpty" style={{gridColumn:"1/-1"}}>
                  <b>No manager thoughts yet</b>
                  Add the first product, pricing, stock, competitor or customer-demand thought.
                </div>
              )}
            </div>
          </div>

          <div className="decisionRoom">
            <div className="decisionRoomHeader">
              <div>
                <h3>Decision Room</h3>
                <p>Agree the date, campaign theme, focus categories, deal mechanics, stock commitments, supplier support and marketing plan here instead of holding another meeting.</p>
              </div>
              {data.permissions.canContribute && plan?.status !== "Finalised" && (
                <button onClick={() => setDecisionModal(true)}>＋ Add proposal</button>
              )}
            </div>

            <div className="decisionGrid">
              {topDecisions.map((decision) => {
                const votes = decisionVotes.filter((v) => v.decision_id === decision.id);
                const mine = votes.find((v) => v.created_by.toLowerCase() === currentUser.email.toLowerCase());
                return (
                  <article className="decisionCard" key={decision.id}>
                    <div className="decisionTop">
                      <div>
                        <span className="decisionTopic">{decision.topic}</span>
                        <h4>{decision.proposal}</h4>
                        <p>{shortEmail(decision.created_by)}</p>
                      </div>
                      <div className="decisionScore">
                        <b>{decisionScoreFor(decision.id)}</b>
                        <small>support</small>
                      </div>
                    </div>

                    {decision.rationale && <p style={{marginTop:"7px"}}>{decision.rationale}</p>}

                    <div className="decisionMeta">
                      <span className={`decisionStatus ${decision.status}`}>{decision.status}</span>
                      <span>{votes.length} manager vote{votes.length === 1 ? "" : "s"}</span>
                      <span>{new Date(decision.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="decisionActions">
                      {data.permissions.canContribute && (
                        <button onClick={() => {
                          setDecisionVoteOpen(decision.id);
                          setDecisionVoteForm({
                            vote:mine?.vote || "Support",
                            comment:mine?.comment || "",
                          });
                        }}>
                          {mine ? `Your vote: ${mine.vote}` : "Vote / comment"}
                        </button>
                      )}

                      {data.permissions.canManage && (
                        <select
                          value={decision.status}
                          onChange={async (e) => {
                            await patch({ action:"decisionStatus", id:decision.id, status:e.target.value });
                          }}
                        >
                          <option>Proposed</option>
                          <option>Discuss</option>
                          <option>Agreed</option>
                          <option>Closed</option>
                        </select>
                      )}
                    </div>
                  </article>
                );
              })}

              {!decisions.length && (
                <div className="planEmpty" style={{gridColumn:"1/-1"}}>
                  <b>No decisions proposed yet</b>
                  Start with “Promotion Date / Period”, then agree the theme, focus categories and deal structure.
                </div>
              )}
            </div>
          </div>

          <div className="planColumns">
            <div className="planPanel">
              <div className="planPanelHeader">
                <h3>Product ideas & branch support</h3>
                {plan?.brief && <small style={{color:"#7c8b9b"}}>{plan.brief}</small>}
              </div>

              <div className="ideaList">
                {topIdeas.map((idea) => {
                  const ideaFeedback = feedback.filter((f) => f.suggestion_id === idea.id);
                  const myFeedback = ideaFeedback.find((f) => f.created_by.toLowerCase() === currentUser.email.toLowerCase());

                  return (
                    <article className="ideaCard" key={idea.id}>
                      <div className="ideaTop">
                        <div>
                          <span className={`ideaStatus ${idea.status === "Approved" ? "Approved" : idea.status === "Declined" ? "Declined" : idea.status === "Under Review" ? "Review" : ""}`}>{idea.status}</span>
                          <h4>{idea.product_name}{idea.product_code ? ` · ${idea.product_code}` : ""}</h4>
                          <p>{shortEmail(idea.created_by)} · {idea.category || "General"}{idea.brand_supplier ? ` · ${idea.brand_supplier}` : ""}</p>
                        </div>
                        <div className="ideaScore"><b>{scoreFor(idea.id)}</b><small>support score</small></div>
                      </div>

                      <div className="ideaMeta">
                        {idea.current_price && <span>Current {idea.current_price}</span>}
                        {idea.proposed_price && <span>Promo {idea.proposed_price}</span>}
                        {idea.expected_qty && <span>Qty {idea.expected_qty}</span>}
                        <span>{ideaFeedback.length} manager response{ideaFeedback.length === 1 ? "" : "s"}</span>
                      </div>

                      {idea.reason && <p style={{marginTop:"8px"}}><b>Why:</b> {idea.reason}</p>}
                      {idea.competitor_note && <p style={{marginTop:"5px"}}><b>Market:</b> {idea.competitor_note}</p>}
                      {idea.display_idea && <p style={{marginTop:"5px"}}><b>Display:</b> {idea.display_idea}</p>}

                      <div className="ideaActions">
                        {data.permissions.canContribute && (
                          <button onClick={() => {
                            setFeedbackOpen(idea.id);
                            setFeedbackForm({
                              support:myFeedback?.support || "Yes",
                              comment:myFeedback?.comment || "",
                            });
                          }}>
                            {myFeedback ? `Your view: ${myFeedback.support}` : "Add your view"}
                          </button>
                        )}

                        {data.permissions.canManage && (
                          <select
                            value={idea.status}
                            onChange={async (e) => {
                              await patch({ action:"suggestionStatus", id:idea.id, status:e.target.value });
                            }}
                          >
                            {["Suggested","Under Review","Approved","Hold","Declined"].map((s) => <option key={s}>{s}</option>)}
                          </select>
                        )}
                      </div>
                    </article>
                  );
                })}

                {!suggestions.length && (
                  <div className="planEmpty">
                    <b>No product ideas yet</b>
                    Managers can start adding products they believe should be in the next promotion.
                  </div>
                )}
              </div>
            </div>

            <div className="rightStack">
              <aside className="planPanel">
                <div className="planPanelHeader"><h3>Discussion & general comments</h3></div>

                {data.permissions.canContribute && (
                  <div className="commentComposer">
                    <select value={commentForm.topic} onChange={(e)=>setCommentForm({...commentForm,topic:e.target.value})}>
                      {["Products","Pricing","Stock","Competitors","Marketing","Display / Merchandising","Customer Demand","Other"].map((t)=><option key={t}>{t}</option>)}
                    </select>

                    <textarea
                      value={commentForm.comment}
                      onChange={(e)=>setCommentForm({...commentForm,comment:e.target.value})}
                      placeholder="What is your branch seeing? What sold well, what should be avoided, what are customers asking for?"
                    />

                    <button disabled={saving} onClick={async () => {
                      if (!commentForm.comment.trim()) return flash("Enter your branch feedback.");
                      if (await post({ action:"addComment", planId:plan?.id, ...commentForm })) {
                        setCommentForm({...commentForm,comment:""});
                        flash("Branch feedback added.");
                      }
                    }}>
                      Add branch feedback
                    </button>
                  </div>
                )}

                <div className="comments">
                  {comments.map((c) => (
                    <div className="comment" key={c.id}>
                      <b>{c.topic}</b>
                      <small>{shortEmail(c.created_by)} · {new Date(c.created_at).toLocaleString()}</small>
                      <p>{c.comment}</p>
                    </div>
                  ))}

                  {!comments.length && (
                    <div className="planEmpty">
                      <b>No branch comments yet</b>
                      Manager comments will appear here.
                    </div>
                  )}
                </div>
              </aside>

              <aside className="planPanel">
                <div className="planPanelHeader"><h3>What changed</h3></div>
                <div className="activityFeed">
                  {activity.map((item) => (
                    <div className="activityItem" key={item.id}>
                      <div className="activityIcon">↻</div>
                      <div>
                        <b>{item.activity_type}</b>
                        <small>{shortEmail(item.created_by)} · {new Date(item.created_at).toLocaleString()}</small>
                        <p>{item.summary}</p>
                      </div>
                    </div>
                  ))}

                  {!activity.length && (
                    <div className="planEmpty">
                      <b>No activity yet</b>
                      New proposals, votes, product ideas and comments will appear here.
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>

          {data.permissions.canManage && plan && (
            <div className="planTopBar">
              <span style={{fontSize:"8px",fontWeight:850,color:"#435c75"}}>
                Planning room status
              </span>
              <select
                style={{minWidth:"180px"}}
                value={plan.status}
                onChange={async (e)=>{ await patch({action:"planStatus",id:plan.id,status:e.target.value}); }}
              >
                <option>Open</option>
                <option>Reviewing</option>
                <option>Finalised</option>
              </select>
            </div>
          )}
        </>
      ) : (
        <div className="planEmpty">
          <b>No promotion planning room yet</b>
          {data?.permissions.canManage
            ? "Open the first planning room. Do not set the promotion date yet — let managers propose and agree it in the Decision Room."
            : "Head Office has not opened the next promotion planning room yet."}
        </div>
      )}

      {planModal && (
        <div className="planOverlay" onMouseDown={()=>setPlanModal(false)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()}>
            <header>
              <h3>Open next promotion planning room</h3>
              <button onClick={()=>setPlanModal(false)}>×</button>
            </header>

            <div className="planModalBody">
              <label className="span2">
                Planning room title *
                <input
                  value={planForm.title}
                  onChange={(e)=>setPlanForm({...planForm,title:e.target.value})}
                  placeholder="e.g. Next Group Promotion / Festive Campaign Planning"
                />
              </label>

              <label>
                Optional manager input target
                <input
                  type="date"
                  value={planForm.inputDeadline}
                  onChange={(e)=>setPlanForm({...planForm,inputDeadline:e.target.value})}
                />
              </label>

              <label className="span2">
                Planning brief
                <textarea
                  value={planForm.brief}
                  onChange={(e)=>setPlanForm({...planForm,brief:e.target.value})}
                  placeholder="What are we trying to achieve? Margin target, customer type, categories to consider, supplier opportunities, stock concerns…"
                />
              </label>

              <div className="span2" style={{background:"#f3f7fb",border:"1px solid #dce6ef",borderRadius:"9px",padding:"10px",fontSize:"7.5px",color:"#526a82",lineHeight:1.5}}>
                <b>Promotion dates are deliberately NOT set here.</b><br/>
                Managers will propose and agree the promotion period, theme, focus categories, deal structure and marketing plan inside the Decision Room.
              </div>
            </div>

            <footer>
              <button onClick={()=>setPlanModal(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                const ok = await post({action:"createPlan",...planForm});
                if (ok) {
                  setPlanModal(false);
                  setPlanForm({title:"",inputDeadline:"",brief:""});
                  flash("Planning room opened and managers notified.");
                }
              }}>
                Open room & notify managers
              </button>
            </footer>
          </section>
        </div>
      )}

      {decisionModal && plan && (
        <div className="planOverlay" onMouseDown={()=>setDecisionModal(false)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()}>
            <header>
              <h3>Propose a promotion decision</h3>
              <button onClick={()=>setDecisionModal(false)}>×</button>
            </header>

            <div className="planModalBody">
              <label>
                Decision topic
                <select value={decisionForm.topic} onChange={(e)=>setDecisionForm({...decisionForm,topic:e.target.value})}>
                  {decisionTopics.map((topic)=><option key={topic}>{topic}</option>)}
                </select>
              </label>

              <label className="span2">
                Your proposal *
                <input
                  value={decisionForm.proposal}
                  onChange={(e)=>setDecisionForm({...decisionForm,proposal:e.target.value})}
                  placeholder={
                    decisionForm.topic === "Promotion Date / Period"
                      ? "e.g. Run the special from 1–10 November"
                      : "State exactly what you propose"
                  }
                />
              </label>

              <label className="span2">
                Why?
                <textarea
                  value={decisionForm.rationale}
                  onChange={(e)=>setDecisionForm({...decisionForm,rationale:e.target.value})}
                  placeholder="Give the reason so other managers can make a quick decision without another meeting."
                />
              </label>
            </div>

            <footer>
              <button onClick={()=>setDecisionModal(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                if (!decisionForm.proposal.trim()) return flash("Enter your proposal.");
                if (await post({action:"addDecision",planId:plan.id,...decisionForm})) {
                  setDecisionModal(false);
                  setDecisionForm({...decisionForm,proposal:"",rationale:""});
                  flash("Decision proposal added for managers to vote.");
                }
              }}>
                Add proposal
              </button>
            </footer>
          </section>
        </div>
      )}

      {thoughtModal && plan && (
        <div className="planOverlay" onMouseDown={()=>setThoughtModal(false)}>
          <section className="planModal" onMouseDown={(event)=>event.stopPropagation()}>
            <header>
              <h3>Add a manager thought</h3>
              <button onClick={()=>setThoughtModal(false)}>×</button>
            </header>

            <div className="planModalBody">
              <label>
                Thought type
                <select value={thoughtForm.thoughtType} onChange={(event)=>setThoughtForm({...thoughtForm,thoughtType:event.target.value})}>
                  {thoughtTypes.map((type)=><option key={type}>{type}</option>)}
                </select>
              </label>

              <label>
                Impact
                <select value={thoughtForm.impact} onChange={(event)=>setThoughtForm({...thoughtForm,impact:event.target.value})}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>

              <label className="span2">
                Thought / idea title *
                <input
                  value={thoughtForm.title}
                  onChange={(event)=>setThoughtForm({...thoughtForm,title:event.target.value})}
                  placeholder="e.g. Put 20L economy paint under R300"
                />
              </label>

              <label>
                Item / product
                <input
                  value={thoughtForm.itemName}
                  onChange={(event)=>setThoughtForm({...thoughtForm,itemName:event.target.value})}
                  placeholder="Optional product name"
                />
              </label>

              <label>
                Product code
                <input
                  value={thoughtForm.itemCode}
                  onChange={(event)=>setThoughtForm({...thoughtForm,itemCode:event.target.value})}
                  placeholder="Optional"
                />
              </label>

              <label>
                Current price
                <input
                  value={thoughtForm.currentPrice}
                  onChange={(event)=>setThoughtForm({...thoughtForm,currentPrice:event.target.value})}
                  placeholder="e.g. R329.99"
                />
              </label>

              <label>
                Suggested promo price
                <input
                  value={thoughtForm.suggestedPrice}
                  onChange={(event)=>setThoughtForm({...thoughtForm,suggestedPrice:event.target.value})}
                  placeholder="e.g. R299.99"
                />
              </label>

              <label>
                Expected qty / requirement
                <input
                  value={thoughtForm.expectedQty}
                  onChange={(event)=>setThoughtForm({...thoughtForm,expectedQty:event.target.value})}
                  placeholder="e.g. 100 units / full pallet / high demand"
                />
              </label>

              <label className="span2">
                Explain your thought
                <textarea
                  value={thoughtForm.details}
                  onChange={(event)=>setThoughtForm({...thoughtForm,details:event.target.value})}
                  placeholder="Customer feedback, margin concern, competitor price, stock opportunity, why you think this will work, or what problem we should solve…"
                />
              </label>
            </div>

            <footer>
              <button onClick={()=>setThoughtModal(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                if (!thoughtForm.title.trim()) return flash("Enter the thought or idea.");
                if (await post({ action:"addThought", planId:plan.id, ...thoughtForm })) {
                  setThoughtModal(false);
                  setThoughtForm({
                    thoughtType:"Product / Item Idea",
                    title:"",
                    itemCode:"",
                    itemName:"",
                    currentPrice:"",
                    suggestedPrice:"",
                    expectedQty:"",
                    details:"",
                    impact:"Medium",
                  });
                  flash("Manager thought added.");
                }
              }}>
                Add thought
              </button>
            </footer>
          </section>
        </div>
      )}

      {ideaModal && plan && (
        <div className="planOverlay" onMouseDown={()=>setIdeaModal(false)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()}>
            <header><h3>Suggest a product for the next promotion</h3><button onClick={()=>setIdeaModal(false)}>×</button></header>
            <div className="planModalBody">
              <label>Product code<input value={ideaForm.productCode} onChange={(e)=>setIdeaForm({...ideaForm,productCode:e.target.value})} /></label>
              <label className="span2">Product name *<input value={ideaForm.productName} onChange={(e)=>setIdeaForm({...ideaForm,productName:e.target.value})} placeholder="Exact product / pack size" /></label>
              <label>Category<select value={ideaForm.category} onChange={(e)=>setIdeaForm({...ideaForm,category:e.target.value})}><option value="">Select category</option>{categories.map((c)=><option key={c}>{c}</option>)}</select></label>
              <label>Brand / supplier<input value={ideaForm.brandSupplier} onChange={(e)=>setIdeaForm({...ideaForm,brandSupplier:e.target.value})} /></label>
              <label>Current selling price<input value={ideaForm.currentPrice} onChange={(e)=>setIdeaForm({...ideaForm,currentPrice:e.target.value})} placeholder="e.g. R399.99" /></label>
              <label>Suggested promo price<input value={ideaForm.proposedPrice} onChange={(e)=>setIdeaForm({...ideaForm,proposedPrice:e.target.value})} placeholder="e.g. R349.99" /></label>
              <label>Expected promo quantity<input value={ideaForm.expectedQty} onChange={(e)=>setIdeaForm({...ideaForm,expectedQty:e.target.value})} placeholder="e.g. 80 units" /></label>
              <label className="span2">Why should we promote it?<textarea value={ideaForm.reason} onChange={(e)=>setIdeaForm({...ideaForm,reason:e.target.value})} placeholder="Customer demand, seasonality, strong mover, stock position, margin opportunity…" /></label>
              <label className="span2">Competitor / market note<textarea value={ideaForm.competitorNote} onChange={(e)=>setIdeaForm({...ideaForm,competitorNote:e.target.value})} placeholder="What are competitors doing? What price are customers seeing?" /></label>
              <label className="span2">Display / merchandising idea<textarea value={ideaForm.displayIdea} onChange={(e)=>setIdeaForm({...ideaForm,displayIdea:e.target.value})} placeholder="End-cap, combo deal, pallet stack, entrance display, cross-merchandising…" /></label>
            </div>
            <footer>
              <button onClick={()=>setIdeaModal(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                if (!ideaForm.productName.trim()) return flash("Enter the product name.");
                if (await post({action:"addSuggestion",planId:plan.id,...ideaForm})) {
                  setIdeaModal(false);
                  setIdeaForm({...ideaForm,productCode:"",productName:"",category:"",brandSupplier:"",currentPrice:"",proposedPrice:"",expectedQty:"",reason:"",competitorNote:"",displayIdea:""});
                  flash("Product idea added.");
                }
              }}>
                Add product idea
              </button>
            </footer>
          </section>
        </div>
      )}

      {feedbackOpen !== null && (
        <div className="planOverlay" onMouseDown={()=>setFeedbackOpen(null)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()} style={{maxWidth:"560px"}}>
            <header><h3>Your view on this product</h3><button onClick={()=>setFeedbackOpen(null)}>×</button></header>
            <div className="planModalBody">
              <label>Support<select value={feedbackForm.support} onChange={(e)=>setFeedbackForm({...feedbackForm,support:e.target.value})}><option>Strong Yes</option><option>Yes</option><option>Maybe</option><option>No</option></select></label>
              <label className="span2">Manager comment<textarea value={feedbackForm.comment} onChange={(e)=>setFeedbackForm({...feedbackForm,comment:e.target.value})} placeholder="Why will / won't this work in your branch?" /></label>
            </div>
            <footer><button onClick={()=>setFeedbackOpen(null)}>Cancel</button><button className="primary" disabled={saving} onClick={async ()=>{
              if (await post({action:"feedback",suggestionId:feedbackOpen,...feedbackForm})) {
                setFeedbackOpen(null);
                flash("Your product feedback was saved.");
              }
            }}>Save my view</button></footer>
          </section>
        </div>
      )}

      {thoughtReactionOpen !== null && (
        <div className="planOverlay" onMouseDown={()=>setThoughtReactionOpen(null)}>
          <section className="planModal" onMouseDown={(event)=>event.stopPropagation()} style={{maxWidth:"560px"}}>
            <header>
              <h3>Your view on this thought</h3>
              <button onClick={()=>setThoughtReactionOpen(null)}>×</button>
            </header>

            <div className="planModalBody">
              <label>
                Reaction
                <select
                  value={thoughtReactionForm.reaction}
                  onChange={(event)=>setThoughtReactionForm({...thoughtReactionForm,reaction:event.target.value})}
                >
                  <option>Strong idea</option>
                  <option>Agree</option>
                  <option>Consider</option>
                  <option>Not for this promotion</option>
                </select>
              </label>

              <label className="span2">
                Comment
                <textarea
                  value={thoughtReactionForm.comment}
                  onChange={(event)=>setThoughtReactionForm({...thoughtReactionForm,comment:event.target.value})}
                  placeholder="Add your reasoning, pricing concern, customer insight or alternative suggestion."
                />
              </label>
            </div>

            <footer>
              <button onClick={()=>setThoughtReactionOpen(null)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                if (await post({
                  action:"thoughtReaction",
                  thoughtId:thoughtReactionOpen,
                  ...thoughtReactionForm,
                })) {
                  setThoughtReactionOpen(null);
                  flash("Your view was saved.");
                }
              }}>
                Save my view
              </button>
            </footer>
          </section>
        </div>
      )}

      {decisionVoteOpen !== null && (
        <div className="planOverlay" onMouseDown={()=>setDecisionVoteOpen(null)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()} style={{maxWidth:"560px"}}>
            <header><h3>Your vote on this decision</h3><button onClick={()=>setDecisionVoteOpen(null)}>×</button></header>
            <div className="planModalBody">
              <label>Vote<select value={decisionVoteForm.vote} onChange={(e)=>setDecisionVoteForm({...decisionVoteForm,vote:e.target.value})}><option>Support</option><option>Prefer alternative</option><option>Need discussion</option></select></label>
              <label className="span2">Comment<textarea value={decisionVoteForm.comment} onChange={(e)=>setDecisionVoteForm({...decisionVoteForm,comment:e.target.value})} placeholder="Explain your view so everyone can decide without another meeting." /></label>
            </div>
            <footer>
              <button onClick={()=>setDecisionVoteOpen(null)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={async ()=>{
                if (await post({action:"decisionVote",decisionId:decisionVoteOpen,...decisionVoteForm})) {
                  setDecisionVoteOpen(null);
                  flash("Your decision vote was saved.");
                }
              }}>
                Save vote
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
