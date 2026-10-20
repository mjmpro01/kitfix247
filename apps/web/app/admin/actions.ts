'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { CONTENT_PAGES } from '@kitfix/types';
import type {
  MenuItem,
  AdminOrder,
  AdminProduct,
  AdminProductInput,
  OrderStatus,
  AdminBooking,
  AdminBrand,
  AdminBrandInput,
  AdminFaq,
  AdminFault,
  AdminPost,
  AdminPostInput,
  AdminPriceGroup,
  AdminPriceItem,
  AdminReview,
  AdminReviewInput,
  AdminService,
  AdminServiceFields,
  BookingStatus,
  PagesSettings,
  SeoCheckResponse,
  Settings,
  UploadResult,
} from '@kitfix/types';
import { AdminApiError, adminSend, apiLogin } from '@/lib/admin/api';
import type { ActionResult } from '@/lib/admin/result';
import { clearAdminToken, LOGIN_PATH, safeNext, setAdminToken } from '@/lib/admin/session';

/** Chạy một thao tác admin; lỗi API → { ok: false } để form hiện thông báo, redirect (401) vẫn được ném tiếp. */
async function run<T>(fn: () => Promise<T>, message?: string): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn(), message };
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof AdminApiError) return { ok: false, error: e.message, errors: e.errors };
    console.error(e);
    return { ok: false, error: 'Không kết nối được máy chủ. Anh/chị thử lại sau ít phút.' };
  }
}

/** Dữ liệu công khai đổi → dựng lại trang có tag tương ứng (lib/api.ts), và làm mới khu admin. */
function refresh(...tags: string[]) {
  for (const t of tags) revalidateTag(t);
  revalidatePath('/admin', 'layout');
}

// ---------- Đăng nhập ----------

export interface LoginState {
  error?: string;
  email?: string;
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return { error: 'Anh/chị nhập email và mật khẩu.', email };
  let res: Awaited<ReturnType<typeof apiLogin>>;
  try {
    res = await apiLogin(email, password);
  } catch {
    return { error: 'Không kết nối được máy chủ API.', email };
  }
  if (res.status === 429) return { error: 'Thử sai quá nhiều lần. Anh/chị đợi 1 phút rồi thử lại.', email };
  if (!res.ok || !res.body?.token) return { error: 'Email hoặc mật khẩu không đúng.', email };
  await setAdminToken(res.body.token, res.body.expiresAt);
  redirect(safeNext(form.get('next')));
}

export async function logoutAction() {
  await clearAdminToken();
  redirect(LOGIN_PATH);
}

// ---------- Lịch hẹn ----------

export async function setBookingStatus(id: number, status: BookingStatus, technician?: string) {
  return run(async () => {
    const b = await adminSend<AdminBooking>('PATCH', `/admin/bookings/${id}/status`, { status, technician });
    refresh();
    return b;
  });
}

// ---------- Dịch vụ & bảng giá ----------

export interface ServiceSave {
  fields: Partial<AdminServiceFields>;
  faults: AdminFault[];
  faqs: AdminFaq[];
  items: Omit<AdminPriceItem, 'serviceId'>[];
}

export async function saveService(id: number, s: ServiceSave) {
  return run(async () => {
    await adminSend<AdminService>('PATCH', `/admin/services/${id}`, s.fields);
    await adminSend<AdminService>('PUT', `/admin/services/${id}/faults`, { faults: s.faults });
    await adminSend<AdminService>('PUT', `/admin/services/${id}/faqs`, { faqs: s.faqs });
    const saved = await adminSend<AdminService>('PUT', `/admin/services/${id}/price-items`, { items: s.items });
    refresh('services');
    return saved;
  }, 'Đã lưu thay đổi');
}

export async function createService(name: string, device: string) {
  return run(async () => {
    const s = await adminSend<AdminService>('POST', '/admin/services', { name, device });
    refresh('services');
    return s;
  }, 'Đã thêm dịch vụ (đang ẩn khỏi trang chủ)');
}

export async function deleteService(id: number) {
  return run(async () => {
    await adminSend('DELETE', `/admin/services/${id}`);
    refresh('services');
  }, 'Đã xoá dịch vụ');
}

export async function reorder(kind: 'services' | 'brands', ids: number[]) {
  return run(async () => {
    await adminSend('PUT', `/admin/${kind}/order`, { ids });
    refresh(kind, ...(kind === 'brands' ? ['posts'] : []));
  }, 'Đã lưu thứ tự');
}

export async function createPriceGroup(name: string) {
  return run(async () => {
    const g = await adminSend<AdminPriceGroup>('POST', '/admin/price-groups', { name });
    refresh('services');
    return g;
  });
}

// ---------- Thương hiệu ----------

export interface BrandChange {
  /** id hãng đã có, hoặc khoá tạm "moi-…" cho hãng mới. */
  key: string;
  id: number | null;
  data: AdminBrandInput;
}

/** Lưu các hãng đã sửa / thêm, rồi thứ tự (theo key) nếu có đổi. Trả map key → id thật. */
export async function saveBrands(changes: BrandChange[], order: string[] | null) {
  return run(async () => {
    const ids: Record<string, number> = {};
    for (const c of changes) {
      if (c.id === null) ids[c.key] = (await adminSend<AdminBrand>('POST', '/admin/brands', c.data)).id;
      else ids[c.key] = (await adminSend<AdminBrand>('PATCH', `/admin/brands/${c.id}`, c.data)).id;
    }
    if (order) await adminSend('PUT', '/admin/brands/order', { ids: order.map((k) => ids[k] ?? Number(k)) });
    // Tên hãng hiện ở thẻ bài viết → làm mới cả "posts".
    refresh('brands', 'posts');
    return ids;
  }, 'Đã lưu thay đổi');
}

/** Tải file lên API (logo hãng / ảnh bài viết), trả URL công khai. */
export async function uploadFile(form: FormData): Promise<ActionResult<UploadResult>> {
  const f = form.get('folder');
  const folder = f === 'brands' || f === 'products' || f === 'hero' || f === 'services' ? f : 'posts';
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Chưa chọn file.' };
  const body = new FormData();
  body.set('file', file, file.name);
  return run(() => adminSend<UploadResult>('POST', `/admin/uploads?folder=${folder}`, body));
}

// ---------- Bài viết ----------

export async function savePost(id: number | null, input: AdminPostInput) {
  const res = await run(async () => {
    const post = id ? await adminSend<AdminPost>('PATCH', `/admin/posts/${id}`, input) : await adminSend<AdminPost>('POST', '/admin/posts', input);
    // Chấm lại ở backend bằng cùng checkSeo và lưu seo_score.
    const seo = await adminSend<SeoCheckResponse>('POST', `/admin/posts/${post.id}/seo-check`);
    refresh('posts');
    return { post, seo };
  });
  if (res.ok && !id) redirect(`/admin/bai-viet/${res.data.post.id}?moi=1`);
  return res;
}

export async function deletePost(id: number) {
  const res = await run(async () => {
    await adminSend('DELETE', `/admin/posts/${id}`);
    refresh('posts');
  });
  if (res.ok) redirect('/admin/bai-viet');
  return res;
}

// ---------- Đánh giá ----------

export async function updateReview(id: number, data: AdminReviewInput) {
  return run(async () => {
    const r = await adminSend<AdminReview>('PATCH', `/admin/reviews/${id}`, data);
    refresh('reviews');
    return r;
  });
}

export async function createReview(data: AdminReviewInput) {
  return run(async () => {
    const r = await adminSend<AdminReview>('POST', '/admin/reviews', data);
    refresh('reviews');
    return r;
  }, 'Đã thêm đánh giá');
}

export async function deleteReview(id: number) {
  return run(async () => {
    await adminSend('DELETE', `/admin/reviews/${id}`);
    refresh('reviews');
  });
}

// ---------- Cài đặt ----------

export interface SettingsState {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  /** Giá trị vừa gửi — React 19 reset form sau action, form dùng lại làm defaultValue để không mất chữ đã gõ. */
  values?: Record<string, string>;
}

const SETTING_FIELDS = ['hotline', 'hotlineTel', 'zaloUrl', 'address', 'hours', 'hoursNote'] as const;

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const data: Partial<Settings> = {};
  for (const k of SETTING_FIELDS) data[k] = String(form.get(k) ?? '').trim();
  data.hotlineTel = (data.hotlineTel ?? '').replace(/[\s.\-]/g, '');
  data.payments = String(form.get('payments') ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  // Phí giao: để trống = chưa chốt (báo khi gọi xác nhận đơn).
  const feeRaw = String(form.get('shippingFee') ?? '').replace(/[^\d]/g, '');
  data.shop = { shippingFee: feeRaw ? Number(feeRaw) : null };
  // Google: để trống = không gắn. API chuẩn hoá và kiểm tra dạng mã (validateAnalytics).
  data.analytics = { gaId: String(form.get('gaId') ?? '').trim() || null, googleVerification: String(form.get('googleVerification') ?? '').trim() || null };
  const values = Object.fromEntries([...SETTING_FIELDS, 'payments', 'shippingFee', 'gaId', 'googleVerification'].map((k) => [k, String(form.get(k) ?? '')]));
  const res = await run(async () => {
    await adminSend<Settings>('PUT', '/admin/settings', data);
    refresh('settings');
  });
  return res.ok ? { ok: true, values } : { error: res.error, errors: res.errors, values };
}

/** Trang nội dung (Giới thiệu, chính sách): gửi cả khoá `pages` một lần vì API ghi đè nguyên khoá. */
export async function savePages(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const pages: PagesSettings = {};
  const values: Record<string, string> = {};
  for (const p of CONTENT_PAGES) {
    values[p.key] = String(form.get(p.key) ?? '');
    pages[p.key] = values[p.key];
  }
  const res = await run(async () => {
    await adminSend<Settings>('PUT', '/admin/settings', { pages });
    refresh('settings');
  });
  return res.ok ? { ok: true, values } : { error: res.error, errors: res.errors, values };
}

// ---------- Shop: sản phẩm, đơn hàng ----------

export async function saveProduct(id: number | null, data: AdminProductInput) {
  return run(async () => {
    const p = id ? await adminSend<AdminProduct>('PATCH', `/admin/products/${id}`, data) : await adminSend<AdminProduct>('POST', '/admin/products', data);
    refresh('products');
    return p;
  }, id ? 'Đã lưu sản phẩm' : 'Đã thêm sản phẩm');
}

export async function deleteProduct(id: number) {
  return run(async () => {
    await adminSend('DELETE', `/admin/products/${id}`);
    refresh('products');
  }, 'Đã xoá sản phẩm');
}

export async function setOrderStatus(id: number, status: OrderStatus) {
  return run(async () => {
    const o = await adminSend<AdminOrder>('PATCH', `/admin/orders/${id}/status`, { status });
    refresh();
    return o;
  });
}

// ---------- Trang chủ & Hero, Menu điều hướng ----------

export interface HomeSave {
  settings: Pick<Settings, 'hero' | 'features' | 'commitments' | 'promises' | 'rating' | 'tagline' | 'about'>;
  steps: { title: string; description: string }[];
}

export async function saveHome(data: HomeSave) {
  return run(async () => {
    await adminSend<Settings>('PUT', '/admin/settings', data.settings);
    await adminSend('PUT', '/admin/process-steps', { steps: data.steps });
    refresh('settings', 'process');
  }, 'Đã lưu — trang chủ đã cập nhật');
}

export async function saveMenu(menu: MenuItem[]) {
  return run(async () => {
    await adminSend<Settings>('PUT', '/admin/settings', { menu });
    refresh('settings');
  }, 'Đã lưu menu — website đã cập nhật');
}
