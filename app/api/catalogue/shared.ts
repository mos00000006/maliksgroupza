import { env } from "cloudflare:workers";

export const CATALOGUE_MANAGERS = new Set([
  "moyanamoses006@icloud.com",
  "moyanamoses006@icloud",
  "msallikuti@gmail.com",
]);

export const canManageCatalogue = (email?: string | null) =>
  Boolean(email && CATALOGUE_MANAGERS.has(email.trim().toLowerCase()));

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
}

export const productResponse = (row: Record<string, unknown>) => ({
  ...row,
  image_url: row.image_key
    ? `/api/catalogue/${row.id}/image?v=${encodeURIComponent(String(row.updated_at || ""))}`
    : "",
});
