Mail sender safety consumes the backend `safety` object on message summaries and details:
`{classification: 'internal'|'external'|'suspicious', fromDomain: string|null, authentication: 'aligned'|'unverified', spam: boolean}`.
Missing, incomplete or unverified safety data keeps downloads locked. Explicit trust applies only to the currently opened message and resets when navigating away. The warning remains after trust. Message bodies remain escaped plain text; URLs are never made clickable.

Report to IT sends `POST /api/app/v1/messages/:id/report` with `{}`, session cookies and the CSRF header. Success requires `{status:'queued', submissionId:string}`. The backend resolves the message and sends metadata only, without body or attachments. Failures remain visible and allow retry.

Configure `INTERNAL_EMAIL_DOMAINS` (initially `muditam.com`) and `IT_REPORT_EMAIL` on mail-backend. Neither belongs in browser VITE variables. The backend owns exact-domain matching and Stalwart authentication/spam header interpretation; frontend tests cannot verify those backend behaviors. Mock reporting is a local simulation and sends no email.
