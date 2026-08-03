import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  webpack: (config) => {
    // Exclude Trigger.dev tasks from Next.js bundling
    config.resolve.alias = config.resolve.alias || {};
    return config;
  },
};

export default nextConfig;
