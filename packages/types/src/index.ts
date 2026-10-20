// DTO dùng chung web ↔ api. Giữ đúng hợp đồng SPEC mục 6.
import type { PagesSettings } from './pages';
import type { MenuItem } from './menu';
import type { AnalyticsSettings } from './analytics';

export interface Settings {
  hotline: string; // dạng hiển thị: 0989.041.641
  hotlineTel: string; // dạng link: 0989041641
  zaloUrl: string;
  address: string;
  hours: string; // 7:00 – 21:00
  hoursNote: string; // tất cả các ngày (kể cả thứ 7, chủ nhật)
  siteUrl: string;
  tagline: string;
  /** Câu giới thiệu ngắn ở footer. */
  about: string;
  rating: { score: number; outOf: number; label: string };
  commitments: { title: string; detail: string }[];
  features: { title: string; detail: string; icon: string }[];
  promises: string[];
  payments: string[];
  hero: HeroSettings;
  /** Menu header; thiếu khoá = DEFAULT_MENU. */
  menu?: MenuItem[];
  /** GA4 + xác minh Search Console; thiếu khoá = chưa gắn. */
  analytics?: AnalyticsSettings;
  /** Shop: phí giao (₫) — null = chưa chốt, báo khi gọi xác nhận đơn. Thiếu khoá cũng hiểu là null. */
  shop?: ShopSettings;
  /** Thân bài Markdown các trang nội dung (Giới thiệu, chính sách) — xem pages.ts. */
  pages?: PagesSettings;
}

export interface HeroSettings {
  imageUrl: string;
  imageAlt: string;
  /** H1 của trang chủ (SEO). Kiểu "clean" hiện H1 này trên ảnh; kiểu "overlay" ẩn đi vì chữ đã nằm trong ảnh. */
  h1: string;
  mobileLine1: string;
  mobileLine2: string;
  mobileLead: string;
  /**
   * "overlay" (mặc định): ảnh banner có sẵn chữ, 2 nút HTML phủ đúng vị trí nút trong ảnh (SPEC mục 4).
   * "clean": ảnh không chữ — tiêu đề, đoạn dẫn, nút là chữ thật đặt trên ảnh.
   */
  layout?: 'overlay' | 'clean';
}

export interface ShopSettings {
  shippingFee: number | null;
}

export interface ServiceFault {
  id: number;
  title: string;
  code: string;
  cause: string;
  priceFrom: number;
  priceTo: number;
}

export interface ServiceFaq {
  id: number;
  question: string;
  answer: string;
}

export interface ServiceSummary {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  shortHint: string;
  cardText: string;
  icon: string;
  /** Thiết bị (khớp BOOKING_DEVICES) — dùng để gợi ý dịch vụ liên quan cho bài viết. */
  device: string;
  /** Ảnh thẻ dịch vụ (admin tải lên); null = hiện icon + placeholder. */
  imageUrl: string | null;
  imageAlt: string | null;
  sort: number;
  showHome: boolean;
}

export interface ServiceDetail extends ServiceSummary {
  lead: string;
  device: BookingDevice;
  faultsTitle: string;
  seoTitle: string | null;
  seoDesc: string | null;
  faults: ServiceFault[];
  faqs: ServiceFaq[];
}

export interface ProcessStep {
  n: number;
  title: string;
  description: string;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  logoStyle: 'gray' | 'color';
}

export interface BrandDetail extends Brand {
  description: string | null;
  devices: string[];
  seoTitle: string | null;
  seoDesc: string | null;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Review {
  id: number;
  customerName: string;
  area: string;
  device: string;
  rating: number;
  content: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  icon: string;
  /** null = chưa có giá: không bán online, khách gọi hỏi giá. */
  price: number | null;
  imageUrl: string | null;
}

export const PRODUCT_SORTS = ['new', 'price_asc', 'price_desc'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface PostBrandRef {
  slug: string;
  name: string;
}

export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  device: string | null;
  brands: PostBrandRef[];
  coverUrl: string | null;
  coverAlt: string | null;
  readMinutes: number;
  publishedAt: string;
}

export interface PostDetail extends PostSummary {
  contentMd: string;
  author: string;
  focusKeyword: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  updatedAt: string;
  /** Tối đa 3 bài: ưu tiên cùng chuyên mục / cùng hãng, thiếu thì lấy bài mới nhất. */
  related: PostSummary[];
}

/** GET /posts?category=&brand=&q=&page=&limit= — category, brand là slug. */
export interface PostListQuery {
  category?: string;
  brand?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface PostPage {
  items: PostSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const POSTS_PER_PAGE = 9;
export const POSTS_MAX_LIMIT = 50;

// ---------- Đặt lịch ----------

export const BOOKING_DEVICES = [
  { value: 'Bếp từ', label: 'Bếp từ' },
  { value: 'Bếp hồng ngoại', label: 'Bếp hồng ngoại' },
  { value: 'Lò nướng', label: 'Lò nướng' },
  { value: 'Lò vi sóng', label: 'Lò vi sóng' },
  { value: 'Máy hút mùi', label: 'Máy hút mùi' },
  { value: 'Máy rửa chén', label: 'Máy rửa chén' },
  { value: 'Lắp đặt thiết bị bếp', label: 'Lắp đặt thiết bị bếp' },
  { value: 'Vệ sinh / bảo dưỡng', label: 'Vệ sinh / bảo dưỡng' },
  { value: 'Khác', label: 'Thiết bị khác' },
] as const;

export type BookingDevice = (typeof BOOKING_DEVICES)[number]['value'];

export interface BookingInput {
  name: string;
  phone: string;
  device: string;
  address?: string;
  description?: string;
  /** Honeypot: người thật để trống. */
  website?: string;
}

export interface BookingData {
  name: string;
  phone: string; // đã chuẩn hoá: 10 chữ số
  device: BookingDevice;
  address: string;
  description: string;
}

export type BookingErrors = Partial<Record<'name' | 'phone' | 'device' | 'address' | 'description', string>>;

export const BOOKING_MESSAGES = {
  name: 'Anh/chị vui lòng nhập họ tên.',
  phone: 'Số điện thoại chưa đúng — cần 10 chữ số, bắt đầu bằng 0.',
  device: 'Anh/chị vui lòng chọn thiết bị cần sửa.',
  address: 'Địa chỉ tối đa 255 ký tự.',
  description: 'Mô tả lỗi tối đa 2000 ký tự.',
} as const;

export const PHONE_PATTERN = /^0\d{9}$/;

/** Bỏ dấu cách, dấu chấm (và gạch ngang) mà khách hay gõ: "0989.041.641" → "0989041641". */
export function normalizePhone(raw: string): string {
  return (raw ?? '').replace(/[\s.\-]/g, '');
}

export function isBookingDevice(v: string): v is BookingDevice {
  return BOOKING_DEVICES.some((d) => d.value === v);
}

export type BookingValidation = { ok: true; data: BookingData } | { ok: false; errors: BookingErrors };

export function validateBooking(input: Partial<BookingInput>): BookingValidation {
  const errors: BookingErrors = {};
  const name = String(input.name ?? '').trim();
  const phone = normalizePhone(String(input.phone ?? ''));
  const device = String(input.device ?? '').trim();
  const address = String(input.address ?? '').trim();
  const description = String(input.description ?? '').trim();

  if (name.length < 2 || name.length > 120) errors.name = BOOKING_MESSAGES.name;
  if (!PHONE_PATTERN.test(phone)) errors.phone = BOOKING_MESSAGES.phone;
  if (!isBookingDevice(device)) errors.device = BOOKING_MESSAGES.device;
  if (address.length > 255) errors.address = BOOKING_MESSAGES.address;
  if (description.length > 2000) errors.description = BOOKING_MESSAGES.description;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, phone, device: device as BookingDevice, address, description } };
}

export interface BookingCreated {
  id: number;
}
export * from './admin';
export * from './order';
export * from './menu';
export * from './analytics';
export * from './pages';
