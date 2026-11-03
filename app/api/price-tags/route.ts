import { createColourProduct } from "./create-colour-product";
import { sameProductCode } from "../../lib/colour-product-code";
import { catalogueSearch } from "../../lib/paint-tag-fields";
import { hasDesignerSession, designerRequired } from "./designer-auth";
import { env } from "cloudflare:workers";
import { getHubMember } from "../access";
import { productResponse } from "../catalogue/shared";
import {
  ALL_BRANCHES,
  parseTagBranches,
  parseTagInput,
  tileDefaults,
  tagBrand,
  tagTable,
  type TagBrand,
} from "../../lib/price-tags";
import { canManagePriceTags } from "./shared";

type Row = Record<string, unknown>;

async function activeStoreBranches() {
  try {
    const rows = await env.DB.prepare(
      "SELECT name FROM workspaces WHERE active=1 AND type='Store' ORDER BY name",
    ).all<{ name: string }>();
    return rows.results.map((row) => String(row.name));
  } catch { return []; }
}

async function savedBranchPrices(brand: TagBrand, productId: unknown) {
  try {
    const rows = await env.DB.prepare(
      "SELECT branch_name,price_cents,updated_at FROM price_tag_branch_prices WHERE brand=? AND product_id=? ORDER BY branch_name",
    ).bind(brand, productId).all<{ branch_name: string; price_cents: number; updated_at: string }>();
    return rows.results;
  } catch { return [] as Array<{ branch_name: string; price_cents: number; updated_at: string }>; }
}

async function canonicalBranches(requested: string[]) {
  if (!requested.length) return [];
  const stores = await activeStoreBranches();
  const available = new Map(stores.map((name) => [name.toLowerCase(), name]));
  const canonical = requested.map((name) => available.get(name.toLowerCase())).filter(Boolean) as string[];
  if (canonical.length !== requested.length) throw new Error("One or more selected branches are no longer active stores.");
  return canonical;
}

export async function GET(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "Price tag management requires an authorised catalogue or pricing manager." }, { status: 403 });
  if (!await hasDesignerSession(member, req.headers.get("cookie"))) return designerRequired();

  const url = new URL(req.url);
  const brandValue = url.searchParams.get("brand");
  if (brandValue && !["powerbuild", "busterbuild"].includes(brandValue)) return Response.json({ error: "Choose a brand." }, { status: 400 });
  const brand = tagBrand(brandValue);
  const table = tagTable(brand);

  const query = url.searchParams.get("q");
  if (query !== null) {
    let search: ReturnType<typeof catalogueSearch>;
    try { search = catalogueSearch(query); }
    catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
    const found = await env.DB.prepare(search.sql).bind(...search.bindings).all();
    return Response.json({ products: found.results.slice(0, 30), more: found.results.length > 30 }, { headers: { "cache-control": "no-store" } });
  }

  const code = url.searchParams.get("code")?.trim();
  if (!code || code.length > 150) return Response.json({ error: "Enter a product code." }, { status: 400 });
  const product = await env.DB.prepare(
    "SELECT * FROM catalogue_products WHERE upper(trim(code))=upper(?) AND active=1 LIMIT 1",
  ).bind(code).first<Row>();
  if (!product) return Response.json({ error: "No active catalogue product matches that code." }, { status: 404 });

  const [tag, branches, branchPrices] = await Promise.all([
    env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(product.id).first<Row>(),
    activeStoreBranches(),
    savedBranchPrices(brand, product.id),
  ]);

  return Response.json({
    product: {
      ...productResponse(product),
      image_url: (product.image_key || tag?.picture_key)
        ? `/api/price-tags/image?product_id=${product.id}&brand=${brand}&v=${encodeURIComponent(String(tag?.updated_at || product.updated_at))}`
        : "",
    },
    tag: tag ? { ...tag, brand, branch_name: ALL_BRANCHES } : null,
    branches,
    branch_prices: branchPrices,
    defaults: tileDefaults({ name: String(product.name), category: String(product.category), description: String(product.description) }),
  }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  const member = await getHubMember();
  if (!canManagePriceTags(member)) return Response.json({ error: "You do not have permission to manage price tags." }, { status: 403 });
  if (!await hasDesignerSession(member, req.headers.get("cookie"))) return designerRequired();
  const colourProduct = await createColourProduct(req, member!.email);
  if (colourProduct) return colourProduct;

  let body: Record<string, unknown>;
  let brand: TagBrand;
  let data: ReturnType<typeof parseTagInput>;
  let requestedBranches: string[];
  try {
    body = await req.json() as Record<string, unknown>;
    brand = tagBrand(body.brand);
    data = parseTagInput(body);
    requestedBranches = parseTagBranches(body.branches);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Check the tag fields." }, { status: 400 });
  }

  const table = tagTable(brand);
  const product = await env.DB.prepare("SELECT id,code FROM catalogue_products WHERE id=? AND active=1").bind(data.product_id).first<Row>();
  if (!product) return Response.json({ error: "The catalogue product is no longer active." }, { status: 404 });
  if (data.product_code && !sameProductCode(data.product_code, String(product.code))) {
    return Response.json({ error: "The product code changed. Load the correct colour code again before generating." }, { status: 409 });
  }

  const now = new Date().toISOString();
  if (!requestedBranches.length) {
    await env.DB.prepare(`INSERT INTO ${table} (product_id,token,price_cents,unit,is_tile,coverage_per_box,pieces_per_box,tile_width_mm,tile_length_mm,published,updated_by,updated_at,colour)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_cents=excluded.price_cents,unit=excluded.unit,is_tile=excluded.is_tile,coverage_per_box=excluded.coverage_per_box,pieces_per_box=excluded.pieces_per_box,tile_width_mm=excluded.tile_width_mm,tile_length_mm=excluded.tile_length_mm,published=excluded.published,updated_by=excluded.updated_by,updated_at=excluded.updated_at,colour=COALESCE(excluded.colour,${table}.colour)`)
      .bind(data.product_id, crypto.randomUUID(), data.price_cents, data.unit, data.is_tile, data.coverage_per_box, data.pieces_per_box, data.tile_width_mm, data.tile_length_mm, data.published, member!.email, now, data.colour ?? null).run();
    const tag = await env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(data.product_id).first<Row>();
    const result = { ...tag, brand, branch_name: ALL_BRANCHES };
    return Response.json({ tag: result, tags: [result], scope: "all" }, { headers: { "cache-control": "no-store" } });
  }

  const baseTag = await env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(data.product_id).first<Row>();
  if (!baseTag) {
    return Response.json({ error: "Create the All Branches price first, then add branch-specific prices." }, { status: 409 });
  }

  let branches: string[];
  try { branches = await canonicalBranches(requestedBranches); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }

  await env.DB.prepare(`UPDATE ${table} SET unit=?,is_tile=?,coverage_per_box=?,pieces_per_box=?,tile_width_mm=?,tile_length_mm=?,published=?,updated_by=?,updated_at=?,colour=COALESCE(?,colour) WHERE product_id=?`)
    .bind(data.unit, data.is_tile, data.coverage_per_box, data.pieces_per_box, data.tile_width_mm, data.tile_length_mm, data.published, member!.email, now, data.colour ?? null, data.product_id).run();

  for (const branch of branches) {
    await env.DB.prepare(`INSERT INTO price_tag_branch_prices (brand,product_id,branch_name,price_cents,updated_by,updated_at)
      VALUES (?,?,?,?,?,?) ON CONFLICT(brand,product_id,branch_name) DO UPDATE SET price_cents=excluded.price_cents,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
      .bind(brand, data.product_id, branch, data.price_cents, member!.email, now).run();
  }

  const refreshed = await env.DB.prepare(`SELECT * FROM ${table} WHERE product_id=?`).bind(data.product_id).first<Row>();
  const tags = branches.map((branch) => ({ ...refreshed, brand, branch_name: branch, price_cents: data.price_cents }));
  return Response.json({ tag: tags[0], tags, scope: "branches" }, { headers: { "cache-control": "no-store" } });
}

