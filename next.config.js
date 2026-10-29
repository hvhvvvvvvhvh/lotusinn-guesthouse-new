/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return ['/optimized/:path*', '/fonts/:path*'].map(source => ({ source, headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }));
  },
}
module.exports = nextConfig
