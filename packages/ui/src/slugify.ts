/** Tạo slug từ tiếng Việt: bỏ dấu, đ→d, chữ thường, nối bằng "-". */
export function slugifyVi(input: string): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
