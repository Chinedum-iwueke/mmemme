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
- Internal operations dashboard, queues, vendor verification, quoting, ledger and audit history.

## Interaction principles

- Warm and celebratory, but never decorative at the cost of clarity.
- Show price, availability confidence and trust evidence before promotional copy.
- Use explicit status language: “waiting for vendor confirmation,” not “available.”
- Preserve draft briefs and requests during network loss; never repeat a payment or quote action automatically.
- Support guest browsing. Require authentication only to save or transact.
- All controls have labels, 44px minimum targets and visible focus/pressed states.
- Reduced motion is respected. Images are responsive, compressed and never autoplay.

## Not in the MVP

Abuja, diaspora or non-NGN payments, other event types, planners as a product persona, staffing/jobs, vendor self-service, live calendars, vendor-to-customer chat, subscriptions, promoted listings, automated ranking or matching, independent escrow, Flutterwave and automated dispute decisions.

## Implementation roadmap to first MVP

The roadmap is organized around evidence and release gates, not calendar dates alone. A phase is complete only when its exit criteria pass. Engineering and marketplace operations run in parallel under separate founder ownership.

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

- Admit 30 qualified Lagos couples in small weekly cohorts.
- Keep supply capped at 10 verified venues and 15 verified caterers.
- Observe every first-cohort customer without guiding the interface; record surprises and rescue actions.
- Review funnel conversion, response time, booking value, contribution margin, leakage and support burden weekly.
- Ship only fixes that improve trust, completed bookings or operational safety. Defer broader marketplace features.

**MVP graduation criteria**

- 10 paid bookings through MMEMME.
- At least 5 fulfilled services with reconciled payouts.
- Zero unresolved critical fund discrepancies.
- Five permissioned customer or vendor references.
- A reproducible native-app demo and cohort-based investor scorecard.
- A written decision on the next bottleneck to automate, based on observed operations rather than the original feature list.

## Validation gates

Before paid beta: interview 20 couples, 10 venues, 10 caterers and 5 planners; obtain five couple design partners; conditionally onboard 10 venues and 15 caterers; test the guided brief and quote flow; document every rejection and pricing objection.

The eight-week closed beta targets 30 qualified couples and 10 paid bookings. The formal fundraising process begins only after 10 paid bookings, 5 fulfilled services, reconciled payouts, no critical fund discrepancy and five permissioned references.
