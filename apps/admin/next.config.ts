import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mmemme/config", "@mmemme/database", "@mmemme/domain", "@mmemme/tokens"],
};

export default nextConfig;
