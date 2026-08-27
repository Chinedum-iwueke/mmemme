import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const generated = execFileSync(
  "npx",
  ["--yes", "supabase@2.116.0", "gen", "types", "typescript", "--local", "--schema", "public"],
  { encoding: "utf8" },
);
for (const file of [
  "packages/database/src/database.generated.ts",
  "supabase/functions/_shared/database.generated.ts",
])
  writeFileSync(file, `${generated.trimEnd()}\n`);
console.log("Generated database types for applications and Edge Functions.");
