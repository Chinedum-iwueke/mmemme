import { execFileSync } from "node:child_process";
const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);
const forbidden = files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".example"));
if (forbidden.length) {
  console.error("Tracked environment files:", forbidden.join(", "));
  process.exit(1);
}
const patterns = [/sk_(live|test)_[A-Za-z0-9]{20,}/, /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/];
for (const file of files.filter((f) => !f.match(/\.(pdf|png|lock)$/))) {
  const text = await import("node:fs").then((m) => m.readFileSync(file, "utf8"));
  for (const p of patterns)
    if (p.test(text) && !file.endsWith(".example")) {
      console.error(`${file}: possible committed secret`);
      process.exit(1);
    }
}
console.log("Tracked files passed secret scan.");
