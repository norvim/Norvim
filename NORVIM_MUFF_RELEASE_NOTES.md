# Norvim Muff — Release Candidate

This package is based on the supplied `Norvim Bingo FIX.zip` project. Existing email verification and the general notification system were intentionally left unchanged.

## Included changes

- Applicant registration accepts Kenyan mobile formats (`07XXXXXXXX`, `01XXXXXXXX`, `+2547XXXXXXXX`, `+2541XXXXXXXX`), normalizes to `+254`, and rejects invalid or duplicate applicant phone numbers. Registration explains why the applicant must use a number they can access.
- Job details include a safety warning and a Report Job action. Reports are stored for admin review.
- Job descriptions containing explicit applicant-fee language (registration/application/interview/training/processing fee, pay-to-apply, etc.) are placed in `Under Review` rather than published or sent as new-job notifications.
- Admin can inspect flagged jobs, approve them for publication, or close them.
- Admin can inspect job reports and mark them reviewed, dismissed, or confirmed. Confirmed reports move the job to `Under Review`.
- Applicant, employer and worker-profile suspensions now require an admin reason. Reasons are stored and shown to affected users; applicants/employers can request a review at login and workers can request a review from the worker dashboard.
- Admin can review appeals, approve and restore the account/profile, or reject with an explanation. Duplicate pending appeals are blocked.
- Admin can activate or hide the public installation prompt. The setting is persisted in MongoDB; hiding it does not disable existing installations.
- First app activations are recorded by a unique browser/app installation identifier and displayed in the admin panel.
- PWA manifest requests portrait orientation.
- Service-worker installation no longer fails as a whole if one optional cached asset is temporarily unavailable.

## Important release/testing limitations

1. The website Install button uses the browser's PWA installation prompt where supported, with browser-menu instructions as fallback. It does not host or download the separately built Android TWA APK. To distribute that exact native TWA APK from Norvim, the signed APK must first be uploaded to a controlled download location and linked from the admin release setting.
2. The supplied ZIP contains the website/server project, not the generated Bubblewrap Android project. The Android TWA's native orientation must also be set to portrait in its Android activity manifest and the APK/AAB rebuilt. The PWA manifest setting alone cannot guarantee orientation lock for an already-built TWA APK.
3. The service-worker change makes first-time service-worker installation more resilient, but the reported first-launch delay cannot be certified fixed without testing the installed Android app on the target phone and reviewing any Android/Chrome startup logs.
4. Installation statistics count unique app activations, not installations that have never been opened. Browser storage reset or a different device/browser profile can create another identifier.
5. This package has passed static JavaScript syntax checks. It has not been connected to the production MongoDB, deployed to Render, or end-to-end tested against live payment, email, push, or Android services.

## Deployment checklist

- Back up the current production project/database before deployment.
- Deploy this ZIP's project contents to the same Render service and allow dependencies to install.
- Verify applicant phone registration, employer/applicant/worker suspension reasons, appeal submission and admin decisions.
- Test job reporting and the `Under Review` queue with a test employer account.
- Confirm public downloads start hidden, then activate them from Admin when ready.
- Test first launch and portrait orientation on the actual installed TWA before inviting public users.
- Do not distribute the APK until native TWA portrait configuration and first-launch testing have passed.
