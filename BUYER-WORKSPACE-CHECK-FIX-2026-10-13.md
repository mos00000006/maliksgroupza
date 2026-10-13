# Buyer Workspace CI check fix — 13 October 2026

Fixed the two `react-hooks/set-state-in-effect` errors reported by GitHub Actions.

## Changes
- Buyer Workspace initial load is deferred to a timer callback instead of synchronously triggering state updates from the effect body.
- Restricted-user navigation correction is deferred to a timer callback instead of synchronously calling `setActive` in the effect body.
- ESLint ignores accidental backup/source copies under `app/app/**` and `github_ci_guard/**`.
- `package.json` lint script includes the same ignore patterns so GitHub Actions uses them even if those old folders remain in the repository.
- Includes the current catalogue files so the older unused `drawImageCover` copy is overwritten if the patch is applied completely.

No database migration is required for this fix.
