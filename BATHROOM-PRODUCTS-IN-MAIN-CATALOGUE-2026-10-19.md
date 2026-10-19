# Bathroom products in the main catalogue — 19 October 2026

Correction to the earlier bathroom update.

The bathroom range is **not a separate catalogue section**. The Pulse bathroom/sanware snapshot is imported as normal rows in the existing `catalogue_products` table, so the products are counted in the same **Products in catalogue** total and appear in the same paginated product list as all other PowerBuild products.

- 656 bathroom/sanware products imported.
- Categories: Basins, Toilets, Showers, Taps, Baths and Bathroom Furniture.
- Product codes, names, descriptions and product images are included.
- No retail/wholesale selling prices are imported into the catalogue. E-commerce prices remain controlled by authorised Full company users.
- E-commerce product-control rows are created with price `0` so the same products can be priced later in E-Commerce Control.
- Existing product codes are preserved with `INSERT OR IGNORE`; duplicates are not created.

Migration: `0026_pulse_bathroom_catalogue_import.sql`.
