# Trọ Ơi — mã nguồn nhóm

Repo này là nơi nhóm triển khai lại website Trọ Ơi. [Repo giao diện tham chiếu](https://github.com/lightning09512/Rental-Room-Sharing-Platform) dùng để đối chiếu nhận diện, giao diện và luồng sử dụng.

## Chạy ứng dụng

Yêu cầu Node.js và pnpm.

```powershell
pnpm install
pnpm dev
```

Vite in địa chỉ xem trước trong terminal. Để kiểm tra bản dựng:

```powershell
pnpm build
pnpm preview
```

## Trạng thái phần khung

Ứng dụng hiện có React, Vite, TypeScript, Tailwind CSS v4, điều hướng, bố cục chung, bố cục quản trị, font và footer. Các route được tạo theo project tham chiếu nhưng **nội dung trang vẫn là trang tạm**. Chưa có tài khoản, dữ liệu, API, phân quyền hay chức năng nghiệp vụ. Những phần đó sẽ được triển khai trong các nhánh tính năng của từng thành viên.

Các route chuyển nhượng cũ chỉ chuyển về trang tìm phòng; không xây dựng chức năng chuyển nhượng riêng.

## Phân chia phần việc

- Trang công khai và tài khoản: trang chủ, tìm phòng, chi tiết phòng, yêu thích, xác thực và hồ sơ của chính mình.
- Cộng đồng và liên lạc: diễn đàn, hồ sơ công khai, tin nhắn, thông báo và báo cáo của tôi.
- Chủ trọ và quản trị: quản lý tin, đăng/sửa tin, thống kê, các màn hình quản trị.

Người phụ trách phần nền quản lý `src/routes`, `src/components/layout` và `src/index.css`. Thành viên làm trang riêng báo các route hoặc thay đổi dùng chung cần ghép, tránh cùng sửa một file trong nhiều nhánh.

## Quy trình Git

Mỗi thành viên tạo nhánh riêng từ `main`, triển khai đúng phần được giao, chạy `pnpm build`, commit và push nhánh của mình rồi mở Pull Request vào `main`. Không đưa `.env`, `node_modules` hoặc `dist` lên repo.
