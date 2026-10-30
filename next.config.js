/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: 'lotusinn-guesthouse-new.vercel.app' }], destination: 'https://www.lotusinnguesthouse.com/:path*', permanent: true }];
  },
  async headers() {
    return [
      ...['/optimized/:path*', '/fonts/:path*'].map(source => ({ source, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] })),
      ...['/admin/:path*', '/api/admin/:path*', '/api/site-data', '/api/bookings', '/api/messages'].map(source => ({ source, headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] })),
    ];
  },
}
module.exports = nextConfig
