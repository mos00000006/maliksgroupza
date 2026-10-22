import type { ComboItem } from "./combo-tags";
export type TagBrand = "powerbuild" | "busterbuild";
export function tagBrand(value: unknown): TagBrand {
  if (value === undefined || value === null || value === "powerbuild") return "powerbuild";
  if (value === "busterbuild") return "busterbuild";
  throw new Error("Choose PowerBuild or BusterBuild.");
}
export function tagTable(brand: TagBrand) {
  return brand === "busterbuild" ? "busterbuild_price_tags" : "powerbuild_price_tags";
}
export function tagCustomerUrl(origin: string, tag: { token: string; code: string; brand?: TagBrand }) {
  const url = new URL(`/p/${tag.token}`, origin);
  if (tag.brand === "busterbuild") url.searchParams.set("code", tag.code);
  return url.href;
}
export type TagUnit = "EA" | "M2" | "BOX";
export type PriceTag = {
  kind?: "combo"; combo_items?: ComboItem[]; includes_title?: string; includes_text?: string; brand?: TagBrand; token: string; product_id: number; code: string; name: string; description: string;
  price_cents: number; unit: TagUnit; is_tile: boolean; coverage_per_box: number;
  pieces_per_box: number; tile_width_mm: number; tile_length_mm: number;
  published: boolean; image_url: string; updated_at: string;
};
export const TAG_TOKEN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function isPublicPriceTagRequest(path: string, method: string) {
  if (!["GET", "HEAD"].includes(method)) return false;
  if (path === "/price-tag-assets/busterbuild-logo-white.png" || path === "/price-tag-assets/busterbuild-template.jpg" || path === "/price-tag-assets/busterbuild-logo.png" || path === "/powerbuild-logo-transparent.png" || path === "/price-tag-assets/powerbuild-rail.png") return true;
  if (path === "/api/public-price-tags/prices") return true;
  const match = /^\/(?:p|api\/public-price-tags)\/([^/]+)(?:\/image)?\/?$/.exec(path);
  return Boolean(match && TAG_TOKEN.test(match[1]) && (!path.startsWith("/p/") || !path.includes("/image")));
}
export function parseTagInput(body: Record<string, unknown>) {
  const price = String(body.price ?? "").trim();
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(price)) throw new Error("Enter a valid positive price with up to two decimal places.");
  const priceCents = Math.round(Number(price) * 100);
  if (priceCents <= 0 || priceCents > 999999999) throw new Error("Enter a price between R0.01 and R9,999,999.99.");
  if (!Number.isSafeInteger(Number(body.product_id)) || Number(body.product_id) <= 0) throw new Error("Choose a catalogue product first.");
  const unit = String(body.unit) as TagUnit;
  if (!["EA", "M2", "BOX"].includes(unit)) throw new Error("Choose each, per m² or per box.");
  if (typeof body.is_tile !== "boolean" || typeof body.published !== "boolean") throw new Error("Choose the tile and publishing options.");
  const number = (key: string, max: number, integer = false) => {
    const n = Number(body[key] ?? 0);
    if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n))) throw new Error(`Check ${key.replaceAll("_", " ")}.`);
    return n;
  };
  const coverage = number("coverage_per_box", 100);
  const pieces = number("pieces_per_box", 1000, true);
  const width = number("tile_width_mm", 10000);
  const length = number("tile_length_mm", 10000);
  if (body.is_tile && (coverage <= 0 || !["M2", "BOX"].includes(unit))) throw new Error("For tiles, enter the confirmed m² per box and choose per m² or per box.");
  if (!body.is_tile && unit !== "EA") throw new Error("Use each for a standard product, or enable tile mode.");
  return { product_id: Number(body.product_id), price_cents: priceCents, unit, is_tile: body.is_tile ? 1 : 0,
    coverage_per_box: coverage, pieces_per_box: pieces, tile_width_mm: width, tile_length_mm: length, published: body.published ? 1 : 0 };
}
export type Room = { length: number; width: number };
export function measureTiles(rooms: Room[], wastePercent: number, coverage: number, priceCents: number, unit: TagUnit) {
  if (!rooms.length || rooms.some(r => !Number.isFinite(r.length) || !Number.isFinite(r.width) || r.length <= 0 || r.width <= 0 || r.length > 10000 || r.width > 10000)) return null;
  if (!Number.isFinite(wastePercent) || wastePercent < 0 || wastePercent > 30 || !Number.isFinite(coverage) || coverage <= 0 || !Number.isSafeInteger(priceCents) || priceCents <= 0 || !["M2", "BOX"].includes(unit)) return null;
  const area = rooms.reduce((sum, room) => sum + room.length * room.width, 0);
  const required = area * (1 + wastePercent / 100);
  const boxes = Math.ceil(Number((required / coverage).toFixed(10)));
  const supplied = boxes * coverage;
  const totalCents = unit === "BOX" ? boxes * priceCents : Math.round(supplied * priceCents);
  return { area, required, boxes, supplied, totalCents };
}
export function tileDefaults(product: { name: string; category: string; description: string }) {
  const text = `${product.name} ${product.description}`;
  const isTile = /tile|mosaic|porcelain|ceramic|flooring/i.test(product.category + " " + product.name) && !/adhesive|grout|spacer|cutter|cleaner|trim|bond|key coat|edge|laminate|trowel|paint|silicone/i.test(product.name);
  const dimensions = /(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*mm/i.exec(text);
  const box = /(\d+(?:\.\d+)?)\s*(?:m²|m2|sqm)\s*(?:per\s*box|\/\s*box)/i.exec(text);
  const pcs = /(\d+)\s*(?:tiles?|pcs|pieces?)\s*(?:per\s*box|\/\s*box)/i.exec(text);
  return { is_tile: isTile, unit: isTile ? "BOX" as const : "EA" as const,
    coverage_per_box: box ? Number(box[1]) : 0, pieces_per_box: pcs ? Number(pcs[1]) : 0,
    tile_width_mm: dimensions ? Number(dimensions[1]) : 0, tile_length_mm: dimensions ? Number(dimensions[2]) : 0 };
}
