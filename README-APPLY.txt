MALIKS / POWERBUILD HUB — NAVIGATION + CATALOGUE + RESPONSIVENESS PATCH

Replace/add these files in the GitHub repository using the same paths:

app/page.tsx
app/workspaces-modal.tsx
app/globals.css
app/mobile-improvements.css
app/catalogue.tsx
app/api/catalogue/route.ts
app/api/catalogue/shared.ts
app/api/catalogue/[id]/route.ts
app/api/catalogue/[id]/image/route.ts

WHAT THIS PATCH DOES
1. Keeps the current Hub section instead of dropping back to Executive Overview after actions.
2. A task opened from a Company Workspace returns to that same workspace after closing/deleting.
3. The X inside an opened company workspace returns to the Company Workspaces list instead of Executive Overview.
4. The selected navigation section is remembered in the browser.
5. Task create buttons respond on the first click and disable while saving to prevent repeat submissions.
6. Duplicate in-Hub task popups are de-duplicated; locally-created task notifications are suppressed briefly from duplicate popup display while still remaining in Inbox.
7. Adds Our Catalogue directly below Reports in navigation.
8. Catalogue product data is stored in D1 and product images in the existing R2 BUCKET.
9. Catalogue pages show 12 products per page with Previous / Next pagination and search.
10. Catalogue add/edit/remove access is server-restricted to:
    - moyanamoses006@icloud.com (also accepts the literal moyanamoses006@icloud value)
    - msallikuti@gmail.com
    All other active Hub users can browse only.
11. Catalogue table is created safely with CREATE TABLE IF NOT EXISTS on first use. No new migration or GitHub secret is required.

NOTE
Product images: image/* only, maximum 8 MB each.
