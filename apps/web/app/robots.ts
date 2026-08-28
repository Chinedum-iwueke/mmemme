import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const production = process.env.MMEMME_ENV === "production";
  return production
    ? {
        rules: {
          userAgent: "*",
          allow: [
            "/",
            "/venues",
            "/caterers",
            "/vendors/",
            "/how-it-works",
            "/verification",
            "/for-vendors",
            "/about",
            "/contact",
          ],
          disallow: ["/login", "/bookings", "/search", "/api/", "/design-system"],
        },
        sitemap: `${base}/sitemap.xml`,
        host: base,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
