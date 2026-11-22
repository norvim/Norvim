# Norvim Doe – suspension dialog repair

- Root cause confirmed from the browser error: the admin suspension flows called native `prompt()`, which is unsupported in the user's Android WebView/TWA environment.
- Added `public/js/admin-suspension-dialog.js`, an in-page modal for reason entry and reactivation confirmation. It does not use native prompt/confirm.
- Updated applicant, employer, and marketplace-worker suspension handlers to use the modal.
- Kept the existing account-specific API endpoints and request payloads; no database route replacement.
- Suspension reasons remain required (minimum 5 characters) and are sent as `reason`; existing appeal and admin review features remain untouched.
- Updated page script cache versions.

Static syntax and archive integrity checks are recorded separately. Live Render/MongoDB writes have not been tested from this environment.
