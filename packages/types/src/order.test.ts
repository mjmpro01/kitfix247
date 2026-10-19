import { describe, expect, it } from 'vitest';
import { ORDER_MESSAGES, orderTotals, validateOrder } from './index';

const valid = { customerName: 'Võ Thị F', phone: '0912.345.678', address: '12 Lê Lợi, Quận 1', payment: 'cod', items: [{ productId: 1, qty: 2 }] };

describe('validateOrder', () => {
  it('chấp nhận đơn hợp lệ, chuẩn hoá SĐT', () => {
    const r = validateOrder(valid);
    expect(r).toEqual({ ok: true, data: { ...valid, phone: '0912345678' } });
  });

  it('gộp dòng trùng sản phẩm, bỏ dòng số lượng 0', () => {
    const r = validateOrder({ ...valid, items: [{ productId: 1, qty: 1 }, { productId: 2, qty: 0 }, { productId: 1, qty: 3 }] });
    expect(r.ok && r.data.items).toEqual([{ productId: 1, qty: 4 }]);
  });

  it('báo lỗi từng trường', () => {
    const r = validateOrder({ customerName: '', phone: '123', address: '', payment: 'the-tin-dung', items: [] });
    expect(r).toEqual({
      ok: false,
      errors: { customerName: ORDER_MESSAGES.customerName, phone: ORDER_MESSAGES.phone, address: ORDER_MESSAGES.address, payment: ORDER_MESSAGES.payment, items: ORDER_MESSAGES.items },
    });
  });

  it('chặn số lượng âm, thập phân, quá 99, quá 20 dòng', () => {
    for (const items of [[{ productId: 1, qty: -1 }], [{ productId: 1, qty: 1.5 }], [{ productId: 1, qty: 100 }], Array.from({ length: 21 }, (_, i) => ({ productId: i + 1, qty: 1 }))]) {
      const r = validateOrder({ ...valid, items });
      expect(r.ok ? null : r.errors.items).toBe(ORDER_MESSAGES.items);
    }
  });
});

describe('orderTotals', () => {
  it('cộng tạm tính và phí giao khi đủ giá', () => {
    expect(orderTotals([{ qty: 2, unitPrice: 50_000 }, { qty: 1, unitPrice: 120_000 }], 30_000)).toEqual({ subtotal: 220_000, shippingFee: 30_000, total: 250_000 });
  });
  it('có dòng chưa có giá → tạm tính và tổng để trống', () => {
    expect(orderTotals([{ qty: 1, unitPrice: 50_000 }, { qty: 1, unitPrice: null }], 30_000)).toEqual({ subtotal: null, shippingFee: 30_000, total: null });
  });
  it('phí giao chưa chốt → tổng để trống, tạm tính vẫn có', () => {
    expect(orderTotals([{ qty: 3, unitPrice: 10_000 }], null)).toEqual({ subtotal: 30_000, shippingFee: null, total: null });
  });
});
