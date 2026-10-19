import { BadRequestException, Body, Controller, Get, Put } from '@nestjs/common';
import type { ProcessStep } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';
import { asBody } from './validate';

/** Quy trình các bước ở trang chủ (process_steps). Lưu cả danh sách một lần; số bước = thứ tự. */
export function validateSteps(body: unknown): { title: string; description: string }[] {
  const v = asBody(body).steps;
  if (!Array.isArray(v) || v.length < 2 || v.length > 6) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: { steps: 'Quy trình cần 2–6 bước.' } });
  return v.map((x, i) => {
    const o = asBody(x);
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const description = typeof o.description === 'string' ? o.description.trim() : '';
    if (!title || title.length > 60 || !description || description.length > 240) {
      throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: { steps: `Bước ${i + 1}: tiêu đề 1–60 ký tự, mô tả 1–240 ký tự.` } });
    }
    return { title, description };
  });
}

@Controller('admin/process-steps')
export class ProcessStepsAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<ProcessStep[]> {
    const rows = await this.prisma.processStep.findMany({ orderBy: { n: 'asc' } });
    return rows.map((r) => ({ n: r.n, title: r.title, description: r.description }));
  }

  @Put()
  async replace(@Body() body: unknown): Promise<ProcessStep[]> {
    const steps = validateSteps(body);
    await this.prisma.$transaction([
      this.prisma.processStep.deleteMany(),
      this.prisma.processStep.createMany({ data: steps.map((s, i) => ({ n: i + 1, ...s })) }),
    ]);
    return this.list();
  }
}
