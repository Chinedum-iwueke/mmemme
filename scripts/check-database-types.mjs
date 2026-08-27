import { execFileSync } from "node:child_process";
import { openSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const output = join(tmpdir(), `mmemme-db-${process.pid}.ts`);
execFileSync(
  "npx",
  ["--yes", "supabase@2.116.0", "gen", "types", "typescript", "--local", "--schema", "public"],
  { stdio: ["ignore", openSync(output, "w"), "inherit"] },
);
const generated = `${readFileSync(output, "utf8").trimEnd()}\n`;
for (const file of [
  "packages/database/src/database.generated.ts",
  "supabase/functions/_shared/database.generated.ts",
]) {
  const committed = readFileSync(file, "utf8");
  if (generated !== committed) {
    console.error(`${file} is stale. Run npm run db:types.`);
    process.exit(1);
  }
}
console.log("Database types match local schema and Edge Functions.");
