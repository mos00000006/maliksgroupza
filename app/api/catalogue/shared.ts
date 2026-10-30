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

export const productResponse = (row: Record<string, unknown>) => {
  const imageKey = String(row.image_key || "");
  return {
    ...row,
    category: isWindowBlindProduct(row) ? "Window Blinds & Treatments" : row.category,
    image_url: imageKey.startsWith("static:")
      ? imageKey.slice("static:".length)
      : imageKey.startsWith("external:")
        ? `/api/catalogue/${row.id}/external-image?v=${encodeURIComponent(String(row.updated_at || ""))}`
        : imageKey
          ? `/api/catalogue/${row.id}/image?v=${encodeURIComponent(String(row.updated_at || ""))}`
          : "",
  };
};

/** Match window blinds, not mechanical parts such as blind flanges. */
export const isWindowBlindProduct = (row: Record<string, unknown>) => {
  const category = String(row.category || "");
  const name = String(row.name || "");
  if (/^(?:window\s+)?blinds?(?:\s*(?:&|and)\s*(?:treatments?|coverings?))?$/i.test(category)) return true;
  return /\bblinds?\b/i.test(name) && !/\bblind\s+(?:flanges?|caps?|rivets?|plugs?|nuts?)\b/i.test(name);
};
