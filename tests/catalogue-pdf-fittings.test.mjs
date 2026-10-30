import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("../", import.meta.url).pathname;
const temp = mkdtempSync(join(tmpdir(), "catalogue-fittings-"));
const output = join(temp, "catalogue-pdf-grouping.mjs");

await build({
  entryPoints: [join(root, "app/catalogue-pdf-grouping.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: output,
});

const { cataloguePdfCategory } = await import(pathToFileURL(output));
const product = (name, category = "Plumbing", description = "") => ({ name, category, description });

test("separates plumbing fittings into accurate catalogue sections", () => {
  assert.equal(cataloguePdfCategory(product("Fitting comp HDPE elbow 20mm")), "HDPE & Compression Fittings");
  assert.equal(cataloguePdfCategory(product("110 SV bend 45 degree")), "Soil & Vent (SV)");
  assert.equal(cataloguePdfCategory(product("110 UG bend 45 degree")), "Underground (UG)");
  assert.equal(cataloguePdfCategory(product("Copper straight coupler 15mm")), "Copper & Brass Fittings");
  assert.equal(cataloguePdfCategory(product("Trap waste bath mini", "Bathroom · Baths")), "Waste & Trap Fittings");
  assert.equal(cataloguePdfCategory(product("Basin waste slotted", "Bathroom · Accessories")), "Waste & Trap Fittings");
  assert.equal(cataloguePdfCategory(product("Equal tee 25mm", "Pipe Fittings")), "Plumbing Accessories");
});

test("moves window blinds out of plumbing regardless of legacy category", () => {
  assert.equal(cataloguePdfCategory(product("Venetian window blind 900mm", "Plumbing Fittings")), "Window Blinds & Treatments");
  assert.equal(cataloguePdfCategory(product("Roller blinds", "Blinds")), "Window Blinds & Treatments");
  assert.equal(cataloguePdfCategory(product("Blind flange 20mm", "Pipe Fittings")), "Plumbing Accessories");
});

test("keeps pipes, taps and unrelated sockets or adaptors in their existing sections", () => {
  assert.equal(cataloguePdfCategory(product("PVC pipe 110mm x 6m")), "Plumbing");
  assert.equal(cataloguePdfCategory(product("Basin mixer", "Bathroom · Taps")), "Bathroom Taps");
  assert.equal(cataloguePdfCategory(product("Impact socket 17mm", "TorkCraft")), "TorkCraft");
  assert.equal(cataloguePdfCategory(product("SDS adaptor", "Tools")), "Tools");
  assert.equal(cataloguePdfCategory(product("Double wall socket", "Electrical & Lighting")), "Electrical & Lighting");
});

test("never generates the original mixed Fittings page", () => {
  const products = [
    product("Galvanised fitting 90 degree", "General Hardware"),
    product("Copper elbow", "Plumbing Fittings"),
    product("PVC elbow", "Fittings"),
    product("Unspecified fitting", "Fittings"),
    product("Roof sheet", "  Roofing & Gutters  "),
  ];
  assert.deepEqual(products.map(cataloguePdfCategory), [
    "Galvanised Fittings", "Copper & Brass Fittings", "PVC & Pressure Fittings", "Plumbing Accessories", "Roofing & Gutters",
  ]);
  for (const item of products) assert.notEqual(cataloguePdfCategory(item), "Fittings");
});

test("real imported Alco blinds get their own catalogue page", () => {
  assert.equal(cataloguePdfCategory(product("Alco Aluminium Blinds 25mm Black - 1000x1200 mm", "Homeware", "Decor ranges: Blinds. Includes brackets and fittings.")), "Window Blinds & Treatments");
  assert.equal(cataloguePdfCategory(product("Alco PVC Blinds 25mm Charcoal Grey - 1200x1500 mm", "Homeware")), "Window Blinds & Treatments");
  assert.equal(cataloguePdfCategory(product("Blind flange 20mm", "Pipe Fittings")), "Plumbing Accessories");
});
