import { Body, Controller, Get, HttpCode, Ip, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { OrderCreated, OrderInput, Product, ProductDetail } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { parseSort, productInclude, sortProducts, toProduct, toProductDetail } from './products';

@Controller()
export class ShopController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /** GET /products?category=&brand=&sort=new|price_asc|price_desc&limit= — chỉ sản phẩm đang bán; brand là slug hãng. */
  @Get('products')
  async products(
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
    @Query('brand') brand?: string,
  ): Promise<Product[]> {
    const cat = category?.trim().slice(0, 80);
    const br = brand?.trim().slice(0, 80);
    const rows = await this.prisma.product.findMany({
      where: { status: 'active', ...(cat ? { category: cat } : {}), ...(br ? { brand: { slug: br } } : {}) },
      include: productInclude,
      take: 200,
    });
    return sortProducts(rows, parseSort(sort))
      .slice(0, Math.min(Number(limit) || 48, 48))
      .map(toProduct);
  }

  /** GET /products/:slug — trang chi tiết; sản phẩm ẩn coi như không có. */
  @Get('products/:slug')
  async product(@Param('slug') slug: string): Promise<ProductDetail> {
    const p = await this.prisma.product.findFirst({ where: { slug, status: 'active' }, include: productInclude });
    if (!p) throw new NotFoundException('Không tìm thấy sản phẩm');
    return toProductDetail(p);
  }

  /** Giới hạn theo IP: 5 đơn / 10 phút. Giới hạn theo SĐT nằm trong service. */
  @Post('orders')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  create(@Body() body: Partial<OrderInput>, @Ip() ip: string): Promise<OrderCreated> {
    return this.orders.create(body, ip);
  }
}
