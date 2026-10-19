// Menu điều hướng header (SPEC mục 4, admin "Menu điều hướng"): lưu ở khoá settings `menu`.

export interface MenuItem {
  label: string;
  /** Đường dẫn nội bộ ("/kien-thuc", "/#dich-vu") hoặc https://… */
  href: string;
  visible: boolean;
  /** "services" = mục Dịch vụ: tự xổ danh sách dịch vụ đang hiện. */
  kind: 'link' | 'services';
}

/** Menu mặc định khi admin chưa lưu (giống header thiết kế). Bảng giá tạm ẩn (SPEC mục 4). */
export const DEFAULT_MENU: MenuItem[] = [
  { label: 'Trang chủ', href: '/', visible: true, kind: 'link' },
  { label: 'Giới thiệu', href: '/gioi-thieu', visible: true, kind: 'link' },
  { label: 'Dịch vụ', href: '/#dich-vu', visible: true, kind: 'services' },
  { label: 'Bảng giá', href: '/bang-gia', visible: false, kind: 'link' },
  { label: 'Kiến thức', href: '/kien-thuc', visible: true, kind: 'link' },
  { label: 'Liên hệ', href: '/dat-lich', visible: true, kind: 'link' },
];

export const MENU_MAX_ITEMS = 10;
export const MENU_LABEL_MAX = 30;

/** Đường dẫn được phép: nội bộ bắt đầu bằng "/" (không phải "//"), hoặc https://. */
export const isMenuHref = (h: string) => /^\/(?!\/)[^\s]*$/.test(h) || /^https:\/\/[^\s]+$/.test(h);

/** Mục đang mở: "/" chỉ khớp trang chủ; mục khác khớp đường dẫn và trang con. Bỏ phần #… khi so. */
export function isMenuActive(href: string, pathname: string): boolean {
  const path = href.split('#')[0] || '/';
  if (href.startsWith('/#')) return false;
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function validateMenu(input: unknown): { ok: true; data: MenuItem[] } | { ok: false; error: string } {
  if (!Array.isArray(input) || input.length === 0 || input.length > MENU_MAX_ITEMS) return { ok: false, error: `Menu cần 1–${MENU_MAX_ITEMS} mục.` };
  const data: MenuItem[] = [];
  for (const [i, raw] of input.entries()) {
    const it = (raw ?? {}) as Record<string, unknown>;
    const label = typeof it.label === 'string' ? it.label.trim() : '';
    const href = typeof it.href === 'string' ? it.href.trim() : '';
    const kind = it.kind === 'services' ? 'services' : it.kind === 'link' || it.kind === undefined ? 'link' : null;
    if (!label || label.length > MENU_LABEL_MAX) return { ok: false, error: `Mục ${i + 1}: tên mục 1–${MENU_LABEL_MAX} ký tự.` };
    if (!isMenuHref(href)) return { ok: false, error: `Mục "${label}": đường dẫn bắt đầu bằng "/" hoặc "https://".` };
    if (!kind || typeof it.visible !== 'boolean') return { ok: false, error: `Mục "${label}" không hợp lệ.` };
    data.push({ label, href, visible: it.visible, kind });
  }
  if (data.filter((d) => d.kind === 'services').length > 1) return { ok: false, error: 'Chỉ có một mục Dịch vụ (xổ danh sách).' };
  if (!data.some((d) => d.visible)) return { ok: false, error: 'Cần ít nhất một mục đang hiện.' };
  return { ok: true, data };
}
