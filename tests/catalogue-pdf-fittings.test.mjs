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

test("puts explicit and implicit plumbing fittings into one PDF section", () => {
  assert.equal(cataloguePdfCategory(product("Fitting comp HDPE elbow 20mm")), "Fittings");
  assert.equal(cataloguePdfCategory(product("110 SV bend 45 degree")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Copper straight coupler 15mm")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Trap waste bath mini", "Bathroom · Baths")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Basin waste slotted", "Bathroom · Accessories")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Equal tee 25mm", "Pipe Fittings")), "Fittings");
});

test("keeps pipes, taps and unrelated sockets or adaptors in their existing sections", () => {
  assert.equal(cataloguePdfCategory(product("PVC pipe 110mm x 6m")), "Plumbing");
  assert.equal(cataloguePdfCategory(product("Basin mixer", "Bathroom · Taps")), "Bathroom Taps");
  assert.equal(cataloguePdfCategory(product("Impact socket 17mm", "TorkCraft")), "TorkCraft");
  assert.equal(cataloguePdfCategory(product("SDS adaptor", "Tools")), "Tools");
  assert.equal(cataloguePdfCategory(product("Double wall socket", "Electrical & Lighting")), "Electrical & Lighting");
});

test("recognises explicit fitting records without changing unrelated category labels", () => {
  assert.equal(cataloguePdfCategory(product("Galvanised fitting 90 degree", "General Hardware")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Copper elbow", "Plumbing Fittings")), "Fittings");
  assert.equal(cataloguePdfCategory(product("Roof sheet", "  Roofing & Gutters  ")), "Roofing & Gutters");
});
