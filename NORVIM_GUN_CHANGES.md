# Norvim gun — latest fixes

- Wallet/top-up payment messages are shown inside the existing **Payments & Wallets** area. There is no separate duplicate payment-notification section.
- New payment messages have **View**. Viewing archives them into **⋮ Viewed**, and the dots open the viewed messages.
- Main Admin Notifications remain separate and continue loading ordinary admin activities.
- Labour-request owners can pay the worker after the worker marks the booking **completed**. The Pay Worker action starts the M-PESA authorization prompt and payment confirmation triggers the worker payout flow.
- Paystack test/live use the same source code. `PAYSTACK_SECRET_KEY` selects the environment. Test M-PESA uses Paystack's official `+254710000000` test number; live uses the customer's selected/profile number.
- Pending M-PESA `pay_offline`/pending responses are not treated as failures. The server checks the pending charge before deciding that a payment failed.
- `clean-admin-test-data.js` is included for explicit admin test-data cleanup. It requires `CONFIRM_ADMIN_CLEAN=YES` and uses `MONGO_URI`.
