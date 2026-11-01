# Bàn giao giao diện Trọ Ơi — 01/11/2026

## Phạm vi và cách làm

Repo được sửa: `D:\KLTN\Tro-Oi-code`, remote `lightning09512/Tro-Oi`, baseline `d15ccf6`. Kiểm tra remote và tiến trình local trước khi sửa; không sửa bản sao Downloads. Thay đổi vẫn ở working tree, không commit, push hoặc deploy.

Đọc và áp dụng design-taste-frontend, emil-design-eng, ui-styling và mobile-native; dùng diagnosing-bugs cho phiên đăng nhập và code-review cho rà soát cuối. Ba agent chia phạm vi public/member/management; agent chính quản lý component, layout và CSS chung. Rà soát Spec độc lập tìm ra dropdown bị cắt ở viewport thấp; đã sửa và kiểm tra lại. Rà soát Standards đối với thay đổi ngoài phạm vi người viết không phát hiện thêm P1/P2.

## Thiết kế đã áp dụng

Giữ xanh thương hiệu, Be Vietnam Pro và nội dung tiếng Việt. Bố cục công khai để ảnh phòng, giá và tìm kiếm dẫn dắt; màn hình thành viên/quản lý dùng nền xanh xám nhạt, vùng nội dung trắng, đường phân chia nhẹ. Bỏ hero minh họa lớn, số liệu quảng cáo, lời chứng thực, online/xác thực và ưu đãi không có dữ liệu. Bỏ widget nổi và banner tải app không có sản phẩm thật.

Thống nhất button/input, trạng thái chờ/lỗi, focus, dialog/drawer, ảnh dự phòng và khoảng cách. Không cài thư viện, không khôi phục module chuyển nhượng. Quy tắc cuối ghi tại [DESIGN.md](../DESIGN.md).

## Các nhóm màn hình

| Nhóm | Thay đổi và kiểm tra |
| --- | --- |
| Công khai | Trang chủ mới; bộ lọc dùng dữ liệu thật; giữ tìm kiếm, gallery, liên hệ và bản đồ. Kiểm tra home/search/detail tại 360/390/768/1024/1440px. |
| Xác thực | Bố cục gọn, biểu mẫu rõ, chỉ hiện tài khoản demo trong chế độ demo. Kiểm tra đăng nhập, đăng ký, quên/đặt lại mật khẩu và đăng nhập admin tại năm độ rộng. Không gọi gửi OTP thật. |
| Thành viên | Tài khoản, đổi mật khẩu, yêu thích, báo cáo, thông báo, diễn đàn, kết nối, hồ sơ, chat. 45 tổ hợp route/độ rộng đúng trang, không tràn ngang hoặc lỗi React. |
| Chủ trọ | Quản lý tin, biểu mẫu đăng/sửa và thống kê. Kiểm tra bố cục, validation và luồng sửa tin gửi duyệt bằng fixture. |
| Quản trị | Dashboard, người dùng, tin, diễn đàn, danh mục, báo cáo và thống kê. Cùng phần chủ trọ có 50 tổ hợp route/độ rộng đã kiểm tra. |
| Lỗi và thành phần chung | 403/404, loading/empty/error; dropdown khu vực, menu, dialog, drawer, gallery, footer và điều hướng mobile. |

Các route alias dùng chung component được rà soát qua cấu hình route. Luồng xem một bài viết và sửa tin theo ID được kiểm tra riêng bằng fixture; không coi mọi tổ hợp tham số là đã thử.

## Lỗi chức năng đã xử lý

- Admin gọi nhầm favorites gây banner403: bỏ request này theo vai trò ở frontend, giữ kiểm tra quyền server.
- Lỗi503/429 khi xác nhận phiên làm người dùng bị đưa về đăng nhập: ApiRequestError mang status; chỉ401/403 mới xóa phiên. Đã tái hiện trước sửa và kiểm tra503 giữ phiên,401/403 về đăng nhập.
- Diễn đàn360px và tab kết nối làm nở chiều rộng: sửa min-width và responsive.
- Autofocus trong modal tranh focus với hook: bỏ autofocus thừa; avatar/composer/drawer/gallery đóng bằng Escape và trả focus.
- Dropdown ngân sách/diện tích bị cắt khi viewport thấp: chọn phía có chỗ, giới hạn chiều cao còn lại và cuộn menu. Kiểm tra768×320 và360×480.
- Phòng có location=null: chuẩn hóa chuỗi trước xử lý tin tương tự và không render map khi thiếu cả vị trí/tọa độ. Gallery/liên hệ vẫn hoạt động.
- Kiểm tra lỗi tile bằng chặn mạng trong trình duyệt: hiển thị báo lỗi và nút thử lại; thử lại phát sinh request mới, không trắng trang.
- Tin tương tự trên mobile bị hai cột hẹp làm cắt nội dung: đổi thành một cột; kiểm tra360/390/600/768/1024/1440px. Di chuyển nút lưu ảnh để không đè nhãn trạng thái.
- Xóa bình luận admin dùng chung khóa pending, xác nhận và xử lý lỗi; sao chép clipboard chỉ báo thành công sau khi hoàn tất.
- Gỡ các quy tắc !important trong phạm vi avatar tài khoản đang chặn layout mobile, chỉnh contrast logo footer và nút đăng xuất sidebar.

## Luồng đã thử với dữ liệu riêng

13 nhóm API tích hợp đều đạt: đăng nhập ba vai trò,401/403, sở hữu tin, pending/duyệt/từ chối, yêu thích, bài/bình luận/thích, nhắn tin Socket.IO/MongoDB, thông báo và CRUD danh mục. Báo cáo: [ui-api-verification.md](ui-api-verification.md).

Các thao tác qua UI đã xác nhận:

- Chọn giá tìm kiếm cập nhật URL đúng; gallery thumbnail/xem lớn/Escape hoạt động.
- Lưu/bỏ lưu phòng giữ sau tải lại; nhắn tin hỏi phòng mở đúng hội thoại.
- Đăng nhập bằng form; bình luận và thích bài fixture giữ sau tải lại.
- Gửi tin nhắn trên UI; đối chiếu MongoDB có đúng nội dung và chỉ hai người tham gia fixture.
- Chủ trọ sửa tin trên form → pending; admin bấm duyệt → API công khai trả tin active.
- Form tin trống không hợp lệ; dialog tài khoản và drawer admin giữ focus, Escape đóng và trả focus.

Ba tài khoản fixture cùng tin/bài/bình luận/hội thoại/thông báo của chúng đã được dọn theo ID đã ghi. Không seed, truncate, đổi mật khẩu hay xóa dữ liệu người dùng có sẵn. Các bản ghi có trước được đối chiếu khi chạy bộ kiểm tra API; lượt xem/liên hệ có thể tăng bình thường do duyệt web.

## Kết quả cuối

- TypeScript `pnpm exec tsc --noEmit`: đạt.
- `pnpm build`: đạt; còn cảnh báo bundle chính lớn khoảng862kB trước gzip. Không kết luận đã tối ưu xong hiệu năng tải trang.
- `git diff --check`: đạt; Git chỉ nhắc chuẩn hóa LF/CRLF.
- Health local: ready; PostgreSQL và MongoDB kết nối. Web8443 trả200.
- Chromium thật qua CDP, viewport giả lập:360,390,768,1024,1440px. Các lượt thành công không có runtime exception hoặc tràn ngang cấp trang. Đã xem lại ảnh desktop/mobile và sửa lỗi nhìn thấy, bao gồm tin tương tự.
- Inspector thiết kế trên build production1440/768/390 còn một cảnh báo heuristic về số khối trong màn hình đầu desktop; giữ bố cục ảnh/tìm kiếm chủ đích, không thêm khối trang trí để tăng mật độ. Không xem kết quả heuristic này là đạt tuyệt đối.
- Nhiều lượt tải đồng thời từng chạm giới hạn request429; không tăng hoặc bỏ rate limit. Các lượt bị429 không được tính là pass; kiểm tra trọng yếu được chạy lại độc lập hoặc đối chiếu database.

## Giới hạn chưa xác nhận

Chưa chạy gửi OTP/email thật, upload Cloudinary thật, đổi mật khẩu tài khoản có sẵn, kiểm thử tải nhiều người, thiết bị iOS/Android vật lý hoặc bộ đọc màn hình. Không thử mọi nhánh gỡ/xóa/khóa trên UI hoặc mọi chức năng xuất Excel/PDF; API liên quan chỉ được thử trong phạm vi fixture nêu trên. Màn hình hồ sơ/thông báo admin dùng component chung đã được rà soát source nhưng chưa có ảnh riêng cho tất cả biến thể admin. Vì vậy không tuyên bố mọi tính năng đã được kiểm chứng end-to-end.

Không có migration hay cấu hình mới cần chạy. Backend/API và dữ liệu hiện có được giữ; thay đổi xử lý phiên và vai trò nằm ở frontend.

## File chính và ảnh

- Dùng chung: `src/styles/foundation.css`, `src/index.css`, `src/components/common/legacy.tsx`, `src/components/layout/{MainLayout,AdminLayout,SiteFooter}.tsx`, `index.html`.
- Public: `HomePage.tsx`, `RoomDetailPage.tsx`, `RoomMap.tsx`, `public-pages.css`; giữ SearchPage và logic tìm kiếm đang có.
- Member: `AuthShell`, `LoginPage`, `ForumPage`, `MembersPage`, `MessagesPage`, `AccountPage`, `PublicProfilePage`, `member-pages.css`.
- Management: `AdminDashboardPage`, `AdminResourcePage`, `AdminStatsPage`, `MyListingsPage`, `ListingEditorPage`, `LandlordStatsPage`, `management-pages.css`.
- Phiên/quyền: `AuthContext.tsx`, `FavoritesContext.tsx`, `apiClient.ts`.
- Chi tiết nhóm: [public](ui-public-audit.md), [member](ui-member-audit.md), [management](ui-management-audit.md).

Ảnh được lưu tại [screenshots/ui-refinement-2026-11-01](screenshots/ui-refinement-2026-11-01). Ảnh public được chụp sau khi dọn fixture; ảnh tài khoản/thống kê dùng dữ liệu kiểm thử, không chứa mật khẩu/token.

[Trang chủ desktop](screenshots/ui-refinement-2026-11-01/home-1440.jpg) · [Trang chủ mobile](screenshots/ui-refinement-2026-11-01/home-390.jpg) · [Chi tiết desktop](screenshots/ui-refinement-2026-11-01/detail-1440.jpg) · [Chi tiết mobile](screenshots/ui-refinement-2026-11-01/detail-390.jpg) · [Tin tương tự mobile](screenshots/ui-refinement-2026-11-01/similar-390.jpg) · [Diễn đàn](screenshots/ui-refinement-2026-11-01/forum-390.jpg) · [Tài khoản](screenshots/ui-refinement-2026-11-01/account-390.jpg) · [Quản trị](screenshots/ui-refinement-2026-11-01/admin-stats-390.jpg).
