import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AdminPost, AdminPostSummary, SeoCheckResponse } from '@kitfix/types';
import { checkSeo, countWords, firstParagraph, markdownToText, slugifyVi } from '@kitfix/ui';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const postInclude = { category: true, brands: { select: { brandId: true } } } satisfies Prisma.PostInclude;
type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

/** ~200 từ/phút cho tiếng Việt. */
export const readMinutes = (md: string) => Math.max(1, Math.round(countWords(markdownToText(md)) / 200));

function toSummary(p: PostRow): AdminPostSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    category: p.category.name,
    focusKeyword: p.focusKeyword,
    seoScore: p.seoScore,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

function toAdminPost(p: PostRow): AdminPost {
  return {
    ...toSummary(p),
    excerpt: p.excerpt,
    contentMd: p.contentMd,
    coverUrl: p.coverUrl,
    coverAlt: p.coverAlt,
    categoryId: p.categoryId,
    device: p.device,
    metaTitle: p.metaTitle,
    metaDesc: p.metaDesc,
    readMinutes: p.readMinutes,
    author: p.author,
    brandIds: p.brands.map((b) => b.brandId),
  };
}

const seoOf = (p: Pick<PostRow, 'focusKeyword' | 'title' | 'metaTitle' | 'metaDesc' | 'slug' | 'contentMd' | 'coverAlt'>) =>
  checkSeo({ focusKeyword: p.focusKeyword ?? '', title: p.title, metaTitle: p.metaTitle, metaDesc: p.metaDesc, slug: p.slug, contentMd: p.contentMd, coverAlt: p.coverAlt });

function postFields(body: unknown, creating: boolean) {
  const c = new Check(asBody(body));
  const coverUrl = c.optStr('coverUrl', 'Ảnh đại diện', 512);
  if (coverUrl && !/^(https?:\/\/|\/)/.test(coverUrl)) c.errors.coverUrl = 'Ảnh đại diện phải là URL.';
  const rawSlug = c.str('slug', 'Đường dẫn', { max: 200, required: creating });
  const data = defined({
    title: c.str('title', 'Tiêu đề', { max: 255, required: creating }),
    slug: rawSlug !== undefined ? slugifyVi(rawSlug) : undefined,
    excerpt: c.str('excerpt', 'Đoạn trích', { max: 500 }),
    contentMd: c.str('contentMd', 'Nội dung', { max: 200_000, required: creating }),
    coverUrl,
    coverAlt: c.optStr('coverAlt', 'Alt ảnh', 255),
    categoryId: c.int('categoryId', 'Chuyên mục', { min: 1, required: creating }),
    device: c.optStr('device', 'Thiết bị', 80),
    status: c.oneOf('status', 'Trạng thái', ['draft', 'published'] as const),
    focusKeyword: c.optStr('focusKeyword', 'Từ khoá chính', 120),
    metaTitle: c.optStr('metaTitle', 'Tiêu đề SEO', 160),
    metaDesc: c.optStr('metaDesc', 'Mô tả meta', 320),
    author: c.str('author', 'Tác giả', { max: 120 }),
    brandIds: c.intList('brandIds', 'Thương hiệu', 50),
  });
  if (rawSlug !== undefined && !data.slug) c.errors.slug = 'Đường dẫn không hợp lệ.';
  if (c.has('title') && data.title === '') c.errors.title = 'Tiêu đề là bắt buộc.';
  c.done();
  return data;
}

/** Đoạn trích mặc định: mô tả meta, không có thì đoạn mở đầu (cắt 200 ký tự). */
function defaultExcerpt(metaDesc: string | null | undefined, contentMd: string) {
  const s = (metaDesc ?? '').trim() || markdownToText(firstParagraph(contentMd)).replace(/\s+/g, ' ').trim();
  return s.length > 200 ? `${s.slice(0, 199).trimEnd()}…` : s;
}

@Controller('admin/posts')
export class PostsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async one(id: number) {
    const p = await this.prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!p) throw new NotFoundException('Không tìm thấy bài viết');
    return p;
  }

  /** Chuyên mục / hãng gửi lên phải tồn tại — báo 400 theo trường thay vì lỗi Prisma. */
  private async assertRefs(categoryId?: number, brandIds?: number[]) {
    const errors: Record<string, string> = {};
    if (categoryId !== undefined && !(await this.prisma.category.findUnique({ where: { id: categoryId } }))) errors.categoryId = 'Chuyên mục không tồn tại.';
    if (brandIds?.length && (await this.prisma.brand.count({ where: { id: { in: brandIds } } })) !== brandIds.length) errors.brandIds = 'Có thương hiệu không tồn tại.';
    if (Object.keys(errors).length) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors });
  }

  @Get()
  async list(@Query('status') status?: string): Promise<AdminPostSummary[]> {
    const rows = await this.prisma.post.findMany({
      where: status === 'draft' || status === 'published' ? { status } : undefined,
      include: postInclude,
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
    });
    return rows.map(toSummary);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<AdminPost> {
    return toAdminPost(await this.one(parseId(id)));
  }

  @Post()
  async create(@Body() body: unknown): Promise<AdminPost> {
    const { brandIds, ...f } = postFields(body, true);
    await this.assertRefs(f.categoryId, brandIds);
    const draft = { ...f, title: f.title!, slug: f.slug!, contentMd: f.contentMd! };
    const status = f.status ?? 'draft';
    const p = await this.prisma.post.create({
      data: {
        title: draft.title,
        slug: draft.slug,
        contentMd: draft.contentMd,
        excerpt: f.excerpt || defaultExcerpt(f.metaDesc, draft.contentMd),
        coverUrl: f.coverUrl ?? null,
        coverAlt: f.coverAlt ?? null,
        category: { connect: { id: f.categoryId! } },
        device: f.device ?? null,
        status,
        focusKeyword: f.focusKeyword ?? null,
        metaTitle: f.metaTitle ?? null,
        metaDesc: f.metaDesc ?? null,
        author: f.author || 'KitFix247',
        readMinutes: readMinutes(draft.contentMd),
        seoScore: seoOf({ focusKeyword: null, metaTitle: null, metaDesc: null, coverAlt: null, ...f, ...draft }).score,
        publishedAt: status === 'published' ? new Date() : null,
        brands: brandIds?.length ? { create: brandIds.map((brandId) => ({ brand: { connect: { id: brandId } } })) } : undefined,
      },
    });
    return this.get(String(p.id));
  }

  @Patch(':id')
  async update(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminPost> {
    const id = parseId(rawId);
    const current = await this.one(id);
    const { brandIds, categoryId, ...f } = postFields(body, false);
    await this.assertRefs(categoryId, brandIds);
    const merged = { ...current, ...f };
    const firstPublish = f.status === 'published' && !current.publishedAt;
    await this.prisma.post.update({
      where: { id },
      data: {
        ...f,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(f.excerpt === '' ? { excerpt: defaultExcerpt(merged.metaDesc, merged.contentMd) } : {}),
        readMinutes: readMinutes(merged.contentMd),
        seoScore: seoOf(merged).score,
        ...(firstPublish ? { publishedAt: new Date() } : {}),
        ...(brandIds ? { brands: { deleteMany: {}, create: brandIds.map((brandId) => ({ brand: { connect: { id: brandId } } })) } } : {}),
      },
    });
    return this.get(String(id));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id: parseId(id) } });
  }

  /** Chấm lại 12 tiêu chí SEO bằng checkSeo dùng chung (packages/ui) và lưu seo_score. */
  @Post(':id/seo-check')
  @HttpCode(200)
  async seoCheck(@Param('id') rawId: string): Promise<SeoCheckResponse> {
    const id = parseId(rawId);
    const r = seoOf(await this.one(id));
    await this.prisma.post.update({ where: { id }, data: { seoScore: r.score } });
    return { postId: id, score: r.score, ratingLabel: r.ratingLabel, passed: r.passed, total: r.total, checks: r.checks };
  }
}
