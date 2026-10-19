import { env } from "cloudflare:workers";
import { getHubMember } from "../../access";
import { canManageCatalogue, initCatalogueTable } from "../shared";

const SOURCE_NAME = "Pulse Tiles";
const PULSE_ROOT = "https://pulsetiles.co.za";
const MAX_PRODUCTS_PER_PAGE = 30;

const PULSE_CATEGORIES = [
  { key: "ceramic", label: "Ceramic Tiles", url: `${PULSE_ROOT}/product-category/tiles/ceramic-tiles/`, category: "Tiles - Ceramic" },
  { key: "porcelain", label: "Porcelain Tiles", url: `${PULSE_ROOT}/product-category/tiles/porcelain-tiles/`, category: "Tiles - Porcelain" },
  { key: "hardbody", label: "Hardbody Tiles", url: `${PULSE_ROOT}/product-category/combo-deals/hardbody-tiles/`, category: "Tiles - Hardbody" },
  { key: "cladding", label: "Natural Stone Cladding", url: `${PULSE_ROOT}/product-category/tiles/natural-stone-cladding/`, category: "Tiles - Cladding" },
  { key: "mosaics", label: "Mosaics", url: `${PULSE_ROOT}/product-category/tiles/mosaics/`, category: "Tiles - Mosaics" },
  { key: "decor", label: "Decor Tiles", url: `${PULSE_ROOT}/product-category/tiles/decor-tiles/`, category: "Tiles - Decor" },
  { key: "laminate", label: "Laminate Flooring", url: `${PULSE_ROOT}/product-category/laminate-flooring/`, category: "Laminate Flooring" },
] as const;

type PulseCategory = (typeof PULSE_CATEGORIES)[number];
type CatalogueExisting = { id: number; code: string; source_url: string; source_sku: string };

type PulseProduct = {
  sourceUrl: string;
  sourceSku: string;
  name: string;
  description: string;
  imageUrl: string;
};

const decodeHtml = (value: string) =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)));

const stripHtml = (value: string) =>
  decodeHtml(
    String(value || "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, " · ")
      .replace(/<\/p>/gi, " · ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s*·\s*·+/g, " · ")
    .replace(/\s+/g, " ")
    .replace(/^\s*·\s*|\s*·\s*$/g, "")
    .trim();

const attr = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return decodeHtml(match?.[1] || "").trim();
};

const fetchHtml = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (compatible; PowerBuildCatalogueSync/1.0; +https://maliks.co.za)",
      "accept-language": "en-ZA,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Pulse Tiles returned ${response.status} for ${url}`);
  return response.text();
};

const categoryPageUrl = (category: PulseCategory, page: number) =>
  page <= 1 ? category.url : `${category.url.replace(/\/$/, "")}/page/${page}/`;

const extractProductUrls = (html: string) => {
  const urls = new Set<string>();
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html))) {
    const href = decodeHtml(match[1] || "").trim();
    if (!href) continue;
    let url: URL;
    try {
      url = new URL(href, PULSE_ROOT);
    } catch {
      continue;
    }
    if (url.hostname !== "pulsetiles.co.za" && url.hostname !== "www.pulsetiles.co.za") continue;
    if (!/^\/product\/[^/]+\/?$/.test(url.pathname)) continue;
    url.hash = "";
    url.search = "";
    urls.add(url.toString());
    if (urls.size >= MAX_PRODUCTS_PER_PAGE) break;
  }
  return [...urls];
};

const extractTotalPages = (html: string) => {
  let maxPage = 1;
  const pageRegex = /\/page\/(\d+)\/?/gi;
  let match: RegExpExecArray | null;
  while ((match = pageRegex.exec(html))) {
    maxPage = Math.max(maxPage, Number.parseInt(match[1] || "1", 10) || 1);
  }
  const ariaRegex = /aria-label\s*=\s*["'][^"']*page\s+(\d+)[^"']*["']/gi;
  while ((match = ariaRegex.exec(html))) {
    maxPage = Math.max(maxPage, Number.parseInt(match[1] || "1", 10) || 1);
  }
  return Math.min(Math.max(maxPage, 1), 50);
};

const metaContent = (html: string, key: string, property = false) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const tagKey = attr(tag, property ? "property" : "name").toLowerCase();
    if (tagKey === key.toLowerCase()) return attr(tag, "content");
  }
  return "";
};

const extractHeading = (html: string) => {
  const preferred = html.match(/<h1\b[^>]*class=["'][^"']*product_title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i);
  if (preferred?.[1]) return stripHtml(preferred[1]);
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return stripHtml(h1?.[1] || "");
};

const extractSku = (html: string) => {
  const sku = html.match(/<span\b[^>]*class=["'][^"']*\bsku\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  return stripHtml(sku?.[1] || "");
};

const extractShortDescription = (html: string) => {
  const match = html.match(/<div\b[^>]*class=["'][^"']*woocommerce-product-details__short-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (match?.[1]) return stripHtml(match[1]);
  return stripHtml(metaContent(html, "description"));
};

const extractAttributes = (html: string) => {
  const attributes: string[] = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(html))) {
    const th = row[1].match(/<th\b[^>]*>([\s\S]*?)<\/th>/i);
    const td = row[1].match(/<td\b[^>]*>([\s\S]*?)<\/td>/i);
    const label = stripHtml(th?.[1] || "");
    const value = stripHtml(td?.[1] || "");
    if (!label || !value) continue;
    if (!/(tile size|quantity per box|square meters per box|m2|sold|finish|application|material|thickness|length|width)/i.test(label)) continue;
    attributes.push(`${label}: ${value}`);
    if (attributes.length >= 8) break;
  }
  return attributes;
};

const normaliseExternalUrl = (value: string, base: string) => {
  if (!value) return "";
  try {
    const url = new URL(decodeHtml(value), base);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (host !== "pulsetiles.co.za" && !host.endsWith(".pulsetiles.co.za")) return "";
    return url.toString();
  } catch {
    return "";
  }
};

const extractImage = (html: string, pageUrl: string) => {
  const og = metaContent(html, "og:image", true);
  if (og) return normaliseExternalUrl(og, pageUrl);
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of imageTags) {
    const classes = attr(tag, "class");
    if (!/wp-post-image|attachment-woocommerce_single|woocommerce-product-gallery/i.test(classes)) continue;
    const src = attr(tag, "data-src") || attr(tag, "src");
    const url = normaliseExternalUrl(src, pageUrl);
    if (url) return url;
  }
  return "";
};

const slugCode = (url: string) => {
  let slug = "pulse-tile";
  try {
    slug = new URL(url).pathname.split("/").filter(Boolean).pop() || slug;
  } catch {
    // Keep default slug.
  }
  const compact = slug.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
  return `PULSE-${compact.slice(0, 46)}`;
};

const parseProduct = async (url: string): Promise<PulseProduct> => {
  const html = await fetchHtml(url);
  const name = extractHeading(html);
  if (!name) throw new Error("Product name missing");
  const sourceSku = extractSku(html);
  const short = extractShortDescription(html);
  const attributes = extractAttributes(html);
  const descriptionParts = [short, ...attributes];
  const description = descriptionParts.filter(Boolean).join(" · ").slice(0, 1200) || `${name} · Pulse Tiles range`;
  return {
    sourceUrl: url,
    sourceSku,
    name,
    description,
    imageUrl: extractImage(html, url),
  };
};

const uniqueCode = (product: PulseProduct, usedCodes: Set<string>, sourceByUrl: Map<string, CatalogueExisting>) => {
  const existing = sourceByUrl.get(product.sourceUrl);
  if (existing?.code) return existing.code;

  const sku = product.sourceSku.replace(/\s+/g, "").toUpperCase();
  if (sku && !usedCodes.has(sku)) return sku;

  const base = sku ? `PT-${sku}` : slugCode(product.sourceUrl);
  if (!usedCodes.has(base)) return base;
  let index = 2;
  while (usedCodes.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
};

export async function GET() {
  await initCatalogueTable();
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Only catalogue administrators can sync Pulse Tiles." }, { status: 403 });

  const results = await Promise.all(
    PULSE_CATEGORIES.map(async (category) => {
      try {
        const html = await fetchHtml(category.url);
        return { key: category.key, label: category.label, category: category.category, pages: extractTotalPages(html), available: true };
      } catch {
        return { key: category.key, label: category.label, category: category.category, pages: 0, available: false };
      }
    }),
  );

  return Response.json({ source: SOURCE_NAME, categories: results });
}

export async function POST(req: Request) {
  await initCatalogueTable();
  const member = await getHubMember({ allowBuyerAccess: true, allowStockOrdersAccess: true });
  if (!member || !canManageCatalogue(member.email))
    return Response.json({ error: "Only catalogue administrators can sync Pulse Tiles." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { category?: string; page?: number };
  const category = PULSE_CATEGORIES.find((item) => item.key === String(body.category || ""));
  const page = Math.max(1, Math.min(50, Math.round(Number(body.page) || 1)));
  if (!category) return Response.json({ error: "Unknown Pulse Tiles category." }, { status: 400 });

  let listingHtml = "";
  try {
    listingHtml = await fetchHtml(categoryPageUrl(category, page));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Pulse Tiles category page could not be loaded." }, { status: 502 });
  }

  const productUrls = extractProductUrls(listingHtml);
  if (!productUrls.length)
    return Response.json({ category: category.key, page, imported: 0, updated: 0, failed: 0, products: 0, done: true });

  const [sourceRows, codeRows] = await Promise.all([
    env.DB.prepare(
      "SELECT id,code,source_url,source_sku FROM catalogue_products WHERE source_name=?",
    ).bind(SOURCE_NAME).all<CatalogueExisting>(),
    env.DB.prepare("SELECT code FROM catalogue_products").all<{ code: string }>(),
  ]);
  const sourceByUrl = new Map(sourceRows.results.map((row) => [String(row.source_url), row]));
  const usedCodes = new Set(codeRows.results.map((row) => String(row.code || "").toUpperCase()).filter(Boolean));

  const parsedResults = await Promise.allSettled(productUrls.map((url) => parseProduct(url)));
  const statements: ReturnType<typeof env.DB.prepare>[] = [];
  let imported = 0;
  let updated = 0;
  let failed = 0;

  for (const result of parsedResults) {
    if (result.status !== "fulfilled") {
      failed += 1;
      continue;
    }
    const product = result.value;
    const existing = sourceByUrl.get(product.sourceUrl);
    const code = uniqueCode(product, usedCodes, sourceByUrl);
    usedCodes.add(code.toUpperCase());
    const imageName = product.imageUrl ? product.imageUrl.split("/").pop()?.split("?")[0] || "pulse-tile.jpg" : "";
    const imageKey = product.imageUrl ? `external:${product.imageUrl}` : "";
    const now = new Date().toISOString();

    if (existing) {
      statements.push(
        env.DB.prepare(
          `UPDATE catalogue_products SET
             code=?,name=?,description=?,category=?,image_name=?,image_type='',image_size=0,image_key=?,active=1,
             updated_by=?,updated_at=?,source_name=?,source_url=?,source_sku=?
           WHERE id=?`,
        ).bind(
          code,
          product.name,
          product.description,
          category.category,
          imageName,
          imageKey,
          member.email,
          now,
          SOURCE_NAME,
          product.sourceUrl,
          product.sourceSku,
          existing.id,
        ),
      );
      updated += 1;
    } else {
      statements.push(
        env.DB.prepare(
          `INSERT INTO catalogue_products
           (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at,source_name,source_url,source_sku)
           VALUES (?,?,?,?,?,'',0,?,1,?,?,?,?,?,?,?)`,
        ).bind(
          code,
          product.name,
          product.description,
          category.category,
          imageName,
          imageKey,
          member.email,
          now,
          member.email,
          now,
          SOURCE_NAME,
          product.sourceUrl,
          product.sourceSku,
        ),
      );
      imported += 1;
    }
  }

  if (statements.length) await env.DB.batch(statements);

  // Keep newly imported products out of the public B2C/B2B stores until a full-company user prices and enables them.
  await env.DB.prepare(
    `INSERT OR IGNORE INTO ecommerce_product_settings
      (catalogue_product_id,b2c_enabled,b2b_enabled,retail_price_inc_vat,wholesale_price_ex_vat,b2b_min_qty,unit,stock_status,featured,sort_order,updated_by,updated_at)
     SELECT id,0,0,0,0,1,'M2','Available',0,0,?,?
     FROM catalogue_products
     WHERE source_name=?`,
  ).bind(member.email, new Date().toISOString(), SOURCE_NAME).run().catch(() => undefined);

  return Response.json({
    source: SOURCE_NAME,
    category: category.key,
    category_label: category.label,
    page,
    total_pages: extractTotalPages(listingHtml),
    products: productUrls.length,
    imported,
    updated,
    failed,
    done: page >= extractTotalPages(listingHtml),
  });
}
