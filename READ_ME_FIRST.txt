# MALIKS GROUP HUB — Sales / Tills patch for your ORIGINAL ZIP

**Ready to copy. NO terminal, Git, Node script, or installer needed to apply these files.**

This patch was built from the exact **maliksgroupza(3).zip** you uploaded.
It contains FOUR original Hub files already updated for Sales / Tills, plus NINE new files.
The ZIP is a **folder overlay**, not a complete website or an automatic deployment.

## Install by copying files (Windows)

1. Extract your original `maliksgroupza(3).zip` into a fresh folder. Open the inside `maliksgroupza` folder (you should see `app`, `worker`, `tests`, `package.json`).
2. Download and extract **Maliks_Hub_ORIGINAL_ZIP_Direct_Paste_Sales_Tills_Patch.zip** into a *separate* folder.
3. Open the extracted patch folder. Select the `app`, `worker` and `tests` folders, then **Copy**.
4. Paste into the original `maliksgroupza` folder. When Windows asks, choose **Merge folders** and **Replace destination files**.
5. If an old install has created a separate `new-files` folder under the Hub project, **inspect it first**. Only remove the outdated staging copies at `new-files/app/tills`, `new-files/app/api/tills`, `new-files/app/lib/tills-route-policy.ts`, and `new-files/tests/tills-access.test.mjs` and `new-files/tests/tills-full-access.test.mjs`. Keep any unrelated files. If you are starting from the original ZIP, there is no `new-files` directory, so skip this step.
6. In VS Code, open the patched `maliksgroupza` folder and review the changed files. When you are ready to validate or deploy, you will still need a functioning development environment or GitHub workflow. **Copying files on your PC does not update the online GitHub repo.**

## What you will get

- Admin may assign the existing `Sales / Tills` role to one active Store branch.
- Cashier is redirected to `/tills` and cannot use unrelated private Hub screens or APIs.
- Owner/admin and technical admin retain Hub access and can open Sales / Tills and go back.
- Executive/EXCO with Full company scope can switch to Sales / Tills; store/regional managers can use authorised stores.
- Read-only search of published branch price tags; VAT-inclusive demo basket and cash change preview only.
- No real sale submission, payment acceptance, receipt printing or stock/accounting updates.

## Important safety — avoid overwriting newer Hub changes

The four modified files (`app/page.tsx`, `app/api/access.ts`, `app/api/team/route.ts`, `worker/index.ts`) are exact patched copies from **your uploaded original ZIP**. They are NOT safe to paste over a newer, independently updated Hub without comparing changes first. If your current GitHub-connected folder has newer catalogue, product, prices or permission changes, **do not overwrite those four files**. Use this patch with a fresh extraction of your original ZIP or request a merge against your latest repo snapshot.

## Verification

- Applied the source Git patch successfully against the four original files in the uploaded ZIP.
- Ran 10 targeted Sales / Tills permission and UI contract tests.
- Verified none of the original `new-files/` staging paths is included in this patch.
- Full Hub build and live Cloudflare deployment have NOT been run here.
