# Norvim Follow-up Upgrade

## Changes
- Applicant dashboard: added deletion for completed/cancelled marketplace bookings, with server-side ownership checks and protection for active bookings and unresolved cancellation disputes.
- Applicant dashboard: own open marketplace posts now offer Cancel Post and Delete Post only when no worker has requested them. Server routes enforce the same conditions. Owners are excluded from available-job feeds, and the request endpoint rejects self-requests.
- Employer job posting: the first 15 lifetime job posts are free. Thereafter, posting requires a KSh 1,000 / 30-day subscription. Subscription checkout supports the employer Norvim wallet and configured Paystack/M-PESA flow; payment verification and webhooks activate the plan. A persistent counter prevents deleting old job listings from resetting the free-post allowance.
- Admin Premium management: added a delete action and protected admin API endpoint for Premium subscription records.
- Advertisements: public ad API rotates a maximum of two active advertisements per 10-minute window rather than showing every active advert on every page. Added subtle card styling and entry animation.
- The homepage already had an “Available Jobs” heading; it has been preserved.

## Deployment notes
- No new environment variables are required. Employer M-PESA checkout relies on the existing Paystack/M-PESA configuration; wallet checkout works when the employer has sufficient Norvim wallet funds.
- New employer fields (`jobPostsCreated`, `jobPostingPaidUntil`) are added through Mongoose schema defaults; no manual migration is required. Existing employers begin with a zero counter, and the code uses the greater of the counter and current job count as a safe baseline.
- Test checkout using Paystack test mode first, including wallet payment, successful M-PESA payment, failed/pending payment, and posting after the plan expires. Live payment cannot be verified in this local environment.
- Active bookings cannot be deleted. Only completed/cancelled bookings can be removed, and unresolved cancellation disputes remain protected.
