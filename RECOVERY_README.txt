MALIKS GROUP HUB RECOVERY PATCH - AFTER ACCIDENTALLY UPLOADING MALIKSPOS
======================================================================

The 9 November 2026 GitHub error shows the `maliksgroupza` repository
uses the POS package.json (maliks-pos-standalone) while running 189 Hub tests.
This means the two projects were mixed.

IMPORTANT: The files in this recovery patch are reference copies taken
from your supplied maliksgroupza(4).zip snapshot. If your Hub files have
changed since that snapshot, PREFER to restore their latest good versions
from GitHub's own commit history instead of overwriting newer changes.

IN ORIGINAL GITHUB HUB REPOSITORY (maliksgroupza):
1. Check recent commits and identify the last working Hub deployment.
2. Restore these 5 possibly overwritten files from that good Hub commit:
   package.json
   .github/workflows/deploy.yml
   README.md
   public/manifest.webmanifest
   public/sw.js
   (package-lock.json should remain paired with Hub package.json.)
3. Remove POS-only files accidentally uploaded to Hub if present:
   MALIKSPOS_STANDALONE_REPOSITORY.txt
   START_HERE_GITHUB.txt
   wrangler.jsonc (root ONLY; do not touch infrastructure/wrangler.jsonc)
   src/worker.mjs, src/domain.mjs
   scripts/config-check.mjs, scripts/assert-separate-repo.mjs
   tests/domain.test.mjs
   public/index.html
   public/assets/app.js, public/assets/style.css, public/assets/icon.svg
   public/assets/icon-192.png, public/assets/icon-512.png
   docs/DEPLOYMENT_CHECKLIST.md, docs/TEST_RESULTS.txt, docs/TOUCH_CLASS_ROADMAP.md
   (only when these files are definitely from accidental POS upload).
4. IMPORTANT: The GitHub Hub's own deploy.yml must again be named
   "Deploy Maliks Group Hub" and package.json name "maliks-group-hub-independent".
5. Commit. Its Hub workflow will run npm ci, npm run check, build and deploy.
6. Create an entirely NEW repo (maliks-pos) for the separate POS ZIP.

Optional command-line method in a working local Git checkout:
  git log --oneline -- package.json .github/workflows/deploy.yml
  git restore --source=<LAST_GOOD_HUB_COMMIT> -- package.json package-lock.json .github/workflows/deploy.yml public/manifest.webmanifest public/sw.js README.md
  git add -A
  git commit -m "Restore Maliks Hub after standalone POS upload"
  git push

No Cloudflare migrations or remote changes are required for this recovery.
Do not delete your database, product catalogue, or Hub deployment.
