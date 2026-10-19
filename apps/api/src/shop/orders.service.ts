import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { orderTotals, validateOrder, type OrderCreated, type OrderInput, type ShopSettings } from '@kitfix/types';
import { NotifyService } from '../notify/notify.service';
import { PrismaService } from '../prisma/prisma.service';

export const ORDER_PHONE_LIMIT = 3;
export const ORDER_PHONE_WINDOW_MS = 10 * 60 * 1000;

/** Mã đơn dễ đọc qua điện thoại: KF + yymmdd (giờ VN) + 4 ký tự không gây nhầm (bỏ 0/O, 1/I). */
export function orderCode(now = new Date()): string {
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const ymd = vn.toISOString().slice(2, 10).replace(/-/g, '');
  const ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const tail = [...randomBytes(4)].map((b) => ALPHA[b % ALPHA.length]).join('');
  return `KF${ymd}-${tail}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotifyService,
  ) {}

  async create(input: Partial<OrderInput>, ip?: string): Promise<OrderCreated> {
    // Honeypot: trả như thành công để bot không dò ra, nhưng không lưu.
    if (typeof input?.website === 'string' && input.website.trim() !== '') return { code: 'KF000000-0000' };

    const v = validateOrder(input ?? {});
    if (!v.ok) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: v.errors });

    // Giá lấy từ DB, không tin giá client gửi. Sản phẩm chưa có giá vẫn đặt được (báo giá khi gọi xác nhận); sản phẩm ẩn / đã xoá thì không.
    const products = await this.prisma.product.findMany({ where: { id: { in: v.data.items.map((i) => i.productId) } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    const unavailable = v.data.items.filter((i) => {
      const p = byId.get(i.productId);
      return !p || p.status !== 'active';
    });
    if (unavailable.length) {
      throw new BadRequestException({
        message: 'Một số sản phẩm trong giỏ không còn bán online. Anh/chị cập nhật giỏ hàng hoặc gọi hotline để được báo giá.',
        errors: { items: 'Sản phẩm không còn bán online.' },
        unavailable: unavailable.map((i) => i.productId),
      });
    }

    const recent = await this.prisma.order.count({
      where: { phone: v.data.phone, createdAt: { gte: new Date(Date.now() - ORDER_PHONE_WINDOW_MS) } },
    });
    if (recent >= ORDER_PHONE_LIMIT) {
      throw new HttpException(
        { message: 'Chúng tôi đã nhận đơn từ số này và sẽ gọi xác nhận sớm. Cần gấp, anh/chị vui lòng gọi hotline.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const lines = v.data.items.map((i) => {
      const p = byId.get(i.productId)!;
      return { productId: p.id, productName: p.name, qty: i.qty, unitPrice: p.price };
    });
    // Phí giao chưa chốt (null) → để trống, nhân viên báo khi gọi xác nhận.
    const shop = (await this.prisma.setting.findUnique({ where: { key: 'shop' } }))?.value as ShopSettings | null | undefined;
    const fee = typeof shop?.shippingFee === 'number' && shop.shippingFee >= 0 ? shop.shippingFee : null;
    const { subtotal, shippingFee, total } = orderTotals(lines, fee);

    for (let attempt = 0; ; attempt++) {
      try {
        const order = await this.prisma.order.create({
          data: {
            code: orderCode(),
            customerName: v.data.customerName,
            phone: v.data.phone,
            address: v.data.address,
            payment: v.data.payment,
            status: 'new',
            subtotal,
            shippingFee,
            total,
            ip: ip?.slice(0, 64),
            items: { create: lines },
          },
        });
        await this.notify.orderCreated({
          code: order.code,
          customerName: order.customerName,
          phone: order.phone,
          payment: order.payment,
          total: order.total,
          lines: lines.map((l) => `${l.productName} × ${l.qty}`),
        });
        return { code: order.code };
      } catch (e) {
        // Trùng mã đơn (rất hiếm) → sinh mã khác.
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && attempt < 3) continue;
        throw e;
      }
    }
  }
}
