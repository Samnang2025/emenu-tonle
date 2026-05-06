import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig = {
  /* config options here */
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
initOpenNextCloudflareForDev();
