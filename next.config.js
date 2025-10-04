/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://platform.twitter.com https://cdn.syndication.twimg.com",
              "style-src 'self' 'unsafe-inline' https://platform.twitter.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' wss: https:",
              "frame-src 'self' https://platform.twitter.com https://www.youtube.com https://open.spotify.com https://embed.podcasts.apple.com",
              "media-src 'self' https: http: blob:",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
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
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform.twitter.com',
        pathname: '/**',
      },
    ],
  }
};

module.exports = nextConfig;