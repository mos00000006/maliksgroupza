import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bulkPriceCents, parseBulkPriceRows } from "../app/lib/bulk-price-import.ts";
import { read, utils, write } from "../public/price-tag-assets/xlsx.mjs";

test("price-list parser recognises manager headings, South African prices and optional tag fields", () => {
  const result = parseBulkPriceRows([
    ["Manager price list"],
    ["Stock Code", "Product Description", "Retail Price", "UOM", "Color", "Store"],
    ["TC0047", "HOLE SAW TCT 16MM", "R 1 299,99", "Each", "", "PowerBuild Sungate"],
    ["TILE600", "600X600 PORCELAIN TILE", 399.99, "Box", "Ivory", "PowerBuild Midway"],
    ["BAD", "Missing price", "", "Each", "", ""],
  ]);
  assert.equal(result.rows.length, 2);
  assert.deepEqual(result.rows.map(row => [row.code, row.name, row.price, row.unit, row.colour, row.branch]), [
    ["TC0047", "HOLE SAW TCT 16MM", "1299.99", "EA", "", "PowerBuild Sungate"],
    ["TILE600", "600X600 PORCELAIN TILE", "399.99", "BOX", "Ivory", "PowerBuild Midway"],
  ]);
  assert.deepEqual(result.rejected, [5]);
  assert.equal(bulkPriceCents("R2,499.50"), 249950);
  assert.equal(bulkPriceCents("not a price"), null);
});

test("vendored workbook reader handles modern XLSX and legacy XLS uploads", () => {
  const sheet = utils.aoa_to_sheet([["Product Name", "Price"], ["Cement 50kg", 99.99], ["Plaster 40kg", 84.5]]);
  const workbook = utils.book_new(); utils.book_append_sheet(workbook, sheet, "Price Tags");
  for (const bookType of ["xlsx", "biff8"]) {
    const bytes = write(workbook, { type: "array", bookType });
    const opened = read(new Uint8Array(bytes), { type: "array" });
    const matrix = utils.sheet_to_json(opened.Sheets[opened.SheetNames[0]], { header: 1, raw: false, defval: "", blankrows: false });
    const result = parseBulkPriceRows(matrix);
    assert.deepEqual(result.rows.map(row => [row.name, row.price]), [["Cement 50kg", "99.99"], ["Plaster 40kg", "84.50"]]);
  }
});

test("bulk studio offers six or eight print tags and keeps the workbook in the browser", () => {
  const source = readFileSync("app/price-tags/bulk-price-tag-studio.tsx", "utf8");
  assert.match(source, /accept="\.xlsx,\.xls,\.csv/);
  assert.match(source, /6 larger tags/);
  assert.match(source, /8 compact tags/);
  assert.match(source, /window\.print\(\)/);
  assert.match(source, /not uploaded or saved in the Hub/);
  assert.doesNotMatch(source, /fetch\(/);
  const css = readFileSync("app/price-tags/bulk-price-tag-studio.module.css", "utf8");
  assert.match(css, /@page\{size:A4 portrait/);
  assert.match(css, /repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /repeat\(4,minmax\(0,1fr\)\)/);
});

test("installer adds one bulk Studio tool, preserves existing tools and repairs itself during prebuild", () => {
  const root = mkdtempSync(join(tmpdir(), "bulk-tags-"));
  mkdirSync(join(root, "app/price-tags"), { recursive: true }); mkdirSync(join(root, "scripts"), { recursive: true });
  writeFileSync(join(root, "app/price-tags/price-tag-generator.tsx"), `"use client";\nimport ProductNameSearch from "./product-name-search";\nimport StaffIdGenerator from "./staff-id-generator";\nimport {useState} from "react";\nexport default function Studio(){\n const [mode,setMode]=useState<"single"|"shelf"|"safety-signs"|"staff-id">("single");\n const brand="powerbuild";\n if (brand && mode === "staff-id") return <StaffIdGenerator brand={brand} onBack={()=>setMode("single")} />;\n return <div><button type="button" aria-pressed={true}>Single product tag</button><button type="button">Shelf pricing A4</button><button type="button">Safety &amp; Warning Signs</button></div>;\n}\n`);
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { prebuild: "node scripts/install-assessment-centre.mjs" } }, null, 2));
  cpSync("scripts/install-bulk-price-tags.mjs", join(root, "scripts/install-bulk-price-tags.mjs"));
  for (let run = 0; run < 2; run += 1) execFileSync(process.execPath, ["scripts/install-bulk-price-tags.mjs"], { cwd: root });
  const source = readFileSync(join(root, "app/price-tags/price-tag-generator.tsx"), "utf8");
  assert.equal((source.match(/import BulkPriceTagStudio/g) || []).length, 1);
  assert.equal((source.match(/setMode\("bulk"\)/g) || []).length, 1);
  assert.match(source, /Shelf pricing A4/); assert.match(source, /Safety &amp; Warning Signs/);
  const pkg = JSON.parse(readFileSync(join(root, "package.json",), "utf8"));
  assert.equal((pkg.scripts.prebuild.match(/install-bulk-price-tags\.mjs/g) || []).length, 1);
});
