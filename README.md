# Trọ Ơi — mã nguồn nhóm

Repo này dành cho quá trình nhóm triển khai website Trọ Ơi. [Repo giao diện tham chiếu](https://github.com/lightning09512/Rental-Room-Sharing-Platform) là bản thiết kế để đối chiếu giao diện và luồng sử dụng.

## Cách chia việc

Trước khi bắt đầu, cả nhóm thống nhất một người phụ trách cấu trúc nền (cấu hình, route, layout và thành phần dùng chung). Các thành viên còn lại nhận những khu vực riêng, chẳng hạn:

- Trang công khai: trang chủ, tìm phòng, chi tiết phòng, xác thực.
- Cộng đồng: diễn đàn, hồ sơ công khai, tin nhắn, thông báo.
- Chủ trọ và quản trị: quản lý tin, biểu mẫu, bảng điều khiển.

Ghi tên người phụ trách và danh sách file cụ thể vào từng Issue trước khi làm. Mỗi file chỉ có một người phụ trách tại một thời điểm. Các thay đổi ở file dùng chung cần trao đổi với người phụ trách cấu trúc nền.

## Đưa code lên bằng GitHub Web

1. Mỗi người đăng nhập GitHub bằng tài khoản của mình và nhận lời mời cộng tác.
2. Trên repo này, tạo một branch riêng từ main cho phần việc của mình.
3. Chỉ tải lên hoặc sửa các file mình phụ trách trong branch đó. Mỗi lần hoàn thành một phần có ý nghĩa, chọn Commit changes với nội dung mô tả việc đã làm.
4. Tạo Pull Request vào main. Người tích hợp xem các file thay đổi, kiểm tra giao diện và chức năng rồi mới merge.
5. Sau khi merge, các thành viên tạo branch mới từ main mới nhất cho phần việc tiếp theo.

Dùng giao diện và dữ liệu hiện có làm chuẩn. Không sao chép cùng một bộ source vào nhiều thư mục hoặc commit toàn bộ project dưới nhiều tài khoản chỉ để có lịch sử đóng góp.
