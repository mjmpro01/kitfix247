import { BadRequestException, Body, Controller, Get, Put } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Settings } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { asBody } from './validate';

/** Khoá dạng chuỗi kiểm tra kỹ; khoá dạng object/mảng chỉ kiểm tra kiểu. */
const STRING_KEYS = ['hotline', 'hotlineTel', 'zaloUrl', 'address', 'hours', 'hoursNote', 'siteUrl', 'tagline', 'about'] as const;
const ARRAY_KEYS = ['commitments', 'features', 'promises', 'payments'] as const;
const OBJECT_KEYS = ['rating', 'hero'] as const;

export function validateSettings(body: unknown): Partial<Settings> {
  const b = asBody(body);
  const errors: Record<string, string> = {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) {
    if ((STRING_KEYS as readonly string[]).includes(k)) {
      if (typeof v !== 'string' || !v.trim() || v.length > 500) errors[k] = 'Cần là chữ, 1–500 ký tự.';
      else out[k] = v.trim();
    } else if ((ARRAY_KEYS as readonly string[]).includes(k)) {
      if (!Array.isArray(v) || v.length > 30) errors[k] = 'Cần là danh sách.';
      else out[k] = v;
    } else if ((OBJECT_KEYS as readonly string[]).includes(k)) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) errors[k] = 'Cần là object.';
      else out[k] = v;
    } else errors[k] = 'Khoá cài đặt không được hỗ trợ.';
  }
  if (typeof out.hotlineTel === 'string' && !/^0\d{9}$/.test(out.hotlineTel)) errors.hotlineTel = 'Số gọi cần 10 chữ số, bắt đầu bằng 0.';
  if (typeof out.zaloUrl === 'string' && !/^https:\/\/zalo\.me\//.test(out.zaloUrl)) errors.zaloUrl = 'Link Zalo dạng https://zalo.me/…';
  if (Object.keys(errors).length) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors });
  return out as Partial<Settings>;
}

@Controller('admin/settings')
export class SettingsAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  @Get()
  get(): Promise<Settings> {
    return this.settings.get();
  }

  /** Cập nhật một phần: chỉ các khoá gửi lên. */
  @Put()
  async put(@Body() body: unknown): Promise<Settings> {
    const data = validateSettings(body);
    await this.prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        this.prisma.setting.upsert({ where: { key }, create: { key, value: value as Prisma.InputJsonValue }, update: { value: value as Prisma.InputJsonValue } }),
      ),
    );
    return this.settings.get();
  }
}
