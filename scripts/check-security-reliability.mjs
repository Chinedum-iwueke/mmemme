import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202609100011_security_privacy_reliability.sql");
const security = read("supabase/functions/_shared/security.ts");
const cors = read("supabase/functions/_shared/cors.ts");
const webConfig = read("apps/web/next.config.ts");
const adminConfig = read("apps/admin/next.config.ts");
const contracts = [
  [migration, "consume_rate_limit", "server rate limits"],
  [migration, "complete_privacy_request", "privacy completion"],
  [migration, "prevent_deleted_profile_reactivation", "deleted account resurrection prevention"],
  [migration, "retain_legal", "financial retention"],
  [migration, "prevent_security_record_mutation", "immutable evidence"],
  [migration, "apply_retention_schedule", "retention lifecycle"],
  [migration, "open_security_incident", "incident ownership"],
  [security, "sensitiveKeys", "structured log redaction"],
  [cors, "PUBLIC_WEB_URL", "restricted browser origin"],
  [webConfig, "Content-Security-Policy", "public web security headers"],
  [adminConfig, 'Cache-Control", value: "no-store', "private console cache prevention"],
];
const missing = contracts.filter(([source, token]) => !source.includes(token));
if (missing.length)
  throw new Error(`Missing M16 controls: ${missing.map(([, , name]) => name).join(", ")}`);
for (const [name, config] of [
  ["public web", webConfig],
  ["operations console", adminConfig],
]) {
  if (!config.includes('...(isProduction ? ["upgrade-insecure-requests"] : [])'))
    throw new Error(`${name} must enforce HTTPS upgrades only in production`);
  if (!config.includes("...(isProduction ? [hstsHeader] : [])"))
    throw new Error(`${name} must send HSTS only in production`);
  if (!config.includes("${storage.origin}"))
    throw new Error(`${name} must allow its configured Supabase origin`);
  if (!config.includes("allowedDevOrigins: isProduction ? [] : localDevOrigins"))
    throw new Error(`${name} must explicitly allow configured local preview origins`);
  if (!config.includes('isProduction ? "" : " \'unsafe-eval\'"'))
    throw new Error(`${name} must permit development tooling without weakening production CSP`);
}
console.log(`${contracts.length} Milestone 16 security, privacy and reliability contracts passed.`);
