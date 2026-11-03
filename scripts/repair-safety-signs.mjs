import { readFileSync, writeFileSync } from 'node:fs';

const path = 'app/price-tags/price-tag-generator.tsx';
let source = readFileSync(path, 'utf8');
const original = source;
const requireAnchor = (condition, message) => { if (!condition) throw new Error(`${message}. No changes made.`); };

const importLine = 'import SafetyWarningSigns from "./safety-warning-signs";';
if (!source.includes(importLine)) {
  const anchor = 'import StoreSignage from "./store-signage";';
  requireAnchor(source.includes(anchor), 'Missing StoreSignage import anchor');
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}
if (!/\|"safety-signs"/.test(source)) {
  const modeAnchor = /const \[mode,setMode\]=useState<([^>]+)>\("single"\)/;
  requireAnchor(modeAnchor.test(source), 'Unable to locate Studio mode declaration');
  source = source.replace(modeAnchor, (_, modes) => `const [mode,setMode]=useState<${modes}|"safety-signs">("single")`);
}
if (!/mode === "safety-signs"/.test(source)) {
  const anchor = 'if (brand && mode === "signage") return <StoreSignage brand={brand} onBack={()=>setMode("single")} />;';
  requireAnchor(source.includes(anchor), 'Missing StoreSignage dispatch anchor');
  source = source.replace(anchor, `${anchor}\n  if (brand && mode === "safety-signs") return <SafetyWarningSigns brand={brand} onBack={()=>setMode("single")} />;`);
}
const safetyButton = /<button\b[^>]*onClick=\{\(\)=>setMode\("safety-signs"\)\}[^>]*>\s*Safety\s*(?:&amp;|&)\s*Warning Signs\s*<\/button>/;
if (!safetyButton.test(source)) {
  // An existing differently labelled safety-signs button should not be duplicated.
  requireAnchor(!/onClick=\{\(\)=>setMode\("safety-signs"\)\}/.test(source), 'An existing Safety Signs button uses a different label; review it manually');
  const buttonAnchor = '<button type="button" onClick={()=>setMode("signage")}>Store signage</button>';
  requireAnchor(source.includes(buttonAnchor), 'Missing Store signage button anchor');
  source = source.replace(buttonAnchor, `${buttonAnchor}<button type="button" onClick={()=>setMode("safety-signs")}>Safety &amp; Warning Signs</button>`);
}
if (source !== original) {
  writeFileSync(path, source);
  console.log('Safety & Warning Signs menu integration repaired.');
} else {
  console.log('Safety & Warning Signs menu integration already present.');
}
