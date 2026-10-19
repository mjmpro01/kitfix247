'use client';

import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { useCart } from './CartProvider';
import s from '../SiteHeader.module.css';

/** Nút giỏ hàng ở header — chỉ hiện khi giỏ có hàng (Shop chưa nằm trong menu chính). */
export function CartLink() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <Link href="/gio-hang" className={s.cartLink} aria-label={`Giỏ hàng: ${count} sản phẩm`}>
      <Icon name="cart" size={22} />
      <span className={s.cartBadge} aria-hidden="true">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
