# Norvim Tray — integration fixes

## What changed
- Fixed the homepage Available Jobs section so job cards render inside `#jobsGrid` instead of replacing the entire `#jobs` section and deleting its heading.
- Connected visible dashboard shortcuts to Employer–Worker Messages and Reviews & Ratings.
- Added booking-specific message links. Opening one attempts to create/open the authorized marketplace conversation for that booking.
- Added review links to completed marketplace bookings and pre-fills the booking ID on the review form.
- Added the current user's rating/review summary to the applicant profile. The worker profile already renders review summaries.
- Improved marketplace empty-state guidance and made the marketplace request search prefer the current browser location supplied by the page when available, falling back to the saved worker-profile coordinates. The worker must still have an active, available profile and selected services; own posts are not shown as requestable jobs.
- Added an admin-only action on Applicant Account Management to send verification reminder emails to all unverified applicant and employer accounts. It requires an explicit confirmation, reports success/failure counts, and uses the configured Resend email sender.

## Configuration and deployment
- Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (an address on a verified Resend domain), and optionally `RESEND_FROM_NAME` and `APP_BASE_URL` in the deployment environment.
- Deploy the updated source to Render and restart the service. The reminder button sends real emails only when an administrator clicks it; this build does not automatically email users during deployment.
- Messaging and reviews require MongoDB connectivity, verified/active user sessions, and a completed marketplace booking for review eligibility.
- Nearby marketplace requests still require the signed-in worker to have an active profile, location sharing enabled, availability set to Available, and at least one selected service. A user's own request is intentionally excluded from the requestable feed.

## Checks
- `node --check server.js` passed.
- `node --check` passed for all files in `public/js/`.
- The newly added applicant-profile inline JavaScript passed `node --check`.
- ZIP integrity was checked after packaging.
- Live database, real email delivery, browser interaction, and Render deployment could not be exercised in this local environment.
