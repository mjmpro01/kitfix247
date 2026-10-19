import { validateMenu } from '@kitfix/types';
import { ICONS } from '@kitfix/ui';

/** Kiểm tra các khoá nội dung trang chủ trong bảng settings. Trả giá trị đã làm sạch hoặc thông báo lỗi. */
type R = { ok: true; data: unknown } | { ok: false; error: string };

const str = (v: unknown, max: number, min = 1) => (typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** `item` trả `{ value }` khi hợp lệ, hoặc chuỗi lỗi. */
function list<T>(v: unknown, label: string, min: number, max: number, item: (x: unknown, i: number) => { value: T } | string): R {
  if (!Array.isArray(v) || v.length < min || v.length > max) return { ok: false, error: `${label}: cần ${min}–${max} mục.` };
  const out: T[] = [];
  for (const [i, x] of v.entries()) {
    const r = item(x, i);
    if (typeof r === 'string') return { ok: false, error: r };
    out.push(r.value);
  }
  return { ok: true, data: out };
}

const HERO_TEXT = { imageAlt: 200, h1: 160, mobileLine1: 60, mobileLine2: 60, mobileLead: 240 } as const;

export function validateHero(v: unknown): R {
  if (!isObj(v)) return { ok: false, error: 'Hero không hợp lệ.' };
  const imageUrl = str(v.imageUrl, 512);
  if (!imageUrl || !/^(\/(?!\/)|https?:\/\/)/.test(imageUrl)) return { ok: false, error: 'Ảnh hero cần là đường dẫn "/…" hoặc URL ảnh đã tải lên.' };
  const out: Record<string, unknown> = { imageUrl };
  for (const [k, max] of Object.entries(HERO_TEXT)) {
    const s = str(v[k], max);
    if (!s) return { ok: false, error: `Hero: "${k}" cần 1–${max} ký tự.` };
    out[k] = s;
  }
  const layout = v.layout ?? 'overlay';
  if (layout !== 'overlay' && layout !== 'clean') return { ok: false, error: 'Kiểu hero không hợp lệ.' };
  out.layout = layout;
  return { ok: true, data: out };
}

export function validateFeatures(v: unknown): R {
  const icons = Object.keys(ICONS);
  return list(v, 'Cam kết trang chủ', 1, 6, (x, i) => {
    if (!isObj(x)) return `Cam kết ${i + 1} không hợp lệ.`;
    const title = str(x.title, 60);
    const detail = str(x.detail, 80);
    if (!title || !detail) return `Cam kết ${i + 1}: nhập tiêu đề (≤60) và mô tả (≤80 ký tự).`;
    if (typeof x.icon !== 'string' || !icons.includes(x.icon)) return `Cam kết ${i + 1}: icon không hợp lệ.`;
    return { value: { title, detail, icon: x.icon } };
  });
}

export function validateCommitments(v: unknown): R {
  return list(v, 'Cam kết đặt lịch', 1, 8, (x, i) => {
    if (!isObj(x)) return `Cam kết ${i + 1} không hợp lệ.`;
    const title = str(x.title, 60);
    const detail = typeof x.detail === 'string' ? x.detail.trim().slice(0, 120) : '';
    if (!title) return `Cam kết ${i + 1}: nhập tiêu đề (≤60 ký tự).`;
    return { value: { title, detail } };
  });
}

export function validatePromises(v: unknown): R {
  return list(v, 'Lời hứa', 1, 8, (x, i) => {
    const s = str(x, 60);
    return s ? { value: s } : `Lời hứa ${i + 1}: 1–60 ký tự.`;
  });
}

export function validateRating(v: unknown): R {
  if (!isObj(v)) return { ok: false, error: 'Đánh giá tổng không hợp lệ.' };
  const score = typeof v.score === 'number' ? Math.round(v.score * 10) / 10 : NaN;
  const outOf = v.outOf === undefined ? 5 : v.outOf;
  const label = str(v.label, 80);
  if (outOf !== 5) return { ok: false, error: 'Thang điểm là 5.' };
  if (!(score >= 1 && score <= 5)) return { ok: false, error: 'Điểm đánh giá từ 1 đến 5.' };
  if (!label) return { ok: false, error: 'Nhập dòng mô tả điểm đánh giá (≤80 ký tự).' };
  return { ok: true, data: { score, outOf: 5, label } };
}

export const HOME_VALIDATORS: Record<string, (v: unknown) => R> = {
  hero: validateHero,
  features: validateFeatures,
  commitments: validateCommitments,
  promises: validatePromises,
  rating: validateRating,
  menu: (v) => validateMenu(v),
};
