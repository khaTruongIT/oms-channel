import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@optiqis/shared", "@optiqis/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
