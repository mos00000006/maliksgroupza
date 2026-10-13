# Catalogue category cleanup — 12 October 2026

The Company Hub catalogue and generated Wholesale Division PDF have been reorganised so products sit in the correct product-family category instead of broad mixed categories.

## Main corrections
- Removed the mixed **Building Materials** grouping from the known seeded catalogue items.
- Aerolite moved to **Insulation**.
- Air bricks moved to **Bricks & Blocks**.
- Angle iron moved to **Steel & Metal**.
- Nutec and ceiling boards moved to **Boards & Ceilings**.
- Roofing items are now grouped under **Roofing & Gutters**, with timber separated to **Timber** and membrane/waterproof products to **Waterproofing**.
- Locksets are separated from fasteners and ironmongery.
- Fasteners and ironmongery are separated into their own categories.
- Misclassified mugs, glass jug sets and laundry storage products moved to **Homeware**.
- Misclassified electrical conduit fittings and lamps moved to **Electrical & Lighting**.
- Acetone and shoe glue moved to **Adhesives & Chemicals**.
- The Wholesale Division PDF now uses a professional category order instead of simple alphabetical sorting.

## Result
The known catalogue now resolves into 21 clear categories:
Plumbing; Electrical & Lighting; Paints & Allied; Waterproofing; Roofing & Gutters; Timber; Boards & Ceilings; Insulation; Bricks & Blocks; Steel & Metal; Doors & Frames; Windows; Fencing; Locksets; Fasteners; Ironmongery; Tools; Garden; Homeware; General Hardware; Adhesives & Chemicals.

Database migration: `drizzle/0015_catalogue_category_cleanup.sql`
