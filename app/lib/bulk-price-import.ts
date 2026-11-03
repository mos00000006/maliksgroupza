import type { TagUnit } from "./price-tags";

export type BulkPriceRow = {
  id: string;
  sourceRow: number;
  code: string;
  name: string;
  price: string;
  unit: TagUnit;
  colour: string;
  branch: string;
};
type ColumnKey = "code" | "name" | "price" | "unit" | "colour" | "branch";
type ColumnMap = Partial<Record<ColumnKey, number>>;
const aliases: Record<ColumnKey, string[]> = {
  code: ["code", "productcode", "itemcode", "stockcode", "sku", "barcode"],
  name: ["product", "productname", "name", "description", "productdescription", "item", "itemname"],
  price: ["price", "sellingprice", "retailprice", "priceinclvat", "priceincludingvat", "unitprice", "normalprice", "saleprice"],
  unit: ["unit", "priceunit", "uom", "basis"],
  colour: ["colour", "color", "paintcolour", "paintcolor", "variant"],
  branch: ["branch", "store", "shop", "location"],
};
const normalise = (value: unknown) => String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
const cell = (row: unknown[], index: number | undefined) => index === undefined ? "" : String(row[index] ?? "").trim();

function headerColumns(row: unknown[]): ColumnMap {
  const result: ColumnMap = {};
  row.forEach((value, index) => {
    const heading = normalise(value);
    if (!heading) return;
    for (const key of Object.keys(aliases) as ColumnKey[]) {
      if (result[key] === undefined && aliases[key].some(alias => heading === alias || heading.startsWith(alias))) result[key] = index;
    }
  });
  return result;
}
export function bulkPriceCents(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
  let amount = String(value ?? "").trim().replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!amount) return null;
  if (amount.includes(",") && !amount.includes(".")) {
    const decimals = amount.length - amount.lastIndexOf(",") - 1;
    amount = decimals === 2 ? amount.replace(",", ".") : amount.replace(/,/g, "");
  } else amount = amount.replace(/,/g, "");
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}
function tagUnit(value: unknown): TagUnit {
  const unit = normalise(value);
  if (unit.includes("box") || unit.includes("carton") || unit === "ctn") return "BOX";
  if (unit.includes("sqm") || unit.includes("m2") || unit.includes("squaremet")) return "M2";
  return "EA";
}
export function parseBulkPriceRows(matrix: unknown[][]) {
  let headerIndex = -1;
  let columns: ColumnMap = {};
  let bestScore = 0;
  matrix.slice(0, 20).forEach((row, index) => {
    const candidate = headerColumns(row);
    const score = Object.keys(candidate).length;
    if (candidate.price !== undefined && (candidate.name !== undefined || candidate.code !== undefined) && score > bestScore) {
      headerIndex = index; columns = candidate; bestScore = score;
    }
  });
  if (headerIndex < 0) {
    headerIndex = matrix.findIndex(row => row.some(value => String(value ?? "").trim()));
    const first = matrix[headerIndex] || [];
    columns = first.length >= 3 && bulkPriceCents(first[2]) !== null ? { code: 0, name: 1, price: 2 } : { name: 0, price: 1 };
    headerIndex -= 1;
  }
  const rows: BulkPriceRow[] = [];
  const rejected: number[] = [];
  matrix.slice(headerIndex + 1).forEach((raw, offset) => {
    const sourceRow = headerIndex + offset + 2;
    if (!raw.some(value => String(value ?? "").trim())) return;
    const code = cell(raw, columns.code);
    const name = cell(raw, columns.name) || code;
    const cents = bulkPriceCents(columns.price === undefined ? "" : raw[columns.price]);
    if (!name || cents === null) { rejected.push(sourceRow); return; }
    rows.push({ id: `${sourceRow}-${rows.length}-${code || name}`, sourceRow, code, name, price: (cents / 100).toFixed(2), unit: tagUnit(cell(raw, columns.unit)), colour: cell(raw, columns.colour), branch: cell(raw, columns.branch) });
  });
  return { rows: rows.slice(0, 500), rejected, truncated: rows.length > 500 };
}
