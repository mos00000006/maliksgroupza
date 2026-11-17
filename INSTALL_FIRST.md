# Maliks Quote — iPhone & Android QR Camera Patch

## Why the camera previously did not work
Safari on iPhone lacks the native `BarcodeDetector` API. The old implementation refused to open the camera unless that API was present.

## What this patch does
- Retains native QR scanning where supported.
- Adds a jsQR 1.4.0 JavaScript fallback for iPhone Safari. It loads only when the user starts scanning, from pinned jsDelivr / unpkg HTTPS URLs.
- Requests the rear camera with `getUserMedia`, uses `playsinline`, and scans video frames locally at a controlled rate.
- Sends only the decoded QR token to the existing secured product lookup endpoint (not camera images).
- Stops the camera when a product is added or the user navigates away.
- Preserves quoting, authentication, branch selection, and Cloudflare configuration.

## Install
1. Extract the ZIP into the `mos00000006/maliksgroupza` repository root, preserving folders.
2. Replace `maliks-operations/src/mobile-quote-frontend.mjs`. Add `maliks-operations/tests/phase28-ios-qr-camera.test.mjs`.
3. Commit and push, then run the existing `Deploy Maliks Department Applications` GitHub Actions workflow.
4. On iPhone, open `https://maliks-quote.moyanamoses006.workers.dev/`, tap **Start camera scan**, and allow Camera permission. Aim at a Maliks price-card QR code.
5. The first camera scan requires internet access to download the pinned jsQR fallback once; browsers may cache it.

## Notes
- The QR decoder is pinned to 1.4.0 and the page's CSP allows only its two download origins plus the existing same-origin scripts.
- No new GitHub secrets, database migrations, or Zero Trust changes are needed.
- Camera video is not uploaded.
- If the phone blocks the decoder download, the app displays a clear message. The system's external Camera app scanning fallback remains available.
