'use client';

import { Icon } from '@/components/Icon';
import { useCart } from './CartProvider';

/** Nút "Thêm vào giỏ" (SanPham): đã có trong giỏ thì đổi thành "Thêm nữa (n trong giỏ)". */
export function AddToCartButton({ productId, productName, className }: { productId: number; productName: string; className?: string }) {
  const { lines, add } = useCart();
  const qty = lines[productId] ?? 0;
  return (
    <button type="button" className={className ?? 'btn btn--brand'} onClick={() => add(productId)} aria-label={`Thêm ${productName} vào giỏ${qty ? `, đang có ${qty}` : ''}`}>
      <Icon name="cart" size={18} />
      {qty ? `Thêm nữa (${qty} trong giỏ)` : 'Thêm vào giỏ'}
    </button>
  );
}
