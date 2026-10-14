/** @type {import('next').NextConfig} */
const nextConfig = {
  // outputFileTracingRoot: require('path').resolve(__dirname, '../../'),  // Uncomment if needed
  /* config options here */
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  experimental: { cpus: 1 },
  async headers() {
    return process.env.KARUU_DEPLOYMENT_ENV === 'preview'
      ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
      : [];
  },
  images: {
    // Serve actual image assets directly; the account has no Images binding.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
