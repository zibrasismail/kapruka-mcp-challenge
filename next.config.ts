import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.kapruka.com" },
      { protocol: "https", hostname: "kapruka.com" },
      { protocol: "https", hostname: "static2.kapruka.com" },
      { protocol: "https", hostname: "**.kapruka.com" },
    ],
  },
};

export default nextConfig;