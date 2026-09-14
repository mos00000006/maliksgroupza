import { env } from "cloudflare:workers";

export type Touch365StockItem = {
  code: string;
  on_hand: number;
};

export async function initTouch365StockTables() {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS touch365_stock_on_hand (
        workspace TEXT NOT NULL,
        product_code TEXT NOT NULL,
        on_hand REAL NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'TOUCH365',
        updated_at TEXT NOT NULL,
        PRIMARY KEY (workspace, product_code)
      )`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS touch365_stock_sync_status (
        workspace TEXT PRIMARY KEY,
        last_synced_at TEXT NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 0,
        sync_mode TEXT NOT NULL DEFAULT 'delta',
        source TEXT NOT NULL DEFAULT 'TOUCH365'
      )`,
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS touch365_stock_code_idx ON touch365_stock_on_hand (product_code, workspace)",
    ),
  ]);
}

export function touch365SyncAuthorised(request: Request) {
  const expected = String(env.TOUCH365_SYNC_SECRET || "").trim();
  if (!expected) return false;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
  const header = request.headers.get("x-touch365-sync-secret")?.trim() || "";
  return bearer === expected || header === expected;
}
