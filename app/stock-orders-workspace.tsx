"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadStockOrdersWorkbook } from "./buyer-excel";

type CurrentUser = { name: string; email: string; role?: string };
type StockLine = {
  id?: number;
  catalogue_product_id: number;
  product_code: string;
  description: string;
  category: string;
  quantity_requested: number;
  quantity_confirmed: number;
  quantity_dispatched: number;
  unit: string;
  branch_notes: string;
  warehouse_notes: string;
};
type StockOrder = {
  id: number;
  stock_order_number: string;
  branch_workspace: string;
  requested_by_email: string;
  requested_by_name: string;
  order_date: string;
  required_date: string;
  priority: string;
  status: string;
  branch_notes: string;
  warehouse_notes: string;
  buyer_email: string;
  buyer_name: string;
  sent_at: string;
  confirmed_at: string;
  expected_delivery_date: string;
  dispatch_reference: string;
  completed_at: string;
  updated_at: string;
  lines: StockLine[];
};
type Branch = { id: number; name: string; type: string; region: string; manager: string };
type StockData = {
  orders: StockOrder[];
  branches: Branch[];
  currentBranch: string;
  permissions: { canReview: boolean; canCreate: boolean; fullAccess: boolean; branchOnly: boolean };
};
type CatalogueResult = { id: number; code: string; name: string; category: string; description: string };
type Tab = "dashboard" | "orders" | "history";
type StockDraft = {
  id: number;
  branch_workspace: string;
  order_date: string;
  required_date: string;
  priority: string;
  branch_notes: string;
  lines: StockLine[];
};

const today = () => {
  const parts = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const blankLine = (): StockLine => ({
  catalogue_product_id: 0,
  product_code: "",
  description: "",
  category: "",
  quantity_requested: 1,
  quantity_confirmed: 0,
  quantity_dispatched: 0,
  unit: "EA",
  branch_notes: "",
  warehouse_notes: "",
});
const blankDraft = (branch = ""): StockDraft => ({
  id: 0,
  branch_workspace: branch,
  order_date: today(),
  required_date: "",
  priority: "Normal",
  branch_notes: "",
  lines: [blankLine()],
});
const activeStatuses = ["Draft", "Returned", "Sent to Warehouse", "Under Review", "Confirmed", "Picking", "Ready for Dispatch", "Dispatched", "Part Fulfilled"];

function statusClass(status: string) {
  if (["Confirmed", "Ready for Dispatch", "Completed"].includes(status)) return "good";
  if (["Sent to Warehouse", "Under Review", "Picking", "Part Fulfilled"].includes(status)) return "warn";
  if (["Returned", "Cancelled"].includes(status)) return "bad";
  return "";
}

export default function StockOrdersWorkspace({ currentUser }: { currentUser: CurrentUser }) {
  const [data, setData] = useState<StockData>({
    orders: [], branches: [], currentBranch: "", permissions: { canReview: false, canCreate: true, fullAccess: false, branchOnly: false },
  });
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<StockDraft>(blankDraft());
  const [reviewOrder, setReviewOrder] = useState<StockOrder | null>(null);
  const [reviewLines, setReviewLines] = useState<StockLine[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewEta, setReviewEta] = useState("");
  const [dispatchReference, setDispatchReference] = useState("");
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [catalogueResults, setCatalogueResults] = useState<CatalogueResult[]>([]);
  const [catalogueBusy, setCatalogueBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stock-orders", { cache: "no-store" });
      const result = (await response.json()) as StockData & { error?: string };
      if (!response.ok) throw new Error(result.error || "Stock Orders could not be loaded.");
      setData(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock Orders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/stock-orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = (await response.json().catch(() => ({}))) as { error?: string; order?: StockOrder };
    if (!response.ok) throw new Error(result.error || "Stock order update failed.");
    return result;
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter((order) => `${order.stock_order_number} ${order.branch_workspace} ${order.status} ${order.requested_by_name}`.toLowerCase().includes(q));
  }, [data.orders, search]);

  const dashboard = useMemo(() => ({
    drafts: data.orders.filter((order) => order.status === "Draft").length,
    waiting: data.orders.filter((order) => ["Sent to Warehouse", "Under Review"].includes(order.status)).length,
    confirmed: data.orders.filter((order) => order.status === "Confirmed").length,
    fulfilment: data.orders.filter((order) => ["Picking", "Ready for Dispatch", "Dispatched", "Part Fulfilled"].includes(order.status)).length,
    completed: data.orders.filter((order) => order.status === "Completed").length,
  }), [data.orders]);

  const openNew = () => {
    setDraft(blankDraft(data.currentBranch || data.branches[0]?.name || ""));
    setCatalogueResults([]);
    setCatalogueSearch("");
    setEditorOpen(true);
  };
  const openEdit = (order: StockOrder) => {
    setDraft({
      id: order.id,
      branch_workspace: order.branch_workspace,
      order_date: order.order_date || today(),
      required_date: order.required_date || "",
      priority: order.priority || "Normal",
      branch_notes: order.branch_notes || "",
      lines: order.lines.length ? order.lines.map((line) => ({ ...line })) : [blankLine()],
    });
    setEditorOpen(true);
  };
  const openReview = (order: StockOrder) => {
    setReviewOrder(order);
    setReviewLines(order.lines.map((line) => ({ ...line, quantity_confirmed: data.permissions.canReview && ["Sent to Warehouse", "Under Review"].includes(order.status) && !Number(line.quantity_confirmed) ? Number(line.quantity_requested || 0) : Number(line.quantity_confirmed || 0) })));
    setReviewNotes(order.warehouse_notes || "");
    setReviewEta(order.expected_delivery_date || "");
    setDispatchReference(order.dispatch_reference || "");
  };

  const openOrder = (order: StockOrder) => {
    if (data.permissions.canReview) {
      if (order.status === "Draft") openEdit(order);
      else openReview(order);
      return;
    }
    if (["Draft", "Returned"].includes(order.status)) openEdit(order);
    else openReview(order);
  };

  const saveOrder = async (submit = false) => {
    if (!draft.branch_workspace || !draft.lines.some((line) => line.description.trim() && Number(line.quantity_requested) > 0)) {
      setMessage("Select the branch and add at least one product with a quantity.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await post({ action: "saveOrder", order: draft });
      if (submit && result.order?.id) await post({ action: "submitOrder", id: result.order.id });
      setEditorOpen(false);
      await load();
      setTab("orders");
      setMessage(submit ? "Stock order sent to the Head Office warehouse buyer." : "Stock order saved as draft.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock order could not be saved.");
    } finally { setBusy(false); }
  };

  const runAction = async (action: string, order: StockOrder, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setMessage("");
    try {
      await post({ action, id: order.id, ...extra });
      await load();
      setReviewOrder(null);
      setMessage("Stock order updated. The branch and warehouse now see the same status.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock order update failed.");
    } finally { setBusy(false); }
  };

  const confirmOrder = async () => {
    if (!reviewOrder) return;
    await runAction("confirmOrder", reviewOrder, {
      lines: reviewLines.map((line) => ({ id: line.id, quantity_confirmed: line.quantity_confirmed, warehouse_notes: line.warehouse_notes })),
      warehouse_notes: reviewNotes,
      expected_delivery_date: reviewEta,
    });
  };

  const searchCatalogue = async () => {
    const q = catalogueSearch.trim();
    if (!q) return setCatalogueResults([]);
    setCatalogueBusy(true);
    try {
      const response = await fetch(`/api/catalogue?q=${encodeURIComponent(q)}&page=1&pageSize=18`, { cache: "no-store" });
      const result = (await response.json()) as { products?: CatalogueResult[] };
      setCatalogueResults(result.products || []);
    } finally { setCatalogueBusy(false); }
  };
  const addCatalogueProduct = (product: CatalogueResult) => {
    setDraft((current) => ({
      ...current,
      lines: [
        ...current.lines.filter((line) => line.description.trim()),
        { ...blankLine(), catalogue_product_id: product.id, product_code: product.code, description: product.name, category: product.category || "" },
      ],
    }));
  };

  const exportOrders = (orders = data.orders, fileName = "PowerBuild_Stock_Orders.xlsx") => {
    downloadStockOrdersWorkbook({ orders, fileName });
  };

  const pendingForBuyer = data.orders.filter((order) => ["Sent to Warehouse", "Under Review"].includes(order.status));
  const activeOrders = filteredOrders.filter((order) => activeStatuses.includes(order.status));
  const historyOrders = filteredOrders.filter((order) => !["Draft"].includes(order.status));

  return (
    <section className="buyerWorkspace stockOrdersWorkspace">
      <div className="buyerHero stockOrdersHero">
        <div>
          <small>POWERBUILD INTERNAL REPLENISHMENT</small>
          <h2>Stock Orders</h2>
          <p>Branches build replenishment orders from Our Catalogue and send them directly to the Head Office warehouse buyer for confirmation, picking and dispatch.</p>
          <span className="buyerUserTag">Signed in: {currentUser.name || currentUser.email}</span>
        </div>
        <div className="buyerHeroActions">
          <button className="buyerSecondaryBtn" onClick={() => exportOrders()} disabled={loading}>⇩ Download Excel</button>
          {data.permissions.canCreate && <button className="buyerPrimaryBtn" onClick={openNew}>＋ New stock order</button>}
        </div>
      </div>

      {message && <div className="buyerNotice" role="status"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}

      <div className="buyerKpis">
        <article><small>DRAFTS</small><b>{dashboard.drafts}</b><span>Not sent yet</span></article>
        <article><small>AT WAREHOUSE</small><b>{dashboard.waiting}</b><span>Waiting for buyer</span></article>
        <article><small>CONFIRMED</small><b>{dashboard.confirmed}</b><span>Buyer confirmed</span></article>
        <article><small>IN FULFILMENT</small><b>{dashboard.fulfilment}</b><span>Picking / dispatch</span></article>
        <article><small>COMPLETED</small><b>{dashboard.completed}</b><span>Received / closed</span></article>
      </div>

      <nav className="buyerTabs" aria-label="Stock Order sections">
        {([['dashboard','Overview'],['orders','Stock Orders'],['history','Order History']] as Array<[Tab,string]>).map(([value,label]) => (
          <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>
        ))}
      </nav>

      {loading && <div className="buyerEmpty">Loading Stock Orders…</div>}

      {!loading && tab === "dashboard" && (
        <div className="buyerDashboardGrid">
          <section className="buyerPanel">
            <header><div><small>WAREHOUSE QUEUE</small><h3>{data.permissions.canReview ? "Branch orders awaiting buyer action" : "Orders sent to Head Office"}</h3></div><button onClick={() => setTab("orders")}>View all</button></header>
            <div className="buyerActionList">
              {(data.permissions.canReview ? pendingForBuyer : data.orders.filter((order) => ["Sent to Warehouse", "Under Review", "Confirmed"].includes(order.status))).slice(0,8).map((order) => (
                <button key={order.id} onClick={() => openOrder(order)}>
                  <span><b>{order.stock_order_number}</b><small>{order.branch_workspace} · {order.lines.length} line{order.lines.length === 1 ? "" : "s"}</small></span>
                  <em>{order.status}</em>
                </button>
              ))}
              {!data.orders.length && <p>No stock orders yet.</p>}
            </div>
          </section>
          <section className="buyerPanel">
            <header><div><small>PROCESS</small><h3>Branch → Warehouse → Branch</h3></div></header>
            <div className="stockFlowSteps">
              <span><b>1</b><strong>Branch creates order</strong><small>Browse catalogue and enter quantities.</small></span>
              <span><b>2</b><strong>Buyer confirms</strong><small>Confirmed quantities become visible to the branch.</small></span>
              <span><b>3</b><strong>Warehouse fulfils</strong><small>Picking, ready, dispatch and completion are tracked.</small></span>
            </div>
          </section>
          <section className="buyerPanel buyerPanelWide">
            <header><div><small>RECENT STOCK ORDERS</small><h3>Latest branch replenishment</h3></div><button onClick={() => setTab("orders")}>Open register</button></header>
            <StockOrderTable orders={data.orders.slice(0,8)} canReview={data.permissions.canReview} busy={busy} onOpen={openOrder} onExport={(order) => exportOrders([order], `${order.stock_order_number}.xlsx`)} onAction={runAction} compact />
          </section>
        </div>
      )}

      {!loading && tab === "orders" && (
        <section className="buyerPanel buyerPanelFull">
          <header className="buyerListHeader"><div><small>LIVE REGISTER</small><h3>Stock Orders</h3><p>Every submitted branch order remains visible to the buyer and full-company management.</p></div><div><label className="buyerSearch">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, branch, status…" /></label>{data.permissions.canCreate && <button className="buyerPrimaryBtn" onClick={openNew}>＋ New order</button>}</div></header>
          <StockOrderTable orders={activeOrders} canReview={data.permissions.canReview} busy={busy} onOpen={openOrder} onExport={(order) => exportOrders([order], `${order.stock_order_number}.xlsx`)} onAction={runAction} />
        </section>
      )}

      {!loading && tab === "history" && (
        <section className="buyerPanel buyerPanelFull">
          <header className="buyerListHeader"><div><small>PERMANENT ORDER FILE</small><h3>Order History</h3><p>Previous branch orders, buyer confirmations and dispatch status remain saved here.</p></div><div><label className="buyerSearch">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search history…" /></label><button onClick={() => exportOrders(historyOrders, "PowerBuild_Stock_Order_History.xlsx")}>⇩ Excel</button></div></header>
          <StockOrderTable orders={historyOrders} canReview={data.permissions.canReview} busy={busy} onOpen={openOrder} onExport={(order) => exportOrders([order], `${order.stock_order_number}.xlsx`)} onAction={runAction} />
        </section>
      )}

      {editorOpen && (
        <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
          <section className="buyerModal" role="dialog" aria-modal="true" aria-label="Stock order editor">
            <header><div><small>BRANCH STOCK REPLENISHMENT</small><h3>{draft.id ? "Edit Stock Order" : "New Stock Order"}</h3></div><button onClick={() => setEditorOpen(false)}>×</button></header>
            <div className="buyerModalScroll">
              <div className="buyerFormGrid">
                <label>Branch<select value={draft.branch_workspace} disabled={data.permissions.branchOnly || data.branches.length === 1} onChange={(event) => setDraft({ ...draft, branch_workspace: event.target.value })}><option value="">Select branch</option>{data.branches.map((branch) => <option key={branch.id} value={branch.name}>{branch.name}</option>)}</select></label>
                <label>Priority<select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label>
                <label>Order date<input type="date" value={draft.order_date} onChange={(event) => setDraft({ ...draft, order_date: event.target.value })} /></label>
                <label>Required date<input type="date" value={draft.required_date} onChange={(event) => setDraft({ ...draft, required_date: event.target.value })} /></label>
              </div>
              <div className="buyerCataloguePicker">
                <div><b>Browse from Our Catalogue</b><small>Search product code, description or category and add directly to the branch order.</small></div>
                <div><input value={catalogueSearch} onChange={(event) => setCatalogueSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchCatalogue(); } }} placeholder="Search Our Catalogue…" /><button onClick={() => void searchCatalogue()} disabled={catalogueBusy}>{catalogueBusy ? "Searching…" : "Search"}</button></div>
                {catalogueResults.length > 0 && <div className="buyerCatalogueResults">{catalogueResults.map((product) => <button key={product.id} onClick={() => addCatalogueProduct(product)}><span><b>{product.code}</b><small>{product.name}</small></span><em>＋ Add</em></button>)}</div>}
              </div>
              <div className="buyerOrderLinesHeader"><div><small>ORDER LINES</small><h4>Products & Requested Quantities</h4></div><button onClick={() => setDraft((current) => ({ ...current, lines: [...current.lines, blankLine()] }))}>＋ Add line</button></div>
              <div className="buyerLinesTableWrap"><table className="buyerLinesTable stockLinesTable"><thead><tr><th>Code / Product</th><th>Category</th><th>Qty Requested</th><th>Unit</th><th>Branch Notes</th><th></th></tr></thead><tbody>
                {draft.lines.map((line,index) => <tr key={`${index}-${line.product_code}`}>
                  <td data-label="Code / Product"><input value={line.product_code} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, product_code:event.target.value } : item) }))} placeholder="Code" /><textarea value={line.description} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, description:event.target.value } : item) }))} placeholder="Product description" /></td>
                  <td data-label="Category"><input value={line.category} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, category:event.target.value } : item) }))} /></td>
                  <td data-label="Qty Requested"><input type="number" min="0" step="0.01" value={line.quantity_requested} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, quantity_requested:Number(event.target.value) } : item) }))} /></td>
                  <td data-label="Unit"><input value={line.unit} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, unit:event.target.value } : item) }))} /></td>
                  <td data-label="Branch Notes"><textarea value={line.branch_notes} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item,i) => i===index ? { ...item, branch_notes:event.target.value } : item) }))} placeholder="Size, colour, pack or instruction" /></td>
                  <td data-label=""><button className="buyerRemoveLine" onClick={() => setDraft((current) => ({ ...current, lines: current.lines.filter((_,i) => i!==index) }))}>×</button></td>
                </tr>)}
              </tbody></table></div>
              <div className="buyerOrderBottom"><label>Branch order notes<textarea value={draft.branch_notes} onChange={(event) => setDraft({ ...draft, branch_notes:event.target.value })} placeholder="Reason for order, urgent stock-outs, promotion requirements or special instructions…" /></label><div className="stockOrderSummary"><small>TOTAL LINES</small><b>{draft.lines.filter((line) => line.description.trim() && Number(line.quantity_requested)>0).length}</b><span>Order is sent to Head Office warehouse after submission.</span></div></div>
            </div>
            <footer><button onClick={() => setEditorOpen(false)}>Cancel</button><button className="buyerSecondaryBtn" onClick={() => void saveOrder(false)} disabled={busy}>{busy ? "Saving…" : "Save Draft"}</button><button className="buyerPrimaryBtn" onClick={() => void saveOrder(true)} disabled={busy}>{busy ? "Sending…" : "Send to Warehouse Buyer"}</button></footer>
          </section>
        </div>
      )}

      {reviewOrder && (
        <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewOrder(null); }}>
          <section className="buyerModal" role="dialog" aria-modal="true" aria-label="Warehouse stock order review">
            <header><div><small>{reviewOrder.stock_order_number} · {reviewOrder.branch_workspace}</small><h3>{data.permissions.canReview ? "Warehouse Buyer Review" : "Stock Order Status"}</h3></div><button onClick={() => setReviewOrder(null)}>×</button></header>
            <div className="buyerModalScroll">
              <div className="stockOrderMeta"><span><small>STATUS</small><b>{reviewOrder.status}</b></span><span><small>REQUESTED BY</small><b>{reviewOrder.requested_by_name || reviewOrder.requested_by_email}</b></span><span><small>REQUIRED</small><b>{reviewOrder.required_date || "Not set"}</b></span><span><small>PRIORITY</small><b>{reviewOrder.priority}</b></span></div>
              <div className="buyerLinesTableWrap"><table className="buyerLinesTable stockReviewTable"><thead><tr><th>Product</th><th>Requested</th><th>Confirmed</th><th>Dispatched</th><th>Warehouse Notes</th></tr></thead><tbody>
                {reviewLines.map((line,index) => <tr key={line.id || index}><td><b>{line.product_code || "—"}</b><small>{line.description}</small></td><td><b>{line.quantity_requested}</b> {line.unit}</td><td>{data.permissions.canReview ? <input type="number" min="0" step="0.01" value={line.quantity_confirmed} onChange={(event) => setReviewLines((current) => current.map((item,i) => i===index ? { ...item, quantity_confirmed:Number(event.target.value) } : item))} /> : <b>{line.quantity_confirmed || "—"}</b>}</td><td>{data.permissions.canReview ? <input type="number" min="0" step="0.01" value={line.quantity_dispatched} onChange={(event) => setReviewLines((current) => current.map((item,i) => i===index ? { ...item, quantity_dispatched:Number(event.target.value) } : item))} /> : <b>{line.quantity_dispatched || "—"}</b>}</td><td>{data.permissions.canReview ? <textarea value={line.warehouse_notes || ""} onChange={(event) => setReviewLines((current) => current.map((item,i) => i===index ? { ...item, warehouse_notes:event.target.value } : item))} /> : (line.warehouse_notes || "—")}</td></tr>)}
              </tbody></table></div>
              <div className="buyerFormGrid stockReviewFields">
                <label className="buyerSpan2">Warehouse / buyer notes<textarea value={reviewNotes} readOnly={!data.permissions.canReview} onChange={(event) => setReviewNotes(event.target.value)} /></label>
                <label>Expected delivery / dispatch date<input type="date" value={reviewEta} readOnly={!data.permissions.canReview} onChange={(event) => setReviewEta(event.target.value)} /></label>
                <label>Dispatch reference<input value={dispatchReference} readOnly={!data.permissions.canReview} onChange={(event) => setDispatchReference(event.target.value)} /></label>
              </div>
            </div>
            <footer>
              <button onClick={() => setReviewOrder(null)}>Close</button>
              <button className="buyerSecondaryBtn" onClick={() => exportOrders([reviewOrder], `${reviewOrder.stock_order_number}.xlsx`)}>⇩ Excel</button>
              {data.permissions.canReview && ["Sent to Warehouse","Under Review"].includes(reviewOrder.status) && <><button className="buyerSecondaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Returned", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta })}>Return to Branch</button><button className="buyerPrimaryBtn" disabled={busy} onClick={() => void confirmOrder()}>{busy ? "Saving…" : "Confirm Order"}</button></>}
              {data.permissions.canReview && reviewOrder.status === "Confirmed" && <button className="buyerPrimaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Picking", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta, dispatch_reference: dispatchReference })}>Start Picking</button>}
              {data.permissions.canReview && reviewOrder.status === "Picking" && <button className="buyerPrimaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Ready for Dispatch", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta, dispatch_reference: dispatchReference })}>Mark Ready</button>}
              {data.permissions.canReview && ["Ready for Dispatch","Part Fulfilled"].includes(reviewOrder.status) && <>
                <button className="buyerSecondaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Part Fulfilled", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta, dispatch_reference: dispatchReference, lines: reviewLines.map((line) => ({ id: line.id, quantity_dispatched: line.quantity_dispatched, warehouse_notes: line.warehouse_notes })) })}>Save Part Fulfilled</button>
                <button className="buyerPrimaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Dispatched", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta, dispatch_reference: dispatchReference, lines: reviewLines.map((line) => ({ id: line.id, quantity_dispatched: line.quantity_dispatched, warehouse_notes: line.warehouse_notes })) })}>Mark Dispatched</button>
              </>}
              {data.permissions.canReview && reviewOrder.status === "Dispatched" && <button className="buyerPrimaryBtn" disabled={busy} onClick={() => void runAction("setStatus", reviewOrder, { status: "Completed", warehouse_notes: reviewNotes, expected_delivery_date: reviewEta, dispatch_reference: dispatchReference, lines: reviewLines.map((line) => ({ id: line.id, quantity_dispatched: line.quantity_dispatched, warehouse_notes: line.warehouse_notes })) })}>Complete Order</button>}
              {!data.permissions.canReview && reviewOrder.status === "Dispatched" && <button className="buyerPrimaryBtn" disabled={busy} onClick={() => void runAction("acknowledgeReceipt", reviewOrder)}>{busy ? "Saving…" : "Confirm Received"}</button>}
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

function StockOrderTable({ orders, canReview, busy, onOpen, onExport, onAction, compact = false }: {
  orders: StockOrder[];
  canReview: boolean;
  busy: boolean;
  onOpen: (order: StockOrder) => void;
  onExport: (order: StockOrder) => void;
  onAction: (action: string, order: StockOrder, extra?: Record<string, unknown>) => Promise<void>;
  compact?: boolean;
}) {
  return <div className="buyerTableWrap"><table className="buyerTable stockOrdersTable"><thead><tr><th>Stock Order</th><th>Branch</th><th>Dates</th><th>Priority</th><th>Status</th><th>Lines</th>{!compact && <th>Buyer / Dispatch</th>}<th>Actions</th></tr></thead><tbody>
    {orders.map((order) => <tr key={order.id}>
      <td><b>{order.stock_order_number}</b><small>{order.requested_by_name || order.requested_by_email}</small></td>
      <td><b>{order.branch_workspace}</b><small>{order.branch_notes || "Branch replenishment"}</small></td>
      <td>{order.order_date || "—"}<small>Required: {order.required_date || "—"}</small></td>
      <td><span className={`buyerPill ${order.priority === "Urgent" ? "bad" : order.priority === "High" ? "warn" : ""}`}>{order.priority}</span></td>
      <td><span className={`buyerPill ${statusClass(order.status)}`}>{order.status}</span><small>{order.expected_delivery_date ? `ETA ${order.expected_delivery_date}` : ""}</small></td>
      <td><b>{order.lines.length}</b><small>{order.lines.reduce((sum,line) => sum + Number(line.quantity_requested || 0),0)} units requested</small></td>
      {!compact && <td>{order.buyer_name || "—"}<small>{order.dispatch_reference || order.warehouse_notes || "No dispatch reference"}</small></td>}
      <td><div className="buyerRowActions"><button onClick={() => onOpen(order)}>{canReview && order.status !== "Draft" ? "Review" : "Open"}</button><button onClick={() => onExport(order)}>Excel</button>{!canReview && ["Draft","Returned"].includes(order.status) && <button className="approve" disabled={busy} onClick={() => void onAction("submitOrder", order)}>Send</button>}{canReview && order.status === "Sent to Warehouse" && <button className="approve" disabled={busy} onClick={() => void onAction("markReview", order)}>Review</button>}</div></td>
    </tr>)}
    {!orders.length && <tr><td colSpan={8}>No stock orders found.</td></tr>}
  </tbody></table></div>;
}
