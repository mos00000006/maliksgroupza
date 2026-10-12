# Mobile catalogue pagination fix — 12 October 2026

Fixed the catalogue pager on phones so users can always reach the Previous and Next controls.

## What changed
- Previous and Next arrows are now permanently visible at the left and right edges on mobile.
- Page-number buttons scroll only in the centre section instead of moving the whole pager off-screen.
- Increased touch-target size and spacing for iPhone / Android use.
- Added safe-area padding for phones with notches and Home indicators.
- Preserved numbered page navigation.

## File updated
- `app/mobile-improvements.css`
