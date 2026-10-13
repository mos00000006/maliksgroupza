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
  coverPage: number;
  endPage: number;
};

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 2480;
const CANVAS_H = 3508;

const pageRenderScale = () => {
  if (typeof window === "undefined") return 1;
  const width = Math.min(window.innerWidth || 9999, window.screen?.width || 9999);
  if (width <= 760) return 0.8;
  if (width <= 1024) return 0.9;
  return 1;
};

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
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeCategory = (value: string) => cleanText(value || "General") || "General";

const CATEGORY_ORDER = [
  "Plumbing",
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
  "Fencing",
  "Locksets",
  "Fasteners",
  "Ironmongery",
  "Tools",
  "Garden",
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
) => {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = fill;
  lines.forEach((line, index) => ctx.fillText(line, centreX, startY + index * lineHeight));
};

const drawImageCover = (ctx: CanvasRenderingContext2D, image: LoadedImage, x: number, y: number, width: number, height: number) => {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = Math.max(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const drawX = x + (width - drawW) / 2;
  const drawY = y + (height - drawH) / 2;
  ctx.drawImage(image.element, drawX, drawY, drawW, drawH);
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
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, CANVAS_H - 92, CANVAS_W, 92);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, CANVAS_H - 92, CANVAS_W, 7);
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, CANVAS_H - 85, CANVAS_W, 85);

  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE;
  ctx.font = `700 18px ${FONT_BOLD}`;
  ctx.textAlign = "left";
  ctx.fillText("POWERBUILD WHOLESALE DIVISION", 54, CANVAS_H - 54);

  ctx.font = `600 17px ${FONT_REGULAR}`;
  ctx.textAlign = "center";
  ctx.fillText("www.powerbuild.co.za  ·  For orders & enquiries, contact your PowerBuild representative", CANVAS_W / 2, CANVAS_H - 30);

  ctx.font = `700 17px ${FONT_BOLD}`;
  ctx.textAlign = "right";
  ctx.fillText(`${page} / ${totalPages}`, CANVAS_W - 54, CANVAS_H - 54);
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
    const margin = 24;
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
) => {
  const { canvas, ctx } = createPageCanvas();

  ctx.fillStyle = LIGHT;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRoundedRect(ctx, 36, 30, CANVAS_W - 72, 132, 26, WHITE, MID, 2);
  drawLogo(ctx, logo, 62, 52, 190, 86);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = BLUE;
  ctx.font = `900 48px ${FONT_BOLD}`;
  ctx.fillText("CONTENTS", CANVAS_W - 66, 82);
  ctx.fillStyle = MUTED;
  ctx.font = `600 21px ${FONT_REGULAR}`;
  ctx.fillText("Wholesale product categories", CANVAS_W - 66, 124);

  const startY = 216;
  const rowH = 112;
  plans.forEach((plan, index) => {
    const y = startY + index * rowH;
    drawShadow(ctx, 10, "rgba(15, 23, 42, 0.06)", 3);
    drawRoundedRect(ctx, 58, y, CANVAS_W - 116, 88, 18, WHITE, "#e0e8f1", 1.5);
    clearShadow(ctx);

    drawRoundedRect(ctx, 76, y + 18, 54, 52, 14, index % 2 === 0 ? BLUE : NAVY);
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 20px ${FONT_BOLD}`;
    ctx.fillText(String(index + 1).padStart(2, "0"), 103, y + 44);

    ctx.textAlign = "left";
    ctx.fillStyle = TEXT;
    ctx.font = `900 25px ${FONT_BOLD}`;
    ctx.fillText(plan.category.toUpperCase(), 154, y + 34);
    ctx.fillStyle = MUTED;
    ctx.font = `600 18px ${FONT_REGULAR}`;
    ctx.fillText(`${plan.items.length} products`, 154, y + 62);

    drawRoundedRect(ctx, CANVAS_W - 260, y + 17, 176, 54, 16, SOFT_BLUE, "#c9dced", 1.5);
    ctx.textAlign = "center";
    ctx.fillStyle = BLUE;
    ctx.font = `900 20px ${FONT_BOLD}`;
    const pageText = plan.coverPage === plan.endPage ? `PAGE ${plan.coverPage}` : `PAGES ${plan.coverPage}-${plan.endPage}`;
    ctx.fillText(pageText, CANVAS_W - 172, y + 44);
  });

  drawFooter(ctx, 2, totalPages);
  return canvasToJpeg(canvas, 0.975);
};

const selectCategoryImages = (items: WholesaleCatalogueProduct[], imageMap: Map<number, LoadedImage>) => {
  const selected: Array<{ product: WholesaleCatalogueProduct; image: LoadedImage | null }> = [];
  for (const product of items) {
    const image = imageMap.get(product.id) ?? null;
    if (image) selected.push({ product, image });
    if (selected.length >= 3) break;
  }
  if (selected.length < 3) {
    for (const product of items) {
      if (selected.some((entry) => entry.product.id === product.id)) continue;
      selected.push({ product, image: null });
      if (selected.length >= 3) break;
    }
  }
  return selected;
};

const drawCategoryCoverPage = async (
  plan: CategoryPlan,
  logo: LoadedImage | null,
  imageMap: Map<number, LoadedImage>,
  totalPages: number,
) => {
  const { canvas, ctx } = createPageCanvas();

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  gradient.addColorStop(0, "#eaf3fd");
  gradient.addColorStop(0.48, "#ffffff");
  gradient.addColorStop(1, "#f4f7fb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(CANVAS_W, 0);
  ctx.lineTo(CANVAS_W, 255);
  ctx.lineTo(0, 360);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = YELLOW;
  ctx.beginPath();
  ctx.moveTo(0, 332);
  ctx.lineTo(CANVAS_W, 226);
  ctx.lineTo(CANVAS_W, 249);
  ctx.lineTo(0, 355);
  ctx.closePath();
  ctx.fill();

  drawLogo(ctx, logo, 70, 62, 226, 115);
  ctx.fillStyle = WHITE;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = `900 30px ${FONT_BOLD}`;
  ctx.fillText("WHOLESALE DIVISION", CANVAS_W - 78, 92);
  ctx.font = `600 21px ${FONT_REGULAR}`;
  ctx.fillText("PRODUCT CATALOGUE", CANVAS_W - 78, 137);

  ctx.textAlign = "center";
  ctx.fillStyle = NAVY;
  ctx.font = `900 58px ${FONT_BOLD}`;
  const titleLines = wrapCanvasText(ctx, plan.category.toUpperCase(), CANVAS_W - 160, 2);
  drawCenteredLines(ctx, titleLines, CANVAS_W / 2, 420, 68, NAVY);

  drawRoundedRect(ctx, CANVAS_W / 2 - 150, 565, 300, 62, 22, YELLOW);
  ctx.fillStyle = NAVY;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 24px ${FONT_BOLD}`;
  ctx.fillText(`${plan.items.length} PRODUCTS`, CANVAS_W / 2, 596);

  ctx.fillStyle = MUTED;
  ctx.font = `600 21px ${FONT_REGULAR}`;
  ctx.fillText("Wholesale product range", CANVAS_W / 2, 660);

  const samples = selectCategoryImages(plan.items, imageMap);
  const cardW = 326;
  const cardH = 450;
  const gap = 24;
  const totalW = cardW * 3 + gap * 2;
  const left = (CANVAS_W - totalW) / 2;
  const top = 730;

  samples.forEach(({ product, image }, index) => {
    const x = left + index * (cardW + gap);
    drawShadow(ctx, 18, "rgba(15, 23, 42, 0.10)", 6);
    drawRoundedRect(ctx, x, top, cardW, cardH, 24, WHITE, "#d7e1eb", 1.8);
    clearShadow(ctx);

    const imageX = x + 22;
    const imageY = top + 24;
    const imageW = cardW - 44;
    const imageH = 292;
    drawRoundedRect(ctx, imageX, imageY, imageW, imageH, 18, LIGHT, MID, 1.5);
    if (image) {
      drawImageContain(ctx, image, imageX + 12, imageY + 12, imageW - 24, imageH - 24);
    } else {
      ctx.fillStyle = BLUE;
      ctx.font = `900 18px ${FONT_BOLD}`;
      ctx.textAlign = "center";
      ctx.fillText("PRODUCT IMAGE", x + cardW / 2, imageY + imageH / 2 - 8);
      ctx.fillStyle = MUTED;
      ctx.font = `600 15px ${FONT_REGULAR}`;
      ctx.fillText("Image pending", x + cardW / 2, imageY + imageH / 2 + 22);
    }

    const productName = cleanText(product.name || product.description || product.code);
    ctx.font = `900 21px ${FONT_BOLD}`;
    const productLines = wrapCanvasText(ctx, productName, cardW - 42, 3);
    drawCenteredLines(ctx, productLines, x + cardW / 2, top + 338, 25, TEXT);

    drawRoundedRect(ctx, x + 65, top + 404, cardW - 130, 30, 15, SOFT_BLUE);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BLUE;
    ctx.font = `800 15px ${FONT_BOLD}`;
    const publicCode = `CODE: ${cleanText(product.code)}`;
    ctx.fillText(publicCode, x + cardW / 2, top + 419);
  });

  drawRoundedRect(ctx, 170, 1250, CANVAS_W - 340, 112, 28, WHITE, MID, 1.6);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = DEEP_BLUE;
  ctx.font = `700 21px ${FONT_BOLD}`;
  ctx.fillText("BROWSE THE COMPLETE RANGE ON THE FOLLOWING PAGES", CANVAS_W / 2, 1290);
  ctx.fillStyle = MUTED;
  ctx.font = `600 18px ${FONT_REGULAR}`;
  ctx.fillText("All active products from the Company Hub catalogue are included.", CANVAS_W / 2, 1331);

  drawFooter(ctx, plan.coverPage, totalPages);
  return canvasToJpeg(canvas, 0.98);
};


const getVariantCodes = (product: WholesaleCatalogueProduct) => {
  const text = `${product.category || ""} ${product.description || ""}`.toUpperCase();
  const baseCode = cleanText(product.code || "");
  if (!baseCode) return [] as { label: string; code: string }[];
  const variants: { label: string; code: string }[] = [];
  if (text.includes("5L / 20L")) {
    variants.push({ label: "5L CODE", code: `${baseCode}-5L` });
    variants.push({ label: "20L CODE", code: `${baseCode}-20L` });
  } else if (text.includes("5L")) {
    variants.push({ label: "5L CODE", code: `${baseCode}-5L` });
  }
  return variants;
};

const drawProductCard = (
  ctx: CanvasRenderingContext2D,
  product: WholesaleCatalogueProduct,
  image: LoadedImage | null,
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
  const imageFrameH = height - 150;
  drawRoundedRect(ctx, imageFrameX, imageFrameY, imageFrameW, imageFrameH, 16, LIGHT, MID, 1.4);

  if (image) {
    drawImageContain(ctx, image, imageFrameX + 10, imageFrameY + 10, imageFrameW - 20, imageFrameH - 20);
  } else {
    ctx.fillStyle = "#9aa8b7";
    ctx.font = `900 17px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PRODUCT IMAGE", x + width / 2, imageFrameY + imageFrameH / 2 - 10);
    ctx.fillStyle = MUTED;
    ctx.font = `600 14px ${FONT_REGULAR}`;
    ctx.fillText("Upload in catalogue", x + width / 2, imageFrameY + imageFrameH / 2 + 20);
  }

  const name = cleanText(product.name || product.description || product.code);
  ctx.font = `900 18px ${FONT_BOLD}`;
  const nameLines = wrapCanvasText(ctx, name, width - 34, 2);
  const nameTop = y + height - 118;
  drawCenteredLines(ctx, nameLines, x + width / 2, nameTop, 22, TEXT);

  const subtitle = cleanText(product.description && product.description !== product.name ? product.description : "");
  let codeBadgeOffset = 0;
  if (subtitle && nameLines.length < 2) {
    ctx.font = `600 13px ${FONT_REGULAR}`;
    const subtitleLines = wrapCanvasText(ctx, subtitle, width - 38, 1);
    drawCenteredLines(ctx, subtitleLines, x + width / 2, nameTop + 45, 16, MUTED);
  }

  const variantCodes = getVariantCodes(product);
  if (variantCodes.length) {
    let variantY = nameTop + (subtitle && nameLines.length < 2 ? 68 : 44);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const variant of variantCodes.slice(0, 2)) {
      const text = `${variant.label}: ${variant.code}`;
      ctx.font = `800 11px ${FONT_BOLD}`;
      const vw = Math.min(width - 44, Math.max(126, ctx.measureText(text).width + 24));
      const vx = x + (width - vw) / 2;
      drawRoundedRect(ctx, vx, variantY - 11, vw, 22, 11, "#f7faff", "#d9e3ef", 1);
      ctx.fillStyle = BLUE;
      ctx.fillText(text, x + width / 2, variantY);
      variantY += 26;
    }
    codeBadgeOffset = variantCodes.length * 26 + 4;
  }

  const publicCode = `CODE: ${cleanText(product.code)}`;
  const badgeWidth = Math.min(width - 42, Math.max(130, ctx.measureText(publicCode).width + 78));
  const badgeX = x + (width - badgeWidth) / 2;
  const badgeY = y + height - 48 - codeBadgeOffset;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 31, 15, YELLOW);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = NAVY;
  ctx.font = `900 14px ${FONT_BOLD}`;
  ctx.fillText(publicCode, x + width / 2, badgeY + 16);
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
  ctx.font = `900 25px ${FONT_BOLD}`;
  ctx.fillText("WHOLESALE DIVISION", CANVAS_W / 2, 55);
  ctx.fillStyle = MUTED;
  ctx.font = `600 15px ${FONT_REGULAR}`;
  ctx.fillText("PRODUCT CATALOGUE", CANVAS_W / 2, 80);

  drawRoundedRect(ctx, 54, 122, CANVAS_W - 108, 55, 18, NAVY);
  ctx.fillStyle = WHITE;
  ctx.font = `900 25px ${FONT_BOLD}`;
  const categoryLabel = categoryPages > 1 ? `${category.toUpperCase()} · ${categoryPage} / ${categoryPages}` : category.toUpperCase();
  ctx.fillText(categoryLabel, CANVAS_W / 2, 149);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(84, 194, CANVAS_W - 168, 6);

  const gridX = 44;
  const gridY = 224;
  const cols = 4;
  const rows = 4;
  const gapX = 18;
  const gapY = 18;
  const cardW = (CANVAS_W - gridX * 2 - gapX * (cols - 1)) / cols;
  const cardH = (CANVAS_H - gridY - 124 - gapY * (rows - 1)) / rows;

  items.forEach((product, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = gridX + col * (cardW + gapX);
    const y = gridY + row * (cardH + gapY);
    drawProductCard(ctx, product, imageMap.get(product.id) ?? null, x, y, cardW, cardH);
  });

  drawFooter(ctx, absolutePage, totalPages);
  return canvasToJpeg(canvas, 0.98);
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
        document.fonts.add(localFont);
        return;
      } catch {
        // Try a bundled font file next.
      }
      try {
        const bundledFont = new FontFace("Nexa", `url(${file})`, { weight });
        await bundledFont.load();
        document.fonts.add(bundledFont);
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

export async function downloadWholesaleCatalogue(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  await tryLoadNexaFonts();

  const sorted = [...products].sort((a, b) => {
    const categoryCompare = categoryRank(a.category) - categoryRank(b.category);
    if (categoryCompare) return categoryCompare;
    const labelCompare = safeCategory(a.category).localeCompare(safeCategory(b.category));
    if (labelCompare) return labelCompare;
    return cleanText(a.name || a.description || a.code).localeCompare(cleanText(b.name || b.description || b.code));
  });

  const groups = new Map<string, WholesaleCatalogueProduct[]>();
  for (const product of sorted) {
    const category = safeCategory(product.category);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(product);
  }

  const pageCapacity = 16;
  let nextPage = 3; // Page 1 cover, page 2 contents.
  const plans: CategoryPlan[] = Array.from(groups.entries()).map(([category, items]) => {
    const productPages = Math.ceil(items.length / pageCapacity);
    const coverPage = nextPage;
    const endPage = coverPage + productPages;
    nextPage = endPage + 1;
    return { category, items, productPages, coverPage, endPage };
  });
  const totalPages = nextPage - 1;

  onProgress?.("Preparing PowerBuild branding...", 10);
  let cover: LoadedImage | null = null;
  let logo: LoadedImage | null = null;
  try {
    cover = await loadImageElement("/wholesale-division-cover-v2.png");
  } catch {
    cover = null;
  }
  try {
    logo = await loadImageElement("/powerbuild-logo-transparent.png");
  } catch {
    logo = null;
  }

  const productsWithImages = sorted.filter((product) => Boolean(product.image_url));
  const imageMap = new Map<number, LoadedImage>();
  const concurrency = 5;
  let completed = 0;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, productsWithImages.length) }, async () => {
    while (true) {
      const current = cursor++;
      if (current >= productsWithImages.length) return;
      const product = productsWithImages[current];
      try {
        imageMap.set(product.id, await loadImageElement(product.image_url));
      } catch {
        // Product remains in the PDF with a styled placeholder.
      }
      completed += 1;
      const percent = 12 + Math.round((completed / Math.max(1, productsWithImages.length)) * 31);
      onProgress?.(`Loading catalogue pictures ${completed}/${productsWithImages.length}...`, percent);
    }
  });
  await Promise.all(workers);

  onProgress?.("Creating cover and contents...", 46);
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

  addPage(await drawCoverPage(products.length, cover), "Pg1");
  addPage(await drawContentsPage(plans, logo, totalPages), "Pg2");

  let built = 0;
  const renderTotal = plans.reduce((sum, plan) => sum + 1 + plan.productPages, 0);
  for (const plan of plans) {
    addPage(
      await drawCategoryCoverPage(plan, logo, imageMap, totalPages),
      `Pg${plan.coverPage}`,
    );
    built += 1;
    onProgress?.(
      `Building ${plan.category} section...`,
      48 + Math.round((built / Math.max(1, renderTotal)) * 46),
    );

    for (let start = 0; start < plan.items.length; start += pageCapacity) {
      const slice = plan.items.slice(start, start + pageCapacity);
      const categoryPage = Math.floor(start / pageCapacity) + 1;
      const absolutePage = plan.coverPage + categoryPage;
      addPage(
        await drawProductPage(
          plan.category,
          slice,
          imageMap,
          logo,
          categoryPage,
          plan.productPages,
          absolutePage,
          totalPages,
        ),
        `Pg${absolutePage}`,
      );
      built += 1;
      onProgress?.(
        `Building catalogue page ${absolutePage}/${totalPages}...`,
        48 + Math.round((built / Math.max(1, renderTotal)) * 46),
      );
    }
  }

  onProgress?.("Finalising PDF download...", 96);
  pdf.set(pagesRef, `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  pdf.set(catalogRef, `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

  const output = pdf.build(catalogRef);
  const pdfBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  const blob = new Blob([pdfBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `PowerBuild_Wholesale_Division_Catalogue_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);

  releaseImage(cover);
  releaseImage(logo);
  imageMap.forEach((image) => releaseImage(image));
  onProgress?.("Wholesale catalogue downloaded.", 100);
}
