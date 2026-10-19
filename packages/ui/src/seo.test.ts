import { describe, expect, it } from 'vitest';
import { checkSeo, googlePreview, seoRating, type SeoCheckId, type SeoInput } from './seo';
import { slugifyVi } from './slugify';
import { formatPriceRange } from './format';

const KW = 'bếp từ báo lỗi e1';

function body(words: number, kwTimes: number): string {
  // Đoạn mở đầu có từ khoá, phần còn lại là chữ lấp đầy để kiểm soát số từ.
  const kwWords = KW.split(' ').length;
  const intro = `Khi ${KW} anh/chị nên kiểm tra nồi trước.`; // 6 + kwWords từ
  const extraKw = Array.from({ length: Math.max(0, kwTimes - 1) }, () => KW).join(' ');
  const used = 6 + kwWords + (kwTimes - 1) * kwWords + 4; // +4 cho heading và link
  const filler = Array.from({ length: Math.max(0, words - used) }, () => 'chữ').join(' ');
  return `${intro}\n\n## Nguyên nhân\n\n${extraKw} ${filler}\n\n[Đặt lịch](/dat-lich)`;
}

const good: SeoInput = {
  focusKeyword: 'Bếp từ báo lỗi E1',
  title: 'Bếp từ báo lỗi E1: nguyên nhân và cách xử lý tại nhà',
  metaTitle: '',
  metaDesc:
    'Bếp từ báo lỗi E1 là gì? Giải thích nguyên nhân thường gặp, cách tự kiểm tra tại nhà và khi nào nên gọi kỹ thuật viên KitFix247.',
  slug: 'bep-tu-bao-loi-e1-nguyen-nhan',
  contentMd: body(400, 1),
  coverAlt: 'Bếp từ báo lỗi E1 trên màn hình',
};

const failing = (input: SeoInput): SeoCheckId[] =>
  checkSeo(input)
    .checks.filter((c) => !c.pass)
    .map((c) => c.id);

describe('checkSeo — bài đạt đủ', () => {
  it('đạt 12/12, điểm 100, xếp loại Tốt', () => {
    const r = checkSeo(good);
    expect(failing(good)).toEqual([]);
    expect(r.passed).toBe(12);
    expect(r.total).toBe(12);
    expect(r.score).toBe(100);
    expect(r.ratingLabel).toBe('Tốt');
  });
});

describe('checkSeo — từng tiêu chí', () => {
  it('1. thiếu từ khoá làm trượt cả các tiêu chí phụ thuộc từ khoá', () => {
    const f = failing({ ...good, focusKeyword: '  ' });
    expect(f).toEqual(
      expect.arrayContaining(['keyword', 'titleKeyword', 'metaDescKeyword', 'slugKeyword', 'introKeyword', 'density', 'coverAltKeyword']),
    );
    expect(f).not.toContain('wordCount');
  });

  it('2. tiêu đề không chứa từ khoá (so khớp không phân biệt hoa thường)', () => {
    expect(failing({ ...good, title: 'Cách xử lý lỗi bếp tại nhà cho gia đình bận rộn' })).toContain('titleKeyword');
    expect(failing({ ...good, title: 'BẾP TỪ BÁO LỖI E1: nguyên nhân và cách xử lý' })).not.toContain('titleKeyword');
  });

  it('3. tiêu đề SEO 30–60 ký tự, mặc định lấy tiêu đề bài', () => {
    expect(failing({ ...good, metaTitle: 'Bếp từ báo lỗi E1' })).toContain('metaTitleLength');
    expect(failing({ ...good, metaTitle: 'x'.repeat(61) })).toContain('metaTitleLength');
    expect(failing({ ...good, metaTitle: 'x'.repeat(30) })).not.toContain('metaTitleLength');
    expect(failing({ ...good, metaTitle: 'x'.repeat(60) })).not.toContain('metaTitleLength');
  });

  it('4. mô tả meta 120–160 ký tự', () => {
    expect(failing({ ...good, metaDesc: `${KW} ${'a'.repeat(100)}` })).toContain('metaDescLength');
    expect(failing({ ...good, metaDesc: `${KW} ${'a'.repeat(150)}` })).toContain('metaDescLength');
  });

  it('5. mô tả meta chứa từ khoá', () => {
    expect(failing({ ...good, metaDesc: 'a'.repeat(130) })).toContain('metaDescKeyword');
  });

  it('6. slug chứa từ khoá đã slugify', () => {
    expect(failing({ ...good, slug: 'loi-bep-thuong-gap' })).toContain('slugKeyword');
  });

  it('7. từ khoá trong đoạn mở đầu (bỏ qua heading)', () => {
    const md = `## ${KW}\n\nĐoạn mở đầu không có cụm cần tìm.\n\n${good.contentMd}`;
    expect(failing({ ...good, contentMd: md })).toContain('introKeyword');
    const md2 = `## Mở đầu\n\n${good.contentMd}`;
    expect(failing({ ...good, contentMd: md2 })).not.toContain('introKeyword');
  });

  it('8. mật độ từ khoá 0,5–2,5%', () => {
    // 400 từ, từ khoá 5 từ: 1 lần = 1,25%; 3 lần = 3,75%
    expect(failing({ ...good, contentMd: body(400, 1) })).not.toContain('density');
    expect(failing({ ...good, contentMd: body(400, 3) })).toContain('density');
    expect(failing({ ...good, contentMd: body(2000, 1) })).toContain('density'); // 0,25%
  });

  it('9. bài từ 300 từ', () => {
    expect(failing({ ...good, contentMd: body(200, 1) })).toContain('wordCount');
    expect(checkSeo({ ...good, contentMd: body(300, 1) }).stats.words).toBeGreaterThanOrEqual(300);
  });

  it('10. có H2', () => {
    expect(failing({ ...good, contentMd: good.contentMd.replace('## ', '### ') })).toContain('hasH2');
  });

  it('11. có liên kết nội bộ hoặc link', () => {
    const noLink = good.contentMd.replace('[Đặt lịch](/dat-lich)', 'Đặt lịch');
    expect(failing({ ...good, contentMd: noLink })).toContain('hasLink');
    expect(failing({ ...good, contentMd: `${noLink} xem /dich-vu/sua-bep-tu` })).not.toContain('hasLink');
    expect(failing({ ...good, contentMd: `${noLink} https://kitfix247.com` })).not.toContain('hasLink');
  });

  it('12. alt ảnh đại diện chứa từ khoá', () => {
    expect(failing({ ...good, coverAlt: '' })).toContain('coverAltKeyword');
    expect(failing({ ...good, coverAlt: null })).toContain('coverAltKeyword');
  });
});

describe('điểm và xếp loại', () => {
  it('điểm = đạt/12 × 100, làm tròn', () => {
    const r = checkSeo({ ...good, coverAlt: '', metaDesc: 'ngắn' }); // trượt 4,5,12
    expect(r.passed).toBe(9);
    expect(r.score).toBe(75);
    expect(r.ratingLabel).toBe('Cần cải thiện');
  });

  it('ngưỡng ≥80 Tốt, 50–79 Cần cải thiện, <50 Kém', () => {
    expect(seoRating(80).label).toBe('Tốt');
    expect(seoRating(79).label).toBe('Cần cải thiện');
    expect(seoRating(50).label).toBe('Cần cải thiện');
    expect(seoRating(49).label).toBe('Kém');
  });
});

describe('googlePreview', () => {
  it('cắt tiêu đề 60 ký tự + " | KitFix247", URL và mô tả 160', () => {
    const p = googlePreview({ title: 'x'.repeat(80), metaTitle: '', metaDesc: 'y'.repeat(200), slug: 'abc' });
    expect(p.title.endsWith(' | KitFix247')).toBe(true);
    expect(p.title.replace(' | KitFix247', '').length).toBe(60);
    expect(p.url).toBe('kitfix247.com › kien-thuc › abc');
    expect(p.description.length).toBe(160);
  });
});

describe('slugifyVi & formatPriceRange', () => {
  it('bỏ dấu tiếng Việt, đ → d', () => {
    expect(slugifyVi('Sửa bếp từ — Đặt lịch ngay!')).toBe('sua-bep-tu-dat-lich-ngay');
    expect(slugifyVi('Máy rửa chén Bosch báo lỗi E15')).toBe('may-rua-chen-bosch-bao-loi-e15');
  });
  it('khoảng giá đúng định dạng', () => {
    expect(formatPriceRange(150000, 450000)).toBe('150.000 – 450.000 ₫');
  });
});
