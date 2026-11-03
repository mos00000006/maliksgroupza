import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("app/hub-display-size.tsx", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const css = readFileSync("app/hub-display-size.css", "utf8");

test("Hub root layout loads the display-size control and its styles", () => {
  assert.match(layout, /<HubDisplaySize\s*\/>/);
  assert.match(layout, /hub-display-size\.css/);
});
test("display sizes include normal, intermediate and extra-large", () => {
  assert.match(component, /100, 110, 125, 135, 150/);
  assert.match(component, /style\.zoom/);
  assert.match(component, /localStorage\.setItem/);
  assert.match(component, /Reset to normal/);
});
test("public shopping and QR pages excluded", () => {
  assert.match(component, /isInternalHubPath\(window\.location\.pathname\)/);
  assert.doesNotMatch(component.slice(component.indexOf("function isInternalHubPath"),component.indexOf("export default function")), /\/shop|\/api/);
});
test("control is accessible and hidden when printing", () => {
  assert.match(component, /aria-pressed/);
  assert.match(component, /aria-expanded/);
  assert.match(css, /@media print/);
});
