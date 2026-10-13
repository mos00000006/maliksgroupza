"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { downloadBuyerWorkbook } from "./buyer-excel";

type CurrentUser = { name: string; email: string; role?: string };
type BuyerLine = {
  id?: number;
  product_code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  pack_size: string;
  last_cost_ex_vat: number;
  unit_cost_ex_vat: number;
  price_variance_pct: number;
  line_total_ex_vat: number;
  notes: string;
};
type BuyerOrder = {
  id: number;
  po_number: string;
  buyer_email: string;
  buyer_name: string;
  store_workspace: string;
  supplier_id: number;
  supplier_name: string;
  order_type: string;
  order_date: string;
  required_date: string;
  quote_reference: string;
  delivery_method: string;
  delivery_address: string;
  delivery_contact: string;
  status: string;
  approval_status: string;
  approved_by: string;
  approved_at: string;
  delivery_status: string;
  expected_delivery_date: string;
  grv_number: string;
  invoice_number: string;
  receiving_notes: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes: string;
  last_sent_at: string;
  last_sent_channel: string;
  last_sent_to: string;
  updated_at: string;
  lines: BuyerLine[];
};
type Supplier = {
  id: number;
  supplier_code: string;
  name: string;
  supplier_type: string;
  contact_person: string;
  phone: string;
  whatsapp_number: string;
  email: string;
  payment_terms: string;
  lead_time_days: number;
  minimum_order: number;
  categories: string[];
  notes: string;
};
type Quote = {
  id: number;
  buyer_email: string;
  product_code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  supplier_id: number;
  supplier_name: string;
  quote_reference: string;
  quoted_unit_cost: number;
  valid_until: string;
  lead_time_days: number;
  payment_terms: string;
  selected: number;
  notes: string;
};
type SendHistory = {
  id: number;
  order_id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  channel: string;
  recipient: string;
  sent_by_email: string;
  sent_by_name: string;
  sent_at: string;
  notes: string;
};
type BranchStockLine = {
  id?: number;
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
type BranchStockOrder = {
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
  lines: BranchStockLine[];
};
type StockOrdersPayload = {
  orders?: BranchStockOrder[];
  error?: string;
};
type Workspace = { id: number; name: string; type: string; region: string; manager: string };
type CatalogueResult = { id: number; code: string; name: string; category: string; description: string };
type BuyerData = {
  orders: BuyerOrder[];
  suppliers: Supplier[];
  quotes: Quote[];
  sendHistory: SendHistory[];
  workspaces: Workspace[];
  permissions: { canApprove: boolean; canManage: boolean; buyerOnly: boolean };
};
type Tab = "dashboard" | "branch-orders" | "orders" | "suppliers" | "quotes" | "receiving" | "history";

type OrderDraft = {
  id: number;
  supplier_id: number;
  supplier_name: string;
  store_workspace: string;
  order_type: string;
  order_date: string;
  required_date: string;
  quote_reference: string;
  delivery_method: string;
  delivery_address: string;
  delivery_contact: string;
  vat_rate: number;
  notes: string;
  lines: BuyerLine[];
};

type SupplierDraft = Omit<Supplier, "id"> & { id: number };
type QuoteDraft = Omit<Quote, "buyer_email">;

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" });
const today = () => {
  const parts = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const calculateLine = (line: BuyerLine): BuyerLine => {
  const quantity = Number(line.quantity || 0);
  const cost = Number(line.unit_cost_ex_vat || 0);
  const last = Number(line.last_cost_ex_vat || 0);
  return {
    ...line,
    price_variance_pct: last > 0 ? ((cost - last) / last) * 100 : 0,
    line_total_ex_vat: quantity * cost,
  };
};

const blankLine = (): BuyerLine => ({
  product_code: "",
  description: "",
  category: "",
  quantity: 1,
  unit: "EA",
  pack_size: "",
  last_cost_ex_vat: 0,
  unit_cost_ex_vat: 0,
  price_variance_pct: 0,
  line_total_ex_vat: 0,
  notes: "",
});
const blankOrder = (): OrderDraft => ({
  id: 0,
  supplier_id: 0,
  supplier_name: "",
  store_workspace: "",
  order_type: "Stock Replenishment",
  order_date: today(),
  required_date: "",
  quote_reference: "",
  delivery_method: "Supplier Delivery",
  delivery_address: "",
  delivery_contact: "",
  vat_rate: 15,
  notes: "",
  lines: [blankLine()],
});
const blankSupplier = (): SupplierDraft => ({
  id: 0,
  supplier_code: "",
  name: "",
  supplier_type: "Preferred",
  contact_person: "",
  phone: "",
  whatsapp_number: "",
  email: "",
  payment_terms: "",
  lead_time_days: 0,
  minimum_order: 0,
  categories: [],
  notes: "",
});
const blankQuote = (): QuoteDraft => ({
  id: 0,
  product_code: "",
  description: "",
  category: "",
  quantity: 1,
  unit: "EA",
  supplier_id: 0,
  supplier_name: "",
  quote_reference: "",
  quoted_unit_cost: 0,
  valid_until: "",
  lead_time_days: 0,
  payment_terms: "",
  selected: 0,
  notes: "",
});

const normaliseWhatsAppNumber = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) digits = `27${digits.slice(1)}`;
  return digits;
};
const supplierOrderMessage = (order: BuyerOrder) => {
  const lines = order.lines.map((line) => `• ${line.product_code ? `${line.product_code} - ` : ""}${line.description} | Qty ${line.quantity} ${line.unit || "EA"}`).join("\n");
  return `Good day ${order.supplier_name},\n\nPlease find PowerBuild purchase order ${order.po_number}.\nRequired date: ${order.required_date || "As agreed"}\nDelivery: ${order.delivery_method}${order.delivery_address ? ` - ${order.delivery_address}` : ""}\nTotal incl VAT: ${money.format(Number(order.total || 0))}\n\n${lines}\n\nThe Excel purchase order has been downloaded from our Hub for attachment.\nRegards,\nPowerBuild Buying`;
};

export default function BuyerWorkspace({ currentUser, onNavigate }: { currentUser: CurrentUser; onNavigate?: (view: string) => void }) {
  const [data, setData] = useState<BuyerData>({
    orders: [], suppliers: [], quotes: [], sendHistory: [], workspaces: [], permissions: { canApprove: false, canManage: true, buyerOnly: true },
  });
  const [branchOrders, setBranchOrders] = useState<BranchStockOrder[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(blankOrder());
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierDraft>(blankSupplier());
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>(blankQuote());
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [catalogueResults, setCatalogueResults] = useState<CatalogueResult[]>([]);
  const [catalogueBusy, setCatalogueBusy] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<BuyerOrder | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [buyerResponse, stockResponse] = await Promise.all([
        fetch("/api/buyer", { cache: "no-store" }),
        fetch("/api/stock-orders", { cache: "no-store" }),
      ]);
      const result = (await buyerResponse.json()) as BuyerData & { error?: string };
      if (!buyerResponse.ok) throw new Error(result.error || "Buyer Workspace could not be loaded.");
      setData(result);

      const stockResult = (await stockResponse.json().catch(() => ({}))) as StockOrdersPayload;
      if (stockResponse.ok) setBranchOrders(stockResult.orders || []);
      else setBranchOrders([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Buyer Workspace could not be loaded.");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const starter = window.setTimeout(() => { void load(true); }, 0);
    const refresh = window.setInterval(() => { void load(false); }, 15000);
    return () => {
      window.clearTimeout(starter);
      window.clearInterval(refresh);
    };
  }, [load]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/buyer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string; order?: BuyerOrder };
    if (!response.ok) throw new Error(result.error || "Buyer Workspace update failed.");
    return result;
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter((order) => `${order.po_number} ${order.supplier_name} ${order.store_workspace} ${order.status} ${order.quote_reference}`.toLowerCase().includes(q));
  }, [data.orders, search]);

  const filteredBranchOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branchOrders;
    return branchOrders.filter((order) => `${order.stock_order_number} ${order.branch_workspace} ${order.requested_by_name} ${order.requested_by_email} ${order.status} ${order.priority}`.toLowerCase().includes(q));
  }, [branchOrders, search]);

  const branchQueue = useMemo(
    () => branchOrders.filter((order) => ["Sent to Warehouse", "Under Review"].includes(order.status)),
    [branchOrders],
  );

  const dashboard = useMemo(() => {
    const pending = data.orders.filter((order) => order.approval_status === "Pending approval").length;
    const open = data.orders.filter((order) => !["Received", "Cancelled"].includes(order.status)).length;
    const awaiting = data.orders.filter((order) => ["Awaiting delivery", "Part received"].includes(order.delivery_status)).length;
    const spend = data.orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0);
    const overdue = data.orders.filter((order) => order.required_date && order.required_date < today() && !["Received", "Cancelled"].includes(order.status)).length;
    return { pending, open, awaiting, spend, overdue, branchQueue: branchQueue.length };
  }, [branchQueue.length, data.orders]);

  const orderTotals = useMemo(() => {
    const subtotal = orderDraft.lines.reduce((sum, line) => sum + calculateLine(line).line_total_ex_vat, 0);
    const vat = subtotal * (Number(orderDraft.vat_rate || 0) / 100);
    return { subtotal, vat, total: subtotal + vat };
  }, [orderDraft]);

  const openNewOrder = () => {
    setOrderDraft(blankOrder());
    setCatalogueSearch("");
    setCatalogueResults([]);
    setOrderOpen(true);
  };

  const openEditOrder = (order: BuyerOrder) => {
    setOrderDraft({
      id: order.id,
      supplier_id: Number(order.supplier_id || 0),
      supplier_name: order.supplier_name || "",
      store_workspace: order.store_workspace || "",
      order_type: order.order_type || "Stock Replenishment",
      order_date: order.order_date || today(),
      required_date: order.required_date || "",
      quote_reference: order.quote_reference || "",
      delivery_method: order.delivery_method || "Supplier Delivery",
      delivery_address: order.delivery_address || "",
      delivery_contact: order.delivery_contact || "",
      vat_rate: Number(order.vat_rate || 15),
      notes: order.notes || "",
      lines: order.lines.length ? order.lines.map((line) => calculateLine({ ...line })) : [blankLine()],
    });
    setOrderOpen(true);
  };

  const saveOrder = async (submit = false) => {
    if (!orderDraft.supplier_id || !orderDraft.store_workspace || !orderDraft.lines.some((line) => line.description.trim() && Number(line.quantity) > 0)) {
      setMessage("Select a supplier and store, then add at least one valid order line.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await post({ action: "saveOrder", order: { ...orderDraft, lines: orderDraft.lines.map(calculateLine) } });
      if (submit && result.order?.id) await post({ action: "submitOrder", id: result.order.id });
      setOrderOpen(false);
      await load();
      setTab("orders");
      setMessage(submit ? "Purchase order saved and submitted for approval." : "Purchase order saved as draft.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase order could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const updateOrderAction = async (action: string, id: number, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setMessage("");
    try {
      await post({ action, id, ...extra });
      await load();
      setMessage("Purchase order updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Purchase order update failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveSupplier = async () => {
    if (!supplierDraft.name.trim()) return setMessage("Supplier name is required.");
    setBusy(true);
    try {
      await post({ action: "saveSupplier", supplier: supplierDraft });
      setSupplierOpen(false);
      await load();
      setTab("suppliers");
      setMessage("Supplier saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supplier could not be saved.");
    } finally { setBusy(false); }
  };

  const saveQuote = async () => {
    if (!quoteDraft.description.trim() || !quoteDraft.supplier_id) return setMessage("Choose a supplier and enter the item being quoted.");
    setBusy(true);
    try {
      await post({ action: "saveQuote", quote: quoteDraft });
      setQuoteOpen(false);
      await load();
      setTab("quotes");
      setMessage("Supplier quote saved for comparison.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Quote could not be saved.");
    } finally { setBusy(false); }
  };

  const searchCatalogue = async () => {
    const q = catalogueSearch.trim();
    if (!q) return setCatalogueResults([]);
    setCatalogueBusy(true);
    try {
      const response = await fetch(`/api/catalogue?q=${encodeURIComponent(q)}&page=1&pageSize=12`, { cache: "no-store" });
      const result = (await response.json()) as { products?: CatalogueResult[] };
      setCatalogueResults(result.products || []);
    } finally { setCatalogueBusy(false); }
  };

  const addCatalogueProduct = (product: CatalogueResult) => {
    setOrderDraft((current) => ({
      ...current,
      lines: [
        ...current.lines.filter((line) => line.description.trim()),
        { ...blankLine(), product_code: product.code, description: product.name, category: product.category || "" },
      ],
    }));
  };

  const exportWorkbook = (orders = data.orders, name = "PowerBuild_Buyer_Workspace.xlsx") => {
    const poNumbers = new Set(orders.map((order) => order.po_number));
    downloadBuyerWorkbook({ orders, suppliers: data.suppliers, quotes: data.quotes, sendHistory: data.sendHistory.filter((item) => poNumbers.has(item.po_number)), fileName: name });
  };

  const sendSupplierOrder = async (order: BuyerOrder, channel: "WhatsApp" | "Email") => {
    const supplier = data.suppliers.find((item) => item.id === Number(order.supplier_id));
    if (!supplier) return setMessage("Supplier details are missing for this purchase order.");
    const recipient = channel === "WhatsApp" ? (supplier.whatsapp_number || supplier.phone) : supplier.email;
    if (!recipient.trim()) return setMessage(`Add the supplier ${channel === "WhatsApp" ? "WhatsApp number" : "email address"} before sending.`);
    const messageText = supplierOrderMessage(order);
    const whatsappNumber = channel === "WhatsApp" ? normaliseWhatsAppNumber(recipient) : "";
    if (channel === "WhatsApp" && whatsappNumber.length < 8) return setMessage("Enter a valid supplier WhatsApp number first.");
    const popup = channel === "WhatsApp" ? window.open("about:blank", "_blank") : null;
    exportWorkbook([order], `${order.po_number}.xlsx`);
    setBusy(true);
    try {
      await post({ action: "recordOrderSend", id: order.id, channel, recipient, notes: "Excel purchase order downloaded for attachment." });
      if (channel === "WhatsApp") {
        const url = `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(messageText)}`;
        if (popup) popup.location.href = url;
        else window.location.href = url;
      } else {
        const subject = `PowerBuild Purchase Order ${order.po_number}`;
        window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
      }
      await load();
      setTab("history");
      setMessage(`${order.po_number} recorded as sent by ${channel}. The Excel order sheet was downloaded for attachment.`);
    } catch (error) {
      popup?.close();
      setMessage(error instanceof Error ? error.message : "Supplier order could not be sent.");
    } finally { setBusy(false); }
  };

  const supplierName = (id: number) => data.suppliers.find((supplier) => supplier.id === id)?.name || "";
  const editSupplier = (supplier: Supplier) => { setSupplierDraft({ ...supplier }); setSupplierOpen(true); };
  const editQuote = (quote: Quote) => { const { buyer_email: _buyerEmail, ...draft } = quote; void _buyerEmail; setQuoteDraft(draft); setQuoteOpen(true); };

  return (
    <section className="buyerWorkspace">
      <div className="buyerHero">
        <div>
          <small>POWERBUILD PROCUREMENT CONTROL</small>
          <h2>Buyer Workspace</h2>
          <p>Control supplier purchase orders and receive live stock requests from every branch, with confirmed quantities flowing back to the stores.</p>
          <span className="buyerUserTag">Signed in buyer: {currentUser.name || currentUser.email}</span>
        </div>
        <div className="buyerHeroActions">
          <button className="buyerSecondaryBtn" onClick={() => exportWorkbook()} disabled={loading}>⇩ Download Excel</button>
          <button className="buyerPrimaryBtn" onClick={openNewOrder}>＋ New purchase order</button>
        </div>
      </div>

      {message && <div className="buyerNotice" role="status"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}

      <div className="buyerKpis">
        <article><small>OPEN ORDERS</small><b>{dashboard.open}</b><span>Active purchase orders</span></article>
        <article><small>PENDING APPROVAL</small><b>{dashboard.pending}</b><span>Waiting for management</span></article>
        <article><small>AWAITING DELIVERY</small><b>{dashboard.awaiting}</b><span>Ordered / part received</span></article>
        <article><small>OVERDUE</small><b className={dashboard.overdue ? "buyerDangerText" : ""}>{dashboard.overdue}</b><span>Past required date</span></article>
        <article><small>BRANCH QUEUE</small><b className={dashboard.branchQueue ? "buyerDangerText" : ""}>{dashboard.branchQueue}</b><span>Waiting for warehouse buyer</span></article>
        <article><small>TOTAL ORDER VALUE</small><b>{money.format(dashboard.spend)}</b><span>Excludes cancelled orders</span></article>
      </div>

      <nav className="buyerTabs" aria-label="Buyer Workspace sections">
        {([
          ["dashboard", "Overview"], ["branch-orders", `Branch Orders${branchQueue.length ? ` (${branchQueue.length})` : ""}`], ["orders", "Purchase Orders"], ["suppliers", "Suppliers"], ["quotes", "Quote Comparison"], ["receiving", "Receiving / Follow-up"], ["history", "Sent History"],
        ] as Array<[Tab, string]>).map(([value, label]) => (
          <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>
        ))}
      </nav>

      {loading ? <div className="buyerEmpty">Loading Buyer Workspace…</div> : null}

      {!loading && tab === "dashboard" && (
        <div className="buyerDashboardGrid">
          <section className="buyerPanel buyerPanelWide">
            <header><div><small>BRANCH → HEAD OFFICE WAREHOUSE</small><h3>Incoming Branch Stock Orders</h3></div><button onClick={() => setTab("branch-orders")}>View branch orders</button></header>
            <div className="buyerActionList">
              {(branchQueue.length ? branchQueue : branchOrders.filter((order) => order.status !== "Completed")).slice(0, 8).map((order) => (
                <button key={order.id} onClick={() => setTab("branch-orders")}>
                  <span><b>{order.stock_order_number}</b><small>{order.branch_workspace} · {order.lines.length} line{order.lines.length === 1 ? "" : "s"} · {order.requested_by_name || order.requested_by_email}</small></span>
                  <em>{order.status === "Draft" ? "Draft — not sent" : order.status}</em>
                </button>
              ))}
              {!branchOrders.length && <p>No branch stock orders have been created yet.</p>}
            </div>
          </section>
          <section className="buyerPanel">
            <header><div><small>CONTROL QUEUE</small><h3>Orders needing attention</h3></div><button onClick={() => setTab("orders")}>View all</button></header>
            <div className="buyerActionList">
              {data.orders.filter((order) => order.approval_status === "Pending approval" || (order.required_date && order.required_date < today() && !["Received", "Cancelled"].includes(order.status))).slice(0, 8).map((order) => (
                <button key={order.id} onClick={() => openEditOrder(order)}>
                  <span><b>{order.po_number}</b><small>{order.supplier_name} · {order.store_workspace}</small></span>
                  <em>{order.approval_status === "Pending approval" ? "Approval" : "Overdue"}</em>
                </button>
              ))}
              {!data.orders.length && <p>No purchase orders yet. Create the first PO.</p>}
            </div>
          </section>
          <section className="buyerPanel">
            <header><div><small>SUPPLIER CONTROL</small><h3>Preferred supplier register</h3></div><button onClick={() => { setSupplierDraft(blankSupplier()); setSupplierOpen(true); }}>＋ Add</button></header>
            <div className="buyerSupplierMini">
              {data.suppliers.slice(0, 7).map((supplier) => (
                <button key={supplier.id} onClick={() => editSupplier(supplier)}><span><b>{supplier.name}</b><small>{supplier.payment_terms || "Terms not captured"}</small></span><em>{supplier.supplier_type}</em></button>
              ))}
              {!data.suppliers.length && <p>Add your preferred and secondary suppliers.</p>}
            </div>
          </section>
          <section className="buyerPanel buyerPanelWide">
            <header><div><small>RECENT BUYING</small><h3>Latest purchase orders</h3></div><button onClick={() => setTab("orders")}>Purchase orders</button></header>
            <OrderTable orders={data.orders.slice(0, 8)} onEdit={openEditOrder} onExport={(order) => exportWorkbook([order], `${order.po_number}.xlsx`)} canApprove={data.permissions.canApprove} onAction={updateOrderAction} busy={busy} suppliers={data.suppliers} onSend={sendSupplierOrder} compact />
          </section>
        </div>
      )}

      {!loading && tab === "branch-orders" && (
        <section className="buyerPanel buyerPanelFull">
          <header className="buyerListHeader">
            <div><small>HEAD OFFICE WAREHOUSE QUEUE</small><h3>Branch Stock Orders</h3><p>Orders created by branches appear here automatically. Submitted orders are ready for buyer review and confirmation.</p></div>
            <div><label className="buyerSearch">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, branch, status…" /></label><button className="buyerPrimaryBtn" onClick={() => onNavigate?.("Stock Orders")}>Open Stock Orders</button></div>
          </header>
          <BranchOrderTable orders={filteredBranchOrders} onOpen={() => onNavigate?.("Stock Orders")} />
        </section>
      )}

      {!loading && tab === "orders" && (
        <section className="buyerPanel buyerPanelFull">
          <header className="buyerListHeader">
            <div><small>PURCHASE ORDER REGISTER</small><h3>Purchase Orders</h3></div>
            <div><label className="buyerSearch">⌕ <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search PO, supplier, store…" /></label><button className="buyerPrimaryBtn" onClick={openNewOrder}>＋ New PO</button></div>
          </header>
          <OrderTable orders={filteredOrders} onEdit={openEditOrder} onExport={(order) => exportWorkbook([order], `${order.po_number}.xlsx`)} canApprove={data.permissions.canApprove} onAction={updateOrderAction} busy={busy} suppliers={data.suppliers} onSend={sendSupplierOrder} />
        </section>
      )}

      {!loading && tab === "suppliers" && (
        <section className="buyerPanel buyerPanelFull">
          <header><div><small>SUPPLIER MASTER</small><h3>Preferred & Secondary Suppliers</h3></div><button className="buyerPrimaryBtn" onClick={() => { setSupplierDraft(blankSupplier()); setSupplierOpen(true); }}>＋ Add supplier</button></header>
          <div className="buyerTableWrap"><table className="buyerTable"><thead><tr><th>Code</th><th>Supplier</th><th>Type</th><th>Contact</th><th>Payment terms</th><th>Lead time</th><th>Min order</th><th></th></tr></thead><tbody>
            {data.suppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.supplier_code || "—"}</td><td><b>{supplier.name}</b><small>{supplier.categories.join(", ") || "All categories"}</small></td><td><span className={`buyerPill ${supplier.supplier_type === "Preferred" ? "good" : ""}`}>{supplier.supplier_type}</span></td><td>{supplier.contact_person || "—"}<small>{supplier.whatsapp_number ? `WhatsApp ${supplier.whatsapp_number}` : supplier.phone || supplier.email}</small></td><td>{supplier.payment_terms || "—"}</td><td>{supplier.lead_time_days ? `${supplier.lead_time_days} days` : "—"}</td><td>{supplier.minimum_order ? money.format(supplier.minimum_order) : "—"}</td><td><button className="buyerTextBtn" onClick={() => editSupplier(supplier)}>Edit</button></td></tr>)}
            {!data.suppliers.length && <tr><td colSpan={8}>No suppliers added yet.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {!loading && tab === "quotes" && (
        <section className="buyerPanel buyerPanelFull">
          <header><div><small>PRICE CONTROL</small><h3>Supplier Quote Comparison</h3><p>Capture competing supplier costs before placing an order.</p></div><button className="buyerPrimaryBtn" onClick={() => { setQuoteDraft(blankQuote()); setQuoteOpen(true); }}>＋ Add quote</button></header>
          <div className="buyerTableWrap"><table className="buyerTable"><thead><tr><th>Item</th><th>Supplier</th><th>Quote ref</th><th>Unit cost</th><th>Lead time</th><th>Valid until</th><th>Selected</th><th></th></tr></thead><tbody>
            {data.quotes.map((quote) => <tr key={quote.id}><td><b>{quote.product_code || quote.description}</b><small>{quote.product_code ? quote.description : quote.category}</small></td><td>{quote.supplier_name}</td><td>{quote.quote_reference || "—"}</td><td><b>{money.format(Number(quote.quoted_unit_cost || 0))}</b></td><td>{quote.lead_time_days ? `${quote.lead_time_days} days` : "—"}</td><td>{quote.valid_until || "—"}</td><td>{quote.selected ? <span className="buyerPill good">SELECTED</span> : "—"}</td><td><button className="buyerTextBtn" onClick={() => editQuote(quote)}>Edit</button></td></tr>)}
            {!data.quotes.length && <tr><td colSpan={8}>No supplier quotes captured yet.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {!loading && tab === "receiving" && (
        <section className="buyerPanel buyerPanelFull">
          <header><div><small>ORDER FOLLOW-THROUGH</small><h3>Receiving / Delivery Tracker</h3><p>Follow approved orders through delivery, invoice and GRV.</p></div></header>
          <div className="buyerReceivingGrid">
            {data.orders.filter((order) => ["Approved", "Ordered", "Part Received", "Received"].includes(order.status)).map((order) => (
              <article key={order.id} className="buyerReceivingCard">
                <header><span><small>{order.po_number}</small><b>{order.supplier_name}</b></span><em>{order.delivery_status}</em></header>
                <dl><div><dt>Store</dt><dd>{order.store_workspace}</dd></div><div><dt>Required</dt><dd>{order.required_date || "—"}</dd></div><div><dt>Expected</dt><dd>{order.expected_delivery_date || "—"}</dd></div><div><dt>Total</dt><dd>{money.format(Number(order.total || 0))}</dd></div><div><dt>GRV</dt><dd>{order.grv_number || "—"}</dd></div><div><dt>Invoice</dt><dd>{order.invoice_number || "—"}</dd></div></dl>
                <button onClick={() => setReceivingOrder(order)}>Update receiving</button>
              </article>
            ))}
            {!data.orders.some((order) => ["Approved", "Ordered", "Part Received", "Received"].includes(order.status)) && <div className="buyerEmpty">Approved and ordered POs will appear here.</div>}
          </div>
        </section>
      )}

      {!loading && tab === "history" && (
        <section className="buyerPanel buyerPanelFull">
          <header className="buyerListHeader"><div><small>SUPPLIER ORDER FILE</small><h3>Sent Order History</h3><p>Every WhatsApp or email hand-off is recorded against the purchase order.</p></div><button className="buyerSecondaryBtn" onClick={() => exportWorkbook()}>⇩ Full buying file</button></header>
          <div className="buyerTableWrap"><table className="buyerTable"><thead><tr><th>PO Number</th><th>Supplier</th><th>Channel</th><th>Recipient</th><th>Sent by</th><th>Date / Time</th><th>Order</th></tr></thead><tbody>
            {data.sendHistory.map((item) => { const order = data.orders.find((entry) => entry.id === Number(item.order_id)); return <tr key={item.id}><td><b>{item.po_number}</b></td><td>{item.supplier_name}</td><td><span className="buyerPill good">{item.channel}</span></td><td>{item.recipient}</td><td>{item.sent_by_name || item.sent_by_email}</td><td>{item.sent_at ? new Date(item.sent_at).toLocaleString("en-ZA") : "—"}</td><td>{order ? <div className="buyerRowActions"><button onClick={() => openEditOrder(order)}>Open</button><button onClick={() => exportWorkbook([order], `${order.po_number}.xlsx`)}>Excel</button></div> : "—"}</td></tr>; })}
            {!data.sendHistory.length && <tr><td colSpan={7}>No supplier orders have been sent from the Hub yet.</td></tr>}
          </tbody></table></div>
        </section>
      )}

      {orderOpen && (
        <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderOpen(false); }}>
          <section className="buyerModal buyerOrderModal" role="dialog" aria-modal="true" aria-label="Purchase order editor">
            <header><div><small>{orderDraft.id ? "EDIT PURCHASE ORDER" : "NEW PURCHASE ORDER"}</small><h3>{orderDraft.id ? data.orders.find((order) => order.id === orderDraft.id)?.po_number || "Purchase Order" : "Create Purchase Order"}</h3></div><button onClick={() => setOrderOpen(false)}>×</button></header>
            <div className="buyerModalScroll">
              <div className="buyerFormGrid">
                <label>Supplier<select value={orderDraft.supplier_id} onChange={(event) => setOrderDraft({ ...orderDraft, supplier_id: Number(event.target.value), supplier_name: supplierName(Number(event.target.value)) })}><option value={0}>Select supplier</option>{data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} · {supplier.supplier_type}</option>)}</select></label>
                <label>Store / Branch<select value={orderDraft.store_workspace} onChange={(event) => setOrderDraft({ ...orderDraft, store_workspace: event.target.value })}><option value="">Select store / division</option>{data.workspaces.map((workspace) => <option key={workspace.id}>{workspace.name}</option>)}</select></label>
                <label>Order type<select value={orderDraft.order_type} onChange={(event) => setOrderDraft({ ...orderDraft, order_type: event.target.value })}><option>Stock Replenishment</option><option>Promotion Buy</option><option>Direct Delivery</option><option>Special Customer Order</option><option>New Store</option><option>Project / Development</option></select></label>
                <label>Order date<input type="date" value={orderDraft.order_date} onChange={(event) => setOrderDraft({ ...orderDraft, order_date: event.target.value })} /></label>
                <label>Required date<input type="date" value={orderDraft.required_date} onChange={(event) => setOrderDraft({ ...orderDraft, required_date: event.target.value })} /></label>
                <label>Supplier quote ref<input value={orderDraft.quote_reference} onChange={(event) => setOrderDraft({ ...orderDraft, quote_reference: event.target.value })} placeholder="Quote / pro forma number" /></label>
                <label>Delivery method<select value={orderDraft.delivery_method} onChange={(event) => setOrderDraft({ ...orderDraft, delivery_method: event.target.value })}><option>Supplier Delivery</option><option>Collection</option><option>Direct Delivery</option><option>DC / Internal Transfer</option></select></label>
                <label>VAT %<input type="number" min="0" step="0.1" value={orderDraft.vat_rate} onChange={(event) => setOrderDraft({ ...orderDraft, vat_rate: Number(event.target.value) })} /></label>
                <label className="buyerSpan2">Delivery address / instructions<input value={orderDraft.delivery_address} onChange={(event) => setOrderDraft({ ...orderDraft, delivery_address: event.target.value })} placeholder="Store address, direct-delivery address or collection instruction" /></label>
              </div>

              <div className="buyerCataloguePicker">
                <div><b>Add from Our Catalogue</b><small>Search by product code, description or category.</small></div>
                <div><input value={catalogueSearch} onChange={(event) => setCatalogueSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchCatalogue(); } }} placeholder="Search catalogue…" /><button onClick={() => void searchCatalogue()} disabled={catalogueBusy}>{catalogueBusy ? "Searching…" : "Search"}</button></div>
                {catalogueResults.length > 0 && <div className="buyerCatalogueResults">{catalogueResults.map((product) => <button key={product.id} onClick={() => addCatalogueProduct(product)}><span><b>{product.code}</b><small>{product.name}</small></span><em>＋ Add</em></button>)}</div>}
              </div>

              <div className="buyerOrderLinesHeader"><div><small>ORDER LINES</small><h4>Products & Costing</h4></div><button onClick={() => setOrderDraft((current) => ({ ...current, lines: [...current.lines, blankLine()] }))}>＋ Add line</button></div>
              <div className="buyerLinesTableWrap"><table className="buyerLinesTable"><thead><tr><th>Code / Product</th><th>Category</th><th>Qty</th><th>Unit</th><th>Pack</th><th>Last cost</th><th>New cost</th><th>Variance</th><th>Line total</th><th></th></tr></thead><tbody>
                {orderDraft.lines.map((line, index) => {
                  const calculated = calculateLine(line);
                  return <tr key={`${index}-${line.product_code}`}>
                    <td><input value={line.product_code} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, product_code: event.target.value } : item) }))} placeholder="Code" /><textarea value={line.description} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, description: event.target.value } : item) }))} placeholder="Product description" /></td>
                    <td><input value={line.category} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, category: event.target.value } : item) }))} /></td>
                    <td><input type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, quantity: Number(event.target.value) } : item) }))} /></td>
                    <td><input value={line.unit} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, unit: event.target.value } : item) }))} /></td>
                    <td><input value={line.pack_size} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, pack_size: event.target.value } : item) }))} /></td>
                    <td><input type="number" min="0" step="0.01" value={line.last_cost_ex_vat} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, last_cost_ex_vat: Number(event.target.value) } : item) }))} /></td>
                    <td><input type="number" min="0" step="0.01" value={line.unit_cost_ex_vat} onChange={(event) => setOrderDraft((current) => ({ ...current, lines: current.lines.map((item, lineIndex) => lineIndex === index ? { ...item, unit_cost_ex_vat: Number(event.target.value) } : item) }))} /></td>
                    <td><span className={Math.abs(calculated.price_variance_pct) > 5 ? "buyerVariance buyerVarianceHigh" : "buyerVariance"}>{calculated.price_variance_pct.toFixed(1)}%</span></td>
                    <td><b>{money.format(calculated.line_total_ex_vat)}</b></td>
                    <td><button className="buyerRemoveLine" onClick={() => setOrderDraft((current) => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))}>×</button></td>
                  </tr>;
                })}
              </tbody></table></div>

              <div className="buyerOrderBottom">
                <label>Buyer notes<textarea value={orderDraft.notes} onChange={(event) => setOrderDraft({ ...orderDraft, notes: event.target.value })} placeholder="Buying instructions, price checks, supplier commitments, follow-up notes…" /></label>
                <div className="buyerTotals"><div><span>Subtotal ex VAT</span><b>{money.format(orderTotals.subtotal)}</b></div><div><span>VAT ({orderDraft.vat_rate}%)</span><b>{money.format(orderTotals.vat)}</b></div><div className="grand"><span>Total inc VAT</span><b>{money.format(orderTotals.total)}</b></div></div>
              </div>
            </div>
            <footer><button onClick={() => setOrderOpen(false)}>Cancel</button><button className="buyerSecondaryBtn" onClick={() => void saveOrder(false)} disabled={busy}>{busy ? "Saving…" : "Save Draft"}</button><button className="buyerPrimaryBtn" onClick={() => void saveOrder(true)} disabled={busy}>{busy ? "Saving…" : "Save & Submit for Approval"}</button></footer>
          </section>
        </div>
      )}

      {supplierOpen && (
        <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSupplierOpen(false); }}>
          <section className="buyerModal buyerSmallModal" role="dialog" aria-modal="true" aria-label="Supplier editor">
            <header><div><small>SUPPLIER MASTER</small><h3>{supplierDraft.id ? "Edit Supplier" : "Add Supplier"}</h3></div><button onClick={() => setSupplierOpen(false)}>×</button></header>
            <div className="buyerModalScroll buyerFormGrid">
              <label>Supplier code<input value={supplierDraft.supplier_code} onChange={(event) => setSupplierDraft({ ...supplierDraft, supplier_code: event.target.value.toUpperCase() })} /></label>
              <label>Supplier name<input value={supplierDraft.name} onChange={(event) => setSupplierDraft({ ...supplierDraft, name: event.target.value })} /></label>
              <label>Supplier type<select value={supplierDraft.supplier_type} onChange={(event) => setSupplierDraft({ ...supplierDraft, supplier_type: event.target.value })}><option>Preferred</option><option>Secondary</option><option>Approved</option><option>Trial</option></select></label>
              <label>Contact person<input value={supplierDraft.contact_person} onChange={(event) => setSupplierDraft({ ...supplierDraft, contact_person: event.target.value })} /></label>
              <label>Phone<input value={supplierDraft.phone} onChange={(event) => setSupplierDraft({ ...supplierDraft, phone: event.target.value })} /></label>
              <label>WhatsApp number<input value={supplierDraft.whatsapp_number} onChange={(event) => setSupplierDraft({ ...supplierDraft, whatsapp_number: event.target.value })} placeholder="e.g. 0821234567 or +27…" /></label>
              <label>Email<input type="email" value={supplierDraft.email} onChange={(event) => setSupplierDraft({ ...supplierDraft, email: event.target.value })} /></label>
              <label>Payment terms<input value={supplierDraft.payment_terms} onChange={(event) => setSupplierDraft({ ...supplierDraft, payment_terms: event.target.value })} placeholder="30 days / COD / EFT" /></label>
              <label>Lead time (days)<input type="number" min="0" value={supplierDraft.lead_time_days} onChange={(event) => setSupplierDraft({ ...supplierDraft, lead_time_days: Number(event.target.value) })} /></label>
              <label>Minimum order value<input type="number" min="0" step="0.01" value={supplierDraft.minimum_order} onChange={(event) => setSupplierDraft({ ...supplierDraft, minimum_order: Number(event.target.value) })} /></label>
              <label className="buyerSpan2">Categories<input value={supplierDraft.categories.join(", ")} onChange={(event) => setSupplierDraft({ ...supplierDraft, categories: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="Paint, Plumbing, Timber…" /></label>
              <label className="buyerSpan2">Notes<textarea value={supplierDraft.notes} onChange={(event) => setSupplierDraft({ ...supplierDraft, notes: event.target.value })} /></label>
            </div>
            <footer><button onClick={() => setSupplierOpen(false)}>Cancel</button><button className="buyerPrimaryBtn" onClick={() => void saveSupplier()} disabled={busy}>{busy ? "Saving…" : "Save Supplier"}</button></footer>
          </section>
        </div>
      )}

      {quoteOpen && (
        <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuoteOpen(false); }}>
          <section className="buyerModal buyerSmallModal" role="dialog" aria-modal="true" aria-label="Supplier quote editor">
            <header><div><small>PRICE COMPARISON</small><h3>{quoteDraft.id ? "Edit Supplier Quote" : "Add Supplier Quote"}</h3></div><button onClick={() => setQuoteOpen(false)}>×</button></header>
            <div className="buyerModalScroll buyerFormGrid">
              <label>Product code<input value={quoteDraft.product_code} onChange={(event) => setQuoteDraft({ ...quoteDraft, product_code: event.target.value })} /></label>
              <label>Product / description<input value={quoteDraft.description} onChange={(event) => setQuoteDraft({ ...quoteDraft, description: event.target.value })} /></label>
              <label>Category<input value={quoteDraft.category} onChange={(event) => setQuoteDraft({ ...quoteDraft, category: event.target.value })} /></label>
              <label>Supplier<select value={quoteDraft.supplier_id} onChange={(event) => { const id = Number(event.target.value); const supplier = data.suppliers.find((item) => item.id === id); setQuoteDraft({ ...quoteDraft, supplier_id: id, supplier_name: supplier?.name || "", payment_terms: quoteDraft.payment_terms || supplier?.payment_terms || "", lead_time_days: quoteDraft.lead_time_days || supplier?.lead_time_days || 0 }); }}><option value={0}>Select supplier</option>{data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
              <label>Qty<input type="number" min="0" step="0.01" value={quoteDraft.quantity} onChange={(event) => setQuoteDraft({ ...quoteDraft, quantity: Number(event.target.value) })} /></label>
              <label>Unit<input value={quoteDraft.unit} onChange={(event) => setQuoteDraft({ ...quoteDraft, unit: event.target.value })} /></label>
              <label>Quote ref<input value={quoteDraft.quote_reference} onChange={(event) => setQuoteDraft({ ...quoteDraft, quote_reference: event.target.value })} /></label>
              <label>Quoted unit cost ex VAT<input type="number" min="0" step="0.01" value={quoteDraft.quoted_unit_cost} onChange={(event) => setQuoteDraft({ ...quoteDraft, quoted_unit_cost: Number(event.target.value) })} /></label>
              <label>Valid until<input type="date" value={quoteDraft.valid_until} onChange={(event) => setQuoteDraft({ ...quoteDraft, valid_until: event.target.value })} /></label>
              <label>Lead time days<input type="number" min="0" value={quoteDraft.lead_time_days} onChange={(event) => setQuoteDraft({ ...quoteDraft, lead_time_days: Number(event.target.value) })} /></label>
              <label>Payment terms<input value={quoteDraft.payment_terms} onChange={(event) => setQuoteDraft({ ...quoteDraft, payment_terms: event.target.value })} /></label>
              <label className="buyerCheck"><input type="checkbox" checked={Boolean(quoteDraft.selected)} onChange={(event) => setQuoteDraft({ ...quoteDraft, selected: event.target.checked ? 1 : 0 })} /> Selected / preferred quote</label>
              <label className="buyerSpan2">Notes<textarea value={quoteDraft.notes} onChange={(event) => setQuoteDraft({ ...quoteDraft, notes: event.target.value })} /></label>
            </div>
            <footer><button onClick={() => setQuoteOpen(false)}>Cancel</button><button className="buyerPrimaryBtn" onClick={() => void saveQuote()} disabled={busy}>{busy ? "Saving…" : "Save Quote"}</button></footer>
          </section>
        </div>
      )}

      {receivingOrder && (
        <ReceivingModal order={receivingOrder} busy={busy} onClose={() => setReceivingOrder(null)} onSave={async (update) => { await updateOrderAction("receivingUpdate", receivingOrder.id, update); setReceivingOrder(null); }} />
      )}
    </section>
  );
}

function BranchOrderTable({ orders, onOpen }: { orders: BranchStockOrder[]; onOpen: (order: BranchStockOrder) => void }) {
  return <div className="buyerTableWrap"><table className="buyerTable"><thead><tr><th>Stock Order</th><th>Branch</th><th>Requested By</th><th>Required</th><th>Priority</th><th>Status</th><th>Lines</th><th>Action</th></tr></thead><tbody>
    {orders.map((order) => <tr key={order.id}>
      <td><b>{order.stock_order_number}</b><small>{order.order_date || "—"}</small></td>
      <td><b>{order.branch_workspace}</b><small>{order.branch_notes || "Branch replenishment"}</small></td>
      <td>{order.requested_by_name || "—"}<small>{order.requested_by_email || ""}</small></td>
      <td>{order.required_date || "—"}<small>{order.expected_delivery_date ? `ETA ${order.expected_delivery_date}` : ""}</small></td>
      <td><span className={`buyerPill ${order.priority === "Urgent" || order.priority === "High" ? "warn" : ""}`}>{order.priority || "Normal"}</span></td>
      <td><span className={`buyerPill ${order.status === "Confirmed" || order.status === "Completed" ? "good" : ["Sent to Warehouse", "Under Review"].includes(order.status) ? "warn" : ""}`}>{order.status === "Draft" ? "Draft — not sent" : order.status}</span></td>
      <td><b>{order.lines.length}</b><small>{order.lines.reduce((sum, line) => sum + Number(line.quantity_requested || 0), 0)} units requested</small></td>
      <td><button className="buyerTextBtn" onClick={() => onOpen(order)}>{["Sent to Warehouse", "Under Review"].includes(order.status) ? "Review / Confirm" : "Open"}</button></td>
    </tr>)}
    {!orders.length && <tr><td colSpan={8}>No branch stock orders found.</td></tr>}
  </tbody></table></div>;
}

function OrderTable({ orders, onEdit, onExport, canApprove, onAction, busy, suppliers, onSend, compact = false }: {
  orders: BuyerOrder[];
  onEdit: (order: BuyerOrder) => void;
  onExport: (order: BuyerOrder) => void;
  canApprove: boolean;
  onAction: (action: string, id: number, extra?: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  suppliers: Supplier[];
  onSend: (order: BuyerOrder, channel: "WhatsApp" | "Email") => Promise<void>;
  compact?: boolean;
}) {
  return <div className="buyerTableWrap"><table className="buyerTable"><thead><tr><th>PO Number</th><th>Supplier / Store</th><th>Dates</th><th>Status</th><th>Approval</th><th>Total</th>{!compact && <th>Delivery</th>}<th>Actions</th></tr></thead><tbody>
    {orders.map((order) => { const supplier = suppliers.find((item) => item.id === Number(order.supplier_id)); const sendable = order.approval_status === "Approved" || ["Ordered", "Part Received", "Received"].includes(order.status); return <tr key={order.id}>
      <td><b>{order.po_number}</b><small>{order.order_type}</small></td>
      <td><b>{order.supplier_name}</b><small>{order.store_workspace}</small></td>
      <td>{order.order_date || "—"}<small>Req: {order.required_date || "—"}</small></td>
      <td><span className={`buyerPill ${order.status === "Received" ? "good" : order.status === "Pending approval" ? "warn" : ""}`}>{order.status}</span></td>
      <td><span className={`buyerPill ${order.approval_status === "Approved" ? "good" : order.approval_status === "Pending approval" ? "warn" : ""}`}>{order.approval_status}</span></td>
      <td><b>{money.format(Number(order.total || 0))}</b><small>{order.lines.length} line{order.lines.length === 1 ? "" : "s"}</small></td>
      {!compact && <td>{order.delivery_status}<small>{order.expected_delivery_date || "No ETA"}</small></td>}
      <td><div className="buyerRowActions"><button onClick={() => onEdit(order)}>Open</button><button onClick={() => onExport(order)}>Excel</button>{canApprove && order.approval_status === "Pending approval" && <><button className="approve" disabled={busy} onClick={() => void onAction("approveOrder", order.id)}>Approve</button><button className="return" disabled={busy} onClick={() => void onAction("returnOrder", order.id)}>Return</button></>}{order.approval_status === "Approved" && order.status === "Approved" && <button className="approve" disabled={busy} onClick={() => void onAction("setOrderStatus", order.id, { status: "Ordered" })}>Mark ordered</button>}{sendable && (supplier?.whatsapp_number || supplier?.phone) && <button className="approve" disabled={busy} onClick={() => void onSend(order, "WhatsApp")}>WhatsApp</button>}{sendable && supplier?.email && <button className="approve" disabled={busy} onClick={() => void onSend(order, "Email")}>Email</button>}{order.last_sent_at && <small>Sent {order.last_sent_channel}</small>}</div></td>
    </tr>; })}
    {!orders.length && <tr><td colSpan={8}>No purchase orders found.</td></tr>}
  </tbody></table></div>;
}

function ReceivingModal({ order, busy, onClose, onSave }: { order: BuyerOrder; busy: boolean; onClose: () => void; onSave: (update: Record<string, unknown>) => Promise<void> }) {
  const [deliveryStatus, setDeliveryStatus] = useState(order.delivery_status || "Awaiting delivery");
  const [expected, setExpected] = useState(order.expected_delivery_date || "");
  const [grv, setGrv] = useState(order.grv_number || "");
  const [invoice, setInvoice] = useState(order.invoice_number || "");
  const [notes, setNotes] = useState(order.receiving_notes || "");
  return <div className="buyerModalOverlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="buyerModal buyerSmallModal" role="dialog" aria-modal="true" aria-label="Receiving update"><header><div><small>{order.po_number}</small><h3>Receiving / Delivery Update</h3></div><button onClick={onClose}>×</button></header><div className="buyerModalScroll buyerFormGrid">
    <label>Delivery status<select value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value)}><option>Awaiting delivery</option><option>Part received</option><option>Received</option><option>Delayed</option><option>Supplier issue</option></select></label>
    <label>Expected delivery<input type="date" value={expected} onChange={(event) => setExpected(event.target.value)} /></label>
    <label>GRV number<input value={grv} onChange={(event) => setGrv(event.target.value)} /></label>
    <label>Invoice number<input value={invoice} onChange={(event) => setInvoice(event.target.value)} /></label>
    <label className="buyerSpan2">Receiving notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
  </div><footer><button onClick={onClose}>Cancel</button><button className="buyerPrimaryBtn" disabled={busy} onClick={() => void onSave({ delivery_status: deliveryStatus, expected_delivery_date: expected, grv_number: grv, invoice_number: invoice, receiving_notes: notes })}>{busy ? "Saving…" : "Save Update"}</button></footer></section></div>;
}
