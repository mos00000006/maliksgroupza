# PowerBuild logo patch — Maliks Department Applications

**Purpose:** Replace the blue-box diamond (and other text-symbol placeholders) with your uploaded transparent PowerBuild logo on POS, Tills, Cash Office and Dispatch, including the browser-tab favicon. Does not modify the management Hub, database, API, user roles or Cloudflare Access.

## Files to replace/add in your existing GitHub repository

1. **Replace** `maliks-operations/src/frontend.mjs` with the attached `maliks-operations/src/frontend.mjs`.
2. **Add** `maliks-operations/src/powerbuild-logo.mjs` from this patch beside it. It embeds an optimized transparent logo, so there is no need for a separate public asset upload or deployment configuration change.
3. **Add** `maliks-operations/tests/branding.test.mjs` (recommended). It checks all four app pages and their PNG endpoints.

`powerbuild-logo.png` in this ZIP is just a preview/reference; the Worker uses the embedded copy and **does not need** a `public/` folder.

### Apply using GitHub in a browser

Open the existing GitHub repository at `maliks-operations/src` and edit `frontend.mjs` (pencil icon): replace the full contents with the version from this ZIP; commit. Then use **Add file → Upload files** in the `src` folder to add `powerbuild-logo.mjs`; commit. Add the test under `maliks-operations/tests`, if desired. **Do not deploy between the frontend and logo-file commits**: the frontend import needs the new file, otherwise the bundle fails.

Safer alternative: edit/upload on a new GitHub branch, verify the files, then merge to main and deploy once.

Go to **Actions → Deploy Maliks Department Applications → Run workflow**, select `main`, tick the *worker-name confirmation*, and run. The workflow runs tests and deploys the 5 Workers. Since both new files live only in `maliks-operations`, the management Hub code is untouched, though the existing Hub may have a separate automatic workflow triggered by commits to main.

### Verify after deployment

- Visit `https://maliks-pos.moyanamoses006.workers.dev/` and check the PowerBuild logo in the dark-blue left sidebar.
- Visit the Tills, Cash Office and Dispatch URLs and verify each logo.
- Check `https://maliks-pos.moyanamoses006.workers.dev/powerbuild-logo.png` after Cloudflare Access login; it should show the logo image.

Do not modify secrets, database bindings, the main Hub, or the Access applications for this branding patch. No live payments or stock posting are introduced.
