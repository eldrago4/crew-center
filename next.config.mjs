/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [ "@chakra-ui/react" ],
  },
  async redirects() {
    return [
    ];
  },
};

