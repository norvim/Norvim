# Norvim PM — suspended login and appeal improvements

- Applicant login now receives a short-lived appeal-only token when the account is suspended, together with the saved suspension reason. Normal login remains blocked.
- Applicant and employer login pages now show an in-page suspension notice with the reason and an appeal form; no browser prompt() is used.
- Appeals submit through the existing `/api/account/suspension-appeals` route. The account remains suspended while the appeal is pending.
- Employer login suspension response and server route remain intact.
- No email verification logic or general notification system was changed.
