/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nostr.build',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.nostr.build',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.nostrcheck.me',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blossom.primal.net',
        pathname: '/**',
      },
    ],
  }
};

module.exports = nextConfig;