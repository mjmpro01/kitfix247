'use client';

import { useRouter } from 'next/navigation';
import type { Brand } from '@kitfix/types';
import s from './kien-thuc.module.css';

interface Props {
  brands: Pick<Brand, 'slug' | 'name'>[];
  value: string;
  /** URL đích cho từng lựa chọn (khoá '' = Tất cả hãng), dựng sẵn ở server. */
  hrefs: Record<string, string>;
  /** Tham số giữ nguyên khi không có JS (form GET về /kien-thuc). */
  keep: { category?: string; q?: string };
}

/** Lọc theo hãng: có JS thì chuyển trang ngay khi chọn; không có JS thì bấm "Lọc". */
export function BrandSelect({ brands, value, hrefs, keep }: Props) {
  const router = useRouter();
  return (
    <form action="/kien-thuc" method="get" className={s.brandForm}>
      {keep.category && <input type="hidden" name="category" value={keep.category} />}
      {keep.q && <input type="hidden" name="q" value={keep.q} />}
      <label htmlFor="loc-hang" className={s.brandLabel}>
        Thương hiệu
      </label>
      <select
        id="loc-hang"
        name="brand"
        className={s.select}
        defaultValue={value}
        onChange={(e) => router.push(hrefs[e.target.value] ?? hrefs[''], { scroll: false })}
      >
        <option value="">Tất cả hãng</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={s.selectBtn}>
          Lọc
        </button>
      </noscript>
    </form>
  );
}
