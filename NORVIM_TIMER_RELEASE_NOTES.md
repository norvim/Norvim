NORVIM TIMER — CORRECTION RELEASE

Corrections made:
- Improved admin suspension/reactivation controls for applicants, employers and worker profiles, with clear progress/error messages and refreshed script versions.
- Updated worker suspension route to load/save the worker document explicitly, persist isActive/isSuspended/reason together, and return the saved status.
- Applicant registration now explains that the real Kenyan number is needed to receive payments and withdraw earnings after completing Norvim Marketplace work.
- Employer registration now labels the optional upload as the company/business logo and explains what image to upload and where it may appear.
- Homepage install button now fails closed while checking admin distribution status and uses both the hidden attribute and display:none so it cannot appear when downloads are hidden.

Validation: Node syntax checks and JSON/ZIP integrity checks performed. Live admin/database actions still require deployment and testing against the production database.
