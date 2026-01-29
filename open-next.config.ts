import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Properly export the Cloudflare configuration
export default defineCloudflareConfig({
  // Basic configuration for Cloudflare deployment
  // Uncomment to enable R2 cache if needed
  // r2Cache: {
  //   bucket: "your-bucket-name",
  //   previewId: "your-preview-id",
  // },
});