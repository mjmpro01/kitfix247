import { BadRequestException } from '@nestjs/common';

/** Kiểm tra dữ liệu đầu vào cho API admin. Gom lỗi theo trường rồi ném 400 một lần. */
export class Check {
  readonly errors: Record<string, string> = {};
  constructor(private readonly body: Record<string, unknown>) {}

  has(key: string) {
    return this.body[key] !== undefined;
  }

  str(key: string, label: string, opts: { max: number; min?: number; required?: boolean }): string | undefined {
    const v = this.body[key];
    if (v === undefined) {
      if (opts.required) this.errors[key] = `${label} là bắt buộc.`;
      return undefined;
    }
    if (typeof v !== 'string') {
      this.errors[key] = `${label} phải là chữ.`;
      return undefined;
    }
    const s = v.trim();
    if ((opts.required || opts.min) && s.length < (opts.min ?? 1)) this.errors[key] = `${label} là bắt buộc.`;
    else if (s.length > opts.max) this.errors[key] = `${label} tối đa ${opts.max} ký tự.`;
    return s;
  }

  /** Chuỗi cho phép null / rỗng → null. */
  optStr(key: string, label: string, max: number): string | null | undefined {
    const v = this.body[key];
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    const s = this.str(key, label, { max });
    return s === '' ? null : s;
  }

  int(key: string, label: string, opts: { min?: number; max?: number; required?: boolean } = {}): number | undefined {
    const v = this.body[key];
    if (v === undefined || v === null || v === '') {
      if (opts.required) this.errors[key] = `${label} là bắt buộc.`;
      return undefined;
    }
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isInteger(n)) this.errors[key] = `${label} phải là số nguyên.`;
    else if (opts.min !== undefined && n < opts.min) this.errors[key] = `${label} tối thiểu ${opts.min}.`;
    else if (opts.max !== undefined && n > opts.max) this.errors[key] = `${label} tối đa ${opts.max}.`;
    return n;
  }

  bool(key: string, label: string): boolean | undefined {
    const v = this.body[key];
    if (v === undefined) return undefined;
    if (typeof v !== 'boolean') this.errors[key] = `${label} phải là true/false.`;
    return v === true;
  }

  oneOf<T extends string>(key: string, label: string, values: readonly T[], required = false): T | undefined {
    const v = this.body[key];
    if (v === undefined) {
      if (required) this.errors[key] = `${label} là bắt buộc.`;
      return undefined;
    }
    if (typeof v !== 'string' || !values.includes(v as T)) {
      this.errors[key] = `${label} không hợp lệ.`;
      return undefined;
    }
    return v as T;
  }

  strList(key: string, label: string, maxItems: number, maxLen: number): string[] | undefined {
    const v = this.body[key];
    if (v === undefined) return undefined;
    if (!Array.isArray(v) || v.length > maxItems || v.some((x) => typeof x !== 'string' || x.trim().length > maxLen)) {
      this.errors[key] = `${label} không hợp lệ.`;
      return undefined;
    }
    return [...new Set(v.map((x: string) => x.trim()).filter(Boolean))];
  }

  intList(key: string, label: string, maxItems = 500): number[] | undefined {
    const v = this.body[key];
    if (v === undefined) return undefined;
    if (!Array.isArray(v) || v.length > maxItems || v.some((x) => !Number.isInteger(x) || x < 1)) {
      this.errors[key] = `${label} không hợp lệ.`;
      return undefined;
    }
    return [...new Set(v as number[])];
  }

  /** Giá: số nguyên ≥ 0, "giá từ" không lớn hơn "giá đến". */
  priceRange(fromKey = 'priceFrom', toKey = 'priceTo') {
    const from = this.int(fromKey, 'Giá từ', { min: 0, max: 1_000_000_000, required: true });
    const to = this.int(toKey, 'Giá đến', { min: 0, max: 1_000_000_000, required: true });
    if (from !== undefined && to !== undefined && from > to && !this.errors[toKey]) this.errors[toKey] = 'Giá đến phải lớn hơn hoặc bằng giá từ.';
    return { from, to };
  }

  done() {
    if (Object.keys(this.errors).length) throw new BadRequestException({ message: 'Thông tin chưa hợp lệ', errors: this.errors });
  }
}

export const asBody = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Bỏ các khoá undefined để Prisma chỉ cập nhật trường được gửi lên. */
export function defined<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function parseId(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new BadRequestException('Mã không hợp lệ');
  return n;
}
