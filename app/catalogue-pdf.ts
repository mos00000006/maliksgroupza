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

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 1240;
const CANVAS_H = 1754;
const BLUE = "#0b4f94";
const DEEP_BLUE = "#17344f";
const NAVY = "#0f2350";
const YELLOW = "#ffd23f";
const GOLD = "#f7c948";
const LIGHT = "#f4f7fb";
const MID = "#dde6f0";
const TEXT = "#0f172a";
const MUTED = "#5b6b80";
const WHITE = "#ffffff";
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
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const blobToJpeg = async (blob: Blob, maxDimension = 420, quality = 0.76): Promise<PdfImage> => {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read catalogue image."));
      img.src = objectUrl;
    });
    const sourceW = image.naturalWidth || image.width;
    const sourceH = image.naturalHeight || image.height;
    const scale = Math.min(1, maxDimension / Math.max(sourceW, sourceH));
    const width = Math.max(1, Math.round(sourceW * scale));
    const height = Math.max(1, Math.round(sourceH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare catalogue image.");
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const binary = atob(dataUrl.split(",")[1]);
    const output = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
    return { bytes: output, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const canvasToJpeg = async (canvas: HTMLCanvasElement, quality = 0.88): Promise<PdfImage> => {
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
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length > maxLines) lines.length = maxLines;
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
  const scale = Math.min(width / image.width, height / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const drawX = x + (width - drawW) / 2;
  const drawY = y + (height - drawH) / 2;
  ctx.drawImage(image.element, drawX, drawY, drawW, drawH);
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
    drawImageCover(ctx, cover, 0, 0, CANVAS_W, CANVAS_H);
    drawRoundedRect(ctx, 82, 1464, CANVAS_W - 164, 172, 30, "rgba(255,255,255,0.94)", MID, 2);
    ctx.fillStyle = BLUE;
    ctx.font = `900 34px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.fillText(`${productCount} PRODUCTS · LIVE HUB EDITION`, CANVAS_W / 2, 1510);
    ctx.fillStyle = DEEP_BLUE;
    ctx.font = `600 24px ${FONT_REGULAR}`;
    ctx.fillText("Generated from the PowerBuild Company Hub", CANVAS_W / 2, 1560);
    ctx.fillStyle = MUTED;
    ctx.font = `500 18px ${FONT_REGULAR}`;
    ctx.fillText(new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }), CANVAS_W / 2, 1605);
  } else {
    ctx.fillStyle = "#eaf1fb";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = BLUE;
    ctx.fillRect(0, 0, CANVAS_W, 260);
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, 232, CANVAS_W, 18);
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, CANVAS_H - 140, CANVAS_W, 140);

    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.font = `900 54px ${FONT_BOLD}`;
    ctx.fillText("POWERBUILD", CANVAS_W / 2, 95);
    ctx.font = `900 70px ${FONT_BOLD}`;
    ctx.fillStyle = BLUE;
    ctx.fillText("WHOLESALE", CANVAS_W / 2, 540);
    ctx.fillText("DIVISION", CANVAS_W / 2, 625);
    ctx.font = `900 42px ${FONT_BOLD}`;
    ctx.fillStyle = NAVY;
    ctx.fillText("PRODUCT CATALOGUE", CANVAS_W / 2, 710);

    drawRoundedRect(ctx, 300, 785, 640, 120, 28, WHITE, MID, 2);
    ctx.fillStyle = BLUE;
    ctx.font = `900 38px ${FONT_BOLD}`;
    ctx.fillText(`${productCount} PRODUCTS`, CANVAS_W / 2, 830);
    ctx.fillStyle = MUTED;
    ctx.font = `600 24px ${FONT_REGULAR}`;
    ctx.fillText("Generated from the PowerBuild Company Hub", CANVAS_W / 2, 878);

    ctx.fillStyle = WHITE;
    ctx.font = `700 28px ${FONT_BOLD}`;
    ctx.fillText("PAINT · PLUMBING · DOORS & WINDOWS", CANVAS_W / 2, CANVAS_H - 96);
    ctx.font = `700 24px ${FONT_BOLD}`;
    ctx.fillText("FASTENERS · FENCING · WATERPROOFING & ROOFING & MANY MORE", CANVAS_W / 2, CANVAS_H - 56);
  }

  return canvasToJpeg(canvas, 0.9);
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
  drawShadow(ctx, 14, "rgba(15, 23, 42, 0.08)", 4);
  drawRoundedRect(ctx, x, y, width, height, 18, WHITE, "#d6e0ea", 2);
  clearShadow(ctx);

  drawRoundedRect(ctx, x + 14, y + 14, width - 28, 44, 14, BLUE);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = WHITE;
  ctx.font = `900 19px ${FONT_BOLD}`;
  ctx.fillText(cleanText(product.code), x + width / 2, y + 36);

  const imageFrameX = x + 18;
  const imageFrameY = y + 74;
  const imageFrameW = width - 36;
  const imageFrameH = height - 180;
  drawRoundedRect(ctx, imageFrameX, imageFrameY, imageFrameW, imageFrameH, 16, LIGHT, MID, 1.6);

  if (image) {
    drawImageContain(ctx, image, imageFrameX + 10, imageFrameY + 10, imageFrameW - 20, imageFrameH - 20);
  } else {
    drawRoundedRect(ctx, imageFrameX + imageFrameW / 2 - 36, imageFrameY + 24, 72, 72, 16, WHITE, MID, 2);
    ctx.strokeStyle = "#9aa8b7";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(imageFrameX + imageFrameW / 2 - 14, imageFrameY + 44);
    ctx.lineTo(imageFrameX + imageFrameW / 2 + 14, imageFrameY + 72);
    ctx.moveTo(imageFrameX + imageFrameW / 2 - 14, imageFrameY + 72);
    ctx.lineTo(imageFrameX + imageFrameW / 2 + 14, imageFrameY + 44);
    ctx.stroke();
    ctx.fillStyle = BLUE;
    ctx.font = `800 17px ${FONT_BOLD}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("PRODUCT IMAGE", x + width / 2, imageFrameY + imageFrameH / 2 - 4);
    ctx.fillStyle = MUTED;
    ctx.font = `600 15px ${FONT_REGULAR}`;
    ctx.fillText("Upload image in catalogue to show here", x + width / 2, imageFrameY + imageFrameH / 2 + 24);
  }

  const name = cleanText(product.name || product.description || product.code);
  const subtitle = cleanText(product.description && product.description !== product.name ? product.description : "");
  ctx.fillStyle = TEXT;
  ctx.font = `900 20px ${FONT_BOLD}`;
  const nameLines = wrapCanvasText(ctx, name, width - 36, 3);
  drawCenteredLines(ctx, nameLines, x + width / 2, y + height - 90, 23, TEXT);

  if (subtitle) {
    ctx.fillStyle = MUTED;
    ctx.font = `600 15px ${FONT_REGULAR}`;
    const subLines = wrapCanvasText(ctx, subtitle, width - 36, 2);
    drawCenteredLines(ctx, subLines, x + width / 2, y + height - 28 - subLines.length * 16, 18, MUTED);
  }
};

const drawProductPage = async (
  category: string,
  items: WholesaleCatalogueProduct[],
  imageMap: Map<number, LoadedImage>,
  categoryPage: number,
  categoryPages: number,
  absolutePage: number,
  totalPages: number,
) => {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create PDF page.");

  ctx.fillStyle = "#eff4f9";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawRoundedRect(ctx, 34, 28, CANVAS_W - 68, 54, 18, BLUE);
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 28px ${FONT_BOLD}`;
  ctx.fillText("WHOLESALE DIVISION", CANVAS_W / 2, 55);

  drawRoundedRect(ctx, 54, 102, CANVAS_W - 108, 50, 18, NAVY);
  ctx.fillStyle = WHITE;
  ctx.font = `900 28px ${FONT_BOLD}`;
  const categoryLabel = categoryPages > 1 ? `${category.toUpperCase()} · ${categoryPage} / ${categoryPages}` : category.toUpperCase();
  ctx.fillText(categoryLabel, CANVAS_W / 2, 127);

  ctx.fillStyle = YELLOW;
  ctx.fillRect(84, 170, CANVAS_W - 168, 6);

  const gridX = 44;
  const gridY = 206;
  const cols = 4;
  const rows = 5;
  const gapX = 18;
  const gapY = 18;
  const cardW = (CANVAS_W - gridX * 2 - gapX * (cols - 1)) / cols;
  const cardH = (CANVAS_H - gridY - 112 - gapY * (rows - 1)) / rows;

  items.forEach((product, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = gridX + col * (cardW + gapX);
    const y = gridY + row * (cardH + gapY);
    drawProductCard(ctx, product, imageMap.get(product.id) ?? null, x, y, cardW, cardH);
  });

  drawRoundedRect(ctx, 40, CANVAS_H - 70, CANVAS_W - 80, 34, 17, WHITE, MID, 1.5);
  ctx.fillStyle = BLUE;
  ctx.font = `800 18px ${FONT_BOLD}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("www.powerbuild.co.za", CANVAS_W / 2, CANVAS_H - 53);
  ctx.fillStyle = MUTED;
  ctx.font = `600 16px ${FONT_REGULAR}`;
  ctx.textAlign = "left";
  ctx.fillText(`Page ${absolutePage} of ${totalPages}`, 60, CANVAS_H - 53);
  ctx.textAlign = "right";
  ctx.fillText("Generated from catalogue records", CANVAS_W - 60, CANVAS_H - 53);

  return canvasToJpeg(canvas, 0.9);
};

const tryLoadNexaFonts = async () => {
  if (typeof window === "undefined" || !("fonts" in document) || typeof FontFace === "undefined") return;
  const candidates = [
    { family: "Nexa", url: "/fonts/Nexa-Regular.otf", weight: "400" },
    { family: "Nexa", url: "/fonts/Nexa-Book.otf", weight: "500" },
    { family: "Nexa", url: "/fonts/Nexa-Bold.otf", weight: "700" },
    { family: "Nexa", url: "/fonts/Nexa-Heavy.otf", weight: "900" },
  ];

  await Promise.all(
    candidates.map(async ({ family, url, weight }) => {
      try {
        const font = new FontFace(family, `url(${url})`, { weight });
        await font.load();
        document.fonts.add(font);
      } catch {
        // Font files are optional. If not present, the export falls back to Arial.
      }
    }),
  );

  try {
    await document.fonts.load(`400 16px ${FONT_REGULAR}`);
    await document.fonts.load(`900 16px ${FONT_BOLD}`);
  } catch {
    // Ignore font load issues and continue with browser fallback fonts.
  }
};

export async function downloadWholesaleCatalogue(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  await tryLoadNexaFonts();

  const sorted = [...products].sort((a, b) => {
    const categoryCompare = safeCategory(a.category).localeCompare(safeCategory(b.category));
    if (categoryCompare) return categoryCompare;
    return cleanText(a.name || a.description || a.code).localeCompare(cleanText(b.name || b.description || b.code));
  });

  const groups = new Map<string, WholesaleCatalogueProduct[]>();
  for (const product of sorted) {
    const category = safeCategory(product.category);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(product);
  }

  onProgress?.("Preparing PowerBuild cover...", 16);
  let cover: LoadedImage | null = null;
  try {
    cover = await loadImageElement("/wholesale-division-cover.jpg");
  } catch {
    cover = null;
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
      const percent = 18 + Math.round((completed / Math.max(1, productsWithImages.length)) * 36);
      onProgress?.(`Loading catalogue pictures ${completed}/${productsWithImages.length}...`, percent);
    }
  });
  await Promise.all(workers);

  const pageCapacity = 20;
  const totalProductPages = Array.from(groups.values()).reduce((sum, items) => sum + Math.ceil(items.length / pageCapacity), 0);
  const totalPages = totalProductPages + 1;

  onProgress?.("Rendering wholesale catalogue pages...", 60);
  const renderedPages: PdfImage[] = [];
  renderedPages.push(await drawCoverPage(products.length, cover));

  let absolutePage = 1;
  let builtPages = 0;
  for (const [category, items] of groups) {
    for (let start = 0; start < items.length; start += pageCapacity) {
      const slice = items.slice(start, start + pageCapacity);
      builtPages += 1;
      absolutePage += 1;
      const categoryPage = Math.floor(start / pageCapacity) + 1;
      const categoryPages = Math.ceil(items.length / pageCapacity);
      renderedPages.push(
        await drawProductPage(category, slice, imageMap, categoryPage, categoryPages, absolutePage, totalPages),
      );
      const percent = 60 + Math.round((builtPages / Math.max(1, totalProductPages)) * 32);
      onProgress?.(`Building catalogue pages ${builtPages}/${totalProductPages}...`, percent);
    }
  }

  onProgress?.("Finalising PDF download...", 94);
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

  renderedPages.forEach((page, index) => addPage(page, `Pg${index + 1}`));
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
  imageMap.forEach((image) => releaseImage(image));
  onProgress?.("Wholesale catalogue downloaded.", 100);
}
