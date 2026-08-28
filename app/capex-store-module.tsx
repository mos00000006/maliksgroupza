"use client";

import { useEffect, useMemo, useState } from "react";

type Workspace = {
  id: number;
  name: string;
  type: string;
  region: string;
  manager: string;
};

type Entry = {
  id: number;
  workspace: string;
  entry_type: string;
  category: string;
  amount: number;
  period: string;
  description: string;
  expense_nature: string;
  recurring: number;
  effective_to: string;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const todayPeriod = new Date().toISOString().slice(0, 7);

const isExpense = (entry: Entry) =>
  ["CAPEX", "Maintenance", "Operating Expense"].includes(entry.entry_type);

const appliesToMonth = (entry: Entry, period: string) =>
  entry.period === period ||
  Boolean(
    entry.recurring &&
      entry.period <= period &&
      (!entry.effective_to || entry.effective_to >= period),
  );

export default function CapexStoreModule({
  workspaces,
}: {
  workspaces: Workspace[];
}) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [period, setPeriod] = useState(todayPeriod);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    workspace: "",
    entry_type: "CAPEX",
    category: "Equipment",
    amount: "",
    period: todayPeriod,
    description: "",
    expense_nature: "Capital",
    recurring: false,
    effective_to: "",
  });

  const locations = useMemo(
    () =>
      workspaces.filter((workspace) =>
        [
          "Store",
          "DC",
          "Head Office",
          "Wholesale",
          "Wholesale Division",
          "Warehouse",
        ].includes(
          workspace.type,
        ),
      ),
    [workspaces],
  );

  const load = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/financials");
      const data = await response.json();
      setEntries(data.entries || []);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  const openStore = (name: string) => {
    setSelectedStore(name);
    setError("");
  };

  const beginAdd = (name: string) => {
    setDraft({
      workspace: name,
      entry_type: "CAPEX",
      category: "Equipment",
      amount: "",
      period,
      description: "",
      expense_nature: "Capital",
      recurring: false,
      effective_to: "",
    });
    setError("");
    setOpen(true);
  };

  const save = async () => {
    if (!draft.workspace || !draft.category || Number(draft.amount) <= 0) {
      setError("Enter a category and an amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    const response = await fetch("/api/financials", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (response.ok) {
      setOpen(false);
      await load();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "The expense could not be saved.");
    }
    setSaving(false);
  };

  const summaries = locations.map((location) => {
    const rows = entries.filter(
      (entry) => entry.workspace === location.name && isExpense(entry),
    );
    const lifetimeCapex = rows
      .filter((entry) => entry.entry_type === "CAPEX")
      .reduce((total, entry) => total + Number(entry.amount), 0);
    const monthly = rows
      .filter((entry) => appliesToMonth(entry, period))
      .reduce((total, entry) => total + Number(entry.amount), 0);
    const fixed = rows
      .filter(
        (entry) =>
          entry.recurring &&
          entry.expense_nature === "Fixed" &&
          appliesToMonth(entry, period),
      )
      .reduce((total, entry) => total + Number(entry.amount), 0);
    return { location, rows, lifetimeCapex, monthly, fixed };
  });

  const selected = summaries.find(
    (summary) => summary.location.name === selectedStore,
  );

  return (
    <>
      {!selected ? (
        <>
          <div className="capexControls">
            <span>
              <b>Select a store or division</b>
              <small>Open its register and add expenses directly—no task required.</small>
            </span>
            <label>
              Reporting month
              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              />
            </label>
          </div>
          {busy ? (
            <div className="loading">Loading store CAPEX registers…</div>
          ) : (
            <section className="capexStoreGrid" aria-label="Store CAPEX registers">
              {summaries.map(({ location, lifetimeCapex, monthly, fixed, rows }) => (
                <article key={location.id}>
                  <button
                    className="capexStoreOpen"
                    onClick={() => openStore(location.name)}
                  >
                    <span className="capexStoreIcon">▦</span>
                    <span>
                      <small>{location.type} · {location.region}</small>
                      <h3>{location.name}</h3>
                    </span>
                    <strong>Open register →</strong>
                  </button>
                  <div className="capexStoreFigures">
                    <span><small>Lifetime CAPEX</small><b>{money(lifetimeCapex)}</b></span>
                    <span><small>{period} spend</small><b>{money(monthly)}</b></span>
                    <span><small>Fixed monthly</small><b>{money(fixed)}</b></span>
                    <span><small>Entries</small><b>{rows.length}</b></span>
                  </div>
                  <button className="capexQuickAdd" onClick={() => beginAdd(location.name)}>
                    ＋ Add expense to {location.name}
                  </button>
                </article>
              ))}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="capexStoreHeader">
            <button className="capexBack" onClick={() => setSelectedStore(null)}>
              ← All stores
            </button>
            <span>
              <small>{selected.location.type} · {selected.location.region}</small>
              <h2>{selected.location.name} CAPEX &amp; expenses</h2>
              <p>Add fixed, variable, once-off and capital expenses directly to this location.</p>
            </span>
            <button className="capexPrimary" onClick={() => beginAdd(selected.location.name)}>
              ＋ Add expense
            </button>
          </div>
          <div className="capexStoreKpis">
            <article><small>Lifetime CAPEX</small><b>{money(selected.lifetimeCapex)}</b><em>Never resets monthly</em></article>
            <article><small>{period} total spend</small><b>{money(selected.monthly)}</b><em>Fixed costs carry forward</em></article>
            <article><small>Fixed monthly</small><b>{money(selected.fixed)}</b><em>Recurring commitments</em></article>
            <article><small>Register entries</small><b>{selected.rows.length}</b><em>Stored against this location</em></article>
          </div>
          <div className="capexPeriodBar">
            <label>
              Monthly view
              <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
            </label>
            <small>CAPEX totals remain lifetime totals; the monthly view affects operating and recurring spend.</small>
          </div>
          <section className="panel capexRegisterPanel">
            <div className="panelhead">
              <span>
                <h2>Expense register</h2>
                <p>Direct financial entries for {selected.location.name}</p>
              </span>
              <button onClick={() => beginAdd(selected.location.name)}>Add expense</button>
            </div>
            {!selected.rows.length ? (
              <div className="moduleEmpty">
                <b>No expenses recorded for this location</b>
                <p>Add the first CAPEX, maintenance or operating expense directly.</p>
                <button onClick={() => beginAdd(selected.location.name)}>＋ Add first expense</button>
              </div>
            ) : (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th><th>Type</th><th>Category</th><th>Description</th><th>Behaviour</th><th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.rows.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.period}</td>
                        <td><em className={`financeType ${entry.entry_type.replaceAll(" ", "")}`}>{entry.entry_type}</em></td>
                        <td><b>{entry.category}</b></td>
                        <td>{entry.description || "—"}</td>
                        <td><b>{entry.expense_nature}</b><small className="financeCarry">{entry.recurring ? "Carries monthly" : "Once only"}</small></td>
                        <td><b>{money(entry.amount)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <div className="crmModal capexModal" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <span>
                <small>DIRECT STORE ENTRY</small>
                <h2>Add expense · {draft.workspace}</h2>
                <p>This saves to the store register. It does not create a task.</p>
              </span>
              <button onClick={() => setOpen(false)}>×</button>
            </header>
            {error && <div className="formError">{error}</div>}
            <div className="crmForm">
              <label>
                Store / Division
                <input value={draft.workspace} readOnly />
              </label>
              <label>
                Period
                <input type="month" value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })} />
              </label>
              <label>
                Expense type
                <select
                  value={draft.entry_type}
                  onChange={(event) => {
                    const entryType = event.target.value;
                    setDraft({
                      ...draft,
                      entry_type: entryType,
                      expense_nature: entryType === "CAPEX" ? "Capital" : draft.expense_nature,
                      recurring: entryType === "CAPEX" ? false : draft.recurring,
                    });
                  }}
                >
                  <option>CAPEX</option>
                  <option>Maintenance</option>
                  <option>Operating Expense</option>
                </select>
              </label>
              <label>
                Category
                <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
                  {["Equipment", "Renovation", "Shelving", "IT & Systems", "Vehicles", "Security", "Signage", "Repairs", "Utilities", "Other"].map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Expense behaviour
                <select
                  value={draft.expense_nature}
                  onChange={(event) => {
                    const nature = event.target.value;
                    setDraft({ ...draft, expense_nature: nature, recurring: nature === "Fixed" });
                  }}
                >
                  <option>Capital</option>
                  <option>Fixed</option>
                  <option>Variable</option>
                  <option>Once-off</option>
                </select>
              </label>
              <label>
                Amount (R)
                <input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />
              </label>
              <label className="financeRecurring wide">
                Monthly treatment
                <span>
                  <input type="checkbox" checked={draft.recurring} onChange={(event) => setDraft({ ...draft, recurring: event.target.checked })} />
                  Carry this fixed expense into future months
                </span>
              </label>
              {draft.recurring && (
                <label>
                  End month (optional)
                  <input type="month" value={draft.effective_to} onChange={(event) => setDraft({ ...draft, effective_to: event.target.value })} />
                </label>
              )}
              <label className="wide">
                Description / supplier / reference
                <input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="What was purchased or repaired?" />
              </label>
            </div>
            <footer>
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save to store register"}</button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
