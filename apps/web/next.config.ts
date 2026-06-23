import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {};

export default withPayload(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev` only. Guarding to
// development keeps production builds (incl. Workers Builds) from requiring a
// local Hyperdrive connection string — the real binding is used at runtime.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
