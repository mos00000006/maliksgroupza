import { env } from "cloudflare:workers";

export const CATALOGUE_MANAGERS = new Set([
  "moyanamoses006@icloud.com",
  "moyanamoses006@icloud",
  "msallikutti@gmail.com",
]);

export const canManageCatalogue = (email?: string | null) =>
  Boolean(email && CATALOGUE_MANAGERS.has(email.trim().toLowerCase()));

/**
 * Catalogue schema and prepared stock are migration-managed.
 * This function remains for route compatibility but intentionally performs
 * no request-time schema creation or stock seeding.
 */
export async function initCatalogueTable() {
  void env;
}

export const productResponse = (row: Record<string, unknown>) => ({
  ...row,
  image_url: row.image_key
    ? `/api/catalogue/${row.id}/image?v=${encodeURIComponent(String(row.updated_at || ""))}`
    : "",
});
