# Kiểm tra tích hợp API Trọ Ơi bằng dữ liệu tạm

Thời điểm: 2026-10-31T21:20:34.844Z

Script chỉ cho phép chạy khi cả DATABASE_URL và MONGODB_URI có hostname loopback. Không ghi token, thông tin kết nối hoặc bí mật vào báo cáo.

| Kiểm tra | Kết quả |
| --- | --- |
| Tạo 3 tài khoản fixture mới với BCrypt; không sửa tài khoản có sẵn | PASS |
| Đăng nhập và tải /auth/me cho cả người thuê/chủ trọ/admin | PASS |
| 401 khi thiếu token; 403 khi người thuê/chủ trọ gọi API admin | PASS |
| Người thuê không được tạo tin; chủ trọ tạo tin pending với 2 ảnh | PASS |
| Tin pending không công khai, không tự duyệt; người khác không được sửa/xóa | PASS |
| Admin duyệt -> công khai; chủ sửa -> pending; từ chối -> ẩn; duyệt lại -> active | PASS |
| Lưu yêu thích và tải lại danh sách từ database | PASS |
| Đăng bài có ảnh, bình luận, lượt thích và kiểm tra quyền sở hữu | PASS |
| Tạo hội thoại gắn tin phòng và gửi/nhận tin realtime Socket.IO | PASS |
| Người nhận tải tin từ MongoDB, đánh dấu đã đọc và tắt thông báo | PASS |
| Quyết định kiểm duyệt gửi thông báo cho đúng chủ tin | PASS |
| Admin tạo/sửa/xóa danh mục fixture; người thuê bị từ chối | PASS |
| Giữ nguyên bản ghi có sẵn trong PostgreSQL và cuộc trò chuyện MongoDB | PASS |

Các fixture được đánh dấu [KIỂM TRA], dùng email @ui-review.invalid và mật khẩu chỉ dành cho kiểm thử. ID và thông tin đăng nhập tạm nằm trong .tmp/ui-fixtures.json đã được Git bỏ qua. Không gửi email/OTP, không tải ảnh ra cloud, không thay đổi mật khẩu người dùng.

Không thực hiện seed, truncate hoặc xóa dữ liệu sẵn có. Các bảng users/listings/forum_posts/categories được đối chiếu chữ ký từng bản ghi có trước đợt kiểm tra; bỏ qua lượt xem/liên hệ và updated_at do có thể tăng trong lúc người dùng duyệt web.

Để dọn fixture sau khi đã xem giao diện: `node .tmp/verify-ui-api.mjs --cleanup`. Cleanup xác nhận lại loopback, đối chiếu ID/email fixture, chỉ xóa user và bản ghi phụ thuộc thuộc các ID đã ghi, cùng conversation/notification dành riêng fixture.

Fixture đã được dùng cho kiểm tra trình duyệt và đã cleanup sau khi hoàn tất. Đã kiểm tra hội thoại realtime giữa HTTP API và Socket.IO thực, sau đó tải lại từ MongoDB. Luồng OTP/email và upload Cloudinary không được gọi vì có tác động bên ngoài.

Fixture đã được dọn tại 2026-11-01T07:30:47.541Z.
