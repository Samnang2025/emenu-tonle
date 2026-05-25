const nextConfig = {
  // Disable font optimizations that can cause issues in some deployment environments
  optimizeFonts: false,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'pdf-to-printer'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:projectName/:path*',
        destination: 'https://:projectName.tsdsolution.net/api/:path*',
      },
    ];
  },
};

export default nextConfig;
