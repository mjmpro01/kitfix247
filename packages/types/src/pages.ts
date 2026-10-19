import type { Settings } from './index';

/** Trang nội dung tĩnh (Giới thiệu, chính sách…): thân bài Markdown lưu ở khoá settings `pages`. */
export const CONTENT_PAGES = [
  { key: 'about', path: '/gioi-thieu', title: 'Giới thiệu' },
  { key: 'warranty', path: '/chinh-sach-bao-hanh', title: 'Chính sách bảo hành' },
  { key: 'privacy', path: '/chinh-sach-bao-mat', title: 'Chính sách bảo mật' },
] as const;

export type ContentPageKey = (typeof CONTENT_PAGES)[number]['key'];

/** Thiếu khoá (vd production chưa seed) → trang dùng nội dung mặc định có placeholder [ ... ]. */
export type PagesSettings = Partial<Record<ContentPageKey, string>>;

export const PAGE_MD_MAX = 20_000;

/**
 * Biến chèn được vào Markdown: `{{hotline}}` → giá trị trong Cài đặt, để chủ không phải gõ lại
 * hotline, giờ làm, địa chỉ (và tự đổi theo khi Cài đặt đổi).
 */
export const PAGE_TOKENS = ['hotline', 'zaloUrl', 'address', 'hours', 'hoursNote'] as const satisfies readonly (keyof Settings)[];

export function fillPageTokens(md: string, settings: Pick<Settings, (typeof PAGE_TOKENS)[number]>): string {
  return md.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, k: string) =>
    (PAGE_TOKENS as readonly string[]).includes(k) ? String(settings[k as (typeof PAGE_TOKENS)[number]] ?? '') : all,
  );
}

/** Kiểm tra giá trị khoá `pages` gửi lên: chỉ các trang đã biết, mỗi trang là chuỗi ≤ PAGE_MD_MAX. */
export function validatePages(input: unknown): { ok: true; data: PagesSettings } | { ok: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'Cần là object.' };
  const data: PagesSettings = {};
  for (const [k, v] of Object.entries(input)) {
    if (!CONTENT_PAGES.some((p) => p.key === k)) return { ok: false, error: `Trang "${k}" không được hỗ trợ.` };
    if (typeof v !== 'string' || v.length > PAGE_MD_MAX) return { ok: false, error: `Nội dung trang cần là chữ, tối đa ${PAGE_MD_MAX.toLocaleString('vi-VN')} ký tự.` };
    const md = v.replace(/\r\n/g, '\n').trim();
    if (md) data[k as ContentPageKey] = md;
  }
  return { ok: true, data };
}
