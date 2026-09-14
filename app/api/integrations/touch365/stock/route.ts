import { env } from "cloudflare:workers";
import {
  initTouch365StockTables,
  touch365SyncAuthorised,
  type Touch365StockItem,
} from "../shared";

type SyncPayload = {
  store?: string;
  workspace?: string;
  mode?: "delta" | "snapshot";
  occurred_at?: string;
  items?: Array<{ code?: string; product_code?: string; on_hand?: number | string }>;
};

function normaliseItems(items: SyncPayload["items"]): Touch365StockItem[] {
  if (!Array.isArray(items)) return [];
  const unique = new Map<string, number>();
  for (const item of items) {
    const code = String(item?.code || item?.product_code || "").trim();
    const onHand = Number(item?.on_hand);
    if (!code || !Number.isFinite(onHand)) continue;
    unique.set(code.toUpperCase(), onHand);
  }
  return Array.from(unique, ([code, on_hand]) => ({ code, on_hand }));
}

export async function POST(request: Request) {
  if (!touch365SyncAuthorised(request)) {
    return Response.json({ error: "Touch365 sync authentication failed." }, { status: 401 });
  }

  await initTouch365StockTables();
  let payload: SyncPayload;
  try {
    payload = (await request.json()) as SyncPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const workspace = String(payload.store || payload.workspace || "").trim();
  if (!workspace) return Response.json({ error: "Store/workspace is required." }, { status: 400 });

  const items = normaliseItems(payload.items);
  if (!items.length) return Response.json({ error: "At least one valid stock item is required." }, { status: 400 });
  if (items.length > 5000) return Response.json({ error: "Maximum 5000 stock items per sync request." }, { status: 413 });

  const workspaceRow = await env.DB.prepare(
    "SELECT name FROM workspaces WHERE active=1 AND lower(name)=lower(?)",
  )
    .bind(workspace)
    .first<{ name: string }>();
  if (!workspaceRow?.name) {
    return Response.json({ error: `Unknown Hub workspace: ${workspace}` }, { status: 404 });
  }

  const canonicalWorkspace = workspaceRow.name;
  const mode = payload.mode === "snapshot" ? "snapshot" : "delta";
  const updatedAt = payload.occurred_at && !Number.isNaN(Date.parse(payload.occurred_at))
    ? new Date(payload.occurred_at).toISOString()
    : new Date().toISOString();

  if (mode === "snapshot") {
    await env.DB.prepare("DELETE FROM touch365_stock_on_hand WHERE workspace=?")
      .bind(canonicalWorkspace)
      .run();
  }

  for (let offset = 0; offset < items.length; offset += 50) {
    const batch = items.slice(offset, offset + 50).map((item) =>
      env.DB.prepare(
        `INSERT INTO touch365_stock_on_hand (workspace,product_code,on_hand,source,updated_at)
         VALUES (?,?,?,'TOUCH365',?)
         ON CONFLICT(workspace,product_code) DO UPDATE SET
           on_hand=excluded.on_hand,
           source='TOUCH365',
           updated_at=excluded.updated_at`,
      ).bind(canonicalWorkspace, item.code, item.on_hand, updatedAt),
    );
    await env.DB.batch(batch);
  }

  await env.DB.prepare(
    `INSERT INTO touch365_stock_sync_status (workspace,last_synced_at,record_count,sync_mode,source)
     VALUES (?,?,?,?,'TOUCH365')
     ON CONFLICT(workspace) DO UPDATE SET
       last_synced_at=excluded.last_synced_at,
       record_count=excluded.record_count,
       sync_mode=excluded.sync_mode,
       source='TOUCH365'`,
  )
    .bind(canonicalWorkspace, updatedAt, items.length, mode)
    .run();

  return Response.json({
    ok: true,
    workspace: canonicalWorkspace,
    updated: items.length,
    mode,
    updated_at: updatedAt,
  });
}

export async function GET(request: Request) {
  if (!touch365SyncAuthorised(request)) {
    return Response.json({ error: "Touch365 sync authentication failed." }, { status: 401 });
  }
  await initTouch365StockTables();
  const { results } = await env.DB.prepare(
    "SELECT workspace,last_synced_at,record_count,sync_mode,source FROM touch365_stock_sync_status ORDER BY workspace",
  ).all();
  return Response.json({ stores: results });
}
