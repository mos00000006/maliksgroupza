POWERBUILD / MALIKS GROUP HUB
STORE SPECIALS & PROMOTIONS V1

WHAT THIS ADDS
--------------
New sidebar section:
  Store Specials

Promotion setup:
- Promotion/special name
- Description / store instructions
- Start date
- End date
- Select specific branches
- Full-company users can choose "All branches"
- Upload multiple promotion pictures/pages
- Existing promotion pictures can be removed
- More pictures can be added later
- Specials can be edited or removed

SLIDESHOW
---------
Each special automatically displays its uploaded pictures as a slideshow.
- Auto changes every 5 seconds
- Previous / Next controls
- Slide dots
- Slide number indicator
- Mobile friendly

STORE VISIBILITY
----------------
- Full-company Owner/Admin, Developer/Admin and EXCO can see all specials.
- Regional / Store users see only specials for branches they are authorised to access.
- Human Resource (HR) remains isolated to Employee Records only and cannot see Store Specials.

NOTIFICATIONS
-------------
1. When a FUTURE special is created:
   Relevant branch users + full-company users receive:
     "Upcoming special: <name>"
   including the selected branch(es) and date range.

2. When the start date arrives:
   The Hub automatically sends:
     "Special started: <name>"
   to the same relevant users.

3. Notifications appear in:
   - Hub Inbox
   - normal Hub popup
   - Web Push / iPhone Home Screen notification when enabled
   - app badge/unread count

4. Clicking the notification opens Store Specials.

BACKGROUND START-DATE CHECK
---------------------------
A Cloudflare Cron Trigger checks every hour, so the "special has started"
notification does not depend on somebody having the Hub open.

The normal /api/notifications polling also performs the lifecycle check as a
backup.

FILES TO ADD / REPLACE
----------------------
ADD:
  app/store-specials.tsx
  app/api/store-specials/shared.ts
  app/api/store-specials/route.ts
  app/api/store-specials/images/[id]/route.ts

REPLACE:
  app/page.tsx
  app/api/notifications/route.ts
  worker/index.ts
  vite.config.ts
  infrastructure/wrangler.jsonc

DATABASE / STORAGE
------------------
No manual migration is required.
The module creates its own D1 tables on first use:
- store_specials
- store_special_images

Promotion pictures use the existing R2 binding:
  maliks-group-hub-files

No new GitHub secret is required.

AFTER DEPLOYMENT
----------------
Open Store Specials and create the first promotion:
1. Enter the promotion name.
2. Choose the start and end dates.
3. Select All branches or individual branches.
4. Upload the promotion artwork/images.
5. Click Create & notify stores.

The Hub will immediately send the upcoming-special notification for a future
promotion and will send the started notification when the start date arrives.
