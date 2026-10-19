'use client';

import { useState } from 'react';

/**
 * Kéo-thả sắp xếp danh sách bằng HTML5 drag & drop, kèm phím Alt+↑ / Alt+↓ cho người dùng bàn phím.
 * `onMove(from, to)` nhận chỉ số cũ / mới.
 */
export function useSortable(onMove: (from: number, to: number) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const itemProps = (i: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      setDragging(i);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragging === null) return;
      e.preventDefault();
      if (over !== i) setOver(i);
    },
    onDragLeave: () => setOver((o) => (o === i ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragging !== null && dragging !== i) onMove(dragging, i);
      setDragging(null);
      setOver(null);
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
    },
  });

  const keyProps = (i: number, length: number) => ({
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowUp' && i > 0) {
        e.preventDefault();
        onMove(i, i - 1);
      } else if (e.key === 'ArrowDown' && i < length - 1) {
        e.preventDefault();
        onMove(i, i + 1);
      }
    },
  });

  return { dragging, over, itemProps, keyProps };
}

export function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}
