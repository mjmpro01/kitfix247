/**
 * Nơi lưu file tải lên (logo hãng, ảnh bài viết). Bản đầu ghi ra đĩa local;
 * khi lên S3-compatible hoặc Azure Blob chỉ cần viết lớp mới cài interface này và đổi provider trong AdminModule.
 */
export abstract class FileStorage {
  /** Lưu file, trả về URL công khai. `key` dạng "brands/2026/10/abc.png". */
  abstract put(key: string, body: Buffer, contentType: string): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
