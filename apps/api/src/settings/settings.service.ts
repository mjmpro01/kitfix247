import { Injectable } from '@nestjs/common';
import type { Settings } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Mỗi khoá trong bảng settings là một trường của Settings. */
  async get(): Promise<Settings> {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value])) as unknown as Settings;
  }
}
