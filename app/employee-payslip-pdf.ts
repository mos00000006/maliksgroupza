export type PayslipPdfEmployee = {
  id: number;
  employee_number: string;
  workspace: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
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
  paye: number;
  uif: number;
  pension: number;
  medical_aid: number;
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
const NAVY = "#153452";
const NAVY_2 = "#0f2740";
const BLUE = "#1467d8";
const YELLOW = "#f8cd24";
const TEXT = "#183149";
const MUTED = "#738396";
const LINE = "#dbe3ec";
const SOFT = "#f5f8fc";
const WHITE = "#ffffff";
const GREEN = "#177a58";

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
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = cleanText(text || "-").split(" ");
  const lines: string[] = [];
  let line = words.shift() || "-";
  for (const word of words) {
    const candidate = `${line} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
};

const drawMeta = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, value: string) => {
  roundRect(ctx, x, y, w, 128, 20, WHITE, LINE, 2);
  ctx.fillStyle = MUTED; ctx.font = "700 25px Arial, sans-serif"; ctx.fillText(label.toUpperCase(), x + 24, y + 40);
  ctx.fillStyle = TEXT; ctx.font = "800 35px Arial, sans-serif";
  wrap(ctx, value || "-", w - 48).slice(0, 2).forEach((line, i) => ctx.fillText(line, x + 24, y + 82 + i * 34));
};

const drawTableHeader = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, title: string, accent: string) => {
  roundRect(ctx, x, y, w, 72, 18, NAVY_2);
  ctx.fillStyle = accent; ctx.font = "900 27px Arial, sans-serif"; ctx.fillText(title.toUpperCase(), x + 24, y + 45);
};

const drawLineItem = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, amount: number, detail = "") => {
  ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 58); ctx.lineTo(x + w, y + 58); ctx.stroke();
  ctx.fillStyle = TEXT; ctx.font = "700 28px Arial, sans-serif"; ctx.fillText(label, x + 10, y + 35);
  if (detail) { ctx.fillStyle = MUTED; ctx.font = "500 21px Arial, sans-serif"; ctx.fillText(detail, x + 10, y + 58); }
  const value = money(amount); ctx.fillStyle = TEXT; ctx.font = "800 28px Arial, sans-serif"; ctx.textAlign = "right"; ctx.fillText(value, x + w - 10, y + 35); ctx.textAlign = "left";
};

async function renderPayslipCanvas(payload: PayslipPdfPayload) {
  const { employee, payslip } = payload;
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W; canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create payslip document.");

  ctx.fillStyle = "#eef3f8"; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  roundRect(ctx, 65, 65, CANVAS_W - 130, CANVAS_H - 130, 34, WHITE, "#d6e0e9", 3);

  roundRect(ctx, MARGIN, MARGIN, CANVAS_W - MARGIN * 2, 350, 30, NAVY);
  ctx.fillStyle = YELLOW; ctx.fillRect(MARGIN, MARGIN + 338, CANVAS_W - MARGIN * 2, 12);
  const logo = await loadImage("/powerbuild-warning-logo.png").catch(() => loadImage("/powerbuild-logo-transparent.png")).catch(() => null);
  if (logo) {
    const h = 205; const ratio = (logo.naturalWidth || logo.width || 1) / (logo.naturalHeight || logo.height || 1); const w = h * ratio;
    ctx.drawImage(logo, MARGIN + 28, MARGIN + 54, w, h);
  }
  ctx.fillStyle = YELLOW; ctx.font = "900 26px Arial, sans-serif"; ctx.fillText("POWERBUILD EMPLOYEE PAYROLL", MARGIN + 335, MARGIN + 78);
  ctx.fillStyle = WHITE; ctx.font = "900 82px Arial, sans-serif"; ctx.fillText("PAYSLIP", MARGIN + 335, MARGIN + 172);
  ctx.fillStyle = "#d8e5f1"; ctx.font = "500 30px Arial, sans-serif"; ctx.fillText("Confidential employee remuneration statement", MARGIN + 335, MARGIN + 222);

  const periodLabel = `${formatDate(payslip.pay_period_start)} - ${formatDate(payslip.pay_period_end)}`;
  roundRect(ctx, CANVAS_W - MARGIN - 600, MARGIN + 50, 550, 188, 24, "rgba(255,255,255,.08)", "rgba(255,255,255,.16)", 2);
  ctx.fillStyle = "#d8e5f1"; ctx.font = "700 24px Arial, sans-serif"; ctx.fillText("PAY PERIOD", CANVAS_W - MARGIN - 560, MARGIN + 96);
  ctx.fillStyle = WHITE; ctx.font = "900 34px Arial, sans-serif"; wrap(ctx, periodLabel, 475).slice(0,2).forEach((line,i)=>ctx.fillText(line,CANVAS_W-MARGIN-560,MARGIN+140+i*38));
  ctx.fillStyle = "#d8e5f1"; ctx.font = "600 23px Arial, sans-serif"; ctx.fillText(`Payslip no. PB-PAY-${payslip.id}`, CANVAS_W - MARGIN - 560, MARGIN + 218);

  const contentW = CANVAS_W - MARGIN * 2; const gap = 22; const col3 = Math.floor((contentW - gap * 2) / 3);
  let y = 555;
  ctx.fillStyle = NAVY; ctx.font = "900 30px Arial, sans-serif"; ctx.fillText("EMPLOYEE & PAYMENT DETAILS", MARGIN, y);
  y += 28;
  drawMeta(ctx, MARGIN, y, col3, "Employee", employeeName(employee));
  drawMeta(ctx, MARGIN + col3 + gap, y, col3, "Employee number", employee.employee_number || "-");
  drawMeta(ctx, MARGIN + (col3 + gap) * 2, y, col3, "Branch / Workspace", employee.workspace || payslip.workspace || "-");
  y += 150;
  drawMeta(ctx, MARGIN, y, col3, "Job title", [employee.job_title, employee.department].filter(Boolean).join(" / ") || "-");
  drawMeta(ctx, MARGIN + col3 + gap, y, col3, "Payment date", formatDate(payslip.payment_date));
  drawMeta(ctx, MARGIN + (col3 + gap) * 2, y, col3, "Payment method", [payslip.payment_method, payslip.payment_reference].filter(Boolean).join(" · ") || "-");

  y += 175;
  const tableGap = 34; const tableW = Math.floor((contentW - tableGap) / 2); const leftX = MARGIN; const rightX = MARGIN + tableW + tableGap;
  drawTableHeader(ctx, leftX, y, tableW, "Earnings", YELLOW);
  drawTableHeader(ctx, rightX, y, tableW, "Deductions", "#8fd2ba");
  y += 90;
  const rowH = 76;
  const earnings = [
    ["Basic salary", payslip.basic_salary, ""],
    ["Overtime", payslip.overtime_amount, `${qty(payslip.overtime_hours)} hrs × ${money(payslip.overtime_rate)}`],
    ["Allowances", payslip.allowance_amount, ""],
    ["Commission", payslip.commission_amount, ""],
    ["Bonus", payslip.bonus_amount, ""],
    ["Other earnings", payslip.other_earnings, ""],
  ] as const;
  const deductions = [
    ["PAYE", payslip.paye], ["UIF", payslip.uif], ["Pension / Provident", payslip.pension], ["Medical aid", payslip.medical_aid], ["Loan / Advance", payslip.loan_deduction], ["Other deductions", payslip.other_deductions],
  ] as const;
  earnings.forEach((item, i) => drawLineItem(ctx, leftX, y + i * rowH, tableW, item[0], Number(item[1]), item[2]));
  deductions.forEach((item, i) => drawLineItem(ctx, rightX, y + i * rowH, tableW, item[0], Number(item[1])));

  const totalY = y + earnings.length * rowH + 30;
  roundRect(ctx, leftX, totalY, tableW, 116, 20, SOFT, LINE, 2);
  ctx.fillStyle = NAVY; ctx.font = "800 28px Arial, sans-serif"; ctx.fillText("GROSS PAY", leftX + 24, totalY + 46);
  ctx.font = "900 43px Arial, sans-serif"; ctx.fillStyle = TEXT; ctx.fillText(money(payslip.gross_pay), leftX + 24, totalY + 92);
  roundRect(ctx, rightX, totalY, tableW, 116, 20, SOFT, LINE, 2);
  ctx.fillStyle = NAVY; ctx.font = "800 28px Arial, sans-serif"; ctx.fillText("TOTAL DEDUCTIONS", rightX + 24, totalY + 46);
  ctx.font = "900 43px Arial, sans-serif"; ctx.fillStyle = TEXT; ctx.fillText(money(payslip.total_deductions), rightX + 24, totalY + 92);

  const netY = totalY + 150;
  roundRect(ctx, MARGIN, netY, contentW, 190, 28, NAVY);
  ctx.fillStyle = YELLOW; ctx.font = "900 31px Arial, sans-serif"; ctx.fillText("NET PAY", MARGIN + 36, netY + 58);
  ctx.fillStyle = WHITE; ctx.font = "900 76px Arial, sans-serif"; ctx.fillText(money(payslip.net_pay), MARGIN + 36, netY + 139);
  ctx.fillStyle = "#dce7f1"; ctx.font = "600 25px Arial, sans-serif"; ctx.textAlign = "right"; ctx.fillText("Amount payable to employee", CANVAS_W - MARGIN - 36, netY + 96); ctx.textAlign = "left";

  const notesY = netY + 225;
  roundRect(ctx, MARGIN, notesY, contentW, 250, 22, WHITE, LINE, 2);
  ctx.fillStyle = NAVY; ctx.font = "900 29px Arial, sans-serif"; ctx.fillText("PAYROLL NOTES", MARGIN + 26, notesY + 48);
  ctx.fillStyle = TEXT; ctx.font = "500 28px Arial, sans-serif";
  wrap(ctx, payslip.notes || "No additional payroll notes.", contentW - 52).slice(0, 4).forEach((line, i) => ctx.fillText(line, MARGIN + 26, notesY + 98 + i * 36));
  ctx.fillStyle = MUTED; ctx.font = "500 23px Arial, sans-serif";
  ctx.fillText(`Employee contact: ${payslip.employee_email || employee.email || "-"} · ${payslip.employee_whatsapp || employee.phone || "-"}`, MARGIN + 26, notesY + 222);

  const assuranceY = notesY + 290;
  roundRect(ctx, MARGIN, assuranceY, contentW, 150, 22, "#f8fafc", LINE, 2);
  ctx.fillStyle = GREEN; ctx.font = "900 27px Arial, sans-serif"; ctx.fillText("SYSTEM GENERATED", MARGIN + 28, assuranceY + 48);
  ctx.fillStyle = TEXT; ctx.font = "500 25px Arial, sans-serif";
  wrap(ctx, "This payslip was generated from the PowerBuild Employee Records module. Tax and statutory values shown are the payroll values captured by the authorised HR/payroll user.", contentW - 56).slice(0, 3).forEach((line, i) => ctx.fillText(line, MARGIN + 28, assuranceY + 88 + i * 31));

  const footerY = CANVAS_H - 210;
  ctx.strokeStyle = YELLOW; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(MARGIN, footerY - 32); ctx.lineTo(CANVAS_W - MARGIN, footerY - 32); ctx.stroke();
  ctx.fillStyle = MUTED; ctx.font = "600 23px Arial, sans-serif";
  ctx.fillText(`Generated by ${payslip.generated_by || "PowerBuild HR"} · ${formatDate((payslip.created_at || new Date().toISOString()).slice(0,10))}`, MARGIN, footerY + 8);
  ctx.fillText(`Employee file: ${employee.employee_number || "-"} · ${payslip.workspace || employee.workspace || "-"}`, MARGIN, footerY + 44);
  ctx.fillText("CONFIDENTIAL PAYROLL DOCUMENT · Store securely and share only with the employee or authorised payroll personnel.", MARGIN, footerY + 80);

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
