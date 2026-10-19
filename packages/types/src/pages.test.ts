import { describe, expect, it } from 'vitest';
import { fillPageTokens, PAGE_MD_MAX, validatePages } from './index';

const settings = { hotline: '0989.041.641', zaloUrl: 'https://zalo.me/0989041641', address: '2 Bạch Đằng', hours: '7:00 – 21:00', hoursNote: 'tất cả các ngày' };

describe('fillPageTokens', () => {
  it('thay biến đã biết, giữ nguyên biến lạ', () => {
    expect(fillPageTokens('Gọi {{hotline}} ({{ hours }}, {{hoursNote}}) tại {{address}}. {{khac}}', settings)).toBe(
      'Gọi 0989.041.641 (7:00 – 21:00, tất cả các ngày) tại 2 Bạch Đằng. {{khac}}',
    );
  });
});

describe('validatePages', () => {
  it('chuẩn hoá xuống dòng, bỏ trang rỗng', () => {
    expect(validatePages({ about: '  # A\r\nb  ', warranty: '   ' })).toEqual({ ok: true, data: { about: '# A\nb' } });
  });

  it('từ chối trang lạ, sai kiểu, quá dài', () => {
    expect(validatePages({ khac: 'x' }).ok).toBe(false);
    expect(validatePages({ about: 1 }).ok).toBe(false);
    expect(validatePages({ about: 'x'.repeat(PAGE_MD_MAX + 1) }).ok).toBe(false);
    expect(validatePages(['x']).ok).toBe(false);
  });
});
