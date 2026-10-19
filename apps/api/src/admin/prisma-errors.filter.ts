import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

/** Đổi lỗi Prisma hay gặp thành HTTP dễ hiểu: trùng khoá → 409, không tìm thấy → 404, vướng khoá ngoại → 400. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorsFilter extends BaseExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const map: Record<string, () => Error> = {
      P2002: () => {
        // Trùng khoá unique: gắn lỗi vào trường để form hiện ngay dưới ô nhập.
        const target = String(e.meta?.target ?? '');
        const field = /slug/.test(target) ? 'slug' : /email/.test(target) ? 'email' : /sku/.test(target) ? 'sku' : undefined;
        const msg = field === 'slug' ? 'Đường dẫn này đã được dùng, anh/chị chọn đường dẫn khác.' : 'Giá trị đã tồn tại.';
        return new ConflictException({ message: msg, ...(field ? { errors: { [field]: msg } } : {}) });
      },
      P2025: () => new NotFoundException('Không tìm thấy bản ghi'),
      P2003: () => new BadRequestException('Dữ liệu liên quan không tồn tại hoặc đang được dùng.'),
    };
    const mapped = map[e.code];
    super.catch(mapped ? mapped() : e, host);
  }
}
