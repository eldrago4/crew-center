/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [ "@chakra-ui/react" ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
    ],
  },
  async redirects() {
    return [
    ];
  },
  async headers() {
    return [
      {
        // Badge art is static and rarely changes — let the browser cache it
        // aggressively across navigations/sessions. To bust later, rename the
        // file or append a version query string (e.g. /badges/lotus.png?v=2).
        source: '/badges/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

