MALIKS GROUP HUB - DISPLAY SIZE CI BLOCKER REPAIR

Problem: npm run check fails ESLint react-hooks/immutability at app/hub-display-size.tsx:48 because the old changeSize() event handler directly sets document.documentElement.style.zoom.

FIX (DO THIS BEFORE APPLYING OTHER PATCHES)
1. In GitHub, open app/hub-display-size.tsx.
2. Replace ALL its contents with app/hub-display-size.tsx supplied in this ZIP. Do not simply upload the ZIP or add it as a second file.
3. Add tests/hub-display-size-regression.test.mjs (optional but recommended).
4. Commit the changes to the SAME BRANCH used by GitHub Actions and Cloudflare.
5. Check that the changeSize() function contains setLevel(next) and localStorage.setItem but NO document.documentElement.style.zoom line.
6. Re-run npm run check, then deploy after it passes.

The existing 56 warnings are not the cause of this specific failure. This patch does not alter the product database, catalogue classifications, PDFs, pricing or images.

Important: The test and patch were checked locally for structure; the full repository build and CI suite cannot be confirmed without the latest complete GitHub source.
