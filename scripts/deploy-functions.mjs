import { spawnSync } from "node:child_process";
if (process.env.MMEMME_ENV !== "production")
  throw new Error("This script is only for explicit production deployment");
const allowed = [
  "initialize-payment",
  "paystack-webhook",
  "process-refund",
  "dispatch-notifications",
];
for (const name of allowed) {
  const result = spawnSync("npx", ["--yes", "supabase@2.116.0", "functions", "deploy", name], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
