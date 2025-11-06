/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  allowedDevOrigins: ['192.168.1.6'],
  // Environment variables with NEXT_PUBLIC_ prefix are automatically available in client components
}

module.exports = nextConfig


