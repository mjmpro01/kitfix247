import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import type { Service } from '@prisma/client';
import type { ServiceDetail, ServiceSummary } from '@kitfix/types';
import { PrismaService } from '../prisma/prisma.service';

function toSummary(s: Service): ServiceSummary {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    shortName: s.shortName,
    shortHint: s.shortHint,
    cardText: s.cardText,
    icon: s.icon,
    device: s.device,
    sort: s.sort,
    showHome: s.showHome,
  };
}

@Controller('services')
export class ServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<ServiceSummary[]> {
    const rows = await this.prisma.service.findMany({ orderBy: { sort: 'asc' } });
    return rows.map(toSummary);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string): Promise<ServiceDetail> {
    const s = await this.prisma.service.findUnique({
      where: { slug },
      include: { faults: { orderBy: { sort: 'asc' } }, faqs: { orderBy: { sort: 'asc' } } },
    });
    if (!s) throw new NotFoundException('Không tìm thấy dịch vụ');
    return {
      ...toSummary(s),
      lead: s.lead,
      device: s.device as ServiceDetail['device'],
      faultsTitle: s.faultsTitle,
      seoTitle: s.seoTitle,
      seoDesc: s.seoDesc,
      faults: s.faults.map((f) => ({ id: f.id, title: f.title, code: f.code, cause: f.cause, priceFrom: f.priceFrom, priceTo: f.priceTo })),
      faqs: s.faqs.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
    };
  }
}
