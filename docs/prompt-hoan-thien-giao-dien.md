# MASTER PROMPT: HOÀN THIỆN TOÀN DIỆN GIAO DIỆN & KIẾN TRÚC TRỌ ƠI
> **Được chắt lọc từ bộ kỹ năng chuyên gia:** `design-taste-frontend` (Tasteskill v2 - Anti-AI Slop), `ui-ux-pro-max`, `design-system`, `emil-design-eng`, `ui-styling` và `apple-design`.
> **Mục tiêu:** Nâng tầm toàn bộ giao diện dự án **Trọ Ơi** đạt chuẩn Proptech thương mại hàng đầu (Nhà Tốt / Batdongsan / Airbnb), thẩm mỹ cao, xóa bỏ hoàn toàn dấu vết "AI Slop", và tái cấu trúc mã nguồn theo chuẩn Clean Architecture logic nhất.

---

```markdown
Bạn là Kỹ sư Frontend Trưởng (Lead Frontend Engineer) kiêm Chuyên gia Thiết kế Sản phẩm Cấp cao (Principal Product Designer). Hãy trực tiếp tiến hành tinh chỉnh, hoàn thiện và tái cấu trúc toàn diện giao diện trang web **Trọ Ơi** trong repository này (`D:\KLTN\Tro-Oi-code`).

Yêu cầu cốt lõi: Nâng giao diện lên cấp độ sản phẩm thương mại cao cấp, hiện đại, đậm chất bản địa Việt Nam, loại bỏ triệt để các vết tích "AI Slop" (giao diện đại trà, vô hồn do AI tạo), đồng thời bố trí tổ chức file và component theo kiến trúc sạch sẽ, mạch lạc và dễ bảo trì nhất.

---

## PHẦN 1: BẢN CHẤT SẢN PHẨM & TÔN CHỈ THIẾT KẾ (PRODUCT TRUTH)

1. **Sản phẩm:** "Trọ Ơi" là nền tảng Proptech kết nối 3 đối tượng: Người thuê phòng (đặc biệt sinh viên & người đi làm), Chủ nhà trọ và Quản trị viên (Admin).
2. **Ngữ cảnh Việt Nam:** Người tìm phòng ở Việt Nam cần thông tin thực tế, quét mắt cực nhanh:
   - **Ưu tiên số 1:** Giá thuê (triệu/tháng), Tiền cọc, Giá điện/nước rõ ràng.
   - **Ưu tiên số 2:** Vị trí chính xác (gần trường ĐH nào, hẻm xe hơi hay xe máy, có ngập nước không).
   - **Ưu tiên số 3:** Ảnh chụp thực tế căn phòng, tình trạng nội thất (có gác, máy lạnh, ban công không), tin đã xác thực hay chưa.
   - **Hành động cốt lõi:** Bấm gọi điện ngay, nhắn tin trao đổi trực tiếp, hẹn lịch xem phòng, hoặc tìm bạn cùng phòng/pass phòng trên diễn đàn.
3. **Bộ nhận diện chuẩn:**
   - **Màu chủ đạo (Primary Green):** `#245f3b` (Forest Green - tin cậy, vững chãi), `#2f7a4b` (Brand Green), `#eaf4ec` (Soft Mint Tint).
   - **Màu điểm nhấn (Warm Accent):** `#ff5722` / `#ff6e1a` (Warm Proptech Orange - kích thích hành động, nổi bật nhãn Đối Tác & CTA), `#fff2e7` (Peach Cream Background), `#fed7aa` (Soft Amber Border).
   - **Màu bề mặt & trung tính:** `#ffffff` (Card surface), `#f8fafc` / `#f5f8f5` (Canvas ground), `#111827` (Text ink đậm), `#64748b` (Text phụ).
   - **Typography:** Tiêu đề trang trọng, ấm cúng dùng `Lora` hoặc `Be Vietnam Pro` đậm nét; nội dung và thông số kỹ thuật dùng `Be Vietnam Pro` rõ ràng, dễ đọc trên mọi thiết bị.

---

## PHẦN 2: BỘ QUY TẮC "ANTI-AI SLOP" (BẢO VỆ CHẤT LƯỢNG NGHỆ THUẬT)
*(Chiết xuất trực tiếp từ triết lý Tasteskill v2 & 247 website đạt giải Awwwards/One Page Love)*

AI khi sinh giao diện thường rơi vào bẫy "mẫu số chung" lặp đi lặp lại. Tuyệt đối **LOẠI BỎ** 10 thói quen xấu của AI Slop:

| # | Thói quen xấu của AI Slop (CẤM) | Giải pháp thiết kế cao cấp thay thế |
|---|----------------------------------|-------------------------------------|
| 1 | **Eyebrows & Chip badges tràn lan:** Gắn nhãn nhỏ xíu viết hoa phía trên mọi tiêu đề ("NEW", "FEATURE"). | Đưa thông tin vào chính tiêu đề hoặc câu mô tả đầu tiên. Bỏ hẳn các nhãn thừa. |
| 2 | **Icon cards rập khuôn:** Hàng loạt thẻ giống hệt nhau, trên đỉnh là một icon nằm trong ô vuông bo góc tô màu nhạt. | Đa dạng hóa bố cục theo vai trò: thẻ phòng hiển thị ảnh lớn, bảng thống kê hiển thị số liệu thực, tính năng giải thích bằng ảnh minh họa trực quan. |
| 3 | **Gradient tím/hồng vô nghĩa hoặc vệt mờ trôi nổi (Glow Blobs).** | Dùng mảng màu phẳng thực tế, màu nền ấm nhẹ nhàng, hoặc ảnh chụp thật của phòng ốc/khu phố. |
| 4 | **Emoji làm icon:** Dùng biểu tượng cảm xúc điện thoại (🏠, 📍, 📞) làm icon giao diện nhìn nghiệp dư, rẻ tiền. | Dùng 100% vector SVG sắc nét, đồng bộ nét vẽ (`stroke-width: 1.75-2px`), kích thước chuẩn (16px, 20px, 24px). |
| 5 | **Đổ bóng mờ mịt khắp nơi (Shadow Overuse):** Card nào ở trạng thái tĩnh cũng đổ bóng đậm. | Bề mặt phẳng (flat surface) ngăn cách bằng 1 bước màu nhẹ hoặc viền mảnh `1px solid #dfe7e1`. Bóng đổ **CHỈ** xuất hiện khi phần tử nổi thật: Modal, Dropdown menu, Toast, hoặc khi Hover thẻ. |
| 6 | **Số thứ tự vô vị (Index Numbering):** Ghi `01 / 02 / 03` hoặc `Step 1, Step 2` vô nghĩa. | Thể hiện thứ tự bằng tiến trình tự nhiên, bố cục dòng chảy thời gian hoặc thẻ `<ol>` có ý nghĩa. |
| 7 | **Chữ Monospace tùy tiện:** Dùng font code cho nhãn phụ, ngày tháng. | Dùng font thường (`Be Vietnam Pro`), dùng font dạng `tabular-nums` khi cần gióng thẳng hàng cột số tiền. |
| 8 | **Glassmorphism quá đà:** Nền kính mờ (`backdrop-blur`) đè lên nhau gây nhòe và khó đọc. | Dùng thanh điều hướng phẳng rõ nét, nền trắng đặc hoặc mờ nhẹ có chủ đích trên ảnh banner. |
| 9 | **Tiêu đề quá dài:** Headline bị rớt thành 4-5 dòng lộn xộn. | Mọi tiêu đề lớn khống chế tối đa **2 dòng** ở mọi kích thước màn hình. |
| 10| **Fake Dashboard & Grey Bars:** Dùng các thanh xám giả lập hoặc số liệu bịa đặt. | Hiển thị số liệu thật của sản phẩm: số phòng đang mở, lượt tương tác, đánh dấu trạng thái "Phòng trống" / "Đã cho thuê". |

---

## PHẦN 3: TÁI CẤU TRÚC THƯ MỤC & FILE CODE LOGIC NHẤT (CLEAN ARCHITECTURE)

Sắp xếp và chuẩn hóa lại cấu trúc `src/` theo mô hình Feature-Driven kết hợp Atomic UI:

```
src/
├── components/
│   ├── ui/                         # Các primitive component dùng chung toàn dự án
│   │   ├── Button.tsx              # Nút bấm (primary, outline, ghost, danger, kích thước sm/md/lg)
│   │   ├── Input.tsx & Textarea.tsx# Form controls có focus ring, helper text, error message
│   │   ├── Badge.tsx               # Huy hiệu trạng thái (active, pending, verified, partner)
│   │   ├── Modal.tsx               # Dialog chuẩn trap focus, phím ESC, backdrop blur nhẹ
│   │   ├── Dropdown.tsx            # Menu thả xuống với portal chống bị tràn viền (overflow clipping)
│   │   ├── Tabs.tsx                # Tab chuyển đổi ngữ cảnh mượt mà
│   │   ├── Icon.tsx                # Hệ thống Icon SVG đồng bộ nét và kích thước
│   │   └── Skeleton.tsx            # Khung xương loading chống giật bố cục (CLS = 0)
│   ├── domain/                     # Component gắn liền với nghiệp vụ Trọ Ơi
│   │   ├── room/                   # Thẻ phòng (RoomCard), Lưới phòng, Bộ lọc phòng (RoomFilterBar)
│   │   ├── partner/                # Card Đối Tác Trọ Ơi, Dải banner tin đăng đối tác, Modal quyền lợi
│   │   ├── forum/                  # Card bài viết diễn đàn, Khung bình luận, Like/Share
│   │   ├── chat/                   # Hộp chat, Danh sách hội thoại, Bong bóng tin nhắn
│   │   └── landlord/               # Bảng quản lý phòng, Thẻ thống kê doanh thu/lượt xem
│   └── layout/                     # Khung trang bao bọc
│       ├── MainHeader.tsx          # Thanh điều hướng trên cùng (Logo, Search nhanh, Menu, User profile)
│       ├── SiteFooter.tsx          # Chân trang đầy đủ thông tin pháp lý, bản quyền, liên hệ
│       ├── BottomNav.tsx           # Thanh điều hướng đáy màn hình cho Mobile (Home, Tìm kiếm, Đăng tin, Chat, Tôi)
│       └── AdminLayout.tsx         # Khung quản trị riêng biệt với sidebar chuyên nghiệp
├── contexts/                       # Quản lý state toàn cục (Auth, Platform, Toast, Favorites)
├── hooks/                          # Custom hooks tái sử dụng (useAuth, useDebounce, useMediaQuery...)
├── pages/                          # Các trang theo từng phân hệ rõ ràng:
│   ├── public/                     # HomePage, SearchPage, RoomDetailPage
│   ├── auth/                       # LoginPage, RegisterPage, PasswordRecoveryPage
│   ├── community/                  # ForumPage, MembersPage
│   ├── renter/                     # MessagesPage, FavoritesPage, NotificationsPage
│   ├── landlord/                   # MyListingsPage, ListingEditorPage, LandlordStatsPage
│   └── admin/                      # AdminDashboardPage, AdminResourcePage, AdminStatsPage
├── styles/                         # Quy hoạch CSS có hệ thống:
│   ├── tokens.css                  # Biến màu sắc, khoảng cách, font, shadow, radius tập trung
│   ├── reset.css & typography.css  # Chuẩn hóa hiển thị chữ và khung trang
│   └── [feature].css / CSS Modules # Tránh spaghetti code hoặc file CSS đơn lẻ phình to 40KB
├── types/                          # TypeScript definitions chặt chẽ (Room, User, Post, Message...)
└── utils/                          # Helper functions (formatCurrency, formatRelativeTime, validation...)
```

---

## PHẦN 4: KẾ HOẠCH TINH CHỈNH CHI TIẾT TỪNG MÀN HÌNH CHÍNH

### 1. Trang Chủ (`src/pages/public/HomePage.tsx`)
- **Hero Banner:** Kết hợp hình ảnh 3D proptech ấm áp với form tìm kiếm thông minh: Từ khóa, Tỉnh/Thành, Mức giá, Diện tích. Form tìm kiếm nổi bật, dropdown mở bằng portal không bị che khuất.
- **Khối Tiện Ích & Danh Mục Nhanh:** 4 thẻ định hướng (Cho thuê phòng, Tìm ở ghép, Căn hộ mini, Xác thực 100%) bo tròn tinh tế, hover phản hồi nhẹ.
- **Thẻ "Trở thành Đối tác Trọ Ơi" (Nhà Tốt Style):**
  - Đảm bảo 3 icon vector sắc nét: Huy hiệu `[🛡️ Đối Tác]` gọn gàng không tràn chữ; Biểu đồ cột 3D cam tăng trưởng; Tòa nhà văn phòng kèm avatar chuyên nghiệp.
  - Căn giữa cân đối, padding tinh gọn, nút "Tìm hiểu chương trình" pill button thanh lịch mở Modal chi tiết.
- **Dải Banner "Tin đăng từ Đối Tác Trọ Ơi":** Nằm ngay phía trên danh sách phòng, màu kem đào dịu mắt, 2 dấu tích cam xác minh: `✔ Thông tin BĐS chính xác` và `✔ Môi giới được xác minh`.
- **Lưới Phòng Trọ Nổi Bật:** Thẻ phòng (`RoomCard`) đạt chuẩn:
  - Tỷ lệ ảnh 4:3 hoặc 16:9 sắc nét, gắn badge giá tiền nổi bật góc ảnh.
  - Thông tin quét nhanh: Giá thuê (màu xanh lá/cam đậm to rõ), Diện tích ($m^2$), Quận/Huyện, ngày đăng.
  - Nút tim lưu tin yêu thích có phản hồi tức thì (optimistic update).
- **Banner Khuyến Mãi / Diễn Đàn:** Carousel tự động chuyển mượt mà, có nút chuyển trang và chấm định vị chuẩn.

### 2. Trang Tìm Kiếm & Bản Đồ (`src/pages/public/SearchPage.tsx`)
- **Bố cục Split-Screen (hoặc Toggle Map trên Mobile):** Cột danh sách phòng bên trái cuộn độc lập, bản đồ vệ tinh/khu vực bên phải với các marker hiển thị giá tiền trực tiếp.
- **Thanh lọc đa năng (Filter Bar):**
  - Lọc theo khoảng giá (slider hoặc chips nhanh: <3tr, 3-5tr, 5-8tr, >8tr).
  - Lọc tiện ích: Gác lửng, Vệ sinh riêng, Máy lạnh, Giờ giấc tự do, Chỗ để xe, Không chung chủ.
  - Sắp xếp: Tin mới nhất, Giá tăng dần, Giá giảm dần, Diện tích.
- **Trạng thái kết quả:** Hiển thị rõ tổng số kết quả tìm thấy (`Ví dụ: "Tìm thấy 128 phòng trọ tại TP. Hồ Chí Minh"`). Xử lý Empty State trực quan kèm nút "Xóa tất cả bộ lọc".

### 3. Trang Chi Tiết Phòng (`src/pages/public/RoomDetailPage.tsx`)
- **Thư viện ảnh (Photo Gallery):** Hiển thị theo lưới 5 ảnh phong cách Airbnb (1 ảnh lớn bên trái, 4 ảnh nhỏ bên phải), có nút "Xem tất cả ảnh" mở lightbox toàn màn hình.
- **Thông số vàng (Quick Facts Bar):**
  - Giá thuê lớn nổi bật (`triệu/tháng`), Tiền cọc, Phí dịch vụ (Điện, Nước, Internet, Giữ xe).
  - Diện tích, Tầng, Loại phòng, Ngày bắt đầu ở được.
- **Khu vực liên hệ Chủ Trọ (Sticky Contact Card):**
  - Trên desktop: Card cố định bên phải với avatar chủ trọ, nhãn xác thực, số điện thoại, nút gọi điện, nút chat và nút "Hẹn xem phòng".
  - Trên mobile: Thanh Sticky Bar ở đáy màn hình với 2 nút CTA chính: `📞 Gọi ngay` và `💬 Nhắn tin`.
- **Bản đồ tiện ích xung quanh:** Đánh dấu khoảng cách tới trạm xe buýt, trường đại học, siêu thị gần nhất.

### 4. Diễn Đàn & Tìm Ở Ghép (`src/pages/community/ForumPage.tsx` & `MembersPage.tsx`)
- **Phân loại bài viết rõ ràng:** Tab lọc theo chuyên mục: `Tất cả`, `Tìm người ở ghép`, `Pass / Chuyển nhượng phòng`, `Review khu trọ`, `Kinh nghiệm thuê phòng`.
- **Card bài viết cộng đồng:**
  - Avatar tác giả hoạt hình/thân thiện (tránh ảnh nhạy cảm), tên tác giả, nhãn vai trò (Người thuê / Chủ trọ).
  - Nội dung bài viết ngắn gọn kèm ảnh minh họa thực tế; tương tác Like, Comment, Chia sẻ mượt mà.
- **Trang Bạn bè / Thành viên:** Danh sách thẻ bạn bè thiết kế phẳng, gọn gàng, thanh tìm kiếm theo số điện thoại hoặc tên nhanh chóng, nút gửi lời mời kết bạn có phản hồi ngay.

### 5. Hệ Thống Chat Thời Gian Thực (`src/pages/renter/MessagesPage.tsx`)
- **Bố cục 2 cột chuẩn tin nhắn:** Cột danh sách hội thoại bên trái (tìm kiếm, avatar, tin nhắn cuối, thời gian, số tin chưa đọc) và khung chat bên phải.
- **Khung chat:** Bong bóng tin nhắn phân biệt rõ ràng giữa Người gửi (Xanh/Cam thương hiệu) và Người nhận (Xám nhạt). Có hiển thị trạng thái đã xem, gửi kèm ảnh phòng trọ và link tin đăng đang trao đổi.

### 6. Quản Lý Chủ Trọ & Quản Trị Hệ Thống (`src/pages/landlord/` & `src/pages/admin/`)
- **Bảng danh sách tin đăng:** Quản lý rõ ràng trạng thái: `Đang hiển thị`, `Đang duyệt`, `Hết phòng / Ẩn`, `Bị từ chối`.
- **Form Đăng / Sửa tin (`ListingEditorPage.tsx`):** Trình biên soạn nhiều bước khoa học (Thông tin cơ bản → Giá & Chi phí → Tiện ích → Tải ảnh phòng → Xác nhận), có xem trước thời gian thực (Live Preview).
- **Dashboard Thống kê:** Số liệu KPI lớn, rõ ràng; biểu đồ lượt xem và tin nhắn trực quan không thừa thãi; bảng báo cáo vi phạm có thao tác xử lý một chạm.

---

## PHẦN 5: CHUẨN MỰC TƯƠNG TÁC (MICRO-INTERACTIONS) & KHẢ NĂNG TRUY CẬP (A11Y)
*(Áp dụng triết lý Emil Kowalski & UI/UX Pro Max)*

1. **Touch Targets trên Mobile:** Tất cả nút bấm, link icon, ô tick chọn phải có vùng chạm tối thiểu **$44 \times 44\text{ px}$**. Khoảng cách giữa các phần tử bấm được tối thiểu $8\text{ px}$.
2. **Loại bỏ hiện tượng nhảy giao diện (Zero Layout Shift - CLS < 0.1):** Mọi khung ảnh phải có `aspect-ratio` dự trữ trước khi ảnh tải xong; các danh sách phải có Skeleton loader giữ đúng chiều cao.
3. **Phản hồi tương tác (Micro-feedback):**
   - Nút bấm: Hiệu ứng active `transform: scale(0.98)` nhẹ nhàng.
   - Thẻ tin: Hover chuyển dịch nhẹ `translateY(-2px)` kèm tăng độ đổ bóng dịu mắt.
   - Loading Button: Tự động khóa thao tác khi đang gửi dữ liệu, hiển thị con quay (spinner) xoay mượt.
4. **Khả năng truy cập (WCAG 2.2 AA):**
   - Độ tương phản chữ và nền tối thiểu **$4.5:1$** cho nội dung chính, **$3:1$** cho chữ lớn.
   - Mọi nút bấm chỉ có icon (icon-only button) bắt buộc phải có thuộc tính `aria-label` mô tả rõ công dụng.
   - Đảm bảo hiển thị viền focus (`focus-visible`) khi dùng bàn phím duyệt trang.
   - Tôn trọng người dùng bật chế độ giảm chuyển động (`@media (prefers-reduced-motion: reduce)`).

---

## PHẦN 6: QUY TRÌNH THỰC HIỆN BẢO TOÀN DỮ LIỆU & KIỂM TRA

1. **Bảo toàn dữ liệu & nghiệp vụ:**
   - Tuyệt đối không xóa hoặc làm gián đoạn các luồng API kết nối PostgreSQL / Backend hiện tại.
   - Giữ nguyên các chức năng cốt lõi: đăng nhập, phân quyền Role (renter, landlord, admin), đăng tin, đặt lịch, bình luận, chat.
2. **Kiểm tra Responsive liên tục:**
   - Kiểm tra hiển thị chuẩn xác ở 3 mốc độ rộng: **Mobile 375px/390px**, **Tablet 768px**, và **Desktop 1440px**. Không để phát sinh thanh cuộn ngang ngoài ý muốn (`overflow-x: hidden`).
3. **Quy trình Build & Đẩy mã nguồn:**
   - Chạy `pnpm build` để đảm bảo TypeScript không có bất kỳ lỗi cú pháp, kiểu dữ liệu hay build lỗi nào.
   - Đưa ra bản tóm tắt các cải tiến giao diện trước và sau khi hoàn thiện, kiểm tra trên trình duyệt trước khi kết thúc.

Hãy bắt đầu ngay bằng việc khảo sát `src/styles/` và các trang chính, sau đó triển khai từng module một cách dứt khoát, chuyên nghiệp và chuẩn mực nhất.
```
