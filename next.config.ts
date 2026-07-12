import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle Swiss Ephemeris data files into serverless functions
  outputFileTracingIncludes: {
    "/**": [
      "./ephe/**",
      "./node_modules/geo-tz/data/**",
    ],
  },

  // sweph is a native Node addon — must run in Node runtime, not Edge.
  // geo-tz must stay unbundled: it resolves its .geo.dat data files via
  // __dirname, which Turbopack rewrites to a nonexistent /ROOT/ placeholder.
  serverExternalPackages: ["sweph", "geo-tz"],

  // Silence the turbopack/webpack mismatch warning
  turbopack: {},
};

export default nextConfig;
