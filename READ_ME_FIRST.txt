MALIKS GROUP HUB — FIX FOR FAILED TEST #150
===========================================

This is a direct-paste update for the current Signature Professional Sales / Tills design.
It fixes the single remaining failed test:
  tests/tills-full-access.test.mjs
  "server checks role and scope; Hub has sidebar link and till provides return link"

WHY IT FAILS
The existing test checks for the exact JSX text:
  role!=="Sales / Tills"&&<Link href="/">Switch back to Hub</Link>
The latest design prepended a left arrow to the link label. The permission logic was not the cause.

FILES INCLUDED
  app/tills/till-checkout.tsx   — only replacement file

INSTALL (NO COMMANDS NEEDED TO COPY)
1. Extract this ZIP in Downloads, outside your Hub project.
2. In the current working maliksgroupza folder, copy the extracted app folder
   and merge with the existing app folder; replace only
   app/tills/till-checkout.tsx.
3. Check the Sales / Tills page still shows "Switch back to Hub" for full-access users.
4. Commit the changed file to GitHub using GitHub web file editor (or Git via VS Code
   once installed). Copying files on your PC alone does not update GitHub Actions.
5. The GitHub workflow can then run npm run check again.

SAFEGUARDS
- No worker, API, role model, catalogue, payment, stock or CSS files are changed.
- Transaction posting stays disabled pending RetailOS backend integration.
- Don't copy a new-files staging folder: none is included.

VERIFICATION
- The exact legacy test assertion and the new theme checks passed against this file.
- TypeScript TSX syntax parsed with no diagnostics.
- Complete remote GitHub workflow has not been rerun.
