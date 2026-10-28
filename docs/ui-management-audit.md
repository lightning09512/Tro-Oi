# Rà soát giao diện chủ trọ và quản trị

Phạm vi: repo `D:\KLTN\Tro-Oi-code`, giao diện chạy cổng 8443. Giữ nghiệp vụ và nguồn dữ liệu API hiện có; không tạo/xóa dữ liệu khi rà soát. CSS mới nằm trong `src/styles/management-pages.css`, được agent chính nạp sau CSS dùng chung.

## Các màn hình

| Route | Mục đích và vấn đề trước khi sửa | Thay đổi |
| --- | --- | --- |
| `/chu-tro/quan-ly-tin` | Quản lý tin, nhiều thao tác nhỏ; thiếu khóa thao tác khi chờ API, tìm kiếm chưa có tên truy cập, có thể báo rỗng khi đang tải | Card ảnh/thông tin rõ ràng; thao tác tách hàng, responsive; loading/error riêng; khóa thao tác khi lưu/xóa; tìm không có kết quả cho phép xóa bộ lọc; dialog chọn người thuê có focus trap/Escape/khôi phục focus |
| `/chu-tro/dang-tin` | Biểu mẫu 4 phần; giá nhập triệu nhưng chuỗi hiển thị demo lại gắn `đ` trực tiếp; có thể gửi lặp; upload có thể chạy đồng thời | Đơn vị nhập và giá quy đổi rõ ràng; chuỗi giá nhân 1.000.000; khóa submit/upload; required/min/max/độ dài khớp API; số điện thoại hợp lệ; không tự tích sẵn tiện ích; ảnh đã tải thành công được giữ nếu ảnh kế tiếp lỗi; một nút chọn tệp truy cập được bằng bàn phím |
| `/chu-tro/tin/:id/chinh-sua` | ID không tồn tại/không thuộc chủ tin có thể mở biểu mẫu tạo mới; tin đã thuê vẫn cho sửa rồi server từ chối | Chờ dữ liệu trước khi quyết định; thông báo không thể sửa ID không hợp lệ, hướng về danh sách; tin đang thuê được hướng dẫn đổi trạng thái; lưu chỉnh sửa giải thích rõ việc gửi duyệt lại |
| `/chu-tro/thong-ke` | Số liệu thực nhưng bar tối thiểu 4% khiến lượt xem 0 vẫn trông như có hoạt động; layout nén trên điện thoại | Số liệu tabular rõ ràng, loading/error không giả 0; bar 0 có độ dài 0; biểu đồ/danh sách co về một cột đọc được |
| `/admin` | Tổng quan, dữ liệu thật nhưng tiêu đề phụ/đánh số trang trí và task dài | Heading hành động rõ; metric liên kết thật; công việc có icon nghiệp vụ, nội dung dài giới hạn 2 dòng; loading/error phân biệt với rỗng; hai vùng công việc/nội dung co một cột |
| `/admin/nguoi-dung` | Tìm, tạo/sửa/khóa/xóa tài khoản; thiếu khóa gửi và thiếu lỗi cho một số request | Bộ lọc đúng trạng thái tài khoản; tên tìm kiếm truy cập được; disabled khi API xử lý; lỗi lưu hiển thị; quyền quan trọng vẫn do API kiểm tra |
| `/admin/tin-cho-thue` | Kiểm duyệt tin, tất cả loại trạng thái dùng chung kể cả trạng thái không có trong nghiệp vụ | Bộ lọc pending/active/hidden/rented/rejected; ảnh–nội dung–thao tác có phân cấp; async duyệt/ẩn/gỡ được chờ và bắt lỗi; khóa thao tác lặp |
| `/admin/dien-dan` | Ẩn/hiện/xóa bài và bình luận, một số Promise không được bắt lỗi | Hiển thị nội dung dễ đọc, bộ lọc trạng thái đúng; bắt lỗi thao tác bài/bình luận; bài pending có hành động duyệt thay vì chỉ ẩn; điều khiển tối thiểu 44px |
| `/admin/danh-muc` | Tạo/sửa/ẩn/xóa danh mục; lỗi save có thể không hiện | Bắt lỗi lưu danh mục và cập nhật/xóa; ngăn gửi lặp; chỉ lọc active/hidden |
| `/admin/bao-cao` | Xử lý báo cáo, kết quả accepted/rejected đều bị gộp thành reviewed trong danh sách | Giữ kết quả thực để lọc/chẩn đoán; xác nhận từ chối gọi đúng hành động; yêu cầu nội dung khi chọn gửi cảnh báo; dialog xử lý có focus trap và trạng thái chờ |
| `/admin/thong-ke` | Khoảng thời gian/xuất Excel/PDF; chưa phân biệt tải dữ liệu với con số 0; thiếu feedback lúc xuất, bar 0 có độ dài giả | Chỉ số chưa có dữ liệu dùng dấu gạch; export khóa trong khi tải/xuất và có nhãn chờ; lỗi có nút thử lại; chart có trạng thái rỗng và độ dài 0 đúng; layout export/charts đáp ứng màn hình nhỏ |

## Quy ước giao diện áp dụng

- Giữ xanh `#2f7a4b`, xanh đậm `#245f3b`, nền trắng/xanh rất nhạt, chữ `#27362c`.
- Dùng Be Vietnam Pro; tiêu đề 25–34px, nhãn và hỗ trợ 12–14px. Chỉ số tabular giúp đọc so sánh.
- Surface bo 12–16px, viền nhẹ, bỏ lớp bóng/card lồng không cần thiết. Toolbar và action có nhóm rõ ràng.
- Grid metric 4 cột → 2 cột; danh sách, biểu mẫu và báo cáo co về một cột hoặc hai vùng rõ ràng trên điện thoại.
- Focus, disabled, loading/error và empty có nội dung thực tế. Giảm chuyển động theo `prefers-reduced-motion`.

## Kiểm tra và giới hạn

- TypeScript (`pnpm exec tsc --noEmit`) đã qua sau khi ghép các sửa đổi của nhóm ở thời điểm kiểm tra; `git diff --check` trên các trang quản trị/chủ trọ không có lỗi khoảng trắng. Agent chính chạy build và kiểm tra cuối sau khi ghép.
- API local: `/api/health` trả 200 `ready`, PostgreSQL/MongoDB connected.
- Không đăng nhập: `/api/listings/mine`, `/api/admin/stats`, `/api/admin/users` đều trả 401, không lộ dữ liệu quản trị.
- Không gửi OTP, không đổi mật khẩu, không thêm/xóa dữ liệu hoặc thực hiện kiểm duyệt trên dữ liệu hiện có trong đợt rà soát này.
- Chưa tự xác nhận end-to-end tạo tin → duyệt, báo cáo → gửi cảnh báo, export file và upload thực; cần phiên đăng nhập đúng vai trò và dữ liệu dùng để thử. Agent chính kiểm tra trình duyệt/responsive sau khi nạp stylesheet và ghi kết quả chung.
