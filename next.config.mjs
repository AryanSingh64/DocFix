/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for server actions and API routes
  // This allows large PDF uploads - our backend enforces 20MB for non-premium users
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // This is the key setting for API routes - allows large file uploads
    proxyClientMaxBodySize: '100mb',
  },
};

export default nextConfig;
