MALIKS GROUP HUB — Fix GitHub npm run check (3 errors in new-files/app/tills)
===================================================================================

This ZIP is only for the exact GitHub error you pasted on 5 November 2026.
It contains the two corrected TSX files at these *exact* paths:

  new-files/app/tills/page.tsx
  new-files/app/tills/till-checkout.tsx

INSTALL WITHOUT TERMINAL OR GIT:
1. Extract this patch ZIP to a separate folder.
2. Open your GitHub-connected "maliksgroupza" folder in Windows File Explorer.
   It must be the folder that contains package.json.
3. From this extracted patch, copy ONLY the "new-files" folder.
4. Paste it into the root "maliksgroupza" folder. Choose Merge / Replace
   destination files when Windows asks. This replaces ONLY the two TSX files
   listed above; it does not replace other Hub code.
5. To update GitHub, either (a) commit/push from VS Code once Git is installed,
   OR (b) upload the two corrected files directly to the SAME paths in the
   GitHub repository using the GitHub website, and commit that change.
6. The GitHub workflow needs to run on the NEW commit. The old failed job
   cannot be repaired retroactively.

What changed:
- Replaced HTML anchor navigation to / with Next.js Link in two places.
- Replaced synchronous React state resetting in useEffect with a branch-change
  handler, cancelling stale price lookups when switching stores.
- Kept the demo-only POS, cashier role and full-access Hub switch behaviour.

VERIFY:
- On the next GitHub Actions run, the 3 prior lint errors from
  "new-files/app/tills" should no longer appear. The 101 previous warnings
  are separate and are not fatal with the configuration shown in your log.
- This is a *targeted source-file correction*, not a full build verification;
  other errors may appear when npm run test starts.

IMPORTANT:
The preferred long-term cleanup is to remove the entire obsolete new-files/
staging directory from the GitHub repository AFTER confirming the actual files
are installed under app/tills/. Merely copying this patch does not delete the
staging directory, and it does not publish to GitHub automatically.
Do NOT use this as a replacement for the complete Sales / Tills integration;
it fixes the three lint errors in the duplicated staging copies only.
Nothing here enables live payment, inventory or accounting transactions.
