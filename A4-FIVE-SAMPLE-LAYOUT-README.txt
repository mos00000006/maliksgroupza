PRICE TAG STUDIO - A4 FIVE TAG SAMPLE LAYOUT UPDATE
====================================================

This update changes the Single Product Tag A4 picture export from 6 tags to 5 tags.

What changed
------------
1. The A4 sheet now holds a maximum of 5 tags per page.
2. The layout matches the supplied sample style:
   - 3 landscape tags on the left
   - 2 portrait / rotated tags on the right
3. A4 copy counts per saved tag are now limited to 5.
4. Download button text and sheet counters now show 5 tags instead of 6.
5. Output file names now use "Five-Product-Tags-A4".

Files included
--------------
- app/price-tags/price-tag-generator.tsx
- app/price-tags/price-tags.module.css
- app/lib/a4-single-tag-layout.ts
- tests/a4-single-tag-layout.test.mjs
- this README

How to apply
------------
Copy these files into the matching locations in your project, replacing the old versions.
Then redeploy the website.

Notes
-----
- This package is intended to replace the earlier 6-tag A4 single-tag update.
- Existing individual single-tag JPG downloads remain unchanged.
- Existing QR codes do not need to be changed.
- The updated automated test file is included, but in this environment the esbuild dependency was not installed, so the bundled test was not executed here.
