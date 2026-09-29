import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Note: Client communicates via Next.js service layer to backend API
};

export default nextConfig;
