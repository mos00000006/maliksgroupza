# MALIKS QUOTE — REAL POWERBUILD LOGO INSTALL ICON

## Fix
The mobile Maliks Quote Worker previously served a browser favicon only. Without an install manifest and declared Android/iPhone home-screen icons, browser installation may create a generic initial-letter "M" tile.

The updated Worker includes:
- The **real original PowerBuild logo**, kept intact, against your standard navy `#0A2A3F`.
- PWA install manifest at `/manifest.webmanifest`, app name **Maliks Quote**, standalone display mode.
- Standard PNG app icons at `/quote-icon-192.png` and `/quote-icon-512.png`.
- Android adaptive/maskable icon at `/quote-icon-maskable-512.png`.
- Apple touch icon at `/apple-touch-icon.png`, with iPhone home-screen metadata.
- Public icon endpoints for browser installation **without exposing sales/quotation data**.
- No modification to your QR codes, products, quotation saving, Sales linking or permissions.
- Icons are embedded in the Worker source; **no extra Cloudflare R2 bucket or asset binding is needed**.

## Add files to the EXISTING `maliksgroupza` repository
Extract this ZIP into the repository **root**, preserving these exact paths:
```
maliksgroupza/
  maliks-operations/
    src/
      mobile-quote-frontend.mjs        # replace existing Quote frontend
      quote-app-icons.mjs              # new: embedded original logo icons
      quote-app-manifest.mjs           # new: mobile install metadata
    tests/
      quote-app-install-icon.test.mjs  # new: tests
```
Do not create another nested `maliksgroupza` folder. Do not replace the main Hub `app/` files. If you have made other edits to `mobile-quote-frontend.mjs` after the previous Quote ZIP, compare the included `CHANGES.diff` and merge those edits rather than overwriting them blindly.

## Test
From `maliksgroupza/maliks-operations`, run:
```powershell
npm install
npm test
```

## Deploy
The new icon becomes available **only after the Maliks Quote Worker is deployed**. If your GitHub Actions deployment workflow already contains `npm run deploy:quote` after Sales, run that workflow after verifying Cloudflare credentials and Access protection. Alternatively, with existing secure Wrangler configuration:
```powershell
npm run config
npm run deploy:quote
```
`npm run config` requires the existing Cloudflare/Access/D1 environment variables set up for your project. It is unnecessary to redeploy Core or alter D1 for this icon-only patch.

Once the Worker is live, check:
- `https://maliks-quote.moyanamoses006.workers.dev/`
- `https://maliks-quote.moyanamoses006.workers.dev/manifest.webmanifest`
- `https://maliks-quote.moyanamoses006.workers.dev/quote-icon-512.png`

## Reinstall the shortcut to refresh the generic M icon
**Android (Chrome):** Remove/uninstall the old home-screen Maliks Quote shortcut, open the deployed site in Chrome and choose the browser menu > **Install app** or **Add to Home screen**. The icon should display the PowerBuild logo and the name "Maliks Quote".

**iPhone (Safari):** Remove the previous Maliks Quote home-screen icon, open the deployed site in Safari, then use Share > **Add to Home Screen**. iOS will use the PowerBuild Apple touch icon.

**PC:** If you had installed the app in Chrome/Edge, uninstall the old installed app and reinstall from the deployed site to pick up the new icon.

If the link still shows Cloudflare "There is nothing here yet", the Quote Worker has not been deployed to that hostname. Complete deployment before trying to install the app.

## Verification
This icon patch was tested against the reconstructed project based on the existing `maliksgroupza` files and the preceding POS/Quote patches. **208 automated tests passed, 0 failures.** This does not prove successful Cloudflare production deployment.
