import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    serverActions: {
      // CSV bulk import sends the file contents to a server action.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
