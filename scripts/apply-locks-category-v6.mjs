import fs from 'node:fs';
import path from 'node:path';

const files = [
  {path:'app/catalogue.tsx', apply:(s)=>{
    if (s.includes('  "Locks",')) return s;
    if (!s.includes('  "Locksets",')) throw new Error('Locksets category not found in app/catalogue.tsx');
    return s.replace('  "Locksets",', '  "Locks",\n  "Locksets",');
  }},
  {path:'app/catalogue-pdf.ts', apply:(s)=>{
    if (s.includes('  "Locks",')) return s;
    if (!s.includes('  "Locksets",')) throw new Error('Locksets category not found in app/catalogue-pdf.ts');
    return s.replace('  "Locksets",', '  "Locks",\n  "Locksets",');
  }},
  {path:'app/catalogue-pdf-grouping.ts', apply:(s)=>{
    if (s.includes('return "Locks";')) return s;
    const old='if (has(name, /\\b(?:LOCKSETS?|MORTICE LOCK|CYLINDER LOCK|PADLOCKS?)\\b/)) return "Locksets";';
    const replacement='if (cat === "LOCKS" || has(name, /\\bPADLOCKS?\\b/)) return "Locks";\n  if (has(name, /\\b(?:LOCKSETS?|MORTICE LOCK|CYLINDER LOCK)\\b/)) return "Locksets";';
    if (!s.includes(old)) throw new Error('Expected padlock grouping rule not found; merge manually');
    return s.replace(old,replacement);
  }},
];
const patches=[];
for (const spec of files) {
  const file=path.resolve(spec.path);
  if (!fs.existsSync(file)) throw new Error(`Missing ${spec.path}; run from Hub repository root`);
  const before=fs.readFileSync(file,'utf8');
  const after=spec.apply(before);
  patches.push({file,before,after,changed:before!==after});
}
for (const patch of patches) if (patch.changed) fs.writeFileSync(patch.file,patch.after,'utf8');
console.log('Locks category patch applied:',patches.map(p=>`${p.file}: ${p.changed?'updated':'already current'}`).join('\n'));
