import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Đọc SITE_URL lúc chạy (image Docker không biết tên miền lúc build).
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    // /api/* là JSON của API (Caddy chuyển tiếp) — không cần Google thu thập.
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
