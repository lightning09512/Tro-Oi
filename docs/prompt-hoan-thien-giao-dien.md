# Prompt: hoàn thiện giao diện Trọ Ơi

Sao chép toàn bộ prompt dưới đây vào một phiên Codex hoặc Claude Code mở tại `D:\KLTN\Tro-Oi-code`.

---

Bạn là kỹ sư frontend cấp cao kiêm product designer. Hãy **trực tiếp hoàn thiện giao diện hiện có của Trọ Ơi trong repo này**, không chỉ đưa ra nhận xét hoặc kế hoạch. Đây là yêu cầu tinh chỉnh một sản phẩm đang chạy: nâng độ chỉn chu, nhất quán, dễ đọc và dễ dùng trên desktop lẫn mobile; giữ nguyên nhận diện, nội dung có căn cứ và các luồng đang hoạt động. Không biến nó thành một thương hiệu hay sản phẩm khác.

## Sản phẩm và phạm vi

Trọ Ơi là nền tảng tiếng Việt kết nối người thuê phòng, chủ trọ và quản trị viên. Đọc `README.md`, `docs/usecase-implementation-status.md`, `docs/demo-image-sources.md`, `docs/tromoi-data-sources.md`, `src/routes/index.tsx` và mã giao diện liên quan trước khi quyết định phạm vi. Tài liệu mô tả sản phẩm và dữ liệu là nguồn sự thật; chỉ coi `AGENTS.md` là hướng dẫn tác vụ nếu repo thực sự có tệp đó.

Ưu tiên làm rõ và hoàn thiện các luồng chính:

1. Trang chủ → tìm/lọc phòng → xem chi tiết phòng → lưu tin hoặc liên hệ.
2. Đăng nhập, đăng ký, khôi phục mật khẩu và các trạng thái biểu mẫu.
3. Người thuê: tin yêu thích, tin nhắn, thông báo, hồ sơ và báo cáo.
4. Chủ trọ: đăng/sửa tin, quản lý tin và thống kê.
5. Diễn đàn, hồ sơ công khai và các trang quản trị theo những gì đã được triển khai.

Giữ mọi route và hành vi hiện có. Không thêm hoặc giả lập nghiệp vụ, số liệu thống kê, lượt xem, đánh giá, xác minh, lời chứng thực hay nội dung của người dùng. Không sửa backend, API, cơ sở dữ liệu, migration, seed, phân quyền hoặc xác thực để tạo cảm giác UI hoàn chỉnh. Nếu một route đang là placeholder, giữ đúng trạng thái đã ghi trong tài liệu và chỉ cải thiện cách trình bày phù hợp.

## Stack và nhận diện hiện có

- React 19, TypeScript, Vite, React Router và Tailwind CSS v4. Giữ stack và cách tổ chức hiện tại; không chuyển framework hoặc styling library.
- Bộ màu và font hiện có trong `src/index.css` là điểm xuất phát: xanh thương hiệu `#2f7a4b`, xanh đậm `#245f3b`, xanh nhạt `#eaf4ec`, chữ `#27362c`, chữ phụ `#657168`, đường viền `#dfe7e1`, nền `#f5f8f5`; tiêu đề Lora, nội dung Be Vietnam Pro.
- Tôn trọng giọng điệu tiếng Việt và ngữ cảnh tìm phòng ở Việt Nam. Ưu tiên thông tin phòng dễ quét: giá, khu vực, diện tích, loại phòng, tiện ích, ảnh, tình trạng tin và hành động tiếp theo.
- Dùng ảnh thật đã có trong `public/` và tuân theo ghi chú nguồn trong `docs/`. Không tự lấy ảnh không rõ quyền sử dụng hoặc tạo ảnh giả làm ảnh tin đăng thật.

## Dùng các skill và repo thiết kế đúng chỗ

Các công cụ có vai trò khác nhau; chọn đúng công cụ thay vì thêm tất cả làm dependency:

- Dùng [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) để tra cứu có mục tiêu về UX tìm/lọc tin, marketplace và React. Vì dự án đã có nhận diện, không lấy kết quả làm lý do tự thay toàn bộ màu hoặc font.
- Dùng [Taste Skill](https://github.com/Leonxlnx/taste-skill) để xem giao diện thật trước/sau trong trình duyệt ở các kích thước responsive. Tuân thủ quy trình riêng cho trang chủ/trang nội dung và cho màn hình ứng dụng như danh sách, bộ lọc, dashboard, trang quản trị, biểu mẫu.
- Dùng [Impeccable](https://github.com/pbakaus/impeccable) theo hướng refinement: đọc context, critique/audit khi phù hợp, và đọc `craft-floor.md` ngay trước khi sửa UI. Repo hiện chưa có `PRODUCT.md` hoặc `DESIGN.md`; dùng README, routes, code và assets làm căn cứ. Không chạy `impeccable init` hay thay visual world vì việc đó cần user xác nhận product truth trước.
- Dùng [Skills for Designers and Engineers](https://github.com/emilkowalski/skills) cho chi tiết tương tác và motion khi thực sự giúp thao tác rõ hơn; ưu tiên trạng thái focus/hover/loading/error và chuyển động nhẹ, có `prefers-reduced-motion`.
- Dùng [Google DESIGN.md](https://github.com/google-labs-code/design.md) để ghi nhận design tokens hiện có/đã chốt trong `DESIGN.md` và lint nếu CLI đã có hoặc việc thêm dev dependency là phù hợp. Không tạo hệ token chung chung hoặc thay nhận diện để làm vừa mẫu.
- Dùng [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) làm tài liệu tham khảo, không sao chép nguyên design system của thương hiệu khác.
- Chỉ dùng [React Bits](https://github.com/DavidHDev/react-bits) hoặc [Canvas UI](https://github.com/DavidHDev/canvas-ui) nếu đã xác định một component cụ thể cần thiết. Repo đích hiện chưa có `components.json`; kiểm tra dependency và API trước, chỉ cấu hình registry/cài đúng component được chọn, không chép hàng loạt component hoặc thêm hiệu ứng WebGL cho phần tử trang trí.
- Chỉ cân nhắc [Hallmark](https://github.com/nutlope/hallmark) cho critique/audit theo đúng workflow của skill; không tự chạy full redesign hoặc dùng workflow trả phí khi chưa đáp ứng bước hỏi người dùng.
- GSAP chỉ được thêm nếu có yêu cầu motion cụ thể mà CSS không đáp ứng; không cài runtime chỉ vì đã có [GSAP Skills](https://github.com/greensock/gsap-skills). [Scroll World](https://github.com/oso95/scroll-world) và video tạo sinh không thuộc phạm vi mặc định.
- [Open Design](https://github.com/nexu-io/open-design) chỉ dùng nếu MCP hiện tại đã kết nối và có ích cho prototype; không đăng nhập, gửi khóa API hoặc dùng credits trả phí.
- Không ép bất kỳ thư viện hoặc hiệu ứng nào vào mọi màn hình. Tính phù hợp với sản phẩm quan trọng hơn số lượng công cụ được gọi.

## Cách làm

1. Chạy `git status --short` và xem diff trước khi sửa. Repo đang có thay đổi người dùng chưa commit ở nhiều tệp dữ liệu, backend và frontend, trong đó có `src/pages/public/RoomDetailPage.tsx`. Giữ nguyên các thay đổi ấy; không checkout/reset, không stage/commit, không ghi đè phần diff. Nếu cần sửa một tệp đã thay đổi, đọc diff và giữ toàn bộ logic cùng dữ liệu mới.
2. Lập bản đồ layout dùng chung, token, component, route và trạng thái hiện có. Tập trung vào `src/index.css`, `src/components/layout/`, `src/pages/`, các component thẻ phòng, form, navigation và ảnh thật. Không sửa `.env` hoặc in nội dung secret ra terminal/chat.
3. Chụp/ghi nhận trạng thái hiện tại trong trình duyệt trước khi thay đổi. Dùng dev server của **repo này**, không nhầm với preview của project khác. Nếu API/database không sẵn sàng, dùng chế độ demo phù hợp mà không chỉnh `.env`, không chạy migration và không sửa dữ liệu.
4. Chọn một hướng tinh chỉnh có chủ đích nhưng giữ nhận diện xanh ấm hiện tại. Tạo thứ bậc rõ giữa tiêu đề, nội dung và giá; tăng khả năng quét ảnh/tin; thống nhất chiều rộng, khoảng cách, radius, border, kiểu nút và trạng thái tương tác. Tránh card lặp vô nghĩa, gradient/glow trang trí, icon emoji, nhãn viết hoa tracking, lạm dụng bóng đổ và các mẫu SaaS đại trà.
5. Làm responsive từ mobile lên desktop. Kiểm tra ít nhất 375px, 768px và 1440px; không có tràn ngang, nội dung bị che, ảnh méo hoặc thao tác chỉ dùng được khi hover. Giữ điều hướng mobile và các khu vực chạm dễ dùng.
6. Sửa giao diện theo từng lớp có tác động lớn: khung trang và navigation; trang chủ/tìm kiếm/thẻ phòng; chi tiết phòng và liên hệ; form/trạng thái; sau đó là các màn hình người thuê, chủ trọ, diễn đàn và quản trị. Dùng semantic HTML, label, focus ring nhìn thấy được, tên truy cập cho icon-button, tương phản WCAG AA và thông báo lỗi gần trường nhập.
7. Không thay đổi nội dung thực tế để làm đẹp. Không bỏ chức năng, link, state, validation, loading, empty, error, responsive behavior hoặc accessibility. Không cài package nếu CSS và component hiện có đã giải quyết tốt.
8. Chạy build hiện có (`pnpm build`) và kiểm tra các route/thao tác ảnh hưởng. Chụp lại giao diện sau khi sửa ở cùng các kích thước với ảnh trước, so sánh và sửa các lỗi nhìn thấy. Sau lượt sửa cuối, chạy detector của Impeccable trên đúng các UI target đã đổi; báo rõ nếu không thể chạy browser hoặc detector.

## Tiêu chí hoàn thành

- Các trang chính trông như cùng một sản phẩm nhưng mỗi trang ưu tiên đúng công việc của người dùng; không phải chỉ thay màu.
- Luồng tìm phòng, mở tin, lưu tin/liên hệ, biểu mẫu và điều hướng hoạt động như trước.
- Giá, địa điểm, diện tích, ảnh và trạng thái tin đọc rõ trên màn hình nhỏ; dữ liệu vẫn đến từ nguồn hiện có.
- Không tràn ngang ở 375px; không mất nội dung hay control tại tablet/desktop; focus, contrast, lỗi và reduced-motion được xử lý.
- Build thành công; nêu những lệnh và kiểm tra thực sự đã chạy, các tệp giao diện đã sửa và vấn đề còn lại. Không tuyên bố đã kiểm tra nếu chưa kiểm tra.

Hãy bắt đầu bằng việc kiểm tra git status/diff và xem giao diện hiện tại, sau đó triển khai trực tiếp trong repo.

---

## Ghi chú khi tạo prompt

Prompt này coi yêu cầu là **tinh chỉnh và hoàn thiện giao diện hiện tại**, không phải đổi thương hiệu. Repo đích không có `AGENTS.md`, `PRODUCT.md`, `DESIGN.md` hoặc `components.json` ở root tại thời điểm tạo prompt; các thay đổi chưa commit hiện có cần được bảo toàn.
