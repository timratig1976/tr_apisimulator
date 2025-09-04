import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ignore ESLint errors during production builds to prevent build failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly set Turbopack root to this directory to avoid multi-lockfile inference issues
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
