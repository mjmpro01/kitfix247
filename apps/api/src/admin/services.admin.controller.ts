import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, Patch, Post, Put } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { BOOKING_DEVICES, type AdminFaq, type AdminFault, type AdminPriceGroup, type AdminPriceItem, type AdminService } from '@kitfix/types';
import { ICONS, slugifyVi } from '@kitfix/ui';
import { PrismaService } from '../prisma/prisma.service';
import { asBody, Check, defined, parseId } from './validate';

const DEVICES = BOOKING_DEVICES.map((d) => d.value);
const ICON_NAMES = Object.keys(ICONS);

const serviceInclude = {
  faults: { orderBy: { sort: 'asc' } },
  faqs: { orderBy: { sort: 'asc' } },
  priceItems: { orderBy: { sort: 'asc' } },
} satisfies Prisma.ServiceInclude;

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof serviceInclude }>;

const priceItemOut = (p: Prisma.PriceItemGetPayload<object>) => ({
  id: p.id,
  groupId: p.groupId,
  serviceId: p.serviceId,
  name: p.name,
  duration: p.duration,
  priceFrom: p.priceFrom,
  priceTo: p.priceTo,
});

function toAdminService(s: ServiceRow): AdminService {
  return {
    id: s.id,
    slug: s.slug,
    sort: s.sort,
    name: s.name,
    shortName: s.shortName,
    shortHint: s.shortHint,
    cardText: s.cardText,
    lead: s.lead,
    device: s.device,
    faultsTitle: s.faultsTitle,
    icon: s.icon,
    showHome: s.showHome,
    seoTitle: s.seoTitle,
    seoDesc: s.seoDesc,
    faults: s.faults.map((f) => ({ id: f.id, title: f.title, code: f.code, cause: f.cause, priceFrom: f.priceFrom, priceTo: f.priceTo })),
    faqs: s.faqs.map((q) => ({ id: q.id, question: q.question, answer: q.answer })),
    priceItems: s.priceItems.map(priceItemOut),
  };
}

/** Trường của dịch vụ; `creating` = bắt buộc tên + thiết bị. */
function serviceFields(body: unknown, creating: boolean) {
  const c = new Check(asBody(body));
  const data = defined({
    name: c.str('name', 'Tên dịch vụ', { max: 160, required: creating }),
    shortName: c.str('shortName', 'Tên ngắn', { max: 80 }),
    shortHint: c.str('shortHint', 'Gợi ý ngắn', { max: 160 }),
    cardText: c.str('cardText', 'Mô tả trên card', { max: 255 }),
    lead: c.str('lead', 'Đoạn dẫn', { max: 2000 }),
    device: c.oneOf('device', 'Thiết bị', DEVICES, creating),
    faultsTitle: c.str('faultsTitle', 'Tiêu đề mục lỗi', { max: 160 }),
    icon: c.oneOf('icon', 'Icon', ICON_NAMES),
    showHome: c.bool('showHome', 'Hiện ở trang chủ'),
    seoTitle: c.optStr('seoTitle', 'Tiêu đề SEO', 160),
    seoDesc: c.optStr('seoDesc', 'Mô tả SEO', 320),
    slug: c.has('slug') ? slugifyVi(c.str('slug', 'Đường dẫn', { max: 120, required: true }) ?? '') : undefined,
  });
  if (c.has('slug') && !data.slug) c.errors.slug = 'Đường dẫn không hợp lệ.';
  if (c.has('name') && data.name === '') c.errors.name = 'Tên dịch vụ là bắt buộc.';
  c.done();
  return data;
}

function faultFields(body: unknown) {
  const c = new Check(asBody(body));
  const { from, to } = c.priceRange();
  const data = {
    title: c.str('title', 'Tên lỗi', { max: 160, required: true })!,
    code: c.str('code', 'Mã lỗi', { max: 40 }) ?? '',
    cause: c.str('cause', 'Nguyên nhân', { max: 2000 }) ?? '',
    priceFrom: from!,
    priceTo: to!,
  };
  c.done();
  return data;
}

function faqFields(body: unknown) {
  const c = new Check(asBody(body));
  const data = { question: c.str('question', 'Câu hỏi', { max: 255, required: true })!, answer: c.str('answer', 'Trả lời', { max: 4000, required: true })! };
  c.done();
  return data;
}

function priceItemFields(body: unknown) {
  const c = new Check(asBody(body));
  const { from, to } = c.priceRange();
  const data = {
    groupId: c.int('groupId', 'Nhóm giá', { min: 1, required: true })!,
    serviceId: c.has('serviceId') && asBody(body).serviceId !== null ? c.int('serviceId', 'Dịch vụ', { min: 1 }) ?? null : null,
    name: c.str('name', 'Hạng mục', { max: 160, required: true })!,
    duration: c.str('duration', 'Thời gian', { max: 60 }) ?? '',
    priceFrom: from!,
    priceTo: to!,
  };
  c.done();
  return data;
}

/** Danh sách gửi lên (có hoặc không có id) → xoá dòng bị bỏ, sửa dòng có id, thêm dòng mới; sort theo thứ tự gửi. */
function listBody(body: unknown, key: string): Record<string, unknown>[] {
  const v = asBody(body)[key];
  if (!Array.isArray(v) || v.length > 100) throw new BadRequestException(`Thiếu danh sách ${key}`);
  return v.map(asBody);
}

const optId = (row: Record<string, unknown>) => (Number.isInteger(row.id) && (row.id as number) > 0 ? (row.id as number) : undefined);

@Controller('admin')
export class ServicesAdminController {
  constructor(private readonly prisma: PrismaService) {}

  private async getService(id: number): Promise<AdminService> {
    const s = await this.prisma.service.findUnique({ where: { id }, include: serviceInclude });
    if (!s) throw new NotFoundException('Không tìm thấy dịch vụ');
    return toAdminService(s);
  }

  // ---------- Dịch vụ ----------

  @Get('services')
  async list(): Promise<AdminService[]> {
    const rows = await this.prisma.service.findMany({ orderBy: { sort: 'asc' }, include: serviceInclude });
    return rows.map(toAdminService);
  }

  @Get('services/:id')
  get(@Param('id') id: string) {
    return this.getService(parseId(id));
  }

  @Post('services')
  async create(@Body() body: unknown): Promise<AdminService> {
    const f = serviceFields(body, true);
    const name = f.name!;
    const last = await this.prisma.service.aggregate({ _max: { sort: true } });
    const s = await this.prisma.service.create({
      data: {
        slug: f.slug || slugifyVi(name),
        name,
        shortName: f.shortName || name.replace(/^Sửa\s+/i, ''),
        shortHint: f.shortHint ?? '',
        cardText: f.cardText ?? '',
        lead: f.lead ?? '',
        device: f.device!,
        faultsTitle: f.faultsTitle || `Lỗi thường gặp — ${name}`,
        icon: f.icon ?? 'wrench',
        showHome: f.showHome ?? false,
        seoTitle: f.seoTitle ?? null,
        seoDesc: f.seoDesc ?? null,
        sort: (last._max.sort ?? 0) + 1,
      },
    });
    return this.getService(s.id);
  }

  @Patch('services/:id')
  async update(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminService> {
    const id = parseId(rawId);
    await this.prisma.service.update({ where: { id }, data: serviceFields(body, false) });
    return this.getService(id);
  }

  @Delete('services/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.prisma.service.delete({ where: { id: parseId(id) } });
  }

  /** Kéo-thả: gửi toàn bộ id theo thứ tự mới. */
  @Put('services/order')
  async order(@Body() body: unknown): Promise<{ ok: true }> {
    const c = new Check(asBody(body));
    const ids = c.intList('ids', 'Thứ tự', 200);
    if (!ids) c.errors.ids = 'Thiếu danh sách id.';
    c.done();
    await this.prisma.$transaction(ids!.map((id, i) => this.prisma.service.update({ where: { id }, data: { sort: i + 1 } })));
    return { ok: true };
  }

  // ---------- Lỗi thường gặp ----------

  @Post('services/:id/faults')
  async addFault(@Param('id') rawId: string, @Body() body: unknown) {
    const serviceId = parseId(rawId);
    const last = await this.prisma.serviceFault.aggregate({ where: { serviceId }, _max: { sort: true } });
    const f = await this.prisma.serviceFault.create({ data: { ...faultFields(body), serviceId, sort: (last._max.sort ?? 0) + 1 } });
    return { id: f.id, title: f.title, code: f.code, cause: f.cause, priceFrom: f.priceFrom, priceTo: f.priceTo };
  }

  @Patch('faults/:id')
  async updateFault(@Param('id') id: string, @Body() body: unknown) {
    const f = await this.prisma.serviceFault.update({ where: { id: parseId(id) }, data: faultFields(body) });
    return { id: f.id, title: f.title, code: f.code, cause: f.cause, priceFrom: f.priceFrom, priceTo: f.priceTo };
  }

  @Delete('faults/:id')
  @HttpCode(204)
  async removeFault(@Param('id') id: string): Promise<void> {
    await this.prisma.serviceFault.delete({ where: { id: parseId(id) } });
  }

  /** Lưu cả danh sách lỗi của một dịch vụ một lần (màn "Dịch vụ & bảng giá"). */
  @Put('services/:id/faults')
  async syncFaults(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminService> {
    const serviceId = parseId(rawId);
    const rows = listBody(body, 'faults').map((r) => ({ id: optId(r), ...faultFields(r) as AdminFault }));
    await this.sync('serviceFault', serviceId, rows);
    return this.getService(serviceId);
  }

  // ---------- FAQ ----------

  @Post('services/:id/faqs')
  async addFaq(@Param('id') rawId: string, @Body() body: unknown) {
    const serviceId = parseId(rawId);
    const last = await this.prisma.serviceFaq.aggregate({ where: { serviceId }, _max: { sort: true } });
    const q = await this.prisma.serviceFaq.create({ data: { ...faqFields(body), serviceId, sort: (last._max.sort ?? 0) + 1 } });
    return { id: q.id, question: q.question, answer: q.answer };
  }

  @Patch('faqs/:id')
  async updateFaq(@Param('id') id: string, @Body() body: unknown) {
    const q = await this.prisma.serviceFaq.update({ where: { id: parseId(id) }, data: faqFields(body) });
    return { id: q.id, question: q.question, answer: q.answer };
  }

  @Delete('faqs/:id')
  @HttpCode(204)
  async removeFaq(@Param('id') id: string): Promise<void> {
    await this.prisma.serviceFaq.delete({ where: { id: parseId(id) } });
  }

  @Put('services/:id/faqs')
  async syncFaqs(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminService> {
    const serviceId = parseId(rawId);
    const rows = listBody(body, 'faqs').map((r) => ({ id: optId(r), ...faqFields(r) as AdminFaq }));
    await this.sync('serviceFaq', serviceId, rows);
    return this.getService(serviceId);
  }

  // ---------- Bảng giá ----------

  @Get('price-groups')
  async groups(): Promise<AdminPriceGroup[]> {
    const rows = await this.prisma.priceGroup.findMany({ orderBy: { sort: 'asc' }, include: { items: { orderBy: { sort: 'asc' } } } });
    return rows.map((g) => ({ id: g.id, name: g.name, sort: g.sort, showHome: g.showHome, items: g.items.map(priceItemOut) }));
  }

  @Post('price-groups')
  async addGroup(@Body() body: unknown) {
    const c = new Check(asBody(body));
    const name = c.str('name', 'Tên nhóm', { max: 120, required: true })!;
    const showHome = c.bool('showHome', 'Hiện ở trang chủ') ?? false;
    c.done();
    const last = await this.prisma.priceGroup.aggregate({ _max: { sort: true } });
    const g = await this.prisma.priceGroup.create({ data: { name, showHome, sort: (last._max.sort ?? 0) + 1 } });
    return { id: g.id, name: g.name, sort: g.sort, showHome: g.showHome, items: [] };
  }

  @Patch('price-groups/:id')
  async updateGroup(@Param('id') id: string, @Body() body: unknown) {
    const c = new Check(asBody(body));
    const data = defined({ name: c.str('name', 'Tên nhóm', { max: 120 }), showHome: c.bool('showHome', 'Hiện ở trang chủ'), sort: c.int('sort', 'Thứ tự', { min: 0 }) });
    c.done();
    const g = await this.prisma.priceGroup.update({ where: { id: parseId(id) }, data });
    return { id: g.id, name: g.name, sort: g.sort, showHome: g.showHome };
  }

  @Delete('price-groups/:id')
  @HttpCode(204)
  async removeGroup(@Param('id') id: string): Promise<void> {
    await this.prisma.priceGroup.delete({ where: { id: parseId(id) } });
  }

  @Post('price-items')
  async addItem(@Body() body: unknown) {
    const data = priceItemFields(body);
    const last = await this.prisma.priceItem.aggregate({ where: { groupId: data.groupId }, _max: { sort: true } });
    return priceItemOut(await this.prisma.priceItem.create({ data: { ...data, sort: (last._max.sort ?? 0) + 1 } }));
  }

  @Patch('price-items/:id')
  async updateItem(@Param('id') id: string, @Body() body: unknown) {
    return priceItemOut(await this.prisma.priceItem.update({ where: { id: parseId(id) }, data: priceItemFields(body) }));
  }

  @Delete('price-items/:id')
  @HttpCode(204)
  async removeItem(@Param('id') id: string): Promise<void> {
    await this.prisma.priceItem.delete({ where: { id: parseId(id) } });
  }

  /** Lưu cả bảng giá của một dịch vụ: mọi hạng mục gắn service_id này. */
  @Put('services/:id/price-items')
  async syncItems(@Param('id') rawId: string, @Body() body: unknown): Promise<AdminService> {
    const serviceId = parseId(rawId);
    const rows = listBody(body, 'items').map((r) => ({ id: optId(r), ...(priceItemFields({ ...r, serviceId }) as AdminPriceItem) }));
    const existing = await this.prisma.priceItem.findMany({ where: { serviceId }, select: { id: true } });
    const keep = new Set(rows.map((r) => r.id).filter(Boolean));
    await this.prisma.$transaction([
      this.prisma.priceItem.deleteMany({ where: { serviceId, id: { notIn: [...keep] as number[] } } }),
      ...rows.map(({ id, ...data }, i) =>
        id && existing.some((e) => e.id === id)
          ? this.prisma.priceItem.update({ where: { id }, data: { ...data, serviceId, sort: i + 1 } })
          : this.prisma.priceItem.create({ data: { ...data, serviceId, sort: i + 1 } }),
      ),
    ]);
    return this.getService(serviceId);
  }

  private async sync(model: 'serviceFault' | 'serviceFaq', serviceId: number, rows: ({ id?: number } & Record<string, unknown>)[]) {
    await this.getService(serviceId);
    const delegate = this.prisma[model] as unknown as {
      findMany(a: object): Promise<{ id: number }[]>;
      deleteMany(a: object): Prisma.PrismaPromise<unknown>;
      update(a: object): Prisma.PrismaPromise<unknown>;
      create(a: object): Prisma.PrismaPromise<unknown>;
    };
    const existing = new Set((await delegate.findMany({ where: { serviceId }, select: { id: true } })).map((e) => e.id));
    const keep = rows.map((r) => r.id).filter((id): id is number => !!id && existing.has(id));
    await this.prisma.$transaction([
      delegate.deleteMany({ where: { serviceId, id: { notIn: keep } } }),
      ...rows.map(({ id, ...data }, i) =>
        id && existing.has(id) ? delegate.update({ where: { id }, data: { ...data, sort: i + 1 } }) : delegate.create({ data: { ...data, serviceId, sort: i + 1 } }),
      ),
    ]);
  }
}
