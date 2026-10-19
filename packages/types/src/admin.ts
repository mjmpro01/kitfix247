// DTO cho khu quản trị /admin (SPEC mục 6–7). Mọi route /admin cần JWT.

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminUserInfo {
  id: number;
  email: string;
  role: string;
}

export interface AdminLoginResult {
  token: string;
  /** Thời điểm hết hạn (ISO). */
  expiresAt: string;
  user: AdminUserInfo;
}

// ---------- Lịch hẹn ----------

export const BOOKING_STATUSES = ['new', 'called', 'assigned', 'done', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: 'Mới — chờ gọi',
  called: 'Đã gọi xác nhận',
  assigned: 'KTV đang đến / sửa',
  done: 'Hoàn tất',
  cancelled: 'Đã huỷ',
};

/** Cam kết gọi lại: yêu cầu "new" quá ngần này phút là quá hạn. */
export const CALLBACK_SLA_MINUTES = 15;

export function isBookingStatus(v: unknown): v is BookingStatus {
  return typeof v === 'string' && (BOOKING_STATUSES as readonly string[]).includes(v);
}

export function isBookingOverdue(b: { status: BookingStatus; createdAt: string }, now = Date.now()): boolean {
  return b.status === 'new' && now - new Date(b.createdAt).getTime() > CALLBACK_SLA_MINUTES * 60_000;
}

export interface AdminBooking {
  id: number;
  name: string;
  phone: string;
  device: string;
  address: string;
  description: string;
  status: BookingStatus;
  technician: string | null;
  source: 'form' | 'call' | 'zalo';
  createdAt: string;
  calledAt: string | null;
}

export interface AdminBookingPage {
  items: AdminBooking[];
  total: number;
  page: number;
  limit: number;
  /** Số lịch theo từng trạng thái (không phụ thuộc bộ lọc trạng thái). */
  counts: Record<BookingStatus | 'all', number>;
}

export interface BookingStatusInput {
  status: BookingStatus;
  /** Bắt buộc khi chuyển sang "assigned" (nếu lịch chưa có KTV). */
  technician?: string;
}

// ---------- Tổng quan ----------

export interface AdminStats {
  bookingsToday: number;
  bookingsYesterday: number;
  waiting: number;
  overdue: number;
  newOrders: number;
  ordersAwaitingTransfer: number;
  publishedPosts: number;
  postsNeedSeo: number;
}

// ---------- Dịch vụ & bảng giá ----------

export interface AdminFault {
  id?: number;
  title: string;
  code: string;
  cause: string;
  priceFrom: number;
  priceTo: number;
}

export interface AdminFaq {
  id?: number;
  question: string;
  answer: string;
}

export interface AdminPriceItem {
  id?: number;
  groupId: number;
  serviceId: number | null;
  name: string;
  duration: string;
  priceFrom: number;
  priceTo: number;
}

export interface AdminPriceGroup {
  id: number;
  name: string;
  sort: number;
  showHome: boolean;
  items: (AdminPriceItem & { id: number })[];
}

export interface AdminServiceFields {
  name: string;
  shortName: string;
  shortHint: string;
  cardText: string;
  lead: string;
  device: string;
  faultsTitle: string;
  icon: string;
  showHome: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface AdminService extends AdminServiceFields {
  id: number;
  slug: string;
  sort: number;
  faults: (AdminFault & { id: number })[];
  faqs: (AdminFaq & { id: number })[];
  priceItems: (AdminPriceItem & { id: number })[];
}

export type AdminServiceCreate = Pick<AdminServiceFields, 'name' | 'device'> & Partial<AdminServiceFields> & { slug?: string };

// ---------- Thương hiệu ----------

export interface AdminBrand {
  id: number;
  slug: string;
  name: string;
  logoUrl: string | null;
  logoStyle: 'gray' | 'color';
  description: string | null;
  devices: string[];
  sort: number;
  showHome: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  postCount: number;
}

export type AdminBrandInput = Partial<Omit<AdminBrand, 'id' | 'sort' | 'postCount'>>;

export interface UploadResult {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

// ---------- Bài viết ----------

export type PostStatus = 'draft' | 'published';

export interface AdminPostSummary {
  id: number;
  slug: string;
  title: string;
  status: PostStatus;
  category: string;
  focusKeyword: string | null;
  seoScore: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface AdminPost extends AdminPostSummary {
  excerpt: string;
  contentMd: string;
  coverUrl: string | null;
  coverAlt: string | null;
  categoryId: number;
  device: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  readMinutes: number;
  author: string;
  brandIds: number[];
}

export interface AdminPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  contentMd: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  categoryId: number;
  device?: string | null;
  status?: PostStatus;
  focusKeyword?: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
  author?: string;
  brandIds?: number[];
}

/** Kết quả chấm lại SEO ở backend (đầy đủ checks theo SeoResult của @kitfix/ui). */
export interface SeoCheckResponse {
  postId: number;
  score: number;
  ratingLabel: string;
  passed: number;
  total: number;
  checks: { id: string; label: string; pass: boolean; detail?: string }[];
}

// ---------- Đánh giá ----------

export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface AdminReview {
  id: number;
  customerName: string;
  area: string;
  device: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  showHome: boolean;
  createdAt: string;
}

export type AdminReviewInput = Partial<Pick<AdminReview, 'customerName' | 'area' | 'device' | 'rating' | 'content' | 'status' | 'showHome'>>;
