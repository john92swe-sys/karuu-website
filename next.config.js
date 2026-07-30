/** @type {import('next').NextConfig} */
const nextConfig = {
  // outputFileTracingRoot: require('path').resolve(__dirname, '../../'),  // Uncomment if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
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
