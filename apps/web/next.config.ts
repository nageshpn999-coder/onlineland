import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Firebase App Hosting gives the build the linked web app's config as FIREBASE_WEBAPP_CONFIG (JSON).
// Map it to the NEXT_PUBLIC_* names the site uses, unless they are set already (Vercel, .env.local).
// These values are public by design (they ship to every browser); security comes from rules + App Check.
const webapp = (() => {
  try {
    return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
})();
const publicEnv: Record<string, string> = {};
for (const [name, key] of [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', 'apiKey'],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'projectId'],
  ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', 'appId'],
] as const) {
  const v = process.env[name] || webapp[key];
  if (v) publicEnv[name] = v;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: publicEnv,
  transpilePackages: ['@onlineland/shared'],
  poweredByHeader: false,
  // Old visiting-card / demo pages need their trailing "/" (see src/proxy.ts).
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [{ source: '/index.html', destination: '/te', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ];
  },
  images: {
    // Listing photos come from Firebase Storage. With local emulators images are served unoptimized.
    remotePatterns: [{ protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/v0/b/**' }],
  },
};

export default withNextIntl(nextConfig);
