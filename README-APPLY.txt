POWERBUILD OPENING SPLASH PATCH

Replace/add these files in the repository:
- app/layout.tsx
- app/launch-splash.tsx
- app/launch-splash.css
- public/manifest.webmanifest
- public/powerbuild-logo-transparent.png

Then commit and push.

This adds the animated PowerBuild opening screen after Cloudflare Access has authenticated the user.
Cloudflare Access itself runs before the app and must be branded separately in Zero Trust > Reusable components > Custom pages > Access login page.
