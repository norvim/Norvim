# NORVIM WAWAN — LAUNCH BUILD

This build is based on Norvim Raba and keeps the existing Jobs + Labour Marketplace functionality while preparing the production payment and launch flows.

## Included
- Existing Norvim Jobs, applications, applicant/employer accounts and admin controls.
- Labour Marketplace worker profiles, service categories, requests, matching, bookings and nearby discovery.
- Marketplace discovery requires the user's GPS location; the API also rejects worker/request discovery without valid coordinates.
- Exact coordinates are used internally for radius matching and are removed from public responses.
- Cancellation reason + cancellation report + admin decision + fixed KSh 100 fine + negative balance handling.
- Public comments with automatic flagging and admin moderation.
- Jobs Premium and Marketplace Premium cards and subscription records.
- Account balance and transaction ledger.
- Paystack Kenya/M-PESA live payment integration points for Premium and Marketplace booking payments.
- Paystack webhook signature verification and transaction verification.
- Marketplace commission calculation (configurable; default 10%).
- Worker payout flow after a paid booking is completed, using Paystack Kenya M-PESA mobile-money transfers.
- Admin can still manually grant/cancel Premium and adjust balances.
- Cloudinary and Resend integrations remain configurable through environment variables.

## Live payment setup
The application code is ready, but no software can legally/technically create a live payment account or secret key on your behalf. Before launch:

1. Create/verify the Norvim business/payment account with Paystack Kenya.
2. Obtain the LIVE secret key.
3. Configure the Paystack webhook URL:
   `https://YOUR-DOMAIN/api/payments/paystack/webhook`
4. Add `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET` to Render environment variables.
5. Set `NORVIM_COMMISSION_PERCENT` to Norvim's approved commission percentage.
6. Test a small live M-PESA payment before opening the platform publicly.

## Email/domain setup
1. Purchase the Norvim domain.
2. Point the domain to Render and enable HTTPS.
3. Add the domain to Resend and publish the DNS records Resend gives you.
4. Set `RESEND_FROM_EMAIL` to an address on the verified domain.
5. Add the Resend API key to Render.

## Important
A domain purchase alone does not activate payments. Live payment credentials/business verification are also required. The code intentionally does not contain fake credentials and does not mark payments successful from browser responses.

## Homepage Media
Admins can now upload homepage pictures and videos from the Admin Dashboard. Media is stored on Cloudinary and can be published, hidden, featured, reordered, or deleted. The homepage only renders the Updates section when at least one published item exists, so there is no empty section or blank gap when no media has been posted.

## Final UI placement update — 8 Sep 2026
- Premium is displayed only on the public Jobs homepage and Marketplace homepage; it is not displayed on Account & Wallet.
- Jobs Premium is at the bottom of the Jobs homepage before the footer.
- Marketplace Premium is placed immediately before “How Norvim Labour Marketplace Works”.
- Both Premium cards use a polished visual treatment with animated moving-line accents and a purchase modal; price is KSh 100 for 30 days.
- Account & Wallet is intentionally minimal: balance, top-up, withdrawal, and transactions without explanatory marketing copy.
- Marketplace hero uses the selected generated safety-gear worker image at `public/images/marketplace-worker-hero.png`.
