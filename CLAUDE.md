# KitFix247 — hướng dẫn cho Claude Code

Dự án: website + admin cho KitFix247 (sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà, TP.HCM).
Đặc tả đầy đủ: `SPEC.md`. Đọc nó trước khi làm bất cứ việc gì.

## Stack
- `apps/web`: Next.js 15 App Router, TypeScript, React Server Components; site công khai + `/admin`
- `apps/api`: NestJS, TypeScript, MySQL 8 (Prisma), JWT cho admin
- `packages/ui`: component dùng chung; `packages/types`: DTO dùng chung web ↔ api

## Nguồn thiết kế
- `design/screens/*.dc.html` — mã nguồn từng artboard (HTML + inline style + một class `Component` sinh dữ liệu mẫu trong `renderVals()`).
  Đọc như bản vẽ: lấy cấu trúc, khoảng cách, màu, chữ và hành vi; KHÔNG copy runtime `<x-dc>`, `<sc-for>`, `<sc-if>`, `{{...}}`, `support.js`.
  `{{x}}` là giá trị lấy từ `renderVals()` ở cuối mỗi file; `<sc-for>` = map danh sách; `<sc-if>` = điều kiện; `<dc-import name="X">` = dùng component X.
- `design/tokens.json`, `design/DESIGN-SYSTEM.md` — token và quy tắc thương hiệu. Bắt buộc tuân theo, đặc biệt:
  chữ trên nền cam `#f57a0a` luôn navy `#0e2843`; chữ cam trên nền sáng dùng `#b85200`; không emoji; không bịa số liệu.
- `design/assets/` — logo KitFix247 và banner hero.

## Quy ước
- Tiếng Việt có dấu đầy đủ trong UI; xưng "chúng tôi", gọi khách "anh/chị".
- Hotline, Zalo, địa chỉ, giờ làm, cam kết đọc từ API `/settings`, không hard-code.
- Giá luôn là khoảng `150.000 – 450.000 ₫` kèm ghi chú "chưa gồm VAT, báo giá chính xác sau khi kiểm tra".
- Không vẽ/nhúng logo của hãng khác (Bosch, Teka…) — chỉ hiển thị file do admin tải lên; chưa có thì hiện tên bằng chữ.
- A11y: `<button>`/`<a>` thật, label cho mọi input, vùng chạm ≥44px, focus 2px `#b85200`.
- Responsive theo container/breakpoint trong SPEC mục 4; đối chiếu `design/screens/Mobile-*.dc.html`.

## Lệnh (thiết lập khi scaffold)
- `pnpm dev` (web + api), `pnpm test`, `pnpm lint`, `pnpm db:migrate`, `pnpm db:seed`
