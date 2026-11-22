NORVIM VOLT — SUSPENSION BUTTON REVIEW

What was corrected in this review:
- Applicant suspension UI now calls the original server route: PUT /api/admin/applicants/:id/suspension.
- Employer suspension UI now calls the original server route: PUT /api/admin/employers/:id/status.
- Marketplace worker suspension UI now calls the original server route: PUT /api/admin/marketplace/workers/:id/status, sending the exact isActive boolean expected by that handler.
- The shared /api/admin/accounts/:accountType/:id/suspension route is no longer used by these three buttons.
- Suspension reason prompt remains; reasons are required only when suspending and cleared on reactivation by the original handlers.
- Browser cache versions incremented to volt-2.

Static verification:
- node --check server.js: PASS
- node --check public/js/admin-applicants.js: PASS
- node --check public/js/admin-employers.js: PASS
- node --check public/js/admin-marketplace.js: PASS
- ZIP integrity: PASS

Important: This archive has not been connected to the user's live Render/MongoDB environment. A live admin-token + database integration test cannot be claimed from this workspace. The handlers and client request formats have been cross-checked against each other in the source.
