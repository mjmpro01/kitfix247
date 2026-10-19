/** Server đọc SITE_URL lúc chạy (image Docker dùng được cho mọi tên miền); dev dùng NEXT_PUBLIC_SITE_URL trong .env.local. */
export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

/** /bang-gia tạm ẩn khỏi menu cho tới khi chủ quyết định (SPEC mục 4). */
export const SHOW_PRICE_PAGE = false;

export const serviceHref = (slug: string) => `/dich-vu/${slug}`;

/** "Sửa bếp từ" → "sửa bếp từ" (chỉ hạ chữ đầu, giữ nguyên phần còn lại). */
export const lowerFirst = (s: string) => s.charAt(0).toLocaleLowerCase('vi') + s.slice(1);

export function formatDateVi(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(iso),
  );
}

export const KNOWLEDGE_PATH = '/kien-thuc';
export const postHref = (slug: string) => `${KNOWLEDGE_PATH}/${slug}`;
export const brandHref = (slug: string) => `${KNOWLEDGE_PATH}/hang/${slug}`;

export interface KnowledgeFilters {
  category?: string;
  brand?: string;
  q?: string;
  page?: number;
}

/** Dựng URL danh sách Kiến thức, bỏ tham số rỗng và page=1. */
export function knowledgeHref(base: string, f: KnowledgeFilters): string {
  const qs = new URLSearchParams();
  if (f.category) qs.set('category', f.category);
  if (f.brand) qs.set('brand', f.brand);
  if (f.q) qs.set('q', f.q);
  if (f.page && f.page > 1) qs.set('page', String(f.page));
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export const telLd = (hotlineTel: string) => `+84${hotlineTel.replace(/^0/, '')}`;
