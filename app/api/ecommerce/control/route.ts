import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import {
  canAccessEcommerceControl,
  makePortalCode,
  money,
  publicProductImage,
  readEcommerceSettings,
} from "../shared";

function text(value: unknown) {
  return String(value ?? "").trim();
}

async function authorised() {
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  return canAccessEcommerceControl(member) ? member : null;
}

export async function GET(req: Request) {
  const member = await authorised();
  if (!member) return Response.json({ error: "Full company access is required for E-Commerce Control." }, { status: 403 });
  const url = new URL(req.url);
  const view = text(url.searchParams.get("view") || "dashboard");

  if (view === "products") {
    const q = text(url.searchParams.get("q")).toLowerCase();
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(80, Math.max(12, Number.parseInt(url.searchParams.get("pageSize") || "36", 10) || 36));
    const offset = (page - 1) * pageSize;
    const where = q
      ? "WHERE p.active=1 AND (lower(p.name) LIKE ? OR lower(p.code) LIKE ? OR lower(p.category) LIKE ?)"
      : "WHERE p.active=1";
    const like = `%${q}%`;
    const bindValues = q ? [like, like, like] : [];
    const count = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM catalogue_products p ${where}`,
    ).bind(...bindValues).first<{ total: number }>();
    const rows = await env.DB.prepare(
      `SELECT p.id,p.code,p.name,p.description,p.category,p.image_key,p.updated_at,
              COALESCE(e.b2c_enabled,0) AS b2c_enabled,COALESCE(e.b2b_enabled,0) AS b2b_enabled,
              COALESCE(e.retail_price_inc_vat,0) AS retail_price_inc_vat,
              COALESCE(e.wholesale_price_ex_vat,0) AS wholesale_price_ex_vat,
              COALESCE(e.b2b_min_qty,1) AS b2b_min_qty,COALESCE(e.unit,'EA') AS unit,
              COALESCE(e.stock_status,'Available') AS stock_status,COALESCE(e.featured,0) AS featured,
              COALESCE(e.sort_order,0) AS sort_order
       FROM catalogue_products p LEFT JOIN ecommerce_product_settings e ON e.catalogue_product_id=p.id
       ${where}
       ORDER BY COALESCE(e.featured,0) DESC,p.name LIMIT ? OFFSET ?`,
    ).bind(...bindValues, pageSize, offset).all<Record<string, unknown>>();
    const total = Number(count?.total || 0);
    return Response.json({
      products: rows.results.map((row) => ({ ...row, image_url: publicProductImage(row) })),
      page,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      total,
    });
  }

  if (view === "orders") {
    const channel = text(url.searchParams.get("channel")).toUpperCase();
    const status = text(url.searchParams.get("status"));
    const clauses: string[] = [];
    const binds: string[] = [];
    if (["B2C", "B2B"].includes(channel)) { clauses.push("channel=?"); binds.push(channel); }
    if (status) { clauses.push("status=?"); binds.push(status); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await env.DB.prepare(
      `SELECT * FROM ecommerce_orders ${where} ORDER BY id DESC LIMIT 150`,
    ).bind(...binds).all<Record<string, unknown>>();
    const ids = rows.results.map((row) => Number(row.id)).filter(Boolean);
    const linesByOrder = new Map<number, Record<string, unknown>[]>();
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const lines = await env.DB.prepare(
        `SELECT * FROM ecommerce_order_lines WHERE order_id IN (${placeholders}) ORDER BY order_id,line_no,id`,
      ).bind(...ids).all<Record<string, unknown>>();
      for (const line of lines.results) {
        const orderId = Number(line.order_id);
        const list = linesByOrder.get(orderId) || [];
        list.push(line);
        linesByOrder.set(orderId, list);
      }
    }
    return Response.json({ orders: rows.results.map((row) => ({ ...row, lines: linesByOrder.get(Number(row.id)) || [] })) });
  }

  if (view === "customers") {
    const rows = await env.DB.prepare(
      "SELECT * FROM ecommerce_b2b_customers ORDER BY CASE status WHEN 'Pending' THEN 0 WHEN 'Approved' THEN 1 ELSE 2 END,id DESC LIMIT 200",
    ).all<Record<string, unknown>>();
    return Response.json({ customers: rows.results });
  }

  if (view === "settings") {
    return Response.json({ settings: await readEcommerceSettings() });
  }

  const [settings, b2c, b2b, pendingCustomers, newOrders] = await Promise.all([
    readEcommerceSettings(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM ecommerce_product_settings WHERE b2c_enabled=1").first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM ecommerce_product_settings WHERE b2b_enabled=1").first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM ecommerce_b2b_customers WHERE status='Pending'").first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM ecommerce_orders WHERE status IN ('New','Awaiting Pricing')").first<{ total: number }>(),
  ]);
  const recent = await env.DB.prepare(
    "SELECT id,order_number,channel,customer_name,company_name,status,total_inc_vat,created_at FROM ecommerce_orders ORDER BY id DESC LIMIT 8",
  ).all<Record<string, unknown>>();
  return Response.json({
    dashboard: {
      b2c_products: Number(b2c?.total || 0),
      b2b_products: Number(b2b?.total || 0),
      pending_customers: Number(pendingCustomers?.total || 0),
      new_orders: Number(newOrders?.total || 0),
      recent_orders: recent.results,
    },
    settings,
  });
}

export async function POST(req: Request) {
  const member = await authorised();
  if (!member) return Response.json({ error: "Full company access is required for E-Commerce Control." }, { status: 403 });
  const payload = (await req.json()) as Record<string, unknown>;
  const action = text(payload.action);
  const now = new Date().toISOString();

  if (action === "save_product") {
    const productId = Number(payload.product_id || 0);
    if (!productId) return Response.json({ error: "Product is required." }, { status: 400 });
    await env.DB.prepare(
      `INSERT INTO ecommerce_product_settings
       (catalogue_product_id,b2c_enabled,b2b_enabled,retail_price_inc_vat,wholesale_price_ex_vat,b2b_min_qty,unit,stock_status,featured,sort_order,updated_by,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(catalogue_product_id) DO UPDATE SET
         b2c_enabled=excluded.b2c_enabled,b2b_enabled=excluded.b2b_enabled,
         retail_price_inc_vat=excluded.retail_price_inc_vat,wholesale_price_ex_vat=excluded.wholesale_price_ex_vat,
         b2b_min_qty=excluded.b2b_min_qty,unit=excluded.unit,stock_status=excluded.stock_status,
         featured=excluded.featured,sort_order=excluded.sort_order,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
    ).bind(
      productId,
      payload.b2c_enabled ? 1 : 0,
      payload.b2b_enabled ? 1 : 0,
      money(payload.retail_price_inc_vat),
      money(payload.wholesale_price_ex_vat),
      Math.max(1, money(payload.b2b_min_qty || 1)),
      text(payload.unit || "EA") || "EA",
      text(payload.stock_status || "Available") || "Available",
      payload.featured ? 1 : 0,
      Number(payload.sort_order || 0) || 0,
      member.email,
      now,
    ).run();
    return Response.json({ ok: true });
  }

  if (action === "save_settings") {
    const settings = (payload.settings || {}) as Record<string, unknown>;
    const allowed = new Set(["b2c_store_name","b2b_store_name","support_email","support_whatsapp","vat_rate","b2c_orders_enabled","b2b_orders_enabled"]);
    const statements = Object.entries(settings)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => env.DB.prepare(
        `INSERT INTO ecommerce_settings (setting_key,setting_value,updated_by,updated_at) VALUES (?,?,?,?)
         ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_by=excluded.updated_by,updated_at=excluded.updated_at`,
      ).bind(key, text(value), member.email, now));
    if (statements.length) await env.DB.batch(statements);
    return Response.json({ ok: true });
  }

  if (action === "customer_status") {
    const customerId = Number(payload.customer_id || 0);
    const status = text(payload.status);
    if (!customerId || !["Approved", "Declined", "Suspended", "Pending"].includes(status))
      return Response.json({ error: "Customer and valid status are required." }, { status: 400 });
    const existing = await env.DB.prepare("SELECT portal_code FROM ecommerce_b2b_customers WHERE id=?").bind(customerId).first<{ portal_code: string }>();
    if (!existing) return Response.json({ error: "Customer not found." }, { status: 404 });
    const portalCode = status === "Approved" ? existing.portal_code || makePortalCode() : existing.portal_code || "";
    await env.DB.prepare(
      `UPDATE ecommerce_b2b_customers SET status=?,portal_code=?,approved_by=?,approved_at=?,updated_at=? WHERE id=?`,
    ).bind(
      status,
      portalCode,
      status === "Approved" ? member.email : "",
      status === "Approved" ? now : "",
      now,
      customerId,
    ).run();
    return Response.json({ ok: true, portal_code: portalCode });
  }

  if (action === "update_customer") {
    const customerId = Number(payload.customer_id || 0);
    if (!customerId) return Response.json({ error: "Customer is required." }, { status: 400 });
    await env.DB.prepare(
      `UPDATE ecommerce_b2b_customers SET customer_code=?,credit_terms=?,pricing_tier=?,notes=?,updated_at=? WHERE id=?`,
    ).bind(
      text(payload.customer_code),
      text(payload.credit_terms || "COD"),
      text(payload.pricing_tier || "Standard Wholesale"),
      text(payload.notes),
      now,
      customerId,
    ).run();
    return Response.json({ ok: true });
  }

  if (action === "order_status") {
    const orderId = Number(payload.order_id || 0);
    const status = text(payload.status);
    const allowed = ["New","Awaiting Pricing","Confirmed","Picking","Ready","Dispatched","Completed","Cancelled"];
    if (!orderId || !allowed.includes(status)) return Response.json({ error: "Order and valid status are required." }, { status: 400 });
    const found = await env.DB.prepare("SELECT id FROM ecommerce_orders WHERE id=?").bind(orderId).first();
    if (!found) return Response.json({ error: "Order not found." }, { status: 404 });
    await env.DB.batch([
      env.DB.prepare("UPDATE ecommerce_orders SET status=?,updated_at=? WHERE id=?").bind(status, now, orderId),
      env.DB.prepare("INSERT INTO ecommerce_order_events (order_id,status,message,actor_email,created_at) VALUES (?,?,?,?,?)").bind(orderId,status,text(payload.message),member.email,now),
    ]);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown e-commerce action." }, { status: 400 });
}
