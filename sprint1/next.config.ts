import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is the default in Next.js 16
  turbopack: {},
  // Disable Strict Mode: in dev it double-invokes effects which can cause
  // unexpected behaviour during debugging
  reactStrictMode: false,
};

export default nextConfig;
