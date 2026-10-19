import { UPLOAD_MAX_BYTES, type UploadResult } from '@kitfix/types';
import { uploadFile } from '@/app/admin/actions';
import type { ActionResult } from '@/lib/admin/result';

export type UploadFolder = 'brands' | 'posts' | 'products' | 'hero' | 'services';

const mb = (n: number) => (n / 1024 / 1024).toFixed(1).replace('.', ',');

/**
 * Tải ảnh lên qua server action, dùng chung cho mọi màn admin.
 * Báo lỗi ngay khi ảnh quá lớn (không gửi đi), và không bao giờ ném lỗi — nút "Đang tải…" luôn được trả lại.
 */
export async function uploadImage(file: File, folder: UploadFolder): Promise<ActionResult<UploadResult>> {
  if (file.size > UPLOAD_MAX_BYTES) {
    return { ok: false, error: `Ảnh ${mb(file.size)} MB — tối đa ${mb(UPLOAD_MAX_BYTES)} MB. Anh/chị giảm kích thước ảnh (vd lưu JPG chất lượng 80%) rồi tải lại.` };
  }
  const fd = new FormData();
  fd.set('file', file);
  fd.set('folder', folder);
  try {
    return await uploadFile(fd);
  } catch {
    return { ok: false, error: 'Không tải được ảnh do lỗi kết nối. Anh/chị thử lại sau ít phút.' };
  }
}
