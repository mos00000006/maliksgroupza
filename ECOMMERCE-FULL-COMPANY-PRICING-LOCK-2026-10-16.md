# E-Commerce Full Company Pricing Lock — 16 October 2026

E-commerce product pricing and product-channel settings are now restricted to users assigned **Full company** access.

## Enforcement
- Server-side API blocks `save_product` unless `access_scope === "Full company"`.
- Product editor returns a permission flag and becomes view-only for anyone without Full company access.
- B2C retail price, B2B wholesale price, MOQ, channel enable/disable, unit, stock status and featured controls are covered by the lock because they are saved together as online product settings.

No database migration is required.
