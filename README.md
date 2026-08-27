# MMEMME

MMEMME is a managed native marketplace for Lagos couples booking verified wedding venues and caterers.

## Workspace

- `apps/mobile` — Expo React Native customer app
- `apps/web` — Next.js public website and customer web foundation
- `apps/admin` — Next.js internal operations console
- `packages/domain` — shared schemas and state-transition rules
- `packages/database` — generated Supabase schema types
- `packages/config` — validated environment and feature-flag contracts
- `packages/tokens` — platform-neutral design primitives
- `supabase` — PostgreSQL schema, RLS policies, and payment Edge Functions
- `docs` — product, implementation, and operations documentation

## Start locally

```bash
cp .env.example .env.local
npm ci
npm run db:start
npm run db:types:check
npm run quality
npm run dev:mobile
```

Run the public web app with `npm run dev:web` and operations separately with
`npm run dev:admin`. `npm run bootstrap` is the single clean-checkout quality
command after local environment values and Docker are available.

## Supabase setup

Install the Supabase CLI, then apply the migrations and deterministic marketplace seed:

```bash
supabase start
supabase db reset
```

Copy the local API URL and anon key into the `EXPO_PUBLIC_SUPABASE_*` values, and the URL, anon key and service-role key into the admin values documented in `.env.example`. Phone sign-in also requires an SMS provider outside local test mode. Give an operations user `profiles.is_admin = true`, enroll a TOTP factor and leave `ADMIN_REQUIRE_AAL2=true` outside automated/local testing.

Live payment processing is intentionally blocked until the Paystack, legal, accounting, privacy, and cancellation-policy gates in `docs/MMEMME_MVP_IMPLEMENTATION_PLAN.md` are complete.

The implemented sandbox journey is: create a brief → request a published vendor → claim and quote in `/bookings` on the admin console → accept the quote in the app → complete Paystack test checkout → receive webhook-verified confirmation, receipt, balanced ledger entries and a held payout. Set `PAYMENTS_SANDBOX_ENABLED=true` only with a Paystack test secret; `PAYMENTS_LIVE_ENABLED` must remain false until every commercial launch gate passes.
