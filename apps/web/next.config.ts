import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// node-postgres + its Cloudflare socket shim contain workerd-specific code
	// (pg-cloudflare imports `cloudflare:sockets`). Keep them external so the
	// workerd runtime resolves them instead of esbuild trying to bundle them.
	serverExternalPackages: ["pg", "pg-cloudflare"],
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev` only. Guarding to
// development keeps production builds (incl. Workers Builds) from requiring a
// local Hyperdrive connection string — the real binding is used at runtime.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
