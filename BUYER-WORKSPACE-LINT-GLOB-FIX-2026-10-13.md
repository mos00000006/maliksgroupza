# Buyer Workspace lint glob fix — 13 October 2026

The CI exit-code-2 failure was caused by unquoted wildcard ignore patterns in the npm `lint` script being expanded by the shell into an explicit `github_ci_guard/app` argument. ESLint then rejected that explicitly supplied path because the same path is globally ignored.

## Fix
- Changed `npm run lint` to `eslint .`.
- Kept all generated/duplicate-folder exclusions in `eslint.config.mjs` using `globalIgnores`.
- Added `dist/**` to the global ignores.
- `github_ci_guard/**` and accidental `app/app/**` copies remain ignored without being passed through the shell.

No database migration is required.
