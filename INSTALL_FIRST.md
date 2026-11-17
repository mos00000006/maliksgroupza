# Maliks Quote — missing `__name` browser helper (November 2026)

## Confirmed root cause
The real browser script copied from `/quote-app.js` contains 38 references to
`__name(...)` without a definition. Cloudflare Wrangler/esbuild injects these
helper calls while bundling the Worker. However, the frontend is delivered by
`mobileQuoteBrowser.toString()`, which loses the helper defined outside the
serialized function. The first DOM initialization triggers `ReferenceError:
__name is not defined`, leaving the static login page on its loading message.

## Installation
1. Unzip at the root of `mos00000006/maliksgroupza`, keeping folder paths.
2. Commit/push the **two** files under `maliks-operations/`.
3. Run GitHub Actions > Deploy Maliks Department Applications on `main`.
4. Confirm tests, central Core, and Maliks Quote deployments are green.
5. Close the **installed** Quote window and open the URL in a normal Chrome
   tab first: https://maliks-quote.moyanamoses006.workers.dev/
6. Press Ctrl+Shift+R once. If successful, reinstall/update the installed app.

## Scope
- Changes just the JS output builder in `src/mobile-quote-frontend.mjs`.
- New regression test `tests/phase27-quote-browser-name-helper.test.mjs`.
- Does **not** modify Cloudflare Access settings, audience tags, passwords,
  database, branch permissions, other apps, or user sessions.

The `__name` shim changes function-display names only; it does not bypass
security. Do not put any Cloudflare token, user password, or API key in code.
