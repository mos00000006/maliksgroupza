# Kitchen catalogue update — 20 October 2026

Adds the Pulse Tiles kitchen range to the existing **Our Catalogue** list.

- Checked all pages of Kitchen Sinks, Kitchen Sink Taps, Kitchen Sink Fittings, Kitchen Floor Tiles, Kitchen Wall Tiles and Kitchen Mosaics.
- 287 unique source products verified, with source product codes and product images.
- Against the catalogue supplied in this ZIP: 25 new products; 262 already present by code or name.
- New products use the existing Kitchens category and normal catalogue search/pagination.
- Existing products, pictures, descriptions and selling prices are preserved.
- New e-commerce settings are disabled with zero prices until you set prices and enable the channels.
- Images use the existing Hub external-image proxy and depend on the source images remaining available.

## Apply to your existing project

Copy this project into your working project, keeping your existing local credentials and Git repository.
From the project folder run:

```powershell
npm run db:migrate:production
```

The new migration is `drizzle/0027_pulse_kitchens_catalogue_import.sql`. Applying the migration is what adds the records to your hosted D1 catalogue. No front-end deployment is required for this data-only change.

Then refresh **Our Catalogue**, select **Kitchens**, or search by product code/name.

If your live catalogue starts at 1,845 and none of these 25 new records have since been added manually, the total will be 1,870. Your live database may have extra products absent from this ZIP, so its actual increase may be smaller. This package has not been applied to your live database.

## Validation

Executed the existing catalogue import migrations and this migration in SQLite. Verified the 25-record increase, source code uniqueness, safe repeated application, matching-name duplicate protection, preservation of a manual record, and disabled/zero-price channel settings for new records.

Source snapshot: `docs/pulse-kitchens-snapshot-2026-10-20.json`.

The source package’s Git history is excluded from this delivery; keep your existing `.git` directory.
