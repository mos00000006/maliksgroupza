# Leaflet npm check error fix — 13 October 2026

This update fixes the two ESLint errors reported by GitHub Actions in `app/catalogue.tsx`.

## Fixed
- `closeWholesaleLeaflet` is now declared before the keyboard `useEffect` that calls it.
- `moveLeaflet` is now declared before the keyboard `useEffect` that calls it.
- Both functions remain stable via `useCallback` and are included in the effect dependency list.
- `load` is now a stable `useCallback`, and the search effect includes `load` in its dependency list.
- Removed the unused `drawImageCover` helper from `app/catalogue-pdf.ts`.
- Removed the accidental duplicate `app/app/store-specials.tsx` file from the full package.
- Added local ESLint suppressions for dynamic catalogue / leaflet `<img>` elements where `next/image` is not appropriate.

## Critical ordering in corrected `app/catalogue.tsx`
1. `load` callback
2. `moveLeaflet` callback
3. `closeWholesaleLeaflet` callback
4. keyboard `useEffect`

This specifically prevents the `react-hooks/immutability` errors shown in the GitHub log.

## Validation
- `app/catalogue.tsx` passed TypeScript syntax transpilation.
- `app/catalogue-pdf.ts` passed TypeScript syntax transpilation.

Note: the project package bundled here does not contain executable npm `.bin` links in this environment, so the full `npm run check` command was not re-executed here. The reported ESLint error conditions were removed directly in source.
