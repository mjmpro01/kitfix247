'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ORDER_MAX_LINES, ORDER_MAX_QTY } from '@kitfix/types';

/** Giỏ hàng lưu ở trình duyệt khách: { [productId]: số lượng }. Giá luôn lấy lại từ API khi hiển thị và khi đặt. */
type Lines = Record<number, number>;

const KEY = 'kf_cart_v1';

interface Cart {
  lines: Lines;
  count: number;
  /** false cho tới khi đọc xong localStorage — tránh nháy "giỏ trống" lúc tải trang. */
  ready: boolean;
  add: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}

const CartContext = createContext<Cart | null>(null);

function read(): Lines {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const out: Lines = {};
    for (const [k, v] of Object.entries(raw)) {
      const id = Number(k);
      const qty = Number(v);
      if (Number.isInteger(id) && id > 0 && Number.isInteger(qty) && qty > 0) out[id] = Math.min(qty, ORDER_MAX_QTY);
    }
    return out;
  } catch {
    return {};
  }
}

function write(lines: Lines) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Trình duyệt chặn bộ nhớ (chế độ riêng tư…) — giỏ vẫn chạy trong phiên hiện tại.
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Lines>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
    // Đồng bộ giữa các tab.
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((fn: (l: Lines) => Lines) => {
    setLines((prev) => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const value = useMemo<Cart>(
    () => ({
      lines,
      ready,
      count: Object.values(lines).reduce((a, b) => a + b, 0),
      add: (id, qty = 1) =>
        update((l) => {
          if (!l[id] && Object.keys(l).length >= ORDER_MAX_LINES) return l;
          return { ...l, [id]: Math.min((l[id] ?? 0) + qty, ORDER_MAX_QTY) };
        }),
      setQty: (id, qty) =>
        update((l) => {
          const { [id]: _, ...rest } = l;
          return qty > 0 ? { ...rest, [id]: Math.min(qty, ORDER_MAX_QTY) } : rest;
        }),
      remove: (id) =>
        update((l) => {
          const { [id]: _, ...rest } = l;
          return rest;
        }),
      clear: () => update(() => ({})),
    }),
    [lines, ready, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): Cart {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart cần nằm trong <CartProvider>');
  return c;
}
