/** "1.200.000" / "1200000 ₫" → 1200000; rỗng hoặc sai → null. */
export function parsePrice(v: string): number | null {
  const digits = v.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
}

const nf = new Intl.NumberFormat('vi-VN');
export const showPrice = (n: number | null | undefined) => (n === null || n === undefined ? '' : nf.format(n));
