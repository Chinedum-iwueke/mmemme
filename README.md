# MMEMME

MMEMME is a managed wedding marketplace for Lagos couples booking curated venues
and caterers. It brings discovery, structured requests, quote approval, deposit
payment, booking status, support and post-event review into one accountable flow.

The initial product is intentionally narrow: Lagos weddings, naira payments,
venues and caterers. MMEMME operates the marketplace and verification process
during the first release rather than exposing an unmoderated vendor directory.

## Project status

**Pre-production beta candidate. Not yet approved for live bookings, payments or
production identity verification.**

The core product and operational foundations through engineering milestone 16 are
implemented. The repository currently includes working customer web and mobile
experiences, vendor onboarding, an internal operations console, transaction state
machines, privacy controls and provider integration boundaries.

Milestones 17 and 18 remain open. They cover end-to-end release testing,
accessibility and performance QA, production infrastructure, app-store delivery,
external provider approvals, a controlled live-money rehearsal and staged rollout
to the first 100 participants.

Recruitment and supervised staging demonstrations may begin now. Do not accept
real deposits or collect NINs, identity documents or selfies through MMEMME forms,
email, WhatsApp or support until the corresponding production gates pass.

See [Launch readiness](docs/MMEMME_LAUNCH_READINESS.md) for the current go/no-go
position and [Engineering debt](docs/ENGINEERING_DEBT.md) for unresolved release
risks.

## Product surfaces

- **Customer mobile app** — Expo React Native app for discovery, wedding briefs,
  shortlists, booking requests, quotes, checkout recovery and booking management.
- **Public website and customer web app** — indexable marketing and marketplace
  pages with web parity for search, requests, bookings, support and account safety.
- **Vendor workspace** — responsive web onboarding for venues and caterers,
  including listings, packages, private credentials, verification and corrections.
- **Operations console** — private Next.js console for supply review, quotes,
  booking operations, disputes, cancellations, refunds, payouts and reconciliation.
- **Supabase backend** — PostgreSQL migrations, row-level security, private storage,
  authentication and server-side Edge Functions.

## What is implemented

### Customers

- Guest browsing, category pages, search and detailed vendor profiles.
- Wedding brief, shortlist and cross-device draft continuity.
- Authenticated booking requests with separate venue and caterer bookings.
- Quote review and acceptance, hosted checkout return handling and booking timeline.
- Support messages, cancellation requests, disputes, fulfillment and verified reviews.
- Optional account trust flow for verified email, NINAuth and hosted ID/selfie checks.

### Vendors and operations

- Venue or caterer signup, membership roles and resumable onboarding.
- Draft listings, packages, portfolio media and private credential uploads.
- Inspection, change-request, verification, approval, expiry and maintenance states.
- Operations queues for vendors, bookings, customer support and financial controls.
- Immutable audit history and two-person controls for sensitive money operations.

### Payments, identity and safety

- Paystack sandbox transaction initialization and signed webhook processing.
- Server verification of payment status, reference, currency and amount before value
  is provided.
- Append-only ledger entries, refunds, payout eligibility and reconciliation reports.
- NINAuth authorization-code flow with state, nonce, PKCE and backend token validation.
- Hosted identity-proofing boundary for document authenticity, selfie liveness and
  face match. MMEMME stores minimized outcomes, not raw ID images or biometrics.
- Row-level security, private storage, retention jobs, account export/deletion,
  observability boundaries and disaster-recovery runbooks.

Provider boundaries are implemented, but real identity checks remain unavailable
until MMEMME contracts approved providers, completes the biometric privacy review and
configures production credentials. Ordinary payment settlement is never described as
escrow.

## Architecture

This is a TypeScript npm-workspaces monorepo:

```text
apps/mobile       Expo React Native customer app
apps/web          Next.js public website, customer app and vendor workspace
apps/admin        Next.js internal operations console
packages/config   Validated environment and feature-flag contracts
packages/database Generated Supabase database types
packages/domain   Shared schemas, state machines and presentation contracts
packages/tokens   Cross-platform design tokens
supabase          Migrations, tests, storage policies and Edge Functions
docs              Product, engineering, security and operations documentation
```

Core state transitions and money decisions run on the server. Clients never mark a
payment successful, approve a vendor, issue a refund or authorize a payout directly.

## Local development

### Prerequisites

- Node.js with npm 11.9.0 (`npm install --global npm@11.9.0`)
- Docker Desktop or another Docker-compatible runtime
- Git
- Xcode for an iOS simulator, or Android Studio for an Android emulator
- Expo Go or a development build for physical-device testing

### Install and start Supabase

```bash
git clone https://github.com/Chinedum-iwueke/mmemme.git
cd mmemme
npm ci
SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=local-test-token npm run db:start
npm run db:reset
```

Run `npx supabase status -o env`, then use `.env.example` as the field map for:

```text
apps/web/.env.local
apps/admin/.env.local
apps/mobile/.env.local
```

Use the local Supabase project URL and publishable key for the public client values.
Keep service-role, Paystack and provider secrets out of every `NEXT_PUBLIC_*` and
`EXPO_PUBLIC_*` variable.

For a physical phone, replace `127.0.0.1` with the computer's LAN IP in the mobile
Supabase and web URLs. The computer and phone must be able to reach each other.

### Run each surface

```bash
npm run dev:web       # public website and customer/vendor web app
npm run dev:admin     # internal operations console
npm run dev:mobile    # Expo development server
```

The deterministic local OTP is `123456` for `+234 801 234 5678`. Full demo accounts,
payment simulation and LAN instructions are documented in
[MMEMME local demo](docs/MMEMME_LOCAL_DEMO.md). Local simulation must never be enabled
in preview or production.

## Quality checks

```bash
npm run typecheck
npm test
npm run db:test
npm run quality
```

`npm run bootstrap` is the clean-checkout verification path after Docker and all
required local environment values are available. It installs dependencies, starts
and resets Supabase, validates generated types, runs the full quality suite, checks
Expo compatibility and audits dependencies.

## Production safety

Keep these settings disabled until every launch gate has evidence and approval:

```text
PAYMENTS_DEMO_MODE=false
PAYMENTS_LIVE_ENABLED=false
EXPO_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_DEMO_INVENTORY_ENABLED=false
```

Before a live release, MMEMME still needs:

- Paystack approval for the managed marketplace settlement design.
- Nigerian legal, privacy, accounting, tax and cancellation-policy approval.
- NINAuth enterprise onboarding through an approved verification partner.
- An approved bank-name, malware-scanning and hosted identity-proofing provider.
- A biometric data-protection impact assessment and provider deletion evidence.
- Production Supabase, DNS, email/SMS, monitoring and company-owned service accounts.
- App Store and Google Play release candidates, device QA and accessibility review.
- A fully reconciled live-money rehearsal, production smoke test and five-person canary.

The authoritative gate register is [Paid beta launch gates](docs/operations/LAUNCH_GATES.md).

## Documentation

- [Product design](docs/MMEMME_PRODUCT_DESIGN.md)
- [MVP implementation plan](docs/MMEMME_MVP_IMPLEMENTATION_PLAN.md)
- [Engineering backlog](docs/MMEMME_CODEX_IMPLEMENTATION_BACKLOG.md)
- [Launch readiness](docs/MMEMME_LAUNCH_READINESS.md)
- [Beta release runbook](docs/MMEMME_BETA_RELEASE_RUNBOOK.md)
- [Brand and interface system](DESIGN.md)
- [Local demo guide](docs/MMEMME_LOCAL_DEMO.md)
- [Security threat model](docs/security/MMEMME_THREAT_MODEL.md)
- [Privacy and retention runbook](docs/security/PRIVACY_AND_RETENTION_RUNBOOK.md)
- [Disaster recovery runbook](docs/operations/DISASTER_RECOVERY_RUNBOOK.md)

The original startup plan remains preserved at `docs/MMEMME startup plan.pdf` as
historical reference. The product design, implementation backlog and launch gates
are the current execution sources of truth.
