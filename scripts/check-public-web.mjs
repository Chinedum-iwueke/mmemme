import fs from "node:fs";
const required = [
  "apps/web/app/sitemap.ts",
  "apps/web/app/robots.ts",
  "apps/web/app/not-found.tsx",
  "apps/web/app/opengraph-image.tsx",
  "apps/web/app/venues/page.tsx",
  "apps/web/app/caterers/page.tsx",
  "apps/web/app/vendors/[id]/page.tsx",
];
for (const file of required)
  if (!fs.existsSync(file)) throw new Error(`Missing public-web contract: ${file}`);
const legal = fs.readFileSync("apps/web/lib/legal.ts", "utf8");
if (!legal.includes("draft-2026-08-28")) throw new Error("Legal version must be explicit");
const cssBytes = fs.statSync("apps/web/app/styles.css").size;
if (cssBytes > 35_000)
  throw new Error(`Public CSS exceeds 35 KB source budget (${cssBytes} bytes)`);
const clientFiles = ["apps/web/components/public/mobile-nav.tsx"];
const clientBytes = clientFiles.reduce((total, file) => total + fs.statSync(file).size, 0);
if (clientBytes > 8_000)
  throw new Error(`Public shell client code exceeds 8 KB source budget (${clientBytes} bytes)`);
if (process.env.MMEMME_ENV === "production") {
  if (process.env.NEXT_PUBLIC_LEGAL_CONTENT_STATUS !== "approved")
    throw new Error("Production requires counsel-approved legal content");
  if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"))
    throw new Error("Production public site URL must use HTTPS");
}
console.log(
  `Public marketplace contracts passed (CSS ${cssBytes} B; shell client ${clientBytes} B).`,
);
