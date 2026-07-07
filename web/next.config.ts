import type { NextConfig } from "next";

// Next.js 16 removed devIndicators.appIsrStatus and .buildActivity
// (the dev-only "compiled" pill and route badge). They were the only
// keys we had configured, and neither appears in production builds
// anyway, so we drop the whole devIndicators block. Leaving the
// config as a no-op object so future settings have somewhere to land.
const nextConfig: NextConfig = {};

export default nextConfig;
