import type { MetadataRoute } from "next";
import { listPublicVendors } from "../lib/marketplace";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const paths = [
    "",
    "/venues",
    "/caterers",
    "/how-it-works",
    "/verification",
    "/for-vendors",
    "/about",
    "/contact",
  ];
  const legal =
    process.env.NEXT_PUBLIC_LEGAL_CONTENT_STATUS === "approved"
      ? ["/privacy", "/terms", "/refunds-cancellations", "/disputes"]
      : [];
  const { vendors } = await listPublicVendors();
  const staticEntries: MetadataRoute.Sitemap = [...paths, ...legal].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.7 : 1,
  }));
  const vendorEntries: MetadataRoute.Sitemap = vendors.map((vendor) => ({
    url: `${base}/vendors/${vendor.id}`,
    lastModified: vendor.updated_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return staticEntries.concat(vendorEntries);
}
