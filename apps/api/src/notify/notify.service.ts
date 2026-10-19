import { Injectable, Logger } from '@nestjs/common';

export interface NewBookingEvent {
  id: number;
  name: string;
  phone: string;
  device: string;
  address: string;
  description: string;
}

/**
 * Báo lịch hẹn mới cho admin. Kênh (Zalo OA / Telegram / email) chưa chốt — SPEC mục 1,
 * nên tạm thời ghi log. Thay phần thân `bookingCreated` khi chọn kênh.
 */
@Injectable()
export class NotifyService {
  private readonly log = new Logger('Notify');

  async bookingCreated(b: NewBookingEvent): Promise<void> {
    this.log.log(`Lịch hẹn mới #${b.id}: ${b.name} · ${b.phone} · ${b.device}${b.address ? ` · ${b.address}` : ''}`);
  }
}
