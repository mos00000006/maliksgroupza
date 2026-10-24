COMPANY HUB — STAFF TRAINING LAYOUT FIX

Apply after the previous Staff Training Style Update. Replace the two included app/training files in Company Hub, deploy, then refresh or close and reopen the installed Hub. No new migration, dependency or Sales App patch is needed.

Fixes the department panel appearing as a fixed sidebar on top of the logo and hero. The Hub has global aside styles, including mobile fixed-position rules. The department panel now uses its own class on a normal layout container and is excluded from those sidebar selectors. Quiz question navigation is also excluded from global navigation-button styles.

Existing questions, API permissions, scoring and saved results are unchanged.

Validation: production build passed. Browser flows passed with the compiled Hub global styles loaded, including both brands, practice, test submission, result history, draft resume and mobile width checks. The department panel was verified below the hero in the document flow. Lint reports no errors and one plain-image logo performance warning.
