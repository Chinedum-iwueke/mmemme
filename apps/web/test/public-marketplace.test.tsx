import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SearchForm, VendorCard } from "../components/public/marketplace";
import type { PublicVendor } from "../lib/marketplace";

const vendor: PublicVendor = {
  id: "vendor-1",
  name: "Lagoon House",
  category: "venue",
  area: "Victoria Island",
  description: "A waterfront celebration venue.",
  capacity_min: 50,
  capacity_max: 350,
  price_from_kobo: 280_000_000,
  published: true,
  verification_status: "approved",
  verification_expires_at: "2027-08-01T00:00:00Z",
  hero_image_path: null,
  paystack_subaccount_code: null,
  created_at: "2026-01-01",
  updated_at: "2026-08-01",
  packages: [],
  verification: null,
  imageUrl: null,
};
describe("public marketplace contracts", () => {
  it("submits a useful search without JavaScript", () => {
    const html = renderToStaticMarkup(<SearchForm />);
    expect(html).toContain('action="/search"');
    expect(html).toContain('name="category"');
    expect(html).toContain('name="area"');
    expect(html).toContain('name="date"');
    expect(html).toContain('name="guests"');
  });
  it("presents facts and never implies live availability", () => {
    const html = renderToStaticMarkup(<VendorCard vendor={vendor} />);
    expect(html).toContain("MMEMME Verified");
    expect(html).toContain("Up to 350 guests");
    expect(html).not.toContain("available");
  });
  it("ships responsive, focus, motion and layout-reservation contracts", () => {
    const css = readFileSync(new URL("../app/styles.css", import.meta.url), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toMatch(/aspect-ratio:\s*4\s*\/\s*3/);
    expect(css).toMatch(/max-width:\s*599px/);
  });
  it("keeps private verification fields out of the public query", () => {
    const source = readFileSync(new URL("../lib/marketplace.ts", import.meta.url), "utf8");
    const start = source.search(/client\s*\.from\(\s*"verification_records"/);
    const publicSelect = source.slice(start, start + 800);
    expect(start).toBeGreaterThan(0);
    expect(publicSelect).not.toContain("private_note");
    expect(publicSelect).not.toContain("checked_by");
  });
  it("excludes private and preview routes from robots", () => {
    const source = readFileSync(new URL("../app/robots.ts", import.meta.url), "utf8");
    for (const path of ["/login", "/bookings", "/search", "/design-system"])
      expect(source).toContain(path);
  });
});
