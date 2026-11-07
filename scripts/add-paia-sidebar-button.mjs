// Adds a visible PAIA Manual button to the existing PowerBuild Hub sidebar.
// Safe on existing customised app/page.tsx: does not replace any other screen.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const file = resolve(projectRoot, 'app/page.tsx');
let original;
try {
  original = readFileSync(file, 'utf8');
} catch {
  console.error('Could not find app/page.tsx. Run this script from the maliksgroupza project folder.');
  process.exit(1);
}

const marker = 'PAIA_MANUAL_SIDEBAR_BUTTON_V4';
if (original.includes(marker)) {
  console.log('PAIA Manual sidebar button already installed. No changes needed.');
  process.exit(0);
}

const anchor = /^(\s*)\{sidebarNavigation\.map\(\(n\)\s*=>\s*\{/m;
const match = anchor.exec(original);
if (!match || !original.includes('setMobileNavOpen') || !original.includes('<nav>')) {
  console.error('Could not safely locate the existing Hub sidebar. No files were changed.');
  process.exit(1);
}
const indent = match[1];
const fragment = [
  `${indent}{/* ${marker}: Public PAIA document entry; retains other staff navigation. */}`,
  `${indent}<button`,
  `${indent}  type="button"`,
  `${indent}  aria-label="Open PAIA Manual"`,
  `${indent}  onClick={() => {`,
  `${indent}    setMobileNavOpen(false);`,
  `${indent}    window.location.assign('/paia');`,
  `${indent}  }}`,
  `${indent}>`,
  `${indent}  <i className="sidebarNavIcon">`,
  `${indent}    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">`,
  `${indent}      <path d="M6 3h9l4 4v14H6z" />`,
  `${indent}      <path d="M15 3v5h4M9 12h7M9 16h7" />`,
  `${indent}    </svg>`,
  `${indent}  </i>`,
  `${indent}  PAIA Manual`,
  `${indent}</button>`,
  '',
].join('\n');

const updated = original.slice(0, match.index) + fragment + original.slice(match.index);
// The original file is preserved byte-for-byte except for the inserted button.
writeFileSync(file, updated, 'utf8');
console.log('Installed: PowerBuild Hub sidebar > PAIA Manual (opens /paia).');
console.log('Only app/page.tsx was changed. Commit and deploy as usual.');
