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

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const BLUE = [0.0, 0.30, 0.62] as const;
const YELLOW = [1.0, 0.84, 0.0] as const;
const BLACK = [0.02, 0.02, 0.02] as const;
const GREY = [0.94, 0.96, 0.98] as const;

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

const pdfEscape = (value: string) => cleanText(value).replace(/([\\()])/g, "\\$1");

const colour = (rgb: readonly number[]) => `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
const yFromTop = (top: number, height = 0) => PAGE_H - top - height;

const rect = (x: number, top: number, width: number, height: number, fill: readonly number[], stroke?: readonly number[]) => {
  let cmd = `${colour(fill)} rg `;
  if (stroke) cmd += `${colour(stroke)} RG `;
  cmd += `${x.toFixed(2)} ${yFromTop(top, height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${stroke ? "B" : "f"}\n`;
  return cmd;
};

const line = (x1: number, top1: number, x2: number, top2: number, stroke: readonly number[], width = 1) =>
  `${colour(stroke)} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${(PAGE_H - top1).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_H - top2).toFixed(2)} l S\n`;

const text = (value: string, x: number, top: number, size: number, font: "F1" | "F2" = "F1", fill: readonly number[] = BLACK) =>
  `BT /${font} ${size.toFixed(2)} Tf ${colour(fill)} rg ${x.toFixed(2)} ${(PAGE_H - top - size).toFixed(2)} Td (${pdfEscape(value)}) Tj ET\n`;

const centredText = (value: string, centreX: number, top: number, size: number, font: "F1" | "F2" = "F1", fill: readonly number[] = BLACK) => {
  const estimatedWidth = cleanText(value).length * size * (font === "F2" ? 0.55 : 0.50);
  return text(value, centreX - estimatedWidth / 2, top, size, font, fill);
};

const wrap = (value: string, maxChars: number, maxLines: number) => {
  const words = cleanText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars) : word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, maxChars - 3))}...`;
  }
  return lines;
};

async function blobToJpeg(blob: Blob, maxDimension = 420, quality = 0.76): Promise<PdfImage> {
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
    ctx.fillStyle = "#ffffff";
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
}

async function fetchJpeg(url: string, maxDimension = 420, quality = 0.76) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Could not load image (${response.status}).`);
  return blobToJpeg(await response.blob(), maxDimension, quality);
}

const imageDraw = (resourceName: string, image: PdfImage, x: number, top: number, boxW: number, boxH: number) => {
  const scale = Math.min(boxW / image.width, boxH / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const left = x + (boxW - width) / 2;
  const y = yFromTop(top + (boxH - height) / 2, height);
  return `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${left.toFixed(2)} ${y.toFixed(2)} cm /${resourceName} Do Q\n`;
};

const safeCategory = (value: string) => cleanText(value || "General") || "General";

export async function downloadWholesaleCatalogue(
  products: WholesaleCatalogueProduct[],
  onProgress?: ProgressFn,
) {
  const sorted = [...products].sort((a, b) => {
    const categoryCompare = safeCategory(a.category).localeCompare(safeCategory(b.category));
    if (categoryCompare) return categoryCompare;
    return cleanText(a.name).localeCompare(cleanText(b.name));
  });

  const groups = new Map<string, WholesaleCatalogueProduct[]>();
  for (const product of sorted) {
    const category = safeCategory(product.category);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(product);
  }

  onProgress?.("Preparing PowerBuild cover...", 20);
  let cover: PdfImage | null = null;
  try {
    cover = await fetchJpeg("/wholesale-division-cover.jpg", 1400, 0.88);
  } catch {
    cover = null;
  }

  const productsWithImages = sorted.filter((product) => Boolean(product.image_url));
  const imageMap = new Map<number, PdfImage>();
  const concurrency = 5;
  let completed = 0;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, productsWithImages.length) }, async () => {
    while (true) {
      const current = cursor++;
      if (current >= productsWithImages.length) return;
      const product = productsWithImages[current];
      try {
        imageMap.set(product.id, await fetchJpeg(product.image_url, 360, 0.72));
      } catch {
        // Keep the product in the PDF with a styled placeholder if its image cannot be read.
      }
      completed += 1;
      const percent = 22 + Math.round((completed / Math.max(1, productsWithImages.length)) * 53);
      onProgress?.(`Loading catalogue pictures ${completed}/${productsWithImages.length}...`, percent);
    }
  });
  await Promise.all(workers);

  onProgress?.("Building wholesale catalogue PDF...", 78);
  const pdf = new PdfWriter();
  const catalogRef = pdf.reserve();
  const pagesRef = pdf.reserve();
  const regularFontRef = pdf.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const boldFontRef = pdf.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const coverRef = cover ? pdf.jpeg(cover) : 0;
  const imageRefs = new Map<number, number>();
  for (const [id, image] of imageMap) imageRefs.set(id, pdf.jpeg(image));

  const pageRefs: number[] = [];

  const addPage = (content: string, xObjects: Array<[string, number]>) => {
    const contentRef = pdf.stream(bytes(content));
    const xObjectDictionary = xObjects.length
      ? `/XObject << ${xObjects.map(([name, ref]) => `/${name} ${ref} 0 R`).join(" ")} >>`
      : "";
    const pageRef = pdf.add(
      `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${regularFontRef} 0 R /F2 ${boldFontRef} 0 R >> ${xObjectDictionary} >> /Contents ${contentRef} 0 R >>`,
    );
    pageRefs.push(pageRef);
  };

  if (cover && coverRef) {
    let coverContent = imageDraw("Cover", cover, 0, 0, PAGE_W, PAGE_H);
    coverContent += rect(0, 785, PAGE_W, 56, [1, 1, 1]);
    coverContent += rect(0, 785, PAGE_W, 7, YELLOW);
    coverContent += centredText(`${products.length} PRODUCTS - LIVE HUB EDITION`, PAGE_W / 2, 800, 10, "F2", BLUE);
    coverContent += centredText("Generated from the PowerBuild Company Hub", PAGE_W / 2, 817, 7, "F1", BLACK);
    addPage(coverContent, [["Cover", coverRef]]);
  } else {
    let coverContent = rect(0, 0, PAGE_W, PAGE_H, [1, 1, 1]);
    coverContent += rect(0, 0, PAGE_W, 155, BLUE);
    coverContent += rect(0, 145, PAGE_W, 13, YELLOW);
    coverContent += centredText("POWERBUILD", PAGE_W / 2, 54, 30, "F2", [1, 1, 1]);
    coverContent += centredText("WHOLESALE DIVISION", PAGE_W / 2, 255, 32, "F2", BLUE);
    coverContent += centredText("PRODUCT CATALOGUE", PAGE_W / 2, 300, 20, "F2", BLACK);
    coverContent += centredText(`${products.length} PRODUCTS`, PAGE_W / 2, 370, 14, "F2", BLUE);
    coverContent += centredText("Generated from the PowerBuild Company Hub", PAGE_W / 2, 407, 10, "F1", BLACK);
    coverContent += rect(0, 790, PAGE_W, 52, BLUE);
    coverContent += rect(0, 790, PAGE_W, 8, YELLOW);
    coverContent += centredText("www.powerbuild.co.za", PAGE_W / 2, 815, 8, "F2", [1, 1, 1]);
    addPage(coverContent, []);
  }

  const marginX = 24;
  const gridTop = 92;
  const footerTop = 817;
  const cols = 5;
  const rows = 5;
  const gapX = 7;
  const gapY = 7;
  const usableW = PAGE_W - marginX * 2;
  const usableH = footerTop - gridTop - 14;
  const cardW = (usableW - gapX * (cols - 1)) / cols;
  const cardH = (usableH - gapY * (rows - 1)) / rows;
  const pageCapacity = cols * rows;

  let generatedProductPages = 0;
  const totalProductPages = Array.from(groups.values()).reduce((sum, items) => sum + Math.ceil(items.length / pageCapacity), 0);

  for (const [category, items] of groups) {
    for (let start = 0; start < items.length; start += pageCapacity) {
      const slice = items.slice(start, start + pageCapacity);
      const categoryPage = Math.floor(start / pageCapacity) + 1;
      const categoryPages = Math.ceil(items.length / pageCapacity);
      let content = "";
      content += rect(16, 18, PAGE_W - 32, 26, BLUE);
      content += centredText("WHOLESALE DIVISION", PAGE_W / 2, 22, 16, "F2", [1, 1, 1]);
      content += rect(24, 52, PAGE_W - 48, 24, BLACK);
      const categoryLabel = categoryPages > 1 ? `${category.toUpperCase()} - ${categoryPage}/${categoryPages}` : category.toUpperCase();
      content += centredText(categoryLabel, PAGE_W / 2, 55, 13, "F2", [1, 1, 1]);
      content += line(24, 81, PAGE_W - 24, 81, YELLOW, 2.2);

      const resources: Array<[string, number]> = [];
      slice.forEach((product, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = marginX + col * (cardW + gapX);
        const top = gridTop + row * (cardH + gapY);
        content += rect(x, top, cardW, cardH, [1, 1, 1], [0.13, 0.18, 0.24]);
        content += rect(x + 1.2, top + 1.2, cardW - 2.4, 17, BLUE);
        content += centredText(product.code, x + cardW / 2, top + 4.2, 6.2, "F2", [1, 1, 1]);

        const imageTop = top + 23;
        const imageHeight = Math.max(52, cardH - 65);
        const imageBoxX = x + 7;
        const imageBoxW = cardW - 14;
        const image = imageMap.get(product.id);
        const imageRef = imageRefs.get(product.id);
        if (image && imageRef) {
          const name = `P${product.id}`;
          resources.push([name, imageRef]);
          content += imageDraw(name, image, imageBoxX, imageTop, imageBoxW, imageHeight);
        } else {
          content += rect(imageBoxX, imageTop + 5, imageBoxW, imageHeight - 10, GREY);
          content += centredText("PRODUCT", x + cardW / 2, imageTop + imageHeight / 2 - 7, 6.5, "F2", BLUE);
          content += centredText("IMAGE", x + cardW / 2, imageTop + imageHeight / 2 + 3, 6.5, "F2", BLUE);
          content += rect(x + cardW / 2 - 16, imageTop + 12, 32, 4, YELLOW);
        }

        const displayName = product.name || product.description || product.code;
        const nameLines = wrap(displayName, 24, 3);
        const nameTop = top + cardH - 33;
        nameLines.forEach((entry, lineIndex) => {
          content += centredText(entry, x + cardW / 2, nameTop + lineIndex * 7.3, 5.9, "F2", BLACK);
        });
      });

      content += centredText("www.powerbuild.co.za", PAGE_W / 2, 821, 7.2, "F2", BLUE);
      content += text(`Page ${pageRefs.length + 1}`, PAGE_W - 58, 821, 6.2, "F1", [0.35, 0.40, 0.46]);
      addPage(content, resources);
      generatedProductPages += 1;
      onProgress?.(
        `Building catalogue pages ${generatedProductPages}/${totalProductPages}...`,
        78 + Math.round((generatedProductPages / Math.max(1, totalProductPages)) * 20),
      );
    }
  }

  pdf.set(pagesRef, `<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  pdf.set(catalogRef, `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  const output = pdf.build(catalogRef);
  onProgress?.("Finalising download...", 99);
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
  onProgress?.("Wholesale catalogue downloaded.", 100);
}
