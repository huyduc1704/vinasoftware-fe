import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const apiUrl = process.env.BACKEND_API_URL || (isProd
      ? 'https://vinasoftware-be.onrender.com/api'
      : 'http://localhost:8081/api');

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
