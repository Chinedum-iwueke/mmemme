import { readFileSync } from "node:fs";
const migration = readFileSync("supabase/migrations/202609070008_vendor_onboarding.sql", "utf8");
const workspace = readFileSync("apps/web/components/vendor/vendor-workspace.tsx", "utf8");
const access = readFileSync("apps/web/components/vendor/vendor-access.tsx", "utf8");
const operations = readFileSync("apps/admin/app/vendors/applications/page.tsx", "utf8");
const evidenceRoute = readFileSync(
  "apps/admin/app/vendors/applications/[applicationId]/evidence/[evidenceId]/route.ts",
  "utf8",
);
const scanner = readFileSync("supabase/functions/scan-vendor-evidence/index.ts", "utf8");
const provider = readFileSync("supabase/functions/vendor-provider-check/index.ts", "utf8");
const notifications = readFileSync("supabase/functions/dispatch-notifications/index.ts", "utf8");
for (const [surface, source, contracts] of [
  [
    "tenant model",
    migration,
    [
      "vendor_memberships",
      "one_vendor_owner",
      "is_vendor_member",
      "protect_vendor_membership",
      "enable row level security",
    ],
  ],
  [
    "application state",
    migration,
    [
      "changes_requested",
      "submission_snapshot",
      "p_idempotency_key",
      "invalid application transition",
      "vendor_application_events",
    ],
  ],
  [
    "private evidence",
    migration + evidenceRoute,
    ["vendor-credentials", "quarantined", "protect_vendor_evidence_review", "createSignedUrl"],
  ],
  ["vendor access", access, ["signInWithOtp", "phone_change", "create_vendor_account", "consent"]],
  [
    "vendor workspace",
    workspace,
    [
      "save_vendor_application",
      "localStorage",
      "vendor_package_drafts",
      "submit_vendor_application",
      "propose_vendor_maintenance",
    ],
  ],
  [
    "operator review",
    operations,
    [
      "Open audited file",
      "Schedule inspection",
      "Approve and publish",
      "Record authorized decision",
    ],
  ],
  [
    "scanner boundary",
    scanner,
    ["MALWARE_SCANNER_URL", "signedUrl", "max_pages", "PROVIDER_UNAVAILABLE"],
  ],
  [
    "identity boundary",
    provider,
    ["providerToken", "VERIFICATION_PROVIDER_URL", "result_summary", "PROVIDER_UNAVAILABLE"],
  ],
  [
    "communications",
    notifications,
    ["vendor_notifications", "Idempotency-Key", "expire_vendor_applications"],
  ],
])
  for (const contract of contracts)
    if (!source.includes(contract)) {
      console.error(`Milestone 13 ${surface} contract missing: ${contract}`);
      process.exit(1);
    }
for (const forbidden of ["raw_nin", "raw_bvn", "nin_value", "bvn_value"])
  if (migration.toLowerCase().includes(forbidden) || provider.toLowerCase().includes(forbidden)) {
    console.error(`Forbidden identity storage contract found: ${forbidden}`);
    process.exit(1);
  }
console.log(
  "Milestone 13 vendor tenancy, onboarding, evidence, review, maintenance and communication contracts passed.",
);
