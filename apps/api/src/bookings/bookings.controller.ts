import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { BookingInput } from '@kitfix/types';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Giới hạn theo IP: 5 yêu cầu / 10 phút. Giới hạn theo SĐT nằm trong service. */
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60 * 1000 } })
  create(@Body() body: Partial<BookingInput>, @Ip() ip: string) {
    return this.bookings.create(body, ip);
  }
}
