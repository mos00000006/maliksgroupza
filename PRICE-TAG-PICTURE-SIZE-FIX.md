# PowerBuild price tag: large pictures and upload fix

The screenshot error, `Unexpected token 'P', "Payload Too Large" is not valid JSON`, comes from an oversized picture upload receiving a plain-text HTTP 413 response. It is separate from the D1 daily database allowance. Upgrading Workers Paid does not fix this application upload limit by itself.

## Changes

- Automatically resize generated and uploaded product PNGs to a maximum 600 KiB before sending. Alpha transparency and aspect ratio are retained; dimensions are reduced as necessary instead of converting to JPG or adding a white background.
- If a picture upload receives HTTP 413, retry once with a 300 KiB PNG.
- Parse API responses safely. Plain-text 413 and HTML error pages produce readable messages instead of JSON syntax errors. Useful JSON error messages, including daily-limit messages, remain intact.
- Keep product images inside an explicit, clipped image viewport with width/height constraints and `object-fit: contain`. Tall and wide pictures scale down above the product name; they cannot draw over the wording, price or QR area. This applies to the screen preview, print and JPG export.
- Accept source PNG uploads up to 30 MB, then resize them before upload. Generated cutouts use the same size control.

## Install

Extract into the existing Hub project, merging the `app` and `tests` folders and replacing the included files. This is a small fix patch, not a complete project. Deploy through the usual GitHub workflow, or run `npm run deploy` from the configured project. This patch itself requires no new database migration or package dependency.

Refresh the generator after deployment. Find the product again and generate the tag to use its newly resized picture. Already downloaded JPGs and previously printed tags must be regenerated to show layout changes.

Existing automatic background removal and JPG download remain available. Detailed source pictures may have reduced pixel dimensions to fit the upload budget. This update does not change your Cloudflare billing, staff accounts, product prices or database allowances.

## Validation

Production build and existing 15 tests passed. Two additional API-response tests cover plain-text/empty 413 failures, HTML failures and useful JSON errors. Browser verification covers large transparent PNG resizing, a successful retry after a simulated 413 response, picture bounds for tall/wide/mobile layouts and JPG download. No live deployment was performed here.
