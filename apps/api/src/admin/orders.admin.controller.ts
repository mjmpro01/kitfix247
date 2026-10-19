import { BadRequestException, Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isOrderStatus, ORDER_STATUSES, type AdminOrder, type AdminOrderPage, type OrderStatus } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, parseId } from './validate';

const include = { items: { include: { product: { select: { sku: true } } } } } satisfies Prisma.OrderInclude;
type Row = Prisma.OrderGetPayload<{ include: typeof include }>;

export const toAdminOrder = (o: Row): AdminOrder => ({
  id: o.id,
  code: o.code,
  customerName: o.customerName,
  phone: o.phone,
  address: o.address,
  payment: o.payment,
  status: isOrderStatus(o.status) ? o.status : 'new',
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  total: o.total,
  createdAt: o.createdAt.toISOString(),
  items: o.items.map((i) => ({ productId: i.productId, name: i.productName, sku: i.product.sku, qty: i.qty, unitPrice: i.unitPrice })),
});

@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('limit') limit?: string): Promise<AdminOrderPage> {
    const where: Prisma.OrderWhereInput = isOrderStatus(status) ? { status } : {};
    const take = Math.min(100, Math.max(1, Number.parseInt(limit ?? '', 10) || 50));
    const [rows, total, grouped] = await Promise.all([
      this.prisma.order.findMany({ where, include, orderBy: { createdAt: 'desc' }, take }),
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const counts = Object.fromEntries([['all', 0], ...ORDER_STATUSES.map((s) => [s, 0])]) as AdminOrderPage['counts'];
    for (const g of grouped) {
      if (isOrderStatus(g.status)) counts[g.status] = g._count._all;
      counts.all += g._count._all;
    }
    return { items: rows.map(toAdminOrder), total, counts };
  }

  /** Đổi trạng thái đơn: new → confirmed → shipping → delivered, hoặc cancelled. Admin được sửa nhầm. */
  @Patch(':id/status')
  async setStatus(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminOrder> {
    const id = parseId(rawId);
    const status = asBody(body).status;
    if (!isOrderStatus(status)) {
      throw new BadRequestException({ message: 'Trạng thái không hợp lệ', errors: { status: `Chỉ nhận: ${ORDER_STATUSES.join(', ')}` } });
    }
    const o = await this.prisma.order.update({ where: { id }, data: { status: status satisfies OrderStatus }, include });
    return toAdminOrder(o);
  }
}
