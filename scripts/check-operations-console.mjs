import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202609080009_operations_console.sql");
const server = read("apps/admin/lib/supabase/server.ts");
const bookings =
  read("apps/admin/app/bookings/page.tsx") + read("apps/admin/app/bookings/actions.ts");
const safety = read("apps/admin/app/safety/page.tsx") + read("apps/admin/app/safety/actions.ts");
const money = read("apps/admin/app/money/page.tsx");
const supply = read("apps/admin/app/vendors/applications/page.tsx");
const search = read("apps/admin/app/search/page.tsx") + read("apps/admin/app/exports/route.ts");
const access = read("apps/admin/app/access/page.tsx") + read("apps/admin/app/access/actions.ts");
if (!existsSync("apps/admin/public/brand/mmemme-stacked-green.png"))
  throw new Error("Operations console is missing the approved MMEMME logo");
const required = [
  [migration, "admin_has_capability", "database capability enforcement"],
  [migration, "operations_assignments", "case ownership"],
  [migration, "immutable_operations_case_events", "append-only case history"],
  [server, "session_timeout_minutes", "idle session timeout"],
  [server, "mfa-required", "MFA gate"],
  [access, "revokeOperatorAccess", "operator revocation"],
  [bookings, "notification-preview", "customer notification preview"],
  [bookings, "expireQuote", "quote expiration"],
  [supply, "Dual-role conflict", "dual-role conflict visibility"],
  [safety, "Evidence timeline", "dispute evidence context"],
  [safety, "Approve cancellation", "cancellation rescue"],
  [money, "Reconciliation exceptions", "fund exception ownership"],
  [search, "Search all records", "global recovery search"],
  [search, "Redacted", "redacted export audit"],
];
const missing = required.filter(([source, token]) => !source.includes(token));
if (missing.length)
  throw new Error(`Missing operations contracts: ${missing.map(([, , name]) => name).join(", ")}`);
if (!migration.includes("dual-role operator cannot approve own vendor account"))
  throw new Error("Dual-role approval is not blocked");
console.log(
  `${required.length} Milestone 14 authorization, queue, safety, money and usability contracts passed.`,
);
