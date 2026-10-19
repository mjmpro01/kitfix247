import { describe, expect, it } from 'vitest';
import { DEFAULT_MENU, isMenuActive, isMenuHref, validateMenu } from './index';

describe('validateMenu', () => {
  it('chấp nhận menu mặc định, cắt khoảng trắng', () => {
    expect(validateMenu(DEFAULT_MENU)).toEqual({ ok: true, data: DEFAULT_MENU });
    const r = validateMenu([{ label: '  Shop ', href: ' /san-pham ', visible: true, kind: 'link' }]);
    expect(r).toEqual({ ok: true, data: [{ label: 'Shop', href: '/san-pham', visible: true, kind: 'link' }] });
  });

  it('từ chối đường dẫn lạ, tên rỗng/dài, 2 mục Dịch vụ, menu ẩn hết, quá nhiều mục', () => {
    const ok = { label: 'A', href: '/a', visible: true, kind: 'link' };
    expect(validateMenu([{ ...ok, href: 'javascript:alert(1)' }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, href: '//evil.com' }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, href: 'http://khong-https.vn' }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, label: ' ' }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, label: 'x'.repeat(31) }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, kind: 'services' }, { ...ok, kind: 'services' }]).ok).toBe(false);
    expect(validateMenu([{ ...ok, visible: false }]).ok).toBe(false);
    expect(validateMenu(Array.from({ length: 11 }, () => ok)).ok).toBe(false);
    expect(validateMenu([]).ok).toBe(false);
  });
});

describe('isMenuHref / isMenuActive', () => {
  it('đường dẫn hợp lệ', () => {
    expect(isMenuHref('/kien-thuc')).toBe(true);
    expect(isMenuHref('/#dich-vu')).toBe(true);
    expect(isMenuHref('https://zalo.me/0989041641')).toBe(true);
  });
  it('trang chủ chỉ khớp "/", mục khác khớp cả trang con, link "/#…" không đánh dấu', () => {
    expect(isMenuActive('/', '/')).toBe(true);
    expect(isMenuActive('/', '/kien-thuc')).toBe(false);
    expect(isMenuActive('/kien-thuc', '/kien-thuc/bai-a')).toBe(true);
    expect(isMenuActive('/kien-thuc', '/kien-thuc-khac')).toBe(false);
    expect(isMenuActive('/#dich-vu', '/')).toBe(false);
  });
});
