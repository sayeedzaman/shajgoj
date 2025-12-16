import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set the root directory to silence the warning
  turbopack: {
    root: process.cwd(),
  },
  
  // Proxy API requests to your backend to avoid CORS issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  
  // Optional: Enable React strict mode for better development
  reactStrictMode: true,
  
  // Optional: Configure image domains if you'll use next/image
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**', // Allows any HTTPS domain (for production images from Cloudinary, S3, etc.)
      },
    ],
  },
};

export default nextConfig;