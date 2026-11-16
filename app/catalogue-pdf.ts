import { cataloguePdfCategory } from "./catalogue-pdf-grouping";

export type WholesaleCatalogueProduct = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
};

type PdfImage = { bytes: Uint8Array; width: number; height: number };
type ProgressFn = (message: string, percent: number) => void;
type LoadedImage = { element: HTMLImageElement; width: number; height: number };
type CategoryPlan = {
  category: string;
  items: WholesaleCatalogueProduct[];
  productPages: number;
  startPage: number;
  endPage: number;
};

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 2480;
const CANVAS_H = 3508;
const PRODUCT_PAGE_COLUMNS = 2;
const PRODUCT_PAGE_ROWS = 3;
const PRODUCT_PAGE_CAPACITY = PRODUCT_PAGE_COLUMNS * PRODUCT_PAGE_ROWS;
const CONTENTS_ROWS_PER_COLUMN = 14;
const CONTENTS_PAGE_CAPACITY = CONTENTS_ROWS_PER_COLUMN * 2;
let renderScaleOverride: number | null = null;

// The downloadable A4 PDF is always drawn at 300 DPI, regardless of device.
// Only the interactive leaflet uses reduced-resolution screen previews.
const pageRenderScale = () => renderScaleOverride ?? 1;

const createPageCanvas = () => {
  const scale = pageRenderScale();
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(CANVAS_W * scale);
  canvas.height = Math.round(CANVAS_H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create PDF page.");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
};

const BLUE = "#0b4f94";
const DEEP_BLUE = "#17344f";
const NAVY = "#0f2350";
const YELLOW = "#ffd23f";
const LIGHT = "#f5f8fc";
const MID = "#d9e3ee";
const TEXT = "#0f172a";
const MUTED = "#66768a";
const WHITE = "#ffffff";
const SOFT_BLUE = "#eaf2fb";
const FONT_REGULAR = '"Nexa", "Nexa Regular", Arial, sans-serif';
const FONT_BOLD = '"Nexa", "Nexa Bold", Arial, sans-serif';

const bytes = (value: string) => encoder.encode(value);

const concat = (parts: Uint8Array[]) => {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

class PdfWriter {
  private objects: Uint8Array[] = [];

  reserve() {
    this.objects.push(bytes(""));
    return this.objects.length;
  }

  add(body: string | Uint8Array) {
    this.objects.push(typeof body === "string" ? bytes(body) : body);
    return this.objects.length;
  }

  set(ref: number, body: string | Uint8Array) {
    this.objects[ref - 1] = typeof body === "string" ? bytes(body) : body;
  }

  stream(data: Uint8Array, dictionary = "") {
    return this.add(
      concat([
        bytes(`<< /Length ${data.length}${dictionary ? ` ${dictionary}` : ""} >>\nstream\n`),
        data,
        bytes("\nendstream"),
      ]),
    );
  }

  jpeg(image: PdfImage) {
    return this.add(
      concat([
        bytes(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
        ),
        image.bytes,
        bytes("\nendstream"),
      ]),
    );
  }

  build(rootRef: number) {
    const header = bytes("%PDF-1.4\n%PowerBuild\n");
    const chunks: Uint8Array[] = [header];
    const offsets = [0];
    let position = header.length;

    this.objects.forEach((object, index) => {
      const prefix = bytes(`${index + 1} 0 obj\n`);
      const suffix = bytes("\nendobj\n");
      offsets[index + 1] = position;
      chunks.push(prefix, object, suffix);
      position += prefix.length + object.length + suffix.length;
    });

    const xrefPosition = position;
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index <= this.objects.length; index += 1) {
      xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${this.objects.length + 1} /Root ${rootRef} 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
    chunks.push(bytes(xref));
    return concat(chunks);
  }
}

const cleanText = (value: string) =>
  (value || "")
    .replace(/×/g, "x")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeCategory = (value: string) => cleanText((value || "General").replace(/·/g, "-")) || "General";

const CATEGORY_ORDER = [
  "Plumbing",
  "Underground (UG)",
  "Plumbing Pipes",
  "Soil & Vent (SV)",
  "HDPE & Compression Fittings",
  "Copper & Brass Fittings",
  "Galvanised Fittings",
  "PVC & Pressure Fittings",
  "Waste & Trap Fittings",
  "Plumbing Accessories",
  "Electrical & Lighting",
  "Paints & Allied",
  "Waterproofing",
  "Roofing & Gutters",
  "Timber",
  "Boards & Ceilings",
  "Insulation",
  "Bricks & Blocks",
  "Steel & Metal",
  "Doors & Frames",
  "Windows",
  "Window Blinds & Treatments",
  "Fencing",
  "Locks",
  "Locksets",
  "Fasteners",
  "Ironmongery",
  "Tools",
  "Tork Craft",
  "Hamiltons",
  "Tiles & Flooring",
  "Bathroom - Furniture",
  "Bathroom - Taps",
  "Bathroom - Showers",
  "Bathroom - Basins",
  "Bathroom - Toilets",
  "Bathroom - Baths",
  "Garden",
  "Kitchens",
  "Homeware",
  "General Hardware",
  "Adhesives & Chemicals",
] as const;

const categoryRank = (value: string) => {
  const index = CATEGORY_ORDER.indexOf(safeCategory(value) as (typeof CATEGORY_ORDER)[number]);
  return index === -1 ? CATEGORY_ORDER.length : index;
};

const canvasToJpeg = (canvas: HTMLCanvasElement, quality = 0.97): PdfImage => {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const binary = atob(dataUrl.split(",")[1]);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return { bytes: output, width: canvas.width, height: canvas.height };
};

const loadImageElement = async (url: string): Promise<LoadedImage> => {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Could not load image (${response.status}).`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return new Promise<LoadedImage>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ element: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image."));
    };
    img.src = objectUrl;
  });
};

const releaseImage = (image: LoadedImage | null | undefined) => {
  const src = image?.element?.src;
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
  lineWidth = 1,
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawShadow = (ctx: CanvasRenderingContext2D, blur = 18, colour = "rgba(15, 23, 42, 0.10)", offsetY = 6) => {
  ctx.shadowColor = colour;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY;
};

const clearShadow = (ctx: CanvasRenderingContext2D) => {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};

const wrapCanvasText = (
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
) => {
  const words = cleanText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}...`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}...`;
  }
  return lines;
};

const drawCenteredLines = (
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centreX: number,
  startY: number,
  lineHeight: number,
  fill: string,
  maxWidth?: number,
) => {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = fill;
  lines.forEach((line, index) => ctx.fillText(line, centreX, startY + index * lineHeight, maxWidth));
};

const drawImageContain = (
  ctx: CanvasRenderingContext2D,
  image: LoadedImage,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = Math.min(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const drawX = x + (width - drawW) / 2;
  const drawY = y + (height - drawH) / 2;
  ctx.drawImage(image.element, drawX, drawY, drawW, drawH);
};

const drawLogo = (
  ctx: CanvasRenderingContext2D,
  logo: LoadedImage | null,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  if (logo) {
    drawImageContain(ctx, logo, x, y, width, height);
    return;
  }
  ctx.fillStyle = BLUE;
  ctx.font = `900 28px ${FONT_BOLD}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("POWERBUILD", x, y + height / 2);
};

const drawFooter = (
  ctx: CanvasRenderingContext2D,
  page: number,
  totalPages: number,
) => {
  // Keep all text away from non-printable printer edges (5 mm safe zone).
  const footerTop = CANVAS_H - 170;
  const margin = 58;
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, footerTop, CANVAS_W, 170);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(margin, footerTop + 8, CANVAS_W - margin * 2, 7);
  ctx.fillStyle = NAVY;
  ctx.fillRect(margin, footerTop + 15, CANVAS_W - margin * 2, 99);

  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE;
  ctx.font = `700 26px ${FONT_BOLD}`;
  ctx.textAlign = "left";
  ctx.fillText("POWERBUILD WHOLESALE DIVISION", margin + 30, footerTop + 53);

  ctx.font = `600 24px ${FONT_REGULAR}`;
  ctx.textAlign = "center";
  ctx.fillText("www.powerbuild.co.za  |  For orders and enquiries, contact your representative", CANVAS_W / 2, footerTop + 88);

  ctx.font = `700 26px ${FONT_BOLD}`;
  ctx.textAlign = "right";
  ctx.fillText(`${page} / ${totalPages}`, CANVAS_W - margin - 30, footerTop + 53);
};

const drawCoverPage = async (productCount: number, cover: LoadedImage | null) => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create PDF page.");

  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (cover) {
    const margin = 54;
    drawImageContain(ctx, cover, margin, margin, CANVAS_W - margin * 2, CANVAS_H - margin * 2);
    return canvasToJpeg(canvas, 0.985);
  }

  // Fallback cover if the artwork is unavailable
  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bg.addColorStop(0, "#f8fbff");
  bg.addColorStop(1, "#eef4fb");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, CANVAS_W, 100);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 100, CANVAS_W, 18);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = `900 96px ${FONT_BOLD}`;
  ctx.fillText("WHOLESALE DIVISION", CANVAS_W / 2, 560);
  ctx.fillStyle = BLUE;
  ctx.font = `900 54px ${FONT_BOLD}`;
  ctx.fillText("PRODUCT CATALOGUE", CANVAS_W / 2, 660);
  ctx.fillStyle = MUTED;
  ctx.font = `700 30px ${FONT_REGULAR}`;
  ctx.fillText(`${productCount} Products`, CANVAS_W / 2, 760);
  return canvasToJpeg(canvas, 0.985);
};

const drawContentsPage = async (
  plans: CategoryPlan[],
  logo: LoadedImage | null,
  totalPages: number,
  contentsPage: number,
  contentsPages: number,
) => {
  const { canvas, ctx } = createPageCanvas();
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRoundedRect(ctx, 50, 46, CANVAS_W - 100, 160, 20, WHITE, MID, 2);
  drawLogo(ctx, logo, 80, 72, 238, 112);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = `900 57px ${FONT_BOLD}`;
  ctx.fillText("CATALOGUE CONTENTS", CANVAS_W - 92, 111);
  ctx.fillStyle = MUTED;
  ctx.font = `600 28px ${FONT_REGULAR}`;
  ctx.fillText(`Categories and page numbers  |  ${contentsPage} of ${contentsPages}`, CANVAS_W - 92, 163);

  ctx.fillStyle = YELLOW;
  ctx.fillRect(58, 229, CANVAS_W - 116, 8);
  const offset = (contentsPage - 1) * CONTENTS_PAGE_CAPACITY;
  const slice = plans.slice(offset, offset + CONTENTS_PAGE_CAPACITY);
  const gap = 28;
  const margin = 64;
  const columnW = (CANVAS_W - margin * 2 - gap) / 2;
  const rowHeight = 218;
  const firstY = 272;

  slice.forEach((plan, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (columnW + gap);
    const y = firstY + row * rowHeight;
    drawRoundedRect(ctx, x, y, columnW, 194, 18, LIGHT, MID, 1.2);
    drawRoundedRect(ctx, x + 15, y + 20, 66, 62, 12, NAVY);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = WHITE;
    ctx.font = `900 30px ${FONT_BOLD}`;
    ctx.fillText(String(offset + index + 1).padStart(2, "0"), x + 48, y + 51);
    ctx.fillStyle = NAVY;
    ctx.font = `900 29px ${FONT_BOLD}`;
    ctx.textAlign = "left";
    ctx.fillText(plan.category.toUpperCase(), x + 96, y + 48, columnW - 116);
    ctx.fillStyle = MUTED;
    ctx.font = `600 25px ${FONT_REGULAR}`;
    ctx.fillText(`${plan.items.length} products with photographs`, x + 24, y + 117, columnW - 48);
    ctx.fillStyle = BLUE;
    ctx.font = `900 27px ${FONT_BOLD}`;
    const text = plan.startPage === plan.endPage ? `PAGE ${plan.startPage}` : `PAGES ${plan.startPage}-${plan.endPage}`;
    ctx.fillText(text, x + 24, y + 160);
  });

  drawFooter(ctx, 1 + contentsPage, totalPages);
  return canvasToJpeg(canvas, 0.94);
};

const isAssortedProduct = (product: WholesaleCatalogueProduct) => {
  const text = `${product.name || ""} ${product.description || ""}`.toUpperCase();
  return text.includes("5L / 20L") || text.includes("5L/20L") || text.includes("ASSORTED");
};

const drawProductCard = (
  ctx: CanvasRenderingContext2D,
  product: WholesaleCatalogueProduct,
  image: LoadedImage,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  drawShadow(ctx, 12, "rgba(15, 23, 42, 0.075)", 4);
  drawRoundedRect(ctx, x, y, width, height, 20, WHITE, "#d8e2ec", 1.6);
  clearShadow(ctx);

  const imageFrameX = x + 18;
  const imageFrameY = y + 18;
  const imageFrameW = width - 36;
  const imageFrameH = height - 260;
  drawRoundedRect(ctx, imageFrameX, imageFrameY, imageFrameW, imageFrameH, 16, LIGHT, MID, 1.4);

  drawImageContain(ctx, image, imageFrameX + 18, imageFrameY + 18, imageFrameW - 36, imageFrameH - 36);

  const name = cleanText(product.name || product.description || product.code);
  ctx.font = `900 42px ${FONT_BOLD}`;
  const nameLines = wrapCanvasText(ctx, name, width - 104, 2);
  const nameTop = y + height - 215;
  drawCenteredLines(ctx, nameLines, x + width / 2, nameTop, 48, TEXT, width - 104);

  const subtitle = cleanText(product.description && product.description !== product.name ? product.description : "");
  if (subtitle && nameLines.length < 2) {
    ctx.font = `600 26px ${FONT_REGULAR}`;
    const subtitleLines = wrapCanvasText(ctx, subtitle, width - 98, 1);
    drawCenteredLines(ctx, subtitleLines, x + width / 2, nameTop + 103, 29, MUTED, width - 98);
  }

  const assorted = isAssortedProduct(product);
  if (assorted) {
    const label = "ASSORTED";
    ctx.font = `900 17px ${FONT_BOLD}`;
    const badgeWidth = Math.min(width - 70, Math.max(142, ctx.measureText(label).width + 52));
    const badgeX = x + (width - badgeWidth) / 2;
    const badgeY = y + height - 46;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 34, 17, YELLOW);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = NAVY;
    ctx.fillText(label, x + width / 2, badgeY + 17);
  } else {
    const publicCode = `CODE: ${cleanText(product.code)}`;
    ctx.font = `900 24px ${FONT_BOLD}`;
    const badgeWidth = Math.min(width - 42, Math.max(180, ctx.measureText(publicCode).width + 60));
    const badgeX = x + (width - badgeWidth) / 2;
    const badgeY = y + height - 58;
    drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 42, 21, YELLOW);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = NAVY;
    ctx.font = `900 24px ${FONT_BOLD}`;
    ctx.fillText(publicCode, x + width / 2, badgeY + 21);
  }
};

const drawProductPage = async (
  category: string,
  items: WholesaleCatalogueProduct[],
  imageMap: Map<number, LoadedImage>,
  logo: LoadedImage | null,
  categoryPage: number,
  categoryPages: number,
  absolutePage: number,
  totalPages: number,
) => {
  const { canvas, ctx } = createPageCanvas();

  ctx.fillStyle = "#eef3f8";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRoundedRect(ctx, 34, 28, CANVAS_W - 68, 74, 22, WHITE, MID, 1.5);
  drawLogo(ctx, logo, 54, 40, 154, 50);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BLUE;
  ctx.font = `900 30px ${FONT_BOLD}`;
  ctx.fillText("WHOLESALE DIVISION", CANVAS_W / 2, 55);
  ctx.fillStyle = MUTED;
  ctx.font = `600 19px ${FONT_REGULAR}`;
  ctx.fillText("PRODUCT CATALOGUE", CANVAS_W / 2, 80);

  drawRoundedRect(ctx, 54, 122, CANVAS_W - 108, 55, 18, NAVY);
  ctx.fillStyle = YELLOW;
  ctx.textAlign = "left";
  ctx.font = `900 17px ${FONT_BOLD}`;
  ctx.fillText(categoryPage === 1 ? "CATEGORY" : "CONTINUED", 78, 149);
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.font = `900 29px ${FONT_BOLD}`;
  const categoryLabel = categoryPages > 1 ? `${category.toUpperCase()}  ·  ${categoryPage} / ${categoryPages}` : category.toUpperCase();
  ctx.fillText(categoryLabel, CANVAS_W / 2 + 45, 149, CANVAS_W - 510);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(84, 194, CANVAS_W - 168, 6);

  const gridX = 70;
  const gridY = 238;
  const cols = PRODUCT_PAGE_COLUMNS;
  const rows = PRODUCT_PAGE_ROWS;
  const gapX = 24;
  const gapY = 22;
  const cardW = (CANVAS_W - gridX * 2 - gapX * (cols - 1)) / cols;
  const cardH = (CANVAS_H - gridY - 200 - gapY * (rows - 1)) / rows;

  items.forEach((product, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = gridX + col * (cardW + gapX);
    const y = gridY + row * (cardH + gapY);
    const image = imageMap.get(product.id);
    if (!image) return; // Defensive: PDF never prints empty-image placeholders.
    drawProductCard(ctx, product, image, x, y, cardW, cardH);
  });

  drawFooter(ctx, absolutePage, totalPages);
  return canvasToJpeg(canvas, 0.92);
};

const tryLoadNexaFonts = async () => {
  if (typeof window === "undefined" || !("fonts" in document) || typeof FontFace === "undefined") return;

  const fonts = [
    { weight: "400", local: 'local("Nexa Regular"), local("Nexa")', file: "/fonts/Nexa-Regular.otf" },
    { weight: "500", local: 'local("Nexa Book"), local("Nexa")', file: "/fonts/Nexa-Book.otf" },
    { weight: "700", local: 'local("Nexa Bold"), local("Nexa")', file: "/fonts/Nexa-Bold.otf" },
    { weight: "900", local: 'local("Nexa Heavy"), local("Nexa Bold"), local("Nexa")', file: "/fonts/Nexa-Heavy.otf" },
  ];

  await Promise.all(
    fonts.map(async ({ weight, local, file }) => {
      try {
        const localFont = new FontFace("Nexa", local, { weight });
        await localFont.load();
        (document.fonts as FontFaceSet & { add(font: FontFace): void }).add(localFont);
        return;
      } catch {
        // Try a bundled font file next.
      }
      try {
        const bundledFont = new FontFace("Nexa", `url(${file})`, { weight });
        await bundledFont.load();
        (document.fonts as FontFaceSet & { add(font: FontFace): void }).add(bundledFont);
      } catch {
        // Export remains usable with the browser fallback font.
      }
    }),
  );

  try {
    await document.fonts.load('400 16px "Nexa"');
    await document.fonts.load('900 16px "Nexa"');
  } catch {
    // Ignore font loading issues and use the fallback stack.
  }
};

/** Verify that a picture can actually be fetched and decoded before counting it. */
async function preparePrintableProducts(products: WholesaleCatalogueProduct[], onProgress?: ProgressFn) {
  const candidates = products.filter((product) => Boolean(product.image_url?.trim()));
  const imageMap = new Map<number, LoadedImage>();
  const concurrency = 5;
  let completed = 0;
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, candidates.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= candidates.length) return;
      const product = candidates[index];
      try {
        imageMap.set(product.id, await loadImageElement(product.image_url.trim()));
      } catch {
        // The image is missing, blocked, invalid or undecodable: omit the product.
      }
      completed += 1;
      onProgress?.(`Checking product pictures ${completed}/${candidates.length}...`, 8 + Math.round(completed / candidates.length * 35));
    }
  });
  await Promise.all(workers);

  const printable = candidates.filter((p) => imageMap.has(p.id)).sort((a, b) => {
    const aCat = cataloguePdfCategory(a);
    const bCat = cataloguePdfCategory(b);
    return categoryRank(aCat) - categoryRank(bCat)
      || aCat.localeCompare(bCat)
      || cleanText(a.name || a.description || a.code).localeCompare(cleanText(b.name || b.description || b.code));
  });

  if (!printable.length) {
    imageMap.forEach(releaseImage);
    throw new Error("No catalogue products have a working picture. Add photographs before printing the PDF.");
  }

  const grouped = new Map<string, WholesaleCatalogueProduct[]>();
  printable.forEach((product) => {
    const category = cataloguePdfCategory(product);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(product);
  });

  const contentsPages = Math.max(1, Math.ceil(grouped.size / CONTENTS_PAGE_CAPACITY));
  let nextPage = 2 + contentsPages; // Cover + full contents section.
  const plans: CategoryPlan[] = Array.from(grouped.entries()).map(([category, items]) => {
    const productPages = Math.ceil(items.length / PRODUCT_PAGE_CAPACITY);
    const startPage = nextPage;
    const endPage = startPage + productPages - 1;
    nextPage = endPage + 1;
    return { category, items, productPages, startPage, endPage };
  });
  return { imageMap, plans, contentsPages, totalPages: nextPage - 1, productCount: printable.length };
}

async function loadBrandImages() {
  let cover: LoadedImage | null = null;
  let logo: LoadedImage | null = null;
  try { cover = await loadImageElement("/wholesale-division-cover-v2.png"); } catch { /* Fallback cover */ }
  try { logo = await loadImageElement("/powerbuild-logo-transparent.png"); } catch { /* Text fallback */ }
  return { cover, logo };
}

export async function buildWholesaleCataloguePdf(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  await tryLoadNexaFonts();
  const plan = await preparePrintableProducts(products, onProgress);
  const { imageMap, plans, contentsPages, totalPages, productCount } = plan;
  const { cover, logo } = await loadBrandImages();

  try {
    onProgress?.("Creating A4 print-ready catalogue...", 45);
    const pdf = new PdfWriter();
    const catalogRef = pdf.reserve();
    const pagesRef = pdf.reserve();
    const pageRefs: number[] = [];

    const addPage = (image: PdfImage, resourceName: string) => {
      const imageRef = pdf.jpeg(image);
      const content = bytes(`q ${PAGE_W.toFixed(2)} 0 0 ${PAGE_H.toFixed(2)} 0 0 cm /${resourceName} Do Q\n`);
      const contentRef = pdf.stream(content);
      const pageRef = pdf.add(
        `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /XObject << /${resourceName} ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
      );
      pageRefs.push(pageRef);
    };

    addPage(await drawCoverPage(productCount, cover), "Pg1");
    for (let index = 1; index <= contentsPages; index += 1) {
      addPage(await drawContentsPage(plans, logo, totalPages, index, contentsPages), `Pg${index + 1}`);
    }

    let built = 0;
    const renderTotal = plans.reduce((sum, item) => sum + item.productPages, 0);
    for (const section of plans) {
      for (let start = 0; start < section.items.length; start += PRODUCT_PAGE_CAPACITY) {
        const categoryPage = Math.floor(start / PRODUCT_PAGE_CAPACITY) + 1;
        const absolutePage = section.startPage + categoryPage - 1;
        addPage(
          await drawProductPage(
            section.category,
            section.items.slice(start, start + PRODUCT_PAGE_CAPACITY),
            imageMap,
            logo,
            categoryPage,
            section.productPages,
            absolutePage,
            totalPages,
          ),
          `Pg${absolutePage}`,
        );
        built += 1;
        onProgress?.(`Rendering print page ${absolutePage}/${totalPages}...`, 48 + Math.round(built / Math.max(1, renderTotal) * 48));
      }
    }

    pdf.set(pagesRef, `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
    pdf.set(catalogRef, `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
    const output = pdf.build(catalogRef);
    const pdfBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    onProgress?.(`Print-ready PDF: ${productCount} photographed products.`, 100);
    return new Blob([pdfBuffer], { type: "application/pdf" });
  } finally {
    releaseImage(cover);
    releaseImage(logo);
    imageMap.forEach(releaseImage);
  }
}

export async function buildWholesaleLeafletPages(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  await tryLoadNexaFonts();
  const { imageMap, plans, contentsPages, totalPages, productCount } = await preparePrintableProducts(products, onProgress);
  const { cover, logo } = await loadBrandImages();
  const pages: Blob[] = [];
  const originalOverride = renderScaleOverride;
  // Screen previews are smaller than the 300-DPI downloadable PDF.
  renderScaleOverride = typeof window !== "undefined" && Math.min(window.innerWidth, window.screen?.width || window.innerWidth) <= 760 ? 0.36 : 0.44;

  const pushPage = (image: PdfImage) => {
    const buffer = image.bytes.buffer.slice(image.bytes.byteOffset, image.bytes.byteOffset + image.bytes.byteLength) as ArrayBuffer;
    pages.push(new Blob([buffer], { type: "image/jpeg" }));
  };

  try {
    onProgress?.("Creating photo-only leaflet...", 44);
    pushPage(await drawCoverPage(productCount, cover));
    for (let index = 1; index <= contentsPages; index += 1) {
      pushPage(await drawContentsPage(plans, logo, totalPages, index, contentsPages));
    }

    let built = 0;
    const renderTotal = plans.reduce((sum, section) => sum + section.productPages, 0);
    for (const section of plans) {
      for (let start = 0; start < section.items.length; start += PRODUCT_PAGE_CAPACITY) {
        const categoryPage = Math.floor(start / PRODUCT_PAGE_CAPACITY) + 1;
        const absolutePage = section.startPage + categoryPage - 1;
        pushPage(await drawProductPage(
          section.category,
          section.items.slice(start, start + PRODUCT_PAGE_CAPACITY),
          imageMap,
          logo,
          categoryPage,
          section.productPages,
          absolutePage,
          totalPages,
        ));
        built += 1;
        onProgress?.(`Preparing leaflet page ${absolutePage}/${totalPages}...`, 48 + Math.round(built / Math.max(1, renderTotal) * 50));
      }
    }
  } finally {
    renderScaleOverride = originalOverride;
    releaseImage(cover);
    releaseImage(logo);
    imageMap.forEach(releaseImage);
  }

  onProgress?.(`Leaflet ready: ${productCount} photographed products.`, 100);
  return pages;
}

export async function downloadWholesaleCatalogue(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  const blob = await buildWholesaleCataloguePdf(products, onProgress);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `PowerBuild_Wholesale_Division_Print_Catalogue_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  onProgress?.("A4 print catalogue downloaded.", 100);
}
