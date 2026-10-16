"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./ecommerce-control.module.css";

type Tab = "Overview" | "Products" | "Orders" | "B2B Accounts" | "Settings";
type Product = {
  id: number; code: string; name: string; category: string; image_url: string;
  b2c_enabled: number; b2b_enabled: number; retail_price_inc_vat: number; wholesale_price_ex_vat: number;
  b2b_min_qty: number; unit: string; stock_status: string; featured: number; sort_order: number;
};
type OrderLine = { id: number; product_code: string; product_name: string; quantity: number; unit: string; line_total_inc_vat: number; price_pending: number };
type Order = {
  id: number; order_number: string; channel: string; customer_name: string; company_name: string; customer_email: string;
  customer_whatsapp: string; branch_workspace: string; fulfilment_type: string; delivery_address: string; customer_po: string;
  payment_method: string; status: string; pricing_status: string; subtotal_ex_vat: number; vat_amount: number; total_inc_vat: number;
  notes: string; created_at: string; lines: OrderLine[];
};
type Customer = {
  id: number; company_name: string; trading_name: string; contact_name: string; email: string; whatsapp: string; vat_number: string;
  registration_number: string; delivery_address: string; customer_code: string; portal_code: string; credit_terms: string; pricing_tier: string;
  status: string; notes: string; created_at: string;
};

type Dashboard = { b2c_products: number; b2b_products: number; pending_customers: number; new_orders: number; recent_orders: Array<Record<string, unknown>> };
const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value || 0));

function ProductEditor({ product, save }: { product: Product; save: (payload: Record<string, unknown>) => Promise<boolean> }) {
  const [draft, setDraft] = useState({
    b2c_enabled: Boolean(product.b2c_enabled), b2b_enabled: Boolean(product.b2b_enabled),
    retail_price_inc_vat: Number(product.retail_price_inc_vat || 0), wholesale_price_ex_vat: Number(product.wholesale_price_ex_vat || 0),
    b2b_min_qty: Number(product.b2b_min_qty || 1), unit: product.unit || "EA", stock_status: product.stock_status || "Available",
    featured: Boolean(product.featured), sort_order: Number(product.sort_order || 0),
  });
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); await save({ action: "save_product", product_id: product.id, ...draft }); setBusy(false); };
  return <article className={styles.productRow}>
    <div className={styles.productIdentity}>
      <div className={styles.thumb}>{product.image_url ? <img src={product.image_url} alt="" /> : <span>▧</span>}</div>
      <div><b>{product.name}</b><small>{product.code} · {product.category}</small></div>
    </div>
    <label className={styles.switchLabel}><input type="checkbox" checked={draft.b2c_enabled} onChange={(e) => setDraft({ ...draft, b2c_enabled: e.target.checked })} /><span>B2C</span></label>
    <label className={styles.switchLabel}><input type="checkbox" checked={draft.b2b_enabled} onChange={(e) => setDraft({ ...draft, b2b_enabled: e.target.checked })} /><span>B2B</span></label>
    <label>Retail incl VAT<input type="number" step="0.01" value={draft.retail_price_inc_vat} onChange={(e) => setDraft({ ...draft, retail_price_inc_vat: Number(e.target.value) })} /></label>
    <label>Wholesale ex VAT<input type="number" step="0.01" value={draft.wholesale_price_ex_vat} onChange={(e) => setDraft({ ...draft, wholesale_price_ex_vat: Number(e.target.value) })} /></label>
    <label>B2B MOQ<input type="number" min="1" step="1" value={draft.b2b_min_qty} onChange={(e) => setDraft({ ...draft, b2b_min_qty: Number(e.target.value) })} /></label>
    <label>Unit<input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></label>
    <label>Stock<select value={draft.stock_status} onChange={(e) => setDraft({ ...draft, stock_status: e.target.value })}><option>Available</option><option>Low stock</option><option>Order on request</option><option>Unavailable</option></select></label>
    <label className={styles.switchLabel}><input type="checkbox" checked={draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} /><span>Featured</span></label>
    <button disabled={busy} onClick={() => void submit()}>{busy ? "Saving…" : "Save"}</button>
  </article>;
}

export default function EcommerceControl() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPages, setProductPages] = useState(1);
  const [toast, setToast] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  const get = useCallback(async (view: string, extra = "") => {
    setLoading(true);
    const response = await fetch(`/api/ecommerce/control?view=${encodeURIComponent(view)}${extra}`, { cache: "no-store" });
    const json = await response.json();
    setLoading(false);
    if (!response.ok) { notify(json.error || "E-Commerce Control could not load."); return null; }
    return json;
  }, []);
  const post = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/ecommerce/control", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const json = await response.json();
    if (!response.ok) { notify(json.error || "Could not save change."); return null; }
    return json;
  };

  const loadDashboard = useCallback(async () => { const json = await get("dashboard"); if (json) { setDashboard(json.dashboard); setSettings(json.settings || {}); } }, [get]);
  const loadProducts = useCallback(async (page = productPage, search = q) => { const json = await get("products", `&page=${page}&q=${encodeURIComponent(search)}`); if (json) { setProducts(json.products || []); setProductPage(json.page || 1); setProductPages(json.pages || 1); } }, [get, productPage, q]);
  const loadOrders = useCallback(async () => { const json = await get("orders"); if (json) setOrders(json.orders || []); }, [get]);
  const loadCustomers = useCallback(async () => { const json = await get("customers"); if (json) setCustomers(json.customers || []); }, [get]);
  const loadSettings = useCallback(async () => { const json = await get("settings"); if (json) setSettings(json.settings || {}); }, [get]);

  useEffect(() => { const timer = window.setTimeout(() => { void loadDashboard(); }, 0); return () => window.clearTimeout(timer); }, [loadDashboard]);
  useEffect(() => { const timer = window.setTimeout(() => { if (tab === "Products") void loadProducts(1, q); if (tab === "Orders") void loadOrders(); if (tab === "B2B Accounts") void loadCustomers(); if (tab === "Settings") void loadSettings(); }, 0); return () => window.clearTimeout(timer); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProduct = async (payload: Record<string, unknown>) => { const ok = await post(payload); if (ok) notify("Online product settings saved."); return Boolean(ok); };
  const updateOrderStatus = async (orderId: number, status: string) => { if (await post({ action: "order_status", order_id: orderId, status })) { notify("Order status updated."); await loadOrders(); await loadDashboard(); } };
  const updateCustomerStatus = async (customer: Customer, status: string) => {
    const result = await post({ action: "customer_status", customer_id: customer.id, status });
    if (result) { notify(status === "Approved" ? `Trade account approved. Access code: ${result.portal_code}` : `Trade account ${status.toLowerCase()}.`); await loadCustomers(); await loadDashboard(); }
  };
  const saveSettings = async (event: FormEvent) => { event.preventDefault(); if (await post({ action: "save_settings", settings })) { notify("E-commerce settings saved."); await loadDashboard(); } };

  return <section className={styles.wrap}>
    <div className={styles.hero}>
      <div><span>POWERBUILD DIGITAL SALES</span><h2>E-Commerce Control</h2><p>One product master for retail B2C and wholesale B2B online ordering. Control channel visibility, prices, trade accounts and incoming web orders.</p></div>
      <div className={styles.storeLinks}><a href="/shop" target="_blank" rel="noreferrer">Open B2C Store ↗</a><a href="/wholesale-shop" target="_blank" rel="noreferrer">Open B2B Store ↗</a></div>
    </div>

    <nav className={styles.tabs}>{(["Overview","Products","Orders","B2B Accounts","Settings"] as Tab[]).map((item) => <button key={item} className={tab === item ? styles.active : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>

    {tab === "Overview" && <div className={styles.content}>
      <div className={styles.kpis}>
        <div><small>B2C PRODUCTS</small><strong>{dashboard?.b2c_products || 0}</strong><span>Enabled for retail online</span></div>
        <div><small>B2B PRODUCTS</small><strong>{dashboard?.b2b_products || 0}</strong><span>Enabled for wholesale online</span></div>
        <div><small>NEW ORDERS</small><strong>{dashboard?.new_orders || 0}</strong><span>Need attention</span></div>
        <div><small>B2B APPLICATIONS</small><strong>{dashboard?.pending_customers || 0}</strong><span>Awaiting approval</span></div>
      </div>
      <div className={styles.panel}><div className={styles.panelHead}><div><small>RECENT ACTIVITY</small><h3>Latest online orders</h3></div><button onClick={() => setTab("Orders")}>View all orders</button></div>
        <div className={styles.simpleTable}><div className={styles.simpleHead}><span>Order</span><span>Channel</span><span>Customer</span><span>Status</span><span>Total</span></div>{dashboard?.recent_orders?.length ? dashboard.recent_orders.map((order) => <div key={String(order.id)}><b>{String(order.order_number)}</b><span>{String(order.channel)}</span><span>{String(order.company_name || order.customer_name)}</span><em>{String(order.status)}</em><strong>{money(Number(order.total_inc_vat || 0))}</strong></div>) : <p>No online orders yet.</p>}</div>
      </div>
    </div>}

    {tab === "Products" && <div className={styles.content}>
      <div className={styles.panelHead}><div><small>CHANNEL MERCHANDISING</small><h3>Online product pricing & visibility</h3><p className={styles.priceHint}>Enter B2C retail incl. VAT and/or B2B wholesale ex. VAT, then click Save on that product row.</p></div><form onSubmit={(e) => { e.preventDefault(); void loadProducts(1, q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, product or category"/><button>Search</button></form></div>
      {loading ? <p className={styles.loading}>Loading products…</p> : <div className={styles.productList}>{products.map((product) => <ProductEditor key={product.id} product={product} save={saveProduct} />)}</div>}
      <div className={styles.pager}><button disabled={productPage <= 1} onClick={() => void loadProducts(productPage - 1, q)}>← Previous</button><span>Page {productPage} of {productPages}</span><button disabled={productPage >= productPages} onClick={() => void loadProducts(productPage + 1, q)}>Next →</button></div>
    </div>}

    {tab === "Orders" && <div className={styles.content}>
      <div className={styles.panelHead}><div><small>ONLINE ORDER DESK</small><h3>B2C & B2B orders</h3></div><button onClick={() => void loadOrders()}>Refresh</button></div>
      {orders.length ? <div className={styles.orders}>{orders.map((order) => <details key={order.id} className={styles.orderCard}><summary><span><b>{order.order_number}</b><small>{order.channel} · {new Date(order.created_at).toLocaleString()}</small></span><span><b>{order.company_name || order.customer_name}</b><small>{order.customer_email}</small></span><span><em>{order.status}</em><strong>{order.pricing_status === "Price Pending" ? "PRICE PENDING" : money(order.total_inc_vat)}</strong></span></summary><div className={styles.orderDetail}><div className={styles.orderMeta}><p><b>Fulfilment</b>{order.fulfilment_type}</p><p><b>Branch</b>{order.branch_workspace || "Head Office / Wholesale"}</p><p><b>Customer PO</b>{order.customer_po || "—"}</p><p><b>Payment</b>{order.payment_method || "—"}</p><p><b>WhatsApp</b>{order.customer_whatsapp || "—"}</p><p><b>Address</b>{order.delivery_address || "—"}</p></div><div className={styles.lines}>{order.lines.map((line) => <div key={line.id}><span>{line.product_code}</span><b>{line.product_name}</b><span>{line.quantity} {line.unit}</span><strong>{line.price_pending ? "Price pending" : money(line.line_total_inc_vat)}</strong></div>)}</div><div className={styles.statusBar}><label>Update status<select value={order.status} onChange={(e) => void updateOrderStatus(order.id, e.target.value)}><option>New</option><option>Awaiting Pricing</option><option>Confirmed</option><option>Picking</option><option>Ready</option><option>Dispatched</option><option>Completed</option><option>Cancelled</option></select></label><div><span>Subtotal ex VAT {money(order.subtotal_ex_vat)}</span><span>VAT {money(order.vat_amount)}</span><strong>Total {money(order.total_inc_vat)}</strong></div></div></div></details>)}</div> : <p className={styles.loading}>No online orders yet.</p>}
    </div>}

    {tab === "B2B Accounts" && <div className={styles.content}>
      <div className={styles.panelHead}><div><small>TRADE CUSTOMER CONTROL</small><h3>B2B applications & access codes</h3></div><button onClick={() => void loadCustomers()}>Refresh</button></div>
      <div className={styles.customers}>{customers.map((customer) => <article key={customer.id}><header><div><small>{customer.status}</small><h3>{customer.company_name}</h3><p>{customer.contact_name} · {customer.email}</p></div><strong>{customer.customer_code || "NO ACCOUNT CODE"}</strong></header><div className={styles.customerMeta}><span><b>WhatsApp</b>{customer.whatsapp || "—"}</span><span><b>VAT</b>{customer.vat_number || "—"}</span><span><b>Registration</b>{customer.registration_number || "—"}</span><span><b>Terms</b>{customer.credit_terms}</span><span><b>Pricing</b>{customer.pricing_tier}</span><span><b>Portal access</b>{customer.portal_code || "Issued on approval"}</span></div><p>{customer.delivery_address}</p><div className={styles.customerActions}>{customer.status !== "Approved" && <button onClick={() => void updateCustomerStatus(customer,"Approved")}>Approve & issue code</button>}{customer.status === "Approved" && <><button className={styles.secondary} onClick={() => void navigator.clipboard?.writeText(customer.portal_code)}>Copy access code</button>{customer.whatsapp && <a href={`https://wa.me/${customer.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(`Your PowerBuild Wholesale Online account is approved. Trade access code: ${customer.portal_code}. Open /wholesale-shop`)}`} target="_blank" rel="noreferrer">Send via WhatsApp</a>}<a href={`mailto:${customer.email}?subject=${encodeURIComponent("PowerBuild Wholesale Online account approved")}&body=${encodeURIComponent(`Your B2B trade account is approved. Access code: ${customer.portal_code}\n\nPortal: /wholesale-shop`)}`}>Send via email</a></>}{customer.status !== "Declined" && <button className={styles.danger} onClick={() => void updateCustomerStatus(customer,"Declined")}>Decline</button>}</div></article>)}</div>
    </div>}

    {tab === "Settings" && <form className={`${styles.content} ${styles.settings}`} onSubmit={saveSettings}>
      <div className={styles.panelHead}><div><small>STORE SETTINGS</small><h3>Online channel configuration</h3></div><button type="submit">Save settings</button></div>
      <div className={styles.settingsGrid}>
        <label>B2C store name<input value={settings.b2c_store_name || ""} onChange={(e) => setSettings({ ...settings, b2c_store_name: e.target.value })}/></label>
        <label>B2B store name<input value={settings.b2b_store_name || ""} onChange={(e) => setSettings({ ...settings, b2b_store_name: e.target.value })}/></label>
        <label>Support email<input type="email" value={settings.support_email || ""} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}/></label>
        <label>Support WhatsApp<input value={settings.support_whatsapp || ""} onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}/></label>
        <label>VAT rate %<input type="number" step="0.01" value={settings.vat_rate || "15"} onChange={(e) => setSettings({ ...settings, vat_rate: e.target.value })}/></label>
        <label className={styles.settingToggle}><input type="checkbox" checked={(settings.b2c_orders_enabled || "true") === "true"} onChange={(e) => setSettings({ ...settings, b2c_orders_enabled: String(e.target.checked) })}/><span>Accept B2C orders</span></label>
        <label className={styles.settingToggle}><input type="checkbox" checked={(settings.b2b_orders_enabled || "true") === "true"} onChange={(e) => setSettings({ ...settings, b2b_orders_enabled: String(e.target.checked) })}/><span>Accept B2B orders</span></label>
      </div>
      <div className={styles.note}><b>Payment gateway:</b> the current build accepts order submission with EFT / account / pay-on-collection options. PayFast, Yoco or another live card gateway can be connected once merchant credentials are available.</div>
    </form>}

    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}
