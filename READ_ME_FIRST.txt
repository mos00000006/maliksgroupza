MALIKS RETAILOS | RESTORE THE APPROVED SALES / CHECKOUT STYLE (V5)
================================================================

This corrects the Full View V4 layout shown in the 11:05 screenshot:
- replaces the over-wide blank icon rail with the original labelled navy-and-gold menu
- prevents the menu from covering or clipping the title and product search
- keeps barcode/product entry on the LEFT and the larger order/payment panel on the RIGHT
- fixes widths at 1650px, 1280px and smaller desktop widths
- preserves quotation numbering and Cash Office handover
- does not enable any live tender, invoice, stock deduction or dispatch release

NO SCRIPT, NO TERMINAL, NO MIGRATION REQUIRED

1. Extract this zip outside your Hub repository.
2. Copy the 'app' folder from this zip into the root of your existing
   maliksgroupza project, beside package.json.
3. Choose Merge and Replace destination files when prompted.
4. Only these two files are replaced:
   app/tills/till-checkout.tsx
   app/tills/tills.module.css
5. Optionally copy the new 'tests' folder to add the V5 regression test.
6. Commit BOTH changed app/tills files to GitHub. Local paste alone does NOT
   update the deployed Hub; GitHub must have those changes committed and pushed.
7. Run npm run check (or wait for GitHub Actions) to verify your actual project.

VISUAL CHECK
The supplied PNG is a browser screenshot of a layout fixture using the
actual V5 CSS and representative checkout structure. It is not a screenshot
of your live Hub account or data.

IMPORTANT
- This overlay assumes you already installed the quotation / Cash Office patch.
- Do not copy any old 'new-files' folder into your project.
- Financial posting remains disabled on purpose until transactions are verified.
- If you have made newer custom edits to app/tills files, back them up before
  replacing; the package is based on the immediately preceding V4 version.

VALIDATION
- 9 source/regression tests passed against the V5 checkout and CSS.
- Headless browser checks measured layout at 1650/1280/1120/900/760 px;
  no horizontal page overflow. Desktop summary stayed to the right.
- The full Hub build/CI and live browser deployment have not been run here.
