# MMEMME MVP Implementation Plan

Status: **Demo implemented; production/100-person pilot backlog defined; external gates remain**

The detailed execution backlog for the production mobile app, public/customer web
app, operations console and launch is maintained in
[`MMEMME_CODEX_IMPLEMENTATION_BACKLOG.md`](./MMEMME_CODEX_IMPLEMENTATION_BACKLOG.md).
This file remains the concise architecture, policy and release-gate summary.

## Architecture

The npm workspace contains:

- `apps/mobile`: Expo Router native customer app.
- `apps/web`: Next.js public website, full customer booking web app and responsive
  vendor onboarding/verification workspace.
- `apps/admin`: Next.js internal operations console.
- `packages/domain`: Zod inputs and canonical state-transition rules.
- `supabase/migrations`: PostgreSQL schema, constraints, RLS and financial processing.
- `supabase/functions`: server-only Paystack, refund, demo-payment and
  notification processing.

Supabase owns authentication, PostgreSQL, storage and Edge Functions. Hosted
Paystack checkout keeps card entry outside MMEMME. Sentry hooks and
privacy-minimized product events are implemented; production projects and alert
destinations must be configured before beta.

## State contracts

Booking:

```text
requested → operations_review → quote_ready → accepted_awaiting_payment
          → confirmed → service_due → fulfilled → completed
exceptions: declined | expired | cancelled | disputed
```

Payment:

```text
initiated → pending → succeeded
                    ↘ failed
succeeded → partially_refunded | refunded | charged_back
```

Payout:

```text
held → eligible → processing → paid
                         ↘ failed → processing
paid → reversed
```

The shared domain package and database both reject invalid transitions. Append-only state, provider, ledger and admin-audit events retain actor, reason, correlation and time.

## Security and money rules

- Service-role and Paystack keys exist only in server functions.
- Customer access is isolated with row-level policies; admin access is explicit and audited.
- Published listings require approved verification.
- Only a signed `charge.success` webhook followed by server-side status, amount and currency verification can confirm payment.
- Provider event keys and ledger idempotency keys prevent duplicate value delivery.
- The database creates gross, platform-fee and vendor-net entries atomically with payment success.
- Payout begins held and cannot be processed before eligibility approval.
- `PAYMENTS_LIVE_ENABLED` defaults closed and is enabled only after every commercial gate is evidenced.
- Raw card details and unapproved raw NIN/BVN data are never stored.

## Delivery checklist

### Validation and operations

- [ ] Complete the interview and design-partner targets in the product design.
- [ ] Approve the public verification checklist and private inspection procedure.
- [ ] Approve versioned venue and catering cancellation templates.
- [x] Publish beta release, incident, rollback and customer-safety runbooks.
- [ ] Establish two-business-hour request response ownership during beta.

### Product alpha

- [x] Workspace, native app, admin shell and shared domain package.
- [x] Guest marketplace, wedding brief and vendor trust disclosure.
- [x] Booking/payment/payout database models and state guards.
- [x] RLS foundation, immutable audit/ledger records and webhook idempotency.
- [x] Live-payment kill switch.
- [x] Connect app and admin to Supabase authentication and persisted data.
- [x] Complete search filters, request form, quote, timeline, support and review screens.
- [x] Add phone OTP, notification delivery, receipt email and analytics events.
- [x] Add admin vendor editing, inspection evidence, quoting, refunds, payouts and reconciliation views.

### Transactional beta

- [ ] Paystack approves the marketplace subaccount/managed-payout arrangement.
- [ ] Nigerian legal/accounting/privacy reviews pass.
- [x] Automated and local tests cover domain transitions plus a complete
      request → quote → simulated verified payment → confirmation path.
- [ ] Paystack sandbox certification covers failure, abandonment, mismatched
      amount, forged signature, duplicates and reordered live provider events.
- [ ] Provider-backed refund, chargeback, failed payout, reversal and daily
      reconciliation flows pass in staging.
- [ ] Controlled live-money rehearsal reconciles payment, ledger, refund and payout 100%.

### Vendor onboarding

- [ ] Vendors can create web accounts with verified contact details.
- [ ] Vendors can submit category-specific credentials, private evidence, owned
      media, draft profiles and packages with autosaved progress.
- [ ] RLS and storage tests isolate every vendor application and credential.
- [ ] Operations can request changes, record physical inspection, approve, reject,
      suspend, expire and publish without SQL.
- [ ] Approved identity/bank verification provider integration stores references
      and result summaries rather than unapproved raw NIN/BVN values.

### Release

- [x] Release, access, incident, rollback and local demo procedures documented.
- [ ] Production threat-model review, backup restoration and incident rehearsal complete.
- [ ] Physical low-end Android and current iOS tests pass on throttled 3G.
- [x] Zero known critical authorization or financial defects in the local demo.
- [ ] TestFlight and Play closed tracks configured with privacy disclosures.
- [ ] Operations staffing and escalation contacts are active.
- [ ] Public/customer/vendor web, private operations, production Supabase/Functions,
      email/SMS, monitoring and iOS/Android closed releases are live.
- [ ] Production-like capacity test passes the 100-person pilot workload with 2×
      provider and infrastructure quota headroom.
- [ ] Production rolls out through 5 → 20 → 50 → 100 invited participants with a
      go/hold decision after each stage.

## Test matrix

Automate domain and database state transitions, concurrent vendor/date confirmation, RLS isolation, stale quote rejection, webhook signing/replay/order, ledger balancing, cancellation calculations, admin auditing and review eligibility. End-to-end staging covers brief → request → quote → payment → confirmation and each rescue path. No payment or quote mutation is retried automatically after uncertain network failure.

## Analytics and investor evidence

Track one cohort funnel: qualified couple → brief → vendor view → request → quote → acceptance → paid deposit → confirmed booking → fulfilled service → verified review.

Every stage includes acquisition source, timestamps and correlation ID. Weekly reporting includes conversion, turnaround time, booking value, 7.5% take rate, gateway and support costs, contribution margin, cancellation/refund/dispute/chargeback rates, leakage reasons, vendor utilization and review/referral intent.

The initial 7.5% vendor fee is a testable assumption. Pricing changes require a versioned quote policy and cohort annotation; historical terms are never rewritten.
