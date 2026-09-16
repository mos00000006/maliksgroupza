POWERBUILD / MALIKS GROUP HUB
FIX: MISSING canApproveTasks EXPORT

GitHub build error fixed:
[MISSING_EXPORT] "canApproveTasks" is not exported by "app/api/access.ts"

Replace only:
  app/api/access.ts

The restored approval permission matches the existing approval workflow:
- Owner / Admin
- Developer / Technical Admin
- Executive / EXCO with Full company access

Human Resource (HR) remains excluded from task approvals and remains Employee-Records-only.

No migration and no secret changes are required.
