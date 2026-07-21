# MMEMME

MMEMME is a managed native marketplace for Lagos couples booking verified wedding venues and caterers.

## Workspace

- `apps/mobile` — Expo React Native customer app
- `apps/admin` — Next.js internal operations console
- `packages/domain` — shared schemas and state-transition rules
- `supabase` — PostgreSQL schema, RLS policies, and payment Edge Functions
- `docs` — product, implementation, and operations documentation

## Start locally

```bash
cp .env.example .env.local
npm install
npm run test
npm run typecheck
npm run dev:mobile
```

Run the admin separately with `npm run dev:admin`.

Live payment processing is intentionally blocked until the Paystack, legal, accounting, privacy, and cancellation-policy gates in `docs/MMEMME_MVP_IMPLEMENTATION_PLAN.md` are complete.
