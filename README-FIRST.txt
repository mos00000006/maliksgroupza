MALIKS GROUP HUB — ACTUAL SAFETY SIGNS INTEGRATION FIX

WHAT THE GITHUB LOG PROVED
The Safety Signs component exists and passes its module test. But the actual app/price-tags/price-tag-generator.tsx file is missing the SafetyWarningSigns import, mode, dispatch and menu button. The previous patch ZIP alone does NOT integrate the tool.

REQUIRED STEPS (from repository root, using terminal or GitHub Codespaces):
1. Copy this ZIP contents into the matching paths in your repo.
2. Run: node scripts/repair-safety-signs.mjs
3. Verify: git diff -- app/price-tags/price-tag-generator.tsx
   You MUST see the four changes listed below in the changed generator file.
4. Run: node --test tests/safety-warning-signs.test.mjs
5. Run: npm run check
6. Run: git add app/price-tags/price-tag-generator.tsx app/price-tags/safety-warning-signs.tsx app/price-tags/safety-warning-signs.module.css scripts/repair-safety-signs.mjs tests/safety-warning-signs.test.mjs
7. Run: git commit -m "Connect Safety Warning Signs to Price Tag Studio"
8. Push to your deployment branch.

IMPORTANT: Uploading just the script, test, or ZIP to GitHub does NOT execute the installer. The changed app/price-tags/price-tag-generator.tsx MUST be committed. If using GitHub's website editor and cannot run commands, apply these four changes manually in that file:
A. Add import SafetyWarningSigns from "./safety-warning-signs"; after import StoreSignage.
B. Add |"safety-signs" inside the mode useState string union.
C. Add: if (brand && mode === "safety-signs") return <SafetyWarningSigns brand={brand} onBack={()=>setMode("single")} />; alongside the other mode returns.
D. Add: <button type="button" onClick={()=>setMode("safety-signs")}>Safety &amp; Warning Signs</button> alongside the other tool menu buttons.

EXISTING OTHER TOOLS/PRICES/PRODUCTS: Not changed by installer.
No D1 migration needed. Compliance: pictograms are only draft examples; certify statutory signage separately.
