import { readFileSync } from "node:fs";
const demo = readFileSync("supabase/functions/demo-confirm-payment/index.ts", "utf8");
if (!demo.includes("MMEMME_ENV") || !demo.includes("production")) {
  console.error("Demo payment function lacks an explicit production guard");
  process.exit(1);
}
const config = readFileSync("packages/config/src/index.ts", "utf8");
if (!config.includes("Demo payments are forbidden in production")) {
  console.error("Central production payment invariant is missing");
  process.exit(1);
}
console.log("Production demo-payment safety contract passed.");
