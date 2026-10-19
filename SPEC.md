# KitFix247 — Đặc tả triển khai

Website dịch vụ **sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM** (kitfix247.com).
Mục tiêu mọi trang: **một cuộc gọi hoặc một lịch hẹn**.

Bản thiết kế gốc (nguồn sự thật về giao diện): canvas Design trên claude.ai — các file trong `design/screens/*.dc.html` là bản sao mã nguồn của từng artboard tại thời điểm bàn giao. Design system: `design/DESIGN-SYSTEM.md` + `design/tokens.json`.

---

## 1. Kiến trúc

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | SSR/ISR cho SEO; CSS Modules hoặc Tailwind map 1:1 với tokens |
| API | **NestJS + TypeScript** (hoặc Go — giữ nguyên hợp đồng API ở mục 6) | REST JSON, JWT cho admin |
| CSDL | **MySQL 8** (Prisma hoặc TypeORM) | |
| Ảnh/logo | Azure Blob Storage hoặc S3-compatible | Upload qua API admin, trả URL công khai |
| Thông báo lịch hẹn | Zalo OA / Telegram / email (chọn sau) | Bắn ngay khi có lịch hẹn mới |
| Thanh toán Shop | Tiền mặt (COD), chuyển khoản, MoMo, ZaloPay | Giai đoạn 1: ghi nhận phương thức, xác nhận thủ công |

Monorepo gợi ý:
```
apps/web      # Next.js (site công khai + /admin)
apps/api      # NestJS
packages/ui   # component dùng chung + tokens
packages/types
```

## 2. Design tokens

Lấy đúng từ `design/tokens.json` (theme sáng là chính). Biến CSS:

```
--surface #faf8f5; --surface-raised #fff; --surface-sunken #f1ede6
--glass #0e2843 (navy: hero, footer); --on-glass #f4f1ec; --on-glass-muted #aebbd0
--ink #0e2843; --ink-muted #5a6069; --line #ddd6cc; --line-strong #8a9099
--brand #f57a0a (chỉ làm NỀN); --brand-hover #ff9a3d; --on-brand #0e2843
--heat #b85200 (cam dạng CHỮ trên nền sáng); --heat-strong #9a4300; --heat-soft #fdead8
--spark #f2a70e (điểm nhấn nhỏ trên navy); --trust #0f766e; --trust-soft #d9f1ed
--star #b45309; --danger #b42318
radius: 6 / 12 / 20 / 999 · spacing: 4 8 12 16 24 32 48 80
```

Font (Google Fonts): **Chakra Petch** (tiêu đề, 600/700/700 nghiêng) + **Be Vietnam Pro** (nội dung 400/600/700/800).
Quy tắc bắt buộc: chữ trên nền cam luôn navy (không dùng chữ trắng); chữ cam trên nền sáng dùng `--heat`; vòng focus 2px `--heat` offset 2px; vùng chạm ≥ 44px; nội dung max 1160px; mobile < 640px: H1 hero xuống 32px, H2 xuống 22px, padding section 48px.

## 3. Thông tin cố định (lấy từ bảng Cài đặt, không hard-code)

- Hotline **0989.041.641** — `tel:0989041641`; Zalo `https://zalo.me/0989041641`
- Địa chỉ: 2 Bạch Đằng, P. Tân Sơn Hòa, TP.HCM · Giờ làm 7:00 – 21:00 tất cả các ngày
- Cam kết: có mặt trong 60 phút · 20 năm kinh nghiệm · bảo hành 12 tháng · chẩn đoán miễn phí · 4.9/5 từ hơn 500 khách
- Thanh toán: tiền mặt, chuyển khoản, MoMo, ZaloPay
- Không hiển thị mã số thuế cho tới khi có số thật.

## 4. Trang công khai (route → artboard tham chiếu)

| Route | Artboard | Nội dung chính |
|---|---|---|
| `/` | `Main.dc.html` | Header · Hero banner (ảnh + 2 nút HTML phủ lên) · Dải logo hãng · 5 cam kết · Lưới dịch vụ (8) · Quy trình 4 bước · Đánh giá (4) · Linh kiện (4) · Kiến thức mới nhất (3) · Form đặt lịch · Footer · Bong bóng liên hệ |
| `/dich-vu/[slug]` | `DichVu.dc.html` | Tab 8 dịch vụ · Hero · Lỗi thường gặp (card có mã lỗi + giá tham khảo) · FAQ (accordion) · Form đặt lịch |
| `/san-pham` | `SanPham.dc.html` | Lọc nhóm, sắp xếp, lưới sản phẩm, giỏ mini |
| `/gio-hang` | `GioHang.dc.html` | Số lượng ± , xoá, thông tin giao hàng, chọn thanh toán, đặt hàng → thông báo thành công |
| `/dat-lich` (= Liên hệ) | `DatLich.dc.html` | Form đặt lịch + cam kết + liên hệ + bản đồ |
| `/kien-thuc` | `KienThuc.dc.html` | Tìm kiếm, lọc chuyên mục (Bảng mã lỗi, Mẹo sử dụng, Tư vấn, Khuyến mãi), lọc hãng, bài nổi bật, lưới 9 bài/trang, phân trang |
| `/kien-thuc/hang/[brand]` | `KienThucHang.dc.html` | Như trên, hero theo hãng (logo, mô tả, nút "Đặt lịch sửa {hãng}"), lọc sẵn theo hãng |
| `/kien-thuc/[slug]` | `BaiViet.dc.html` | Breadcrumb, nhãn chuyên mục/thiết bị/hãng, H1, meta, ảnh, thân bài ≤720px, mục lục dính, khối CTA cuối bài, bài liên quan |
| `/chinh-sach-bao-hanh`, `/gioi-thieu`, `/bang-gia` | (chưa vẽ) | Trang nội dung dùng layout bài viết; `/bang-gia` tạm ẩn khỏi menu cho tới khi chủ quyết định |

Bản mobile tham chiếu: `Mobile-*.dc.html` (390px). Header < 1100px thu về nút ☰ (panel có accordion Dịch vụ); khối Hotline ẩn < 1280px. Hero mobile: ảnh crop phần kỹ thuật viên, tiêu đề + 2 nút bằng chữ thật bên dưới.

### Component dùng chung
`SiteHeader` (menu: Trang chủ, Giới thiệu, Dịch vụ ▾ (8), Bảng giá, Kiến thức, Liên hệ; hotline; nút Đặt lịch ngay) · `SiteFooter` · `BookingForm` · `ChatBubbles` (Gọi có vòng pulse – tắt khi prefers-reduced-motion, Zalo, Đặt lịch; dính góc phải dưới) · `BrandStrip` · `ServiceCard` · `ArticleCard` · `ProductCard` · `ReviewCard`.

### Hero banner
Ảnh `design/assets/hero-banner.png` (1024×310 — cần bản ≥1920px). Nút trong ảnh ghi số sai (0963…), nên 2 nút HTML phải phủ đúng vị trí (theo % kích thước ảnh, đo trên ảnh 1024×310):
- Gọi ngay: left 6.45%, top 77.1%, width 20.8%, height 13.9%, pill cam
- Đặt lịch: left 27.83%, top 77.1%, width 16.9%, height 14.2%, nền navy viền `--on-glass-muted`
- Cỡ chữ theo `cqw` (container query). H1 ẩn cho SEO: "Sửa chữa – Vệ sinh – Lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM". Nếu có ảnh sạch (không chữ) thì bỏ cơ chế phủ.

### Form đặt lịch
Trường: họ tên (bắt buộc), SĐT (bắt buộc, `/^0\d{9}$/` sau khi bỏ dấu cách/chấm), thiết bị (dropdown: Bếp từ, Bếp hồng ngoại, Lò nướng, Lò vi sóng, Máy hút mùi, Máy rửa chén, Lắp đặt thiết bị bếp, Vệ sinh / bảo dưỡng, Khác), địa chỉ, mô tả lỗi. Lỗi hiện chữ đỏ dưới ô. Gửi thành công: "Đã nhận yêu cầu của anh/chị {tên}… gọi lại số {sđt} trong vòng 15 phút". Chống spam: honeypot + rate limit theo IP/SĐT.

### Dải logo hãng
Logo xám, rê chuột hiện màu (tuỳ cấu hình từng hãng). Hãng chưa có logo → hiện tên chữ. Bấm → `/kien-thuc/hang/[slug]`. **Không tự vẽ logo hãng** — chỉ dùng file logo chính thức do chủ tải lên.

## 5. Mô hình dữ liệu (MySQL)

```
settings(key PK, value JSON)                       -- hotline, zalo, địa chỉ, giờ, cam kết, hero, thanh toán, menu
services(id, slug UQ, name, short_hint, lead, icon, sort, show_home, seo_title, seo_desc)
service_faults(id, service_id FK, title, code, cause, price_from, price_to, sort)
service_faqs(id, service_id FK, question, answer, sort)
price_groups(id, name, sort, show_home)            -- tạm ẩn ở trang chủ
price_items(id, group_id FK, service_id FK NULL, name, duration, price_from, price_to, sort)
process_steps(id, n, title, description)
reviews(id, customer_name, area, device, rating, content, status ENUM(pending,approved,hidden), show_home, created_at)
brands(id, slug UQ, name, logo_url, logo_style ENUM(gray,color), description, devices JSON, sort, show_home, seo_title, seo_desc)
categories(id, slug UQ, name)                      -- Bảng mã lỗi, Mẹo sử dụng, Tư vấn, Khuyến mãi
posts(id, slug UQ, title, excerpt, content_md, cover_url, cover_alt, category_id, device, status ENUM(draft,published),
      focus_keyword, meta_title, meta_desc, seo_score, read_minutes, author, published_at, updated_at)
post_brands(post_id, brand_id)                     -- n-n
bookings(id, name, phone, device, address, description, status ENUM(new,called,assigned,done,cancelled),
         technician, source ENUM(form,call,zalo), created_at, called_at)
products(id, sku, name, category, description, price, stock, image_url, status)
orders(id, code, customer_name, phone, address, payment ENUM(cod,bank,momo,zalopay), status, subtotal, shipping_fee, total, created_at)
order_items(order_id, product_id, qty, unit_price)
admin_users(id, email, password_hash, role)
```

## 6. API (NestJS) — hợp đồng

Công khai:
```
GET  /settings
GET  /services · GET /services/:slug          (kèm faults, faqs)
GET  /brands?home=1 · GET /brands/:slug
GET  /posts?category=&brand=&q=&page=&limit=9 · GET /posts/:slug (kèm related 3)
GET  /reviews?home=1 · GET /products?category=&sort=
POST /bookings                                 → 201 {id}; bắn thông báo cho admin
POST /orders                                   → 201 {code}
```
Admin (JWT, tiền tố `/admin`): CRUD cho services/faults/faqs/price, brands (+ `POST /admin/uploads` trả URL), posts (+ `POST /admin/posts/:id/seo-check`), reviews (duyệt), products, orders (đổi trạng thái), bookings (`PATCH status`), settings.

## 7. Trang quản trị `/admin`

Sidebar (artboard `AdminSidebar`): Vận hành (Tổng quan, Lịch hẹn, Đơn hàng) · Nội dung (Dịch vụ, Bảng giá, Sản phẩm, Bài viết & SEO, Thương hiệu, Đánh giá, Trang chủ & Hero) · Cài đặt (Menu, Hotline/Zalo/CTA, Footer & thanh toán, Chính sách bảo hành). Mobile: sidebar thành hàng chip cuộn ngang.

- **Tổng quan** (`AdminTongQuan`): KPI (lịch hôm nay, chờ gọi lại + số quá 15 phút, đơn mới, bài đã đăng), bảng lịch hẹn lọc trạng thái, quá 15 phút tô đỏ, nút "Đánh dấu đã gọi" / "Giao KTV"; đơn Shop mới; điểm SEO các bài; lưới module.
- **Dịch vụ & bảng giá** (`AdminDichVu`): danh sách dịch vụ kéo-thả, sửa tên/đoạn dẫn, bật hiện trang chủ, lỗi thường gặp (thêm/xoá/sửa), hạng mục giá (tên, giá từ, giá đến).
- **Thương hiệu** (`AdminThuongHieu`): xem trước dải hãng, danh sách kéo-thả + bật hiện trang chủ, thiết lập từng hãng (upload logo PNG/SVG nền trong suốt cao ≥80px, kiểu xám/màu gốc, tên, slug, mô tả trang hãng, thiết bị hãng, SEO trang hãng), thêm hãng.
- **Viết bài + Check SEO** (`AdminBaiViet`): tiêu đề, slug (nút tạo từ tiêu đề, bỏ dấu tiếng Việt, đ→d), chuyên mục, **thương hiệu liên quan (nhiều)**, editor Markdown (H2/H3/B/I/link/ảnh/khối hotline), ảnh đại diện + alt, đếm từ; panel SEO chấm điểm trực tiếp.

### Luật chấm SEO (12 tiêu chí, điểm = đạt/12 × 100; ≥80 Tốt, 50–79 Cần cải thiện, <50 Kém)
1. Đã nhập từ khoá chính
2. Tiêu đề chứa từ khoá
3. Tiêu đề SEO (meta title, mặc định = tiêu đề) dài 30–60 ký tự
4. Mô tả meta dài 120–160 ký tự
5. Mô tả meta chứa từ khoá
6. Slug chứa từ khoá đã slugify
7. Từ khoá có trong đoạn mở đầu (đoạn đầu không phải heading)
8. Mật độ từ khoá 0,5–2,5% (số lần × số từ của từ khoá / tổng số từ)
9. Bài từ 300 từ
10. Có tiêu đề phụ H2 (`## `)
11. Có liên kết nội bộ (`/dich-vu`, `/dat-lich`, link markdown hoặc http)
12. Alt ảnh đại diện chứa từ khoá
Kèm xem trước kết quả Google (title cắt 60 ký tự + " | KitFix247", URL `kitfix247.com › kien-thuc › slug`, mô tả cắt 160). So khớp không phân biệt hoa thường; tính trên cả frontend (trực tiếp) và backend (lưu `seo_score`).

## 8. SEO kỹ thuật
- Metadata Next.js mỗi trang; JSON-LD: `LocalBusiness`/`HomeAndConstructionBusiness` (trang chủ), `Service` (dịch vụ), `Article` + `BreadcrumbList` (bài), `FAQPage` (FAQ dịch vụ).
- `sitemap.xml`, `robots.txt`, canonical, Open Graph; ảnh `next/image`; ISR revalidate khi admin lưu.
- Core Web Vitals: hero ảnh `priority`, font `display=swap`.

## 9. Nội dung còn là placeholder (chủ cung cấp)
Ảnh thật (kỹ thuật viên, thiết bị, sản phẩm, bài viết) · giá các hạng mục (chỉ có thật: thay magnetron 650.000 – 1.200.000 ₫) · giá sản phẩm · 4 đánh giá thật (tên, khu vực, nội dung) · logo chính thức 9 hãng (Bosch, Hafele, Chefs, Eurosun, Teka, Siemens, Canzy, Fagor, Malloca) · banner hero bản ≥1920px (lý tưởng là bản không chữ) · nội dung Chính sách bảo hành, Giới thiệu · bài viết thật (bảng mã lỗi cần kỹ thuật viên kiểm tra) · thời gian sửa ở bảng giá dịch vụ là ước lượng mẫu · số liệu trong admin là dữ liệu mẫu.

## 10. Thứ tự triển khai gợi ý
1. Monorepo, tokens, font, layout + Header/Footer/ChatBubbles
2. API + DB + seed dữ liệu mẫu từ các artboard
3. Trang chủ → Dịch vụ → Đặt lịch (form + thông báo)
4. Kiến thức, trang hãng, bài viết (SSR/ISR + SEO)
5. Admin: auth, Tổng quan/Lịch hẹn, Bài viết + SEO check, Thương hiệu, Dịch vụ & giá
6. Shop: sản phẩm, giỏ, đơn hàng
7. Responsive QA theo `Mobile-*`, a11y, Lighthouse, deploy
