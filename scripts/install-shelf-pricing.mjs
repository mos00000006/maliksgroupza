import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const path = "app/price-tags/price-tag-generator.tsx";
const absolute = resolve(root, path);
const original = readFileSync(absolute, "utf8");
let source = original;

const parse = value => {
  const file = ts.createSourceFile("price-tag-generator.tsx", value, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (file.parseDiagnostics.length) throw new Error("Price tag generator could not be parsed. No files changed.");
  return file;
};
const visit = (node, predicate) => {
  const found = [];
  const walk = current => {
    if (predicate(current)) found.push(current);
    ts.forEachChild(current, walk);
  };
  walk(node);
  return found;
};
const need = (value, message) => {
  if (!value) throw new Error(`${message} No files changed.`);
  return value;
};
if (!source.includes('import ShelfPricingStudio from "./shelf-pricing-studio";')) {
  const directive = /(["'])use client\1;?/;
  source = directive.test(source)
    ? source.replace(directive, match => `${match}\nimport ShelfPricingStudio from "./shelf-pricing-studio";`)
    : `import ShelfPricingStudio from "./shelf-pricing-studio";\n${source}`;
}

if (!/useState<[^;]*["']shelf["']/.test(source)) {
  const file = parse(source);
  const declaration = need(visit(file, node => ts.isVariableDeclaration(node)
    && ts.isArrayBindingPattern(node.name)
    && node.name.elements.some(element => ts.isBindingElement(element) && ts.isIdentifier(element.name) && element.name.text === "mode"))[0], "Price tag mode selector differs.");
  const call = need(declaration.initializer && ts.isCallExpression(declaration.initializer) ? declaration.initializer : null, "Price tag mode state differs.");
  const modeType = need(call.typeArguments?.[0], "Price tag mode type differs.");
  source = source.slice(0, modeType.end) + '|"shelf"' + source.slice(modeType.end);
}

if (!source.includes('mode === "shelf"')) {
  const file = parse(source);
  const component = need(file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "PriceTagGenerator"), "Price tag generator function differs.");
  const anchor = need(component.body?.statements.find(node => ts.isIfStatement(node) && (/mode\s*===\s*["']staff-id["']/.test(node.expression.getText(file)) || /mode\s*===\s*["']combo["']/.test(node.expression.getText(file)))), "Studio tool routing differs.");
  const statement = 'if (brand && mode === "shelf") return <ShelfPricingStudio brand={brand} onBack={()=>setMode("single")} />;\n  ';
  source = source.slice(0, anchor.getStart(file)) + statement + source.slice(anchor.getStart(file));
}

if (!source.includes("Shelf pricing A4")) {
  const file = parse(source);
  const component = need(file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "PriceTagGenerator"), "Price tag generator function differs.");
  const menu = need(visit(component, node => ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === "div" && node.getText(file).includes("Single product tag") && node.getText(file).includes("Create a combo"))[0], "Price tag studio menu differs.");
  const single = need(visit(menu, node => ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === "button" && node.getText(file).includes("Single product tag"))[0], "Single product menu button differs.");
  source = source.slice(0, single.end) + '<button type="button" onClick={()=>setMode("shelf")}>Shelf pricing A4</button>' + source.slice(single.end);
}

parse(source);
if (process.argv.includes("--check")) {
  console.log(source === original ? "Shelf pricing integration is installed." : "Shelf pricing integration can be applied safely.");
} else if (source !== original) {
  if (!existsSync(`${absolute}.before-shelf-pricing`)) writeFileSync(`${absolute}.before-shelf-pricing`, original);
  writeFileSync(absolute, source);
  console.log("Shelf pricing A4 added to the existing price tag studio; all current tools were preserved.");
} else {
  console.log("Shelf pricing A4 is already installed.");
}
