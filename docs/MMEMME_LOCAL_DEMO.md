# MMEMME local booking demo

This demo uses local Supabase, a fixed local OTP and an explicitly gated payment simulator. It does not contact Paystack or move money.

## Start

1. Run `npm install`, then start Supabase with
   `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=local-test-token npx supabase start`.
2. Copy `supabase status -o env` values into `.env.local` and `apps/mobile/.env.local` using `.env.example` as the field map. Use `http://127.0.0.1:54321` on an iOS simulator, `http://10.0.2.2:54321` on Android Emulator, or the computer's LAN IP on a physical phone.
3. Copy `supabase/.env.demo.example` to an untracked local env file, keep
   `PAYMENTS_DEMO_MODE=true`, and serve functions with
   `npx supabase functions serve --env-file supabase/.env.local`.
4. Set `EXPO_PUBLIC_DEMO_MODE=true` in `apps/mobile/.env.local`.
5. Start the app with `npm run dev:mobile`. Start operations in a second terminal with `ADMIN_REQUIRE_AAL2=false npm run dev:admin`.

Before presenting, run `scripts/local-demo-smoke.sh`. A successful result reports
`confirmed`, `succeeded`, three ledger entries and a `held` payout.

## Accounts and script

- Customer phone: `+234 801 234 5678`
- Local OTP: `123456`
- Operations email: `ops@mmemme.local`
- Operations password: `MmemmeDemo!2026`
- Second reviewer email: `reviewer@mmemme.local`
- Second reviewer password: `MmemmeReview!2026`

Create and save a wedding brief, select a seeded vendor and submit a request. In operations, claim it and issue a quote. Return to the app, accept the quote, then select **Simulate successful local payment**. The booking must become confirmed and show a receipt. The operations money view must show a balanced ledger and held payout.

Continue into milestone 6 by opening **Support, cancellation and safety**.
Demonstrate support messaging, cancellation preview/request, dual refund approval
by signing in once with each admin account, dispute evidence, fulfillment
confirmation and verified review eligibility.

## Safety

Never enable `PAYMENTS_DEMO_MODE` or `EXPO_PUBLIC_DEMO_MODE` in preview or production. EAS preview and production profiles force the client flag off. Run `supabase db reset` to restore deterministic demonstration data.

The Twilio token in the local start command is a non-secret placeholder. Supabase
requires an enabled phone provider before exposing phone auth, but the configured
test number is intercepted locally and no SMS is sent.
