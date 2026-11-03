// Run from the repository root: node scripts/install-safety-signs.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'app/price-tags/price-tag-generator.tsx';
let source = readFileSync(file, 'utf8');
if (source.includes('import SafetyWarningSigns from "./safety-warning-signs";')) { console.log('Safety signs already installed.'); process.exit(0); }
const importAnchor = 'import StoreSignage from "./store-signage";';
if (!source.includes(importAnchor)) throw Error('Cannot identify the current Price Tag Studio import anchor. No changes made.');
const modeAnchor = /const \[mode,setMode\]=useState<([^>]+)>\("single"\)/;
if (!modeAnchor.test(source)) throw Error('Studio mode shape differs. No changes made.');
const dispatchAnchor = 'if (brand && mode === "signage") return <StoreSignage brand={brand} onBack={()=>setMode("single")} />;';
if (!source.includes(dispatchAnchor)) throw Error('Store signage dispatch differs. No changes made.');
const buttonAnchor = /<button type="button" onClick=\{\(\)=>setMode\("signage"\)\}>Store signage<\/button>/;
if (!buttonAnchor.test(source)) throw Error('Store signage button differs. No changes made.');
source = source.replace(importAnchor, importAnchor+'\nimport SafetyWarningSigns from "./safety-warning-signs";');
source = source.replace(modeAnchor, (_, types) => `const [mode,setMode]=useState<${types}|"safety-signs">("single")`);
source = source.replace(dispatchAnchor, dispatchAnchor+'\n  if (brand && mode === "safety-signs") return <SafetyWarningSigns brand={brand} onBack={()=>setMode("single")} />;');
source = source.replace(buttonAnchor, match => match+'<button type="button" onClick={()=>setMode("safety-signs")}>Safety &amp; Warning Signs</button>');
writeFileSync(file, source);
console.log('Safety & Warning Signs added to Price Tag Studio without removing existing tools.');
