/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [ "@chakra-ui/react" ],
  },
  async redirects() {
    return [
      {
        source: '/flying-manual',
        destination: 'https://zeff005.github.io/Flying-Manual/',
        permanent: true,
      },
    ];
  },
};

