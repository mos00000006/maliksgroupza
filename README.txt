EUROFIT CATALOGUE IMPORT — reviewed partial import

Source: https://www.eurocelt.co.za/wp-content/uploads/2016/04/EUROFIT-30-09.pdf
Products with explicit manufacturer codes: 47.
No invented SKU, prices or image URLs.

Files:
  drizzle/0049_eurofit_catalogue.sql
  docs/eurofit-products.csv

IMPORTANT: The supplied Eurofit PDF contains SV, UG and Polycop/Masterbatt entries. It lists additional pipes and dimensions WITHOUT individual stock codes, which have not been fabricated.

Apply the SQL to your Cloudflare D1 database (after backup) using your existing migration workflow. The migration inserts new codes and skips existing codes; it does NOT delete or replace unrelated products. Check existing-code overlaps manually before choosing to replace any SKU, because code-only matching is insufficient to identify duplicates.

Category is 'Plumbing', matching the existing Hub online filter. The product names contain distinct 'UG' and 'SV' descriptions for the leaflet/PDF grouping.

Images are intentionally left empty: the PDF has illustrations but no per-product image URLs suitable for catalogue image registration. The Hub image uploader can add them later.

Test: SQL validated against an in-memory SQLite catalogue schema. Importing twice does not duplicate records. Full Hub build and deployed D1 verification not performed.
