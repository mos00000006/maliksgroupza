import { env } from "cloudflare:workers";
import { PREPARED_STOCK, PREPARED_STOCK_SEED_KEY } from "./prepared-stock";

export const CATALOGUE_MANAGERS = new Set([
  "moyanamoses006@icloud.com",
  "moyanamoses006@icloud",
  "msallikutti@gmail.com",
]);

export const canManageCatalogue = (email?: string | null) =>
  Boolean(email && CATALOGUE_MANAGERS.has(email.trim().toLowerCase()));

async function seedPreparedStock() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS catalogue_seed_versions (
      seed_key TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`,
  ).run();

  const applied = await env.DB.prepare(
    "SELECT seed_key FROM catalogue_seed_versions WHERE seed_key=?",
  )
    .bind(PREPARED_STOCK_SEED_KEY)
    .first<{ seed_key: string }>();
  if (applied) return;

  const now = new Date().toISOString();
  const createdBy = `system:${PREPARED_STOCK_SEED_KEY}`;
  const statements = PREPARED_STOCK.map((item) =>
    env.DB.prepare(
      `INSERT OR IGNORE INTO catalogue_products
       (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at)
       VALUES (?,?,?,?, '', '', 0, '', 1, ?, ?, ?, ?)`,
    ).bind(
      item.code,
      item.description,
      item.description,
      item.category,
      createdBy,
      now,
      createdBy,
      now,
    ),
  );

  for (let index = 0; index < statements.length; index += 50) {
    await env.DB.batch(statements.slice(index, index + 50));
  }

  await env.DB.prepare(
    "INSERT OR REPLACE INTO catalogue_seed_versions (seed_key,applied_at) VALUES (?,?)",
  )
    .bind(PREPARED_STOCK_SEED_KEY, now)
    .run();
}

export async function initCatalogueTable() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS catalogue_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General',
      image_name TEXT NOT NULL DEFAULT '',
      image_type TEXT NOT NULL DEFAULT '',
      image_size INTEGER NOT NULL DEFAULT 0,
      image_key TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_by TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS catalogue_products_active_name_idx ON catalogue_products(active,name)",
  ).run();
  await seedPreparedStock();
}

export const productResponse = (row: Record<string, unknown>) => ({
  ...row,
  image_url: row.image_key
    ? `/api/catalogue/${row.id}/image?v=${encodeURIComponent(String(row.updated_at || ""))}`
    : "",
});
