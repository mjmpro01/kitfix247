// Dữ liệu mẫu lấy từ renderVals() của các artboard trong design/screens.
// Nội dung đánh dấu [ ... ] là placeholder — chủ cung cấp bản thật (SPEC mục 9).
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Settings } from '@kitfix/types';
import { checkSeo, slugifyVi } from '@kitfix/ui';

const prisma = new PrismaClient();

// Giá mẫu theo CLAUDE.md: luôn là khoảng, chờ chủ cung cấp giá thật.
const P_FROM = 150_000;
const P_TO = 450_000;

const settings: Settings = {
  hotline: '0989.041.641',
  hotlineTel: '0989041641',
  zaloUrl: 'https://zalo.me/0989041641',
  address: '2 Bạch Đằng, P. Tân Sơn Hòa, TP.HCM',
  hours: '7:00 – 21:00',
  hoursNote: 'tất cả các ngày (kể cả thứ 7, chủ nhật)',
  siteUrl: 'https://kitfix247.com',
  tagline: 'Sửa chuyên nghiệp. Dùng bền lâu.',
  about: 'Sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM. Có mặt trong 60 phút, bảo hành 12 tháng.',
  rating: { score: 4.9, outOf: 5, label: 'Từ hơn 500 khách đã sửa' },
  commitments: [
    { title: 'Có mặt trong 60 phút.', detail: 'Kỹ thuật viên gọi trước khi đến.' },
    { title: 'Chẩn đoán miễn phí.', detail: 'Không sửa không mất phí.' },
    { title: 'Báo giá trước.', detail: 'Anh/chị đồng ý mới sửa.' },
    { title: 'Bảo hành 12 tháng.', detail: 'Có phiếu bảo hành ghi rõ hạng mục.' },
    { title: '20 năm kinh nghiệm.', detail: 'Đánh giá 4.9/5 từ hơn 500 khách.' },
  ],
  features: [
    { title: '20 năm kinh nghiệm', detail: 'Chuyên sâu thiết bị nhà bếp', icon: 'award' },
    { title: 'Linh kiện chính hãng', detail: 'Đảm bảo chất lượng', icon: 'shield' },
    { title: 'Có mặt trong 60 phút', detail: 'Hỗ trợ tận nơi', icon: 'truck' },
    { title: 'Bảo hành 12 tháng', detail: 'Rõ ràng – minh bạch', icon: 'receipt' },
    { title: 'Tận tâm & chuyên nghiệp', detail: 'Đặt khách hàng lên hàng đầu', icon: 'heart' },
  ],
  promises: ['Có mặt trong 60 phút', 'Chẩn đoán miễn phí', 'Báo giá trước khi sửa', 'Bảo hành 12 tháng'],
  payments: ['Tiền mặt', 'Chuyển khoản', 'MoMo', 'ZaloPay'],
  hero: {
    imageUrl: '/images/hero-banner.png',
    imageAlt:
      'Kỹ thuật viên KitFix247 sửa bếp từ tại nhà khách — sửa chữa, vệ sinh, lắp đặt bếp từ, hút mùi, lò nướng, lò vi sóng, máy rửa chén',
    h1: 'Sửa chữa – Vệ sinh – Lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM',
    mobileLine1: 'Sửa chữa – Vệ sinh – Lắp đặt',
    mobileLine2: 'Thiết bị nhà bếp',
    mobileLead: 'Xử lý nhanh – Linh kiện chính hãng – Bảo hành 12 tháng. Có mặt trong 60 phút.',
  },
};

const FAQ = [
  { question: 'Kiểm tra lỗi có mất phí không?', answer: 'Không. Chúng tôi chẩn đoán miễn phí và báo giá trước; anh/chị đồng ý mới bắt đầu sửa.' },
  { question: 'Bao lâu kỹ thuật viên đến nơi?', answer: 'Trong khu vực nội thành TP.HCM, kỹ thuật viên có mặt trong 60 phút kể từ khi xác nhận lịch.' },
  { question: 'Bảo hành như thế nào?', answer: 'Linh kiện thay mới và công sửa được bảo hành 12 tháng, có phiếu bảo hành ghi rõ hạng mục.' },
  { question: 'Thanh toán bằng cách nào?', answer: 'Tiền mặt, chuyển khoản, MoMo hoặc ZaloPay sau khi bàn giao và chạy thử.' },
];

type Fault = { title: string; code: string; cause: string };

interface SeedService {
  slug: string;
  name: string;
  shortName: string;
  shortHint: string;
  cardText: string;
  lead: string;
  device: string;
  faultsTitle: string;
  icon: string;
  seoTitle: string;
  seoDesc: string;
  faults: Fault[];
  prices: { name: string; duration: string }[];
}

const services: SeedService[] = [
  {
    slug: 'sua-bep-tu',
    name: 'Sửa bếp từ',
    shortName: 'Sửa bếp từ',
    shortHint: 'Không nhận nồi, lỗi E1–E9',
    cardText: 'Mất nguồn, không nóng, không nhận nồi, báo lỗi E1–E9.',
    lead: 'Bếp không nhận nồi, báo lỗi, tự tắt hay nứt mặt kính — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí và sửa ngay tại nhà anh/chị.',
    device: 'Bếp từ',
    faultsTitle: 'Bếp từ nhà anh/chị đang bị gì?',
    icon: 'burner',
    seoTitle: 'Sửa bếp từ tận nhà TP.HCM – có mặt 60 phút',
    seoDesc:
      'Sửa bếp từ tận nhà tại TP.HCM: bếp không nhận nồi, báo lỗi E1, E4, tự tắt, nhảy aptomat, nứt kính. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [
      { title: 'Bếp không nhận nồi', code: 'E1 / E0', cause: 'nồi không đúng đáy từ, cuộn dây hoặc cảm biến nồi lỗi, bo mạch hỏng.' },
      { title: 'Báo lỗi quá nhiệt', code: 'E4 / E5', cause: 'quạt tản nhiệt yếu hoặc bám bụi, cảm biến nhiệt hỏng.' },
      { title: 'Bếp tự tắt khi đang nấu', code: 'Tự ngắt', cause: 'quá nhiệt, nguồn điện chập chờn, tụ hoặc sò công suất xuống cấp.' },
      { title: 'Bật bếp là nhảy aptomat', code: 'Chập', cause: 'chập sò công suất (IGBT), cầu diode hoặc dây nguồn hỏng.' },
      { title: 'Cảm ứng không nhạy, liệt phím', code: 'Phím', cause: 'mặt kính bẩn hoặc ẩm, bo phím điều khiển hỏng.' },
      { title: 'Mặt kính nứt, vỡ', code: 'Kính', cause: 'va đập, sốc nhiệt — cần thay kính để đảm bảo an toàn điện.' },
    ],
    prices: [
      { name: 'Kiểm tra, chẩn đoán lỗi', duration: '15–30 phút' },
      { name: 'Vệ sinh, thay quạt tản nhiệt', duration: '30–45 phút' },
      { name: 'Thay sò công suất (IGBT)', duration: '45–60 phút' },
      { name: 'Sửa / thay bo mạch công suất', duration: '1–2 giờ' },
      { name: 'Thay bo phím cảm ứng', duration: '45–60 phút' },
      { name: 'Thay mặt kính', duration: '1–2 giờ' },
    ],
  },
  {
    slug: 'sua-bep-hong-ngoai',
    name: 'Sửa bếp hồng ngoại',
    shortName: 'Bếp hồng ngoại',
    shortHint: 'Mâm không đỏ, nóng yếu',
    cardText: 'Mâm nhiệt không đỏ, nóng yếu, nhảy aptomat, nứt kính.',
    lead: 'Mâm nhiệt không đỏ, nóng yếu, nhảy aptomat hay nứt mặt kính — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí và sửa ngay tại nhà anh/chị.',
    device: 'Bếp hồng ngoại',
    faultsTitle: 'Bếp hồng ngoại nhà anh/chị đang bị gì?',
    icon: 'infrared',
    seoTitle: 'Sửa bếp hồng ngoại tận nhà TP.HCM – 60 phút',
    seoDesc:
      'Sửa bếp hồng ngoại tận nhà tại TP.HCM: mâm nhiệt không đỏ, nóng yếu, tự tắt, nhảy aptomat, nứt kính. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    // [Cần kỹ thuật viên kiểm tra lại nội dung lỗi bếp hồng ngoại — artboard chỉ vẽ trang bếp từ.]
    faults: [
      { title: 'Mâm nhiệt không đỏ', code: 'Mâm nhiệt', cause: 'dây mâm nhiệt đứt, công tắc nhiệt hoặc rơ-le hỏng, bo điều khiển lỗi.' },
      { title: 'Bếp nóng yếu, lâu chín', code: 'Nóng yếu', cause: 'mâm nhiệt xuống cấp, điện áp yếu, cảm biến nhiệt đọc sai.' },
      { title: 'Bếp tự tắt khi đang nấu', code: 'Tự ngắt', cause: 'quá nhiệt, quạt tản nhiệt yếu hoặc bám bụi, nguồn điện chập chờn.' },
      { title: 'Bật bếp là nhảy aptomat', code: 'Chập', cause: 'chập mâm nhiệt, dây nguồn hoặc cầu đấu bị cháy.' },
      { title: 'Cảm ứng không nhạy, liệt phím', code: 'Phím', cause: 'mặt kính bẩn hoặc ẩm, bo phím điều khiển hỏng.' },
      { title: 'Mặt kính nứt, vỡ', code: 'Kính', cause: 'va đập, sốc nhiệt — cần thay kính để đảm bảo an toàn điện.' },
    ],
    prices: [
      { name: 'Kiểm tra, chẩn đoán lỗi', duration: '15–30 phút' },
      { name: 'Thay mâm nhiệt', duration: '45–60 phút' },
      { name: 'Thay công tắc nhiệt / rơ-le', duration: '30–45 phút' },
      { name: 'Sửa / thay bo điều khiển', duration: '1–2 giờ' },
      { name: 'Thay mặt kính', duration: '1–2 giờ' },
    ],
  },
  {
    slug: 'sua-may-hut-mui',
    name: 'Sửa & vệ sinh máy hút mùi',
    shortName: 'Máy hút mùi',
    shortHint: 'Hút yếu, kêu to, bám dầu',
    cardText: 'Hút yếu, kêu to, quạt quay chậm, vệ sinh định kỳ.',
    lead: 'Máy hút mùi hút yếu, kêu to, quạt quay chậm hay bám dầu — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí và xử lý tại nhà anh/chị.',
    device: 'Máy hút mùi',
    faultsTitle: 'Máy hút mùi nhà anh/chị đang bị gì?',
    icon: 'hood',
    seoTitle: 'Sửa & vệ sinh máy hút mùi tận nhà TP.HCM',
    seoDesc:
      'Sửa và vệ sinh máy hút mùi tận nhà tại TP.HCM: hút yếu, kêu to, quạt quay chậm, bám dầu. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [],
    prices: [],
  },
  {
    slug: 'sua-lo-nuong',
    name: 'Sửa lò nướng',
    shortName: 'Lò nướng',
    shortHint: 'Không nóng, sai nhiệt độ',
    cardText: 'Không nóng, sai nhiệt độ, quạt đối lưu không chạy, báo lỗi.',
    lead: 'Lò nướng không nóng, sai nhiệt độ, quạt đối lưu không chạy hay báo lỗi — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí tại nhà anh/chị.',
    device: 'Lò nướng',
    faultsTitle: 'Lò nướng nhà anh/chị đang bị gì?',
    icon: 'oven',
    seoTitle: 'Sửa lò nướng tận nhà TP.HCM – có mặt 60 phút',
    seoDesc:
      'Sửa lò nướng tận nhà tại TP.HCM: không nóng, sai nhiệt độ, quạt đối lưu không chạy, báo lỗi. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [],
    prices: [],
  },
  {
    slug: 'sua-lo-vi-song',
    name: 'Sửa lò vi sóng',
    shortName: 'Lò vi sóng',
    shortHint: 'Không nóng, kêu to, mất nguồn',
    cardText: 'Không nóng, kêu to, mất nguồn, đĩa không quay.',
    lead: 'Lò vi sóng chạy nhưng không nóng, kêu to, mất nguồn hay đĩa không quay — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí tại nhà anh/chị.',
    device: 'Lò vi sóng',
    faultsTitle: 'Lò vi sóng nhà anh/chị đang bị gì?',
    icon: 'microwave',
    seoTitle: 'Sửa lò vi sóng tận nhà TP.HCM – có mặt 60 phút',
    seoDesc:
      'Sửa lò vi sóng tận nhà tại TP.HCM: chạy không nóng, kêu to, mất nguồn, đĩa không quay. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [],
    prices: [],
  },
  {
    slug: 'sua-may-rua-chen',
    name: 'Sửa máy rửa chén',
    shortName: 'Máy rửa chén',
    shortHint: 'Không cấp nước, không rửa',
    cardText: 'Không cấp nước, không rửa, không xả, báo lỗi E, F.',
    lead: 'Máy rửa chén không cấp nước, không rửa, không xả hay báo lỗi — kỹ thuật viên có mặt trong 60 phút, kiểm tra miễn phí tại nhà anh/chị.',
    device: 'Máy rửa chén',
    faultsTitle: 'Máy rửa chén nhà anh/chị đang bị gì?',
    icon: 'dishwasher',
    seoTitle: 'Sửa máy rửa chén tận nhà TP.HCM – 60 phút',
    seoDesc:
      'Sửa máy rửa chén tận nhà tại TP.HCM: không cấp nước, không rửa, không xả, báo lỗi E, F. Kiểm tra miễn phí, bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [],
    prices: [],
  },
  {
    slug: 'lap-dat-thiet-bi-bep',
    name: 'Lắp đặt thiết bị bếp',
    shortName: 'Lắp đặt',
    shortHint: 'Bếp, hút mùi, lò âm tủ',
    cardText: 'Lắp bếp âm, máy hút mùi, lò âm tủ, máy rửa chén.',
    lead: 'Lắp bếp âm, máy hút mùi, lò âm tủ, máy rửa chén đúng kỹ thuật và an toàn điện — kỹ thuật viên có mặt trong 60 phút tại nhà anh/chị.',
    device: 'Lắp đặt thiết bị bếp',
    faultsTitle: 'Anh/chị cần lắp thiết bị nào?',
    icon: 'wrench',
    seoTitle: 'Lắp đặt thiết bị bếp tận nhà tại TP.HCM',
    seoDesc:
      'Lắp đặt bếp âm, máy hút mùi, lò âm tủ, máy rửa chén tận nhà tại TP.HCM, đúng kỹ thuật và an toàn điện. Bảo hành 12 tháng. Gọi 0989.041.641.',
    faults: [],
    prices: [],
  },
  {
    slug: 'bao-duong-dinh-ky',
    name: 'Bảo dưỡng định kỳ',
    shortName: 'Bảo dưỡng',
    shortHint: 'Vệ sinh, kiểm tra an toàn',
    cardText: 'Vệ sinh quạt tản nhiệt, lưới lọc, kiểm tra điện an toàn.',
    lead: 'Vệ sinh quạt tản nhiệt, lưới lọc và kiểm tra điện an toàn cho thiết bị bếp — giúp thiết bị chạy êm, bền và tránh hỏng đột ngột.',
    device: 'Vệ sinh / bảo dưỡng',
    faultsTitle: 'Bảo dưỡng gồm những gì?',
    icon: 'shield',
    seoTitle: 'Bảo dưỡng thiết bị bếp định kỳ tại TP.HCM',
    seoDesc:
      'Bảo dưỡng định kỳ bếp từ, máy hút mùi, lò nướng tại TP.HCM: vệ sinh quạt tản nhiệt, lưới lọc, kiểm tra điện an toàn. Gọi 0989.041.641 để đặt lịch.',
    faults: [],
    prices: [],
  },
];

const steps = [
  { n: 1, title: 'Liên hệ', description: 'Gọi hotline, nhắn Zalo hoặc đặt lịch online. Mô tả ngắn lỗi anh/chị đang gặp.' },
  { n: 2, title: 'Kỹ thuật viên đến nhà', description: 'Có mặt trong 60 phút, mang đủ dụng cụ và linh kiện thông dụng.' },
  { n: 3, title: 'Chẩn đoán & báo giá', description: 'Kiểm tra miễn phí, báo giá rõ ràng. Anh/chị đồng ý mới bắt đầu sửa.' },
  { n: 4, title: 'Sửa & bàn giao', description: 'Chạy thử cùng anh/chị, bàn giao kèm phiếu bảo hành 12 tháng.' },
];

const REVIEW_PLACEHOLDER = '[Trích đánh giá thật của khách — 2–3 câu về lỗi đã sửa, thời gian đến, thái độ kỹ thuật viên]';
const reviews = [
  { device: 'Sửa bếp từ', area: 'Tân Bình, TP.HCM' },
  { device: 'Sửa lò vi sóng', area: 'Quận 7, TP.HCM' },
  { device: 'Vệ sinh hút mùi', area: 'Bình Thạnh, TP.HCM' },
  { device: 'Lắp đặt bếp', area: 'Thủ Đức, TP.HCM' },
];

const brands = ['Bosch', 'Hafele', 'Chefs', 'Eurosun', 'Teka', 'Siemens', 'Canzy', 'Fagor', 'Malloca'];

const categories = ['Bảng mã lỗi', 'Mẹo sử dụng', 'Tư vấn', 'Khuyến mãi'];

const posts = [
  {
    cat: 'Bảng mã lỗi',
    date: '2026-10-10',
    device: 'Bếp từ',
    kw: 'bếp từ báo lỗi E1',
    brands: ['Bosch', 'Teka'],
    title: 'Bếp từ báo lỗi E1, E4: nguyên nhân và cách xử lý tại nhà',
    excerpt: 'Giải thích ý nghĩa từng mã lỗi phổ biến và khi nào anh/chị nên gọi kỹ thuật viên.',
  },
  {
    cat: 'Mẹo sử dụng',
    date: '2026-10-06',
    device: 'Máy hút mùi',
    kw: 'vệ sinh máy hút mùi',
    brands: ['Hafele'],
    title: 'Bao lâu nên vệ sinh máy hút mùi một lần?',
    excerpt: 'Dấu hiệu lưới lọc đã bám dầu và cách vệ sinh đúng để máy hút khỏe, bền.',
  },
  {
    cat: 'Tư vấn',
    date: '2026-10-01',
    device: 'Lò vi sóng',
    kw: 'lò vi sóng không nóng',
    brands: ['Teka'],
    title: 'Lò vi sóng chạy nhưng không nóng: có phải hỏng magnetron?',
    excerpt: 'Các dấu hiệu nhận biết và chi phí thay magnetron tham khảo.',
  },
];

const products = [
  { sku: 'DC-TUAVIT-01', name: 'Bộ tua vít sửa chữa đa năng', category: 'Dụng cụ', icon: 'screw' },
  { sku: 'VT-KEO-01', name: 'Keo tản nhiệt cho bo mạch bếp từ', category: 'Vật tư', icon: 'paste' },
  { sku: 'LK-CAUCHI-01', name: 'Cầu chì thay thế cho bếp điện', category: 'Linh kiện', icon: 'fuse' },
  { sku: 'PK-DAYNGUON-01', name: 'Dây nguồn bếp từ chịu tải cao', category: 'Dây & phụ kiện', icon: 'plug' },
];

/** Tài khoản quản trị lấy từ ADMIN_EMAIL / ADMIN_PASSWORD (apps/api/.env, mẫu ở .env.example) — không hard-code. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('Bỏ qua tài khoản admin: chưa đặt ADMIN_EMAIL / ADMIN_PASSWORD trong apps/api/.env.');
    return;
  }
  if (password.length < 10) throw new Error('ADMIN_PASSWORD cần tối thiểu 10 ký tự.');
  const passwordHash = await hash(password, 12);
  await prisma.adminUser.upsert({ where: { email }, create: { email, passwordHash, role: 'admin' }, update: { passwordHash } });
  console.log('Tài khoản admin: %s', email);
}

async function main() {
  // Xoá theo thứ tự phụ thuộc để seed lại được nhiều lần.
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.postBrand.deleteMany(),
    prisma.post.deleteMany(),
    prisma.category.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.review.deleteMany(),
    prisma.processStep.deleteMany(),
    prisma.priceItem.deleteMany(),
    prisma.priceGroup.deleteMany(),
    prisma.serviceFaq.deleteMany(),
    prisma.serviceFault.deleteMany(),
    prisma.service.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  await prisma.setting.createMany({
    data: Object.entries(settings).map(([key, value]) => ({ key, value: value as object })),
  });

  for (const [i, s] of services.entries()) {
    const svc = await prisma.service.create({
      data: {
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        shortHint: s.shortHint,
        cardText: s.cardText,
        lead: s.lead,
        device: s.device,
        faultsTitle: s.faultsTitle,
        icon: s.icon,
        sort: i + 1,
        showHome: true,
        seoTitle: s.seoTitle,
        seoDesc: s.seoDesc,
        faults: { create: s.faults.map((f, j) => ({ ...f, priceFrom: P_FROM, priceTo: P_TO, sort: j + 1 })) },
        faqs: { create: FAQ.map((q, j) => ({ ...q, sort: j + 1 })) },
      },
    });
    if (s.prices.length) {
      await prisma.priceGroup.create({
        data: {
          name: s.name,
          sort: i + 1,
          showHome: false,
          items: { create: s.prices.map((p, j) => ({ ...p, serviceId: svc.id, priceFrom: P_FROM, priceTo: P_TO, sort: j + 1 })) },
        },
      });
    }
  }

  await prisma.processStep.createMany({ data: steps });

  await prisma.review.createMany({
    data: reviews.map((r, i) => ({
      customerName: `[Tên khách hàng ${String.fromCharCode(65 + i)}]`,
      area: r.area,
      device: r.device,
      rating: 5,
      content: REVIEW_PLACEHOLDER,
      status: 'approved' as const,
      showHome: true,
      createdAt: new Date(Date.now() - i * 60_000),
    })),
  });

  await prisma.brand.createMany({
    data: brands.map((name, i) => ({ slug: slugifyVi(name), name, logoUrl: null, logoStyle: 'gray' as const, sort: i + 1, showHome: true })),
  });

  for (const name of categories) await prisma.category.create({ data: { slug: slugifyVi(name), name } });

  for (const p of posts) {
    const cat = await prisma.category.findUniqueOrThrow({ where: { slug: slugifyVi(p.cat) } });
    const slug = slugifyVi(p.title);
    const contentMd = `${p.excerpt} [Nội dung bài viết thật — kỹ thuật viên kiểm tra trước khi đăng.]\n\n## ${p.kw}\n\n[Thân bài]\n\nCần hỗ trợ, anh/chị [đặt lịch](/dat-lich) hoặc gọi 0989.041.641.`;
    const seo = checkSeo({ focusKeyword: p.kw, title: p.title, slug, metaDesc: p.excerpt, contentMd, coverAlt: p.title });
    await prisma.post.create({
      data: {
        slug,
        title: p.title,
        excerpt: p.excerpt,
        contentMd,
        coverAlt: p.title,
        categoryId: cat.id,
        device: p.device,
        status: 'published',
        focusKeyword: p.kw,
        metaDesc: p.excerpt,
        seoScore: seo.score,
        readMinutes: 5,
        author: 'KitFix247',
        publishedAt: new Date(`${p.date}T08:00:00+07:00`),
        brands: { create: p.brands.map((name) => ({ brand: { connect: { slug: slugifyVi(name) } } })) },
      },
    });
  }

  await prisma.product.createMany({ data: products.map((p) => ({ ...p, price: null, stock: 0, status: 'active' })) });

  await seedAdmin();

  console.log('Seed xong: %d dịch vụ, %d hãng, %d bài viết, %d sản phẩm.', services.length, brands.length, posts.length, products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
