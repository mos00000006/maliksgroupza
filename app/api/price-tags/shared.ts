import type { HubMember } from "../access";
import { canManageCatalogue } from "../catalogue/shared";
export function canManagePriceTags(member: HubMember | null) {
  return Boolean(member && !["Viewer", "Read only"].includes(member.role) &&
    (canManageCatalogue(member.email) || member.access_scope === "Full company" || ["Owner / Admin", "Developer / Technical Admin"].includes(member.role)));
}
export const PUBLIC_TAG_COLUMNS = `t.token,t.product_id,t.price_cents,t.unit,t.is_tile,t.coverage_per_box,t.pieces_per_box,t.tile_width_mm,t.tile_length_mm,t.updated_at,p.code,p.name`;
export function publicTag(row: Record<string, unknown>) {
  return { token: row.token, product_id: Number(row.product_id), code: row.code, name: row.name,
    price_cents: Number(row.price_cents), unit: row.unit, is_tile: Boolean(row.is_tile),
    coverage_per_box: Number(row.coverage_per_box), pieces_per_box: Number(row.pieces_per_box),
    tile_width_mm: Number(row.tile_width_mm), tile_length_mm: Number(row.tile_length_mm),
    updated_at: row.updated_at, image_url: `/api/public-price-tags/${row.token}/image?v=${encodeURIComponent(String(row.updated_at || ""))}` };
}
