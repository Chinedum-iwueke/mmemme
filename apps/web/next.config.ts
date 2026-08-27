import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mmemme/config", "@mmemme/domain", "@mmemme/tokens"],
};
export default config;
