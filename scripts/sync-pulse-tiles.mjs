import fs from "node:fs/promises";
import path from "node:path";

const ROOT = "https://pulsetiles.co.za";

const CATEGORIES = [
  {
    name: "Ceramic Tiles",
    url: `${ROOT}/product-category/tiles/ceramic-tiles/`,
  },
  {
    name: "Porcelain Tiles",
    url: `${ROOT}/product-category/tiles/porcelain-tiles/`,
  },
  {
    name: "Hardbody Tiles",
    url: `${ROOT}/product-category/combo-deals/hardbody-tiles/`,
  },
  {
    name: "Natural Stone Cladding",
    url: `${ROOT}/product-category/tiles/natural-stone-cladding/`,
  },
  {
    name: "Mosaics",
    url: `${ROOT}/product-category/tiles/mosaics/`,
  },
  {
    name: "Decor Tiles",
    url: `${ROOT}/product-category/tiles/decor-tiles/`,
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 Maliks-Group-Hub Pulse-Tiles-Catalogue-Sync/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${url}`);
  }

  return res.text();
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#215;/g, "×")
    .replace(/&times;/g, "×")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(value = "") {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${ROOT}${url}`;
  return url;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function productLinks(html) {
  const links = [];

  const regex =
    /href=["'](https?:\/\/pulsetiles\.co\.za\/product\/[^"'?#]+\/?)["']/gi;

  let match;
  while ((match = regex.exec(html))) {
    links.push(match[1].replace(/\/?$/, "/"));
  }

  return unique(links);
}

async function crawlCategory(category) {
  const products = new Set();
  let emptyPages = 0;

  for (let page = 1; page <= 60; page++) {
    const url =
      page === 1
        ? category.url
        : `${category.url.replace(/\/$/, "")}/page/${page}/`;

    try {
      const html = await getHtml(url);
      const links = productLinks(html);

      const before = products.size;
      links.forEach((x) => products.add(x));

      if (products.size === before || links.length === 0) {
        emptyPages++;
      } else {
        emptyPages = 0;
      }

      if (emptyPages >= 2) break;

      await sleep(120);
    } catch (err) {
      if (page === 1) {
        console.warn(`Could not load ${category.name}:`, err.message);
      }
      break;
    }
  }

  return [...products];
}

function meta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const a = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i"
  ).exec(html);

  if (a) return decodeHtml(a[1]);

  const b = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
    "i"
  ).exec(html);

  return b ? decodeHtml(b[1]) : "";
}

function firstHeading(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return m ? stripTags(m[1]) : "";
}

function findSku(html) {
  const text = stripTags(html);

  const patterns = [
    /\bSKU\s*:\s*([A-Za-z0-9._/-]+)/i,
    /\bProduct\s*Code\s*:\s*([A-Za-z0-9._/-]+)/i,
  ];

  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[1].trim();
  }

  return "";
}

function tableAttributes(html) {
  const attrs = {};

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row;

  while ((row = rowRegex.exec(html))) {
    const cells = [];
    const cellRegex = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
    let cell;

    while ((cell = cellRegex.exec(row[1]))) {
      cells.push(stripTags(cell[1]));
    }

    if (cells.length >= 2) {
      const key = cells[0].replace(/\s+/g, " ").trim();
      const value = cells.slice(1).join(" ").trim();

      if (key && value) attrs[key] = value;
    }
  }

  return attrs;
}

function attr(attrs, ...names) {
  const entries = Object.entries(attrs);

  for (const name of names) {
    const found = entries.find(
      ([k]) => k.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (found) return found[1];
  }

  return "";
}

function priceFromPage(html) {
  return (
    meta(html, "product:price:amount") ||
    meta(html, "og:price:amount") ||
    ""
  );
}

function parseProduct(url, html, categories) {
  const attrs = tableAttributes(html);

  const name =
    firstHeading(html) ||
    meta(html, "og:title").replace(/\s*[–|-]\s*Pulse Tiles.*$/i, "");

  const description =
    meta(html, "og:description") ||
    meta(html, "description");

  const tileSize =
    attr(attrs, "Tile Size") ||
    attr(attrs, "Size") ||
    "";

  const qtyPerBox =
    attr(
      attrs,
      "Quantity Per Box",
      "Qty Per Box",
      "Tiles Per Box"
    ) || "";

  const sqmPerBox =
    attr(
      attrs,
      "Square Meters Per Box",
      "Square Metres Per Box",
      "m2 Per Box",
      "m² Per Box"
    ) || "";

  return {
    sku: findSku(html),
    name,
    categories: unique(categories),
    tileSize,
    quantityPerBox: qtyPerBox,
    squareMetersPerBox: sqmPerBox,
    tileLength: attr(attrs, "Tile Length"),
    tileWidth: attr(attrs, "Tile Width"),
    tileThickness: attr(attrs, "Tile Thickness"),
    weight: attr(attrs, "Weight"),
    soldBy: attr(attrs, "Sold"),
    price: priceFromPage(html),
    currency: "ZAR",
    description,
    image: absoluteUrl(meta(html, "og:image")),
    sourceUrl: url,
  };
}

const productMap = new Map();

console.log("Finding Pulse Tiles products...");

for (const category of CATEGORIES) {
  console.log(`Scanning ${category.name}...`);

  const links = await crawlCategory(category);

  console.log(`  ${links.length} product links found`);

  for (const url of links) {
    if (!productMap.has(url)) {
      productMap.set(url, {
        categories: new Set(),
      });
    }

    productMap.get(url).categories.add(category.name);
  }
}

const links = [...productMap.keys()];

console.log(`\nUnique tile products found: ${links.length}`);
console.log("Reading product codes and specifications...\n");

const products = [];

for (let i = 0; i < links.length; i++) {
  const url = links[i];
  const details = productMap.get(url);

  try {
    const html = await getHtml(url);

    const product = parseProduct(
      url,
      html,
      [...details.categories]
    );

    if (product.name) {
      products.push(product);

      console.log(
        `[${i + 1}/${links.length}] ${product.sku || "NO SKU"} - ${product.name}`
      );
    }
  } catch (err) {
    console.warn(`[${i + 1}/${links.length}] FAILED ${url}: ${err.message}`);
  }

  await sleep(100);
}

products.sort((a, b) =>
  (a.name || "").localeCompare(b.name || "")
);

const outputDir = path.resolve("app/data");
await fs.mkdir(outputDir, { recursive: true });

const generatedAt = new Date().toISOString();

const file = `// AUTO-GENERATED FILE.
// Source: https://pulsetiles.co.za/tiles/
// Generated: ${generatedAt}
// Run: node scripts/sync-pulse-tiles.mjs

export const PULSE_TILES_SYNCED_AT = ${JSON.stringify(generatedAt)};

export const PULSE_TILES = ${JSON.stringify(products, null, 2)} as const;

export type PulseTile = (typeof PULSE_TILES)[number];
`;

await fs.writeFile(
  path.join(outputDir, "pulse-tiles.generated.ts"),
  file,
  "utf8"
);

console.log("\n--------------------------------------");
console.log(`Pulse Tiles imported: ${products.length}`);
console.log("Created: app/data/pulse-tiles.generated.ts");
console.log("--------------------------------------");