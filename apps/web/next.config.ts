import { join } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Cho phép build song song với `next dev` mà không ghi đè .next (vd NEXT_DIST_DIR=.next-build).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Bản Docker: gói server tối giản (.next/standalone); root monorepo để kéo đủ packages/* và node_modules.
  output: 'standalone',
  outputFileTracingRoot: join(__dirname, '../../'),
};

export default nextConfig;
