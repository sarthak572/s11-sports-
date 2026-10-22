import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/s11-sports-",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
