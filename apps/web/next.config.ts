import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co");
const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mmemme/config", "@mmemme/domain", "@mmemme/tokens"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: storage.hostname, pathname: "/storage/v1/**" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.sentry.io; upgrade-insecure-requests",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/opengraph-image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};
export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
