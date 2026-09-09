"use client";
import { useRef, useState } from "react";

type HistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export default function SidekickModal({
  close,
  openSops,
}: {
  close: () => void;
  openSops?: () => void;
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const touchStartX = useRef<number | null>(null);

  const ask = async (text = q) => {
    const message = text.trim();
    if (!message || busy) return;

    setBusy(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const json = (await response.json()) as {
        configured?: boolean;
        answer?: string;
        error?: string;
      };

      setConfigured(json.configured !== false);
      const reply = json.answer || json.error || "No response was returned.";
      setAnswer(reply);
      if (json.answer) {
        setHistory((current) =>
          [
            ...current,
            { role: "user" as const, content: message },
            { role: "assistant" as const, content: json.answer || "" },
          ].slice(-8),
        );
        setQ("");
      }
    } catch {
      setAnswer("The Sidekick could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;
    if (distance > 70) close();
  };

  const prompts = [
    "Give me today’s executive operations brief",
    "Which stores and tasks need immediate attention?",
    "Summarise blocked and overdue work",
    "Summarise our approved SOP workflows",
  ];

  return (
    <div className="overlay sidekickOverlay" onMouseDown={close}>
      <div
        className="sidekickModal sidekickDrawer"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidekickSwipeHandle" aria-hidden="true" />
        <header>
          <div className="aiMark">✦</div>
          <span>
            <h2>Maliks Group AI Sidekick</h2>
            <p>Your live operations assistant across authorised Hub data</p>
          </span>
          <button onClick={close} aria-label="Close AI Sidekick">
            ×
          </button>
        </header>
        <div className="aiBody">
          <section>
            <h3>How can I help?</h3>
            <div className="promptGrid">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  disabled={busy}
                  onClick={() => {
                    setQ(prompt);
                    void ask(prompt);
                  }}
                >
                  {prompt}
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
                  The Sidekick is ready, but the OPENAI_API_KEY secret has not
                  been activated for the production Hub yet. Add it as a GitHub
                  repository secret; never paste the key into a task or chat.
                </p>
              </article>
            )}
            <article className="aiCapability">
              <b>Live Hub intelligence · Read-only</b>
              <p>
                Sidekick can analyse authorised tasks, workspaces, SOPs, P&amp;L,
                and relevant division data. It will not change records or create
                tasks without a separate approved workflow.
              </p>
              <button onClick={openSops}>Open SOP &amp; Manuals →</button>
            </article>
          </section>
          <footer>
            <textarea
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                  event.preventDefault();
                  void ask();
                }
              }}
              placeholder="Ask about stores, overdue tasks, P&L, SOPs, developments or wholesale…"
            />
            <button onClick={() => void ask()} disabled={busy || !q.trim()}>
              {busy ? "Thinking…" : "Ask Sidekick"}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
