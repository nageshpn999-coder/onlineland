import type { NextConfig } from 'next';

/**
 * The admin dashboard is a static site (no server): every page runs in the browser and talks to
 * Firebase directly. Security comes from the admin custom claim + Firestore rules + Cloud Functions.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['@onlineland/shared'],
  images: { unoptimized: true },
};

export default nextConfig;
