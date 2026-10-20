// Google Analytics 4 + xác minh Google Search Console: lưu ở khoá settings `analytics`, admin dán mã trong Cài đặt.

export interface AnalyticsSettings {
  /** Mã đo lường GA4, dạng G-XXXXXXXXXX. null = không gắn GA. */
  gaId: string | null;
  /** Chuỗi `content` của thẻ meta google-site-verification (Search Console, cách xác minh "Thẻ HTML"). */
  googleVerification: string | null;
}

export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,16}$/;
const VERIFY_PATTERN = /^[A-Za-z0-9_-]{10,120}$/;

/**
 * Nhận cả chuỗi mã lẫn nguyên thẻ chủ dán vào:
 * `<meta name="google-site-verification" content="abc…" />` → "abc…".
 */
export function extractVerification(raw: string): string {
  const m = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : raw).trim();
}

export function validateAnalytics(input: unknown): { ok: true; data: AnalyticsSettings } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Cấu hình Google không hợp lệ.' };
  const o = input as Record<string, unknown>;
  const ga = typeof o.gaId === 'string' ? o.gaId.trim().toUpperCase() : '';
  const ver = typeof o.googleVerification === 'string' ? extractVerification(o.googleVerification) : '';
  if (ga && !GA_ID_PATTERN.test(ga)) return { ok: false, error: 'Mã GA4 có dạng G-XXXXXXXXXX (Google Analytics › Quản trị › Luồng dữ liệu).' };
  if (ver && !VERIFY_PATTERN.test(ver)) return { ok: false, error: 'Mã xác minh Search Console không hợp lệ — dán phần content của thẻ meta google-site-verification.' };
  return { ok: true, data: { gaId: ga || null, googleVerification: ver || null } };
}
