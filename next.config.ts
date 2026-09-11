import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/clients/*/quote": ["./public/Graduation-logo.png"],
  },
};

export default nextConfig;
