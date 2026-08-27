import { readdirSync, readFileSync } from "node:fs";
const files = readdirSync("supabase/migrations")
  .filter((x) => x.endsWith(".sql"))
  .sort();
let failed = false;
for (const file of files) {
  const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
  if (/\bdrop\s+(table|schema|database)\b/i.test(sql) && !/--\s*ALLOW_DESTRUCTIVE:/i.test(sql)) {
    console.error(`${file}: destructive DROP requires -- ALLOW_DESTRUCTIVE: <review ticket>`);
    failed = true;
  }
  for (const match of sql.matchAll(/security\s+definer/gi)) {
    const tail = sql.slice(match.index, match.index + 200);
    if (!/set\s+search_path/i.test(tail)) {
      console.error(`${file}: SECURITY DEFINER function must set search_path`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log(`${files.length} migrations passed safety lint.`);
