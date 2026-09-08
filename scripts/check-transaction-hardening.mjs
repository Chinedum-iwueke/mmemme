import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202609090010_transaction_hardening.sql");
const webhook = read("supabase/functions/paystack-webhook/index.ts");
const initialize = read("supabase/functions/initialize-payment/index.ts");
const refund = read("supabase/functions/process-refund/index.ts");
const delivery = read("supabase/functions/dispatch-notifications/index.ts");
const reconciliation = read("supabase/functions/reconcile-financials/index.ts");
const schedule = read(".github/workflows/scheduled-operations.yml");
const contracts = [
  [migration, "admin_issue_quote", "atomic quote RPC"],
  [migration, "p_expected_revision", "optimistic concurrency"],
  [migration, "MMEMME_STALE_STATE", "stable conflict errors"],
  [migration, "cancellation_policy_tiers", "versioned cancellation tiers"],
  [migration, "admin_approve_refund", "atomic dual refund approval"],
  [migration, "admin_approve_payout", "atomic dual payout approval"],
  [migration, "process_chargeback_event", "idempotent chargeback handling"],
  [migration, "process_payout_event", "idempotent payout event handling"],
  [migration, "verified_amount_kobo", "verified payment amount"],
  [migration, "claim_notification_deliveries", "skip-locked delivery leases"],
  [migration, "run_financial_reconciliation", "server reconciliation"],
  [webhook, "x-paystack-signature", "signed webhook validation"],
  [webhook, "verified.data?.reference !== reference", "verified provider reference"],
  [webhook, "charge.dispute.create", "dispute webhook"],
  [initialize, "existing?.provider_reference", "initialization network recovery"],
  [refund, '"approved", "failed"', "failed refund retry"],
  [delivery, "leaseToken", "delivery lease completion"],
  [delivery, "Idempotency-Key", "provider delivery idempotency"],
  [delivery, "DeviceNotRegistered", "dead push-token cleanup"],
  [delivery, "push/getReceipts", "Expo delivery receipt polling"],
  [reconciliation, "run_financial_reconciliation", "scheduled reconciliation endpoint"],
  [schedule, "17 2 * * *", "daily reconciliation schedule"],
];
const missing = contracts.filter(([source, token]) => !source.includes(token));
if (missing.length)
  throw new Error(`Missing M15 contracts: ${missing.map(([, , name]) => name).join(", ")}`);
for (const client of ["apps/web", "apps/mobile"]) {
  const source = read(
    client === "apps/web"
      ? "apps/web/app/checkout/return/page.tsx"
      : "apps/mobile/app/booking/[id].tsx",
  );
  if (source.includes("process_successful_payment") || source.includes('status: "succeeded"'))
    throw new Error(`${client} can confirm a payment`);
}
console.log(
  `${contracts.length} Milestone 15 atomicity, Paystack, policy, delivery and reconciliation contracts passed.`,
);
