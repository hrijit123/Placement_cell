import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - To allow your local network IP access
  allowedDevOrigins: ['192.168.29.48'],
};

export default nextConfig;
