POWERBUILD STORE MANAGER — GITHUB LINT FIX

This patch fixes the react-hooks/set-state-in-effect error at app/ecommerce-store-manager.tsx:15.

INSTALL
1. Replace only app/ecommerce-store-manager.tsx in your repository with the file in this ZIP.
2. Commit/push and run npm run check in GitHub Actions.

CHANGE
- Loads branch data asynchronously from the existing endpoint in the effect.
- Prevents state updates after the component unmounts.
- Handles failed requests.
- Preserves branch editing and save behaviour.

This ZIP does not remove the public storefront or any View Website button. If your intention is to remove the website entirely, the current deployed source needs a separate removal change.

Validation: original source matched the ZIP used in this conversation, and replacement was checked mechanically. Full npm check not run locally due to lack of installed dependencies.
