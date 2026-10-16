"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "./ecommerce-storefront.module.css";

type Channel = "B2C" | "B2B";
type Product = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
  stock_status: string;
  featured: boolean;
  unit: string;
  min_qty: number;
  price: number;
  price_basis: string;
  price_locked?: boolean;
};
type CartLine = Product & { qty: number };
type StoreData = {
  products: Product[];
  page: number;
  pages: number;
  total: number;
  categories: string[];
  branches: string[];
  specials: Array<{ id: number; title: string; description: string; start_date: string; end_date: string; images: Array<{ id: number; url: string }> }>;
  trade_account?: { id: number; company_name: string; contact_name: string; email: string; whatsapp: string; customer_code: string; credit_terms: string; pricing_tier: string } | null;
  settings: { store_name: string; support_email: string; support_whatsapp: string; vat_rate: number; orders_enabled: boolean };
};

type Props = { channel: Channel };

const randKey = (line: CartLine) => `cart-${line.id}`;
const money = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value || 0);

export default function EcommerceStorefront({ channel }: Props) {
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackResult, setTrackResult] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [tradeVerified, setTradeVerified] = useState(false);
  const [tradeEmail, setTradeEmail] = useState("");
  const [tradeCode, setTradeCode] = useState("");
  const [tradeCompany, setTradeCompany] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [checkout, setCheckout] = useState({
    customer_name: "",
    customer_email: "",
    customer_whatsapp: "",
    company_name: "",
    vat_number: "",
    branch_workspace: "",
    fulfilment_type: "Collection",
    delivery_address: "",
    customer_po: "",
    payment_method: channel === "B2B" ? "Account / EFT" : "Pay on collection",
    notes: "",
  });

  const load = async (nextPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({ channel, page: String(nextPage), pageSize: "24" });
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    const response = await fetch(`/api/ecommerce/public?${params.toString()}`, { cache: "no-store" });
    if (response.ok) {
      const json = (await response.json()) as StoreData;
      setData(json);
      setPage(json.page);
      if (channel === "B2B" && json.trade_account) {
        setTradeVerified(true);
        setTradeCompany(json.trade_account.company_name || "");
        setTradeEmail(json.trade_account.email || tradeEmail);
        setCheckout((current) => ({
          ...current,
          customer_name: json.trade_account?.contact_name || current.customer_name,
          customer_email: json.trade_account?.email || current.customer_email,
          customer_whatsapp: json.trade_account?.whatsapp || current.customer_whatsapp,
          company_name: json.trade_account?.company_name || current.company_name,
        }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, category]);

  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const pendingPrice = cart.some((line) => line.price <= 0);

  const add = (product: Product) => {
    setCart((current) => {
      const found = current.find((line) => line.id === product.id);
      if (found) return current.map((line) => line.id === product.id ? { ...line, qty: line.qty + product.min_qty } : line);
      return [...current, { ...product, qty: product.min_qty }];
    });
    setMessage(`${product.name} added to cart.`);
    window.setTimeout(() => setMessage(""), 1800);
  };

  const setQty = (id: number, qty: number) => {
    setCart((current) => current
      .map((line) => line.id === id ? { ...line, qty: Math.max(line.min_qty, Number.isFinite(qty) ? qty : line.min_qty) } : line)
      .filter((line) => line.qty > 0));
  };

  const logoutTrade = async () => {
    await fetch("/api/ecommerce/public", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout_b2b" }) });
    setTradeVerified(false);
    setTradeCompany("");
    setTradeEmail("");
    setTradeCode("");
    setCart([]);
    setTradeMessage("Trade account signed out.");
    await load(1);
  };

  const verifyTrade = async (event: FormEvent) => {
    event.preventDefault();
    setTradeMessage("Checking trade account…");
    const response = await fetch("/api/ecommerce/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "verify_b2b", email: tradeEmail, portal_code: tradeCode }),
    });
    const json = await response.json() as { approved?: boolean; error?: string; customer?: Record<string, string> };
    if (!response.ok || !json.approved) {
      setTradeVerified(false);
      setTradeMessage(json.error || "Trade account could not be verified.");
      return;
    }
    setTradeVerified(true);
    setTradeCompany(String(json.customer?.company_name || ""));
    setCheckout((current) => ({
      ...current,
      customer_name: String(json.customer?.contact_name || current.customer_name),
      customer_email: String(json.customer?.email || tradeEmail),
      customer_whatsapp: String(json.customer?.whatsapp || current.customer_whatsapp),
      company_name: String(json.customer?.company_name || ""),
    }));
    setTradeMessage(`Verified: ${String(json.customer?.company_name || "Trade account")}`);
    await load(1);
  };

  const registerTrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/ecommerce/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "register_b2b", ...payload }),
    });
    const json = await response.json() as { error?: string; message?: string };
    setTradeMessage(response.ok ? json.message || "Application submitted." : json.error || "Application could not be submitted.");
    if (response.ok) setRegisterOpen(false);
  };

  const lookupOrder = async (event: FormEvent) => {
    event.preventDefault();
    setTrackResult(null);
    const response = await fetch("/api/ecommerce/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "lookup_order", order_number: trackOrderNumber, email: trackEmail }),
    });
    const json = await response.json() as { error?: string; order?: Record<string, unknown> };
    if (!response.ok) { setMessage(json.error || "Order could not be found."); return; }
    setTrackResult(json.order || null);
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!cart.length) return;
    if (channel === "B2B" && !tradeVerified) {
      setMessage("Verify your approved trade account before placing a wholesale order.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/ecommerce/public", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "order",
        channel,
        ...checkout,
        trade_email: tradeEmail,
        trade_code: tradeCode,
        lines: cart.map((line) => ({ product_id: line.id, quantity: line.qty })),
      }),
    });
    const json = await response.json() as { error?: string; order_number?: string; status?: string; total_inc_vat?: number };
    setSubmitting(false);
    if (!response.ok) {
      setMessage(json.error || "Order could not be submitted.");
      return;
    }
    setMessage(`Order ${json.order_number} submitted successfully. Status: ${json.status}.`);
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  const specialImages = useMemo(() => data?.specials.flatMap((special) => special.images.map((image) => ({ ...image, title: special.title }))) || [], [data]);

  return (
    <main className={styles.store}>
      <header className={styles.header}>
        <a className={styles.brand} href={channel === "B2C" ? "/shop" : "/wholesale-shop"}>
          <img src="/powerbuild-logo-transparent.png" alt="PowerBuild" />
          <span><strong>{data?.settings.store_name || (channel === "B2C" ? "PowerBuild Online" : "PowerBuild Wholesale Online")}</strong><small>{channel === "B2C" ? "Retail eCommerce" : "B2B Trade eCommerce"}</small></span>
        </a>
        <nav>
          <a className={channel === "B2C" ? styles.activeChannel : ""} href="/shop">Retail Shop</a>
          <a className={channel === "B2B" ? styles.activeChannel : ""} href="/wholesale-shop">Wholesale B2B</a>
          <button type="button" onClick={() => setTrackOpen(true)}>Track order</button>
          <button type="button" onClick={() => setCartOpen(true)}>Cart <b>{cartCount}</b></button>
        </nav>
      </header>

      <section className={styles.hero}>
        <div>
          <span>{channel === "B2C" ? "BUILD • REPAIR • IMPROVE" : "POWERBUILD WHOLESALE DIVISION"}</span>
          <h1>{channel === "B2C" ? "Hardware delivered from the PowerBuild network." : "Trade ordering built for hardware businesses."}</h1>
          <p>{channel === "B2C" ? "Browse the group catalogue, choose your branch and submit your order for collection or delivery." : "Approved B2B customers can order in bulk, use trade pack quantities and send purchase references directly to Head Office."}</p>
        </div>
        <div className={styles.heroCard}>
          <strong>{channel === "B2C" ? "Retail pricing includes VAT" : "Wholesale pricing excludes VAT"}</strong>
          <small>{data?.settings.orders_enabled === false ? "Online orders are temporarily paused." : "Online ordering is open."}</small>
        </div>
      </section>

      {channel === "B2B" && (
        <section className={styles.tradePanel}>
          <div>
            <span>TRADE ACCOUNT</span>
            <h2>Verify before placing a wholesale order</h2>
            <p>Enter the email and six-digit access code issued after Head Office approves your B2B account.</p>
          </div>
          <form onSubmit={verifyTrade}>
            <input type="email" placeholder="Trade account email" value={tradeEmail} onChange={(e) => setTradeEmail(e.target.value)} required />
            <input inputMode="numeric" placeholder="6-digit access code" value={tradeCode} onChange={(e) => setTradeCode(e.target.value)} required />
            <button type="submit">Verify account</button>
            <button type="button" className={styles.secondary} onClick={() => setRegisterOpen((value) => !value)}>Apply for B2B account</button>
          </form>
          {tradeMessage && <p className={tradeVerified ? styles.success : styles.notice}>{tradeMessage}</p>}
          {tradeVerified && tradeCompany && <div className={styles.tradeVerifiedRow}><b className={styles.verified}>✓ {tradeCompany}</b><button type="button" className={styles.secondary} onClick={() => void logoutTrade()}>Switch account</button></div>}
          {registerOpen && (
            <form className={styles.registration} onSubmit={registerTrade}>
              <input name="company_name" placeholder="Registered company name" required />
              <input name="trading_name" placeholder="Trading name" />
              <input name="contact_name" placeholder="Contact person" required />
              <input name="email" type="email" placeholder="Business email" required />
              <input name="whatsapp" placeholder="WhatsApp number" />
              <input name="vat_number" placeholder="VAT number" />
              <input name="registration_number" placeholder="Company registration number" />
              <textarea name="delivery_address" placeholder="Delivery address" />
              <button type="submit">Submit trade application</button>
            </form>
          )}
        </section>
      )}

      {!!specialImages.length && (
        <section className={styles.specials}>
          <div className={styles.sectionHeading}><div><span>CURRENT PROMOTIONS</span><h2>Store specials</h2></div></div>
          <div className={styles.specialScroller}>
            {specialImages.slice(0, 8).map((image) => <img key={image.id} src={image.url} alt={image.title} />)}
          </div>
        </section>
      )}

      <section className={styles.catalogue}>
        <div className={styles.sectionHeading}>
          <div><span>OUR CATALOGUE</span><h2>{data?.total || 0} products available online</h2></div>
          <div className={styles.filters}>
            <form onSubmit={(e) => { e.preventDefault(); void load(1); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product code, name or category" /><button>Search</button></form>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{data?.categories.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </div>

        {loading ? <div className={styles.loading}>Loading online catalogue…</div> : (
          <div className={styles.grid}>
            {data?.products.map((product) => (
              <article key={product.id} className={styles.productCard}>
                <div className={styles.imageWrap}>{product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy" /> : <span>No image</span>}{product.featured && <b>FEATURED</b>}</div>
                <small>{product.category}</small>
                <h3>{product.name}</h3>
                <p>{product.code}</p>
                <div className={styles.priceRow}>
                  <span>{product.price_locked ? <><strong>Trade price locked</strong><small>Verify approved B2B account</small></> : product.price > 0 ? <><strong>{money(product.price)}</strong><small>{product.price_basis}</small></> : <><strong>Price on request</strong><small>Head Office will confirm</small></>}</span>
                  <em>{product.stock_status}</em>
                </div>
                <button type="button" disabled={product.stock_status === "Unavailable" || Boolean(product.price_locked)} onClick={() => add(product)}>{product.price_locked ? "Verify to order" : `Add ${product.min_qty > 1 ? `min ${product.min_qty}` : "to cart"}`}</button>
              </article>
            ))}
          </div>
        )}
        {data && data.pages > 1 && <div className={styles.pager}><button disabled={page <= 1} onClick={() => void load(page - 1)}>← Previous</button><span>Page {page} of {data.pages}</span><button disabled={page >= data.pages} onClick={() => void load(page + 1)}>Next →</button></div>}
      </section>

      {message && <div className={styles.toast}>{message}</div>}

      {trackOpen && (
        <div className={styles.overlay} onMouseDown={(e) => { if (e.currentTarget === e.target) setTrackOpen(false); }}>
          <form className={styles.trackBox} onSubmit={lookupOrder}>
            <div className={styles.cartHead}><div><small>ORDER HISTORY</small><h2>Track an online order</h2></div><button type="button" onClick={() => setTrackOpen(false)}>×</button></div>
            <div className={styles.trackFields}><input value={trackOrderNumber} onChange={(e) => setTrackOrderNumber(e.target.value)} placeholder="Order number e.g. WEB-B2C-..." required/><input type="email" value={trackEmail} onChange={(e) => setTrackEmail(e.target.value)} placeholder="Email used on the order" required/><button>Find order</button></div>
            {trackResult && <div className={styles.trackResult}><header><div><small>{String(trackResult.channel || "ONLINE")}</small><h3>{String(trackResult.order_number || "")}</h3></div><strong>{String(trackResult.status || "")}</strong></header><div className={styles.trackMeta}><span><b>Customer</b>{String(trackResult.company_name || trackResult.customer_name || "")}</span><span><b>Fulfilment</b>{String(trackResult.fulfilment_type || "")}</span><span><b>Branch</b>{String(trackResult.branch_workspace || "Head Office / Wholesale")}</span><span><b>Total incl VAT</b>{String(trackResult.pricing_status) === "Price Pending" ? "Price pending" : money(Number(trackResult.total_inc_vat || 0))}</span></div><div className={styles.trackLines}>{Array.isArray(trackResult.lines) && trackResult.lines.map((line, index) => { const item = line as Record<string, unknown>; return <div key={`${String(item.product_code)}-${index}`}><b>{String(item.product_name || "")}</b><span>{String(item.quantity || 0)} {String(item.unit || "")}</span></div>; })}</div></div>}
          </form>
        </div>
      )}

      {cartOpen && (
        <div className={styles.overlay} onMouseDown={(e) => { if (e.currentTarget === e.target) setCartOpen(false); }}>
          <aside className={styles.cart}>
            <div className={styles.cartHead}><div><small>{channel} ONLINE ORDER</small><h2>Your cart</h2></div><button onClick={() => setCartOpen(false)}>×</button></div>
            {!cart.length ? <p className={styles.empty}>Your cart is empty.</p> : <>
              <div className={styles.cartLines}>{cart.map((line) => <div className={styles.cartLine} key={randKey(line)}><div><b>{line.name}</b><small>{line.code} · {line.unit}</small></div><input type="number" min={line.min_qty} step="1" value={line.qty} onChange={(e) => setQty(line.id, Number(e.target.value))} /><span>{line.price > 0 ? money(line.price * line.qty) : "Pending"}</span><button onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))}>Remove</button></div>)}</div>
              <div className={styles.cartTotal}><span>{channel === "B2B" ? "Estimated total incl VAT" : "Order total incl VAT"}</span><strong>{pendingPrice ? `${money(cartTotal)} + price pending items` : money(cartTotal)}</strong></div>
              <button className={styles.checkoutBtn} disabled={channel === "B2B" && !tradeVerified} onClick={() => setCheckoutOpen(true)}>{channel === "B2B" && !tradeVerified ? "Verify trade account first" : "Continue to checkout"}</button>
            </>}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className={styles.overlay}>
          <form className={styles.checkout} onSubmit={submitOrder}>
            <div className={styles.cartHead}><div><small>CHECKOUT</small><h2>Submit your {channel === "B2B" ? "wholesale" : "retail"} order</h2></div><button type="button" onClick={() => setCheckoutOpen(false)}>×</button></div>
            <div className={styles.formGrid}>
              <label>Contact name<input required value={checkout.customer_name} onChange={(e) => setCheckout({ ...checkout, customer_name: e.target.value })} /></label>
              <label>Email<input type="email" required value={checkout.customer_email} onChange={(e) => setCheckout({ ...checkout, customer_email: e.target.value })} /></label>
              <label>WhatsApp<input value={checkout.customer_whatsapp} onChange={(e) => setCheckout({ ...checkout, customer_whatsapp: e.target.value })} /></label>
              {channel === "B2C" && <label>Preferred branch<select required value={checkout.branch_workspace} onChange={(e) => setCheckout({ ...checkout, branch_workspace: e.target.value })}><option value="">Choose a branch</option>{data?.branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>}
              {channel === "B2B" && <label>Customer PO / Reference<input value={checkout.customer_po} onChange={(e) => setCheckout({ ...checkout, customer_po: e.target.value })} /></label>}
              <label>Fulfilment<select value={checkout.fulfilment_type} onChange={(e) => setCheckout({ ...checkout, fulfilment_type: e.target.value })}><option>Collection</option><option>Delivery</option></select></label>
              <label>Payment method<select value={checkout.payment_method} onChange={(e) => setCheckout({ ...checkout, payment_method: e.target.value })}>{channel === "B2C" ? <><option>Pay on collection</option><option>EFT</option><option>Card at branch</option></> : <><option>Account / EFT</option><option>COD</option></>}</select></label>
              {checkout.fulfilment_type === "Delivery" && <label className={styles.full}>Delivery address<textarea required value={checkout.delivery_address} onChange={(e) => setCheckout({ ...checkout, delivery_address: e.target.value })} /></label>}
              <label className={styles.full}>Order notes<textarea value={checkout.notes} onChange={(e) => setCheckout({ ...checkout, notes: e.target.value })} placeholder="Colour, size, delivery instructions or any special request" /></label>
            </div>
            <div className={styles.checkoutFoot}><div><small>{pendingPrice ? "Some prices will be confirmed before fulfilment" : "Total incl VAT"}</small><strong>{money(cartTotal)}</strong></div><button disabled={submitting || data?.settings.orders_enabled === false}>{submitting ? "Submitting…" : "Place order"}</button></div>
          </form>
        </div>
      )}

      <footer className={styles.footer}><span>PowerBuild Group online ordering</span><div>{data?.settings.support_whatsapp && <a href={`https://wa.me/${data.settings.support_whatsapp.replace(/\D/g, "")}`}>WhatsApp support</a>}{data?.settings.support_email && <a href={`mailto:${data.settings.support_email}`}>Email support</a>}</div></footer>
    </main>
  );
}
