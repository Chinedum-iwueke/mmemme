# MMEMME Codex Implementation Backlog

Status: **Execution backlog for a live 100-person MVP pilot**
Last updated: **27 August 2026**
Product scope: **Lagos weddings · venues and caterers · NGN**

## 1. Outcome

This backlog moves MMEMME from a validated local demonstration to a production
MVP that real couples can use on native mobile and the public web.

The shipped product has four surfaces:

1. **Customer mobile app** — an Expo React Native app for iOS and Android.
2. **Public website and customer web app** — a Next.js application that combines
   marketing, indexable vendor discovery and the complete authenticated booking
   journey.
3. **Vendor onboarding workspace** — secure responsive web routes where venues
   and caterers create accounts, submit credentials, build draft profiles and
   packages, respond to review requests and track verification.
4. **Operations console** — a private Next.js application for verification,
   requests, quotes, money operations, customer support and audit.

Mobile and web must provide the same booking capability and operate on the same
Supabase records, state machines and server operations. They may differ in
navigation and presentation, but never in commercial rules, authorization or
booking behavior.

The MVP is shipped only when a real customer can discover an inspected vendor,
request a date, receive and accept a quote, pay through Paystack, receive a
confirmed booking, get support and complete a cancellation or dispute path on
either mobile or web without a database edit. A legitimate venue or caterer must
also be able to apply for verification without founder data entry, while MMEMME
retains final approval and publication control.

## 2. Product and engineering constraints

- Keep Lagos, weddings, venues, caterers and NGN fixed through the MVP.
- Let vendors self-serve account creation, credential submission, draft profiles,
  draft packages and verification corrections on responsive web. Keep final
  verification, publication, booking negotiation and money operations under
  MMEMME operations for this MVP.
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
- Never make uploaded vendor credentials public. Minimize identity data and store
  verification-provider references/results rather than raw NIN/BVN values unless
  qualified Nigerian counsel and the approved provider authorize otherwise.

## 3. Target architecture

```text
apps/mobile       Expo customer app (iOS and Android)
apps/web          Next.js public site + customer app + vendor onboarding workspace
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
- Vendor routes use a distinct vendor role/membership and private storage policies;
  a vendor can access only its own application, drafts and review messages.
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

MMEMME should feel connected, trustworthy, energetic and modern—not like an
ornate wedding invitation or a generic marketplace template. `DESIGN.md` is the
implementation source of truth for mobile, public web, vendor and operations UI.

### Visual direction

- Use the approved deep green (`#294A41`) and lime (`#97C354`) identity with the
  green-influenced neutral and semantic roles defined in `DESIGN.md`.
- Use Bebas Bold only for short brand-led display moments and DM Sans for body,
  labels, prices, forms and operations data. Avoid script fonts in product UI.
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

**Authenticated vendor, responsive web**

```text
Vendor sign up
├── business identity and contacts
├── venue/catering operating details
├── credential and portfolio evidence
├── bank-name verification reference
├── draft profile and packages
└── submit application
    ├── in review
    ├── changes requested
    ├── inspection scheduled
    └── approved / rejected / suspended / expired
```

Vendor onboarding uses a visible checklist, autosaved steps, upload progress,
plain-language reasons and a persistent status timeline. Approval must never be
implied by successful document upload.

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

Every item in milestones 8–18 is P0 or P1. P2 ideas belong in a separate post-MVP
backlog, not in this execution path.

Suggested delivery waves for a small founder-led team using Codex:

| Wave | Work                                                                                     | Dependency rule                                         |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1    | M8 production baseline + M9 design foundation                                            | Start here; locks contracts and quality gates           |
| 2    | M10 public marketplace + M13 vendor onboarding + M14 admin foundations + M15 atomic APIs | Can run in parallel after shared types/tokens           |
| 3    | M11 full customer web + M12 native rebuild + remaining M13/M14/M15                       | Build vertical slices against the same server contracts |
| 4    | M16 security/reliability + M17 release-candidate and capacity proof                      | Begins as flows stabilize; no launch shortcuts          |
| 5    | M18 live deployment and controlled 100-person cohort                                     | Requires every code and external gate                   |

The critical path is M8 → M13/M15 → M11/M12/M14 → M16 → M17 → M18. Public
marketing work may progress in parallel, but transaction hardening—not page
count—determines the live-launch date. Calendar estimates should be created only
after M8-01 measures the prototype debt and the available human review capacity.

## 6. Engineering milestones

### Milestone 8 — Production baseline and architecture lock

Goal: turn the demo repository into a repeatable, maintainable production base.

- [x] **M8-01 — Current-state audit and debt register**
      Dependencies: none.
      Inventory demo-only branches, hard-coded dates/addresses, generated files,
      untyped Supabase results, dependency advisories, missing tests and incomplete
      milestone 0–7 exit criteria. Create `docs/ENGINEERING_DEBT.md` with severity,
      owner and release disposition.
      Acceptance: every known release blocker is either scheduled below or explicitly
      deferred with rationale.

- [x] **M8-02 — Workspace and application boundaries**
      Dependencies: M8-01.
      Scaffold `apps/web`; move shared code only where two real consumers exist;
      create `packages/tokens` and `packages/config`; keep web, mobile and operations
      deployments independently buildable.
      Acceptance: all three apps build from a clean checkout and no client imports
      admin/server-only code.

- [x] **M8-03 — Generated database types and typed server contracts**
      Dependencies: M8-02.
      Generate Supabase types in CI, type all queries and Edge Function payloads, add
      shared request/response schemas and eliminate material `any` usage from booking,
      payment, refund and dispute paths.
      Acceptance: schema drift fails CI and malformed server input receives a stable
      machine-readable error code plus safe customer message.

- [x] **M8-04 — Tooling and continuous integration**
      Dependencies: M8-02.
      Add ESLint, Prettier check, unit/integration test projects, SQL lint, Expo Doctor,
      web/admin builds, secret scanning, migration verification and dependency audit
      to GitHub Actions. Cache dependencies without caching secrets.
      Acceptance: a fresh branch runs the complete quality gate; a deliberately bad
      type, formatting error, unsafe migration and secret fixture each fail the
      appropriate check.

- [x] **M8-05 — Environment and feature-flag contract**
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

- [x] **M9-01 — Brand and interface specification**
      Dependencies: M8-02.
      Maintain root `DESIGN.md` covering logo use, color roles,
      typography, photography, iconography, spacing, radii, elevation, motion,
      content voice and accessibility. Include examples for trust, price and status
      communication.
      Acceptance: mobile, public web and operations examples use the same semantic
      tokens and pass contrast checks.

- [x] **M9-02 — Shared design tokens**
      Dependencies: M9-01.
      Implement typed primitive and semantic tokens for color, typography, spacing,
      radius, elevation and motion. Export CSS variables for Next.js and TypeScript
      values for React Native.
      Acceptance: no core flow depends on unexplained one-off colors or spacing;
      token builds are deterministic.

- [x] **M9-03 — Web component foundation**
      Dependencies: M9-02.
      Build accessible button, link, input, select, date input, currency display,
      badge, card, dialog, sheet, toast, skeleton, empty state, error state, image,
      breadcrumbs, pagination and form-error components. Add Storybook or an
      equivalent visual catalogue.
      Acceptance: keyboard, focus, screen-reader and responsive component tests pass.

- [x] **M9-04 — Native component foundation**
      Dependencies: M9-02.
      Build native equivalents with safe areas, keyboard avoidance, haptics only
      where meaningful, 44-point targets and platform-correct navigation behavior.
      Add a development component gallery.
      Acceptance: component gallery passes font scaling to 200%, VoiceOver/TalkBack
      labels and small Android viewport checks.

- [x] **M9-05 — Cross-platform content and status language**
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

- [x] **M10-01 — Public shell and navigation**
      Dependencies: M9-03.
      Implement responsive header, mobile navigation, footer, skip link, contact and
      legal navigation, persistent but non-obstructive sign-in/bookings access.
      Acceptance: complete keyboard navigation, no horizontal overflow and no content
      hidden behind fixed UI at all target widths.

- [x] **M10-02 — Search-first home page**
      Dependencies: M10-01.
      Build an editorial hero with wedding date/area/category search, curated venue
      and caterer sections, verification explanation, how booking works, real proof
      placeholders driven by approved CMS/data fields and a vendor-enquiry CTA.
      Do not invent booking counts or testimonials.
      Acceptance: a guest reaches relevant results in one primary action; marketing
      content remains useful with JavaScript disabled where practical.

- [x] **M10-03 — Category and search results**
      Dependencies: M10-02, M8-03.
      Add indexable venue and caterer pages, URL-backed filters, sort limited to
      explicit non-promoted rules, pagination, result count and mobile filter sheet.
      Preserve search state through navigation and sign-in.
      Acceptance: copied URLs reproduce results; only approved published supply is
      visible; filters never imply live availability.

- [x] **M10-04 — Public vendor profiles**
      Dependencies: M10-03.
      Implement responsive gallery, optimized images, summary facts, price guidance,
      capacity, area, packages, inclusions, verification evidence/date/expiry,
      cancellation-policy preview and related curated vendors.
      Acceptance: critical facts appear before marketing prose, private evidence is
      inaccessible, expired verification is visibly disclosed and images do not
      cause layout shifts.

- [x] **M10-05 — Marketing and trust pages**
      Dependencies: M10-01.
      Create How It Works, Verification & Safety, For Vendors, About, Contact, Privacy,
      Terms, Refund/Cancellation and Dispute pages. Legal text remains versioned and
      counsel-approved; placeholders cannot be deployed as final terms.
      Acceptance: all required footer links resolve, versions are recorded and
      structured content is readable on small screens.

- [x] **M10-06 — Search visibility and sharing**
      Dependencies: M10-03, M10-04.
      Add page metadata, canonical URLs, sitemap, robots policy, Open Graph images,
      structured data where accurate, redirects and branded 404/500 states.
      Acceptance: metadata tests pass; preview is no-index; production excludes
      authenticated/private routes from indexing.

- [x] **M10-07 — Public performance budget**
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

- [x] **M11-01 — Web authentication and session recovery**
      Dependencies: M8-05, M9-03, M10-03.
      Implement Nigerian phone OTP, resend/rate-limit states, profile completion,
      secure cookies, sign-out and return-to-intent after authentication.
      Acceptance: authentication returns the customer to the exact saved/requested
      action; sessions work across tabs without exposing tokens to logs.

- [x] **M11-02 — Wedding brief and shortlist**
      Dependencies: M11-01.
      Implement autosaved five-question brief, skip-to-browse, edit flow, shortlist
      and graceful local draft recovery. Reconcile anonymous state after sign-in.
      Acceptance: refresh, back navigation, brief edits and temporary network failure
      do not lose work or duplicate records.

- [x] **M11-03 — Web booking request**
      Dependencies: M11-02, M10-04.
      Implement package selection, guest count, requirements, date confirmation and
      the explicit “availability not yet confirmed” acknowledgement. Use the same
      idempotent server operation as mobile.
      Acceptance: retries create one request; invalid vendor/package combinations
      fail server-side; success appears in web, mobile and operations immediately.

- [x] **M11-04 — Customer booking workspace**
      Dependencies: M11-03.
      Build booking list, detail, human-readable timeline, quote, revision history,
      expiry, terms acceptance, receipt and next actions. Provide useful desktop
      two-column and focused mobile layouts.
      Acceptance: all states have a clear primary action or explanation; stale quote
      acceptance is rejected and refreshed.

- [x] **M11-05 — Hosted checkout and recovery**
      Dependencies: M11-04, M15-02.
      Launch Paystack hosted checkout, handle abandonment and return, poll/subscribe
      for authoritative confirmation and recover after tab close or network loss.
      Acceptance: a return URL never confirms value; one successful provider event
      produces one payment, ledger set, payout and confirmation.

- [x] **M11-06 — Web support and safety**
      Dependencies: M11-04, M15-03.
      Implement booking support, cancellation preview/request, refund status, dispute
      opening/evidence, fulfillment confirmation and eligible verified review.
      Acceptance: uploads enforce type/size/access; every exception state has a clear
      customer explanation and operations rescue path.

- [x] **M11-07 — Cross-device continuity**
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

- [x] **M12-01 — Native navigation and app shell**
      Dependencies: M9-04, M9-05.
      Implement Discover, Brief/Shortlist, Bookings and Profile navigation, deep links,
      safe-area handling, auth return intent and notification routing.
      Acceptance: Android back, iOS gestures, cold-start deep links and restored
      sessions behave predictably.

- [x] **M12-02 — Discovery and vendor-profile redesign**
      Dependencies: M12-01, M10-04.
      Build virtualized results, filter sheet, image gallery, package comparison and
      prominent verification disclosures using shared tokens and content contracts.
      Acceptance: smooth on representative low-end Android, no unbounded image memory
      usage and complete screen-reader order.

- [x] **M12-03 — Brief, shortlist and request redesign**
      Dependencies: M12-02.
      Add focused steps, progress, inline validation, draft recovery, package/date
      review and idempotent request submission.
      Acceptance: keyboard never covers the active input; app termination preserves
      drafts; repeat taps create one request.

- [x] **M12-04 — Quote, checkout and confirmation redesign**
      Dependencies: M12-03, M15-02.
      Present exact money, inclusions, exclusions, expiry and cancellation impact;
      implement hosted checkout, confirming state, recovery and receipt.
      Acceptance: money is consistently formatted in NGN; customer cannot confuse
      payment return with booking confirmation.

- [x] **M12-05 — Booking management and safety redesign**
      Dependencies: M12-04, M15-03.
      Polish timeline, support, reminders, cancellation, refund, dispute evidence,
      fulfillment and verified reviews.
      Acceptance: all exception states remain usable with large text, screen reader
      and intermittent connectivity.

- [x] **M12-06 — Native lifecycle and notifications**
      Dependencies: M12-01, M15-04.
      Handle push permissions contextually, token rotation, foreground/background
      behavior, email fallback, app updates and expired sessions.
      Acceptance: notification retries do not duplicate customer messages and every
      deep link has an authenticated recovery route.

Milestone exit: signed preview builds pass complete customer journeys on current
iOS and representative low-end Android hardware.

### Milestone 13 — Vendor accounts, applications and verification

Goal: let legitimate Lagos venues and caterers apply and maintain verification
information through a secure, usable web workspace while MMEMME retains approval.

Vendor application state:

```text
draft → submitted → in_review → inspection_pending → approved
                       ↘ changes_requested → submitted
exceptions: rejected | withdrawn | expired | suspended
```

- [x] **M13-01 — Vendor identity and membership model**
      Dependencies: M8-03, M8-05.
      Add `vendor_accounts`, `vendor_memberships`, `vendor_applications`, versioned
      credential requirements, reviewer assignments and state events. Support one
      owner plus invited team members with least-privilege roles. Keep customer,
      vendor and admin authorization distinct even if one person has multiple roles.
      Acceptance: a vendor member sees only its organization; role escalation,
      cross-vendor reads and unauthorized application transitions fail under RLS and
      server tests.

- [x] **M13-02 — Vendor sign-up and account recovery**
      Dependencies: M13-01, M9-03.
      Add the public “List your business” entry point, verified email and Nigerian
      phone, consent, business category, secure session recovery, team invitation and
      explicit sign-out. Prevent enumeration and rate-limit creation/recovery.
      Acceptance: a new venue or caterer creates and recovers an account, resumes the
      exact onboarding step and cannot enter the customer or admin role accidentally.

- [x] **M13-03 — Autosaved onboarding workflow**
      Dependencies: M13-02.
      Build responsive steps for legal/business name, trading name, contacts, category,
      Lagos address/service area, capacity, business or operating-authority evidence,
      owner/director identity verification reference, proof of operating site,
      references and policy consent. Requirements are category/version driven, not
      hard-coded across components.
      Acceptance: progress survives refresh, intermittent connectivity and re-login;
      missing or invalid requirements are explained before submission.

- [x] **M13-04 — Private credential and media uploads**
      Dependencies: M13-03, M8-03.
      Add direct-to-private-storage uploads with signed access, progress, retry,
      virus/malware scanning, type/size/page limits, EXIF stripping where appropriate,
      document expiry and evidence metadata. Separate private credentials from public
      portfolio media and record ownership/usage consent.
      Acceptance: guessed URLs and other vendors cannot access files; unsafe or
      oversized files are quarantined/rejected; operators receive time-limited access
      with audit events.

- [x] **M13-05 — Bank and identity verification integration boundary**
      Dependencies: adviser/provider choice, M13-04.
      Implement a provider adapter that stores request IDs, result summaries, consent,
      timestamps and reviewer decisions. Do not persist raw NIN/BVN values in MMEMME
      tables or logs unless the approved legal/security design explicitly requires it.
      Acceptance: sandbox success/failure/manual-review states are testable; provider
      downtime does not lose the application or imply approval.

- [x] **M13-06 — Draft listing and package builder**
      Dependencies: M13-03, M9-03.
      Let vendors create a draft public profile, upload owned media, enter normalized
      capacity/area/price guidance and create venue or catering packages with
      inclusions/exclusions. Preview uses the real public profile components.
      Acceptance: drafts are never publicly indexable; invalid category/package data
      is rejected server-side; vendor edits cannot rewrite historical quotes.

- [x] **M13-07 — Submission, changes and verification status**
      Dependencies: M13-04 through M13-06, M14-02.
      Add application review summary, attestation, immutable submission snapshot,
      status timeline, operator change requests, structured vendor responses,
      inspection scheduling acknowledgement, approval/rejection reasons and expiry
      reminders.
      Acceptance: submission is idempotent; vendors see clear next steps; only an
      authorized operator can approve, reject, suspend or publish.

- [x] **M13-08 — Verified vendor maintenance**
      Dependencies: M13-07.
      Allow approved vendors to propose profile/package changes and renew expiring
      credentials. Material verification fields create a review request rather than
      changing the live listing immediately.
      Acceptance: approved live data remains stable until reviewed, every change is
      attributable and expiry/suspension affects publication according to policy.

- [x] **M13-09 — Vendor communications and onboarding analytics**
      Dependencies: M13-07, M15-04.
      Send received, changes-requested, inspection, approved, rejected and expiry
      emails; instrument consented funnel steps without sending credential contents
      to analytics.
      Acceptance: notifications are deduplicated and redacted; operations can measure
      step completion, review time and rejection reasons without viewing secrets in
      analytics tools.

Milestone exit: a new venue or caterer can create an account, complete and submit
the applicable verification package, respond to corrections and reach an
operator-approved published profile without founders entering application data.

### Milestone 14 — Operations console productionization

Goal: enable founders to operate the MVP safely without database access.

- [ ] **M14-01 — Admin identity and authorization**
      Dependencies: M8-05.
      Enforce MFA, server-side role checks, session timeout, revocation and least
      privilege. Replace local bypasses with environment-bound test helpers.
      Acceptance: non-admin and AAL1 sessions cannot access or mutate admin data;
      authorization tests cover every server action.

- [ ] **M14-02 — Supply and verification workspace**
      Dependencies: M9-03, M13-01, M14-01.
      Complete application queues, credential/evidence review, change requests,
      provider result review, inspection recording, approval/rejection/suspension,
      vendor/package editing, publication validation, expiry and change history.
      Acceptance: an operator can review and publish vendor-submitted supply without
      SQL; dual-role conflicts are visible; incomplete, expired or suspended
      verification blocks or unpublishes according to approved policy.

- [ ] **M14-03 — Booking operations workspace**
      Dependencies: M14-01.
      Implement queues, SLA/overdue state, ownership, vendor-contact log, decline,
      quote issue/revision/expiry and customer notification preview.
      Acceptance: request to accepted quote requires no database edit and every
      action records actor, reason and correlation ID.

- [ ] **M14-04 — Support, dispute and cancellation workspace**
      Dependencies: M14-03, M15-03.
      Build unified booking context, evidence timeline, policy calculation, response
      templates, assignment and resolution.
      Acceptance: operations can rescue every defined state while customers see the
      matching outcome on both clients.

- [ ] **M14-05 — Money and reconciliation workspace**
      Dependencies: M14-01, M15-02, M15-03.
      Complete ledger, refunds, dual approvals, payout eligibility, provider state,
      chargebacks, reversals, daily reconciliation and exception ownership.
      Acceptance: money-moving actions require two distinct authorized people where
      specified; no successful payment lacks a matched ledger and held payout.

- [ ] **M14-06 — Operational usability**
      Dependencies: M14-02 through M14-05.
      Add global correlation/reference search, saved queues, pagination, loading and
      error recovery, safe confirmations, activity history and export with redaction.
      Acceptance: founders complete the first-cohort runbook without SQL or browser
      developer tools.

Milestone exit: operations can onboard supply, process bookings, support users and
reconcile money with complete authorization and audit evidence.

### Milestone 15 — Transaction, policy and notification hardening

Goal: make all server-owned behavior safe enough for real transactions.

- [ ] **M15-01 — Atomic state-transition API**
      Dependencies: M8-03.
      Move multi-write admin flows into transactional database functions, enforce
      transition matrices and optimistic concurrency, and return stable errors.
      Acceptance: injected failures cannot leave partial cancellation, refund, quote,
      booking or payout state.

- [ ] **M15-02 — Paystack staging certification**
      Dependencies: M15-01.
      Test initialization, signature validation, server verification, amount/currency
      mismatch, unknown references, abandonment, duplicate/delayed/reordered events,
      network loss and chargebacks using Paystack test mode.
      Acceptance: 100% payment/ledger/payout reconciliation across the automated
      matrix and no client-controlled confirmation path.

- [ ] **M15-03 — Refund, cancellation, dispute and payout policy engine**
      Dependencies: M15-01 and approved policy versions.
      Replace demo cancellation percentages with versioned venue/caterer policies;
      make approval and provider operations recoverable and auditable.
      Acceptance: boundary-date tests, partial/full refunds, failures, reversals and
      dual approvals match approved policy examples exactly.

- [ ] **M15-04 — Notification delivery service**
      Dependencies: M8-05, M9-05.
      Add an outbox/worker schedule, preference checks, Expo receipts, token cleanup,
      Resend idempotency, retry/backoff and delivery diagnostics.
      Acceptance: state changes enqueue once; duplicate workers do not duplicate
      messages; critical email fallback is observable.

- [ ] **M15-05 — Scheduled reconciliation and financial alerts**
      Dependencies: M15-02, M15-03.
      Reconcile provider transactions, internal payments, ledger, refunds and payouts
      daily; page an owner on unexplained differences.
      Acceptance: synthetic discrepancies are detected, assigned and resolved by a
      compensating audited action rather than record mutation.

Milestone exit: staging can process and recover the complete transaction matrix
with exact reconciliation and observable delivery.

### Milestone 16 — Security, privacy and reliability

Goal: remove critical technical risks before admitting real customers.

- [ ] **M16-01 — Threat model and trust-boundary review**
      Dependencies: M11 through M15 substantially complete.
      Model customer, vendor, admin, Supabase, credential provider, storage, Paystack,
      notification and analytics boundaries; prioritize authorization, credentials,
      money and evidence threats.
      Acceptance: every high-risk threat has a tested control or explicit launch
      blocker owned by a named founder.

- [ ] **M16-02 — RLS and storage adversarial suite**
      Dependencies: M16-01.
      Test anonymous, customer A/B, vendor A/B, admin and service-role access to every
      table, function and bucket including guessed object paths and oversized uploads.
      Acceptance: cross-customer, cross-vendor and unauthorized admin access are
      impossible; test coverage maps to every policy.

- [ ] **M16-03 — Application and infrastructure security**
      Dependencies: M16-01.
      Add headers, request limits, origin rules, rate limits, secret rotation,
      dependency remediation, audit retention and secure logging/redaction.
      Acceptance: zero critical/high exploitable release defect; accepted dependency
      risk has owner, expiry and compensating control.

- [ ] **M16-04 — Privacy and data lifecycle**
      Dependencies: counsel-approved policy.
      Implement consent records, analytics minimization, retention/deletion schedule,
      account-data export/deletion workflow and evidence access restrictions.
      Acceptance: test users can request export/deletion and operations can complete
      it without exposing another customer or corrupting financial retention records.

- [ ] **M16-05 — Backup, restore and disaster recovery**
      Dependencies: production-like staging.
      Configure backups/PITR, document RPO/RTO and rehearse restore into an isolated
      environment including storage metadata and post-restore reconciliation.
      Acceptance: timed restore meets approved objectives and produces signed
      evidence in the release record.

- [ ] **M16-06 — Observability and incident response**
      Dependencies: M15.
      Configure Sentry releases/source maps, structured redacted logs, funnel and
      business metrics, alerts and runbooks for auth, bookings, funds and delivery.
      Acceptance: synthetic incidents page the correct owner and can be traced by
      correlation ID from client action to server/provider outcome.

Milestone exit: the security and recovery review has no unresolved critical or
high launch blocker.

### Milestone 17 — End-to-end quality and release candidates

Goal: prove the product works as customers and operators will actually use it.

- [ ] **M17-01 — Automated journey suite**
      Dependencies: M10–M16.
      Add deterministic web E2E, native integration/device tests and operations E2E
      for browse → brief → request → quote → acceptance → payment → confirmation,
      plus cancellation/refund and fulfillment/review. Add vendor E2E for sign-up →
      credential submission → changes requested → inspection → approval → publish.
      Acceptance: suites run in CI against isolated data and save useful traces on
      failure.

- [ ] **M17-02 — Failure and concurrency suite**
      Dependencies: M17-01.
      Cover offline drafts, retry/reload, double taps, concurrent quotes/bookings,
      stale state, webhook permutations, failed refunds/payouts and notification
      fallback.
      Acceptance: no duplicate value, booking, message or irreversible partial state.

- [ ] **M17-03 — Visual and accessibility QA**
      Dependencies: M17-01.
      Test visual regressions at target web widths and representative iOS/Android
      devices; audit keyboard, screen readers, large text, contrast and reduced motion.
      Acceptance: zero critical WCAG/native accessibility issue and approved visual
      baselines for every core screen.

- [ ] **M17-04 — Performance and network QA**
      Dependencies: M17-01.
      Test public web budgets, authenticated route response, mobile launch/list
      smoothness, image memory, API query count and throttled 3G recovery.
      Acceptance: public budgets in M10-07 pass; core actions remain understandable
      and recoverable under slow or interrupted networks.

- [ ] **M17-05 — Production-data and migration rehearsal**
      Dependencies: M16-05.
      Rehearse migrations, seed only inspected supply, validate redirects, remove
      demonstration accounts/content and verify rollback/forward-fix procedures.
      Acceptance: production-like rehearsal has no destructive drift and requires no
      manual database edits.

- [ ] **M17-06 — Signed release candidates**
      Dependencies: M17-01 through M17-05.
      Produce web preview, operations preview, TestFlight and Play closed-track builds
      from one tagged commit with release notes and reviewer instructions.
      Acceptance: product/design/engineering/operations owners sign the same artifact
      versions and all automated gates are green.

- [ ] **M17-07 — 100-person pilot capacity and soak test**
      Dependencies: M17-01, M17-02, production-like staging.
      Create a privacy-safe k6 or equivalent workload representing 100 registered
      pilot participants, at least 25 concurrently active browsers, vendor uploads,
      search traffic, OTP throttling, booking requests, operations queues and webhook
      bursts. Run a sustained soak test, query-plan review and connection/storage
      quota check; do not send synthetic real payment transactions.
      Acceptance: no authorization or data-isolation failure; zero lost/duplicated
      requests; p95 read API ≤800ms and p95 server mutation ≤1.5s excluding external
      providers under the agreed staging load; error rate <1%; alerts fire before
      service exhaustion; Supabase, hosting, email, SMS, storage and notification
      quotas have at least 2× the forecast pilot headroom.

Milestone exit: one tagged release candidate works end to end on web, iOS and
Android, passes vendor onboarding and the 100-person capacity profile, and can be
safely operated.

### Milestone 18 — Production launch and controlled MVP

Goal: perform the actual live deployment, rehearse real money and gradually admit
at least 100 invited pilot participants with measurable service objectives.

- [ ] **M18-01 — Production accounts, ownership and DNS**
      Dependencies: M16, M17.
      Create company-owned Supabase, Vercel or selected web host, Expo/EAS, Apple,
      Google Play, Paystack, Resend/email, SMS, Sentry and analytics projects. Configure
      billing alerts, recovery owners, MFA, least privilege, custom domains, DNS,
      SPF/DKIM/DMARC, support addresses and a secure secret manager. No production
      account may depend solely on one founder's personal identity.
      Acceptance: ownership/access matrix is signed, two founders can recover critical
      services, domain/email checks pass and live payments remain disabled.

- [ ] **M18-02 — Production Supabase and data-plane deployment**
      Dependencies: M18-01, M17-05.
      Provision the production region/project, Auth providers and redirect allowlist,
      database extensions, storage buckets, private/public policies, scheduled jobs,
      connection limits, PITR/backups and SMTP. Apply migrations through a protected
      CI deployment job, deploy only production-approved Edge Functions and create the
      first MFA admins through an audited bootstrap procedure.
      Acceptance: clean production migration, schema/type checksum, RLS/storage suite,
      backup verification and health probes pass; demo function/account/seed queries
      return no production records.

- [ ] **M18-03 — Web, vendor and operations deployment pipeline**
      Dependencies: M18-01, M18-02.
      Configure preview/staging/production projects, branch protection, environment
      promotion, build provenance, source maps, security headers, CSP, custom domains,
      no-index preview policy, cache invalidation, health endpoints and instant app
      rollback. Deploy public/customer/vendor web independently from the private admin
      app and restrict admin origin/access as approved.
      Acceptance: tagged releases promote the same tested commit; deployment smoke
      tests cover public search, customer auth, vendor auth and admin MFA; rollback is
      rehearsed without rolling back financial migrations.

- [ ] **M18-04 — iOS and Android production delivery**
      Dependencies: M18-01, M18-02, M17-06.
      Configure EAS credentials, bundle identifiers, universal/app links, push keys,
      privacy manifests, store disclosures, screenshots, support/privacy URLs,
      TestFlight and Play closed testing. Create reproducible signed builds from the
      tagged release with demo/live flags compiled to their production-safe values.
      Acceptance: external TestFlight and Play testers install, authenticate, deep
      link and complete the staging/production-safe smoke journey; store review issues
      are resolved and crash-free startup is observed.

- [ ] **M18-05 — Production monitoring, runbooks and on-call**
      Dependencies: M18-02 through M18-04.
      Connect Sentry releases, uptime checks, redacted logs, product/business metrics,
      Paystack webhook/reconciliation alerts, queue/delivery alerts and billing/quota
      alarms. Publish incident, rollback, customer communication, vendor verification,
      refund and payout runbooks with primary/backup owners for pilot hours.
      Acceptance: synthetic web, mobile, auth, vendor-upload, webhook and reconciliation
      failures reach the correct human; each alert links to a tested runbook.

- [ ] **M18-06 — External launch gates**
      Dependencies: Paystack, counsel and accounting work.
      Obtain written Paystack managed-payout approval and legal/accounting/privacy,
      consumer/vendor and credential-processing terms, cancellation, refund,
      chargeback, tax and invoice approvals plus the chosen identity/bank verification
      provider's production approval.
      Acceptance: linked evidence is marked PASS by the accountable founder. This is
      an external blocker and must never be auto-completed by Codex.

- [ ] **M18-07 — Controlled production live-money rehearsal**
      Dependencies: M18-02 through M18-06.
      Run a small real payment, confirmation, partial/full refund as applicable and
      payout/reversal rehearsal with two-person observation using a real approved
      vendor/application and an explicitly authorized test booking.
      Acceptance: provider, payment, ledger, refund and payout reconcile 100%; incident
      and rollback actions are demonstrated; no raw sensitive credential appears in
      logs, analytics or customer-visible data.

- [ ] **M18-08 — Production smoke and five-person canary**
      Dependencies: M18-07.
      Publish the website, keep mobile in controlled distribution and admit five named
      customers plus at least two applying vendors. Observe without coaching, review
      each vendor application, reconcile daily and stop on authorization, funds,
      credential exposure, data loss or unrescuable support failure.
      Acceptance: public search, customer booking, vendor application and operations
      workflows complete against production; blocking failures are fixed/reverified;
      every transaction and verification decision has an audit trail.

- [ ] **M18-09 — Staged 100-person pilot rollout**
      Dependencies: M18-08.
      Admit invited participants in cumulative cohorts of 5 → 20 → 50 → 100, with a
      written go/hold decision after each stage. The 100 may include customers and
      vendors, but cohort reporting must distinguish roles and qualified customer
      demand. Maintain staffed support, daily money reconciliation, credential review
      SLA and weekly funnel/unit-economics review.
      Acceptance: at least 100 invited people can authenticate and use their relevant
      workflow; availability during staffed pilot windows is ≥99.5%; zero unresolved
      critical fund, authorization, credential-privacy or data-loss incident; p95 and
      error objectives from M17-07 hold in production; cohort metrics and feedback are
      reproducible by role and platform.

Milestone exit: MMEMME is a live, monitored and recoverable product serving at
least 100 invited pilot participants across public web, customer web, vendor web,
iOS and Android with safely operated verification and payments.

## 7. Parallel external and founder-owned backlog

These items block launch but cannot be completed by code alone:

- [ ] Twenty couple, ten venue, ten caterer and five planner interviews completed.
- [ ] Five qualified couple design partners scheduled.
- [ ] Ten venues and fifteen caterers conditionally onboarded; launch subset fully
      inspected with normalized packages and owned media rights.
- [ ] Venue and caterer cancellation templates approved and versioned.
- [ ] Customer terms, privacy, refund, dispute, vendor, tax and invoice policies
      approved by qualified Nigerian advisers.
- [ ] Vendor credential checklist, consent, retention and deletion rules approved;
      identity/bank verification provider and data-processing terms approved.
- [ ] Paystack marketplace settlement and payout design approved in writing.
- [ ] Operations owners and two-person money approval coverage scheduled.
- [ ] App Store, Play Console, domain, support email and company identities ready.
- [ ] Permissioned testimonials/references supplied; no fabricated social proof.

## 8. Release blocker policy

The following always block live launch:

- Any critical/high exploitable authorization, privacy or payment defect.
- Any vendor credential accessible to another vendor, customer, public URL or
  unauthorized operator.
- Any unexplained difference between provider, payment, ledger, refund or payout.
- Any route that lets a client or return URL confirm payment.
- Missing Paystack or adviser approval.
- Unapproved cancellation/consumer terms.
- Unapproved vendor verification requirements, credential retention or provider.
- Failed production backup restore or missing incident owner.
- Missing physical low-end Android/current iOS testing.
- Demo accounts, demo payment flags or uninspected published vendors in production.
- A core customer, vendor or operations task requiring a database edit.

## 9. Shipped MVP definition of done

All of the following must be true:

- Public web is fast, indexable, accessible and visually approved.
- Web and mobile offer equivalent discovery, request, quote, payment, booking and
  safety capability.
- Vendors can sign up on the web, submit required credentials and draft listing
  data, respond to changes and track verification without founder data entry.
- Operations can review credentials, record inspection, approve/reject/suspend
  verification and publish listings without SQL.
- Native iOS and Android closed releases are approved and installable.
- Operations performs supply, bookings, support and money workflows without SQL.
- Real payments, refunds and payouts are reconciled and recoverable.
- Every sensitive transition records actor, reason, time and correlation ID.
- Monitoring, alerts, backups, restore and incident procedures are proven.
- External launch gates have linked written approval.
- Five-partner canary and staged 100-person pilot complete without an unresolved
  critical fund, authorization, credential-privacy or data-loss incident.
- The cohort funnel from qualified couple to verified review is measurable across
  platforms without storing unnecessary personal data.

Completing this backlog yields the strongest MVP—not the largest product. New
categories, cities and marketplace automation begin only after the first cohort
shows which operational bottleneck is worth automating.
