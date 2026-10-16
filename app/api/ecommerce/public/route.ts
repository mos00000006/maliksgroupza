import { env } from "cloudflare:workers";
import {
  boolSetting,
  makeOrderNumber,
  money,
  publicProductImage,
  readEcommerceSettings,
} from "../shared";

type PublicOrderLine = { product_id?: number; quantity?: number };
type PublicPayload = Record<string, unknown> & { lines?: PublicOrderLine[] };

function text(value: unknown) {
  return String(value ?? "").trim();
}

function cookieValue(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

async function approvedTradeFromCookie(req: Request) {
  const raw = cookieValue(req, "pb_b2b_session");
  const [idText, code] = raw.split(":");
  const id = Number(idText || 0);
  if (!id || !code) return null;
  return env.DB.prepare(
    `SELECT id,company_name,contact_name,email,whatsapp,vat_number,customer_code,credit_terms,pricing_tier,status
     FROM ecommerce_b2b_customers WHERE id=? AND portal_code=? AND status='Approved'`,
  ).bind(id, code).first<Record<string, unknown>>();
}

async function publicSpecials() {
  try {
    const specials = await env.DB.prepare(
      `SELECT id,title,description,start_date,end_date,all_branches,workspaces_json
       FROM store_specials
       WHERE active=1 AND start_date<=date('now') AND end_date>=date('now')
       ORDER BY start_date DESC,id DESC LIMIT 8`,
    ).all<Record<string, unknown>>();
    if (!specials.results.length) return [];
    const ids = specials.results.map((row) => Number(row.id)).filter(Boolean);
    const placeholders = ids.map(() => "?").join(",");
    const images = placeholders
      ? await env.DB.prepare(
          `SELECT id,special_id,sort_order FROM store_special_images
           WHERE special_id IN (${placeholders}) ORDER BY special_id,sort_order,id`,
        )
          .bind(...ids)
          .all<{ id: number; special_id: number; sort_order: number }>()
      : { results: [] as Array<{ id: number; special_id: number; sort_order: number }> };
    const bySpecial = new Map<number, Array<{ id: number; url: string }>>();
    for (const image of images.results) {
      const list = bySpecial.get(image.special_id) || [];
      list.push({ id: image.id, url: `/api/ecommerce/special-image/${image.id}` });
      bySpecial.set(image.special_id, list);
    }
    return specials.results.map((special) => ({
      ...special,
      images: bySpecial.get(Number(special.id)) || [],
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel")?.toUpperCase() === "B2B" ? "B2B" : "B2C";
  const tradeAccount = channel === "B2B" ? await approvedTradeFromCookie(req) : null;
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(48, Math.max(8, Number.parseInt(url.searchParams.get("pageSize") || "24", 10) || 24));
  const q = text(url.searchParams.get("q")).toLowerCase();
  const category = text(url.searchParams.get("category"));
  const offset = (page - 1) * pageSize;
  const enabledColumn = channel === "B2B" ? "e.b2b_enabled" : "e.b2c_enabled";
  const clauses = ["p.active=1", `${enabledColumn}=1`];
  const binds: Array<string | number> = [];
  if (q) {
    clauses.push("(lower(p.name) LIKE ? OR lower(p.code) LIKE ? OR lower(p.description) LIKE ? OR lower(p.category) LIKE ?)");
    const like = `%${q}%`;
    binds.push(like, like, like, like);
  }
  if (category) {
    clauses.push("p.category=?");
    binds.push(category);
  }
  const where = clauses.join(" AND ");

  const [settings, count, categories, branches, specials] = await Promise.all([
    readEcommerceSettings(),
    env.DB.prepare(
      `SELECT COUNT(*) AS total FROM catalogue_products p JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id WHERE ${where}`,
    ).bind(...binds).first<{ total: number }>(),
    env.DB.prepare(
      `SELECT DISTINCT p.category AS category
       FROM catalogue_products p JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id
       WHERE p.active=1 AND ${enabledColumn}=1 AND p.category<>'' ORDER BY p.category`,
    ).all<{ category: string }>(),
    env.DB.prepare(
      "SELECT name FROM workspaces WHERE active=1 AND type='Store' ORDER BY name",
    ).all<{ name: string }>().catch(() => ({ results: [] as Array<{ name: string }> })),
    publicSpecials(),
  ]);

  const products = await env.DB.prepare(
    `SELECT p.*,e.b2c_enabled,e.b2b_enabled,e.retail_price_inc_vat,e.wholesale_price_ex_vat,
            e.b2b_min_qty,e.unit,e.stock_status,e.featured,e.sort_order
     FROM catalogue_products p
     JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id
     WHERE ${where}
     ORDER BY e.featured DESC,e.sort_order,p.name
     LIMIT ? OFFSET ?`,
  )
    .bind(...binds, pageSize, offset)
    .all<Record<string, unknown>>();

  const total = Number(count?.total || 0);
  return Response.json({
    channel,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    total,
    products: products.results.map((row) => ({
      id: Number(row.id),
      code: String(row.code || ""),
      name: String(row.name || ""),
      description: String(row.description || ""),
      category: String(row.category || "General"),
      image_url: publicProductImage(row),
      stock_status: String(row.stock_status || "Available"),
      featured: Number(row.featured || 0) === 1,
      unit: String(row.unit || "EA"),
      min_qty: channel === "B2B" ? Math.max(1, Number(row.b2b_min_qty || 1)) : 1,
      price:
        channel === "B2B"
          ? tradeAccount ? money(row.wholesale_price_ex_vat) : 0
          : money(row.retail_price_inc_vat),
      price_basis: channel === "B2B" ? "ex VAT" : "incl VAT",
      price_locked: channel === "B2B" && !tradeAccount,
    })),
    categories: categories.results.map((row) => row.category),
    branches: branches.results.map((row) => row.name),
    specials,
    trade_account: tradeAccount ? {
      id: Number(tradeAccount.id),
      company_name: String(tradeAccount.company_name || ""),
      contact_name: String(tradeAccount.contact_name || ""),
      email: String(tradeAccount.email || ""),
      whatsapp: String(tradeAccount.whatsapp || ""),
      customer_code: String(tradeAccount.customer_code || ""),
      credit_terms: String(tradeAccount.credit_terms || ""),
      pricing_tier: String(tradeAccount.pricing_tier || ""),
    } : null,
    settings: {
      store_name: settings[channel === "B2B" ? "b2b_store_name" : "b2c_store_name"] || (channel === "B2B" ? "PowerBuild Wholesale Online" : "PowerBuild Online"),
      support_email: settings.support_email || "",
      support_whatsapp: settings.support_whatsapp || "",
      vat_rate: money(settings.vat_rate || "15"),
      orders_enabled: boolSetting(settings[channel === "B2B" ? "b2b_orders_enabled" : "b2c_orders_enabled"], true),
    },
  });
}

export async function POST(req: Request) {
  const payload = (await req.json()) as PublicPayload;
  const action = text(payload.action || "order");

  if (action === "logout_b2b") {
    return Response.json({ ok: true }, {
      headers: { "set-cookie": "pb_b2b_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" },
    });
  }

  if (action === "lookup_order") {
    const orderNumber = text(payload.order_number).toUpperCase();
    const email = text(payload.email).toLowerCase();
    if (!orderNumber || !email)
      return Response.json({ error: "Order number and customer email are required." }, { status: 400 });
    const order = await env.DB.prepare(
      `SELECT id,order_number,channel,customer_name,company_name,customer_email,branch_workspace,fulfilment_type,status,pricing_status,total_inc_vat,created_at,updated_at
       FROM ecommerce_orders WHERE upper(order_number)=? AND lower(customer_email)=?`,
    ).bind(orderNumber, email).first<Record<string, unknown>>();
    if (!order) return Response.json({ error: "Order not found for that email address." }, { status: 404 });
    const lines = await env.DB.prepare(
      `SELECT product_code,product_name,quantity,unit,line_total_inc_vat,price_pending
       FROM ecommerce_order_lines WHERE order_id=? ORDER BY line_no,id`,
    ).bind(Number(order.id)).all<Record<string, unknown>>();
    return Response.json({ order: { ...order, lines: lines.results } });
  }

  if (action === "register_b2b") {
    const companyName = text(payload.company_name);
    const contactName = text(payload.contact_name);
    const email = text(payload.email).toLowerCase();
    if (!companyName || !contactName || !email)
      return Response.json({ error: "Company name, contact name and email are required." }, { status: 400 });
    const now = new Date().toISOString();
    const existing = await env.DB.prepare(
      "SELECT id,status FROM ecommerce_b2b_customers WHERE lower(email)=?",
    ).bind(email).first<{ id: number; status: string }>();
    if (existing?.status === "Approved")
      return Response.json({ error: "This email already has an approved trade account. Use your trade access code to order." }, { status: 409 });
    if (existing) {
      await env.DB.prepare(
        `UPDATE ecommerce_b2b_customers SET company_name=?,trading_name=?,contact_name=?,whatsapp=?,vat_number=?,registration_number=?,delivery_address=?,status='Pending',updated_at=? WHERE id=?`,
      ).bind(
        companyName,
        text(payload.trading_name),
        contactName,
        text(payload.whatsapp),
        text(payload.vat_number),
        text(payload.registration_number),
        text(payload.delivery_address),
        now,
        existing.id,
      ).run();
      return Response.json({ ok: true, status: "Pending", message: "Your trade account application has been updated and is awaiting approval." });
    }
    await env.DB.prepare(
      `INSERT INTO ecommerce_b2b_customers
       (company_name,trading_name,contact_name,email,whatsapp,vat_number,registration_number,delivery_address,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,'Pending',?,?)`,
    ).bind(
      companyName,
      text(payload.trading_name),
      contactName,
      email,
      text(payload.whatsapp),
      text(payload.vat_number),
      text(payload.registration_number),
      text(payload.delivery_address),
      now,
      now,
    ).run();
    return Response.json({ ok: true, status: "Pending", message: "Trade account application submitted for Head Office approval." }, { status: 201 });
  }

  if (action === "verify_b2b") {
    const email = text(payload.email).toLowerCase();
    const code = text(payload.portal_code);
    const customer = await env.DB.prepare(
      `SELECT id,company_name,contact_name,email,whatsapp,customer_code,credit_terms,pricing_tier,status
       FROM ecommerce_b2b_customers WHERE lower(email)=? AND portal_code=? AND status='Approved'`,
    ).bind(email, code).first<Record<string, unknown>>();
    if (!customer) return Response.json({ approved: false, error: "Trade account email or access code is incorrect, or the account is not yet approved." }, { status: 403 });
    return Response.json({ approved: true, customer }, {
      headers: {
        "set-cookie": `pb_b2b_session=${encodeURIComponent(`${String(customer.id)}:${code}`)}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  const channel = text(payload.channel).toUpperCase() === "B2B" ? "B2B" : "B2C";
  const customerName = text(payload.customer_name);
  const customerEmail = text(payload.customer_email).toLowerCase();
  const lines = Array.isArray(payload.lines) ? payload.lines : [];
  if (!customerName || !customerEmail || !lines.length)
    return Response.json({ error: "Customer name, email and at least one product are required." }, { status: 400 });

  const settings = await readEcommerceSettings();
  if (!boolSetting(settings[channel === "B2B" ? "b2b_orders_enabled" : "b2c_orders_enabled"], true))
    return Response.json({ error: "Online ordering is temporarily unavailable for this store." }, { status: 503 });
  const vatRate = money(settings.vat_rate || "15") / 100;

  let b2bCustomerId = 0;
  let companyName = text(payload.company_name);
  let vatNumber = text(payload.vat_number);
  if (channel === "B2B") {
    const cookieCustomer = await approvedTradeFromCookie(req);
    let customer: { id: number; company_name: string; vat_number: string; email: string } | null = cookieCustomer
      ? { id: Number(cookieCustomer.id), company_name: String(cookieCustomer.company_name || ""), vat_number: String(cookieCustomer.vat_number || ""), email: String(cookieCustomer.email || "") }
      : null;
    if (!customer) {
      const tradeEmail = text(payload.trade_email || customerEmail).toLowerCase();
      const tradeCode = text(payload.trade_code);
      customer = await env.DB.prepare(
        `SELECT id,company_name,vat_number,email FROM ecommerce_b2b_customers
         WHERE lower(email)=? AND portal_code=? AND status='Approved'`,
      ).bind(tradeEmail, tradeCode).first<{ id: number; company_name: string; vat_number: string; email: string }>();
    }
    if (!customer)
      return Response.json({ error: "An approved B2B trade account and valid access code are required before placing a wholesale order." }, { status: 403 });
    b2bCustomerId = customer.id;
    companyName = customer.company_name;
    vatNumber = customer.vat_number;
  }

  const ids = Array.from(new Set(lines.map((line) => Number(line.product_id || 0)).filter((id) => id > 0)));
  if (!ids.length) return Response.json({ error: "No valid products were supplied." }, { status: 400 });
  const placeholders = ids.map(() => "?").join(",");
  const enabledColumn = channel === "B2B" ? "e.b2b_enabled" : "e.b2c_enabled";
  const productRows = await env.DB.prepare(
    `SELECT p.id,p.code,p.name,p.category,e.retail_price_inc_vat,e.wholesale_price_ex_vat,e.b2b_min_qty,e.unit
     FROM catalogue_products p JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id
     WHERE p.active=1 AND ${enabledColumn}=1 AND p.id IN (${placeholders})`,
  ).bind(...ids).all<Record<string, unknown>>();
  const byId = new Map(productRows.results.map((row) => [Number(row.id), row]));

  let subtotalExVat = 0;
  let vatAmount = 0;
  let totalIncVat = 0;
  let pricePending = false;
  const prepared: Array<Record<string, unknown>> = [];
  for (const [index, line] of lines.entries()) {
    const productId = Number(line.product_id || 0);
    const row = byId.get(productId);
    if (!row) return Response.json({ error: "One or more products are no longer available online." }, { status: 409 });
    const requested = Math.max(0, Number(line.quantity || 0));
    const minQty = channel === "B2B" ? Math.max(1, Number(row.b2b_min_qty || 1)) : 1;
    if (!Number.isFinite(requested) || requested < minQty)
      return Response.json({ error: `${String(row.name)} requires a minimum quantity of ${minQty}.` }, { status: 400 });
    const unitInc = channel === "B2B"
      ? money(row.wholesale_price_ex_vat) * (1 + vatRate)
      : money(row.retail_price_inc_vat);
    const unitEx = channel === "B2B"
      ? money(row.wholesale_price_ex_vat)
      : vatRate >= 0 ? unitInc / (1 + vatRate) : unitInc;
    const pending = unitInc <= 0;
    pricePending ||= pending;
    const lineEx = unitEx * requested;
    const lineInc = unitInc * requested;
    subtotalExVat += lineEx;
    totalIncVat += lineInc;
    vatAmount += Math.max(0, lineInc - lineEx);
    prepared.push({
      line_no: index + 1,
      catalogue_product_id: productId,
      product_code: String(row.code || ""),
      product_name: String(row.name || ""),
      category: String(row.category || ""),
      quantity: requested,
      unit: String(row.unit || "EA"),
      unit_price_ex_vat: unitEx,
      unit_price_inc_vat: unitInc,
      line_total_inc_vat: lineInc,
      price_pending: pending ? 1 : 0,
    });
  }

  const now = new Date().toISOString();
  const orderNumber = makeOrderNumber(channel);
  const status = pricePending ? "Awaiting Pricing" : "New";
  const result = await env.DB.prepare(
    `INSERT INTO ecommerce_orders
     (order_number,channel,customer_name,company_name,customer_email,customer_whatsapp,vat_number,b2b_customer_id,branch_workspace,fulfilment_type,delivery_address,customer_po,payment_method,status,pricing_status,subtotal_ex_vat,vat_amount,total_inc_vat,notes,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(
    orderNumber,
    channel,
    customerName,
    companyName,
    customerEmail,
    text(payload.customer_whatsapp),
    vatNumber,
    b2bCustomerId,
    text(payload.branch_workspace),
    text(payload.fulfilment_type || "Collection"),
    text(payload.delivery_address),
    text(payload.customer_po),
    text(payload.payment_method),
    status,
    pricePending ? "Price Pending" : "Priced",
    subtotalExVat,
    vatAmount,
    totalIncVat,
    text(payload.notes),
    now,
    now,
  ).run();
  const orderId = Number(result.meta?.last_row_id || 0);
  if (!orderId) return Response.json({ error: "The order could not be created." }, { status: 500 });
  await env.DB.batch([
    ...prepared.map((line) => env.DB.prepare(
      `INSERT INTO ecommerce_order_lines
       (order_id,line_no,catalogue_product_id,product_code,product_name,category,quantity,unit,unit_price_ex_vat,unit_price_inc_vat,line_total_inc_vat,price_pending)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      orderId,line.line_no,line.catalogue_product_id,line.product_code,line.product_name,line.category,line.quantity,line.unit,line.unit_price_ex_vat,line.unit_price_inc_vat,line.line_total_inc_vat,line.price_pending,
    )),
    env.DB.prepare(
      "INSERT INTO ecommerce_order_events (order_id,status,message,actor_email,created_at) VALUES (?,?,?,?,?)",
    ).bind(orderId,status,`${channel} online order submitted by customer.`,customerEmail,now),
  ]);
  return Response.json({
    ok: true,
    order_number: orderNumber,
    status,
    pricing_status: pricePending ? "Price Pending" : "Priced",
    subtotal_ex_vat: Number(subtotalExVat.toFixed(2)),
    vat_amount: Number(vatAmount.toFixed(2)),
    total_inc_vat: Number(totalIncVat.toFixed(2)),
  }, { status: 201 });
}
