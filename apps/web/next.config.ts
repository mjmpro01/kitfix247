import { join } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Cho phép build song song với `next dev` mà không ghi đè .next (vd NEXT_DIST_DIR=.next-build).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Bản Docker: gói server tối giản (.next/standalone); root monorepo để kéo đủ packages/* và node_modules.
  output: 'standalone',
  // Ảnh admin tải lên đi qua server action (app/admin/actions.ts → uploadFile). Mặc định Next chỉ nhận 1 MB,
  // ảnh lớn hơn làm request treo; API cho tối đa 2 MB (UPLOAD_MAX_BYTES) + phần đóng gói multipart.
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  outputFileTracingRoot: join(__dirname, '../../'),
};

export default nextConfig;
