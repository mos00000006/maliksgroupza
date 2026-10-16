export type PayslipPdfEmployee = {
  id: number;
  employee_number: string;
  workspace: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  employment_status?: string;
  supervisor?: string;
  start_date?: string;
  email?: string;
  phone?: string;
};

export type PayslipPdfRecord = {
  id: number;
  employee_id: number;
  workspace: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  payment_method: string;
  payment_reference: string;
  basic_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_amount: number;
  allowance_amount: number;
  commission_amount: number;
  bonus_amount: number;
  other_earnings: number;
  gross_pay: number;
  uif: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  notes: string;
  employee_email: string;
  employee_whatsapp: string;
  generated_by: string;
  pdf_file_name?: string;
  status: string;
  created_at?: string;
};

export type PayslipPdfPayload = {
  employee: PayslipPdfEmployee;
  payslip: PayslipPdfRecord;
};

type PdfImage = { bytes: Uint8Array; width: number; height: number };

const encoder = new TextEncoder();
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CANVAS_W = 2480;
const CANVAS_H = 3508;
const MARGIN = 145;
const NAVY_2 = "#0f2740";
const YELLOW = "#f8cd24";
const TEXT = "#183149";
const MUTED = "#738396";
const LINE = "#dbe3ec";
const WHITE = "#ffffff";

const bytes = (value: string) => encoder.encode(value);
const concat = (parts: Uint8Array[]) => {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
};

class PdfWriter {
  private objects: Uint8Array[] = [];
  reserve() { this.objects.push(bytes("")); return this.objects.length; }
  add(body: string | Uint8Array) { this.objects.push(typeof body === "string" ? bytes(body) : body); return this.objects.length; }
  set(ref: number, body: string | Uint8Array) { this.objects[ref - 1] = typeof body === "string" ? bytes(body) : body; }
  stream(data: Uint8Array, dictionary = "") {
    return this.add(concat([bytes(`<< /Length ${data.length}${dictionary ? ` ${dictionary}` : ""} >>\nstream\n`), data, bytes("\nendstream")]));
  }
  jpeg(image: PdfImage) {
    return this.add(concat([
      bytes(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`),
      image.bytes,
      bytes("\nendstream"),
    ]));
  }
  build(rootRef: number) {
    const header = bytes("%PDF-1.4\n%PowerBuildPayslip\n");
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
    for (let index = 1; index <= this.objects.length; index += 1) xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    xref += `trailer\n<< /Size ${this.objects.length + 1} /Root ${rootRef} 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
    chunks.push(bytes(xref));
    return concat(chunks);
  }
}

const cleanText = (value: unknown) => String(value ?? "").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
const money = (value: unknown) => `R ${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (value: unknown) => Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const employeeName = (employee: PayslipPdfEmployee) => `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
const formatDate = (value?: string) => {
  const text = String(value || "").trim();
  if (!text) return "-";
  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
};

const payCycleLabel = (startValue?: string, endValue?: string) => {
  const start = new Date(`${String(startValue || "")}T12:00:00`);
  const end = new Date(`${String(endValue || "")}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "Payroll period";
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  if (days <= 8) return "Weekly";
  if (days <= 16) return "Fortnightly";
  if (days <= 24) return "Three-weekly";
  return "Monthly";
};

const serviceLength = (startValue?: string, endValue?: string) => {
  const start = new Date(`${String(startValue || "")}T12:00:00`);
  const end = new Date(`${String(endValue || "")}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return "-";
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (end.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0 && months <= 0) return "Less than 1 month";
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (months > 0) parts.push(`${months} mo${months === 1 ? "" : "s"}`);
  return parts.join(" ");
};
const safeFilePart = (value: string) => cleanText(value).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "payslip";

const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(`Could not load image: ${url}`));
  image.src = url;
});

const canvasToJpeg = (canvas: HTMLCanvasElement, quality = 0.96): PdfImage => {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const binary = atob(dataUrl.split(",")[1] || "");
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) output[i] = binary.charCodeAt(i);
  return { bytes: output, width: canvas.width, height: canvas.height };
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, lineWidth = 1) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = cleanText(text || "-").split(" ");
  const lines: string[] = [];
  let line = words.shift() || "-";
  for (const word of words) {
    const candidate = `${line} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const label = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number) => {
  ctx.fillStyle = MUTED;
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillText(cleanText(value).toUpperCase(), x, y);
};

const valueText = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, size = 31) => {
  ctx.fillStyle = TEXT;
  ctx.font = `700 ${size}px Arial, sans-serif`;
  wrap(ctx, value || "-", maxWidth).slice(0, 2).forEach((line, i) => ctx.fillText(line, x, y + i * (size + 7)));
};

const sectionTitle = (ctx: CanvasRenderingContext2D, title: string, x: number, y: number, width: number) => {
  ctx.fillStyle = NAVY_2;
  ctx.fillRect(x, y, width, 58);
  ctx.fillStyle = WHITE;
  ctx.font = "800 24px Arial, sans-serif";
  ctx.fillText(title.toUpperCase(), x + 20, y + 37);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(x, y + 58, width, 5);
};

const drawInfoCell = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  labelText: string,
  value: string,
  options: { rightBorder?: boolean; bottomBorder?: boolean } = {},
) => {
  label(ctx, labelText, x + 18, y + 31);
  valueText(ctx, value || "-", x + 18, y + 72, width - 36, 29);
  if (options.rightBorder !== false) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width, y + 12);
    ctx.lineTo(x + width, y + 102);
    ctx.stroke();
  }
  if (options.bottomBorder) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 112);
    ctx.lineTo(x + width, y + 112);
    ctx.stroke();
  }
};

type PayrollRow = {
  description: string;
  qty?: string;
  rate?: string;
  earnings?: number;
  deductions?: number;
};

const drawPayrollTable = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  rows: PayrollRow[],
) => {
  const headerH = 62;
  const rowH = 62;
  const descW = Math.round(width * 0.39);
  const qtyW = Math.round(width * 0.13);
  const rateW = Math.round(width * 0.16);
  const earningsW = Math.round(width * 0.16);
  const deductionsW = width - descW - qtyW - rateW - earningsW;
  const cols = [descW, qtyW, rateW, earningsW, deductionsW];
  const headers = ["Description", "Qty / Hrs", "Rate", "Earnings", "Deductions"];

  ctx.fillStyle = "#f0f3f6";
  ctx.fillRect(x, y, width, headerH);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, headerH + rows.length * rowH);

  let cursor = x;
  headers.forEach((head, i) => {
    ctx.fillStyle = NAVY_2;
    ctx.font = "800 22px Arial, sans-serif";
    ctx.textAlign = i >= 3 ? "right" : "left";
    const textX = i >= 3 ? cursor + cols[i] - 18 : cursor + 18;
    ctx.fillText(head.toUpperCase(), textX, y + 39);
    cursor += cols[i];
    if (i < headers.length - 1) {
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(cursor, y);
      ctx.lineTo(cursor, y + headerH + rows.length * rowH);
      ctx.stroke();
    }
  });

  rows.forEach((row, rowIndex) => {
    const rowY = y + headerH + rowIndex * rowH;
    if (rowIndex % 2 === 1) {
      ctx.fillStyle = "#fbfcfd";
      ctx.fillRect(x, rowY, width, rowH);
    }
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(x, rowY + rowH);
    ctx.lineTo(x + width, rowY + rowH);
    ctx.stroke();

    const cells = [
      row.description,
      row.qty || "",
      row.rate || "",
      row.earnings ? money(row.earnings) : "",
      row.deductions ? money(row.deductions) : "",
    ];
    let cellX = x;
    cells.forEach((cell, i) => {
      ctx.fillStyle = i === 4 && cell ? "#9d3340" : TEXT;
      ctx.font = i === 0 ? "650 25px Arial, sans-serif" : "600 24px Arial, sans-serif";
      ctx.textAlign = i >= 3 ? "right" : "left";
      const textX = i >= 3 ? cellX + cols[i] - 18 : cellX + 18;
      ctx.fillText(cell, textX, rowY + 39);
      cellX += cols[i];
    });
  });
  ctx.textAlign = "left";
  return y + headerH + rows.length * rowH;
};

async function renderPayslipCanvas(payload: PayslipPdfPayload) {
  const { employee, payslip } = payload;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create payslip document.");

  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Slim corporate header instead of a large graphic block.
  ctx.fillStyle = NAVY_2;
  ctx.fillRect(0, 0, CANVAS_W, 34);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, 34, CANVAS_W, 7);

  const logo = await loadImage("/powerbuild-warning-logo.png")
    .catch(() => loadImage("/powerbuild-logo-transparent.png"))
    .catch(() => null);
  if (logo) {
    const h = 150;
    const ratio = (logo.naturalWidth || logo.width || 1) / (logo.naturalHeight || logo.height || 1);
    ctx.drawImage(logo, MARGIN, 92, h * ratio, h);
  }

  ctx.fillStyle = NAVY_2;
  ctx.font = "900 38px Arial, sans-serif";
  ctx.fillText("POWERBUILD", MARGIN + 205, 126);
  ctx.fillStyle = MUTED;
  ctx.font = "600 23px Arial, sans-serif";
  ctx.fillText("EMPLOYEE PAYROLL", MARGIN + 205, 164);
  ctx.fillText("Confidential remuneration statement", MARGIN + 205, 199);

  ctx.textAlign = "right";
  ctx.fillStyle = NAVY_2;
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText("PAYSLIP", CANVAS_W - MARGIN, 126);
  ctx.fillStyle = MUTED;
  ctx.font = "600 23px Arial, sans-serif";
  ctx.fillText(`Payslip no. PB-PAY-${payslip.id}`, CANVAS_W - MARGIN, 169);
  ctx.textAlign = "left";

  const contentW = CANVAS_W - MARGIN * 2;
  const topMetaY = 278;
  roundRect(ctx, MARGIN, topMetaY, contentW, 126, 10, "#f4f6f8", LINE, 2);
  const metaW = contentW / 4;
  drawInfoCell(ctx, MARGIN, topMetaY + 7, metaW, "Pay period", `${formatDate(payslip.pay_period_start)} - ${formatDate(payslip.pay_period_end)}`);
  drawInfoCell(ctx, MARGIN + metaW, topMetaY + 7, metaW, "Pay cycle", payCycleLabel(payslip.pay_period_start, payslip.pay_period_end));
  drawInfoCell(ctx, MARGIN + metaW * 2, topMetaY + 7, metaW, "Payment date", formatDate(payslip.payment_date));
  drawInfoCell(ctx, MARGIN + metaW * 3, topMetaY + 7, metaW, "Payment method", payslip.payment_method || "-", { rightBorder: false });

  let y = 455;
  sectionTitle(ctx, "Employee information", MARGIN, y, contentW);
  y += 78;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(MARGIN, y, contentW, 472);
  const colW = contentW / 3;
  drawInfoCell(ctx, MARGIN, y + 3, colW, "Employee", employeeName(employee));
  drawInfoCell(ctx, MARGIN + colW, y + 3, colW, "Employee number", employee.employee_number || "-");
  drawInfoCell(ctx, MARGIN + colW * 2, y + 3, colW, "Branch / Workspace", employee.workspace || payslip.workspace || "-", { rightBorder: false });
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y + 118);
  ctx.lineTo(MARGIN + contentW, y + 118);
  ctx.moveTo(MARGIN, y + 236);
  ctx.lineTo(MARGIN + contentW, y + 236);
  ctx.moveTo(MARGIN, y + 354);
  ctx.lineTo(MARGIN + contentW, y + 354);
  ctx.stroke();
  drawInfoCell(ctx, MARGIN, y + 121, colW, "Job title", employee.job_title || "-");
  drawInfoCell(ctx, MARGIN + colW, y + 121, colW, "Department", employee.department || "-");
  drawInfoCell(ctx, MARGIN + colW * 2, y + 121, colW, "Employment type", employee.employment_type || "-", { rightBorder: false });
  drawInfoCell(ctx, MARGIN, y + 239, colW, "Employment start date", formatDate(employee.start_date));
  drawInfoCell(ctx, MARGIN + colW, y + 239, colW, "Length of service", serviceLength(employee.start_date, payslip.pay_period_end));
  drawInfoCell(ctx, MARGIN + colW * 2, y + 239, colW, "Employment status", employee.employment_status || "Active", { rightBorder: false });
  drawInfoCell(ctx, MARGIN, y + 357, colW, "Supervisor / manager", employee.supervisor || "-");
  drawInfoCell(ctx, MARGIN + colW, y + 357, colW, "Mobile / WhatsApp", employee.phone || payslip.employee_whatsapp || "-");
  drawInfoCell(ctx, MARGIN + colW * 2, y + 357, colW, "Employee email", employee.email || payslip.employee_email || "-", { rightBorder: false });

  y += 520;
  sectionTitle(ctx, "Payroll breakdown", MARGIN, y, contentW);
  y += 78;

  const payrollRows: PayrollRow[] = [
    { description: "Basic salary", earnings: Number(payslip.basic_salary || 0) },
    { description: "Overtime", qty: `${qty(payslip.overtime_hours)} hrs`, rate: money(payslip.overtime_rate), earnings: Number(payslip.overtime_amount || 0) },
    { description: "Allowances", earnings: Number(payslip.allowance_amount || 0) },
    { description: "Commission", earnings: Number(payslip.commission_amount || 0) },
    { description: "Bonus", earnings: Number(payslip.bonus_amount || 0) },
    { description: "Other earnings", earnings: Number(payslip.other_earnings || 0) },
    { description: "UIF", deductions: Number(payslip.uif || 0) },
    { description: "Loan / Advance", deductions: Number(payslip.loan_deduction || 0) },
    { description: "Other deductions", deductions: Number(payslip.other_deductions || 0) },
  ];

  y = drawPayrollTable(ctx, MARGIN, y, contentW, payrollRows);

  const totalsY = y + 28;
  const totalCardW = (contentW - 30) / 3;
  const totalValues = [
    ["Gross earnings", money(payslip.gross_pay)],
    ["Total deductions", money(payslip.total_deductions)],
  ] as const;
  totalValues.forEach((item, i) => {
    const x = MARGIN + i * (totalCardW + 15);
    roundRect(ctx, x, totalsY, totalCardW, 122, 8, "#f6f8fa", LINE, 2);
    label(ctx, item[0], x + 22, totalsY + 38);
    ctx.fillStyle = TEXT;
    ctx.font = "900 38px Arial, sans-serif";
    ctx.fillText(item[1], x + 22, totalsY + 86);
  });

  const netX = MARGIN + (totalCardW + 15) * 2;
  roundRect(ctx, netX, totalsY, totalCardW, 122, 8, NAVY_2);
  ctx.fillStyle = YELLOW;
  ctx.font = "800 22px Arial, sans-serif";
  ctx.fillText("NET PAY", netX + 22, totalsY + 38);
  ctx.fillStyle = WHITE;
  ctx.font = "900 42px Arial, sans-serif";
  ctx.fillText(money(payslip.net_pay), netX + 22, totalsY + 88);

  y = totalsY + 175;
  sectionTitle(ctx, "Payment and payroll notes", MARGIN, y, contentW);
  y += 78;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(MARGIN, y, contentW, 300);

  const paymentCol = Math.round(contentW * 0.36);
  drawInfoCell(ctx, MARGIN, y + 2, paymentCol, "Payment reference", payslip.payment_reference || "-");
  drawInfoCell(ctx, MARGIN, y + 116, paymentCol, "Employee contact", payslip.employee_email || employee.email || payslip.employee_whatsapp || employee.phone || "-", { rightBorder: true });
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(MARGIN, y + 116);
  ctx.lineTo(MARGIN + paymentCol, y + 116);
  ctx.stroke();

  const notesX = MARGIN + paymentCol;
  label(ctx, "Payroll notes", notesX + 24, y + 36);
  ctx.fillStyle = TEXT;
  ctx.font = "500 26px Arial, sans-serif";
  wrap(ctx, payslip.notes || "No additional payroll notes.", contentW - paymentCol - 48).slice(0, 6).forEach((line, i) => {
    ctx.fillText(line, notesX + 24, y + 82 + i * 34);
  });

  const confirmationY = y + 332;
  roundRect(ctx, MARGIN, confirmationY, contentW, 116, 8, "#f7f8fa", LINE, 2);
  ctx.fillStyle = NAVY_2;
  ctx.font = "800 23px Arial, sans-serif";
  ctx.fillText("PAYROLL RECORD", MARGIN + 24, confirmationY + 38);
  ctx.fillStyle = MUTED;
  ctx.font = "500 23px Arial, sans-serif";
  const statement = `This payslip reflects the payroll values captured by the authorised HR/payroll user in PowerBuild Hub for ${employeeName(employee) || "the employee"}. Employment start date: ${formatDate(employee.start_date)}. Queries should be directed to the relevant payroll or HR representative.`;
  wrap(ctx, statement, contentW - 48).slice(0, 3).forEach((line, i) => ctx.fillText(line, MARGIN + 24, confirmationY + 76 + i * 29));

  const footerY = CANVAS_H - 190;
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, footerY - 35);
  ctx.lineTo(CANVAS_W - MARGIN, footerY - 35);
  ctx.stroke();
  ctx.fillStyle = NAVY_2;
  ctx.font = "800 22px Arial, sans-serif";
  ctx.fillText("POWERBUILD · CONFIDENTIAL PAYROLL DOCUMENT", MARGIN, footerY + 5);
  ctx.fillStyle = MUTED;
  ctx.font = "500 21px Arial, sans-serif";
  ctx.fillText(`Generated by ${payslip.generated_by || "PowerBuild HR"} · ${formatDate((payslip.created_at || new Date().toISOString()).slice(0, 10))}`, MARGIN, footerY + 42);
  ctx.textAlign = "right";
  ctx.fillText(`Employee file: ${employee.employee_number || "-"}`, CANVAS_W - MARGIN, footerY + 5);
  ctx.fillText("Keep securely · Share only with the employee or authorised payroll personnel", CANVAS_W - MARGIN, footerY + 42);
  ctx.textAlign = "left";

  return canvas;
}

export function payslipPdfFileName(employee: PayslipPdfEmployee, payslip: PayslipPdfRecord) {
  return `PowerBuild_Payslip_${safeFilePart(employeeName(employee) || employee.employee_number)}_${safeFilePart(payslip.pay_period_end || String(payslip.id))}.pdf`;
}

export async function buildEmployeePayslipPdfBlob(payload: PayslipPdfPayload) {
  const canvas = await renderPayslipCanvas(payload);
  const pdf = new PdfWriter();
  const catalogRef = pdf.reserve(); const pagesRef = pdf.reserve();
  const image = canvasToJpeg(canvas, 0.96); const imageRef = pdf.jpeg(image);
  const content = bytes(`q\n${PAGE_W.toFixed(2)} 0 0 ${PAGE_H.toFixed(2)} 0 0 cm\n/Im1 Do\nQ`);
  const contentRef = pdf.stream(content);
  const pageRef = pdf.add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /XObject << /Im1 ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`);
  pdf.set(catalogRef, `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
  pdf.set(pagesRef, `<< /Type /Pages /Kids [${pageRef} 0 R] /Count 1 >>`);
  const output = pdf.build(catalogRef);
  const buffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: "application/pdf" });
}

export async function downloadEmployeePayslipPdf(payload: PayslipPdfPayload) {
  const blob = await buildEmployeePayslipPdfBlob(payload);
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = payslipPdfFileName(payload.employee, payload.payslip); document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}
