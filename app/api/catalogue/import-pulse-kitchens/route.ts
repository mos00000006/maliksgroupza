import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManageCatalogue, initCatalogueTable } from "../shared";

const SOURCE = "https://pulsetiles.co.za";
const IMPORT_MARKER = "system:pulse-kitchens";
const PRODUCTS_PER_REQUEST = 6;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const categories = [
  { slug: "kitchen-sinks", catalogueCategory: "Kitchen Sinks" },
  { slug: "kitchen-sink-taps", catalogueCategory: "Kitchen Sink Taps" },
  { slug: "kitchen-sink-fittings", catalogueCategory: "Kitchen Sink Fittings" },
  { slug: "kitchen-floor-tiles", catalogueCategory: "Kitchen Tiles" },
  { slug: "kitchen-wall-tiles", catalogueCategory: "Kitchen Tiles" },
  { slug: "kitchen-mosaics", catalogueCategory: "Kitchen Mosaics" },
] as const;

type Cursor = { categoryIndex: number; page: number; offset: number };
type ImportedProduct = { name: string; code: string; category: string; outcome: "inserted" | "updated" | "skipped" };

type ExistingProduct = {
  id: number;
  code: string;
  name: string;
  image_key: string;
  created_by: string;
};

const clean = (value: unknown) => String(value ?? "").trim();

const decodeHtml = (value: string) =>
  value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;|&#038;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;|&#039;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8211;|&ndash;/gi, "–")
    .replace(/&#8212;|&mdash;/gi, "—")
    .replace(/&#(\d+);/g, (_match, value) => {
      const point = Number(value);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, value) => {
      const point = Number.parseInt(value, 16);
      return Number.isFinite(point) ? String.fromCodePoint(point) : "";
    });

const stripTags = (html: string) =>
  decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  ).trim();

const normaliseUrl = (value: string) => {
  try {
    const url = new URL(decodeHtml(value), SOURCE);
    if (url.hostname !== "pulsetiles.co.za" && url.hostname !== "www.pulsetiles.co.za") return "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
};

const htmlAttribute = (tag: string, name: string) => {
  const expression = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return expression.exec(tag)?.[1] || "";
};

const metaContent = (html: string, key: string, value: string) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (htmlAttribute(tag, key).toLowerCase() === value.toLowerCase()) return decodeHtml(htmlAttribute(tag, "content"));
  }
  return "";
};

const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "Mozilla/5.0 (compatible; PowerBuildCatalogueImporter/1.0)",
    },
  });
  if (!response.ok) throw new Error(`Pulse Tiles returned ${response.status} for ${url}`);
  return response.text();
};

const extractProductLinks = (html: string) => {
  const productsBlock = /<ul\b[^>]*class=["'][^"']*\bproducts\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html)?.[1] || html;
  const links: string[] = [];
  for (const match of productsBlock.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const url = normaliseUrl(match[1]);
    if (!url || !/\/product\/[^/?#]+\/?$/i.test(new URL(url).pathname)) continue;
    if (!links.includes(url)) links.push(url);
  }
  return links;
};

const extractTotalPages = (html: string, currentPage: number) => {
  let maxPage = currentPage;
  for (const match of html.matchAll(/[?&]product-page=(\d+)/gi)) {
    maxPage = Math.max(maxPage, Number.parseInt(match[1], 10) || 1);
  }
  return maxPage;
};

const extractProductDetail = (html: string, url: string) => {
  const h1 = /<h1\b[^>]*class=["'][^"']*\bproduct_title\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]
    || /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]
    || "";
  const titleMeta = metaContent(html, "property", "og:title");
  const name = stripTags(h1 || titleMeta.replace(/\s*[-|]\s*Pulse Tiles.*$/i, ""));
  const skuHtml = /<span\b[^>]*class=["'][^"']*\bsku\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[1] || "";
  const sku = stripTags(skuHtml).toUpperCase();
  const slug = new URL(url).pathname.split("/").filter(Boolean).pop() || "pulse-kitchen-product";
  const code = sku || `PULSE-${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  let imageUrl = normaliseUrl(metaContent(html, "property", "og:image"));
  if (!imageUrl) {
    const imageTag = /<img\b[^>]*class=["'][^"']*(?:wp-post-image|woocommerce-product-gallery__image)[^"']*["'][^>]*>/i.exec(html)?.[0] || "";
    imageUrl = normaliseUrl(htmlAttribute(imageTag, "data-large_image") || htmlAttribute(imageTag, "src"));
  }
  return { name, code, imageUrl };
};

const imageExtension = (type: string, url: string) => {
  const pathname = (() => { try { return new URL(url).pathname; } catch { return ""; } })();
  const ext = /\.([a-z0-9]{2,5})$/i.exec(pathname)?.[1]?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  if (/png/i.test(type)) return "png";
  if (/webp/i.test(type)) return "webp";
  if (/gif/i.test(type)) return "gif";
  if (/avif/i.test(type)) return "avif";
  return "jpg";
};

const safePart = (value: string) => value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "pulse-kitchen";

const saveExternalImage = async (imageUrl: string, code: string) => {
  if (!imageUrl) return null;
  try {
    const response = await fetch(imageUrl, {
      headers: { accept: "image/*", "user-agent": "Mozilla/5.0 (compatible; PowerBuildCatalogueImporter/1.0)" },
    });
    if (!response.ok) return null;
    const type = clean(response.headers.get("content-type")) || "image/jpeg";
    if (!type.toLowerCase().startsWith("image/")) return null;
    const declared = Number(response.headers.get("content-length") || 0);
    if (declared > MAX_IMAGE_BYTES) return null;
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength || buffer.byteLength > MAX_IMAGE_BYTES) return null;
    const extension = imageExtension(type, imageUrl);
    const fileName = `${safePart(code)}.${extension}`;
    const key = `catalogue/pulse-kitchens/${crypto.randomUUID()}-${fileName}`;
    await env.BUCKET.put(key, buffer, { httpMetadata: { contentType: type } });
    return { key, fileName, type, size: buffer.byteLength };
  } catch {
    return null;
  }
};

const ensureEcommerceSettings = async (productId: number, actor: string, now: string) => {
  try {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO ecommerce_product_settings
       (catalogue_product_id,b2c_enabled,b2b_enabled,retail_price_inc_vat,wholesale_price_ex_vat,b2b_min_qty,unit,stock_status,featured,sort_order,updated_by,updated_at)
       VALUES (?,0,0,0,0,1,'EA','Available',0,0,?,?)`,
    ).bind(productId, actor, now).run();
  } catch {
    // E-commerce may not be enabled on an older database. The catalogue import itself must still succeed.
  }
};

const importProduct = async (
  productUrl: string,
  category: string,
  actor: string,
): Promise<{ product: ImportedProduct; imageSaved: boolean }> => {
  const html = await fetchHtml(productUrl);
  const detail = extractProductDetail(html, productUrl);
  if (!detail.name || !detail.code) throw new Error(`Could not read product details from ${productUrl}`);

  const existing = await env.DB.prepare(
    `SELECT id,code,name,image_key,created_by FROM catalogue_products
     WHERE lower(code)=lower(?) OR lower(name)=lower(?)
     ORDER BY CASE WHEN lower(code)=lower(?) THEN 0 ELSE 1 END, id LIMIT 1`,
  ).bind(detail.code, detail.name, detail.code).first<ExistingProduct>();

  const now = new Date().toISOString();
  const description = `${category} product from the Pulse Tiles Kitchens range.`;

  if (existing && !String(existing.created_by || "").startsWith(IMPORT_MARKER)) {
    await ensureEcommerceSettings(Number(existing.id), actor, now);
    return { product: { name: detail.name, code: String(existing.code || detail.code), category, outcome: "skipped" }, imageSaved: false };
  }

  let image: Awaited<ReturnType<typeof saveExternalImage>> = null;
  if (!existing?.image_key && detail.imageUrl) image = await saveExternalImage(detail.imageUrl, detail.code);

  if (existing) {
    await env.DB.prepare(
      `UPDATE catalogue_products SET
       name=?,description=?,category=?,
       image_name=CASE WHEN image_key='' AND ?<>'' THEN ? ELSE image_name END,
       image_type=CASE WHEN image_key='' AND ?<>'' THEN ? ELSE image_type END,
       image_size=CASE WHEN image_key='' AND ?<>'' THEN ? ELSE image_size END,
       image_key=CASE WHEN image_key='' AND ?<>'' THEN ? ELSE image_key END,
       active=1,updated_by=?,updated_at=?
       WHERE id=?`,
    ).bind(
      detail.name, description, category,
      image?.key || "", image?.fileName || "",
      image?.key || "", image?.type || "",
      image?.key || "", image?.size || 0,
      image?.key || "", image?.key || "",
      actor, now, existing.id,
    ).run();
    await ensureEcommerceSettings(Number(existing.id), actor, now);
    return { product: { name: detail.name, code: detail.code, category, outcome: "updated" }, imageSaved: Boolean(image) };
  }

  const inserted = await env.DB.prepare(
    `INSERT INTO catalogue_products
     (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at)
     VALUES (?,?,?,?,?,?,?,?,1,?,?,?,?,?) RETURNING id`,
  ).bind(
    detail.code,
    detail.name,
    description,
    category,
    image?.fileName || "",
    image?.type || "",
    image?.size || 0,
    image?.key || "",
    `${IMPORT_MARKER}:${actor}`,
    now,
    actor,
    now,
  ).first<{ id: number }>();

  if (!inserted?.id) throw new Error(`Could not add ${detail.name} to the catalogue.`);
  await ensureEcommerceSettings(Number(inserted.id), actor, now);
  return { product: { name: detail.name, code: detail.code, category, outcome: "inserted" }, imageSaved: Boolean(image) };
};

export async function POST(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember();
  if (!member || !canManageCatalogue(member.email)) {
    return Response.json({ error: "Only authorised catalogue administrators can import the Pulse Kitchens range." }, { status: 403 });
  }

  let body: { cursor?: Partial<Cursor> } = {};
  try { body = await req.json() as { cursor?: Partial<Cursor> }; } catch { body = {}; }
  const cursor: Cursor = {
    categoryIndex: Math.max(0, Math.floor(Number(body.cursor?.categoryIndex) || 0)),
    page: Math.max(1, Math.floor(Number(body.cursor?.page) || 1)),
    offset: Math.max(0, Math.floor(Number(body.cursor?.offset) || 0)),
  };

  if (cursor.categoryIndex >= categories.length) {
    return Response.json({ done: true, nextCursor: null, inserted: 0, updated: 0, skipped: 0, images: 0, products: [], progress: 100, status: "Pulse Kitchens import complete." });
  }

  const sourceCategory = categories[cursor.categoryIndex];
  const categoryUrl = `${SOURCE}/product-category/${sourceCategory.slug}/${cursor.page > 1 ? `?product-page=${cursor.page}` : ""}`;

  try {
    const categoryHtml = await fetchHtml(categoryUrl);
    const productLinks = extractProductLinks(categoryHtml);
    const totalPages = extractTotalPages(categoryHtml, cursor.page);

    if (!productLinks.length) {
      const nextCategory = cursor.categoryIndex + 1;
      const done = nextCategory >= categories.length;
      return Response.json({
        done,
        nextCursor: done ? null : { categoryIndex: nextCategory, page: 1, offset: 0 },
        inserted: 0,
        updated: 0,
        skipped: 0,
        images: 0,
        products: [],
        progress: done ? 100 : Math.round((nextCategory / categories.length) * 100),
        status: `${sourceCategory.catalogueCategory}: no products found on page ${cursor.page}; moving to the next category.`,
      });
    }

    const batchLinks = productLinks.slice(cursor.offset, cursor.offset + PRODUCTS_PER_REQUEST);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let images = 0;
    const products: ImportedProduct[] = [];
    const failures: string[] = [];

    for (const productUrl of batchLinks) {
      try {
        const result = await importProduct(productUrl, sourceCategory.catalogueCategory, member.email);
        products.push(result.product);
        if (result.product.outcome === "inserted") inserted += 1;
        else if (result.product.outcome === "updated") updated += 1;
        else skipped += 1;
        if (result.imageSaved) images += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `Could not import ${productUrl}`);
      }
    }

    const nextOffset = cursor.offset + batchLinks.length;
    let nextCursor: Cursor | null;
    if (nextOffset < productLinks.length) {
      nextCursor = { categoryIndex: cursor.categoryIndex, page: cursor.page, offset: nextOffset };
    } else if (cursor.page < totalPages) {
      nextCursor = { categoryIndex: cursor.categoryIndex, page: cursor.page + 1, offset: 0 };
    } else if (cursor.categoryIndex + 1 < categories.length) {
      nextCursor = { categoryIndex: cursor.categoryIndex + 1, page: 1, offset: 0 };
    } else {
      nextCursor = null;
    }

    const done = nextCursor === null;
    const currentCategoryProgress = totalPages > 0 ? Math.min(1, (cursor.page - 1 + Math.min(1, nextOffset / Math.max(1, productLinks.length))) / totalPages) : 1;
    const progress = done ? 100 : Math.min(99, Math.round(((cursor.categoryIndex + currentCategoryProgress) / categories.length) * 100));

    return Response.json({
      done,
      nextCursor,
      inserted,
      updated,
      skipped,
      images,
      products,
      failures: failures.slice(0, 3),
      progress,
      status: `${sourceCategory.catalogueCategory} · page ${cursor.page}/${totalPages} · ${Math.min(nextOffset, productLinks.length)}/${productLinks.length} products processed`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The Pulse Kitchens range could not be imported." },
      { status: 502 },
    );
  }
}
