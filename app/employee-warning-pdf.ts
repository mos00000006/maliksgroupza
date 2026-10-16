export type EmployeeWarningPdfEmployee = {
  id: number;
  employee_number: string;
  workspace: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  job_title?: string;
  department?: string;
  start_date?: string;
  supervisor?: string;
  employment_status?: string;
};

export type EmployeeWarningPdfWarning = {
  id: number;
  employee_id: number;
  workspace: string;
  warning_date: string;
  warning_level: "Verbal" | "Written" | "Final written" | string;
  reason: string;
  details?: string;
  issued_by?: string;
  valid_until?: string;
  acknowledgement?: string;
  status?: "Active" | "Withdrawn" | string;
};

export type EmployeeWarningPdfPayload = {
  employee: EmployeeWarningPdfEmployee;
  warning: EmployeeWarningPdfWarning;
  generatedBy?: string;
};

type PdfImage = { bytes: Uint8Array; width: number; height: number };
type LoadedImage = HTMLImageElement | null;

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 2480;
const CANVAS_H = 3508;
const PAGE_X = 132;
const PAGE_W_PX = CANVAS_W - PAGE_X * 2;

const NAVY = "#122d49";
const DEEP_NAVY = "#0b1f35";
const POWER_BLUE = "#07549a";
const YELLOW = "#ffd21f";
const GOLD = "#e7b700";
const TEXT = "#1c3147";
const MUTED = "#708296";
const LINE = "#d9e2ec";
const SOFT = "#f4f7fb";
const SOFT_BLUE = "#eef5fb";
const WHITE = "#ffffff";
const RED = "#b93646";
const GREEN = "#28785b";

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
  String(value || "")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const employeeName = (employee: EmployeeWarningPdfEmployee) => `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

const formatDate = (value?: string) => {
  const clean = String(value || "").trim();
  if (!clean) return "—";
  const parsed = new Date(`${clean}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? clean
    : parsed.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
};

const safeFilePart = (value: string) =>
  cleanText(value)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "document";

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
    image.src = url;
  });

const canvasToJpeg = (canvas: HTMLCanvasElement, quality = 0.97): PdfImage => {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const binary = atob(dataUrl.split(",")[1] || "");
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
  return { bytes: output, width: canvas.width, height: canvas.height };
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const source = cleanText(text);
  if (!source) return ["—"];
  const words = source.split(" ");
  const lines: string[] = [];
  let current = words.shift() || "";
  for (const word of words) {
    const candidate = `${current} ${word}`.trim();
    if (ctx.measureText(candidate).width <= maxWidth) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const fitTextLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startSize: number,
  minSize: number,
  weight = 500,
) => {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { lines, size };
  }
  ctx.font = `${weight} ${minSize}px Arial, sans-serif`;
  const lines = wrapText(ctx, text, maxWidth);
  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines && clipped.length) {
    clipped[clipped.length - 1] = `${clipped[clipped.length - 1].replace(/[. ]+$/g, "")}...`;
  }
  return { lines: clipped, size: minSize };
};

const roundedPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
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
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawShadowCard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 24,
  fill = WHITE,
) => {
  ctx.save();
  ctx.shadowColor = "rgba(15,35,55,.10)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 9;
  drawRoundedRect(ctx, x, y, width, height, radius, fill);
  ctx.restore();
  drawRoundedRect(ctx, x, y, width, height, radius, fill, LINE, 2);
};

const drawSmallCaps = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = MUTED) => {
  ctx.fillStyle = color;
  ctx.font = "800 25px Arial, sans-serif";
  ctx.fillText(cleanText(text).toUpperCase(), x, y);
};

const drawValue = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  maxLines = 2,
  startSize = 36,
) => {
  const fitted = fitTextLines(ctx, text || "—", width, maxLines, startSize, 26, 700);
  ctx.fillStyle = TEXT;
  ctx.font = `700 ${fitted.size}px Arial, sans-serif`;
  fitted.lines.forEach((line, index) => ctx.fillText(line, x, y + index * (fitted.size + 9)));
};

const drawInfoCell = (
  ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; height: number; label: string; value: string },
) => {
  const { x, y, width, height, label, value } = options;
  drawRoundedRect(ctx, x, y, width, height, 20, SOFT, "#e2e9f1", 2);
  drawSmallCaps(ctx, label, x + 26, y + 43);
  drawValue(ctx, value, x + 26, y + 93, width - 52, 2, 34);
};

const drawSectionCard = (
  ctx: CanvasRenderingContext2D,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    body: string;
    accent?: string;
    maxLines?: number;
    bodySize?: number;
    labelNote?: string;
  },
) => {
  const { x, y, width, height, label, body, accent = YELLOW, maxLines = 7, bodySize = 34, labelNote } = options;
  drawShadowCard(ctx, x, y, width, height, 24, WHITE);
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, 12, height);
  drawSmallCaps(ctx, label, x + 34, y + 44, NAVY);
  if (labelNote) {
    ctx.fillStyle = MUTED;
    ctx.font = "600 23px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(labelNote, x + width - 30, y + 43);
    ctx.textAlign = "left";
  }
  ctx.strokeStyle = "#e6ecf2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 34, y + 65);
  ctx.lineTo(x + width - 30, y + 65);
  ctx.stroke();

  const fitted = fitTextLines(ctx, body || "—", width - 70, maxLines, bodySize, 25, 500);
  ctx.fillStyle = TEXT;
  ctx.font = `500 ${fitted.size}px Arial, sans-serif`;
  const lineHeight = fitted.size + 12;
  fitted.lines.forEach((line, index) => ctx.fillText(line, x + 34, y + 118 + index * lineHeight));
};

const drawSignature = (
  ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; title: string; printedName?: string },
) => {
  const { x, y, width, title, printedName } = options;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  ctx.fillStyle = NAVY;
  ctx.font = "800 27px Arial, sans-serif";
  ctx.fillText(title, x, y + 38);
  ctx.fillStyle = MUTED;
  ctx.font = "500 22px Arial, sans-serif";
  if (printedName) ctx.fillText(printedName, x, y + 72);

  const dateY = y + 118;
  ctx.strokeStyle = "#bfcbd7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, dateY);
  ctx.lineTo(x + width * 0.58, dateY);
  ctx.moveTo(x + width * 0.68, dateY);
  ctx.lineTo(x + width, dateY);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = "600 19px Arial, sans-serif";
  ctx.fillText("Signature", x, dateY + 29);
  ctx.fillText("Date", x + width * 0.68, dateY + 29);
};

const warningStyle = (warning: EmployeeWarningPdfWarning) => {
  const level = cleanText(warning.warning_level).toLowerCase();
  if (level.includes("final")) return { accent: RED, label: "FINAL WRITTEN WARNING", soft: "#fff0f2" };
  if (level.includes("written")) return { accent: GOLD, label: "WRITTEN WARNING", soft: "#fff8dd" };
  return { accent: POWER_BLUE, label: "VERBAL WARNING RECORD", soft: SOFT_BLUE };
};

const drawWatermark = (ctx: CanvasRenderingContext2D, logo: LoadedImage) => {
  if (!logo) return;
  const size = 1180;
  ctx.save();
  ctx.globalAlpha = 0.028;
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2 + 180);
  ctx.rotate(-0.12);
  ctx.drawImage(logo, -size / 2, -size / 2, size, size);
  ctx.restore();
};

async function renderWarningCanvas(payload: EmployeeWarningPdfPayload) {
  const { employee, warning, generatedBy } = payload;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create warning document canvas.");

  const logo = await loadImage("/powerbuild-warning-logo.png")
    .catch(() => loadImage("/powerbuild-logo-transparent.png"))
    .catch(() => null);
  const levelStyle = warningStyle(warning);
  const documentNumber = `PB-WARN-${warning.id || "NEW"}`;
  const generatedDate = formatDate(new Date().toISOString().slice(0, 10));
  const issuer = warning.issued_by || generatedBy || "Authorised manager";
  const status = cleanText(warning.status || "Active");

  ctx.fillStyle = "#edf2f7";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.shadowColor = "rgba(15,35,55,.16)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, 54, 46, CANVAS_W - 108, CANVAS_H - 92, 36, WHITE);
  ctx.restore();
  drawRoundedRect(ctx, 54, 46, CANVAS_W - 108, CANVAS_H - 92, 36, WHITE, "#dce5ee", 2);

  drawWatermark(ctx, logo);

  // Premium header
  drawRoundedRect(ctx, PAGE_X, 120, PAGE_W_PX, 430, 30, DEEP_NAVY);
  ctx.fillStyle = POWER_BLUE;
  ctx.fillRect(PAGE_X, 120, 20, 430);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(PAGE_X, 532, PAGE_W_PX, 18);

  if (logo) {
    drawRoundedRect(ctx, PAGE_X + 40, 158, 264, 264, 24, WHITE);
    const logoSize = 220;
    ctx.drawImage(logo, PAGE_X + 62, 180, logoSize, logoSize);
  }

  const headerTextX = PAGE_X + 350;
  ctx.fillStyle = YELLOW;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("POWERBUILD GROUP  /  PEOPLE & CULTURE", headerTextX, 196);
  ctx.fillStyle = WHITE;
  ctx.font = "900 70px Arial, sans-serif";
  ctx.fillText("DISCIPLINARY WARNING", headerTextX, 284);
  ctx.fillStyle = "#cbd9e7";
  ctx.font = "500 29px Arial, sans-serif";
  ctx.fillText("Confidential employee record  |  Print, discuss, sign and file", headerTextX, 336);

  const badgeW = 490;
  drawRoundedRect(ctx, CANVAS_W - PAGE_X - badgeW - 38, 378, badgeW, 112, 20, levelStyle.soft, levelStyle.accent, 3);
  ctx.fillStyle = levelStyle.accent;
  ctx.font = "900 29px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(levelStyle.label, CANVAS_W - PAGE_X - badgeW / 2 - 38, 447);
  ctx.textAlign = "left";

  // Metadata line
  const metaY = 590;
  drawRoundedRect(ctx, PAGE_X, metaY, PAGE_W_PX, 104, 18, SOFT_BLUE, "#d6e3ef", 2);
  const metaCols = [
    ["DOCUMENT NO.", documentNumber],
    ["WARNING DATE", formatDate(warning.warning_date)],
    ["STATUS", status],
    ["GENERATED", generatedDate],
  ];
  const metaWidth = PAGE_W_PX / metaCols.length;
  metaCols.forEach(([label, value], index) => {
    const x = PAGE_X + index * metaWidth;
    if (index > 0) {
      ctx.strokeStyle = "#ccd9e5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, metaY + 20);
      ctx.lineTo(x, metaY + 84);
      ctx.stroke();
    }
    drawSmallCaps(ctx, label, x + 25, metaY + 36, MUTED);
    ctx.fillStyle = label === "STATUS" ? (status.toLowerCase() === "withdrawn" ? RED : GREEN) : NAVY;
    ctx.font = "800 29px Arial, sans-serif";
    ctx.fillText(value || "—", x + 25, metaY + 76);
  });

  // Employee identity card
  const identityY = 734;
  drawShadowCard(ctx, PAGE_X, identityY, PAGE_W_PX, 420, 26, WHITE);
  drawSmallCaps(ctx, "Employee identity", PAGE_X + 34, identityY + 48, POWER_BLUE);
  ctx.fillStyle = TEXT;
  ctx.font = "900 49px Arial, sans-serif";
  ctx.fillText(employeeName(employee) || "Employee", PAGE_X + 34, identityY + 112);
  ctx.fillStyle = MUTED;
  ctx.font = "600 26px Arial, sans-serif";
  ctx.fillText(
    [employee.job_title, employee.department, employee.workspace || warning.workspace].filter(Boolean).join("  •  ") || "Employment details not captured",
    PAGE_X + 34,
    identityY + 155,
  );

  const infoTop = identityY + 202;
  const gap = 18;
  const infoW = Math.floor((PAGE_W_PX - 68 - gap * 2) / 3);
  const infoH = 160;
  const infoX = PAGE_X + 34;
  drawInfoCell(ctx, { x: infoX, y: infoTop, width: infoW, height: infoH, label: "Employee number", value: employee.employee_number || "—" });
  drawInfoCell(ctx, { x: infoX + infoW + gap, y: infoTop, width: infoW, height: infoH, label: "Supervisor", value: employee.supervisor || "—" });
  drawInfoCell(ctx, { x: infoX + (infoW + gap) * 2, y: infoTop, width: infoW, height: infoH, label: "Issued by", value: issuer });

  // Warning summary
  const summaryY = identityY + 460;
  const summaryGap = 24;
  const leftW = Math.floor((PAGE_W_PX - summaryGap) * 0.58);
  const rightW = PAGE_W_PX - summaryGap - leftW;
  drawSectionCard(ctx, {
    x: PAGE_X,
    y: summaryY,
    width: leftW,
    height: 340,
    label: "Reason for warning",
    body: warning.reason || "—",
    accent: levelStyle.accent,
    maxLines: 6,
    bodySize: 38,
  });
  drawSectionCard(ctx, {
    x: PAGE_X + leftW + summaryGap,
    y: summaryY,
    width: rightW,
    height: 340,
    label: "Validity & classification",
    body: `Level: ${warning.warning_level || "—"}. Valid until: ${formatDate(warning.valid_until)}. Current status: ${status}.`,
    accent: POWER_BLUE,
    maxLines: 7,
    bodySize: 34,
  });

  const detailsY = summaryY + 372;
  drawSectionCard(ctx, {
    x: PAGE_X,
    y: detailsY,
    width: PAGE_W_PX,
    height: 520,
    label: "Incident / corrective details",
    body: warning.details || "No additional incident or corrective details were entered when the warning was recorded.",
    accent: YELLOW,
    maxLines: 10,
    bodySize: 36,
    labelNote: "Management record",
  });

  const acknowledgementY = detailsY + 552;
  drawSectionCard(ctx, {
    x: PAGE_X,
    y: acknowledgementY,
    width: PAGE_W_PX,
    height: 340,
    label: "Employee acknowledgement / response",
    body: warning.acknowledgement || "No acknowledgement text was captured electronically. Complete this section during the discussion if required.",
    accent: POWER_BLUE,
    maxLines: 6,
    bodySize: 34,
    labelNote: "To be discussed with employee",
  });

  // Signature section
  const signatureY = acknowledgementY + 390;
  drawSmallCaps(ctx, "Signatures", PAGE_X, signatureY, NAVY);
  ctx.fillStyle = MUTED;
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillText("Signatures confirm that the warning document was presented and discussed.", PAGE_X, signatureY + 37);

  const signTop = signatureY + 145;
  const signGap = 52;
  const signW = Math.floor((PAGE_W_PX - signGap * 2) / 3);
  drawSignature(ctx, { x: PAGE_X, y: signTop, width: signW, title: "Employee", printedName: employeeName(employee) || undefined });
  drawSignature(ctx, { x: PAGE_X + signW + signGap, y: signTop, width: signW, title: "Manager / Issuer", printedName: issuer });
  drawSignature(ctx, { x: PAGE_X + (signW + signGap) * 2, y: signTop, width: signW, title: "Witness / HR", printedName: "Witness name" });

  // Footer
  const footerY = CANVAS_H - 160;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(PAGE_X, footerY - 50);
  ctx.lineTo(PAGE_X + PAGE_W_PX, footerY - 50);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.font = "800 23px Arial, sans-serif";
  ctx.fillText("POWERBUILD GROUP  •  CONFIDENTIAL EMPLOYEE RECORD", PAGE_X, footerY - 5);
  ctx.fillStyle = MUTED;
  ctx.font = "500 21px Arial, sans-serif";
  ctx.fillText(`Employee file: ${employee.employee_number || "—"}  |  Workspace: ${employee.workspace || warning.workspace || "—"}`, PAGE_X, footerY + 34);
  ctx.textAlign = "right";
  ctx.fillText(`${documentNumber}  •  Page 1 of 1`, PAGE_X + PAGE_W_PX, footerY + 34);
  ctx.textAlign = "left";

  return canvas;
}

export async function buildEmployeeWarningPdfBlob(payload: EmployeeWarningPdfPayload) {
  const canvas = await renderWarningCanvas(payload);
  const pdf = new PdfWriter();
  const catalogRef = pdf.reserve();
  const pagesRef = pdf.reserve();
  const image = canvasToJpeg(canvas, 0.97);
  const imageRef = pdf.jpeg(image);
  const content = bytes(`q\n${PAGE_W.toFixed(2)} 0 0 ${PAGE_H.toFixed(2)} 0 0 cm\n/Im1 Do\nQ`);
  const contentRef = pdf.stream(content);
  const pageRef = pdf.add(
    `<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /XObject << /Im1 ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`,
  );
  pdf.set(catalogRef, `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  pdf.set(pagesRef, `<< /Type /Pages /Kids [${pageRef} 0 R] /Count 1 >>`);
  const output = pdf.build(catalogRef);
  const pdfBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  return new Blob([pdfBuffer], { type: "application/pdf" });
}

export async function downloadEmployeeWarningPdf(payload: EmployeeWarningPdfPayload) {
  const blob = await buildEmployeeWarningPdfBlob(payload);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = [
    "PowerBuild_Warning",
    safeFilePart(employeeName(payload.employee) || payload.employee.employee_number || `employee-${payload.employee.id}`),
    safeFilePart(payload.warning.warning_level || "warning"),
    safeFilePart(payload.warning.warning_date || new Date().toISOString().slice(0, 10)),
  ].join("_") + ".pdf";
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
