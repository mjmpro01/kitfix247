import { Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { FileStorage } from './storage';

/** Thư mục lưu và URL công khai — đổi bằng UPLOAD_DIR, PUBLIC_UPLOAD_URL. */
export const uploadDir = () => resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
export const publicUploadUrl = () =>
  (process.env.PUBLIC_UPLOAD_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}/uploads`).replace(/\/$/, '');

@Injectable()
export class LocalDiskStorage extends FileStorage {
  private path(key: string) {
    const root = uploadDir();
    const p = resolve(root, key);
    if (!p.startsWith(root + sep)) throw new Error('Khoá file không hợp lệ');
    return p;
  }

  async put(key: string, body: Buffer): Promise<string> {
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, body);
    return `${publicUploadUrl()}/${key}`;
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }
}
