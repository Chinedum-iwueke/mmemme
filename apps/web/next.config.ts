import type { NextConfig } from "next";
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
        source: "/opengraph-image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};
export default config;
