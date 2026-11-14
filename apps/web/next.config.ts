import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@onlineland/shared'],
  poweredByHeader: false,
  images: {
    // Listing photos come from Firebase Storage. With local emulators images are served unoptimized.
    remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' }],
  },
};

export default withNextIntl(nextConfig);
