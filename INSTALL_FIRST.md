# Maliks Quote — External Script Startup Fix (17 November 2026)

## Why this patch
Maliks Quote `/api/session` already returned a successful account and branch list, but the installed app remained on its initial "Checking your Cloudflare Access session…" text. The previous page bootstrapped all interactivity using an HTML-inline script. This patch moves the same browser code to a same-origin `/quote-app.js` route to avoid inline execution restrictions, and adds a 15-second connection deadline with a visible error. It does not change the Core API, Cloudflare AUD, database, Member Team passwords, employee grants, or accounting modules.

## Installation
1. Unzip into the root of your existing `maliksgroupza` GitHub repository. Merge the `maliks-operations` folder and replace the matching files.
2. Verify the following files change:
   - `maliks-operations/src/mobile-quote-frontend.mjs`
   - `maliks-operations/tests/mobile-quote-integration.test.mjs`
   - `maliks-operations/tests/phase23-member-app-logins.test.mjs`
   - `maliks-operations/tests/phase25-quote-access-resume.test.mjs`
   - `maliks-operations/tests/phase26-quote-external-startup.test.mjs` (new)
3. Commit and push to GitHub `main`.
4. In GitHub Actions, manually run `Deploy Maliks Department Applications` and check the confirmation checkbox. Its workflow runs `npm test` before deployments. Confirm all steps pass, particularly `Deploy central API` and `Deploy Maliks Quote`.
5. Open `https://maliks-quote.moyanamoses006.workers.dev/` in a normal Chrome tab (not the old installed app shortcut) first. If that works, reinstall/reopen the standalone app as needed.

## What to expect
- The page loads its startup code as `/quote-app.js` instead of embedding an inline executable script.
- A valid `/api/session` response opens the Build a Customer Quotation workspace without entering a second password.
- An unauthenticated response displays a clear error, leaving the employee sign-in alternative available.
- If the session request stalls, a 15-second deadline displays a retry message rather than leaving the page on "Checking…".
- If the script does not run at all, the static page tells you the app script was not loaded, helping distinguish a browser issue from an Access login issue.

## Tests
Local `npm test`: 226 passed, 0 failed (includes new regression tests for script route and CSP).
Browser execution test: Quote workspace shown with mocked valid session; login error shown with mocked 401; no browser JavaScript errors. These checks do not prove that your live Cloudflare browser session works until after deployment.
