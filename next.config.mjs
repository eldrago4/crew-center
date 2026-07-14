/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [ "@chakra-ui/react" ],
  },
  // jose (via firebase-admin -> jwks-rsa) maps the workerd/worker/browser export
  // conditions to dist/browser, but Next traces the package under Node semantics
  // and only copies dist/node. The Workers bundler then can't resolve it. Force
  // the whole dist in so every export condition has a file to point at.
  outputFileTracingIncludes: {
    '/api/**/*': [
      './node_modules/jose/dist/**/*',
      './node_modules/jwks-rsa/node_modules/jose/dist/**/*',
    ],
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

