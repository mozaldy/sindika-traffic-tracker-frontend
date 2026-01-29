import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2gb",
    },
    // Fix for 10MB limit check in dev mode for rewrites
    middlewareClientMaxBodySize: "2gb", 
  },
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
