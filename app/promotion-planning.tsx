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

type ApiData = {
  plans: Plan[];
  suggestions: Suggestion[];
  feedback: Feedback[];
  comments: Comment[];
  allowedBranches: string[];
  permissions: { canManage: boolean; canContribute: boolean };
};

const categories = [
  "Building Materials","Cement","Paints & Allied","Waterproofing","Plumbing","PVC Pipes & Fittings",
  "Sanware","Tiles & Flooring","Electrical & Lighting","Tools","Power Tools","Hardware","Fasteners",
  "Doors / Frames / Windows","Roofing","Steel","Timber","Chemicals","Yard","Other",
];

const supportScore: Record<string, number> = { "Strong Yes": 3, "Yes": 2, "Maybe": 1, "No": -1 };

function fmt(value: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00+02:00`).toLocaleDateString("en-ZA", { day:"2-digit", month:"short", year:"numeric" });
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
  const [feedbackOpen, setFeedbackOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [planForm, setPlanForm] = useState({ title:"", promoStart:"", promoEnd:"", inputDeadline:"", brief:"" });
  const [ideaForm, setIdeaForm] = useState({
    branch:"", productCode:"", productName:"", category:"", brandSupplier:"",
    currentPrice:"", proposedPrice:"", expectedQty:"", reason:"", competitorNote:"", displayIdea:"",
  });
  const [commentForm, setCommentForm] = useState({ branch:"", topic:"Products", comment:"" });
  const [feedbackForm, setFeedbackForm] = useState({ branch:"", support:"Yes", comment:"" });

  const flash = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/promotion-planning", { cache:"no-store" });
      const result = await response.json();
      if (!response.ok) return flash(result.error || "Promotion planning could not be loaded.");
      setData(result);
      setPlanId((current) => current || Number(result.plans?.[0]?.id || 0));
      const firstBranch = result.allowedBranches?.[0] || "";
      setIdeaForm((f) => ({ ...f, branch: f.branch || firstBranch }));
      setCommentForm((f) => ({ ...f, branch: f.branch || firstBranch }));
      setFeedbackForm((f) => ({ ...f, branch: f.branch || firstBranch }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
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
  const feedback = data?.feedback || [];

  const scoreFor = (suggestionId: number) =>
    feedback
      .filter((f) => f.suggestion_id === suggestionId)
      .reduce((sum, f) => sum + (supportScore[f.support] || 0), 0);

  const responseBranches = useMemo(() => {
    const set = new Set<string>();
    suggestions.forEach((s) => set.add(s.branch));
    comments.forEach((c) => set.add(c.branch));
    return set;
  }, [suggestions, comments]);

  const totalBranches = plan?.branches.length || 0;
  const outstanding = (plan?.branches || []).filter((b) => !responseBranches.has(b));
  const approved = suggestions.filter((s) => s.status === "Approved").length;
  const topIdeas = [...suggestions].sort((a,b) => scoreFor(b.id) - scoreFor(a.id));

  const post = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/promotion-planning", {
        method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { flash(result.error || "Could not save."); return false; }
      await load();
      return true;
    } finally { setSaving(false); }
  };

  const patch = async (payload: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/promotion-planning", {
        method:"PATCH", headers:{ "content-type":"application/json" }, body:JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { flash(result.error || "Could not update."); return false; }
      await load();
      return true;
    } finally { setSaving(false); }
  };

  if (loading && !data) return <div className="promotionPlanLoading">Loading next promotion planning…</div>;

  return (
    <section className="promotionPlanning">
      <style>{`
        .promotionPlanning{display:grid;gap:14px;padding-bottom:40px}.promotionPlanLoading{padding:25px;background:#fff;border:1px solid #dbe4ec;border-radius:12px}
        .planToast{position:fixed;right:22px;top:95px;z-index:90;background:#fff;border:1px solid #d7e0e9;border-radius:11px;padding:11px 14px;box-shadow:0 18px 44px #17243825;color:#314a63;font-size:10px;font-weight:800}
        .planHero{background:linear-gradient(125deg,#14263d,#244564);border-radius:17px;color:#fff;padding:20px 22px;display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
        .planHero small{color:#f6ca2d;font-size:8px;font-weight:900;letter-spacing:.15em}.planHero h2{font-size:23px;margin:5px 0}.planHero p{margin:0;color:#c9d7e5;font-size:9px;line-height:1.55;max-width:780px}
        .planActions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.planActions button,.planBack{height:38px;border-radius:9px;border:1px solid #d8e2eb;background:#fff;color:#27415b;padding:0 12px;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.planActions .primary{background:#f5ca2e;border-color:#ddb619;color:#172438}
        .planTopBar{display:flex;gap:8px;align-items:center;justify-content:space-between;background:#fff;border:1px solid #dce5ed;border-radius:12px;padding:8px 10px}.planTopBar select{min-width:280px;border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:9px;color:#294159;background:#fff}
        .planKpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.planKpis article{background:#fff;border:1px solid #dbe4ec;border-radius:12px;padding:13px}.planKpis span,.planKpis b,.planKpis small{display:block}.planKpis span{font-size:7px;font-weight:900;color:#7d8997;text-transform:uppercase}.planKpis b{font-size:20px;color:#213b54;margin-top:4px}.planKpis small{font-size:7px;color:#8f9aa7;margin-top:4px}
        .participation{background:#fff;border:1px solid #dbe4ec;border-radius:13px;padding:14px}.participationHeader{display:flex;justify-content:space-between;gap:12px;align-items:center}.participationHeader b{font-size:10px;color:#2c455e}.participationHeader button{border:1px solid #d4dee8;background:#fff;border-radius:8px;padding:7px 10px;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.progress{height:9px;background:#edf2f6;border-radius:99px;margin-top:10px;overflow:hidden}.progress span{display:block;height:100%;background:#f4c82b;border-radius:99px}.outstanding{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.outstanding span{background:#fff2d2;color:#8a6200;border-radius:99px;padding:5px 8px;font-size:7px;font-weight:800}
        .planColumns{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(320px,.8fr);gap:12px}.planPanel{background:#fff;border:1px solid #dbe4ec;border-radius:13px;padding:14px}.planPanelHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.planPanelHeader h3{font-size:13px;color:#223c55;margin:0}.planPanelHeader button{border:1px solid #d4dee8;background:#172d46;color:#fff;border-radius:8px;padding:7px 10px;font:inherit;font-size:7px;font-weight:850;cursor:pointer}
        .ideaList{display:grid;gap:9px}.ideaCard{border:1px solid #dde5ed;border-radius:11px;padding:12px;background:#fbfcfd}.ideaTop{display:flex;justify-content:space-between;gap:10px}.ideaCard h4{margin:2px 0 4px;color:#203951;font-size:11px}.ideaCard p{margin:0;color:#6b7c8e;font-size:8px;line-height:1.5}.ideaMeta{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.ideaMeta span{background:#edf3f8;color:#526a82;border-radius:99px;padding:4px 7px;font-size:6.5px;font-weight:800}.ideaScore{min-width:56px;text-align:center;background:#172d46;color:#fff;border-radius:9px;padding:7px}.ideaScore b{display:block;font-size:14px}.ideaScore small{font-size:6px;color:#c6d5e3}.ideaActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.ideaActions button,.ideaActions select{border:1px solid #d7e0e9;border-radius:7px;background:#fff;padding:6px 8px;font:inherit;font-size:7px;font-weight:800;color:#405a73}
        .ideaStatus{display:inline-flex;padding:4px 7px;border-radius:99px;background:#eef2f6;color:#617388;font-size:6.5px;font-weight:850}.ideaStatus.Approved{background:#dff4e7;color:#196a49}.ideaStatus.Declined{background:#f8e2e4;color:#a43c48}.ideaStatus.Review{background:#fff0ca;color:#8a6200}
        .commentComposer{display:grid;gap:7px;margin-bottom:12px}.commentComposer select,.commentComposer textarea{border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:8px}.commentComposer textarea{min-height:74px;resize:vertical}.commentComposer button{justify-self:end;border:0;background:#f5ca2e;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:900;color:#172438}
        .comments{display:grid;gap:7px;max-height:520px;overflow:auto}.comment{background:#f7f9fb;border:1px solid #e0e7ee;border-radius:9px;padding:9px}.comment b{font-size:8px;color:#2f4962}.comment small{display:block;color:#8995a2;font-size:6.5px;margin:2px 0 5px}.comment p{font-size:8px;color:#536a80;margin:0;line-height:1.5}
        .planEmpty{padding:24px;text-align:center;border:1px dashed #cbd7e2;border-radius:11px;color:#7a8998}.planEmpty b{display:block;color:#405a73;margin-bottom:4px}
        .planOverlay{position:fixed;inset:0;background:#0d1a2b99;z-index:95;display:grid;place-items:center;padding:12px}.planModal{width:min(760px,calc(100vw - 24px));max-height:calc(100dvh - 24px);background:#fff;border-radius:15px;overflow:hidden;display:flex;flex-direction:column}.planModal header{display:flex;justify-content:space-between;padding:15px 17px;border-bottom:1px solid #e3e9ef}.planModal header h3{margin:0;color:#203951}.planModal header button{border:0;background:#edf2f6;width:32px;height:32px;border-radius:8px}.planModalBody{padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;overflow:auto}.planModalBody label{display:grid;gap:5px;font-size:7px;font-weight:850;color:#40566e}.planModalBody input,.planModalBody select,.planModalBody textarea{border:1px solid #d5dfe8;border-radius:8px;padding:8px;font:inherit;font-size:8px}.planModalBody textarea{min-height:80px}.span2{grid-column:1/-1}.planModal footer{display:flex;justify-content:flex-end;gap:7px;padding:10px 15px;border-top:1px solid #e5ebf0}.planModal footer button{border:1px solid #d5dfe8;background:#fff;border-radius:8px;padding:8px 11px;font:inherit;font-size:7px;font-weight:850}.planModal footer .primary{background:#f5ca2e;border-color:#dfb91f;color:#172438}
        @media(max-width:900px){.planColumns{grid-template-columns:1fr}.planKpis{grid-template-columns:1fr 1fr}.planHero{grid-template-columns:1fr}.planActions{justify-content:flex-start}}
        @media(max-width:720px){.planTopBar{align-items:stretch;flex-direction:column}.planTopBar select{min-width:0;width:100%}.planKpis{grid-template-columns:1fr 1fr}.planModalBody{grid-template-columns:1fr}.span2{grid-column:auto}.planToast{left:12px;right:12px;top:82px}.ideaTop{align-items:flex-start}}
      `}</style>

      {message && <div className="planToast">{message}</div>}

      <div className="planHero">
        <div>
          <small>POWERBUILD PROMOTION LAB</small>
          <h2>Next Promotion Planning</h2>
          <p>Collect real branch demand before the next pamphlet is built. Managers can suggest products, quantities, pricing ideas, competitor observations and merchandising ideas, then support or challenge each other’s suggestions.</p>
        </div>
        <div className="planActions">
          <button onClick={onBack}>← Store Specials</button>
          {data?.permissions.canManage && <button className="primary" onClick={() => setPlanModal(true)}>＋ New planning cycle</button>}
          {data?.permissions.canContribute && plan && plan.status !== "Finalised" && <button className="primary" onClick={() => setIdeaModal(true)}>＋ Suggest product</button>}
        </div>
      </div>

      {data?.plans.length ? (
        <>
          <div className="planTopBar">
            <select value={plan?.id || 0} onChange={(e) => setPlanId(Number(e.target.value))}>
              {data.plans.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.status}</option>)}
            </select>
            {plan && <span style={{fontSize:"8px",fontWeight:800,color:"#62758a"}}>Input closes {fmt(plan.input_deadline)} · Promo {fmt(plan.promo_start)} – {fmt(plan.promo_end)}</span>}
          </div>

          <div className="planKpis">
            <article><span>Branches responded</span><b>{responseBranches.size}/{totalBranches}</b><small>Managers participating</small></article>
            <article><span>Product ideas</span><b>{suggestions.length}</b><small>Items proposed</small></article>
            <article><span>Approved items</span><b>{approved}</b><small>Current shortlist</small></article>
            <article><span>Branch comments</span><b>{comments.length}</b><small>Market feedback</small></article>
          </div>

          <div className="participation">
            <div className="participationHeader">
              <b>Branch participation · {totalBranches ? Math.round((responseBranches.size / totalBranches) * 100) : 0}% complete</b>
              {data.permissions.canManage && outstanding.length > 0 && (
                <button onClick={async () => {
                  if (await patch({ action:"remindOutstanding", id:plan?.id })) flash(`Reminder sent to ${outstanding.length} outstanding branch${outstanding.length === 1 ? "" : "es"}.`);
                }}>🔔 Remind outstanding branches</button>
              )}
            </div>
            <div className="progress"><span style={{width:`${totalBranches ? Math.min(100,(responseBranches.size/totalBranches)*100) : 0}%`}} /></div>
            {outstanding.length > 0 && <div className="outstanding">{outstanding.map((b) => <span key={b}>{b}</span>)}</div>}
          </div>

          <div className="planColumns">
            <div className="planPanel">
              <div className="planPanelHeader"><h3>Product ideas & branch support</h3>{plan?.brief && <small style={{color:"#7c8b9b"}}>{plan.brief}</small>}</div>
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
                          <p>{idea.branch} · {idea.category || "General"}{idea.brand_supplier ? ` · ${idea.brand_supplier}` : ""}</p>
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
                            setFeedbackForm({ branch:data.allowedBranches[0] || "", support:myFeedback?.support || "Yes", comment:myFeedback?.comment || "" });
                          }}>{myFeedback ? `Your view: ${myFeedback.support}` : "Add your view"}</button>
                        )}
                        {data.permissions.canManage && (
                          <select value={idea.status} onChange={async (e) => {
                            await patch({ action:"suggestionStatus", id:idea.id, status:e.target.value });
                          }}>
                            {["Suggested","Under Review","Approved","Hold","Declined"].map((s) => <option key={s}>{s}</option>)}
                          </select>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!suggestions.length && <div className="planEmpty"><b>No product ideas yet</b>Branch managers can start adding products they believe should be in the next promotion.</div>}
              </div>
            </div>

            <aside className="planPanel">
              <div className="planPanelHeader"><h3>Branch thoughts</h3></div>
              {data.permissions.canContribute && (
                <div className="commentComposer">
                  {data.allowedBranches.length > 1 && <select value={commentForm.branch} onChange={(e)=>setCommentForm({...commentForm,branch:e.target.value})}>{data.allowedBranches.map((b)=><option key={b}>{b}</option>)}</select>}
                  <select value={commentForm.topic} onChange={(e)=>setCommentForm({...commentForm,topic:e.target.value})}>
                    {["Products","Pricing","Stock","Competitors","Marketing","Display / Merchandising","Customer Demand","Other"].map((t)=><option key={t}>{t}</option>)}
                  </select>
                  <textarea value={commentForm.comment} onChange={(e)=>setCommentForm({...commentForm,comment:e.target.value})} placeholder="What is your branch seeing? What sold well, what should be avoided, what are customers asking for?" />
                  <button disabled={saving} onClick={async () => {
                    if (!commentForm.comment.trim()) return flash("Enter your branch feedback.");
                    if (await post({ action:"addComment", planId:plan?.id, ...commentForm })) {
                      setCommentForm({...commentForm,comment:""}); flash("Branch feedback added.");
                    }
                  }}>Add branch feedback</button>
                </div>
              )}
              <div className="comments">
                {comments.map((c) => <div className="comment" key={c.id}><b>{c.branch} · {c.topic}</b><small>{c.created_by} · {new Date(c.created_at).toLocaleString()}</small><p>{c.comment}</p></div>)}
                {!comments.length && <div className="planEmpty"><b>No branch comments yet</b>Comments from managers will appear here.</div>}
              </div>
            </aside>
          </div>

          {data.permissions.canManage && plan && (
            <div className="planTopBar">
              <span style={{fontSize:"8px",fontWeight:850,color:"#435c75"}}>Planning status</span>
              <select style={{minWidth:"180px"}} value={plan.status} onChange={async (e)=>{ await patch({action:"planStatus",id:plan.id,status:e.target.value}); }}>
                <option>Open</option><option>Reviewing</option><option>Finalised</option>
              </select>
            </div>
          )}
        </>
      ) : (
        <div className="planEmpty"><b>No next-promotion planning cycle yet</b>{data?.permissions.canManage ? "Create the first planning cycle and all managers will be notified to submit ideas." : "Head Office has not opened the next promotion planning cycle yet."}</div>
      )}

      {planModal && (
        <div className="planOverlay" onMouseDown={()=>setPlanModal(false)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()}>
            <header><h3>Open next promotion planning</h3><button onClick={()=>setPlanModal(false)}>×</button></header>
            <div className="planModalBody">
              <label className="span2">Planning title<input value={planForm.title} onChange={(e)=>setPlanForm({...planForm,title:e.target.value})} placeholder="e.g. October / Black Friday / Festive Promotion" /></label>
              <label>Promotion starts<input type="date" value={planForm.promoStart} onChange={(e)=>setPlanForm({...planForm,promoStart:e.target.value})} /></label>
              <label>Promotion ends<input type="date" value={planForm.promoEnd} onChange={(e)=>setPlanForm({...planForm,promoEnd:e.target.value})} /></label>
              <label>Manager input deadline<input type="date" value={planForm.inputDeadline} onChange={(e)=>setPlanForm({...planForm,inputDeadline:e.target.value})} /></label>
              <label className="span2">Planning brief<textarea value={planForm.brief} onChange={(e)=>setPlanForm({...planForm,brief:e.target.value})} placeholder="Focus categories, margin targets, supplier support, customer profile, campaign theme…" /></label>
            </div>
            <footer><button onClick={()=>setPlanModal(false)}>Cancel</button><button className="primary" disabled={saving} onClick={async ()=>{
              const ok = await post({action:"createPlan",...planForm});
              if (ok) { setPlanModal(false); setPlanForm({title:"",promoStart:"",promoEnd:"",inputDeadline:"",brief:""}); flash("Planning cycle opened and managers notified."); }
            }}>Open planning & notify managers</button></footer>
          </section>
        </div>
      )}

      {ideaModal && plan && (
        <div className="planOverlay" onMouseDown={()=>setIdeaModal(false)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()}>
            <header><h3>Suggest a product for the next promotion</h3><button onClick={()=>setIdeaModal(false)}>×</button></header>
            <div className="planModalBody">
              <label>Branch<select value={ideaForm.branch} onChange={(e)=>setIdeaForm({...ideaForm,branch:e.target.value})}>{data?.allowedBranches.map((b)=><option key={b}>{b}</option>)}</select></label>
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
            <footer><button onClick={()=>setIdeaModal(false)}>Cancel</button><button className="primary" disabled={saving} onClick={async ()=>{
              if (!ideaForm.productName.trim()) return flash("Enter the product name.");
              if (await post({action:"addSuggestion",planId:plan.id,...ideaForm})) {
                setIdeaModal(false); setIdeaForm({...ideaForm,productCode:"",productName:"",category:"",brandSupplier:"",currentPrice:"",proposedPrice:"",expectedQty:"",reason:"",competitorNote:"",displayIdea:""}); flash("Product idea added.");
              }
            }}>Add product idea</button></footer>
          </section>
        </div>
      )}

      {feedbackOpen !== null && (
        <div className="planOverlay" onMouseDown={()=>setFeedbackOpen(null)}>
          <section className="planModal" onMouseDown={(e)=>e.stopPropagation()} style={{maxWidth:"560px"}}>
            <header><h3>Your view on this product</h3><button onClick={()=>setFeedbackOpen(null)}>×</button></header>
            <div className="planModalBody">
              <label>Branch<select value={feedbackForm.branch} onChange={(e)=>setFeedbackForm({...feedbackForm,branch:e.target.value})}>{data?.allowedBranches.map((b)=><option key={b}>{b}</option>)}</select></label>
              <label>Support<select value={feedbackForm.support} onChange={(e)=>setFeedbackForm({...feedbackForm,support:e.target.value})}><option>Strong Yes</option><option>Yes</option><option>Maybe</option><option>No</option></select></label>
              <label className="span2">Manager comment<textarea value={feedbackForm.comment} onChange={(e)=>setFeedbackForm({...feedbackForm,comment:e.target.value})} placeholder="Why will / won't this work in your branch?" /></label>
            </div>
            <footer><button onClick={()=>setFeedbackOpen(null)}>Cancel</button><button className="primary" disabled={saving} onClick={async ()=>{
              if (await post({action:"feedback",suggestionId:feedbackOpen,...feedbackForm})) { setFeedbackOpen(null); flash("Your product feedback was saved."); }
            }}>Save my view</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
