# MMEMME Product Design

Status: **Approved for validation and alpha implementation**

Market: Lagos weddings · NGN · venues and caterers
Primary user: a bride or couple planning within 90 days

## Product thesis

Couples currently discover vendors through social media, then compare incomplete information and negotiate through scattered chats. MMEMME gives them one curated place to discover a venue or caterer, see what has actually been verified, receive confirmed terms and secure a booking.

The hypothesis is unproven. The first release is a learning system whose north star is paid and fulfilled bookings, not installs or waitlist registrations.

## Experience promise

> Find a curated venue or caterer, understand the complete terms, and secure the booking without managing scattered social-media conversations.

The customer can:

1. Browse as a guest or answer a five-question wedding brief.
2. Compare published vendors by category, area, capacity, price guidance and verified facts.
3. Submit a structured request for one vendor and date.
4. Receive an availability-confirmed, expiring quote from MMEMME operations.
5. See the deposit schedule, commission-free customer price, terms version and exact cancellation consequences before accepting.
6. Pay using Paystack hosted checkout after live-payment gates open.
7. Track confirmation, support, cancellation, dispute, fulfillment and review inside the app.

Venue and catering requests are separate bookings under the same wedding brief. There is no cart and no claim of live availability.

## Trust model

“MMEMME Verified” is a dated disclosure, not a guarantee. For the closed beta it means an operator recorded identity and contact checks, bank-name match, operating authority, portfolio and references, plus a physical operating-site check. The profile shows what was checked and when it expires.

Payments are not described as escrow. Payment pages remain disabled until Paystack confirms the marketplace settlement design and Nigerian legal/accounting reviewers approve consumer terms, refunds, chargebacks, taxes, invoicing, privacy and payout authority.

## Main screens

- Guest home and curated marketplace.
- Guided wedding brief with skip-to-browse.
- Search/results and filters.
- Vendor detail, packages and verification disclosure.
- Booking request and phone OTP authentication.
- Expiring quote and terms acceptance.
- Hosted checkout return state.
- Booking timeline, receipt and MMEMME support thread.
- Cancellation, dispute and verified review flows.
- Vendor web sign-up, credential application, draft listing and verification
  status/corrections.
- Internal operations dashboard, queues, vendor verification, quoting, ledger and audit history.

## Interaction principles

- Warm and celebratory, but never decorative at the cost of clarity.
- Show price, availability confidence and trust evidence before promotional copy.
- Use explicit status language: “waiting for vendor confirmation,” not “available.”
- Preserve draft briefs and requests during network loss; never repeat a payment or quote action automatically.
- Support guest browsing. Require authentication only to save or transact.
- All controls have labels, 44px minimum targets and visible focus/pressed states.
- Reduced motion is respected. Images are responsive, compressed and never autoplay.

## Vendor MVP experience

Venues and caterers can create a responsive web account, submit a versioned
verification application, upload private credentials and owned portfolio media,
build a draft profile/package, respond to requested changes and track inspection,
approval and expiry. Uploading evidence never means approval: MMEMME operations
reviews the application, completes the physical inspection and controls final
verification and publication.

Private credentials are isolated from public listing media. MMEMME stores
provider references and verification results rather than raw NIN/BVN values
unless qualified Nigerian counsel and an approved provider explicitly authorize
the collection and security design.

There is no vendor native app in this MVP. Vendors do not directly confirm
bookings, chat with customers, initiate payouts or override quotes; founders keep
those transaction operations during the first 100-person pilot.

## Not in the MVP

Abuja, diaspora or non-NGN payments, other event types, planners as a product
persona, staffing/jobs, a vendor native app, vendor-controlled booking/payment
operations, live calendars, vendor-to-customer chat, subscriptions, promoted
listings, automated ranking or matching, independent escrow, Flutterwave and
automated dispute decisions.

## Implementation roadmap to first MVP

The roadmap is organized around evidence and release gates, not calendar dates alone. A phase is complete only when its exit criteria pass. Engineering and marketplace operations run in parallel under separate founder ownership.

### Engineering definition of the initial app

The first bookable MVP is a complete vertical slice, not a collection of disconnected screens. A new customer must be able to install the app, browse without an account, sign in with a Nigerian phone number, save a wedding brief, choose a real seeded vendor, submit a request, receive an operations-issued quote, accept it, complete a Paystack sandbox payment and see a confirmed booking with a receipt and timeline. Operations must complete its side of that journey without editing the database directly.

Real-money booking uses the same implementation but remains disabled until the commercial launch gates pass.

### Engineering milestone 0 — Foundation (completed)

**Delivered**

- npm monorepo with Expo mobile, Next.js operations console and shared TypeScript domain package.
- Supabase schema for profiles, briefs, vendors, verification, packages, bookings, quotes, payments, ledger, payouts, messages, disputes, reviews and audit events.
- Row-level security foundation, guarded booking/payment/payout transitions and append-only financial records.
- Paystack initialization and signed webhook functions with server verification and idempotent processing.
- Native discovery, wedding-brief and vendor-disclosure prototypes plus the operations dashboard shell.

**Remaining foundation work**

- Create Supabase development and staging projects and apply all migrations.
- Generate database TypeScript types and consume them from mobile, admin and Edge Functions.
- Add deterministic seed data for two venues, two caterers, packages, verification disclosures and one admin account.
- Add continuous integration for type checking, tests, admin build, Expo Doctor, migration linting and dependency auditing.

**Exit criteria**

- A clean checkout can install dependencies, create the local database, seed it and pass all checks using documented commands.
- Development, staging and production secrets are separate; no service-role or Paystack secret enters a client bundle.

### Engineering milestone 1 — Authentication and customer identity (implemented)

Implemented in the Expo app and Supabase migration on 21 July 2026. Deployment still requires configuring the Supabase SMS provider, app redirect URLs and an MFA-enrolled admin account in each environment.

**Mobile**

- Add a Supabase client with secure persisted sessions and explicit sign-out.
- Keep home, search and vendor profiles available to guests.
- Require authentication only when a customer saves a brief, shortlists a vendor or submits a booking request.
- Implement Nigerian phone-number entry, OTP request, OTP verification, resend timer, invalid/expired-code states and rate-limit messaging.
- After first verification, collect full name and receipt email and create the customer profile.
- Return the customer to the exact action that originally required authentication.

**Backend and security**

- Add the auth-user-to-profile creation trigger and prevent customers from assigning admin privileges.
- Configure allowed redirect and deep-link URLs for development, staging, TestFlight and Play builds.
- Add session revocation and admin MFA requirements.

**Acceptance tests**

- A guest can browse without receiving an auth prompt.
- A Nigerian phone number can create, resume and end a session.
- Invalid, expired and repeatedly requested OTPs show recoverable states without revealing whether another account exists.
- Customer A cannot read or modify Customer B’s profile or data.

### Engineering milestone 2 — Persisted discovery and wedding brief (implemented)

Implemented in the Expo app, operations console, seed data and storage/RLS migration on 21 July 2026. The migration and seed must be applied to the target Supabase project before the app can use the live catalogue.

**Mobile**

- Replace demo vendor objects with published Supabase vendors, packages and public verification disclosures.
- Persist the five-question brief: wedding date, Lagos area, guest count, budget range and venue/caterer priorities.
- Add filters for category, area, capacity and price guidance; paginate results and preserve the brief when connectivity fails.
- Add vendor media, package inclusions, verification checklist, verification date and the “not a guarantee” disclosure.
- Add loading, empty, offline, stale-verification and retry states.

**Backend and admin**

- Add storage buckets and access policies for public portfolio media and private verification evidence.
- Build operations forms to create, edit, verify, publish and unpublish vendors and packages.
- Prevent publication until verification is approved and all required public fields pass validation.

**Acceptance tests**

- A guest sees only approved and published vendors.
- A customer’s saved brief survives app restart and can be edited.
- Filters return deterministic results and never imply live availability.
- Private verification documents cannot be fetched through a public or customer session.

### Engineering milestone 3 — First booking request (implemented)

Implemented on 21 July 2026 with an authenticated structured request form, client request UUID, idempotent server-owned submission operation, customer booking list and timeline, and an operations claim/contact/decline queue.

**Mobile**

- Add a structured request form to each vendor profile using the saved brief as defaults.
- Collect package choice, event date, guest count, requirements and an acknowledgement that availability is not yet confirmed.
- Require phone authentication, validate with the shared domain schema and submit once using a client request ID.
- Show the newly created booking in a “My bookings” list with `requested` status and plain-language next steps.

**Server operation**

- Implement `submit-booking-request` as a server-owned operation that validates customer ownership, published vendor/package, event date and request idempotency.
- Create the booking and first state-transition event atomically.
- Notify the operations queue without exposing the vendor’s direct contact details to the customer.

**Operations console**

- Add authenticated request queues for new, overdue, awaiting vendor and declined requests.
- Let operations claim a request, transition it to review and record vendor contact attempts and structured decline reasons.

**Acceptance tests**

- Repeated taps, retries or network recovery create exactly one booking request.
- A customer sees only their bookings; an authorized admin sees the operations queue.
- Invalid package/vendor combinations and unpublished vendors are rejected server-side.
- The first request appears in operations and customer timelines with the same correlation ID.

### Engineering milestone 4 — Quote creation and acceptance (implemented)

Implemented on 21 July 2026 with retained quote revisions, package snapshots, inclusions, exclusions, payment schedule, expiry, cancellation consequences, vendor-availability attestation and an idempotent customer acceptance operation.

**Operations console**

- Add quote creation and revision with total, deposit, expiry, package snapshot, inclusions, exclusions, payment schedule and category cancellation template.
- Require operations to record that availability and terms were confirmed with the vendor.
- Publish only one active quote revision and retain every superseded revision for audit.

**Mobile**

- Add quote-ready notification and a quote screen showing all money in naira, expiry countdown, exact cancellation amounts and terms version.
- Require explicit terms acceptance and re-authentication when the session is stale.
- Reject expired or superseded quotes and refresh to the current revision.
- Transition the booking to `accepted_awaiting_payment` only through a server operation.

**Acceptance tests**

- Operations can process request → review → quote without database access.
- A customer cannot accept another customer’s quote, an expired quote or an old revision.
- Accepting a quote twice produces one state transition and one payable amount.
- Historical quote content remains unchanged after vendor/package edits.

### Engineering milestone 5 — Paystack sandbox booking confirmation (implemented)

Implemented on 21 July 2026 with reusable hosted sandbox checkout, deep-link return, authoritative webhook confirmation, server-side Paystack verification, receipts, three-entry reconciliation, held payout creation and finance exception visibility. Deployment still requires Paystack test credentials and `PAYMENTS_SANDBOX_ENABLED=true`; real payments remain separately gated.

**Mobile and server**

- Connect the accepted quote to the existing `initialize-payment` Edge Function.
- Open Paystack hosted checkout and handle success, cancellation, app termination and deep-link return.
- Treat the return link as informational only; show “confirming payment” until the signed webhook and server verification succeed.
- Subscribe or poll safely for the authoritative payment and booking state.
- Show confirmed booking, receipt reference, amount, payment status and booking timeline.

**Operations and finance**

- Add payment, ledger and held-payout views with correlation and provider references.
- Add a reconciliation view that proves gross amount equals platform fee plus vendor net, with gateway fees recorded separately when supplied.
- Add exception queues for unknown references, amount mismatch, expired quote, failed verification and webhook processing failure.

**Acceptance tests**

- Sandbox success creates one successful payment, balanced ledger entries, one held payout and one confirmed booking.
- Abandonment or failure never confirms a booking.
- Forged signatures, mismatched amount/currency and unknown references are rejected.
- Duplicate, delayed and reordered webhooks remain idempotent.
- Losing the network after checkout cannot create duplicate payment attempts or confirmation.

**First-booking milestone**

This milestone is the first usable engineering MVP: a fresh tester can sign in and complete a seeded venue or catering booking end to end in Paystack sandbox while operations issues the quote through the console.

### Engineering milestone 6 — Booking management and beta safety (implemented)

Implemented on 27 July 2026 with customer support and safety management,
cancellation previews and requests, dual-approved refunds, disputes and evidence,
fulfillment/reviews, notification preferences and reminders, operations safety
queues, reconciliation, audit search, Sentry hooks and funnel-event storage.

**Customer app**

- Add a booking-specific MMEMME support thread, push/email notification preferences and event reminders.
- Add cancellation preview, cancellation request, dispute opening and evidence submission.
- Add fulfillment confirmation and a review form available only after a completed verified booking.

**Operations console**

- Add support queues, cancellation calculations, refund approval, dispute timelines, payout eligibility and audit search.
- Require reasons and dual confirmation for money-moving admin actions.
- Add daily reconciliation and unresolved-funds reports.

**Reliability**

- Add Sentry, structured logs, correlation-ID search, product funnel events and critical alerts.
- Test backup restoration, incident response, low-end Android, current iOS, throttled 3G, accessibility and notification fallback.

**Exit criteria**

- Every defined booking, payment, refund and payout failure has a visible customer state and operations rescue path.
- Staging passes the full request → quote → sandbox payment → confirmation → cancellation/refund and fulfillment/review suites.
- No critical authorization, privacy or financial defect remains.

### Engineering milestone 7 — Closed-beta release preparation (code complete)

Implemented on 27 July 2026 with production-safe feature flags, EAS closed-test
profiles, local phone-OTP and payment simulation, deterministic demo accounts,
release/incident/rollback procedures, monitoring hooks and a repeatable
end-to-end smoke test. Store setup, production infrastructure and live-money
activation remain blocked by the external gates below and cannot be completed
inside the repository.

- Complete a controlled live-money rehearsal only after Paystack, legal, accounting, privacy and cancellation gates pass.
- Configure production Supabase, Edge Functions, secrets, monitoring, backups, TestFlight and Play closed testing.
- Seed only inspected vendors and approved packages; remove all demonstration data.
- Release to five design partners first, observe their use, fix blocking failures and then admit the remaining beta cohort gradually.
- Keep `PAYMENTS_LIVE_ENABLED` false until the launch-gate evidence is approved and the rehearsal reconciles 100%.

**Release definition of done**

- A real customer can sign in, find an inspected vendor, request a date, accept a confirmed quote, pay through Paystack and see the confirmed booking.
- Operations can verify supply, issue quotes, support the customer, reconcile funds and handle failures without database edits.
- Every transaction is attributable, auditable and recoverable.

## Parallel market and launch roadmap

The engineering milestones above produce the initial app. The following founder-led work runs alongside engineering and controls when that app can accept real customers and money.

### Phase 0 — Validate the wedge (weeks 1–2)

**Product and operations**

- Interview 20 Lagos couples, 10 venues, 10 caterers and 5 planners using a consistent interview guide.
- Observe how couples currently discover, compare, contact and pay vendors without pitching MMEMME during the observation.
- Test a clickable version of the brief, vendor profile, quote and confirmation journey.
- Recruit five couple design partners with weddings in the next 90 days.
- Secure conditional participation from 10 venues and 15 caterers.
- Record the reason, price objection and current alternative for every rejection.

**Exit criteria**

- At least five qualified couples agree to submit a real booking request through the pilot.
- At least 25 vendors agree to the verification process, structured packages, response SLA and proposed 7.5% commission test.
- Interviews confirm a repeated trust, comparison or deposit problem worth solving. If they do not, stop and revise the wedge before further product work.

### Phase 1 — Establish trust and operations (weeks 2–4)

**Operations and policy**

- Complete documented checks and operating-site inspections for the first vendor cohort.
- Normalize vendor descriptions, packages, inclusions, price guidance, capacity and service areas.
- Approve separate versioned venue and catering cancellation templates.
- Approve customer, vendor, privacy, refund, dispute and payout terms with Nigerian counsel and accounting advisers.
- Agree the managed-payout design with Paystack. Do not describe ordinary settlement as escrow.
- Assign owners and response targets for verification, booking requests, refunds, disputes, fraud and incidents.

**Exit criteria**

- At least five venues and eight caterers are fully verified and ready for staging.
- Every published package has usable media, normalized fields and approved terms.
- Paystack, legal, privacy, accounting and cancellation decisions are documented; unresolved items remain visible launch blockers.

### Phase 2 — Complete the connected alpha (weeks 3–7)

**Engineering and design**

- Connect the Expo app and Next.js console to Supabase authentication and persisted data.
- Finish guest search, filters, wedding brief persistence, shortlist and phone OTP.
- Finish the booking request, operations review, quote revision, expiry and acceptance flows.
- Add vendor editing, verification evidence, package management and booking queues to the operations console.
- Add the booking timeline and booking-specific MMEMME support thread.
- Instrument the full customer funnel with correlation IDs and privacy-reviewed analytics.
- Add Sentry, structured logs and alerting for authentication, booking and financial failures.

**Exit criteria**

- A new customer can complete brief → discovery → authenticated request in staging without founder intervention.
- Operations can publish a verified vendor, process a request and issue an expiring quote without database access.
- Authorization, state-transition and slow-network tests pass for all completed flows.

### Phase 3 — Complete transactional beta candidate (weeks 7–9)

**Payments and rescue paths**

- Finish quote acceptance, hosted Paystack checkout, return state, signed webhook processing and server verification.
- Finish immutable ledger, receipt, payout eligibility, refund, chargeback, failed payout and reversal workflows.
- Finish cancellation and dispute interfaces using the approved category templates.
- Add daily reconciliation and exception queues to operations.
- Test abandoned payments, amount mismatch, forged signatures, duplicate and reordered webhooks, stale quotes and lost connectivity.

**Exit criteria**

- Every sandbox transaction reconciles payment, ledger and payout values exactly.
- Replaying any webhook or customer action creates no duplicate value or notification.
- Operations can identify and rescue every defined payment, refund and payout failure without manual database edits.

### Phase 4 — Hardening and release readiness (weeks 9–11)

**Quality and launch preparation**

- Run threat modeling, access review, dependency audit and backup restoration.
- Test the complete journey on representative low-end Android devices, current iOS and throttled 3G.
- Validate draft recovery, image limits, accessibility, support escalation and incident communications.
- Complete a controlled live-money payment, refund and payout rehearsal after commercial approvals.
- Prepare TestFlight and Google Play closed-testing releases, privacy disclosures and reviewer instructions.

**Exit criteria**

- Zero critical authorization, privacy or financial defects remain.
- The live-money rehearsal reconciles 100% with no unexplained discrepancy.
- Every launch gate in `operations/LAUNCH_GATES.md` is marked PASS with linked evidence.
- Named people are scheduled to operate the first two beta weeks.

### Phase 5 — First MVP closed beta (eight weeks)

**Market execution**

- Admit invited customers and vendor applicants in cumulative cohorts of 5, 20,
  50 and at least 100 people, recording role and qualification separately.
- Keep supply capped at 10 verified venues and 15 verified caterers.
- Let vendors enter their own application and draft listing data; keep MMEMME
  review, physical inspection, publication and transaction operations controlled.
- Observe every first-cohort customer without guiding the interface; record surprises and rescue actions.
- Review funnel conversion, response time, booking value, contribution margin, leakage and support burden weekly.
- Ship only fixes that improve trust, completed bookings or operational safety. Defer broader marketplace features.

**MVP graduation criteria**

- 10 paid bookings through MMEMME.
- At least 5 fulfilled services with reconciled payouts.
- Zero unresolved critical fund, authorization, data-loss or credential-privacy
  discrepancy.
- Five permissioned customer or vendor references.
- A reproducible native-app demo and cohort-based investor scorecard.
- A written decision on the next bottleneck to automate, based on observed operations rather than the original feature list.

## Validation gates

Before paid beta: interview 20 couples, 10 venues, 10 caterers and 5 planners; obtain five couple design partners; conditionally onboard 10 venues and 15 caterers; test the guided brief and quote flow; document every rejection and pricing objection.

The controlled pilot expands in cumulative cohorts of 5, 20, 50 and at least 100
invited participants across customer and vendor roles. Cohort reporting separates
roles and qualified customer demand. The initial commercial evidence target
remains at least 10 paid bookings, 5 fulfilled services, reconciled payouts, no
critical fund or credential-privacy discrepancy and five permissioned references
before a formal fundraising process.
