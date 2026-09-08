# MMEMME Threat Model

Owner: Technical founder. Backup: Operations founder. Review cadence: before every production release and quarterly.

## Trust boundaries and protected assets

| Boundary                              | Untrusted input                        | Protected assets                             | Required controls                                                                                  | Verification                      |
| ------------------------------------- | -------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------- |
| Customer web/mobile → Supabase        | IDs, profile, booking and support text | Customer identity and bookings               | Auth JWT, RLS, server-owned state transitions, rate limits                                         | `security_privacy.sql`            |
| Vendor workspace → database/storage   | Application data and files             | Private credentials and other vendor tenants | Membership RLS, private buckets, MIME/size limits, malware quarantine                              | vendor and security SQL suites    |
| Operator console → service operations | Admin actions                          | All customer/vendor records and funds        | MFA, capabilities, session expiry, dual approval, immutable audit                                  | operations and transaction suites |
| Edge Functions → Paystack             | Provider payloads and references       | Payment truth and ledger                     | HMAC before parsing, server verification, exact amount/currency, idempotency                       | transaction suite                 |
| Edge Functions → email/push           | Minimized notification payload         | Contact details and booking state            | Outbox leases, redaction, provider idempotency and receipt checks                                  | M15 contract suite                |
| Product → analytics/Sentry            | Events and exceptions                  | PII, messages and credentials                | Consent, event allowlist, no default PII, structured redaction                                     | M16 contract suite                |
| Backup/restore boundary               | Database and storage manifests         | All retained records                         | Separate project, encrypted provider backup, restricted restore role, checksums and reconciliation | restore rehearsal workflow        |

## Priority threats

| Threat                                                               | Severity | Control                                                                       | Owner              | Launch condition                              |
| -------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- | ------------------ | --------------------------------------------- |
| Customer or vendor changes an ID to read another tenant              | Critical | RLS on every table/bucket plus adversarial identities                         | Technical founder  | Automated suite passes                        |
| Forged or replayed payment event confirms value                      | Critical | HMAC, provider verification, unique event key and atomic ledger               | Technical founder  | Full Paystack matrix passes                   |
| Single operator diverts a refund or payout                           | Critical | Capability checks, MFA and two-person approval                                | Operations founder | Dual-control tests pass                       |
| Credential evidence becomes public or survives too long              | High     | Private immutable object paths, signed access, malware gate and retention job | Operations founder | Bucket tests and lifecycle configuration pass |
| Logs or analytics leak NIN/BVN, tokens, messages or payment payloads | High     | Field denylist, structured redaction and consent                              | Technical founder  | Synthetic leak tests pass                     |
| Account deletion corrupts financial records                          | High     | Pseudonymize identity; retain booking/payment/ledger/audit records            | Operations founder | Export/deletion integration test passes       |
| Database loss or bad migration                                       | Critical | PITR/daily backup, isolated restore and post-restore reconciliation           | Technical founder  | Signed rehearsal meets RPO/RTO                |
| Auth, funds or delivery incident goes unnoticed                      | High     | Sentry releases, health checks, owner/backup alerts and correlation IDs       | Technical founder  | Synthetic paging rehearsal passes             |

No critical or high threat may be accepted silently. If its test or external provider configuration is incomplete, `docs/operations/LAUNCH_GATES.md` remains blocked with a named owner.
