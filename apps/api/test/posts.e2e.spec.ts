import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { POSTS_MAX_LIMIT } from '@kitfix/types';
import { ContentController } from '../src/content/content.controller';
import { PostsController } from '../src/content/posts.controller';
import { buildPostWhere, parsePostListQuery } from '../src/content/posts.query';
import { PrismaService } from '../src/prisma/prisma.service';

const cat = { id: 1, slug: 'bang-ma-loi', name: 'Bảng mã lỗi' };
const bosch = { id: 1, slug: 'bosch', name: 'Bosch', sort: 1 };

function row(id: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    slug: `bai-${id}`,
    title: `Bài ${id}`,
    excerpt: 'Đoạn trích',
    contentMd: '## Mục 1\n\nNội dung',
    coverUrl: null,
    coverAlt: null,
    categoryId: cat.id,
    category: cat,
    device: 'Bếp từ',
    status: 'published',
    focusKeyword: null,
    metaTitle: null,
    metaDesc: null,
    readMinutes: 5,
    author: 'KitFix247',
    publishedAt: new Date('2026-10-10T01:00:00Z'),
    updatedAt: new Date('2026-10-11T01:00:00Z'),
    brands: [{ postId: id, brandId: bosch.id, brand: bosch }],
    ...extra,
  };
}

describe('Kiến thức API', () => {
  let app: INestApplication;
  const prisma = {
    post: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    brand: { findUnique: jest.fn(), findMany: jest.fn() },
    processStep: { findMany: jest.fn() },
    review: { findMany: jest.fn() },
    product: { findMany: jest.fn() },
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [PostsController, ContentController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => jest.resetAllMocks());

  describe('parsePostListQuery / buildPostWhere', () => {
    it('mặc định trang 1, 9 bài; chặn page/limit ngoài khoảng', () => {
      expect(parsePostListQuery({})).toEqual({ category: undefined, brand: undefined, q: undefined, page: 1, limit: 9 });
      expect(parsePostListQuery({ page: '-3', limit: '0' })).toMatchObject({ page: 1, limit: 1 });
      expect(parsePostListQuery({ page: 'abc', limit: '999' })).toMatchObject({ page: 1, limit: POSTS_MAX_LIMIT });
      expect(parsePostListQuery({ q: '   ', category: '' })).toMatchObject({ q: undefined, category: undefined });
    });

    it('chỉ lấy bài đã đăng, lọc theo slug chuyên mục, slug hãng và từ khoá', () => {
      expect(buildPostWhere({})).toEqual({ status: 'published' });
      expect(buildPostWhere({ category: 'bang-ma-loi', brand: 'bosch', q: 'E4' })).toEqual({
        status: 'published',
        category: { slug: 'bang-ma-loi' },
        brands: { some: { brand: { slug: 'bosch' } } },
        OR: [{ title: { contains: 'E4' } }, { excerpt: { contains: 'E4' } }, { focusKeyword: { contains: 'E4' } }],
      });
    });
  });

  describe('GET /posts', () => {
    it('trả trang kết quả kèm tổng số, phân trang bằng skip/take', async () => {
      prisma.post.count.mockResolvedValue(20);
      prisma.post.findMany.mockResolvedValue([row(10), row(11)]);
      const res = await request(app.getHttpServer())
        .get('/posts')
        .query({ category: 'bang-ma-loi', brand: 'bosch', q: ' E4 ', page: '3', limit: '9' })
        .expect(200);

      const where = {
        status: 'published',
        category: { slug: 'bang-ma-loi' },
        brands: { some: { brand: { slug: 'bosch' } } },
        OR: [{ title: { contains: 'E4' } }, { excerpt: { contains: 'E4' } }, { focusKeyword: { contains: 'E4' } }],
      };
      expect(prisma.post.count).toHaveBeenCalledWith({ where });
      expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 18, take: 9 }));
      expect(res.body).toMatchObject({ total: 20, page: 3, limit: 9, totalPages: 3 });
      expect(res.body.items[0]).toEqual({
        id: 10,
        slug: 'bai-10',
        title: 'Bài 10',
        excerpt: 'Đoạn trích',
        category: 'Bảng mã lỗi',
        categorySlug: 'bang-ma-loi',
        device: 'Bếp từ',
        brands: [{ slug: 'bosch', name: 'Bosch' }],
        coverUrl: null,
        coverAlt: null,
        readMinutes: 5,
        publishedAt: '2026-10-10T01:00:00.000Z',
      });
    });

    it('không có bài: totalPages vẫn là 1', async () => {
      prisma.post.count.mockResolvedValue(0);
      prisma.post.findMany.mockResolvedValue([]);
      const res = await request(app.getHttpServer()).get('/posts?q=khong-co').expect(200);
      expect(res.body).toEqual({ items: [], total: 0, page: 1, limit: 9, totalPages: 1 });
    });
  });

  describe('GET /posts/:slug', () => {
    it('404 khi không có bài đã đăng', async () => {
      prisma.post.findFirst.mockResolvedValue(null);
      await request(app.getHttpServer()).get('/posts/khong-co').expect(404);
      expect(prisma.post.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'khong-co', status: 'published' } }));
    });

    it('trả nội dung + 3 bài liên quan: cùng chuyên mục/hãng trước, thiếu thì bù bài mới nhất', async () => {
      prisma.post.findFirst.mockResolvedValue(row(1, { metaTitle: 'SEO', focusKeyword: 'bếp từ' }));
      prisma.post.findMany.mockResolvedValueOnce([row(2)]).mockResolvedValueOnce([row(5), row(6)]);
      const res = await request(app.getHttpServer()).get('/posts/bai-1').expect(200);

      expect(res.body).toMatchObject({ slug: 'bai-1', contentMd: '## Mục 1\n\nNội dung', metaTitle: 'SEO', author: 'KitFix247' });
      expect(res.body.related.map((p: { id: number }) => p.id)).toEqual([2, 5, 6]);
      expect(prisma.post.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { status: 'published', id: { not: 1 }, OR: [{ categoryId: 1 }, { brands: { some: { brandId: { in: [1] } } } }] },
          take: 3,
        }),
      );
      expect(prisma.post.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: { status: 'published', id: { notIn: [1, 2] } }, take: 2 }),
      );
    });

    it('đủ 3 bài gần nhau thì không truy vấn bù', async () => {
      prisma.post.findFirst.mockResolvedValue(row(1, { brands: [] }));
      prisma.post.findMany.mockResolvedValueOnce([row(2), row(3), row(4)]);
      const res = await request(app.getHttpServer()).get('/posts/bai-1').expect(200);
      expect(res.body.related).toHaveLength(3);
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.post.findMany.mock.calls[0][0].where.OR).toEqual([{ categoryId: 1 }]);
    });
  });

  describe('GET /brands/:slug', () => {
    it('trả chi tiết hãng, devices luôn là mảng chuỗi', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        ...bosch,
        logoUrl: null,
        logoStyle: 'gray',
        description: null,
        devices: ['Bếp từ', 3],
        seoTitle: null,
        seoDesc: null,
      });
      const res = await request(app.getHttpServer()).get('/brands/bosch').expect(200);
      expect(res.body).toEqual({
        id: 1,
        slug: 'bosch',
        name: 'Bosch',
        logoUrl: null,
        logoStyle: 'gray',
        description: null,
        devices: ['Bếp từ'],
        seoTitle: null,
        seoDesc: null,
      });
    });

    it('404 khi không có hãng', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);
      await request(app.getHttpServer()).get('/brands/khong-co').expect(404);
    });
  });
});
