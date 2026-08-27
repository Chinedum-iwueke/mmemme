import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
let failed = false;
for (const root of ["apps/mobile", "apps/web"]) {
  for (const file of walk(root).filter(
    (f) => /\.(ts|tsx)$/.test(f) && !f.includes(".next") && !f.includes(".expo"),
  )) {
    const text = readFileSync(file, "utf8");
    if (
      /@mmemme\/(admin|server)|apps\/admin|SUPABASE_SERVICE_ROLE_KEY|PAYSTACK_SECRET_KEY/.test(text)
    ) {
      console.error(`${file}: client imports or references server-only code`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("Client/server workspace boundaries passed.");
