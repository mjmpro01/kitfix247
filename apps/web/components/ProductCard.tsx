import Image from 'next/image';
import Link from 'next/link';
import { discountPercent, type Product } from '@kitfix/types';
import { formatPrice } from '@kitfix/ui';
import { Icon } from '@/components/Icon';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { productHref } from '@/lib/site';
import s from './ProductCard.module.css';

/** Khối giá: giá gốc gạch ngang (nếu có giảm) + giá bán; chưa có giá thì "Giá: liên hệ". Dùng chung thẻ và trang chi tiết. */
export function ProductPrice({ product, size = 'md' }: { product: Pick<Product, 'price' | 'compareAtPrice'>; size?: 'md' | 'lg' }) {
  const { price, compareAtPrice } = product;
  if (price === null) return <div className={`${s.price} ${size === 'lg' ? s.priceLg : ''}`}>Giá: liên hệ</div>;
  return (
    <div className={`${s.prices} ${size === 'lg' ? s.pricesLg : ''}`}>
      {compareAtPrice !== null ? (
        <del className={s.compare}>
          <span className="visually-hidden">Giá gốc </span>
          {formatPrice(compareAtPrice)}
        </del>
      ) : null}
      <span className={`${s.price} ${size === 'lg' ? s.priceLg : ''}`}>
        {compareAtPrice !== null ? <span className="visually-hidden">Giá bán </span> : null}
        {formatPrice(price)}
      </span>
    </div>
  );
}

/**
 * Thẻ sản phẩm (trang hãng, /san-pham, trang chủ): bấm vào ảnh hoặc tên mở trang chi tiết.
 * Nhãn "-25%" khi có giá gốc; nút thêm vào giỏ nằm trên vùng bấm của thẻ.
 */
export function ProductCard({ product: p, headingLevel = 3, sizes }: { product: Product; headingLevel?: 2 | 3; sizes: string }) {
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const pct = discountPercent(p.price, p.compareAtPrice);
  return (
    <article className={`card ${s.card}`}>
      <div className={s.img}>
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt="" fill sizes={sizes} unoptimized={/^https?:\/\//.test(p.imageUrl)} className={s.imgEl} />
        ) : (
          <span className={s.placeholder} aria-hidden="true">
            <Icon name={p.icon} size={44} strokeWidth={1.5} />
            [Ảnh sản phẩm]
          </span>
        )}
        {pct ? (
          <span className={s.badge}>
            <span className="visually-hidden">Giảm </span>-{pct}%
          </span>
        ) : null}
      </div>
      <div className={s.body}>
        <div className={s.cat}>{p.brand ? `${p.category} · ${p.brand.name}` : p.category}</div>
        <H className={s.name}>
          <Link href={productHref(p.slug)} className={s.link}>
            {p.name}
          </Link>
        </H>
        <div className={s.grow} />
        <ProductPrice product={p} />
        <AddToCartButton productId={p.id} productName={p.name} className={`btn btn--brand ${s.add}`} />
      </div>
    </article>
  );
}
