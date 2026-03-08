import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config";

const nextConfig: NextConfig = {
  images: {
    // Configure external image domains if needed
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.stellarspend.app",
      },
    ],
    // Enable modern image formats
    formats: ["image/avif", "image/webp"],
    // Optimize for performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
