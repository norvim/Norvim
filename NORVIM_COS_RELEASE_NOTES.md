# Norvim Cos release notes

## Changes
- Jobs and Marketplace Premium now share the same sound selector and custom audio picker. Sound choice is saved to active Premium subscriptions on the server; the selected custom audio file remains stored locally in the browser for foreground playback.
- Premium eligibility for audible/priority push payloads now checks either active Jobs Premium or Marketplace Premium. Non-premium push notifications are silent and do not request vibration.
- Applicant Premium sound playback monitors all new applicant notifications, not only marketplace opportunity alerts. It runs on the applicant dashboard and Marketplace page.
- Message deletion is now a per-account hide (`hiddenFor`); clearing a message from one account does not delete it for the other participant. Conversation lists load in parallel and message history is limited to the latest 100 visible messages for faster opening.
- Wallet debit helpers now return a clear available/required/shortfall prompt when a wallet-funded action has insufficient funds. Employer wallet top-ups also trigger notifications. Marketplace M-PESA initiation failures now mark the payment and booking as failed instead of leaving a false pending state; verified payment success/failure notifies the customer.
- Added weekly Dependabot update PRs for npm dependencies and GitHub Actions, plus a weekly npm security audit workflow. Updates are proposed as pull requests rather than silently installed in production.

## Important platform/payment checks
- Browser push notification sounds are controlled by Android/iOS and browser notification-channel settings. A website service worker cannot force a custom gallery audio file to play while the browser is fully closed. Custom audio is supported while Norvim is open and audio playback has been unlocked by a user gesture. Premium push notifications request high urgency and vibration where the browser supports it.
- Live payment processing cannot be certified from a ZIP. Before production deployment, test Paystack/M-PESA in test mode for wallet top-up, premium, advertising, marketplace booking payment, employer posting subscription and withdrawal; confirm webhooks and payment verification in Render logs.
- Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` consistently in Render. Do not rotate the keys without resubscribing devices.
- Existing `.env` and production secrets are intentionally not included in this release archive.

## COS follow-up: background notification focus
- Removed the Premium modal's sound selector, phone audio picker, custom audio upload, and preview controls. Premium purchase is now a straightforward upgrade flow.
- Removed the Premium-only foreground audio polling script from dashboard/marketplace pages to avoid duplicate or incomplete foreground-only alerts.
- Background service-worker notifications now display with the device/browser's normal notification sound for all account types; supported devices also receive a vibration pattern. Notifications no longer become silent merely because the user is not Premium.
- Every newly created in-app notification is dispatched to registered push subscriptions immediately after the database write, with high Web Push urgency and a per-notification tag so unrelated events do not overwrite one another.
- Added the background-alert opt-in control to the Applicant Dashboard, alongside the existing Employer, Worker, and Marketplace controls.
- Important limitation: background delivery requires HTTPS, a supported browser, notification permission, a saved push subscription, and valid VAPID configuration on the deployed server. A website cannot bypass device notification settings, browser power restrictions, or a disconnected device. End-to-end live delivery still needs verification on the deployed Render instance and a real Android/browser device.
