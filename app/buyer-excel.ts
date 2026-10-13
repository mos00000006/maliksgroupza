export type BuyerExcelOrderLine = {
  product_code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  pack_size: string;
  last_cost_ex_vat: number;
  unit_cost_ex_vat: number;
  price_variance_pct: number;
  line_total_ex_vat: number;
  notes: string;
};

export type BuyerExcelOrder = {
  po_number: string;
  buyer_name: string;
  buyer_email: string;
  store_workspace: string;
  supplier_name: string;
  order_type: string;
  order_date: string;
  required_date: string;
  quote_reference: string;
  delivery_method: string;
  status: string;
  approval_status: string;
  delivery_status: string;
  expected_delivery_date: string;
  grv_number: string;
  invoice_number: string;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes: string;
  lines: BuyerExcelOrderLine[];
};

export type BuyerExcelSupplier = {
  supplier_code: string;
  name: string;
  supplier_type: string;
  contact_person: string;
  phone: string;
  email: string;
  payment_terms: string;
  lead_time_days: number;
  minimum_order: number;
  categories: string[];
  notes: string;
};

export type BuyerExcelQuote = {
  product_code: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  supplier_name: string;
  quote_reference: string;
  quoted_unit_cost: number;
  valid_until: string;
  lead_time_days: number;
  payment_terms: string;
  selected: number;
  notes: string;
};

type WorkbookSheet = {
  name: string;
  rows: Array<Array<string | number>>;
  numericColumns?: number[];
  currencyColumns?: number[];
  percentColumns?: number[];
};

const encoder = new TextEncoder();

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function push16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function push32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concatBytes(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function zipStore(files: Array<{ name: string; data: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { time, day } = dosDateTime();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.data);
    const crc = crc32(dataBytes);

    const localHeader: number[] = [];
    push32(localHeader, 0x04034b50);
    push16(localHeader, 20);
    push16(localHeader, 0);
    push16(localHeader, 0);
    push16(localHeader, time);
    push16(localHeader, day);
    push32(localHeader, crc);
    push32(localHeader, dataBytes.length);
    push32(localHeader, dataBytes.length);
    push16(localHeader, nameBytes.length);
    push16(localHeader, 0);
    const local = concatBytes([new Uint8Array(localHeader), nameBytes, dataBytes]);
    localParts.push(local);

    const centralHeader: number[] = [];
    push32(centralHeader, 0x02014b50);
    push16(centralHeader, 20);
    push16(centralHeader, 20);
    push16(centralHeader, 0);
    push16(centralHeader, 0);
    push16(centralHeader, time);
    push16(centralHeader, day);
    push32(centralHeader, crc);
    push32(centralHeader, dataBytes.length);
    push32(centralHeader, dataBytes.length);
    push16(centralHeader, nameBytes.length);
    push16(centralHeader, 0);
    push16(centralHeader, 0);
    push16(centralHeader, 0);
    push16(centralHeader, 0);
    push32(centralHeader, 0);
    push32(centralHeader, offset);
    centralParts.push(concatBytes([new Uint8Array(centralHeader), nameBytes]));
    offset += local.length;
  }

  const localData = concatBytes(localParts);
  const centralData = concatBytes(centralParts);
  const end: number[] = [];
  push32(end, 0x06054b50);
  push16(end, 0);
  push16(end, 0);
  push16(end, files.length);
  push16(end, files.length);
  push32(end, centralData.length);
  push32(end, localData.length);
  push16(end, 0);
  return concatBytes([localData, centralData, new Uint8Array(end)]);
}

function worksheetXml(sheet: WorkbookSheet) {
  const numeric = new Set(sheet.numericColumns || []);
  const currency = new Set(sheet.currencyColumns || []);
  const percent = new Set(sheet.percentColumns || []);
  const rowCount = Math.max(1, sheet.rows.length);
  const colCount = Math.max(1, sheet.rows.reduce((max, row) => Math.max(max, row.length), 0));
  const body = sheet.rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => {
          const ref = `${columnName(colIndex)}${rowIndex + 1}`;
          if (rowIndex > 0 && typeof value === "number") {
            const style = currency.has(colIndex) ? 2 : percent.has(colIndex) ? 3 : numeric.has(colIndex) ? 0 : 0;
            return `<c r="${ref}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
          }
          const style = rowIndex === 0 ? 1 : 0;
          return `<c r="${ref}" t="inlineStr" s="${style}"><is><t>${xmlEscape(String(value ?? ""))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${columnName(colCount - 1)}${rowCount}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <sheetData>${body}</sheetData>
  <autoFilter ref="A1:${columnName(colCount - 1)}${rowCount}"/>
</worksheet>`;
}

function safeSheetName(name: string) {
  return name.replace(/[\\/?*\[\]:]/g, " ").slice(0, 31) || "Sheet";
}

function workbookFiles(sheets: WorkbookSheet[]) {
  const contentTypes = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  const sheetEntries = sheets
    .map((sheet, index) => `<sheet name="${xmlEscape(safeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const relEntries = sheets
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  const stylesRelId = sheets.length + 1;
  const files: Array<{ name: string; data: string }> = [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${contentTypes}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relEntries}<Relationship Id="rId${stylesRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="R #,##0.00"/><numFmt numFmtId="165" formatCode="0.00%"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF17304F"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    },
    {
      name: "docProps/core.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>PowerBuild Buyer Workspace Export</dc:title><dc:creator>PowerBuild Hub</dc:creator><cp:lastModifiedBy>PowerBuild Hub</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>PowerBuild Hub</Application></Properties>`,
    },
  ];
  sheets.forEach((sheet, index) => files.push({ name: `xl/worksheets/sheet${index + 1}.xml`, data: worksheetXml(sheet) }));
  return files;
}

function downloadBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBuyerWorkbook({
  orders,
  suppliers,
  quotes,
  fileName = "PowerBuild_Buyer_Workspace.xlsx",
}: {
  orders: BuyerExcelOrder[];
  suppliers: BuyerExcelSupplier[];
  quotes: BuyerExcelQuote[];
  fileName?: string;
}) {
  const orderRows: WorkbookSheet["rows"] = [[
    "PO Number", "Order Date", "Required Date", "Buyer", "Buyer Email", "Store / Branch", "Supplier",
    "Order Type", "Quote Ref", "Delivery Method", "Status", "Approval", "Delivery Status", "Expected Delivery",
    "GRV Number", "Invoice Number", "Subtotal Ex VAT", "VAT %", "VAT Amount", "Total Inc VAT", "Notes",
  ]];
  orders.forEach((order) => orderRows.push([
    order.po_number, order.order_date, order.required_date, order.buyer_name, order.buyer_email, order.store_workspace,
    order.supplier_name, order.order_type, order.quote_reference, order.delivery_method, order.status,
    order.approval_status, order.delivery_status, order.expected_delivery_date, order.grv_number, order.invoice_number,
    order.subtotal, order.vat_rate / 100, order.vat_amount, order.total, order.notes,
  ]));

  const lineRows: WorkbookSheet["rows"] = [[
    "PO Number", "Product Code", "Description", "Category", "Qty", "Unit", "Pack Size", "Last Cost Ex VAT",
    "Unit Cost Ex VAT", "Variance %", "Line Total Ex VAT", "Line Notes",
  ]];
  orders.forEach((order) => order.lines.forEach((line) => lineRows.push([
    order.po_number, line.product_code, line.description, line.category, line.quantity, line.unit, line.pack_size,
    line.last_cost_ex_vat, line.unit_cost_ex_vat, line.price_variance_pct / 100, line.line_total_ex_vat, line.notes,
  ])));

  const supplierRows: WorkbookSheet["rows"] = [[
    "Supplier Code", "Supplier", "Type", "Contact", "Phone", "Email", "Payment Terms", "Lead Time Days",
    "Minimum Order", "Categories", "Notes",
  ]];
  suppliers.forEach((supplier) => supplierRows.push([
    supplier.supplier_code, supplier.name, supplier.supplier_type, supplier.contact_person, supplier.phone, supplier.email,
    supplier.payment_terms, supplier.lead_time_days, supplier.minimum_order, supplier.categories.join(", "), supplier.notes,
  ]));

  const quoteRows: WorkbookSheet["rows"] = [[
    "Product Code", "Description", "Category", "Qty", "Unit", "Supplier", "Quote Ref", "Quoted Unit Cost",
    "Valid Until", "Lead Time Days", "Payment Terms", "Selected", "Notes",
  ]];
  quotes.forEach((quote) => quoteRows.push([
    quote.product_code, quote.description, quote.category, quote.quantity, quote.unit, quote.supplier_name,
    quote.quote_reference, quote.quoted_unit_cost, quote.valid_until, quote.lead_time_days, quote.payment_terms,
    quote.selected ? "YES" : "NO", quote.notes,
  ]));

  const sheets: WorkbookSheet[] = [
    { name: "Purchase Orders", rows: orderRows, currencyColumns: [16, 18, 19], percentColumns: [17] },
    { name: "Order Lines", rows: lineRows, currencyColumns: [7, 8, 10], percentColumns: [9] },
    { name: "Suppliers", rows: supplierRows, currencyColumns: [8], numericColumns: [7] },
    { name: "Quote Comparison", rows: quoteRows, currencyColumns: [7], numericColumns: [3, 9] },
  ];

  downloadBlob(zipStore(workbookFiles(sheets)), fileName);
}
