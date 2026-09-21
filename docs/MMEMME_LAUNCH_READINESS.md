# MMEMME Launch Readiness

Status: **not ready for live bookings or production identity verification**
Reviewed: 18 September 2026

## What can begin now

- Recruit and interview Lagos venues, caterers and couples as design partners.
- Run the application, listing and package workflow in staging using clearly labelled
  test data.
- Build a vendor waitlist and schedule physical operating-site inspections.
- Demonstrate browsing, requests and operator-managed quotes without accepting money.

Do not collect NIN values or identity-document images through forms, uploads, email,
WhatsApp or support. Vendors must complete the provider-controlled NINAuth flow only
after production approval.

## Implemented identity boundary

- Vendor consent is explicit, versioned and purpose-specific.
- The browser is redirected to NINAuth; MMEMME does not request a NIN.
- OAuth state, nonce and PKCE are server-generated, short-lived and single-use.
- The PKCE verifier is encrypted at rest with a dedicated rotating secret.
- The callback validates signature, issuer, audience, expiry and nonce before a pass.
- MMEMME stores only the provider transaction reference and a minimal result summary.
- Customers and vendor representatives share an optional account trust workflow:
  verified email, NINAuth, hosted document authenticity, selfie liveness and face
  match. MMEMME stores flags and references, not ID images, selfies, facial templates
  or raw provider responses.
- Vendors may read only safe verification flags for customers attached to their own
  bookings. Provider references, confidence bands and failure details remain private.

## Required before vendor production verification

- NINAuth enterprise onboarding and an approved Verification Partner/Aggregator.
- Signed commercial/data-processing terms and counsel/DPO approval of consent,
  privacy, retention, data-subject rights and incident procedures.
- Registered staging/production callback URLs, issued credentials and secret rotation.
- Provider sandbox certification for success, denial, expiry, replay, forged token,
  signing-key rotation and outage paths.
- Approved bank-name provider and malware scanner with the same security review.
- Approved hosted identity-proofing provider plus a completed biometric DPIA,
  explicit consent/alternative review, raw-media deletion evidence and false-match
  appeal runbook.
- An operator runbook for manual review, disputes, reverification and provider outage.

## Required before public deployment

- Production Supabase project/region, migrations, RLS evidence, backups, restore test,
  environment isolation, custom domains/TLS and removal of all demo functions/data.
- Company-owned DNS, Apple/Google, email, SMS, monitoring and support accounts with
  MFA, backup admins, least privilege and documented recovery.
- Production web/mobile configuration, EAS builds, universal links, privacy policy,
  terms, store disclosures, accessibility and representative-device tests.
- Sentry/analytics privacy review, redaction verification, uptime probes, alerting,
  rate limits, abuse controls, load test and incident/rollback rehearsal.

## Required before live bookings and payments

- Paystack approval for the managed marketplace settlement design.
- Nigerian legal/accounting approval for refunds, chargebacks, tax, invoices,
  cancellation terms, disputes, privacy and payout authority.
- Production webhook/reconciliation configuration and a controlled live-money test
  that reconciles payment, ledger, refund and payout at 100%.
- Approved venue/catering cancellation templates, support SLAs and two-person money
  controls. Keep `PAYMENTS_LIVE_ENABLED=false` until every gate passes.

## Beta go/no-go

The 100-person closed beta may open only after all relevant M17/M18 checks pass: zero
critical authorization/payment defects, full staging reconciliation, successful
backup and incident rehearsals, low-end Android/current iOS coverage, real verified
supply, staffed support and named owners for every production provider.
