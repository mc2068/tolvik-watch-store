import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md is hand-written for this project; stop `next dev` appending to it.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // The Hero Timepiece's still is nearly black; at the default quality of
    // 75 its faint highlights break into bands. It asks for 90.
    qualities: [75, 90],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
