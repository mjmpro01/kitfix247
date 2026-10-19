import { CONTENT_PAGES, type ContentPageKey } from '@kitfix/types';

export interface ContentPageInfo {
  key: ContentPageKey;
  path: string;
  title: string;
  description: string;
  /** Tiêu đề khối gọi cuối trang. */
  ctaTitle: string;
  /** Khung mặc định khi admin chưa soạn: [ ... ] = placeholder chờ chủ cung cấp (SPEC mục 9). */
  defaultMd: string;
}

const EXTRA: Record<ContentPageKey, Omit<ContentPageInfo, 'key' | 'path' | 'title'>> = {
  about: {
    description: 'Giới thiệu KitFix247 — sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp tận nhà tại TP.HCM.',
    ctaTitle: 'Cần kiểm tra thiết bị nhà bếp?',
    defaultMd: `[Đoạn mở đầu: KitFix247 là ai, phục vụ ai — chủ cung cấp nội dung thật.]

## Câu chuyện của chúng tôi

[Thời điểm thành lập, người sáng lập, chặng đường phát triển.]

## Đội ngũ kỹ thuật viên

[Số lượng, kinh nghiệm, chứng chỉ, ảnh thật của đội ngũ.]

## Khu vực phục vụ

[Các quận, huyện tại TP.HCM mà chúng tôi nhận lịch.]

## Liên hệ

- Địa chỉ: {{address}}
- Giờ làm: {{hours}}, {{hoursNote}}
- Hotline: {{hotline}}
`,
  },
  warranty: {
    description: 'Chính sách bảo hành sửa chữa, vệ sinh, lắp đặt thiết bị nhà bếp của KitFix247.',
    ctaTitle: 'Cần yêu cầu bảo hành?',
    defaultMd: `[Đoạn mở đầu về chính sách bảo hành — chủ cung cấp nội dung thật.]

## Phạm vi bảo hành

[Hạng mục được bảo hành: linh kiện thay mới, công sửa… và thời hạn từng hạng mục.]

## Trường hợp không được bảo hành

[Các trường hợp từ chối bảo hành.]

## Cách yêu cầu bảo hành

[Quy trình và giấy tờ cần có, ví dụ phiếu bảo hành.]

Hotline: {{hotline}} — {{hours}}, {{hoursNote}}.
`,
  },
  privacy: {
    description: 'Chính sách bảo mật thông tin khách hàng của KitFix247.',
    ctaTitle: 'Cần hỏi thêm về thông tin của anh/chị?',
    defaultMd: `[Đoạn mở đầu về chính sách bảo mật — chủ cung cấp nội dung thật.]

## Thông tin chúng tôi thu thập

[Các thông tin khách điền khi đặt lịch, đặt hàng.]

## Mục đích sử dụng

[Dùng thông tin vào việc gì.]

## Lưu trữ và chia sẻ

[Thời gian lưu, ai được xem, có chia sẻ cho bên thứ ba không.]

## Liên hệ

Hotline: {{hotline}} — {{address}}.
`,
  },
};

export const CONTENT_PAGE_INFO: Record<ContentPageKey, ContentPageInfo> = Object.fromEntries(
  CONTENT_PAGES.map((p) => [p.key, { ...p, ...EXTRA[p.key] }]),
) as Record<ContentPageKey, ContentPageInfo>;
