# Trọ Ơi

Trọ Ơi là nền tảng kết nối người thuê phòng với chủ trọ. Dự án hướng tới việc giúp người thuê tìm nơi ở phù hợp, trao đổi thông tin và tham gia cộng đồng; đồng thời hỗ trợ chủ trọ quản lý tin đăng và quản trị viên kiểm duyệt nội dung.

## Mục tiêu và chức năng

- **Người thuê:** tìm phòng theo khu vực, giá và diện tích; xem chi tiết phòng; lưu tin yêu thích; đánh giá phòng; đăng và quản lý tin chuyển nhượng; nhắn tin, nhận thông báo và tham gia diễn đàn.
- **Chủ trọ:** đăng, chỉnh sửa và quản lý tin cho thuê; theo dõi thống kê tin đăng.
- **Quản trị viên:** quản lý người dùng, tin cho thuê, bài viết, danh mục, báo cáo và thống kê.

## Công nghệ

- React 19, TypeScript, Vite và React Router.
- Tailwind CSS v4 cho giao diện responsive.
- pnpm để quản lý dependencies và chạy các lệnh phát triển.

## Hiện trạng

Nhánh `main` hiện có khung giao diện, điều hướng, bố cục dùng chung và các route cho những luồng chính. Một số route vẫn hiển thị trang tạm. Các module API và migration database mới ở mức một phần, chưa tạo thành backend được tích hợp đầy đủ với ứng dụng. README mô tả mục tiêu sản phẩm và trạng thái mã nguồn hiện có.

## Chạy dự án

Yêu cầu Node.js và pnpm.

```powershell
pnpm install
pnpm dev
```

Vite sẽ in địa chỉ xem trước trong terminal. Kiểm tra bản dựng production bằng:

```powershell
pnpm build
pnpm preview
```

## Cấu trúc màn hình

- **Công khai:** trang chủ, tìm phòng, chi tiết phòng, diễn đàn và hồ sơ công khai.
- **Tài khoản:** đăng nhập, đăng ký, khôi phục mật khẩu, hồ sơ, tin yêu thích, tin nhắn và thông báo.
- **Chủ trọ:** quản lý tin, đăng/sửa tin và thống kê.
- **Quản trị:** tổng quan, quản lý người dùng, tin cho thuê, bài viết, danh mục, báo cáo và thống kê.

Các chức năng sẽ được hoàn thiện theo use case và cập nhật trạng thái triển khai trong quá trình phát triển.
