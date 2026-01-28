import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/captures/:path*",
        destination: "http://localhost:8000/captures/:path*",
      },
    ];
  },
};

export default nextConfig;
