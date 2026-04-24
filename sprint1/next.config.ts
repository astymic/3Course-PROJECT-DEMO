import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore SQLite db files from file watcher to prevent
    // infinite hot-reload loop (Prisma writes -> watcher triggers -> re-fetch -> writes again)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/node_modules/**",
        "**/.next/**",
        "**/prisma/dev.db",
        "**/prisma/dev.db-journal",
        "**/dev.db",
        "**/dev.db-journal",
      ],
    };
    return config;
  },
};

export default nextConfig;
