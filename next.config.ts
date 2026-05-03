import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically — no standalone needed
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
