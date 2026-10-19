import { BadRequestException, Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomBytes } from 'node:crypto';
import { UPLOAD_MAX_BYTES, type UploadResult } from '@kitfix/types';
import { FileStorage } from './storage';

export const MAX_UPLOAD_BYTES = UPLOAD_MAX_BYTES;
export const MIN_LOGO_HEIGHT = 80;

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/svg+xml': 'svg', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const FOLDERS = ['brands', 'posts', 'products', 'hero', 'services'] as const;

/** Đọc chiều cao ảnh PNG từ header IHDR (byte 20–23). */
export function pngHeight(buf: Buffer): number | null {
  const sig = buf.subarray(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a' || buf.length < 24) return null;
  return buf.readUInt32BE(20);
}

/** Nhận diện kiểu thật theo nội dung, không tin Content-Type do trình duyệt gửi. */
export function sniffType(buf: Buffer): string | null {
  if (buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  const head = buf.subarray(0, 512).toString('utf8').trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'image/svg+xml';
  return null;
}

@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly storage: FileStorage) {}

  /** multipart/form-data, trường `file`; `?folder=brands|posts|products|hero|services`. Logo PNG phải cao ≥ 80px. */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Query('folder') folder?: string): Promise<UploadResult> {
    if (!file?.buffer?.length) throw new BadRequestException('Chưa chọn file');
    const dir = FOLDERS.find((f) => f === folder) ?? 'posts';
    const type = sniffType(file.buffer);
    if (!type || !TYPES[type]) throw new BadRequestException('Chỉ nhận ảnh PNG, SVG, JPG hoặc WebP');
    if (dir === 'brands') {
      if (type !== 'image/png' && type !== 'image/svg+xml') throw new BadRequestException('Logo cần là PNG hoặc SVG nền trong suốt');
      const h = type === 'image/png' ? pngHeight(file.buffer) : null;
      if (h !== null && h < MIN_LOGO_HEIGHT) throw new BadRequestException(`Logo cao ${h}px — cần tối thiểu ${MIN_LOGO_HEIGHT}px`);
    }
    const now = new Date();
    const key = `${dir}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomBytes(8).toString('hex')}.${TYPES[type]}`;
    const url = await this.storage.put(key, file.buffer, type);
    return { url, key, contentType: type, size: file.size };
  }
}
