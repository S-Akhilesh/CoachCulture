import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@formfit/ui"],
  turbopack: {
    // Monorepo root — required so Turbopack resolves workspaces correctly
    root: path.join(__dirname, "../.."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
