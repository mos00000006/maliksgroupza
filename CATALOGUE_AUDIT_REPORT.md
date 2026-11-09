# Maliks Group Hub — Full Catalogue Source Audit
**Date:** 9 November 2026  
**Source reviewed:** the uploaded Hub source ZIP, plus catalogue patches numbered 0058–0066. This is a reconstruction from files, **not** a read of your live Cloudflare D1 database.

## Coverage
- 8,857 total catalogue records reconstructed from the available migrations.
- 3,143 active records before this patch, 3,141 after retiring two confirmed legacy duplicate SKUs. No product rows were deleted.
- 166 active Tommy Fix SKUs after correction; all 166 have an image reference in the reconstructed database.
- 26 padlock SKUs remain under **Locks**, separate from 25 genuine Locksets entries.
- All 746 active `static:` image references resolve to files found across the source ZIP and bundled patches (this is a file-existence check, not a visual correctness guarantee).

## Verified fixes included
1. **Catalogue category navigation:** hard-coded filter/edit options did not include active departments such as Locks, Tiles & Flooring, the six Bathroom departments, Hamiltons and Tork Craft. Added all 34 active categories and the plumbing-specific categories.
2. **PDF category logic:** the rule was sending any product with “PADLOCK” into **Locksets**. Padlocks now group under **Locks**, while mortice/cylinder sets stay under **Locksets**.
3. **UG and window blinds:** 41 explicitly labelled underground products move out of Plumbing; 67 actual window blinds move out of Homeware. Blind rivets and other fasteners remain in Fasteners.
4. **Incorrect text encoding:** repaired 85 supplier-import product names where dimensions appeared as `600Ã—1200` or where punctuation/accents were garbled. The PDF normalizes the multiplication sign to a printable `x`.
5. **Duplicate Nail-In Anchor identifiers:** legacy `TF-NA5035-15` and `TF-NA5050-5` have verified replacements `TF-NA535-15` and `TF-NA550-5`. The two old entries are set *inactive*; their IDs and history are preserved.
6. **Missing Nail-In Anchor photographs:** `TF-NA6060-50` and `TF-NA6060-100` receive the appropriate Tommy Fix tub pack illustration. This is a representative package photograph, not a size-specific manufacturer photo.
7. **Tommy Fix packaging:** includes the previous V6 brand-only sticker images/migration so codes remain on product cards instead of being printed on pouches and jars.
8. **Pagination:** API now clamps out-of-range pages before calculating the SQL offset, avoiding an empty last-page result after deletions/filter changes.

## Issues requiring data/image verification — NOT automatically changed
- **609 active products have no image reference.** These need real photographs or an approved replacement, not invented supplier imagery.
- **747 active products have a blank description** (407 Hamiltons, 340 Tork Craft). Names and codes remain; descriptions require authoritative specification details.
- **41 groups reuse the same displayed name across distinct codes.** Most may be legitimate product variants; review the codes and technical attributes before merging or deleting.
- **1,786 active products use external image URLs.** Their remote availability and relevance cannot be guaranteed by an offline source-code audit.
- T005 and T013–T015 are not in the verified T-series padlock import. They were **not invented**.
- Product prices, stock balances, supplier technical specifications and all external photos still require live/source confirmation.

## Verification performed
- Ran all source migrations and previous catalogue patch migrations 0058–0066 into a temporary SQLite database without SQL errors.
- Applied migration 0067 twice. The first pass changed exactly 197 intended records: 41 UG + 67 blinds + 85 encoding repairs + 2 old duplicates made inactive + 2 missing images linked. Second pass caused no further data changes (idempotent).
- Verified that product code, ID, description, creation attribution, and creation date are unchanged by the new migration; no stock/pricing tables are updated.
- Six targeted code regression tests passed with Node 22 in local test mode.
- Static image paths all resolved against available local ZIP assets. Cloudflare/R2 and third-party images were **not** accessed.

## Machine-readable review file
See `CATALOGUE_REVIEW_QUEUE.json` for every active product still missing a photo or description and the 41 repeated-name groups. This is an **inspection queue**; it deliberately does not make unverified changes.

## Installation
See `README_INSTALL.txt`. This patch contains the V6 packaging fixes plus the V7 category/text corrections. **It does not automatically deploy or connect to your live Hub.**
