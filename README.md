# Trọ Ơi

Trọ Ơi kết nối người thuê phòng với chủ trọ, hỗ trợ tìm phòng, quản lý tin cho thuê, chuyển nhượng phòng, trao đổi tin nhắn và tham gia cộng đồng.

## Chức năng chính

- Người thuê có thể tìm/lọc phòng, xem chi tiết và bản đồ, lưu tin yêu thích, đánh giá phòng, đăng và quản lý tin chuyển nhượng, nhắn tin, nhận thông báo và tham gia diễn đàn.
- Chủ trọ có thể đăng, sửa, quản lý tin phòng và xem thống kê.
- Quản trị viên có thể quản lý tài khoản, tin cho thuê, tin chuyển nhượng, diễn đàn, danh mục, báo cáo và thống kê.

## Công nghệ và dữ liệu

- Giao diện: React 19, TypeScript, Vite, React Router và Tailwind CSS v4.
- API: Node.js, Express, JWT, Socket.IO.
- PostgreSQL/PostGIS lưu tài khoản, tin phòng, tin chuyển nhượng, danh mục, yêu thích, đánh giá, báo cáo và các dữ liệu quan hệ.
- MongoDB lưu cuộc trò chuyện, tin nhắn và thông báo.

## Yêu cầu môi trường

- Node.js và pnpm (phiên bản pnpm được khai báo trong `package.json`).
- PostgreSQL có extension PostGIS và `unaccent`.
- MongoDB.
- SMTP để gửi email khôi phục mật khẩu; Cloudinary để bật tải ảnh lên. Đây là cấu hình tùy chọn cho các chức năng tương ứng.

## Cài đặt và chạy

1. Cài dependencies:

   ```powershell
   pnpm install
   ```

2. Tạo `.env` từ `.env.example` rồi cấu hình tối thiểu `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET` (ít nhất 32 ký tự) và `WEB_ORIGIN`. Đặt `VITE_DATA_MODE=api` để giao diện dùng backend. Không đưa `.env` hoặc thông tin đăng nhập thật lên GitHub.

3. Tạo database PostgreSQL và MongoDB. Tài khoản chạy migration cần quyền tạo các extension PostgreSQL được liệt kê bên dưới. Nếu tài khoản ứng dụng không có quyền này, quản trị viên PostgreSQL có thể bật chúng một lần:

   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS unaccent;
   ```

4. Áp dụng migration và nạp bộ dữ liệu phát triển:

   ```powershell
   pnpm db:setup
   ```

   Chỉ chạy migration, không nạp dữ liệu mẫu:

   ```powershell
   pnpm db:migrate
   ```

5. Tạo tài khoản quản trị đầu tiên:

   ```powershell
   pnpm admin:create
   ```

6. Chạy giao diện và API cùng lúc:

   ```powershell
   pnpm dev:all
   ```

   Có thể chạy riêng bằng `pnpm dev` và `pnpm dev:api`. Vite mặc định dùng cổng 8443; API mặc định dùng cổng 3001. Vite chuyển tiếp `/api` và `/socket.io` tới API. Kiểm tra tình trạng máy chủ tại `/api/health`.

## Chế độ demo

Khi `VITE_DATA_MODE` không bằng `api`, ứng dụng dùng dữ liệu demo và lưu các thay đổi hỗ trợ trên trình duyệt để còn sau khi tải lại trang. Chế độ demo không thay thế PostgreSQL/MongoDB khi cần kiểm tra backend thật.

## Migration và dữ liệu mẫu

Các migration nằm trong `database/migrations/`. `pnpm db:migrate` áp dụng migration chưa chạy theo thứ tự tên file và ghi nhận trong `schema_migrations`. Bảng `transfers` là mô hình riêng cho tin chuyển nhượng; nội dung diễn đàn không được dùng làm tin chuyển nhượng. `pnpm db:seed` nạp dữ liệu phát triển một cách có thể chạy lại và không xóa dữ liệu do người dùng tạo.

## Build

```powershell
pnpm build
pnpm preview
```
