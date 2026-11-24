-- Chuyên mục bài viết thu về 3 mục khớp trang hãng: Sửa chữa, Lỗi, Sản phẩm.
-- Chạy được trên DB đã có dữ liệu: giữ bài, chỉ chuyển chuyên mục.

ALTER TABLE `categories` ADD COLUMN `sort` INTEGER NOT NULL DEFAULT 0;

-- "Bảng mã lỗi" -> "Lỗi" (giữ id nên bài mã lỗi giữ nguyên chuyên mục).
UPDATE `categories` SET `slug` = 'loi', `name` = 'Lỗi' WHERE `slug` = 'bang-ma-loi';

-- Tạo các mục còn thiếu (đã có thì bỏ qua), rồi chốt tên và thứ tự.
INSERT IGNORE INTO `categories` (`slug`, `name`) VALUES ('sua-chua', 'Sửa chữa'), ('loi', 'Lỗi'), ('san-pham', 'Sản phẩm');
UPDATE `categories` SET `name` = 'Sửa chữa', `sort` = 1 WHERE `slug` = 'sua-chua';
UPDATE `categories` SET `name` = 'Lỗi', `sort` = 2 WHERE `slug` = 'loi';
UPDATE `categories` SET `name` = 'Sản phẩm', `sort` = 3 WHERE `slug` = 'san-pham';

-- Bài "Khuyến mãi" -> "Sản phẩm".
UPDATE `posts` p
  JOIN `categories` o ON o.`id` = p.`category_id`
  JOIN `categories` n ON n.`slug` = 'san-pham'
  SET p.`category_id` = n.`id`
  WHERE o.`slug` = 'khuyen-mai';

-- Mọi chuyên mục cũ còn lại ("Mẹo sử dụng", "Tư vấn", …) -> "Sửa chữa".
UPDATE `posts` p
  JOIN `categories` o ON o.`id` = p.`category_id`
  JOIN `categories` n ON n.`slug` = 'sua-chua'
  SET p.`category_id` = n.`id`
  WHERE o.`slug` NOT IN ('sua-chua', 'loi', 'san-pham');

-- Xoá chuyên mục cũ (không còn bài nào trỏ tới).
DELETE FROM `categories` WHERE `slug` NOT IN ('sua-chua', 'loi', 'san-pham');
