import { env } from "cloudflare:workers";
import {
  BUYER_ROLE,
  canAccessBuyerWorkspace,
  canApproveBuyerOrders,
  canWrite,
  getHubMember,
} from "../access";

type Row = Record<string, string | number | null>;
type OrderLineInput = {
  product_code?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  pack_size?: string;
  last_cost_ex_vat?: number;
  unit_cost_ex_vat?: number;
  notes?: string;
};

const clean = (value: unknown) => String(value ?? "").trim();
const numberValue = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const today = () => {
  const parts = new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

function parseCategories(value: unknown) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function privileged(member: Awaited<ReturnType<typeof getHubMember>>) {
  return Boolean(member && member.role !== BUYER_ROLE && canAccessBuyerWorkspace(member));
}

function orderOwnerAllowed(member: NonNullable<Awaited<ReturnType<typeof getHubMember>>>, row: Row) {
  return privileged(member) || clean(row.buyer_email).toLowerCase() === member.email.toLowerCase();
}

async function orderById(id: number) {
  return env.DB.prepare("SELECT * FROM buyer_orders WHERE id=?").bind(id).first<Row>();
}

async function orderLines(id: number) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM buyer_order_lines WHERE order_id=? ORDER BY line_no,id",
  )
    .bind(id)
    .all<Row>();
  return results;
}

function normaliseLines(input: unknown) {
  const lines = Array.isArray(input) ? (input as OrderLineInput[]) : [];
  const valid = lines
    .map((line, index) => {
      const description = clean(line.description);
      const quantity = Math.max(0, numberValue(line.quantity));
      const unitCost = Math.max(0, numberValue(line.unit_cost_ex_vat));
      const lastCost = Math.max(0, numberValue(line.last_cost_ex_vat));
      if (!description || quantity <= 0) return null;
      const variance = lastCost > 0 ? ((unitCost - lastCost) / lastCost) * 100 : 0;
      return {
        line_no: index + 1,
        product_code: clean(line.product_code),
        description,
        category: clean(line.category),
        quantity,
        unit: clean(line.unit) || "EA",
        pack_size: clean(line.pack_size),
        last_cost_ex_vat: lastCost,
        unit_cost_ex_vat: unitCost,
        price_variance_pct: variance,
        line_total_ex_vat: quantity * unitCost,
        notes: clean(line.notes),
      };
    })
    .filter(Boolean) as Array<Record<string, string | number>>;
  if (!valid.length) throw new Error("Add at least one valid order line with a quantity greater than zero.");
  return valid;
}

async function saveLines(orderId: number, valid: Array<Record<string, string | number>>) {
  await env.DB.prepare("DELETE FROM buyer_order_lines WHERE order_id=?").bind(orderId).run();
  const statements = valid.map((line) =>
    env.DB.prepare(
      `INSERT INTO buyer_order_lines
       (order_id,line_no,product_code,description,category,quantity,unit,pack_size,last_cost_ex_vat,unit_cost_ex_vat,price_variance_pct,line_total_ex_vat,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).bind(
      orderId,
      line.line_no,
      line.product_code,
      line.description,
      line.category,
      line.quantity,
      line.unit,
      line.pack_size,
      line.last_cost_ex_vat,
      line.unit_cost_ex_vat,
      line.price_variance_pct,
      line.line_total_ex_vat,
      line.notes,
    ),
  );
  await env.DB.batch(statements);
  return valid;
}

function totalsFromLines(lines: Array<Record<string, string | number>>, vatRate: number) {
  const subtotal = lines.reduce((sum, line) => sum + numberValue(line.line_total_ex_vat), 0);
  const vatAmount = subtotal * (vatRate / 100);
  return { subtotal, vatAmount, total: subtotal + vatAmount };
}

async function orderResponse(row: Row) {
  const lines = await orderLines(Number(row.id));
  return { ...row, lines };
}

export async function GET() {
  const member = await getHubMember({ allowBuyerAccess: true });
  if (!member || !canAccessBuyerWorkspace(member))
    return Response.json({ error: "Buyer Workspace access required." }, { status: 403 });

  const buyerOnly = member.role === BUYER_ROLE;
  const orderQuery = buyerOnly
    ? env.DB.prepare("SELECT * FROM buyer_orders WHERE lower(buyer_email)=? ORDER BY updated_at DESC,id DESC").bind(member.email.toLowerCase())
    : env.DB.prepare("SELECT * FROM buyer_orders ORDER BY updated_at DESC,id DESC");
  const quoteQuery = buyerOnly
    ? env.DB.prepare("SELECT * FROM buyer_quote_entries WHERE lower(buyer_email)=? ORDER BY updated_at DESC,id DESC").bind(member.email.toLowerCase())
    : env.DB.prepare("SELECT * FROM buyer_quote_entries ORDER BY updated_at DESC,id DESC");

  const [orderRows, supplierRows, quoteRows, workspaceRows] = await Promise.all([
    orderQuery.all<Row>(),
    env.DB.prepare("SELECT * FROM buyer_suppliers WHERE active=1 ORDER BY CASE supplier_type WHEN 'Preferred' THEN 0 ELSE 1 END,name").all<Row>(),
    quoteQuery.all<Row>(),
    env.DB.prepare("SELECT id,name,type,region,manager FROM workspaces WHERE active=1 AND lower(name)<>'buyer workspace' ORDER BY name").all<Row>(),
  ]);

  const orders = await Promise.all(orderRows.results.map((row: Row) => orderResponse(row)));
  return Response.json({
    orders,
    suppliers: supplierRows.results.map((row) => ({ ...row, categories: parseCategories(row.categories_json) })),
    quotes: quoteRows.results,
    workspaces: workspaceRows.results,
    permissions: {
      canApprove: canApproveBuyerOrders(member),
      canManage: canWrite(member),
      buyerOnly,
    },
  });
}

export async function POST(req: Request) {
  const member = await getHubMember({ allowBuyerAccess: true });
  if (!member || !canAccessBuyerWorkspace(member))
    return Response.json({ error: "Buyer Workspace access required." }, { status: 403 });
  if (!canWrite(member)) return Response.json({ error: "Buyer Workspace is read only for this account." }, { status: 403 });

  const payload = (await req.json()) as Record<string, unknown>;
  const action = clean(payload.action);
  const now = new Date().toISOString();

  try {
    if (action === "saveSupplier") {
      const supplier = (payload.supplier || {}) as Record<string, unknown>;
      const id = numberValue(supplier.id);
      const name = clean(supplier.name);
      if (!name) return Response.json({ error: "Supplier name is required." }, { status: 400 });
      const code = clean(supplier.supplier_code).toUpperCase();
      const categories = Array.isArray(supplier.categories)
        ? Array.from(new Set(supplier.categories.map((value) => clean(value)).filter(Boolean)))
        : [];
      if (id > 0) {
        await env.DB.prepare(
          `UPDATE buyer_suppliers SET supplier_code=?,name=?,supplier_type=?,contact_person=?,phone=?,email=?,payment_terms=?,lead_time_days=?,minimum_order=?,categories_json=?,notes=?,updated_at=? WHERE id=?`,
        )
          .bind(
            code,
            name,
            clean(supplier.supplier_type) || "Preferred",
            clean(supplier.contact_person),
            clean(supplier.phone),
            clean(supplier.email),
            clean(supplier.payment_terms),
            Math.max(0, Math.round(numberValue(supplier.lead_time_days))),
            Math.max(0, numberValue(supplier.minimum_order)),
            JSON.stringify(categories),
            clean(supplier.notes),
            now,
            id,
          )
          .run();
      } else {
        await env.DB.prepare(
          `INSERT INTO buyer_suppliers
           (supplier_code,name,supplier_type,contact_person,phone,email,payment_terms,lead_time_days,minimum_order,categories_json,notes,active,created_by,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,?)`,
        )
          .bind(
            code,
            name,
            clean(supplier.supplier_type) || "Preferred",
            clean(supplier.contact_person),
            clean(supplier.phone),
            clean(supplier.email),
            clean(supplier.payment_terms),
            Math.max(0, Math.round(numberValue(supplier.lead_time_days))),
            Math.max(0, numberValue(supplier.minimum_order)),
            JSON.stringify(categories),
            clean(supplier.notes),
            member.email,
            now,
            now,
          )
          .run();
      }
      return Response.json({ ok: true });
    }

    if (action === "archiveSupplier") {
      const id = numberValue(payload.id);
      if (!id) return Response.json({ error: "Supplier is required." }, { status: 400 });
      await env.DB.prepare("UPDATE buyer_suppliers SET active=0,updated_at=? WHERE id=?").bind(now, id).run();
      return Response.json({ ok: true });
    }

    if (action === "saveOrder") {
      const order = (payload.order || {}) as Record<string, unknown>;
      const id = numberValue(order.id);
      const supplierId = numberValue(order.supplier_id);
      const supplier = supplierId
        ? await env.DB.prepare("SELECT id,name FROM buyer_suppliers WHERE id=? AND active=1").bind(supplierId).first<Row>()
        : null;
      const supplierName = clean(supplier?.name || order.supplier_name);
      if (!supplierName) return Response.json({ error: "Select a supplier." }, { status: 400 });
      const storeWorkspace = clean(order.store_workspace);
      if (!storeWorkspace) return Response.json({ error: "Select the store or branch this order is for." }, { status: 400 });
      const vatRate = Math.max(0, numberValue(order.vat_rate, 15));
      const linesInput = Array.isArray(order.lines) ? order.lines : [];
      const preparedLines = normaliseLines(linesInput);

      if (id > 0) {
        const existing = await orderById(id);
        if (!existing || !orderOwnerAllowed(member, existing))
          return Response.json({ error: "Purchase order not found or access denied." }, { status: 404 });
        if (member.role === BUYER_ROLE && ["Ordered", "Part Received", "Received", "Cancelled"].includes(clean(existing.status)))
          return Response.json({ error: "This order can no longer be edited. Use the receiving update instead." }, { status: 409 });
        const savedLines = await saveLines(id, preparedLines);
        const totals = totalsFromLines(savedLines, vatRate);
        await env.DB.prepare(
          `UPDATE buyer_orders SET store_workspace=?,supplier_id=?,supplier_name=?,order_type=?,order_date=?,required_date=?,quote_reference=?,delivery_method=?,delivery_address=?,delivery_contact=?,subtotal=?,vat_rate=?,vat_amount=?,total=?,notes=?,updated_at=? WHERE id=?`,
        )
          .bind(
            storeWorkspace,
            supplierId,
            supplierName,
            clean(order.order_type) || "Stock Replenishment",
            clean(order.order_date) || today(),
            clean(order.required_date),
            clean(order.quote_reference),
            clean(order.delivery_method) || "Supplier Delivery",
            clean(order.delivery_address),
            clean(order.delivery_contact),
            totals.subtotal,
            vatRate,
            totals.vatAmount,
            totals.total,
            clean(order.notes),
            now,
            id,
          )
          .run();
        const row = await orderById(id);
        return Response.json({ order: row ? await orderResponse(row) : null });
      }

      const provisional = `TEMP-${crypto.randomUUID()}`;
      const inserted = await env.DB.prepare(
        `INSERT INTO buyer_orders
         (po_number,buyer_email,buyer_name,store_workspace,supplier_id,supplier_name,order_type,order_date,required_date,quote_reference,delivery_method,delivery_address,delivery_contact,status,approval_status,delivery_status,subtotal,vat_rate,vat_amount,total,notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'Draft','Draft','Not ordered',0,?,0,0,?,?,?)`,
      )
        .bind(
          provisional,
          member.email,
          member.name,
          storeWorkspace,
          supplierId,
          supplierName,
          clean(order.order_type) || "Stock Replenishment",
          clean(order.order_date) || today(),
          clean(order.required_date),
          clean(order.quote_reference),
          clean(order.delivery_method) || "Supplier Delivery",
          clean(order.delivery_address),
          clean(order.delivery_contact),
          vatRate,
          clean(order.notes),
          now,
          now,
        )
        .run();
      const orderId = Number(inserted.meta?.last_row_id || 0);
      if (!orderId) throw new Error("Purchase order number could not be created.");
      const poNumber = `PB-PO-${today().slice(0, 4)}-${String(orderId).padStart(5, "0")}`;
      const savedLines = await saveLines(orderId, preparedLines);
      const totals = totalsFromLines(savedLines, vatRate);
      await env.DB.prepare(
        "UPDATE buyer_orders SET po_number=?,subtotal=?,vat_amount=?,total=?,updated_at=? WHERE id=?",
      )
        .bind(poNumber, totals.subtotal, totals.vatAmount, totals.total, now, orderId)
        .run();
      const row = await orderById(orderId);
      return Response.json({ order: row ? await orderResponse(row) : null }, { status: 201 });
    }

    if (["submitOrder", "approveOrder", "returnOrder", "setOrderStatus", "receivingUpdate", "deleteOrder"].includes(action)) {
      const id = numberValue(payload.id);
      const order = await orderById(id);
      if (!order || !orderOwnerAllowed(member, order))
        return Response.json({ error: "Purchase order not found or access denied." }, { status: 404 });

      if (action === "submitOrder") {
        if (clean(order.status) !== "Draft" && clean(order.approval_status) !== "Returned")
          return Response.json({ error: "Only draft or returned orders can be submitted." }, { status: 409 });
        await env.DB.prepare("UPDATE buyer_orders SET status='Pending approval',approval_status='Pending approval',updated_at=? WHERE id=?")
          .bind(now, id)
          .run();
      } else if (action === "approveOrder") {
        if (!canApproveBuyerOrders(member)) return Response.json({ error: "Management approval is required." }, { status: 403 });
        await env.DB.prepare("UPDATE buyer_orders SET status='Approved',approval_status='Approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?")
          .bind(member.email, now, now, id)
          .run();
      } else if (action === "returnOrder") {
        if (!canApproveBuyerOrders(member)) return Response.json({ error: "Management approval is required." }, { status: 403 });
        await env.DB.prepare("UPDATE buyer_orders SET status='Returned',approval_status='Returned',approved_by='',approved_at='',updated_at=? WHERE id=?")
          .bind(now, id)
          .run();
      } else if (action === "setOrderStatus") {
        const next = clean(payload.status);
        const allowed = ["Ordered", "Part Received", "Received", "Cancelled"];
        if (!allowed.includes(next)) return Response.json({ error: "Invalid purchase order status." }, { status: 400 });
        if (member.role === BUYER_ROLE && clean(order.approval_status) !== "Approved" && next !== "Cancelled")
          return Response.json({ error: "The purchase order must be approved before it can be placed." }, { status: 409 });
        const deliveryStatus = next === "Ordered" ? "Awaiting delivery" : next === "Part Received" ? "Part received" : next === "Received" ? "Received" : clean(order.delivery_status);
        await env.DB.prepare("UPDATE buyer_orders SET status=?,delivery_status=?,updated_at=? WHERE id=?")
          .bind(next, deliveryStatus, now, id)
          .run();
      } else if (action === "receivingUpdate") {
        const deliveryStatus = clean(payload.delivery_status) || clean(order.delivery_status) || "Awaiting delivery";
        const status = deliveryStatus === "Received" ? "Received" : deliveryStatus === "Part received" ? "Part Received" : clean(order.status);
        await env.DB.prepare(
          `UPDATE buyer_orders SET delivery_status=?,expected_delivery_date=?,grv_number=?,invoice_number=?,receiving_notes=?,status=?,updated_at=? WHERE id=?`,
        )
          .bind(
            deliveryStatus,
            clean(payload.expected_delivery_date),
            clean(payload.grv_number),
            clean(payload.invoice_number),
            clean(payload.receiving_notes),
            status,
            now,
            id,
          )
          .run();
      } else if (action === "deleteOrder") {
        if (clean(order.status) !== "Draft" && clean(order.approval_status) !== "Returned")
          return Response.json({ error: "Only draft or returned purchase orders can be deleted." }, { status: 409 });
        await env.DB.batch([
          env.DB.prepare("DELETE FROM buyer_order_lines WHERE order_id=?").bind(id),
          env.DB.prepare("DELETE FROM buyer_orders WHERE id=?").bind(id),
        ]);
        return Response.json({ ok: true });
      }
      const updated = await orderById(id);
      return Response.json({ order: updated ? await orderResponse(updated) : null });
    }

    if (action === "saveQuote") {
      const quote = (payload.quote || {}) as Record<string, unknown>;
      const id = numberValue(quote.id);
      const description = clean(quote.description);
      const supplierId = numberValue(quote.supplier_id);
      const supplier = supplierId
        ? await env.DB.prepare("SELECT name,payment_terms,lead_time_days FROM buyer_suppliers WHERE id=? AND active=1").bind(supplierId).first<Row>()
        : null;
      const supplierName = clean(supplier?.name || quote.supplier_name);
      if (!description || !supplierName)
        return Response.json({ error: "Product description and supplier are required for a quote." }, { status: 400 });
      if (id > 0) {
        const existing = await env.DB.prepare("SELECT * FROM buyer_quote_entries WHERE id=?").bind(id).first<Row>();
        if (!existing || (!privileged(member) && clean(existing.buyer_email).toLowerCase() !== member.email.toLowerCase()))
          return Response.json({ error: "Quote not found or access denied." }, { status: 404 });
        await env.DB.prepare(
          `UPDATE buyer_quote_entries SET product_code=?,description=?,category=?,quantity=?,unit=?,supplier_id=?,supplier_name=?,quote_reference=?,quoted_unit_cost=?,valid_until=?,lead_time_days=?,payment_terms=?,selected=?,notes=?,updated_at=? WHERE id=?`,
        )
          .bind(
            clean(quote.product_code), description, clean(quote.category), Math.max(0, numberValue(quote.quantity, 1)), clean(quote.unit) || "EA",
            supplierId, supplierName, clean(quote.quote_reference), Math.max(0, numberValue(quote.quoted_unit_cost)), clean(quote.valid_until),
            Math.max(0, Math.round(numberValue(quote.lead_time_days, numberValue(supplier?.lead_time_days)))),
            clean(quote.payment_terms || supplier?.payment_terms), numberValue(quote.selected) ? 1 : 0, clean(quote.notes), now, id,
          )
          .run();
      } else {
        await env.DB.prepare(
          `INSERT INTO buyer_quote_entries
           (buyer_email,product_code,description,category,quantity,unit,supplier_id,supplier_name,quote_reference,quoted_unit_cost,valid_until,lead_time_days,payment_terms,selected,notes,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
          .bind(
            member.email, clean(quote.product_code), description, clean(quote.category), Math.max(0, numberValue(quote.quantity, 1)), clean(quote.unit) || "EA",
            supplierId, supplierName, clean(quote.quote_reference), Math.max(0, numberValue(quote.quoted_unit_cost)), clean(quote.valid_until),
            Math.max(0, Math.round(numberValue(quote.lead_time_days, numberValue(supplier?.lead_time_days)))),
            clean(quote.payment_terms || supplier?.payment_terms), numberValue(quote.selected) ? 1 : 0, clean(quote.notes), now, now,
          )
          .run();
      }
      return Response.json({ ok: true });
    }

    if (action === "deleteQuote") {
      const id = numberValue(payload.id);
      const existing = await env.DB.prepare("SELECT * FROM buyer_quote_entries WHERE id=?").bind(id).first<Row>();
      if (!existing || (!privileged(member) && clean(existing.buyer_email).toLowerCase() !== member.email.toLowerCase()))
        return Response.json({ error: "Quote not found or access denied." }, { status: 404 });
      await env.DB.prepare("DELETE FROM buyer_quote_entries WHERE id=?").bind(id).run();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown Buyer Workspace action." }, { status: 400 });
  } catch (error) {
    console.error("Buyer Workspace action failed", error);
    const message = error instanceof Error ? error.message : "Buyer Workspace action failed.";
    if (message.toLowerCase().includes("unique"))
      return Response.json({ error: "That supplier code is already in use." }, { status: 409 });
    return Response.json({ error: message }, { status: 500 });
  }
}
