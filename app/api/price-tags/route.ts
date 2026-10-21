import { hasDesignerSession, designerRequired } from "./designer-auth";
import { env } from "cloudflare:workers";
import { getHubMember } from "../access";
import { productResponse } from "../catalogue/shared";
import { parseTagInput, tileDefaults, tagBrand, tagTable } from "../../lib/price-tags";
import { canManagePriceTags } from "./shared";
export async function GET(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "Price tag management requires an authorised catalogue or pricing manager." }, { status: 403 });
  if (!await hasDesignerSession(member, req.headers.get("cookie"))) return designerRequired();
  const brand = new URL(req.url).searchParams.get("brand");
  if (brand && !["powerbuild","busterbuild"].includes(brand)) return Response.json({error:"Choose a brand."},{status:400});
  const table = tagTable(tagBrand(brand));
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code || code.length > 150) return Response.json({ error: "Enter a product code." }, { status: 400 });
  const product = await env.DB.prepare("SELECT * FROM catalogue_products WHERE upper(trim(code))=upper(?) AND active=1 LIMIT 1").bind(code).first<Record<string, unknown>>();
  if (!product) return Response.json({ error: "No active catalogue product matches that code." }, { status: 404 });
  const tag = await env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(product.id).first<Record<string, unknown>>();
  return Response.json({ product: { ...productResponse(product), image_url: (product.image_key || tag?.picture_key) ? `/api/price-tags/image?product_id=${product.id}&brand=${tagBrand(brand)}&v=${encodeURIComponent(String(tag?.updated_at || product.updated_at))}` : "" }, tag: tag ? {...tag, brand: tagBrand(brand)} : null, defaults: tileDefaults({ name: String(product.name), category: String(product.category), description: String(product.description) }) }, { headers: { "cache-control": "no-store" } });
}
export async function POST(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "You do not have permission to manage price tags." }, { status: 403 });
  if (!await hasDesignerSession(member, req.headers.get("cookie"))) return designerRequired();
  let data; let brand;
  try { const body = await req.json(); brand = tagBrand(body.brand); data = parseTagInput(body); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Check the tag fields." }, { status: 400 }); }
  const table = tagTable(brand);
  const product = await env.DB.prepare("SELECT id FROM catalogue_products WHERE id=? AND active=1").bind(data.product_id).first();
  if (!product) return Response.json({ error: "The catalogue product is no longer active." }, { status: 404 });
  await env.DB.prepare(`INSERT INTO ${table} (product_id,token,price_cents,unit,is_tile,coverage_per_box,pieces_per_box,tile_width_mm,tile_length_mm,published,updated_by,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_cents=excluded.price_cents,unit=excluded.unit,is_tile=excluded.is_tile,coverage_per_box=excluded.coverage_per_box,pieces_per_box=excluded.pieces_per_box,tile_width_mm=excluded.tile_width_mm,tile_length_mm=excluded.tile_length_mm,published=excluded.published,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
    .bind(data.product_id, crypto.randomUUID(), data.price_cents,data.unit,data.is_tile,data.coverage_per_box,data.pieces_per_box,data.tile_width_mm,data.tile_length_mm,data.published,member!.email,new Date().toISOString()).run();
  const tag = await env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(data.product_id).first();
  return Response.json({ tag: {...tag as Record<string, unknown>, brand} }, { headers: { "cache-control": "no-store" } });
}
