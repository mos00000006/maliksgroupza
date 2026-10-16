# eCommerce Link Lint Fix — 16 October 2026

Fixed the two ESLint errors in `app/ecommerce-storefront.tsx` caused by using plain `<a>` elements for internal Next.js navigation.

## Changes
- Added `Link` from `next/link`.
- Converted the Company Hub navigation link to `<Link>`.
- Converted the Retail Shop and Wholesale B2B internal navigation links to `<Link>`.
- Converted the footer Company Hub link to `<Link>`.
- External WhatsApp and email links remain normal `<a>` links.

No database migration is required.
