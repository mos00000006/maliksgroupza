import { env } from "cloudflare:workers";
import { getHubMember } from "../access";
import { productResponse } from "../catalogue/shared";
import { parseTagInput, tileDefaults } from "../../lib/price-tags";
import { canManagePriceTags } from "./shared";
export async function GET(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "Price tag management requires an authorised catalogue or pricing manager." }, { status: 403 });
  const code = new URL(req.url).searchParams.get("code")?.trim();
  if (!code || code.length > 150) return Response.json({ error: "Enter a product code." }, { status: 400 });
  const product = await env.DB.prepare("SELECT * FROM catalogue_products WHERE upper(trim(code))=upper(?) AND active=1 LIMIT 1").bind(code).first<Record<string, unknown>>();
  if (!product) return Response.json({ error: "No active catalogue product matches that code." }, { status: 404 });
  const tag = await env.DB.prepare("SELECT * FROM powerbuild_price_tags WHERE product_id=?").bind(product.id).first<Record<string, unknown>>();
  return Response.json({ product: productResponse(product), tag, defaults: tileDefaults({ name: String(product.name), category: String(product.category), description: String(product.description) }) }, { headers: { "cache-control": "no-store" } });
}
export async function POST(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "You do not have permission to manage price tags." }, { status: 403 });
  let data;
  try { data = parseTagInput(await req.json()); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Check the tag fields." }, { status: 400 }); }
  const product = await env.DB.prepare("SELECT id FROM catalogue_products WHERE id=? AND active=1").bind(data.product_id).first();
  if (!product) return Response.json({ error: "The catalogue product is no longer active." }, { status: 404 });
  await env.DB.prepare(`INSERT INTO powerbuild_price_tags (product_id,token,price_cents,unit,is_tile,coverage_per_box,pieces_per_box,tile_width_mm,tile_length_mm,published,updated_by,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_cents=excluded.price_cents,unit=excluded.unit,is_tile=excluded.is_tile,coverage_per_box=excluded.coverage_per_box,pieces_per_box=excluded.pieces_per_box,tile_width_mm=excluded.tile_width_mm,tile_length_mm=excluded.tile_length_mm,published=excluded.published,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
    .bind(data.product_id, crypto.randomUUID(), data.price_cents,data.unit,data.is_tile,data.coverage_per_box,data.pieces_per_box,data.tile_width_mm,data.tile_length_mm,data.published,member!.email,new Date().toISOString()).run();
  const tag = await env.DB.prepare("SELECT * FROM powerbuild_price_tags WHERE product_id=?").bind(data.product_id).first();
  return Response.json({ tag }, { headers: { "cache-control": "no-store" } });
}
