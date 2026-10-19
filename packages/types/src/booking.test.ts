import { describe, expect, it } from 'vitest';
import { BOOKING_MESSAGES, normalizePhone, validateBooking } from './index';

const valid = { name: 'Nguyễn Văn A', phone: '0989041641', device: 'Bếp từ' };

describe('normalizePhone', () => {
  it('bỏ dấu cách, dấu chấm, gạch ngang', () => {
    expect(normalizePhone('0989.041.641')).toBe('0989041641');
    expect(normalizePhone(' 0989 041 641 ')).toBe('0989041641');
    expect(normalizePhone('0989-041-641')).toBe('0989041641');
  });
});

describe('validateBooking', () => {
  it('chấp nhận dữ liệu hợp lệ và chuẩn hoá SĐT', () => {
    const r = validateBooking({ ...valid, phone: '0989.041 641', address: '  2 Bạch Đằng ' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.phone).toBe('0989041641');
      expect(r.data.address).toBe('2 Bạch Đằng');
      expect(r.data.description).toBe('');
    }
  });

  it('báo lỗi khi thiếu họ tên', () => {
    for (const name of ['', '   ', 'A']) {
      const r = validateBooking({ ...valid, name });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.name).toBe(BOOKING_MESSAGES.name);
    }
  });

  it.each([
    ['', 'trống'],
    ['989041641', 'thiếu số 0 đầu'],
    ['098904164', '9 chữ số'],
    ['09890416411', '11 chữ số'],
    ['1989041641', 'không bắt đầu bằng 0'],
    ['0989o41641', 'có chữ cái'],
    ['+84989041641', 'dạng +84'],
  ])('báo lỗi SĐT %s (%s)', (phone) => {
    const r = validateBooking({ ...valid, phone });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.phone).toBe(BOOKING_MESSAGES.phone);
  });

  it('chỉ nhận thiết bị trong danh sách', () => {
    expect(validateBooking({ ...valid, device: 'Khác' }).ok).toBe(true);
    expect(validateBooking({ ...valid, device: 'Vệ sinh / bảo dưỡng' }).ok).toBe(true);
    const r = validateBooking({ ...valid, device: 'Tủ lạnh' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.device).toBe(BOOKING_MESSAGES.device);
  });

  it('giới hạn độ dài địa chỉ và mô tả', () => {
    const r = validateBooking({ ...valid, address: 'x'.repeat(256), description: 'y'.repeat(2001) });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.address).toBeDefined();
      expect(r.errors.description).toBeDefined();
    }
  });

  it('trả về đủ mọi lỗi cùng lúc', () => {
    const r = validateBooking({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(['device', 'name', 'phone']);
  });
});
