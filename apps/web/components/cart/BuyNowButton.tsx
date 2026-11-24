'use client';

import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';

/** "Mua ngay": thêm 1 sản phẩm vào giỏ (nếu chưa có) rồi chuyển sang trang giỏ hàng để điền thông tin giao hàng. */
export function BuyNowButton({ productId, className, note }: { productId: number; className?: string; note?: string }) {
  const { lines, add } = useCart();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className ?? 'btn btn--brand'}
      onClick={() => {
        if (!lines[productId]) add(productId);
        router.push('/gio-hang');
      }}
    >
      <span>Mua ngay</span>
      {note ? <span style={{ display: 'block', fontSize: 13, fontWeight: 600, lineHeight: '18px', textTransform: 'none' }}>{note}</span> : null}
    </button>
  );
}
