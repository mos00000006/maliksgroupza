# Catalogue mobile optimisation — 12 October 2026

The latest Company Hub catalogue updates have been optimised for phones and tablets.

## Mobile catalogue improvements
- Search, Wholesale PDF and Add Product controls stack cleanly on phones.
- Search and form inputs use mobile-safe font sizing to prevent unwanted iPhone zoom.
- Product cards switch to a single-column layout on smaller phones so images, product codes and descriptions are easier to read.
- Product images remain `contain` fitted so the full item is visible.
- Product-code badges wrap safely instead of being cut off.
- Edit / Remove and pagination controls use larger touch targets.
- Numbered pagination remains horizontally scrollable on narrow screens.
- Catalogue editor becomes a mobile bottom-sheet with sticky header/footer and safe-area support.
- PDF generation progress is readable on narrow screens.

## Mobile PDF generation
The Wholesale Division PDF keeps the same A4 print layout. On phones/tablets it renders at a slightly reduced internal scale to lower memory use while retaining high print quality. Desktop generation remains full 2480 x 3508 render resolution.

## Files updated
- `app/mobile-improvements.css`
- `app/catalogue-pdf.ts`
