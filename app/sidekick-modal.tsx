"use client";
import { useState } from "react";
export default function SidekickModal({
  close,
  openSops,
}: {
  close: () => void;
  openSops?: () => void;
}) {
  const [q, setQ] = useState(""),
    [answer, setAnswer] = useState(""),
    [busy, setBusy] = useState(false),
    [configured, setConfigured] = useState(true);
  const ask = async (text = q) => {
    if (!text.trim()) return;
    setBusy(true);
    setAnswer("");
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const j = await r.json();
    setConfigured(j.configured !== false);
    setAnswer(j.answer || j.error);
    setBusy(false);
  };
  const prompts = [
    "Give me today’s executive operations brief",
    "Which stores and tasks need immediate attention?",
    "Summarise blocked and overdue work",
    "Summarise our approved SOP workflows",
  ];
  return (
    <div className="overlay" onMouseDown={close}>
      <div className="sidekickModal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div className="aiMark">✦</div>
          <span>
            <h2>Maliks Group AI Sidekick</h2>
            <p>Your operations assistant across every connected workspace</p>
          </span>
          <button onClick={close}>×</button>
        </header>
        <div className="aiBody">
          <section>
            <h3>How can I help?</h3>
            <div className="promptGrid">
              {prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setQ(p);
                    ask(p);
                  }}
                >
                  {p}
                  <span>→</span>
                </button>
              ))}
            </div>
            {answer && (
              <article className="aiAnswer">
                <b>Sidekick response</b>
                <p>{answer}</p>
              </article>
            )}
            {!configured && (
              <article className="aiSetup">
                <b>Secure AI connection required</b>
                <p>
                  The Sidekick interface is installed. An OpenAI API project key
                  must be added securely to the hub’s environment before live
                  answers can run. Never paste the key into a task or chat.
                </p>
              </article>
            )}
            <article className="aiCapability">
              <b>Controlled AI actions</b>
              <p>
                The Sidekick can generate workflows and checklists from uploaded
                SOPs. It creates tasks only after an authorised user approves
                the workflow; it cannot secretly rewrite the Hub.
              </p>
              <button onClick={openSops}>Open SOP &amp; Manuals →</button>
            </article>
          </section>
          <footer>
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask about stores, overdue tasks, audits, CAPEX or wholesale…"
            />
            <button onClick={() => ask()} disabled={busy}>
              {busy ? "Thinking…" : "Ask Sidekick"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
