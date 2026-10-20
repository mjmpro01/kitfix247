import { describe, expect, it } from 'vitest';
import { extractVerification, validateAnalytics } from './index';

describe('validateAnalytics', () => {
  it('chuẩn hoá mã GA4, rỗng = không gắn', () => {
    expect(validateAnalytics({ gaId: ' g-ab12cd34ef ', googleVerification: '' })).toEqual({ ok: true, data: { gaId: 'G-AB12CD34EF', googleVerification: null } });
    expect(validateAnalytics({})).toEqual({ ok: true, data: { gaId: null, googleVerification: null } });
  });

  it('nhận nguyên thẻ meta Search Console', () => {
    const tag = '<meta name="google-site-verification" content="AbC_123-xyzXYZ0987654321" />';
    expect(extractVerification(tag)).toBe('AbC_123-xyzXYZ0987654321');
    expect(validateAnalytics({ googleVerification: tag })).toEqual({ ok: true, data: { gaId: null, googleVerification: 'AbC_123-xyzXYZ0987654321' } });
  });

  it('từ chối mã sai dạng (UA- cũ, có ký tự lạ, chèn script)', () => {
    expect(validateAnalytics({ gaId: 'UA-123456-1' }).ok).toBe(false);
    expect(validateAnalytics({ gaId: 'G-ABC"><script>' }).ok).toBe(false);
    expect(validateAnalytics({ googleVerification: 'abc def <script>' }).ok).toBe(false);
    expect(validateAnalytics('G-ABC').ok).toBe(false);
  });
});
