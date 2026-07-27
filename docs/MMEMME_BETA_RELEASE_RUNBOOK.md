# MMEMME closed-beta release runbook

## Non-negotiable gates

Production release does not authorize live payments. Keep `PAYMENTS_LIVE_ENABLED=false` until written Paystack marketplace approval, Nigerian legal/accounting/privacy approval, approved category cancellation terms and a 100% reconciled controlled rehearsal are attached to the release record.

## Environment and access

- Separate development, staging and production Supabase projects and Sentry projects.
- Service-role, Paystack, Resend, Expo access and cron secrets are server-only and rotated before beta.
- Operations accounts require MFA; two distinct administrators are required for refunds and payout eligibility.
- Enable Supabase point-in-time recovery or daily backups and complete a restore rehearsal before admitting customers.
- Resolve or formally risk-review every high-severity production dependency
  advisory. As of 27 July 2026, npm still reports high-severity advisories in
  PostCSS and Sharp versions bundled by the current Next.js release; this does
  not block the isolated local demo, but it blocks public production exposure.
- Deploy Edge Functions: `initialize-payment`, `paystack-webhook`, `process-refund`, and `dispatch-notifications`. Never deploy `demo-confirm-payment` with `PAYMENTS_DEMO_MODE=true`.
- Schedule `dispatch-notifications` with `x-cron-secret` at least every five minutes.

## Gradual release

1. Remove demonstration users and confirm production has only physically inspected vendors and approved packages.
2. Complete staging request → quote → payment → cancellation/refund and fulfillment/review tests.
3. Build preview artifacts, run VoiceOver/TalkBack, current iOS, representative low-end Android and throttled-network checks.
4. Admit five named design partners. Observe every first booking and reconcile daily.
5. Fix blocking failures before increasing the cohort. Stop admission on authorization, fund, notification or reconciliation exceptions.

## Incident response

Freeze affected money actions, preserve correlation IDs and provider payloads, acknowledge the customer, assign an incident owner and reconcile provider/payment/ledger/refund/payout records. Never repair immutable ledger or audit rows. Add compensating entries through an approved migration or runbook operation. Record timeline, customer impact, root cause, remediation and regression test before closing.

## Rollback

Disable new requests or payments with environment gates, roll back the application deployment without rolling back financial migrations, keep webhook ingestion available and reconcile all in-flight references before resuming.
