/** @type {import('next').NextConfig} */

const ONE_YEAR = 31536000;

// Static art is rarely changed, and when it is, it's replaced under a new name
// or a version query string (e.g. /badges/lotus.png?v=2) — so browsers can hold
// it indefinitely. Worth being explicit: Next serves everything in public/ with
// `Cache-Control: public, max-age=0`, so without this every repeat visit spends
// a revalidation round-trip per image just to be told nothing changed.
const IMMUTABLE_ASSET = [
  { key: 'Cache-Control', value: `public, max-age=${ONE_YEAR}, immutable` },
];

const nextConfig = {
  experimental: {
    optimizePackageImports: [ "@chakra-ui/react" ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
    ],
    // next/image is served from /_next/image?url=…, a path the headers() rules
    // below never match — its browser TTL comes from here instead. This is what
    // covers login-bg.jpg, invaHomeBg.png, the logos and the livery art.
    // Safe at a year: local art is renamed to bust, and Discord avatar URLs are
    // content-addressed (the hash is in the URL), so a changed avatar is a new
    // URL rather than stale content. It also avoids re-running a transformation
    // that was already paid for.
    minimumCacheTTL: ONE_YEAR,
  },
  async redirects() {
    return [
      // Was src/app/flying-manual/route.js — a whole function invocation per hit
      // just to 307 to the external manual. Config redirects are handled by the
      // routing layer with no function involved.
      {
        source: '/flying-manual',
        destination: 'https://zeff005.github.io/Flying-Manual/',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Every static asset under public/, at any depth — /badges/lotus.png,
        // /codeshare-emojis/DHL.png, /hero-blueprint.png, /career/*.jpg. These
        // are requested by their real path (plain <img> or CSS url()), so unlike
        // the next/image ones above, this header is what the browser actually sees.
        source: '/:path*.:ext(png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2)',
        headers: IMMUTABLE_ASSET,
      },
    ];
  },
};

export default nextConfig;

