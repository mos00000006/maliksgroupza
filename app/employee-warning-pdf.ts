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

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 2480;
const CANVAS_H = 3508;
const MARGIN = 150;
const NAVY = "#16375b";
const YELLOW = "#f6ca2f";
const TEXT = "#19324a";
const MUTED = "#687a8d";
const LINE = "#d5deea";
const SOFT = "#f4f7fb";
const WHITE = "#ffffff";

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

const canvasToJpeg = (canvas: HTMLCanvasElement, quality = 0.96): PdfImage => {
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
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
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
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawField = (
  ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; height: number; label: string; value: string },
) => {
  const { x, y, width, height, label, value } = options;
  drawRoundedRect(ctx, x, y, width, height, 22, WHITE, LINE, 2);
  ctx.fillStyle = MUTED;
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText(label.toUpperCase(), x + 28, y + 46);
  ctx.fillStyle = TEXT;
  ctx.font = "700 40px Arial, sans-serif";
  const lines = wrapText(ctx, value || "—", width - 56);
  const capped = lines.slice(0, 2);
  capped.forEach((line, index) => ctx.fillText(line, x + 28, y + 94 + index * 42));
};

const drawSection = (
  ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; title: string; body: string; minHeight?: number },
) => {
  const { x, y, width, title, body, minHeight = 220 } = options;
  const textWidth = width - 56;
  ctx.font = "500 34px Arial, sans-serif";
  const lines = wrapText(ctx, body || "—", textWidth);
  const lineHeight = 42;
  const contentHeight = Math.max(minHeight, 92 + lines.length * lineHeight + 28);
  drawRoundedRect(ctx, x, y, width, contentHeight, 22, WHITE, LINE, 2);
  ctx.fillStyle = NAVY;
  ctx.font = "800 32px Arial, sans-serif";
  ctx.fillText(title.toUpperCase(), x + 28, y + 48);
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 68);
  ctx.lineTo(x + 210, y + 68);
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.font = "500 34px Arial, sans-serif";
  lines.forEach((line, index) => ctx.fillText(line, x + 28, y + 118 + index * lineHeight));
  return contentHeight;
};

const drawSignatureBlock = (
  ctx: CanvasRenderingContext2D,
  options: { x: number; y: number; width: number; label: string; sublabel?: string },
) => {
  const { x, y, width, label, sublabel } = options;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  ctx.fillStyle = NAVY;
  ctx.font = "800 28px Arial, sans-serif";
  ctx.fillText(label, x, y + 36);
  ctx.fillStyle = MUTED;
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillText(sublabel || "Signature", x, y + 68);

  const dateX = x + width - 180;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(dateX, y + 90);
  ctx.lineTo(x + width, y + 90);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = "600 22px Arial, sans-serif";
  ctx.fillText("Date", dateX, y + 120);
};

async function renderWarningCanvas(payload: EmployeeWarningPdfPayload) {
  const { employee, warning, generatedBy } = payload;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create warning document canvas.");

  ctx.fillStyle = "#eef3f9";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawRoundedRect(ctx, 70, 70, CANVAS_W - 140, CANVAS_H - 140, 38, WHITE, "#dbe4ee", 3);

  const logo = await loadImage("/powerbuild-warning-logo.png").catch(() => loadImage("/powerbuild-logo-transparent.png")).catch(() => null);

  drawRoundedRect(ctx, MARGIN, MARGIN, CANVAS_W - MARGIN * 2, 310, 30, NAVY);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(MARGIN, MARGIN + 300, CANVAS_W - MARGIN * 2, 10);

  if (logo) {
    const logoHeight = 210;
    const ratio = (logo.naturalWidth || logo.width || 1) / (logo.naturalHeight || logo.height || 1);
    const logoWidth = Math.round(logoHeight * ratio);
    ctx.drawImage(logo, MARGIN + 34, MARGIN + 40, logoWidth, logoHeight);
  }

  ctx.fillStyle = YELLOW;
  ctx.font = "900 30px Arial, sans-serif";
  ctx.fillText("POWERBUILD EMPLOYEE RECORDS", MARGIN + 320, MARGIN + 72);
  ctx.fillStyle = WHITE;
  ctx.font = "900 72px Arial, sans-serif";
  ctx.fillText("DISCIPLINARY WARNING", MARGIN + 320, MARGIN + 154);
  ctx.font = "500 32px Arial, sans-serif";
  ctx.fillStyle = "#d9e6f5";
  ctx.fillText("Official employee warning document generated by the PowerBuild Hub.", MARGIN + 320, MARGIN + 208);

  drawRoundedRect(ctx, CANVAS_W - MARGIN - 470, MARGIN + 36, 430, 160, 24, "rgba(255,255,255,.08)", "rgba(255,255,255,.18)", 2);
  ctx.fillStyle = WHITE;
  ctx.font = "700 28px Arial, sans-serif";
  ctx.fillText("Document no.", CANVAS_W - MARGIN - 430, MARGIN + 88);
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText(`PB-WARN-${warning.id || "NEW"}`, CANVAS_W - MARGIN - 430, MARGIN + 134);
  ctx.font = "600 24px Arial, sans-serif";
  ctx.fillStyle = "#d9e6f5";
  ctx.fillText(`Generated ${formatDate(new Date().toISOString().slice(0, 10))}`, CANVAS_W - MARGIN - 430, MARGIN + 172);

  ctx.fillStyle = NAVY;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("EMPLOYEE DETAILS", MARGIN, 560);
  ctx.fillStyle = MUTED;
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillText("Verify the identity and employment details before the warning is issued and signed.", MARGIN, 598);

  const gap = 24;
  const contentWidth = CANVAS_W - MARGIN * 2;
  const col3 = Math.floor((contentWidth - gap * 2) / 3);
  const col2 = Math.floor((contentWidth - gap) / 2);
  const topY = 630;
  const fieldH = 138;
  drawField(ctx, { x: MARGIN, y: topY, width: col3, height: fieldH, label: "Employee name", value: employeeName(employee) || "—" });
  drawField(ctx, { x: MARGIN + col3 + gap, y: topY, width: col3, height: fieldH, label: "Employee no.", value: employee.employee_number || "—" });
  drawField(ctx, { x: MARGIN + (col3 + gap) * 2, y: topY, width: col3, height: fieldH, label: "Workspace", value: employee.workspace || warning.workspace || "—" });
  drawField(ctx, { x: MARGIN, y: topY + fieldH + gap, width: col2, height: fieldH, label: "Job title / department", value: [employee.job_title, employee.department].filter(Boolean).join(" · ") || "—" });
  drawField(ctx, { x: MARGIN + col2 + gap, y: topY + fieldH + gap, width: col2, height: fieldH, label: "Supervisor / status", value: [employee.supervisor, employee.employment_status].filter(Boolean).join(" · ") || "—" });

  const detailsY = topY + fieldH * 2 + gap * 2 + 38;
  ctx.fillStyle = NAVY;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("WARNING DETAILS", MARGIN, detailsY);

  const warningBoxY = detailsY + 28;
  drawField(ctx, { x: MARGIN, y: warningBoxY, width: col3, height: fieldH, label: "Warning date", value: formatDate(warning.warning_date) });
  drawField(ctx, { x: MARGIN + col3 + gap, y: warningBoxY, width: col3, height: fieldH, label: "Warning level", value: warning.warning_level || "—" });
  drawField(ctx, { x: MARGIN + (col3 + gap) * 2, y: warningBoxY, width: col3, height: fieldH, label: "Valid until", value: formatDate(warning.valid_until) });
  drawField(ctx, { x: MARGIN, y: warningBoxY + fieldH + gap, width: col2, height: fieldH, label: "Issued by", value: warning.issued_by || generatedBy || "—" });
  drawField(ctx, { x: MARGIN + col2 + gap, y: warningBoxY + fieldH + gap, width: col2, height: fieldH, label: "Status", value: warning.status || "Active" });

  const sectionsStartY = warningBoxY + fieldH * 2 + gap * 2 + 40;
  const leftWidth = Math.floor((contentWidth - gap) * 0.56);
  const rightWidth = contentWidth - gap - leftWidth;

  const reasonHeight = drawSection(ctx, {
    x: MARGIN,
    y: sectionsStartY,
    width: leftWidth,
    title: "Reason for warning",
    body: warning.reason || "—",
    minHeight: 210,
  });

  const summaryHeight = drawSection(ctx, {
    x: MARGIN + leftWidth + gap,
    y: sectionsStartY,
    width: rightWidth,
    title: "Acknowledgement",
    body: warning.acknowledgement || "Employee acknowledgement to be captured at signing.",
    minHeight: 210,
  });

  const detailsHeight = drawSection(ctx, {
    x: MARGIN,
    y: sectionsStartY + Math.max(reasonHeight, summaryHeight) + gap,
    width: contentWidth,
    title: "Full incident / corrective details",
    body:
      warning.details ||
      "No additional details were entered when this warning was recorded. Use the printed form to note the incident details, prior discussion and required corrective action.",
    minHeight: 360,
  });

  const noteY = sectionsStartY + Math.max(reasonHeight, summaryHeight) + gap + detailsHeight + 34;
  drawRoundedRect(ctx, MARGIN, noteY, contentWidth, 164, 22, SOFT, LINE, 2);
  ctx.fillStyle = NAVY;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("IMPORTANT", MARGIN + 28, noteY + 46);
  ctx.fillStyle = TEXT;
  ctx.font = "500 28px Arial, sans-serif";
  const noticeLines = wrapText(
    ctx,
    "This warning must be discussed with the employee. After printing, obtain all required signatures and file the completed document in the employee's disciplinary record.",
    contentWidth - 56,
  );
  noticeLines.slice(0, 3).forEach((line, index) => ctx.fillText(line, MARGIN + 28, noteY + 92 + index * 34));

  const signTitleY = noteY + 220;
  ctx.fillStyle = NAVY;
  ctx.font = "900 28px Arial, sans-serif";
  ctx.fillText("SIGNATURES", MARGIN, signTitleY);
  ctx.fillStyle = MUTED;
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillText("Print and sign below once the warning has been discussed with the employee.", MARGIN, signTitleY + 34);

  const signY = signTitleY + 128;
  const signGap = 50;
  const signWidth = Math.floor((contentWidth - signGap * 2) / 3);
  drawSignatureBlock(ctx, { x: MARGIN, y: signY, width: signWidth, label: "Employee", sublabel: employeeName(employee) || "Employee signature" });
  drawSignatureBlock(ctx, { x: MARGIN + signWidth + signGap, y: signY, width: signWidth, label: "Manager / Issuer", sublabel: warning.issued_by || generatedBy || "Manager signature" });
  drawSignatureBlock(ctx, { x: MARGIN + (signWidth + signGap) * 2, y: signY, width: signWidth, label: "Witness / HR", sublabel: "Witness or HR representative" });

  const footerY = CANVAS_H - 212;
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerY - 30);
  ctx.lineTo(CANVAS_W - MARGIN, footerY - 30);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillText(`Employee file reference: ${employee.employee_number || "—"} · Workspace: ${employee.workspace || warning.workspace || "—"}`, MARGIN, footerY + 12);
  ctx.fillText(`Prepared in PowerBuild Hub by ${generatedBy || warning.issued_by || "Authorised user"}.`, MARGIN, footerY + 48);
  ctx.fillText("This document is generated for internal disciplinary administration and must be stored securely.", MARGIN, footerY + 84);

  return canvas;
}

export async function buildEmployeeWarningPdfBlob(payload: EmployeeWarningPdfPayload) {
  const canvas = await renderWarningCanvas(payload);
  const pdf = new PdfWriter();
  const catalogRef = pdf.reserve();
  const pagesRef = pdf.reserve();
  const image = canvasToJpeg(canvas, 0.96);
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
