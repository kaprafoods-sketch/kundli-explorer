import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Swiss Ephemeris data files into serverless functions
  outputFileTracingIncludes: {
    "/api/**": ["./ephe/**"],
    "/chart/**": ["./ephe/**"],
  },

  // sweph is a native Node addon — must run in Node runtime, not Edge
  serverExternalPackages: ["sweph"],

  // Silence the turbopack/webpack mismatch warning
  turbopack: {},
};

export default nextConfig;
