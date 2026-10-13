import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// `unsafe-eval` is only needed for React DevTools / Next.js HMR in dev.
// Prod must not allow eval-class XSS sinks.
// Clarity loads its script from scripts.clarity.ms and posts to <n>.clarity.ms;
// allowing only www.clarity.ms blocked it entirely (CSP violation in console).
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clarity.ms"
  : "script-src 'self' 'unsafe-inline' https://*.clarity.ms";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  // data: for base64 images stored in MongoDB; blob: for canvas/object URLs
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clarity.ms https://dc.services.visualstudio.com",
  "media-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  images: {
    // Brief §3.5: AVIF first, WebP second, original JPEG as the fallback
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async redirects() {
    // The admin moved to /rk-studio; old bookmarks and notification links
    // already stored in the database still point at /admin and /login.
    return [
      { source: '/admin', destination: '/rk-studio', permanent: true },
      { source: '/admin/:path*', destination: '/rk-studio/:path*', permanent: true },
      { source: '/login', destination: '/rk-studio/auth', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
      {
        // HSTS only on HTTPS — browsers ignore on HTTP, but be explicit
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
