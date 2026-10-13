# View Leaflet arrow controls fix — 13 October 2026

The left and right arrow buttons in View Leaflet now work independently from the hand-drag/swipe gesture.

Changes:
- Clicking/tapping `<` moves to the previous leaflet page/spread.
- Clicking/tapping `>` moves to the next leaflet page/spread.
- Pressing an arrow no longer starts the drag/swipe handler behind the button.
- Hand-controlled page turning remains unchanged on the leaflet itself.
- Keyboard left/right navigation remains available.

No database migration is required.
