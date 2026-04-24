import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16 — webpack config is ignored.
  // Empty turbopack config silences the mismatch warning.
  turbopack: {},
};

export default nextConfig;
