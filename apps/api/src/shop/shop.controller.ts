import { Body, Controller, Get, HttpCode, Ip, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { OrderCreated, OrderInput, Product } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { parseSort, sortProducts, toProduct } from './products';

@Controller()
export class ShopController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  /** GET /products?category=&sort=new|price_asc|price_desc&limit= — chỉ sản phẩm đang bán. */
  @Get('products')
  async products(@Query('category') category?: string, @Query('sort') sort?: string, @Query('limit') limit?: string): Promise<Product[]> {
    const cat = category?.trim().slice(0, 80);
    const rows = await this.prisma.product.findMany({ where: { status: 'active', ...(cat ? { category: cat } : {}) }, take: 200 });
    return sortProducts(rows, parseSort(sort))
      .slice(0, Math.min(Number(limit) || 48, 48))
      .map(toProduct);
  }

  /** Giới hạn theo IP: 5 đơn / 10 phút. Giới hạn theo SĐT nằm trong service. */
  @Post('orders')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  create(@Body() body: Partial<OrderInput>, @Ip() ip: string): Promise<OrderCreated> {
    return this.orders.create(body, ip);
  }
}
