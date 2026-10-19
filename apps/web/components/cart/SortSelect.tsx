'use client';

import type { ProductSort } from '@kitfix/types';

const OPTIONS: { v: ProductSort; label: string }[] = [
  { v: 'new', label: 'Mới nhất' },
  { v: 'price_asc', label: 'Giá thấp đến cao' },
  { v: 'price_desc', label: 'Giá cao đến thấp' },
];

/** Form GET: chọn là gửi ngay; không có JS vẫn dùng được nhờ nút "Áp dụng". */
export function SortSelect({ sort, category, className, selectClassName }: { sort: ProductSort; category?: string; className?: string; selectClassName?: string }) {
  return (
    <form method="get" action="/san-pham" className={className}>
      {category ? <input type="hidden" name="nhom" value={category} /> : null}
      <label htmlFor="sp-sort">Sắp xếp</label>
      <select id="sp-sort" name="sap-xep" defaultValue={sort} className={selectClassName} onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {OPTIONS.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn btn--sec">
          Áp dụng
        </button>
      </noscript>
    </form>
  );
}
