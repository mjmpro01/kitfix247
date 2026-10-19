export const PRICE_NOTE = 'Giá chưa gồm VAT, báo giá chính xác sau khi kiểm tra.';

const nf = new Intl.NumberFormat('vi-VN');

/** 150000 → "150.000 ₫" */
export function formatPrice(v: number): string {
  return `${nf.format(Math.round(v))} ₫`;
}

/** Giá luôn là khoảng: "150.000 – 450.000 ₫". */
export function formatPriceRange(from: number, to: number): string {
  if (from === to) return formatPrice(from);
  return `${nf.format(Math.round(from))} – ${nf.format(Math.round(to))} ₫`;
}
