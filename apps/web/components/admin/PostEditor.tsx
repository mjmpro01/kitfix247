'use client';

import Link from 'next/link';
import { useMemo, useRef, useState, useTransition } from 'react';
import { BOOKING_DEVICES, type AdminBrand, type AdminPost, type Category, type PostStatus, type ServiceSummary } from '@kitfix/types';
import { checkSeo, countWords, googlePreview, markdownToText, SEO_LIMITS, slugifyVi, type SeoCheckId } from '@kitfix/ui';
import { deletePost, savePost, uploadFile } from '@/app/admin/actions';
import s from '@/app/admin/admin.module.css';

/** Gợi ý cho từng tiêu chí SEO (AdminBaiViet). */
const HINTS: Record<SeoCheckId, (kwSlug: string) => string> = {
  keyword: () => 'Mỗi bài tập trung một từ khoá khách hay tìm.',
  titleKeyword: () => 'Đặt từ khoá càng gần đầu tiêu đề càng tốt.',
  metaTitleLength: () => 'Để trống sẽ dùng tiêu đề bài viết.',
  metaDescLength: () => 'Tóm tắt nội dung bài, có lời mời gọi.',
  metaDescKeyword: () => 'Google thường in đậm từ khoá trong mô tả.',
  slugKeyword: (kwSlug) => `Slug nên chứa: ${kwSlug || '…'}`,
  introKeyword: () => 'Nhắc từ khoá trong 1–2 câu đầu bài.',
  density: () => 'Nhắc tự nhiên, không nhồi từ khoá.',
  wordCount: () => 'Bài đủ dài để giải thích rõ nguyên nhân và cách xử lý.',
  hasH2: () => 'Chia bài theo từng lỗi hoặc từng bước.',
  hasLink: () => 'Dẫn tới trang dịch vụ hoặc trang Đặt lịch.',
  coverAltKeyword: () => 'Mô tả ảnh và nhắc từ khoá tự nhiên.',
};

const scoreClass = (score: number) => (score >= 80 ? s.good : score >= 50 ? s.warn : s.bad);
const lenClass = (n: number, [lo, hi]: readonly [number, number]) => (n >= lo && n <= hi ? s.good : n > hi ? s.bad : s.warn);

interface Props {
  post: AdminPost | null;
  categories: Category[];
  brands: AdminBrand[];
  services: ServiceSummary[];
  hotline: { display: string; tel: string };
  justCreated?: boolean;
}

export function PostEditor({ post, categories, brands, services, hotline, justCreated }: Props) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? categories[0]?.id ?? 0);
  const [device, setDevice] = useState(post?.device ?? '');
  const [brandIds, setBrandIds] = useState<number[]>(post?.brandIds ?? []);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.contentMd ?? '');
  const [coverUrl, setCoverUrl] = useState(post?.coverUrl ?? '');
  const [coverAlt, setCoverAlt] = useState(post?.coverAlt ?? '');
  const [kw, setKw] = useState(post?.focusKeyword ?? '');
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? '');
  const [metaDesc, setMetaDesc] = useState(post?.metaDesc ?? '');
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'draft');
  const [savedScore, setSavedScore] = useState<number | null>(post?.seoScore ?? null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(justCreated ? { ok: true, text: 'Đã tạo bài viết' } : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const seo = useMemo(
    () => checkSeo({ focusKeyword: kw, title, metaTitle, metaDesc, slug, contentMd: content, coverAlt }),
    [kw, title, metaTitle, metaDesc, slug, content, coverAlt],
  );
  const preview = googlePreview({ title: title || 'Tiêu đề bài viết', metaTitle, metaDesc, slug: slug || 'duong-dan' });
  const words = countWords(markdownToText(content));
  const kwSlug = slugifyVi(kw);

  const onTitle = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugifyVi(v));
  };

  /** Chèn markdown tại con trỏ (bọc vùng chọn nếu có). */
  const insert = (before: string, after = '', placeholder = '') => {
    const el = editorRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };
  /** Chèn khối bắt đầu dòng mới (heading, trích dẫn). */
  const insertBlock = (prefix: string, placeholder: string) => {
    const el = editorRef.current;
    const pos = el?.selectionStart ?? content.length;
    const lead = pos === 0 ? '' : content.slice(0, pos).endsWith('\n\n') ? '' : content.slice(0, pos).endsWith('\n') ? '\n' : '\n\n';
    insert(`${lead}${prefix}`, '\n\n', placeholder);
  };

  const upload = async (file: File, folder: 'posts') => {
    const fd = new FormData();
    fd.set('file', file);
    fd.set('folder', folder);
    setUploading(true);
    const r = await uploadFile(fd);
    setUploading(false);
    if (!r.ok) {
      setNotice({ ok: false, text: r.error });
      return null;
    }
    return r.data.url;
  };

  const save = (nextStatus: PostStatus) => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Nhập tiêu đề bài viết.';
    if (!slugifyVi(slug)) errs.slug = 'Nhập đường dẫn (bấm “Tạo từ tiêu đề”).';
    if (!categoryId) errs.categoryId = 'Chọn chuyên mục.';
    if (!content.trim()) errs.contentMd = 'Bài viết chưa có nội dung.';
    setErrors(errs);
    if (Object.keys(errs).length) {
      setNotice({ ok: false, text: 'Còn thông tin chưa hợp lệ.' });
      return;
    }
    start(async () => {
      const r = await savePost(post?.id ?? null, {
        title,
        slug,
        excerpt,
        contentMd: content,
        coverUrl: coverUrl || null,
        coverAlt: coverAlt || null,
        categoryId,
        device: device || null,
        status: nextStatus,
        focusKeyword: kw || null,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        brandIds,
      });
      // Bài mới: action chuyển sang trang sửa bài nên chỉ tới đây khi lỗi.
      if (!r.ok) {
        setErrors(r.errors ?? {});
        setNotice({ ok: false, text: r.error });
        return;
      }
      setStatus(r.data.post.status);
      setSlug(r.data.post.slug);
      setExcerpt(r.data.post.excerpt);
      setSavedScore(r.data.seo.score);
      setNotice({
        ok: true,
        text: `${nextStatus === 'published' ? 'Đã xuất bản — bài hiện ở mục Kiến thức' : 'Đã lưu nháp'} · điểm SEO đã lưu: ${r.data.seo.score}`,
      });
    });
  };

  const fieldError = (k: string) =>
    errors[k] ? (
      <span id={`err-${k}`} className={s.fieldError}>
        {errors[k]}
      </span>
    ) : null;
  const errProps = (k: string) => (errors[k] ? { 'aria-invalid': true as const, 'aria-describedby': `err-${k}` } : {});

  return (
    <>
      <div className={s.pageHead}>
        <div>
          <nav aria-label="Breadcrumb" className={s.crumb}>
            <Link href="/admin/bai-viet">Bài viết</Link> / {post ? 'Sửa bài' : 'Viết bài mới'}
          </nav>
          <h1>{post ? 'Sửa bài viết' : 'Viết bài mới'}</h1>
        </div>
        <div className={s.headActions}>
          <span role="status" aria-live="polite">
            {notice ? <span className={`${s.toast} ${notice.ok ? '' : s.toastError}`}>{notice.text}</span> : null}
          </span>
          {post && status === 'published' ? (
            <a className={s.btn} href={`/kien-thuc/${slug}`} target="_blank" rel="noopener">
              Xem trên website
            </a>
          ) : null}
          <button type="button" className={s.btn} onClick={() => save('draft')} disabled={pending}>
            {status === 'published' ? 'Chuyển về nháp' : 'Lưu nháp'}
          </button>
          <button type="button" className={`${s.btn} ${s.btnBrand}`} onClick={() => save('published')} disabled={pending}>
            {pending ? 'Đang lưu…' : status === 'published' ? 'Cập nhật' : 'Xuất bản'}
          </button>
        </div>
      </div>

      <div className={`${s.content} ${s.contentWide}`}>
        <div className={s.cols}>
          {/* SOẠN BÀI */}
          <div className={s.colMain}>
            <div className={s.card}>
              <label className={s.label}>
                <span className={s.labelText}>Tiêu đề bài viết (H1)</span>
                <input className={`${s.input} ${s.inputTitle}`} value={title} onChange={(e) => onTitle(e.target.value)} maxLength={255} {...errProps('title')} />
                {fieldError('title')}
              </label>
              <div className={s.fieldRow}>
                <div className={s.label} style={{ flex: '2 1 280px' }}>
                  <label className={s.labelText} htmlFor="post-slug">
                    Đường dẫn (slug)
                  </label>
                  <div className={s.affix}>
                    <span className={s.affixText}>kitfix247.com/kien-thuc/</span>
                    <input
                      id="post-slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugTouched(true);
                      }}
                      onBlur={() => setSlug((v) => slugifyVi(v))}
                      maxLength={200}
                      {...errProps('slug')}
                    />
                    <button type="button" className={s.affixBtn} onClick={() => setSlug(slugifyVi(title))}>
                      Tạo từ tiêu đề
                    </button>
                  </div>
                  {fieldError('slug')}
                </div>
                <label className={s.label} style={{ flex: '1 1 180px' }}>
                  <span className={s.labelText}>Chuyên mục</span>
                  <select className={s.select} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} {...errProps('categoryId')}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldError('categoryId')}
                </label>
                <label className={s.label} style={{ flex: '1 1 180px' }}>
                  <span className={s.labelText}>Thiết bị</span>
                  <select className={s.select} value={device} onChange={(e) => setDevice(e.target.value)}>
                    <option value="">Không gắn thiết bị</option>
                    {BOOKING_DEVICES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset className={s.fieldset}>
                <legend className={s.legend}>
                  Thương hiệu liên quan <span className={s.labelHint}>— bài hiện khi khách bấm tên hãng ở trang chủ</span>
                </legend>
                <div className={s.chips}>
                  {brands.map((b) => {
                    const on = brandIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={s.chip}
                        aria-pressed={on}
                        onClick={() => setBrandIds((ids) => (on ? ids.filter((x) => x !== b.id) : [...ids, b.id]))}
                      >
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className={s.label}>
                <span className={s.labelText}>
                  Đoạn trích <span className={s.labelHint}>hiện ở thẻ bài; để trống sẽ dùng mô tả meta</span>
                </span>
                <textarea className={s.textarea} rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={500} />
              </label>
            </div>

            <div className={`${s.card} ${s.cardFlush}`}>
              <div role="toolbar" aria-label="Định dạng" className={s.toolbar}>
                <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insertBlock('## ', 'Tiêu đề phụ')} aria-label="Chèn tiêu đề H2">
                  H2
                </button>
                <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insertBlock('### ', 'Tiêu đề nhỏ')} aria-label="Chèn tiêu đề H3">
                  H3
                </button>
                <button type="button" className={`${s.tool} ${s.toolStrong}`} onClick={() => insert('**', '**', 'chữ đậm')} aria-label="In đậm">
                  B
                </button>
                <button type="button" className={`${s.tool} ${s.toolItalic}`} onClick={() => insert('_', '_', 'chữ nghiêng')} aria-label="In nghiêng">
                  I
                </button>
                <select
                  className={s.toolSelect}
                  aria-label="Chèn link dịch vụ"
                  value=""
                  onChange={(e) => {
                    const sv = services.find((x) => x.slug === e.target.value);
                    if (sv) insert('[', `](/dich-vu/${sv.slug})`, sv.name.toLocaleLowerCase('vi'));
                  }}
                >
                  <option value="">Chèn link dịch vụ…</option>
                  {services.map((sv) => (
                    <option key={sv.slug} value={sv.slug}>
                      {sv.name}
                    </option>
                  ))}
                </select>
                <button type="button" className={s.tool} onClick={() => insert('[', '](/dat-lich)', 'đặt lịch')}>
                  Link Đặt lịch
                </button>
                <button type="button" className={s.tool} onClick={() => imageInput.current?.click()} disabled={uploading}>
                  {uploading ? 'Đang tải ảnh…' : 'Chèn ảnh'}
                </button>
                <button
                  type="button"
                  className={s.tool}
                  onClick={() =>
                    insertBlock(
                      '> ',
                      `**Cần hỗ trợ ngay?** Gọi [${hotline.display}](tel:${hotline.tel}) hoặc [đặt lịch](/dat-lich) — chúng tôi gọi lại trong 15 phút.`,
                    )
                  }
                >
                  Khối gọi hotline
                </button>
                <span className={s.wordCount} aria-live="polite">
                  {words} từ
                </span>
              </div>
              <input
                ref={imageInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="visually-hidden"
                tabIndex={-1}
                aria-label="Chọn ảnh để chèn vào bài"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const url = await upload(f, 'posts');
                  if (url) insert('![', `](${url})`, kw || 'Mô tả ảnh');
                }}
              />
              <label htmlFor="post-content" className="visually-hidden">
                Nội dung bài viết (Markdown)
              </label>
              <textarea
                id="post-content"
                ref={editorRef}
                className={s.editor}
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                {...errProps('contentMd')}
              />
              {errors.contentMd ? <div style={{ padding: '0 24px 16px' }}>{fieldError('contentMd')}</div> : null}
            </div>

            <div className={s.card} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div className={s.cover}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh do admin tải lên, xem trước */}
                {coverUrl ? <img src={coverUrl} alt="" /> : '[Ảnh đại diện]'}
              </div>
              <div className={s.stack} style={{ flex: '1 1 260px', minWidth: 0 }}>
                <label className={s.label}>
                  <span className={s.labelText}>Văn bản thay thế ảnh (alt)</span>
                  <input className={s.input} value={coverAlt} onChange={(e) => setCoverAlt(e.target.value)} maxLength={255} />
                </label>
                <div className={s.chips}>
                  <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={() => coverInput.current?.click()} disabled={uploading}>
                    {uploading ? 'Đang tải…' : coverUrl ? 'Đổi ảnh' : 'Chọn ảnh đại diện'}
                  </button>
                  {coverUrl ? (
                    <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => setCoverUrl('')}>
                      Gỡ ảnh
                    </button>
                  ) : null}
                </div>
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="visually-hidden"
                  tabIndex={-1}
                  aria-label="Chọn ảnh đại diện"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    const url = await upload(f, 'posts');
                    if (url) setCoverUrl(url);
                  }}
                />
              </div>
            </div>

            {post ? (
              <div>
                <button
                  type="button"
                  className={`${s.btn} ${s.btnDanger}`}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Xoá bài "${post.title}"? Không hoàn tác được.`)) start(async () => void (await deletePost(post.id)));
                  }}
                >
                  Xoá bài viết
                </button>
              </div>
            ) : null}
          </div>

          {/* PANEL SEO */}
          <aside aria-label="Kiểm tra SEO" className={s.colAside}>
            <div className={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className={`${s.score} ${scoreClass(seo.score)}`} aria-hidden="true">
                  {seo.score}
                </span>
                <div>
                  <h2 className={s.h2}>Điểm SEO: {seo.ratingLabel}</h2>
                  <p className={s.sub}>
                    Đạt {seo.passed}/{seo.total} tiêu chí. Cập nhật ngay khi anh/chị gõ.
                    {savedScore !== null && savedScore !== seo.score ? ` Điểm đã lưu: ${savedScore}.` : ''}
                  </p>
                </div>
              </div>
              <label className={s.label}>
                <span className={s.labelText}>Từ khoá chính</span>
                <input className={s.input} value={kw} onChange={(e) => setKw(e.target.value)} placeholder="vd: bếp từ báo lỗi" maxLength={120} />
              </label>
              <div className={s.sub}>
                Xuất hiện {seo.stats.occurrences} lần · mật độ {seo.stats.density.toFixed(1).replace('.', ',')}% (nên 0,5–2,5%)
              </div>
            </div>

            <div className={s.card}>
              <h2 className={`${s.h2} ${s.h2Sm}`}>Hiển thị trên Google</h2>
              <div className={s.serp}>
                <span className={s.serpUrl}>{preview.url}</span>
                <span className={s.serpTitle}>{preview.title}</span>
                <span className={s.serpDesc}>{preview.description || 'Chưa có mô tả meta — Google sẽ tự lấy một đoạn trong bài.'}</span>
              </div>
              <label className={s.label}>
                <span className={s.labelText}>
                  Tiêu đề SEO <span className={`${s.labelHint} ${lenClass(seo.stats.metaTitleLength, SEO_LIMITS.metaTitle)}`}>{seo.stats.metaTitleLength}/60</span>
                </span>
                <input className={`${s.input} ${s.inputSm}`} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Để trống sẽ dùng tiêu đề bài viết" maxLength={160} />
              </label>
              <label className={s.label}>
                <span className={s.labelText}>
                  Mô tả meta <span className={`${s.labelHint} ${lenClass(seo.stats.metaDescLength, SEO_LIMITS.metaDesc)}`}>{seo.stats.metaDescLength}/160</span>
                </span>
                <textarea className={s.textarea} rows={3} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} maxLength={320} />
              </label>
            </div>

            <div className={s.card} style={{ gap: 4 }}>
              <h2 className={`${s.h2} ${s.h2Sm}`} style={{ marginBottom: 8 }}>
                Danh sách kiểm tra
              </h2>
              <ul className={s.checks}>
                {seo.checks.map((c) => (
                  <li key={c.id} className={s.checkItem}>
                    <span className={`${s.checkIcon} ${c.pass ? s.checkPass : s.checkFail}`} aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.pass ? 'M5 12.5l4.5 4.5L19 7.5' : 'M7 7l10 10 M17 7L7 17'} />
                      </svg>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className={s.checkLabel}>
                        <span className="visually-hidden">{c.pass ? 'Đạt: ' : 'Chưa đạt: '}</span>
                        {c.label}
                      </span>
                      <span className={s.checkHint}>
                        {c.detail ? `Hiện tại ${c.detail}. ` : ''}
                        {HINTS[c.id](kwSlug)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
