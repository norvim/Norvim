NORVIM SEED — BACKGROUND PUSH NOTIFICATION SETUP

This version implements Web Push notifications using a service worker. Once configured and subscribed, supported browsers can show notifications while the Norvim website is in the background or closed. Delivery still depends on browser/device push support, network access, and the user's notification settings.

1. On your laptop, open Command Prompt in the Norvim Seed project folder and run:
   npm install

2. In the same folder, generate a VAPID key pair:
   npx web-push generate-vapid-keys

3. Copy the generated PUBLIC key and PRIVATE key into your real .env file (not just .env.example):
   VAPID_PUBLIC_KEY=the_generated_public_key
   VAPID_PRIVATE_KEY=the_generated_private_key
   VAPID_SUBJECT=mailto:support@norvim.com
   Keep VAPID_PRIVATE_KEY secret. Never place it in public JavaScript or commit the real .env file.

4. Add the same three environment variables to Render's Environment settings, then redeploy. Generate one key pair and keep it stable across deployments; changing keys can require users to subscribe again.

5. Open https://norvim.com/marketplace.html. Log in with a verified applicant account, tap “Enable Job Alerts”, and allow notifications. Repeat on each device/browser where the user wants alerts.

6. Test by posting a marketplace labour request from another account. The relevant nearby available worker accounts should receive a push notification if they have subscribed and match the service-radius logic. Standard job-board postings send a push to applicant accounts that have subscribed.

NOTES
- Push alerts require HTTPS (Norvim's custom domain should use HTTPS), a compatible browser, permission, and a saved subscription.
- On Android, Chrome can generally receive push notifications while closed. iPhone/iPad web push generally requires a supported iOS/iPadOS version and the website added to the Home Screen.
- A browser permission alone is not enough: server VAPID configuration and subscription registration are required. If VAPID keys are missing, the page reports that background push is not configured.
- Push is best-effort and cannot guarantee delivery when a device is offline, notifications are disabled, or the browser/OS restricts background activity.
