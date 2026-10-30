import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url).pathname;

test("shelf studio and A4 PDF helper compile", async () => {
  const temp = mkdtempSync(join(tmpdir(), "shelf-build-"));
  await build({
    entryPoints: [join(root, "app/price-tags/shelf-pricing-studio.tsx")],
    bundle: true,
    platform: "browser",
    format: "esm",
    outdir: temp,
    loader: { ".css": "local-css" },
  });
  await build({
    entryPoints: [join(root, "app/lib/a4-shelf-price-pdf.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: join(temp, "pdf.mjs"),
  });
  const { a4ShelfPricePdf } = await import(pathToFileURL(join(temp, "pdf.mjs")));
  const tinyJpeg = "data:image/jpeg;base64,/9j/2Q==";
  const pdf = a4ShelfPricePdf([tinyJpeg, tinyJpeg]);
  assert.equal(pdf.type, "application/pdf");
  const text = new TextDecoder().decode(await pdf.arrayBuffer());
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/Count 2/);
  assert.equal((text.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g) || []).length, 2);
  assert.equal((text.match(/\/Width 2480 \/Height 3508/g) || []).length, 2);
  assert.match(text, /xref\n0 9/);
  assert.match(text, /%%EOF\n$/);
});

test("installer adds one shelf tool and preserves the existing studio menu", () => {
  const temp = mkdtempSync(join(tmpdir(), "shelf-install-"));
  mkdirSync(join(temp, "app/price-tags"), { recursive: true });
  const generator = `"use client";
import {useState} from "react";
export default function PriceTagGenerator(){
 const [mode,setMode]=useState<"single"|"combo"|"whatsapp"|"staff-id">("single");
 const [brand]=useState<"powerbuild"|"busterbuild"|null>("powerbuild");
 if (brand && mode === "staff-id") return <div>Staff ID cards stay</div>;
 if (brand && mode === "combo") return <div>Combo stays</div>;
 return <div className={styles.buttons}><button type="button" aria-pressed={true}>Single product tag</button><button type="button" onClick={()=>setMode("combo")}>Create a combo</button><button type="button" onClick={()=>setMode("whatsapp")}>WhatsApp adverts</button><button type="button" onClick={()=>setMode("staff-id")}>Staff ID cards</button></div>;
}
const styles={buttons:"buttons"};`;
  const target = join(temp, "app/price-tags/price-tag-generator.tsx");
  writeFileSync(target, generator);
  const installer = join(root, "scripts/install-shelf-pricing.mjs");
  execFileSync(process.execPath, [installer], { cwd: temp });
  const once = readFileSync(target, "utf8");
  assert.match(once, /ShelfPricingStudio/);
  assert.match(once, /mode === "shelf"/);
  assert.match(once, /Shelf pricing A4/);
  assert.match(once, /WhatsApp adverts/);
  assert.match(once, /Staff ID cards stay/);
  assert.match(once, /Create a combo/);
  execFileSync(process.execPath, [installer], { cwd: temp });
  assert.equal(readFileSync(target, "utf8"), once);
  assert.equal((once.match(/Shelf pricing A4/g) || []).length, 1);
});

test("existing image installer keeps Hamiltons and automatically installs shelf pricing", () => {
  const source = readFileSync(join(root, "scripts/install-torkcraft-images.mjs"), "utf8");
  assert.match(source, /install-hamiltons-images\.mjs/);
  assert.match(source, /install-shelf-pricing\.mjs/);
});
