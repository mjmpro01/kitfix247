Hệ thống giao diện của **KitFix247** — dịch vụ **sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp** tận nhà tại TP.HCM: bếp từ, bếp hồng ngoại, bếp điện đôi, máy hút mùi, lò nướng, lò vi sóng, máy rửa chén. Tagline: **"Sửa chuyên nghiệp. Dùng bền lâu."** Mục tiêu của mọi trang là **một cuộc gọi hoặc một lịch hẹn**: khách đang có thiết bị bếp hỏng, cần biết ngay ai sửa, bao giờ đến, giá bao nhiêu, có bảo hành không.

## Logo

- Logo gồm bánh răng cam, chữ KITFIX navy, số 247 cam và tagline navy bên dưới — tất cả trong một ảnh.
- Dùng `assets/Logos/kitfix247-logo-1000.png` cho web (header cao 48px, footer 44px); `kitfix247-logo.png` (1762px) cho in ấn và ảnh lớn.
- Nền ngoài logo trong suốt, nhưng chữ KITFIX và tagline màu navy, nên logo **chỉ đặt trên nền sáng** (`surface`, `surface-raised`). Trên nền `glass` (footer, Hero), đặt logo trong một tấm nền `on-glass` bo `radius-md` — component `Brand` với `onDark` làm việc này.
- Không kéo giãn, không đổi màu, không đổ bóng, không đặt logo lên ảnh.
- Tagline "Sửa chuyên nghiệp. Dùng bền lâu." đã nằm trong ảnh logo — không thêm tagline bằng chữ cạnh logo. Khi viết tagline ở nơi khác (ảnh chia sẻ, tiêu đề phụ), viết đúng nguyên câu.
- Trong văn bản, viết tên là **KitFix247** (chữ K và F hoa, liền số). Tên miền viết thường: kitfix247.com.

## Thông tin liên hệ

Dùng đúng các giá trị này ở mọi nơi (header, Hero, footer, thanh liên hệ, form):

- Hotline: **0989.041.641** — link `tel:0989041641`.
- Địa chỉ: **2 Bạch Đằng, P. Tân Sơn Hòa, TP.HCM**.
- Giờ làm việc: 7:00 – 21:00, cả thứ 7 và chủ nhật.
- Website: kitfix247.com.
- Mã số thuế: chưa có — không hiển thị dòng này cho tới khi có số thật.

## Nội dung và giọng văn

- Viết tiếng Việt có dấu đầy đủ, xưng **"chúng tôi"**, gọi khách là **"anh/chị"**.
- Câu ngắn, nói thẳng kết quả: "Có mặt trong 60 phút", "Kiểm tra miễn phí", "Bảo hành 12 tháng". Không dùng "uy tín số 1", "giá rẻ nhất".
- Gọi đúng tên lỗi khách thấy: "bếp không nhận nồi", "báo lỗi E1", "mặt kính nứt", "quạt kêu to". Mã lỗi viết in hoa, không dấu cách (E1, E4, H2).
- Giá luôn là **khoảng** và luôn có ghi chú "chưa gồm VAT, báo giá chính xác sau khi kiểm tra". Viết số tiền `150.000 ₫`, khoảng giá `150.000 – 450.000 ₫`.
- Số điện thoại viết nhóm `0989.041.641`; link dùng `tel:0989041641`.
- Nhãn nút là động từ: "Gọi ngay", "Đặt lịch sửa", "Xem bảng giá".
- Không dùng emoji. Chỉ đưa con số có thật; chưa có số liệu thì bỏ khối thống kê thay vì bịa.

## Màu sắc

Hai màu của logo: **cam** (`brand` #F57A0A) và **navy** (`glass`, `ink` #0E2843) — cặp cam + navy là nhận diện chính. **Vàng** (`spark` #F2A70E) chỉ là điểm nhấn nhỏ trên nền navy, không có trong logo. Cộng **xanh cam kết** (`trust`) cho bảo hành.

- Nền trang `surface`; thẻ, form, header, dải logo hãng `surface-raised`; section xen kẽ và hàng cam kết `surface-sunken`. Hero, footer và thanh liên hệ dùng nền navy `glass`.
- Chữ `ink`, chữ phụ `ink-muted`. Trên `glass` dùng `on-glass` và `on-glass-muted`.
- `brand` là cam của logo, dùng làm **nền**: nút chính (Gọi ngay, Đặt lịch), số bước quy trình, số liệu Hero, gạch chân mục menu đang xem, mảng màu lớn. Chữ trên nền cam luôn là `on-brand` (navy) — chữ trắng trên cam logo chỉ đạt 2,7:1, không đủ độ tương phản. Hover dùng `brand-hover`.
- Khi cần **chữ màu cam** trên nền sáng (giá tiền, link, hotline) dùng `heat` — tông đậm hơn của cùng màu cam, vì cam logo làm chữ trên nền trắng chỉ đạt 2,7:1.
- `spark` (vàng) chỉ là điểm nhấn nhỏ trên `glass`: chấm sáng, icon trong huy hiệu, vạch gạch trang trí. Không làm chữ trên nền sáng.
- Mỗi màn hình chỉ một nút `brand` nổi bật nhất; hành động thứ hai dùng `secondary` (nền sáng) hoặc `on-dark` (nền `glass`).
- `trust` cho bảo hành, dấu tích, gửi form thành công; nền nhẹ `trust-soft`. `star` cho sao đánh giá. `danger` cho lỗi form, luôn kèm câu chữ.
- `line` là đường kẻ trang trí; viền ô nhập và nút secondary dùng `line-strong`.
- Vòng focus: viền 2px `heat`, cách 2px.

## Chữ

Hai font, cả hai đều có bộ ký tự tiếng Việt đầy đủ trên Google Fonts, hiển thị đúng dấu chồng (ệ, ẩ, ỗ, ữ) mà không bị cắt hay đè dòng:

- **Chakra Petch** (`display`) — tiêu đề. Nét vuông, kỹ thuật, bản nghiêng gần với chữ trong logo. Dùng 600, 700 và 700 nghiêng.
- **Be Vietnam Pro** (`sans`) — nội dung, nút, form. Font do người Việt thiết kế cho tiếng Việt, dễ đọc ở cỡ nhỏ trên điện thoại. Dùng 400, 600, 700, 800.

Nạp từ Google Fonts:
`https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&family=Chakra+Petch:ital,wght@0,600;0,700;1,700&display=swap`

- H1 Hero: `display` (Chakra Petch nghiêng 700). Tiêu đề trang con `h1`, tiêu đề section `h2` (Chakra Petch đứng 700).
- Tiêu đề thẻ `h3`, đoạn dẫn `body-lg`, văn bản `body`, ghi chú `body-sm`, nhãn ô nhập và eyebrow `label` (in hoa) — tất cả Be Vietnam Pro.
- Số liệu Hero dùng `stat` (Chakra Petch nghiêng) với `font-variant-numeric: tabular-nums`.
- Không dùng Chakra Petch cho đoạn văn dài hay chữ dưới 18px.
- Giữ `line-height` ≥ 1.25 cho tiêu đề để dấu trên chữ hoa (Ấ, Ổ, Ữ) không chạm dòng trên.
- Trên màn hình < 640px: `display` hạ xuống cỡ `h1`, `h2` hạ xuống 22px.

## Khoảng cách, bo góc, bố cục

- Thang 4px: `space-1` … `space-8`. Padding thẻ `space-5`; khoảng giữa thẻ `space-4`; padding dọc section `space-7` (mobile) / `space-8` (desktop).
- Nội dung rộng tối đa 1160px, lề hai bên `space-4`.
- Bo góc: ô nhập `radius-sm`, nút và thẻ `radius-md`, Hero và form `radius-lg`, số bước và huy hiệu viên `radius-full`.
- Thẻ phẳng với viền `line`; `shadow-card` chỉ khi hover hoặc cho form đặt lịch. `shadow-bar` chỉ cho thanh liên hệ dính đáy.
- Lưới dịch vụ: 1 cột (mobile), 2 cột (≥640px), 3 cột (≥1024px).
- Vùng chạm tối thiểu 44×44px; nút trên mobile cao 48px.

## Biểu tượng

Bộ icon nét (stroke 1.75px, khung 24×24) có sẵn trong component `Icon`: hành động `phone`, `chat`, `calendar`, `arrow`, `chevron`, `plus`, `pin`, `clock`; thiết bị `burner` (bếp), `hood` (hút mùi), `oven` (lò nướng), `microwave` (lò vi sóng), `dishwasher` (máy rửa chén), `wrench` (lắp đặt); cam kết `check`, `shield`, `star`, `award`, `truck`, `receipt`, `heart`. Icon kế thừa màu chữ (`currentColor`). Không dùng emoji thay icon. Khi cần thêm icon, vẽ theo cùng nét và khung.

## Cấu trúc trang chủ

Thứ tự section, mỗi khối là một component:

1. `SiteHeader` — logo (đã có tagline), menu (Trang chủ, Giới thiệu, Dịch vụ ▾, Bảng giá, Kiến thức, Liên hệ), hotline, nút Đặt lịch.
2. `Hero` — eyebrow, H1 "Sửa chữa – vệ sinh – lắp đặt thiết bị nhà bếp", đoạn dẫn, 2 nút (Gọi ngay + Đặt lịch), `StatBlock`, `TrustBadge`.
3. `BrandStrip` — tên các hãng sửa được (Bosch, Hafele, Teka, Siemens…), dựng bằng chữ một màu.
4. `FeatureRow` — 5 cam kết: kinh nghiệm, linh kiện chính hãng, có mặt nhanh, bảo hành dài hạn, tận tâm.
5. Lưới `ServiceCard` — "Dịch vụ của chúng tôi": bếp từ/hồng ngoại, máy hút mùi (sửa & vệ sinh), lò nướng, lò vi sóng, máy rửa chén, lắp đặt.
6. `ProcessSteps` — Đặt lịch → Kỹ thuật viên đến → Kiểm tra & báo giá → Sửa & bảo hành.
7. `PriceTable` — giá theo nhóm thiết bị, ghi chú VAT.
8. `ReviewCard` + `Rating` — điểm trung bình và 3–4 đánh giá có tên, quận.
9. `ProductCard` — linh kiện, phụ kiện (tùy chọn; trang Linh kiện chỉ còn link ở footer).
10. **Kiến thức & mẹo hay** — 3 `ArticleCard` mới nhất theo ngày, nút `ghost` "Xem tất cả bài viết" dẫn tới /kien-thuc.
11. `BookingForm` — họ tên, SĐT, thiết bị, địa chỉ, mô tả lỗi.
12. `SiteFooter` — logo trên tấm nền sáng, dịch vụ, chính sách bảo hành, địa chỉ, giờ làm việc, thanh toán.
13. `ContactBar` — dính đáy trên mobile: Gọi, Zalo, Đặt lịch.

Trang /kien-thuc: lưới `ArticleCard` 3 cột, lọc theo chuyên mục (Bảng mã lỗi, Mẹo sử dụng, Tư vấn, Khuyến mãi), 9 bài mỗi trang. Bài viết chi tiết: tiêu đề `h1`, thân bài `body` rộng tối đa 720px, cuối bài một khối gọi hotline + nút Đặt lịch.

Hotline và nút Đặt lịch phải nhìn thấy được ở mọi vị trí cuộn: trên desktop qua `SiteHeader`, trên mobile qua `ContactBar`.
