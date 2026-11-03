import { existsSync, readFileSync, writeFileSync } from "node:fs";

const generatorPath = "app/price-tags/price-tag-generator.tsx";
const packagePath = "package.json";
const checkOnly = process.argv.includes("--check");
const requireAnchor = (condition, message) => { if (!condition) throw new Error(`${message}. No files changed.`); };

let generator = readFileSync(generatorPath, "utf8");
const originalGenerator = generator;
const originalPackage = readFileSync(packagePath, "utf8");
const packageJson = JSON.parse(originalPackage);

const importLine = 'import BulkPriceTagStudio from "./bulk-price-tag-studio";';
if (!generator.includes(importLine)) {
  const anchor = 'import ProductNameSearch from "./product-name-search";';
  requireAnchor(generator.includes(anchor), "Bulk price-tag installer could not find the product-search import");
  generator = generator.replace(anchor, `${anchor}\n${importLine}`);
}
if (!/\|"bulk"/.test(generator)) {
  const mode = /const \[mode,setMode\]=useState<([^>]+)>\("single"\);/;
  requireAnchor(mode.test(generator), "Bulk price-tag installer could not find the Studio mode declaration");
  generator = generator.replace(mode, (_, modes) => `const [mode,setMode]=useState<${modes}|"bulk">("single");`);
}
if (!/mode === "bulk"/.test(generator)) {
  const anchor = 'if (brand && mode === "staff-id") return <StaffIdGenerator brand={brand} onBack={()=>setMode("single")} />;';
  requireAnchor(generator.includes(anchor), "Bulk price-tag installer could not find the Staff ID mode anchor");
  generator = generator.replace(anchor, `if (brand && mode === "bulk") return <BulkPriceTagStudio brand={brand} onBack={()=>setMode("single")} />;\n  ${anchor}`);
}
if (!/setMode\("bulk"\)/.test(generator)) {
  const anchor = '<button type="button" aria-pressed={true}>Single product tag</button>';
  requireAnchor(generator.includes(anchor), "Bulk price-tag installer could not find the Single product tag button");
  generator = generator.replace(anchor, `${anchor}<button type="button" onClick={()=>setMode("bulk")}>Bulk A4 price tags</button>`);
}

packageJson.scripts ||= {};
const hook = "node scripts/install-bulk-price-tags.mjs";
const prebuild = String(packageJson.scripts.prebuild || "").trim();
if (!prebuild.includes(hook)) packageJson.scripts.prebuild = prebuild ? `${prebuild} && ${hook}` : hook;
const nextPackage = JSON.stringify(packageJson, null, 2) + "\n";

if (checkOnly) {
  requireAnchor(generator.includes(importLine) && /mode === "bulk"/.test(generator) && /setMode\("bulk"\)/.test(generator), "Bulk A4 price tags are not fully integrated");
  requireAnchor(String(packageJson.scripts.prebuild).includes(hook), "Bulk price-tag prebuild repair hook is missing");
  console.log("Bulk A4 price-tag integration check passed.");
} else {
  if (generator !== originalGenerator) {
    const backup = `${generatorPath}.before-bulk-price-tags`;
    if (!existsSync(backup)) writeFileSync(backup, originalGenerator);
    writeFileSync(generatorPath, generator);
  }
  if (nextPackage !== originalPackage) {
    const backup = `${packagePath}.before-bulk-price-tags`;
    if (!existsSync(backup)) writeFileSync(backup, originalPackage);
    writeFileSync(packagePath, nextPackage);
  }
  console.log(generator === originalGenerator && nextPackage === originalPackage ? "Bulk A4 price tags already integrated." : "Bulk A4 price tags integrated into Price Tag Studio.");
}
