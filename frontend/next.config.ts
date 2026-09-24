import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // images: { unoptimized: true }, // Re-enable image optimization for Node server
  experimental: {
    // turbopack options removed as they were causing warnings
  },
};

export default nextConfig;
