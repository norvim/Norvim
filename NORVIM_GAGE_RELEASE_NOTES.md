# Norvim Gage — Suspension Control Repair

## What changed
- Added one authenticated server endpoint for suspension/reactivation of applicants, employers, and marketplace worker profiles: `PUT /api/admin/accounts/:accountType/:id/suspension`.
- The unified endpoint validates account type, MongoDB ID, and suspension reason; writes the correct status fields for each model; closes pending appeals on reactivation; and treats notification/activity failures as non-fatal after the status has been saved.
- Updated all three admin interfaces to use the unified endpoint.
- Added an explicit admin-session check to applicant/employer moderation and disabled caching for moderation API fetches.
- Bumped the moderation JavaScript query versions to force browsers/service workers to request the corrected scripts.

## Verification performed
- `node --check server.js` passed.
- `node --check public/js/admin-applicants.js` passed.
- `node --check public/js/admin-employers.js` passed.
- `node --check public/js/admin-marketplace.js` passed.
- ZIP integrity check passed.

## Important limitation
A live MongoDB/Render integration test was not possible in this workspace. After deployment, sign in again to refresh the admin token and test one applicant, one employer, and one worker profile. Confirm each status changes in the database and the account/profile is blocked or restored as expected. Do not rely on browser messages alone.
