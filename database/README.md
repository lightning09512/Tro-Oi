# Database Trọ Ơi

Project dùng hai dịch vụ database độc lập với frontend:

- PostgreSQL/PostGIS: tài khoản, vai trò, quyền hạn, vị trí, tiện ích, tin phòng, ảnh, diễn đàn, yêu thích, đánh giá, báo cáo, cảnh báo và tương tác phòng. Bảng `transfers` là dữ liệu cũ được giữ lại để tương thích, không còn được dùng bởi ứng dụng.
- MongoDB: thông báo, cuộc hội thoại và tin nhắn.

## Khởi tạo

1. Tạo database và tài khoản ứng dụng PostgreSQL; tạo database MongoDB theo `MONGODB_URI`.
2. Kết nối database PostgreSQL bằng tài khoản quản trị `postgres` và bật PostGIS một lần:

   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

   Extension cần quyền quản trị. Sau đó dùng tài khoản ứng dụng trong `DATABASE_URL` để chạy migration.
3. Tạo `.env` từ `.env.example` và điền `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`.
4. Đặt `VITE_DATA_MODE=api`.
5. Chạy `pnpm db:setup` để áp dụng migration và nạp dữ liệu phát triển.
6. Nếu cần dữ liệu phòng có nguồn, chạy `pnpm db:import-tromoi`. Để thêm đợt dữ liệu mới, chạy `pnpm db:download-tromoi-expansion` rồi `pnpm db:import-tromoi-expansion`.
7. Chạy API bằng `pnpm dev:api`.

Migration chỉ tạo hoặc nâng cấp cấu trúc. `database/seed.js` nạp tài khoản phát triển và một số dữ liệu MongoDB. Seed không tạo tin cho thuê, tin chuyển nhượng hoặc bài diễn đàn mẫu.

`database/import-tromoi-listings.js` giữ bộ nhập đầu tiên. Bộ mở rộng `database/tromoi-expansion-data.js` thêm 19 tin Trọ Mới với 81 ảnh từ album riêng của từng tin. API hiện trả 33 tin đang hiển thị và 143 ảnh trong các album: 12 căn hộ, 3 căn hộ mini, 8 phòng trọ, 3 ký túc xá, 3 nhà nguyên căn và 4 tin ở ghép. Các tin được phân bố tại TP. Hồ Chí Minh, Hà Nội và Đà Nẵng. Liên kết nguồn lưu nội bộ; giao diện công khai không điều hướng người thuê sang website khác. Xem [docs/tromoi-data-sources.md](../docs/tromoi-data-sources.md).

Seed và import có thể chạy lại. Import mở rộng dùng `ON CONFLICT DO NOTHING`, chỉ thêm mã tin chưa tồn tại và không ghi đè hoặc xóa dữ liệu đang có. Nếu album đã có trong checkout thì có thể bỏ qua bước tải ảnh.
