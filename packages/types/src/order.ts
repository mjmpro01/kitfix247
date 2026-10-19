// Đơn hàng Shop (SPEC mục 5, 6). Giá luôn tính lại ở API theo bảng products — client chỉ gửi id + số lượng.
// Sản phẩm chưa có giá vẫn đặt được: dòng đó và tổng tiền để trống, nhân viên báo giá khi gọi xác nhận.

import { normalizePhone, PHONE_PATTERN } from './index';

export const PAYMENT_METHODS = [
  { value: 'cod', label: 'Tiền mặt khi nhận hàng', note: 'COD' },
  { value: 'bank', label: 'Chuyển khoản ngân hàng', note: '' },
  { value: 'momo', label: 'Ví MoMo', note: '' },
  { value: 'zalopay', label: 'ZaloPay', note: '' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export const paymentLabel = (v: string) => PAYMENT_METHODS.find((p) => p.value === v)?.label ?? v;

export const ORDER_MAX_LINES = 20;
export const ORDER_MAX_QTY = 99;

export interface OrderLineInput {
  productId: number;
  qty: number;
}

export interface OrderInput {
  customerName: string;
  phone: string;
  address: string;
  payment: string;
  items: OrderLineInput[];
  /** Honeypot: người thật để trống. */
  website?: string;
}

export interface OrderData {
  customerName: string;
  phone: string;
  address: string;
  payment: PaymentMethod;
  items: OrderLineInput[];
}

export type OrderErrors = Partial<Record<'customerName' | 'phone' | 'address' | 'payment' | 'items', string>>;

export const ORDER_MESSAGES = {
  customerName: 'Anh/chị vui lòng nhập họ tên.',
  phone: 'Số điện thoại chưa đúng — cần 10 chữ số, bắt đầu bằng 0.',
  address: 'Anh/chị vui lòng nhập địa chỉ giao hàng.',
  payment: 'Anh/chị vui lòng chọn cách thanh toán.',
  items: 'Giỏ hàng trống hoặc số lượng không hợp lệ.',
} as const;

export type OrderValidation = { ok: true; data: OrderData } | { ok: false; errors: OrderErrors };

/** Gộp dòng trùng sản phẩm, bỏ dòng số lượng 0. */
export function validateOrder(input: Partial<OrderInput>): OrderValidation {
  const errors: OrderErrors = {};
  const customerName = String(input.customerName ?? '').trim();
  const phone = normalizePhone(String(input.phone ?? ''));
  const address = String(input.address ?? '').trim();
  const payment = String(input.payment ?? '');

  if (customerName.length < 2 || customerName.length > 120) errors.customerName = ORDER_MESSAGES.customerName;
  if (!PHONE_PATTERN.test(phone)) errors.phone = ORDER_MESSAGES.phone;
  if (address.length < 5 || address.length > 255) errors.address = ORDER_MESSAGES.address;
  if (!PAYMENT_METHODS.some((p) => p.value === payment)) errors.payment = ORDER_MESSAGES.payment;

  const merged = new Map<number, number>();
  const raw = Array.isArray(input.items) ? input.items : null;
  let badItem = !raw || raw.length > ORDER_MAX_LINES;
  for (const it of raw ?? []) {
    const id = Number(it?.productId);
    const qty = Number(it?.qty);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 0) {
      badItem = true;
      continue;
    }
    if (qty > 0) merged.set(id, (merged.get(id) ?? 0) + qty);
  }
  const items = [...merged].map(([productId, qty]) => ({ productId, qty }));
  if (badItem || items.length === 0 || items.some((i) => i.qty > ORDER_MAX_QTY)) errors.items = ORDER_MESSAGES.items;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { customerName, phone, address, payment: payment as PaymentMethod, items } };
}

export interface OrderCreated {
  code: string;
}

// ---------- Quản trị ----------

export const ORDER_STATUSES = ['new', 'confirmed', 'shipping', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Mới — chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

export const isOrderStatus = (v: unknown): v is OrderStatus => typeof v === 'string' && (ORDER_STATUSES as readonly string[]).includes(v);

export interface AdminOrderLine {
  productId: number;
  /** Tên lúc đặt (order_items.product_name) — giữ đúng dù sản phẩm đổi tên sau này. */
  name: string;
  sku: string;
  qty: number;
  /** null = sản phẩm chưa có giá lúc đặt, báo giá khi gọi xác nhận. */
  unitPrice: number | null;
}

export interface AdminOrder {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  payment: PaymentMethod;
  status: OrderStatus;
  /** null khi có dòng chưa có giá / phí giao chưa chốt. */
  subtotal: number | null;
  shippingFee: number | null;
  total: number | null;
  createdAt: string;
  items: AdminOrderLine[];
}

export interface AdminOrderPage {
  items: AdminOrder[];
  total: number;
  counts: Record<OrderStatus | 'all', number>;
}

export interface AdminProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  icon: string;
  status: 'active' | 'hidden';
  orderCount: number;
}

export type AdminProductInput = Partial<Omit<AdminProduct, 'id' | 'orderCount'>>;

/** Tạm tính / tổng: null nếu có dòng chưa có giá (hoặc phí giao chưa chốt). Dùng chung web (giỏ hàng) và API (lưu đơn). */
export function orderTotals(lines: { qty: number; unitPrice: number | null }[], shippingFee: number | null) {
  const subtotal = lines.every((l) => l.unitPrice !== null) ? lines.reduce((sum, l) => sum + l.qty * (l.unitPrice as number), 0) : null;
  const total = subtotal !== null && shippingFee !== null ? subtotal + shippingFee : null;
  return { subtotal, shippingFee, total };
}
