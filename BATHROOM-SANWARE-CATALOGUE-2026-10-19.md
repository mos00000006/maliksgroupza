# Bathroom & Sanware Catalogue — 19 October 2026

Added a dedicated Bathroom & Sanware browsing section to **Our Catalogue**, using the retail category structure of the supplied Pulse Tiles bathroom page as a reference while keeping the PowerBuild styling and catalogue data model.

## Main bathroom departments
- Basins
- Toilets
- Showers
- Taps
- Baths
- Bathroom Furniture
- Bathroom Tiles

Each department includes quick product-type filters such as basin & pedestals, counter-top basins, close-couple toilets, shower screens, shower heads, bath screens, mirrors and bathroom mosaics.

## Catalogue management
The Add/Edit Product form now offers the seven PowerBuild bathroom categories in the category suggestions. E-commerce category lists automatically pick these up from the catalogue data.

## Existing stock cleanup
Migration `0025_catalogue_bathroom_sanware_categories.sql` moves obvious existing basin, shower, toilet/cistern, bath, bathroom tap, mirror and bathroom tile products out of generic Plumbing into the new bathroom categories.

No competitor branding, pricing or product images are copied into the PowerBuild catalogue by this update.
