# Norvim Complete Upgrade

This upgrade preserves the existing Express/Mongoose architecture and homepage login/registration flows.

## Implemented
- Added generalized notification records for applicant and employer recipients, notification inbox/read APIs, and notification history support. Existing applicant notification routes remain available for compatibility.
- Added role-checked job/marketplace conversation creation, message history, unread counts, read receipts, and new-message notifications. Job conversations require a linked application; marketplace conversations require the booking requester or assigned worker.
- Added mutual marketplace booking reviews with 1–5 star ratings, participant verification, completed-booking validation, unique review-per-booking-per-reviewer enforcement, and public profile rating summaries. Worker profiles now display ratings and review comments.
- Added a responsive, professional “For Companies & Employers” homepage section explaining the hiring process and linking to the existing employer registration and login pages. Existing registration/login sections and routes were preserved.

## Checks performed
- JavaScript syntax checks (`node --check`) for server, new models, and messaging client.
- Reviewed existing authentication roles, job/application and marketplace booking data models, existing notification and push integration, and homepage registration routes.

## Deployment / setup
1. Back up the production database and current deployment before release.
2. Deploy the full project and run `npm install` (or `npm ci`) in the project directory.
3. Ensure existing `.env` values remain set in the hosting provider: `MONGO_URI`, `JWT_SECRET`, and the existing service credentials. Do not upload a real `.env` or replace production credentials with `.env.example` values.
4. For browser/phone background push, configure valid `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` values in the hosting environment and serve the site over HTTPS. Browser push permission must be explicitly granted by the user; it cannot be silently enabled by a website. In-app notifications do not require this permission.
5. The app uses the existing MongoDB database. New collections (`conversations`, `messages`, `reviews`) are created by Mongoose as needed. The review unique index is enforced by MongoDB; check database index build status during deployment.
6. Messaging page: `/messages.html`. A conversation can only be opened using a valid job ID or marketplace booking ID and the authenticated participating account.

## Known limits / honest status
- This environment does not have production credentials or access to the live MongoDB/Render service, so live database integration, real push delivery, and end-to-end multi-account tests could not be performed here.
- Background Web Push remains dependent on the VAPID configuration and per-device browser permission. It is not claimed to be enabled until those are configured and tested on the deployed HTTPS site.
- Reviews currently cover completed labour-marketplace bookings, whose model has an explicit completed state. Standard vacancy applications do not currently have a verified completed-hire lifecycle in the existing schema, so they are not treated as reviewable jobs.
