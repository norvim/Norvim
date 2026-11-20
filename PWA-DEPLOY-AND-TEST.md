# Norvim installable website (PWA)

This release keeps Norvim as the existing website and adds installability. It does not convert the project into a native Android APK and does not alter the existing notification settings or event logic.

## Deploy

1. Replace the project files in the existing GitHub repository with this release (keep the project root at the repository root; do not upload the `public` folder by itself).
2. Commit and push to the branch connected to the existing Render web service.
3. Confirm the Render deployment succeeds and that the custom domain still points to the service.
4. Do not change environment variables, MongoDB settings, payment keys, or push VAPID keys for this PWA release.

## Verify after deployment

Open these HTTPS URLs and confirm they return successfully:

- `/manifest.webmanifest` (valid JSON)
- `/sw.js` (JavaScript)
- `/offline.html`
- `/images/norvim-icon-192.png`
- `/images/norvim-icon-512.png`
- `/images/norvim-icon-maskable-512.png`

On Android Chrome:

1. Open `https://norvim.com` and allow the page to finish loading.
2. Use Chrome's menu > Install app (or Add to Home screen, depending on Chrome version).
3. Launch Norvim from the new home-screen icon.
4. Check login, applicant/employer dashboards, jobs, marketplace, messaging and payments.
5. With the app open, load a page once, switch on airplane mode, then navigate to another page to confirm the offline fallback appears. Restore internet afterwards.
6. Separately test background push only if the existing server-side VAPID configuration is already enabled. PWA installation alone does not configure push delivery.

On iPhone/iPad Safari: Share > Add to Home Screen. iOS installation behavior differs from Android Chrome.

## Important boundaries

- The service worker only provides an offline navigation fallback; it deliberately does not cache API responses, account pages, job data, or payment data.
- The existing Web Push event handler and notification click behavior are retained.
- Installation requires HTTPS (the production custom domain already uses HTTPS).
- A live deployment and real-device installation test must be completed in the hosting account. This workspace cannot publish to the user's Render/GitHub account.
