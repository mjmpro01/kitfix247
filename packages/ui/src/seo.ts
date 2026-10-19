import { slugifyVi } from './slugify';

// Luật chấm SEO 12 tiêu chí — SPEC mục 7. Dùng chung frontend (chấm trực tiếp) và backend (lưu seo_score).

export interface SeoInput {
  focusKeyword: string;
  title: string;
  /** Tiêu đề SEO; để trống thì dùng tiêu đề bài. */
  metaTitle?: string | null;
  metaDesc?: string | null;
  slug: string;
  contentMd: string;
  coverAlt?: string | null;
}

export type SeoCheckId =
  | 'keyword'
  | 'titleKeyword'
  | 'metaTitleLength'
  | 'metaDescLength'
  | 'metaDescKeyword'
  | 'slugKeyword'
  | 'introKeyword'
  | 'density'
  | 'wordCount'
  | 'hasH2'
  | 'hasLink'
  | 'coverAltKeyword';

export interface SeoCheck {
  id: SeoCheckId;
  label: string;
  pass: boolean;
  detail?: string;
}

export type SeoRating = 'good' | 'ok' | 'poor';

export interface SeoResult {
  score: number;
  rating: SeoRating;
  ratingLabel: string;
  passed: number;
  total: number;
  checks: SeoCheck[];
  stats: { words: number; occurrences: number; density: number; metaTitleLength: number; metaDescLength: number };
}

export const SEO_LIMITS = {
  metaTitle: [30, 60],
  metaDesc: [120, 160],
  density: [0.5, 2.5],
  minWords: 300,
} as const;

const lower = (s: string | null | undefined) => (s ?? '').toLocaleLowerCase('vi');

/** Bỏ cú pháp markdown để đếm từ và tìm từ khoá trên chữ người đọc thấy. */
export function markdownToText(md: string): string {
  return (md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/<[^>]+>/g, ' ');
}

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

/** Đoạn mở đầu: khối đầu tiên (ngăn bằng dòng trống) không phải heading. */
export function firstParagraph(md: string): string {
  const blocks = (md ?? '').split(/\n\s*\n/).map((b) => b.trim());
  return blocks.find((b) => b && !/^#{1,6}\s/.test(b)) ?? '';
}

export function seoRating(score: number): { rating: SeoRating; label: string } {
  if (score >= 80) return { rating: 'good', label: 'Tốt' };
  if (score >= 50) return { rating: 'ok', label: 'Cần cải thiện' };
  return { rating: 'poor', label: 'Kém' };
}

export function checkSeo(input: SeoInput): SeoResult {
  const kw = lower(input.focusKeyword).trim().replace(/\s+/g, ' ');
  const hasKw = kw.length > 0;
  const metaTitle = (input.metaTitle ?? '').trim() || input.title.trim();
  const metaDesc = (input.metaDesc ?? '').trim();
  const text = markdownToText(input.contentMd);
  const words = countWords(text);
  const kwWords = countWords(kw);
  const occurrences = hasKw ? countOccurrences(lower(text).replace(/\s+/g, ' '), kw) : 0;
  const density = words > 0 ? (occurrences * kwWords * 100) / words : 0;
  const kwSlug = slugifyVi(kw);
  const [tMin, tMax] = SEO_LIMITS.metaTitle;
  const [dMin, dMax] = SEO_LIMITS.metaDesc;
  const [densMin, densMax] = SEO_LIMITS.density;

  const checks: SeoCheck[] = [
    { id: 'keyword', label: 'Đã nhập từ khoá chính', pass: hasKw },
    { id: 'titleKeyword', label: 'Tiêu đề chứa từ khoá', pass: hasKw && lower(input.title).includes(kw) },
    {
      id: 'metaTitleLength',
      label: `Tiêu đề SEO dài ${tMin}–${tMax} ký tự`,
      pass: metaTitle.length >= tMin && metaTitle.length <= tMax,
      detail: `${metaTitle.length} ký tự`,
    },
    {
      id: 'metaDescLength',
      label: `Mô tả meta dài ${dMin}–${dMax} ký tự`,
      pass: metaDesc.length >= dMin && metaDesc.length <= dMax,
      detail: `${metaDesc.length} ký tự`,
    },
    { id: 'metaDescKeyword', label: 'Mô tả meta chứa từ khoá', pass: hasKw && lower(metaDesc).includes(kw) },
    { id: 'slugKeyword', label: 'Slug chứa từ khoá', pass: hasKw && kwSlug.length > 0 && lower(input.slug).includes(kwSlug) },
    {
      id: 'introKeyword',
      label: 'Từ khoá có trong đoạn mở đầu',
      pass: hasKw && lower(markdownToText(firstParagraph(input.contentMd))).replace(/\s+/g, ' ').includes(kw),
    },
    {
      id: 'density',
      label: `Mật độ từ khoá ${String(densMin).replace('.', ',')}–${String(densMax).replace('.', ',')}%`,
      pass: hasKw && density >= densMin && density <= densMax,
      detail: `${density.toFixed(2).replace('.', ',')}% (${occurrences} lần)`,
    },
    { id: 'wordCount', label: `Bài từ ${SEO_LIMITS.minWords} từ`, pass: words >= SEO_LIMITS.minWords, detail: `${words} từ` },
    { id: 'hasH2', label: 'Có tiêu đề phụ H2', pass: /^## /m.test(input.contentMd ?? '') },
    {
      id: 'hasLink',
      label: 'Có liên kết nội bộ',
      pass: /\/dich-vu|\/dat-lich|\]\(|https?:\/\//.test(input.contentMd ?? ''),
    },
    { id: 'coverAltKeyword', label: 'Alt ảnh đại diện chứa từ khoá', pass: hasKw && lower(input.coverAlt).includes(kw) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  const { rating, label } = seoRating(score);
  return {
    score,
    rating,
    ratingLabel: label,
    passed,
    total: checks.length,
    checks,
    stats: { words, occurrences, density, metaTitleLength: metaTitle.length, metaDescLength: metaDesc.length },
  };
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

/** Xem trước kết quả Google. */
export function googlePreview(input: Pick<SeoInput, 'title' | 'metaTitle' | 'metaDesc' | 'slug'>) {
  const t = (input.metaTitle ?? '').trim() || input.title.trim();
  return {
    title: `${truncate(t, 60)} | KitFix247`,
    url: `kitfix247.com › kien-thuc › ${input.slug}`,
    description: truncate((input.metaDesc ?? '').trim(), 160),
  };
}
