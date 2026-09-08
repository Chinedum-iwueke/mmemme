import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const storage = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co");
const isProduction =
  process.env.MMEMME_ENV === "production" || process.env.NEXT_PUBLIC_MMEMME_ENV === "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  `connect-src 'self' ${storage.origin} https://*.supabase.co https://*.sentry.io`,
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");
const hstsHeader = {
  key: "Strict-Transport-Security",
  value: "max-age=63072000; includeSubDomains; preload",
};
const localDevOrigins = process.env.MMEMME_DEV_ORIGINS?.split(",") ?? [
  "localhost",
  "127.0.0.1",
  "192.168.*.*",
];
const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: isProduction ? [] : localDevOrigins,
  transpilePackages: ["@mmemme/config", "@mmemme/database", "@mmemme/domain", "@mmemme/tokens"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          ...(isProduction ? [hstsHeader] : []),
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
