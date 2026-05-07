import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig = {
  // Disable font optimizations that cause issues in Cloudflare Workers
  optimizeFonts: false,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'pdf-to-printer'],
  },
  // Additional webpack config to exclude font manifest
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
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
initOpenNextCloudflareForDev();
