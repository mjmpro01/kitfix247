import { describe, expect, it } from 'vitest';
import { discountPercent } from './index';

describe('discountPercent', () => {
  it('tính % giảm làm tròn', () => {
    expect(discountPercent(44_850_000, 59_800_000)).toBe(25);
    expect(discountPercent(90_000, 100_000)).toBe(10);
  });
  it('không có giá, không có giá gốc, giá gốc ≤ giá bán → không hiện nhãn', () => {
    expect(discountPercent(null, 100_000)).toBeNull();
    expect(discountPercent(100_000, null)).toBeNull();
    expect(discountPercent(100_000, 100_000)).toBeNull();
    expect(discountPercent(100_000, 90_000)).toBeNull();
    expect(discountPercent(999_000, 1_000_000)).toBeNull();
  });
});
