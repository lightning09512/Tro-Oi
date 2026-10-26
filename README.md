# Trọ Ơi

Trọ Ơi kết nối người thuê phòng với chủ trọ, hỗ trợ tìm phòng, quản lý tin cho thuê, chuyển nhượng phòng, nhắn tin và tham gia cộng đồng.

## Chức năng chính

- Người thuê tìm và lọc phòng, xem chi tiết và bản đồ, lưu tin yêu thích, đánh giá phòng, đăng và quản lý tin chuyển nhượng, nhắn tin, nhận thông báo và tham gia diễn đàn.
- Chủ trọ đăng, sửa và quản lý tin phòng, xem thống kê.
- Quản trị viên quản lý tài khoản, tin cho thuê, tin chuyển nhượng, diễn đàn, danh mục, báo cáo và thống kê.

## Công nghệ

- Giao diện: React 19, TypeScript, Vite, React Router và Tailwind CSS v4.
- API: Node.js, Express, JWT và Socket.IO.
- PostgreSQL/PostGIS lưu tài khoản, tin phòng, tin chuyển nhượng và dữ liệu quan hệ.
- MongoDB lưu cuộc trò chuyện, tin nhắn và thông báo.

## Yêu cầu

- Windows 10/11 hoặc môi trường tương đương.
- Node.js 22 và pnpm 10. Nếu terminal báo không nhận diện lệnh pnpm, cài bằng `npm install --global pnpm@10` rồi mở terminal mới.
- PostgreSQL có PostGIS và extension unaccent.
- MongoDB Server đang chạy. MongoDB Compass là công cụ quản lý giao diện, không thay thế MongoDB Server.
- SMTP để gửi email khôi phục mật khẩu và Cloudinary để bật tải ảnh lên. Hai dịch vụ này không bắt buộc để khởi động project.

## Cài đặt database trên Windows

### 1. Khởi động PostgreSQL và MongoDB

1. Cài PostgreSQL và MongoDB Server nếu máy chưa có.
2. Mở **Start**, tìm **Services**.
3. Tìm dịch vụ PostgreSQL, thường có tên dạng `postgresql-x64-XX`, rồi chọn **Start** nếu chưa chạy.
4. Tìm dịch vụ MongoDB (thường tên MongoDB) và chọn **Start** nếu chưa chạy.

MongoDB Compass chỉ kết nối và xem dữ liệu. Nếu chỉ cài Compass mà chưa cài/chạy MongoDB Server, backend sẽ không kết nối được.

### 2. Đăng ký máy chủ PostgreSQL trong pgAdmin

1. Mở **pgAdmin 4**.
2. Nếu cây bên trái đã có máy chủ PostgreSQL dùng được, mở máy chủ đó và chuyển sang bước 3.
3. Nếu chưa có, nhấn phải **Servers** → **Register** → **Server…**
4. Tab **General**, nhập **Name**: `TroOi Local`.
5. Tab **Connection**, nhập:
   - **Host name/address**: `127.0.0.1`
   - **Port**: `5432`
   - **Maintenance database**: `postgres`
   - **Username**: `postgres`
   - **Password**: mật khẩu PostgreSQL đã đặt khi cài đặt
   - Chọn **Save password** nếu muốn pgAdmin ghi nhớ mật khẩu trên máy này.
6. Nhấn **Save**. Máy chủ sẽ xuất hiện dưới **Servers** nếu kết nối thành công.

### 3. Tạo database trooi

Trong pgAdmin, mở **Servers → TroOi Local**, nhấn phải **Databases** → **Create** → **Database…**

- **Database**: `trooi`
- **Owner**: `postgres`

Nhấn **Save**. Nếu đã có database `trooi`, hãy dùng lại, không tạo database trùng tên.

### 4. Tạo file cấu hình .env

1. Mở thư mục project trong VS Code.
2. Mở terminal từ menu **Terminal → New Terminal** và chuyển tới thư mục gốc project, nơi có `package.json`. Ví dụ:

   ~~~powershell
   cd D:\KLTN\Tro-Oi-code
   ~~~

   Nếu project nằm ở chỗ khác, thay đường dẫn bằng vị trí trên máy của bạn.
3. Tạo file `.env` từ file mẫu:

   ~~~powershell
   Copy-Item .env.example .env
   ~~~

4. Mở `.env` ở thư mục gốc và sửa các giá trị này:

   ~~~ini
   PORT=3001
   NODE_ENV=development
   WEB_ORIGIN=http://localhost:8443
   VITE_DATA_MODE=api
   JWT_SECRET=THAY_BANG_CHUOI_NGAU_NHIEN_DAI_IT_NHAT_32_KY_TU
   JWT_EXPIRES_IN=8h
   DATABASE_URL=postgres://postgres:THAY_BANG_MAT_KHAU_POSTGRES@127.0.0.1:5432/trooi
   MONGODB_URI=mongodb://127.0.0.1:27017/trooi
   ~~~

   Thay THAY_BANG_MAT_KHAU_POSTGRES bằng mật khẩu PostgreSQL của máy đó. Thay JWT_SECRET bằng một chuỗi ngẫu nhiên riêng, tối thiểu 32 ký tự. Không giữ nguyên các chữ hướng dẫn trong ví dụ.

   Nếu mật khẩu PostgreSQL có ký tự đặc biệt như `@`, `:`, `/`, `#` hoặc `?`, hãy URL-encode mật khẩu trong `DATABASE_URL`. Giữ các dòng SMTP và Cloudinary trong file mẫu nếu chưa cấu hình các dịch vụ tùy chọn.

**Không đưa `.env` lên GitHub.** File này chứa mật khẩu và khóa riêng; Git của project đã bỏ qua file đó.

### 5. Cài thư viện và tạo bảng bằng migration

Trong terminal tại thư mục gốc project, chạy:

~~~powershell
pnpm install
pnpm db:migrate
~~~

Migration đọc các file trong `database/migrations/`, tự tạo bảng và ghi lịch sử vào `schema_migrations`. Project hiện có 4 file migration. Không cần mở từng file SQL để tạo bảng thủ công.

Migration đầu tiên bật pgcrypto, PostGIS và unaccent. Nếu báo thiếu PostGIS:

1. Mở **Start**, tìm và mở **Stack Builder**.
2. Chọn đúng phiên bản PostgreSQL đã cài (ví dụ PostgreSQL 18 x64 trên cổng 5432) → **Next**.
3. Mở nhóm **Spatial Extensions**, chọn gói PostGIS tương thích và hoàn tất cài đặt.
4. Chạy lại pnpm db:migrate.

Có thể xem hướng dẫn cài đặt trong [tài liệu PostGIS cho Windows](https://postgis.net/documentation/getting_started/install_windows/).

Để nạp dữ liệu phát triển tùy chọn, đặt `SEED_PASSWORD` (ít nhất 12 ký tự) trong `.env` theo chú thích ở `.env.example`, rồi chạy:

~~~powershell
pnpm db:seed
~~~

Seed dùng MongoDB và chỉ dành cho dữ liệu phát triển. Không cần chạy seed để tạo cấu trúc bảng.

### 6. Kết nối MongoDB Compass

1. Mở MongoDB Compass và nhấn **Add new connection**.
2. Nhập địa chỉ:

   ~~~text
   mongodb://127.0.0.1:27017/trooi
   ~~~

3. Nhấn **Connect**.

Database và các collection được ứng dụng tạo khi có dữ liệu ghi lần đầu. Các collection của project gồm `conversations` và `notifications`.

## Chạy website và backend

Từ thư mục gốc project, chạy:

~~~powershell
pnpm dev:all
~~~

Mở website tại [http://localhost:8443](http://localhost:8443). API chạy tại cổng 3001; Vite chuyển tiếp các yêu cầu /api và /socket.io đến API.

`pnpm dev` hoặc `npm run dev` chỉ chạy giao diện, không khởi động backend. Nếu giao diện đã chạy riêng, mở terminal thứ hai tại thư mục gốc và chạy:

~~~powershell
pnpm dev:api
~~~

Giữ terminal chạy backend mở trong lúc sử dụng website. Nếu báo cổng `8443` đang được dùng, Vite có thể đã chạy; không khởi động thêm một bản giao diện trên cùng cổng.

## Chế độ demo

Với `VITE_DATA_MODE=api`, giao diện lấy dữ liệu từ backend và dùng PostgreSQL cùng MongoDB. Để mở giao diện demo, đổi giá trị thành `VITE_DATA_MODE=demo` rồi khởi động lại Vite. Chế độ demo lưu các thay đổi được hỗ trợ trong trình duyệt; dữ liệu này không thay thế database backend.

## Kiểm tra kết nối và bảng

Mở [http://localhost:3001/api/health](http://localhost:3001/api/health). Khi cấu hình đúng, phản hồi có dạng:

~~~json
{
  "status": "ready",
  "databases": {
    "postgres": "connected",
    "mongo": "connected"
  }
}
~~~

Trong pgAdmin, xem bảng tại **Servers → TroOi Local → Databases → trooi → Schemas → public → Tables**. Nếu chưa thấy bảng, nhấn phải **Tables** → **Refresh**.

Để xem các migration đã áp dụng, nhấn phải database `trooi` → **Query Tool**, nhập truy vấn rồi nhấn **F5**:

~~~sql
SELECT name, applied_at
FROM schema_migrations
ORDER BY name;
~~~

Nếu trang báo `502` hoặc “Chưa đồng bộ với máy chủ”, hãy kiểm tra backend đã chạy ở cổng `3001` chưa. Có thể mở terminal thứ hai và chạy `pnpm dev:api`.

> Không chạy `DROP SCHEMA public CASCADE` trên database project. Lệnh đó xóa toàn bộ bảng và dữ liệu trong schema public.

## Tạo tài khoản quản trị

Sau khi migration hoàn tất, chạy lệnh sau nếu cần tạo tài khoản quản trị đầu tiên:

~~~powershell
pnpm admin:create
~~~

## Build

~~~powershell
pnpm build
~~~
