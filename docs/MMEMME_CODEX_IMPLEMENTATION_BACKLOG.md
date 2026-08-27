# MMEMME Codex Implementation Backlog

Status: **Execution backlog for the shipped MVP**  
Last updated: **27 August 2026**  
Product scope: **Lagos weddings · venues and caterers · NGN**

## 1. Outcome

This backlog moves MMEMME from a validated local demonstration to a production
MVP that real couples can use on native mobile and the public web.

The shipped product has three surfaces:

1. **Customer mobile app** — an Expo React Native app for iOS and Android.
2. **Public website and customer web app** — a Next.js application that combines
   marketing, indexable vendor discovery and the complete authenticated booking
   journey.
3. **Operations console** — a private Next.js application for verification,
   requests, quotes, money operations, customer support and audit.

Mobile and web must provide the same booking capability and operate on the same
Supabase records, state machines and server operations. They may differ in
navigation and presentation, but never in commercial rules, authorization or
booking behavior.

The MVP is shipped only when a real customer can discover an inspected vendor,
request a date, receive and accept a quote, pay through Paystack, receive a
confirmed booking, get support and complete a cancellation or dispute path on
either mobile or web without a database edit.

## 2. Product and engineering constraints

- Keep Lagos, weddings, venues, caterers and NGN fixed through the MVP.
- Keep vendors founder-operated; do not build a vendor portal yet.
- Keep venue and catering bookings separate under one wedding brief.
- Never claim live availability or escrow.
- Require authentication only when a guest saves, shortlists or transacts.
- Treat the browser return from Paystack as informational. Only a signed webhook
  followed by server verification may confirm payment.
- Keep demo payment code impossible to enable in preview or production.
- Do not duplicate business rules in mobile, web or operations UI. Shared domain
  contracts and server-owned operations are authoritative.
- Do not widen the MVP with planners, new cities, new event types, subscriptions,
  promoted listings, automated ranking or direct vendor chat.

## 3. Target architecture

```text
apps/mobile       Expo customer app (iOS and Android)
apps/web          Next.js public site + full customer booking web app
apps/admin        Next.js private operations console
packages/domain   schemas, state contracts, money/date formatting, shared types
packages/tokens   platform-neutral brand, spacing and motion design tokens
packages/config   shared TypeScript, lint and test configuration
supabase          PostgreSQL, Auth, Storage, RLS, migrations and Edge Functions
```

### Rendering and ownership

- Public marketing, category and vendor pages use Next.js server rendering or
  static regeneration for fast first paint and search indexing.
- Authenticated web routes use server-validated sessions and customer-scoped
  queries. Sensitive state changes call server-only operations.
- Mobile uses the same Supabase project and RPC/Edge Function contracts with
  securely persisted sessions.
- Operations remains a separate app and deployment with MFA and explicit admin
  authorization.
- Supabase owns persistence and row-level authorization. Paystack owns hosted
  card entry. Resend and Expo provide email and push delivery.

### Environments

```text
local       deterministic seed data and simulated payment only
preview     disposable web deployment; no payments or production data
staging     production-like Supabase + Paystack test mode
production  real inspected supply; live payments closed by default
```

Each environment has separate projects, secrets, redirect URLs, storage and
analytics. Production secrets must never be copied into preview or local files.

## 4. Cross-platform product design system

MMEMME should feel assured, editorial and celebratory—not like an ornate wedding
invitation or a generic purple marketplace template.

### Visual direction

- Use the existing warm ivory, plum and muted rose direction as the foundation.
- Reserve green for positive money, verification and completion states.
- Use one editorial display face for restrained headings and a highly readable
  sans serif for body, labels, prices and forms. Avoid script fonts in product UI.
- Lead listing cards with high-quality real photography, transparent price
  guidance, area, capacity and dated verification evidence.
- Use generous whitespace, subtle borders and restrained elevation. Avoid glass
  effects, excessive gradients, autoplay, decorative animation and emoji icons.
- Use Lucide or a platform-equivalent SVG icon set consistently.

### Shared interaction rules

- Search is the primary call to action on the public home page.
- Trust evidence appears before promotional prose on vendor and payment pages.
- All interactive targets are at least 44×44 points/pixels.
- All controls have labels, visible keyboard focus and pressed/disabled states.
- Body text meets WCAG AA contrast and does not drop below 16px on the web.
- Loading content reserves its final space to prevent layout shift.
- Empty, error, offline and retry states are designed—not generic alerts.
- Motion lasts 150–300ms, communicates state and respects reduced-motion settings.
- Responsive web acceptance widths are 375, 768, 1024 and 1440 pixels.
- Native accessibility is verified with TalkBack and VoiceOver; web flows are
  keyboard-operable and screen-reader-labelled.

### Information architecture

**Public web**

```text
Home
├── Venues
├── Caterers
├── Vendor profile
├── How MMEMME works
├── Verification and safety
├── For vendors / contact
└── Sign in
```

**Authenticated customer, web and mobile**

```text
Discover
Brief
Shortlist
Bookings
Profile
└── booking detail
    ├── request status
    ├── quote and terms
    ├── payment and receipt
    ├── timeline
    └── support and safety
```

## 5. How Codex should execute this backlog

Each backlog item has an ID, dependencies, deliverables and acceptance evidence.
Codex should work milestone by milestone and must not mark an item complete based
only on code presence.

For every item:

1. Read the relevant product design, migrations and current implementation.
2. Preserve existing user work and avoid unrelated refactors.
3. Add or update automated tests before declaring the behavior complete.
4. Run the item-specific checks plus the repository quality gate.
5. Update this document from `[ ]` to `[x]` only after evidence passes.
6. Commit one coherent item or tightly related group with the backlog IDs in the
   commit body.
7. Record any external blocker without pretending it is complete.

Definition of ready for an item:

- Product behavior and out-of-scope boundaries are clear.
- Dependencies are complete.
- Required external credentials can be replaced with a safe test double.
- Acceptance criteria are testable.

Repository quality gate:

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npx expo-doctor
npx supabase db lint --local
```

The backlog must add missing root scripts and CI support before this gate becomes
mandatory for all later milestones.

### Execution order and planning assumptions

Milestones 0–7 in `MMEMME_PRODUCT_DESIGN.md` are the implemented demo baseline.
Milestone 8 begins by revalidating that baseline rather than assuming prototype
code is production-ready.

Priority meanings:

- **P0** — required for the shipped MVP or a safety/release gate.
- **P1** — required for product quality but may move within its milestone.
- **P2** — useful after launch; must not delay MVP unless evidence changes.

Every item in milestones 8–17 is P0 or P1. P2 ideas belong in a separate post-MVP
backlog, not in this execution path.

Suggested delivery waves for a small founder-led team using Codex:

| Wave | Work | Dependency rule |
|---|---|---|
| 1 | M8 production baseline + M9 design foundation | Start here; locks contracts and quality gates |
| 2 | M10 public marketplace + M13 admin foundations + M14 atomic APIs | Can run in parallel after shared types/tokens |
| 3 | M11 full customer web + M12 native rebuild + remaining M13/M14 | Build vertical slices against the same server contracts |
| 4 | M15 security/reliability + M16 release-candidate proof | Begins as flows stabilize; no launch shortcuts |
| 5 | M17 production and controlled cohort | Requires every code and external gate |

The critical path is M8 → M14 → M11/M12/M13 → M15 → M16 → M17. Public
marketing work may progress in parallel, but transaction hardening—not page
count—determines the live-launch date. Calendar estimates should be created only
after M8-01 measures the prototype debt and the available human review capacity.

## 6. Engineering milestones

### Milestone 8 — Production baseline and architecture lock

Goal: turn the demo repository into a repeatable, maintainable production base.

- [ ] **M8-01 — Current-state audit and debt register**  
  Dependencies: none.  
  Inventory demo-only branches, hard-coded dates/addresses, generated files,
  untyped Supabase results, dependency advisories, missing tests and incomplete
  milestone 0–7 exit criteria. Create `docs/ENGINEERING_DEBT.md` with severity,
  owner and release disposition.  
  Acceptance: every known release blocker is either scheduled below or explicitly
  deferred with rationale.

- [ ] **M8-02 — Workspace and application boundaries**  
  Dependencies: M8-01.  
  Scaffold `apps/web`; move shared code only where two real consumers exist;
  create `packages/tokens` and `packages/config`; keep web, mobile and operations
  deployments independently buildable.  
  Acceptance: all three apps build from a clean checkout and no client imports
  admin/server-only code.

- [ ] **M8-03 — Generated database types and typed server contracts**  
  Dependencies: M8-02.  
  Generate Supabase types in CI, type all queries and Edge Function payloads, add
  shared request/response schemas and eliminate material `any` usage from booking,
  payment, refund and dispute paths.  
  Acceptance: schema drift fails CI and malformed server input receives a stable
  machine-readable error code plus safe customer message.

- [ ] **M8-04 — Tooling and continuous integration**  
  Dependencies: M8-02.  
  Add ESLint, Prettier check, unit/integration test projects, SQL lint, Expo Doctor,
  web/admin builds, secret scanning, migration verification and dependency audit
  to GitHub Actions. Cache dependencies without caching secrets.  
  Acceptance: a fresh branch runs the complete quality gate; a deliberately bad
  type, formatting error, unsafe migration and secret fixture each fail the
  appropriate check.

- [ ] **M8-05 — Environment and feature-flag contract**  
  Dependencies: M8-03.  
  Validate environment variables at startup, document owners, distinguish public
  and server-only values, and implement centrally audited flags for requests,
  sandbox payments and live payments. Delete runtime dependence on LAN IPs and
  make demo-only functions undeployable to production.  
  Acceptance: each app fails clearly when required configuration is absent;
  production build tests prove demo payment cannot be invoked.

Milestone exit: one documented command creates a clean local environment, and CI
is green with zero committed secret or undocumented critical/high release risk.

### Milestone 9 — Brand system and production UX foundation

Goal: establish a beautiful, consistent and accessible system before page-by-page
implementation.

- [ ] **M9-01 — Brand and interface specification**  
  Dependencies: M8-02.  
  Create `docs/MMEMME_DESIGN_SYSTEM.md` covering logo use, color roles,
  typography, photography, iconography, spacing, radii, elevation, motion,
  content voice and accessibility. Include examples for trust, price and status
  communication.  
  Acceptance: mobile, public web and operations examples use the same semantic
  tokens and pass contrast checks.

- [ ] **M9-02 — Shared design tokens**  
  Dependencies: M9-01.  
  Implement typed primitive and semantic tokens for color, typography, spacing,
  radius, elevation and motion. Export CSS variables for Next.js and TypeScript
  values for React Native.  
  Acceptance: no core flow depends on unexplained one-off colors or spacing;
  token builds are deterministic.

- [ ] **M9-03 — Web component foundation**  
  Dependencies: M9-02.  
  Build accessible button, link, input, select, date input, currency display,
  badge, card, dialog, sheet, toast, skeleton, empty state, error state, image,
  breadcrumbs, pagination and form-error components. Add Storybook or an
  equivalent visual catalogue.  
  Acceptance: keyboard, focus, screen-reader and responsive component tests pass.

- [ ] **M9-04 — Native component foundation**  
  Dependencies: M9-02.  
  Build native equivalents with safe areas, keyboard avoidance, haptics only
  where meaningful, 44-point targets and platform-correct navigation behavior.
  Add a development component gallery.  
  Acceptance: component gallery passes font scaling to 200%, VoiceOver/TalkBack
  labels and small Android viewport checks.

- [ ] **M9-05 — Cross-platform content and status language**  
  Dependencies: M9-01.  
  Centralize plain-language booking/payment status labels, help text, validation
  messages and trust disclosures. Technical enums never appear directly to a
  customer.  
  Acceptance: snapshot/contract tests cover every booking, payment, payout,
  cancellation, refund and dispute state.

Milestone exit: approved component galleries cover every primitive required by
the public discovery and booking journeys on web and mobile.

### Milestone 10 — Public website and indexable marketplace

Goal: ship a fast public-facing site that explains MMEMME and immediately enables
vendor discovery.

- [ ] **M10-01 — Public shell and navigation**  
  Dependencies: M9-03.  
  Implement responsive header, mobile navigation, footer, skip link, contact and
  legal navigation, persistent but non-obstructive sign-in/bookings access.  
  Acceptance: complete keyboard navigation, no horizontal overflow and no content
  hidden behind fixed UI at all target widths.

- [ ] **M10-02 — Search-first home page**  
  Dependencies: M10-01.  
  Build an editorial hero with wedding date/area/category search, curated venue
  and caterer sections, verification explanation, how booking works, real proof
  placeholders driven by approved CMS/data fields and a vendor-enquiry CTA.
  Do not invent booking counts or testimonials.  
  Acceptance: a guest reaches relevant results in one primary action; marketing
  content remains useful with JavaScript disabled where practical.

- [ ] **M10-03 — Category and search results**  
  Dependencies: M10-02, M8-03.  
  Add indexable venue and caterer pages, URL-backed filters, sort limited to
  explicit non-promoted rules, pagination, result count and mobile filter sheet.
  Preserve search state through navigation and sign-in.  
  Acceptance: copied URLs reproduce results; only approved published supply is
  visible; filters never imply live availability.

- [ ] **M10-04 — Public vendor profiles**  
  Dependencies: M10-03.  
  Implement responsive gallery, optimized images, summary facts, price guidance,
  capacity, area, packages, inclusions, verification evidence/date/expiry,
  cancellation-policy preview and related curated vendors.  
  Acceptance: critical facts appear before marketing prose, private evidence is
  inaccessible, expired verification is visibly disclosed and images do not
  cause layout shifts.

- [ ] **M10-05 — Marketing and trust pages**  
  Dependencies: M10-01.  
  Create How It Works, Verification & Safety, For Vendors, About, Contact, Privacy,
  Terms, Refund/Cancellation and Dispute pages. Legal text remains versioned and
  counsel-approved; placeholders cannot be deployed as final terms.  
  Acceptance: all required footer links resolve, versions are recorded and
  structured content is readable on small screens.

- [ ] **M10-06 — Search visibility and sharing**  
  Dependencies: M10-03, M10-04.  
  Add page metadata, canonical URLs, sitemap, robots policy, Open Graph images,
  structured data where accurate, redirects and branded 404/500 states.  
  Acceptance: metadata tests pass; preview is no-index; production excludes
  authenticated/private routes from indexing.

- [ ] **M10-07 — Public performance budget**  
  Dependencies: M10-02 through M10-06.  
  Optimize responsive images, fonts, caching and client bundles. Reserve layout
  space and defer non-critical analytics.  
  Acceptance on representative mobile throttling: LCP ≤2.5s, CLS ≤0.1, INP
  ≤200ms at the 75th percentile after sufficient field data; lab budgets prevent
  obvious regressions before field data exists.

Milestone exit: guests can understand MMEMME and search real approved supply from
an accessible, indexable and production-quality public site.

### Milestone 11 — Durable customer web application

Goal: deliver the complete mobile booking capability in a resilient web app.

- [ ] **M11-01 — Web authentication and session recovery**  
  Dependencies: M8-05, M9-03, M10-03.  
  Implement Nigerian phone OTP, resend/rate-limit states, profile completion,
  secure cookies, sign-out and return-to-intent after authentication.  
  Acceptance: authentication returns the customer to the exact saved/requested
  action; sessions work across tabs without exposing tokens to logs.

- [ ] **M11-02 — Wedding brief and shortlist**  
  Dependencies: M11-01.  
  Implement autosaved five-question brief, skip-to-browse, edit flow, shortlist
  and graceful local draft recovery. Reconcile anonymous state after sign-in.  
  Acceptance: refresh, back navigation, brief edits and temporary network failure
  do not lose work or duplicate records.

- [ ] **M11-03 — Web booking request**  
  Dependencies: M11-02, M10-04.  
  Implement package selection, guest count, requirements, date confirmation and
  the explicit “availability not yet confirmed” acknowledgement. Use the same
  idempotent server operation as mobile.  
  Acceptance: retries create one request; invalid vendor/package combinations
  fail server-side; success appears in web, mobile and operations immediately.

- [ ] **M11-04 — Customer booking workspace**  
  Dependencies: M11-03.  
  Build booking list, detail, human-readable timeline, quote, revision history,
  expiry, terms acceptance, receipt and next actions. Provide useful desktop
  two-column and focused mobile layouts.  
  Acceptance: all states have a clear primary action or explanation; stale quote
  acceptance is rejected and refreshed.

- [ ] **M11-05 — Hosted checkout and recovery**  
  Dependencies: M11-04, M14-02.  
  Launch Paystack hosted checkout, handle abandonment and return, poll/subscribe
  for authoritative confirmation and recover after tab close or network loss.  
  Acceptance: a return URL never confirms value; one successful provider event
  produces one payment, ledger set, payout and confirmation.

- [ ] **M11-06 — Web support and safety**  
  Dependencies: M11-04, M14-03.  
  Implement booking support, cancellation preview/request, refund status, dispute
  opening/evidence, fulfillment confirmation and eligible verified review.  
  Acceptance: uploads enforce type/size/access; every exception state has a clear
  customer explanation and operations rescue path.

- [ ] **M11-07 — Cross-device continuity**  
  Dependencies: M11-01 through M11-06.  
  Ensure a request started on web can continue on mobile and vice versa. Resolve
  cached/draft conflict explicitly and deep-link notifications to the correct
  platform route.  
  Acceptance: automated scenarios alternate platforms at request, quote and
  payment boundaries without state divergence.

Milestone exit: web supports the entire discovery-to-post-booking journey and is
not a secondary or reduced booking experience.

### Milestone 12 — Native mobile product-quality rebuild

Goal: replace prototype presentation with a polished, store-ready native app.

- [ ] **M12-01 — Native navigation and app shell**  
  Dependencies: M9-04, M9-05.  
  Implement Discover, Brief/Shortlist, Bookings and Profile navigation, deep links,
  safe-area handling, auth return intent and notification routing.  
  Acceptance: Android back, iOS gestures, cold-start deep links and restored
  sessions behave predictably.

- [ ] **M12-02 — Discovery and vendor-profile redesign**  
  Dependencies: M12-01, M10-04.  
  Build virtualized results, filter sheet, image gallery, package comparison and
  prominent verification disclosures using shared tokens and content contracts.  
  Acceptance: smooth on representative low-end Android, no unbounded image memory
  usage and complete screen-reader order.

- [ ] **M12-03 — Brief, shortlist and request redesign**  
  Dependencies: M12-02.  
  Add focused steps, progress, inline validation, draft recovery, package/date
  review and idempotent request submission.  
  Acceptance: keyboard never covers the active input; app termination preserves
  drafts; repeat taps create one request.

- [ ] **M12-04 — Quote, checkout and confirmation redesign**  
  Dependencies: M12-03, M14-02.  
  Present exact money, inclusions, exclusions, expiry and cancellation impact;
  implement hosted checkout, confirming state, recovery and receipt.  
  Acceptance: money is consistently formatted in NGN; customer cannot confuse
  payment return with booking confirmation.

- [ ] **M12-05 — Booking management and safety redesign**  
  Dependencies: M12-04, M14-03.  
  Polish timeline, support, reminders, cancellation, refund, dispute evidence,
  fulfillment and verified reviews.  
  Acceptance: all exception states remain usable with large text, screen reader
  and intermittent connectivity.

- [ ] **M12-06 — Native lifecycle and notifications**  
  Dependencies: M12-01, M14-04.  
  Handle push permissions contextually, token rotation, foreground/background
  behavior, email fallback, app updates and expired sessions.  
  Acceptance: notification retries do not duplicate customer messages and every
  deep link has an authenticated recovery route.

Milestone exit: signed preview builds pass complete customer journeys on current
iOS and representative low-end Android hardware.

### Milestone 13 — Operations console productionization

Goal: enable founders to operate the MVP safely without database access.

- [ ] **M13-01 — Admin identity and authorization**  
  Dependencies: M8-05.  
  Enforce MFA, server-side role checks, session timeout, revocation and least
  privilege. Replace local bypasses with environment-bound test helpers.  
  Acceptance: non-admin and AAL1 sessions cannot access or mutate admin data;
  authorization tests cover every server action.

- [ ] **M13-02 — Supply and verification workspace**  
  Dependencies: M9-03, M13-01.  
  Complete vendor/package editing, media management, evidence upload, checklist,
  review/expiry, publication validation and change history.  
  Acceptance: an operator can onboard and publish inspected supply without SQL;
  incomplete or expired verification blocks or clearly marks publication.

- [ ] **M13-03 — Booking operations workspace**  
  Dependencies: M13-01.  
  Implement queues, SLA/overdue state, ownership, vendor-contact log, decline,
  quote issue/revision/expiry and customer notification preview.  
  Acceptance: request to accepted quote requires no database edit and every
  action records actor, reason and correlation ID.

- [ ] **M13-04 — Support, dispute and cancellation workspace**  
  Dependencies: M13-03, M14-03.  
  Build unified booking context, evidence timeline, policy calculation, response
  templates, assignment and resolution.  
  Acceptance: operations can rescue every defined state while customers see the
  matching outcome on both clients.

- [ ] **M13-05 — Money and reconciliation workspace**  
  Dependencies: M13-01, M14-02, M14-03.  
  Complete ledger, refunds, dual approvals, payout eligibility, provider state,
  chargebacks, reversals, daily reconciliation and exception ownership.  
  Acceptance: money-moving actions require two distinct authorized people where
  specified; no successful payment lacks a matched ledger and held payout.

- [ ] **M13-06 — Operational usability**  
  Dependencies: M13-02 through M13-05.  
  Add global correlation/reference search, saved queues, pagination, loading and
  error recovery, safe confirmations, activity history and export with redaction.  
  Acceptance: founders complete the first-cohort runbook without SQL or browser
  developer tools.

Milestone exit: operations can onboard supply, process bookings, support users and
reconcile money with complete authorization and audit evidence.

### Milestone 14 — Transaction, policy and notification hardening

Goal: make all server-owned behavior safe enough for real transactions.

- [ ] **M14-01 — Atomic state-transition API**  
  Dependencies: M8-03.  
  Move multi-write admin flows into transactional database functions, enforce
  transition matrices and optimistic concurrency, and return stable errors.  
  Acceptance: injected failures cannot leave partial cancellation, refund, quote,
  booking or payout state.

- [ ] **M14-02 — Paystack staging certification**  
  Dependencies: M14-01.  
  Test initialization, signature validation, server verification, amount/currency
  mismatch, unknown references, abandonment, duplicate/delayed/reordered events,
  network loss and chargebacks using Paystack test mode.  
  Acceptance: 100% payment/ledger/payout reconciliation across the automated
  matrix and no client-controlled confirmation path.

- [ ] **M14-03 — Refund, cancellation, dispute and payout policy engine**  
  Dependencies: M14-01 and approved policy versions.  
  Replace demo cancellation percentages with versioned venue/caterer policies;
  make approval and provider operations recoverable and auditable.  
  Acceptance: boundary-date tests, partial/full refunds, failures, reversals and
  dual approvals match approved policy examples exactly.

- [ ] **M14-04 — Notification delivery service**  
  Dependencies: M8-05, M9-05.  
  Add an outbox/worker schedule, preference checks, Expo receipts, token cleanup,
  Resend idempotency, retry/backoff and delivery diagnostics.  
  Acceptance: state changes enqueue once; duplicate workers do not duplicate
  messages; critical email fallback is observable.

- [ ] **M14-05 — Scheduled reconciliation and financial alerts**  
  Dependencies: M14-02, M14-03.  
  Reconcile provider transactions, internal payments, ledger, refunds and payouts
  daily; page an owner on unexplained differences.  
  Acceptance: synthetic discrepancies are detected, assigned and resolved by a
  compensating audited action rather than record mutation.

Milestone exit: staging can process and recover the complete transaction matrix
with exact reconciliation and observable delivery.

### Milestone 15 — Security, privacy and reliability

Goal: remove critical technical risks before admitting real customers.

- [ ] **M15-01 — Threat model and trust-boundary review**  
  Dependencies: M11, M12, M13, M14 substantially complete.  
  Model customer, admin, Supabase, storage, Paystack, notification and analytics
  boundaries; prioritize authorization, money and evidence threats.  
  Acceptance: every high-risk threat has a tested control or explicit launch
  blocker owned by a named founder.

- [ ] **M15-02 — RLS and storage adversarial suite**  
  Dependencies: M15-01.  
  Test anonymous, customer A/B, admin and service-role access to every table,
  function and bucket including guessed object paths and oversized uploads.  
  Acceptance: cross-customer and unauthorized admin access are impossible; test
  coverage maps to every policy.

- [ ] **M15-03 — Application and infrastructure security**  
  Dependencies: M15-01.  
  Add headers, request limits, origin rules, rate limits, secret rotation,
  dependency remediation, audit retention and secure logging/redaction.  
  Acceptance: zero critical/high exploitable release defect; accepted dependency
  risk has owner, expiry and compensating control.

- [ ] **M15-04 — Privacy and data lifecycle**  
  Dependencies: counsel-approved policy.  
  Implement consent records, analytics minimization, retention/deletion schedule,
  account-data export/deletion workflow and evidence access restrictions.  
  Acceptance: test users can request export/deletion and operations can complete
  it without exposing another customer or corrupting financial retention records.

- [ ] **M15-05 — Backup, restore and disaster recovery**  
  Dependencies: production-like staging.  
  Configure backups/PITR, document RPO/RTO and rehearse restore into an isolated
  environment including storage metadata and post-restore reconciliation.  
  Acceptance: timed restore meets approved objectives and produces signed
  evidence in the release record.

- [ ] **M15-06 — Observability and incident response**  
  Dependencies: M14.  
  Configure Sentry releases/source maps, structured redacted logs, funnel and
  business metrics, alerts and runbooks for auth, bookings, funds and delivery.  
  Acceptance: synthetic incidents page the correct owner and can be traced by
  correlation ID from client action to server/provider outcome.

Milestone exit: the security and recovery review has no unresolved critical or
high launch blocker.

### Milestone 16 — End-to-end quality and release candidates

Goal: prove the product works as customers and operators will actually use it.

- [ ] **M16-01 — Automated journey suite**  
  Dependencies: M10–M15.  
  Add deterministic web E2E, native integration/device tests and operations E2E
  for browse → brief → request → quote → acceptance → payment → confirmation,
  plus cancellation/refund and fulfillment/review.  
  Acceptance: suites run in CI against isolated data and save useful traces on
  failure.

- [ ] **M16-02 — Failure and concurrency suite**  
  Dependencies: M16-01.  
  Cover offline drafts, retry/reload, double taps, concurrent quotes/bookings,
  stale state, webhook permutations, failed refunds/payouts and notification
  fallback.  
  Acceptance: no duplicate value, booking, message or irreversible partial state.

- [ ] **M16-03 — Visual and accessibility QA**  
  Dependencies: M16-01.  
  Test visual regressions at target web widths and representative iOS/Android
  devices; audit keyboard, screen readers, large text, contrast and reduced motion.  
  Acceptance: zero critical WCAG/native accessibility issue and approved visual
  baselines for every core screen.

- [ ] **M16-04 — Performance and network QA**  
  Dependencies: M16-01.  
  Test public web budgets, authenticated route response, mobile launch/list
  smoothness, image memory, API query count and throttled 3G recovery.  
  Acceptance: public budgets in M10-07 pass; core actions remain understandable
  and recoverable under slow or interrupted networks.

- [ ] **M16-05 — Production-data and migration rehearsal**  
  Dependencies: M15-05.  
  Rehearse migrations, seed only inspected supply, validate redirects, remove
  demonstration accounts/content and verify rollback/forward-fix procedures.  
  Acceptance: production-like rehearsal has no destructive drift and requires no
  manual database edits.

- [ ] **M16-06 — Signed release candidates**  
  Dependencies: M16-01 through M16-05.  
  Produce web preview, operations preview, TestFlight and Play closed-track builds
  from one tagged commit with release notes and reviewer instructions.  
  Acceptance: product/design/engineering/operations owners sign the same artifact
  versions and all automated gates are green.

Milestone exit: one tagged release candidate works end to end on web, iOS and
Android and can be safely operated.

### Milestone 17 — Production launch and controlled MVP

Goal: deploy carefully, rehearse real money and admit the first real cohort.

- [ ] **M17-01 — Production infrastructure and access**  
  Dependencies: M15, M16.  
  Provision production Supabase, web/admin hosts, domains, email, Sentry, analytics,
  backups, secret management, MFA accounts and least-privilege access.  
  Acceptance: infrastructure checklist, access review, health checks and restore
  evidence pass with live payments still disabled.

- [ ] **M17-02 — External launch gates**  
  Dependencies: Paystack, counsel and accounting work.  
  Obtain written Paystack managed-payout approval and legal/accounting/privacy,
  consumer terms, cancellation, refund, chargeback, tax and invoice approvals.  
  Acceptance: linked evidence is marked PASS by the accountable founder. This is
  an external blocker and must never be auto-completed by Codex.

- [ ] **M17-03 — Controlled live-money rehearsal**  
  Dependencies: M17-01, M17-02.  
  Run a small real payment, confirmation, partial/full refund as applicable and
  payout/reversal rehearsal with two-person observation.  
  Acceptance: provider, payment, ledger, refund and payout reconcile 100%; incident
  and rollback actions are demonstrated.

- [ ] **M17-04 — Public web and store release**  
  Dependencies: M17-03.  
  Publish the website, release operations privately, submit/approve iOS and
  Android closed testing, verify production analytics/alerts and keep cohort
  admission closed until smoke tests pass.  
  Acceptance: anonymous discovery, authenticated booking and operations smoke
  tests pass against production without demo data.

- [ ] **M17-05 — Five-partner canary cohort**  
  Dependencies: M17-04.  
  Admit five named design partners, observe without coaching, reconcile daily and
  stop admission on authorization, funds, data loss or support-rescue failures.  
  Acceptance: blocking failures are fixed and reverified; every booking has a
  complete audit and reconciliation trail.

- [ ] **M17-06 — MVP cohort expansion**  
  Dependencies: M17-05.  
  Gradually admit up to 30 qualified couples and the capped inspected vendor
  cohort. Review conversion, turnaround, contribution margin, leakage, support,
  cancellations and disputes weekly.  
  Acceptance: cohort reporting is reproducible and product changes are tied to
  trust, completed bookings or operational safety.

Milestone exit: MMEMME is a shipped MVP serving real Lagos couples on public web,
iOS and Android with safely operated payments.

## 7. Parallel external and founder-owned backlog

These items block launch but cannot be completed by code alone:

- [ ] Twenty couple, ten venue, ten caterer and five planner interviews completed.
- [ ] Five qualified couple design partners scheduled.
- [ ] Ten venues and fifteen caterers conditionally onboarded; launch subset fully
      inspected with normalized packages and owned media rights.
- [ ] Venue and caterer cancellation templates approved and versioned.
- [ ] Customer terms, privacy, refund, dispute, vendor, tax and invoice policies
      approved by qualified Nigerian advisers.
- [ ] Paystack marketplace settlement and payout design approved in writing.
- [ ] Operations owners and two-person money approval coverage scheduled.
- [ ] App Store, Play Console, domain, support email and company identities ready.
- [ ] Permissioned testimonials/references supplied; no fabricated social proof.

## 8. Release blocker policy

The following always block live launch:

- Any critical/high exploitable authorization, privacy or payment defect.
- Any unexplained difference between provider, payment, ledger, refund or payout.
- Any route that lets a client or return URL confirm payment.
- Missing Paystack or adviser approval.
- Unapproved cancellation/consumer terms.
- Failed production backup restore or missing incident owner.
- Missing physical low-end Android/current iOS testing.
- Demo accounts, demo payment flags or uninspected published vendors in production.
- A core customer or operations task requiring a database edit.

## 9. Shipped MVP definition of done

All of the following must be true:

- Public web is fast, indexable, accessible and visually approved.
- Web and mobile offer equivalent discovery, request, quote, payment, booking and
  safety capability.
- Native iOS and Android closed releases are approved and installable.
- Operations performs supply, bookings, support and money workflows without SQL.
- Real payments, refunds and payouts are reconciled and recoverable.
- Every sensitive transition records actor, reason, time and correlation ID.
- Monitoring, alerts, backups, restore and incident procedures are proven.
- External launch gates have linked written approval.
- Five-partner canary completes without an unresolved release blocker.
- The cohort funnel from qualified couple to verified review is measurable across
  platforms without storing unnecessary personal data.

Completing this backlog yields the strongest MVP—not the largest product. New
categories, cities and marketplace automation begin only after the first cohort
shows which operational bottleneck is worth automating.
