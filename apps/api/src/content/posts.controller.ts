import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { Category, PostDetail, PostPage, PostSummary } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { buildPostWhere, parsePostListQuery, postOrder, postSummaryInclude, toPostSummary } from './posts.query';

const RELATED = 3;

@Controller()
export class PostsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('categories')
  async categories(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({ orderBy: { id: 'asc' } });
    return rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
  }

  @Get('posts')
  async list(@Query() raw: Record<string, unknown>): Promise<PostPage> {
    const p = parsePostListQuery(raw);
    const where = buildPostWhere(p);
    const [total, rows] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        include: postSummaryInclude,
        orderBy: postOrder,
        skip: (p.page - 1) * p.limit,
        take: p.limit,
      }),
    ]);
    return { items: rows.map(toPostSummary), total, page: p.page, limit: p.limit, totalPages: Math.max(1, Math.ceil(total / p.limit)) };
  }

  @Get('posts/:slug')
  async detail(@Param('slug') slug: string): Promise<PostDetail> {
    const post = await this.prisma.post.findFirst({ where: { slug, status: 'published' }, include: postSummaryInclude });
    if (!post) throw new NotFoundException('Không tìm thấy bài viết');
    return {
      ...toPostSummary(post),
      contentMd: post.contentMd,
      author: post.author,
      focusKeyword: post.focusKeyword,
      metaTitle: post.metaTitle,
      metaDesc: post.metaDesc,
      updatedAt: post.updatedAt.toISOString(),
      related: await this.related(post.id, post.categoryId, post.brands.map((b) => b.brandId)),
    };
  }

  /** Cùng chuyên mục hoặc cùng hãng trước; thiếu thì bù bằng bài mới nhất. */
  private async related(id: number, categoryId: number, brandIds: number[]): Promise<PostSummary[]> {
    const near = await this.prisma.post.findMany({
      where: {
        status: 'published',
        id: { not: id },
        OR: [{ categoryId }, ...(brandIds.length ? [{ brands: { some: { brandId: { in: brandIds } } } }] : [])],
      },
      include: postSummaryInclude,
      orderBy: postOrder,
      take: RELATED,
    });
    if (near.length >= RELATED) return near.map(toPostSummary);
    const fill = await this.prisma.post.findMany({
      where: { status: 'published', id: { notIn: [id, ...near.map((p) => p.id)] } },
      include: postSummaryInclude,
      orderBy: postOrder,
      take: RELATED - near.length,
    });
    return [...near, ...fill].map(toPostSummary);
  }
}
