import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const file = new URL("../src/tokens.css", import.meta.url);
const before = readFileSync(file, "utf8");
execFileSync(process.execPath, [new URL("./build.mjs", import.meta.url).pathname]);
const after = readFileSync(file, "utf8");
if (before !== after) {
  console.error("Generated token CSS was stale. Commit the regenerated file.");
  process.exit(1);
}
console.log("Token CSS is deterministic and current.");
