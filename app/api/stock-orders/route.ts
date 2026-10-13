import { env } from "cloudflare:workers";
import {
  allowedWorkspaces,
  BUYER_ROLE,
  BRANCH_STOCK_ROLE,
  canAccessStockOrders,
  canReviewStockOrders,
  canWrite,
  getHubMember,
} from "../access";

type Row = Record<string, string | number | null>;
type LineInput = {
  id?: number;
  catalogue_product_id?: number;
  product_code?: string;
  description?: string;
  category?: string;
  quantity_requested?: number;
  quantity_confirmed?: number;
  quantity_dispatched?: number;
  unit?: string;
  branch_notes?: string;
  warehouse_notes?: string;
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

function isFullStockUser(member: NonNullable<Awaited<ReturnType<typeof getHubMember>>>) {
  return Boolean(
    member.role === BUYER_ROLE ||
      member.role === "Owner / Admin" ||
      member.role === "Developer / Technical Admin" ||
      (member.role === "Executive / EXCO" && member.access_scope === "Full company"),
  );
}

function parseAllowed(member: NonNullable<Awaited<ReturnType<typeof getHubMember>>>) {
  const allowed = allowedWorkspaces(member);
  return allowed === null ? null : allowed.map((value) => value.trim()).filter(Boolean);
}

function rowAllowed(member: NonNullable<Awaited<ReturnType<typeof getHubMember>>>, row: Row) {
  if (isFullStockUser(member)) return true;
  const allowed = parseAllowed(member) || [];
  return allowed.some((name) => name.toLowerCase() === clean(row.branch_workspace).toLowerCase());
}

async function orderById(id: number) {
  return env.DB.prepare("SELECT * FROM branch_stock_orders WHERE id=?").bind(id).first<Row>();
}
async function linesForOrder(id: number) {
  const { results } = await env.DB.prepare("SELECT * FROM branch_stock_order_lines WHERE order_id=? ORDER BY line_no,id").bind(id).all<Row>();
  return results;
}
async function orderResponse(row: Row) {
  return { ...row, lines: await linesForOrder(Number(row.id)) };
}

function normaliseLines(input: unknown) {
  const lines = Array.isArray(input) ? (input as LineInput[]) : [];
  const valid = lines
    .map((line, index) => {
      const description = clean(line.description);
      const requested = Math.max(0, numberValue(line.quantity_requested));
      if (!description || requested <= 0) return null;
      return {
        line_no: index + 1,
        catalogue_product_id: Math.max(0, Math.round(numberValue(line.catalogue_product_id))),
        product_code: clean(line.product_code),
        description,
        category: clean(line.category),
        quantity_requested: requested,
        quantity_confirmed: Math.max(0, numberValue(line.quantity_confirmed)),
        quantity_dispatched: Math.max(0, numberValue(line.quantity_dispatched)),
        unit: clean(line.unit) || "EA",
        branch_notes: clean(line.branch_notes),
        warehouse_notes: clean(line.warehouse_notes),
      };
    })
    .filter(Boolean) as Array<Record<string, string | number>>;
  if (!valid.length) throw new Error("Add at least one product with a quantity greater than zero.");
  return valid;
}

async function saveLines(orderId: number, lines: Array<Record<string, string | number>>) {
  await env.DB.prepare("DELETE FROM branch_stock_order_lines WHERE order_id=?").bind(orderId).run();
  await env.DB.batch(
    lines.map((line) =>
      env.DB.prepare(
        `INSERT INTO branch_stock_order_lines
         (order_id,line_no,catalogue_product_id,product_code,description,category,quantity_requested,quantity_confirmed,quantity_dispatched,unit,branch_notes,warehouse_notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        orderId,
        line.line_no,
        line.catalogue_product_id,
        line.product_code,
        line.description,
        line.category,
        line.quantity_requested,
        line.quantity_confirmed,
        line.quantity_dispatched,
        line.unit,
        line.branch_notes,
        line.warehouse_notes,
      ),
    ),
  );
}

function isRetailBranch(row: Row) {
  const text = `${clean(row.name)} ${clean(row.type)}`;
  return !/(head\s*office|wholesale|distribution\s*centre|distribution\s*center|\bdc\b|developments?|buyer workspace)/i.test(text);
}

export async function GET() {
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member || !canAccessStockOrders(member)) return Response.json({ error: "Stock Orders access required." }, { status: 403 });

  const [orderRows, workspaceRows] = await Promise.all([
    env.DB.prepare("SELECT * FROM branch_stock_orders ORDER BY updated_at DESC,id DESC").all<Row>(),
    env.DB.prepare("SELECT id,name,type,region,manager FROM workspaces WHERE active=1 ORDER BY name").all<Row>(),
  ]);
  const visibleRows = orderRows.results.filter((row) => rowAllowed(member, row));
  const orders = await Promise.all(visibleRows.map(orderResponse));
  const allBranches = workspaceRows.results.filter(isRetailBranch);
  const allowed = parseAllowed(member);
  const branches = isFullStockUser(member) || allowed === null
    ? allBranches
    : allBranches.filter((row) => allowed.some((name) => name.toLowerCase() === clean(row.name).toLowerCase()));

  return Response.json({
    orders,
    branches,
    currentBranch: branches.length === 1 ? clean(branches[0].name) : "",
    permissions: {
      canReview: canReviewStockOrders(member),
      canCreate: canWrite(member) && (member.role === BRANCH_STOCK_ROLE || !canReviewStockOrders(member) || isFullStockUser(member)),
      fullAccess: isFullStockUser(member),
      branchOnly: member.role === BRANCH_STOCK_ROLE,
    },
  });
}

export async function POST(req: Request) {
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member || !canAccessStockOrders(member)) return Response.json({ error: "Stock Orders access required." }, { status: 403 });
  if (!canWrite(member)) return Response.json({ error: "Stock Orders are read only for this account." }, { status: 403 });

  const payload = (await req.json()) as Record<string, unknown>;
  const action = clean(payload.action);
  const now = new Date().toISOString();

  try {
    if (action === "saveOrder") {
      const draft = (payload.order || {}) as Record<string, unknown>;
      const id = Math.max(0, Math.round(numberValue(draft.id)));
      let branch = clean(draft.branch_workspace);
      const allowed = parseAllowed(member);
      if (!isFullStockUser(member)) {
        const match = (allowed || []).find((name) => name.toLowerCase() === branch.toLowerCase());
        branch = match || (allowed || [])[0] || "";
      } else if (branch) {
        const validBranch = await env.DB.prepare("SELECT id,name,type FROM workspaces WHERE active=1 AND lower(name)=lower(?) LIMIT 1").bind(branch).first<Row>();
        if (!validBranch || !isRetailBranch(validBranch)) return Response.json({ error: "Select a valid retail branch for this stock order." }, { status: 400 });
        branch = clean(validBranch.name);
      }
      if (!branch) return Response.json({ error: "Select the branch placing the stock order." }, { status: 400 });
      const lines = normaliseLines(draft.lines);
      const priority = ["Low", "Normal", "High", "Urgent"].includes(clean(draft.priority)) ? clean(draft.priority) : "Normal";

      if (id) {
        const existing = await orderById(id);
        if (!existing || !rowAllowed(member, existing)) return Response.json({ error: "Stock order not found or access denied." }, { status: 404 });
        if (!isFullStockUser(member) && !["Draft", "Returned"].includes(clean(existing.status)))
          return Response.json({ error: "This order was already sent to the warehouse and can no longer be edited." }, { status: 409 });
        await env.DB.prepare(
          `UPDATE branch_stock_orders SET branch_workspace=?,order_date=?,required_date=?,priority=?,branch_notes=?,updated_at=? WHERE id=?`,
        ).bind(branch, clean(draft.order_date) || today(), clean(draft.required_date), priority, clean(draft.branch_notes), now, id).run();
        await saveLines(id, lines);
        const updated = await orderById(id);
        return Response.json({ order: updated ? await orderResponse(updated) : null });
      }

      const provisional = `TEMP-${crypto.randomUUID()}`;
      const inserted = await env.DB.prepare(
        `INSERT INTO branch_stock_orders
         (stock_order_number,branch_workspace,requested_by_email,requested_by_name,order_date,required_date,priority,status,branch_notes,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,'Draft',?,?,?)`,
      ).bind(provisional, branch, member.email, member.name, clean(draft.order_date) || today(), clean(draft.required_date), priority, clean(draft.branch_notes), now, now).run();
      const orderId = Number(inserted.meta?.last_row_id || 0);
      if (!orderId) throw new Error("Stock order number could not be created.");
      const number = `PB-SO-${today().slice(0, 4)}-${String(orderId).padStart(5, "0")}`;
      await saveLines(orderId, lines);
      await env.DB.prepare("UPDATE branch_stock_orders SET stock_order_number=?,updated_at=? WHERE id=?").bind(number, now, orderId).run();
      const row = await orderById(orderId);
      return Response.json({ order: row ? await orderResponse(row) : null }, { status: 201 });
    }

    const id = Math.max(0, Math.round(numberValue(payload.id)));
    const order = id ? await orderById(id) : null;
    if (["submitOrder", "markReview", "confirmOrder", "setStatus", "acknowledgeReceipt", "deleteOrder"].includes(action)) {
      if (!order || !rowAllowed(member, order)) return Response.json({ error: "Stock order not found or access denied." }, { status: 404 });

      if (action === "submitOrder") {
        if (!["Draft", "Returned"].includes(clean(order.status))) return Response.json({ error: "Only draft or returned orders can be sent." }, { status: 409 });
        await env.DB.prepare("UPDATE branch_stock_orders SET status='Sent to Warehouse',sent_at=?,updated_at=? WHERE id=?").bind(now, now, id).run();
      } else if (action === "markReview") {
        if (!canReviewStockOrders(member)) return Response.json({ error: "Buyer or full-company access required." }, { status: 403 });
        await env.DB.prepare("UPDATE branch_stock_orders SET status='Under Review',buyer_email=?,buyer_name=?,updated_at=? WHERE id=?").bind(member.email, member.name, now, id).run();
      } else if (action === "confirmOrder") {
        if (!canReviewStockOrders(member)) return Response.json({ error: "Buyer or full-company access required." }, { status: 403 });
        const updates = Array.isArray(payload.lines) ? (payload.lines as Array<Record<string, unknown>>) : [];
        const currentLines = await linesForOrder(id);
        const statements = currentLines.map((line) => {
          const update = updates.find((item) => Number(item.id) === Number(line.id));
          const confirmed = Math.max(0, numberValue(update?.quantity_confirmed, numberValue(line.quantity_requested)));
          const warehouseNotes = clean(update?.warehouse_notes ?? line.warehouse_notes);
          return env.DB.prepare("UPDATE branch_stock_order_lines SET quantity_confirmed=?,warehouse_notes=? WHERE id=? AND order_id=?").bind(confirmed, warehouseNotes, Number(line.id), id);
        });
        if (statements.length) await env.DB.batch(statements);
        await env.DB.prepare(
          `UPDATE branch_stock_orders SET status='Confirmed',buyer_email=?,buyer_name=?,confirmed_at=?,warehouse_notes=?,expected_delivery_date=?,updated_at=? WHERE id=?`,
        ).bind(member.email, member.name, now, clean(payload.warehouse_notes), clean(payload.expected_delivery_date), now, id).run();
      } else if (action === "setStatus") {
        if (!canReviewStockOrders(member)) return Response.json({ error: "Buyer or full-company access required." }, { status: 403 });
        const next = clean(payload.status);
        const allowedStatus = ["Under Review", "Confirmed", "Picking", "Ready for Dispatch", "Dispatched", "Part Fulfilled", "Completed", "Returned", "Cancelled"];
        if (!allowedStatus.includes(next)) return Response.json({ error: "Invalid stock order status." }, { status: 400 });
        const lineUpdates = Array.isArray(payload.lines) ? (payload.lines as Array<Record<string, unknown>>) : [];
        if (lineUpdates.length) {
          const currentLines = await linesForOrder(id);
          const statements = currentLines.flatMap((line) => {
            const update = lineUpdates.find((item) => Number(item.id) === Number(line.id));
            if (!update) return [];
            return [env.DB.prepare("UPDATE branch_stock_order_lines SET quantity_dispatched=?,warehouse_notes=? WHERE id=? AND order_id=?").bind(
              Math.max(0, numberValue(update.quantity_dispatched, numberValue(line.quantity_dispatched))),
              clean(update.warehouse_notes ?? line.warehouse_notes),
              Number(line.id),
              id,
            )];
          });
          if (statements.length) await env.DB.batch(statements);
        }
        await env.DB.prepare(
          `UPDATE branch_stock_orders SET status=?,warehouse_notes=?,expected_delivery_date=?,dispatch_reference=?,buyer_email=?,buyer_name=?,completed_at=?,updated_at=? WHERE id=?`,
        ).bind(
          next,
          clean(payload.warehouse_notes ?? order.warehouse_notes),
          clean(payload.expected_delivery_date ?? order.expected_delivery_date),
          clean(payload.dispatch_reference ?? order.dispatch_reference),
          member.email,
          member.name,
          next === "Completed" ? now : clean(order.completed_at),
          now,
          id,
        ).run();
      } else if (action === "acknowledgeReceipt") {
        if (canReviewStockOrders(member) || !["Dispatched", "Part Fulfilled", "Completed"].includes(clean(order.status)))
          return Response.json({ error: "The branch can acknowledge receipt after dispatch." }, { status: 409 });
        await env.DB.prepare("UPDATE branch_stock_orders SET status='Completed',completed_at=?,updated_at=? WHERE id=?").bind(now, now, id).run();
      } else if (action === "deleteOrder") {
        if (clean(order.status) !== "Draft") return Response.json({ error: "Only draft stock orders can be deleted." }, { status: 409 });
        await env.DB.batch([
          env.DB.prepare("DELETE FROM branch_stock_order_lines WHERE order_id=?").bind(id),
          env.DB.prepare("DELETE FROM branch_stock_orders WHERE id=?").bind(id),
        ]);
        return Response.json({ ok: true });
      }
      const updated = await orderById(id);
      return Response.json({ order: updated ? await orderResponse(updated) : null });
    }

    return Response.json({ error: "Unknown Stock Orders action." }, { status: 400 });
  } catch (error) {
    console.error("stock orders", error);
    return Response.json({ error: error instanceof Error ? error.message : "Stock Orders update failed." }, { status: 500 });
  }
}
