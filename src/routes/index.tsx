import { createBrowserRouter, Navigate } from "react-router"
import AdminLayout from "../components/layout/AdminLayout"
import MainLayout from "../components/layout/MainLayout"
import PlaceholderPage from "../pages/PlaceholderPage"

const page = (title: string, section?: string) => (
  <PlaceholderPage title={title} section={section} />
)

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, element: page("Trang chủ") },
      { path: "tim-phong", element: page("Tìm phòng") },
      { path: "phong/:id", element: page("Chi tiết phòng") },
      { path: "chuyen-nhuong/*", element: <Navigate to="/tim-phong" replace /> },
      { path: "dien-dan", element: <PlaceholderPage title="Bảng tin" section="Diễn đàn" forumNavigation /> },
      { path: "bai-viet/:id", element: <PlaceholderPage title="Bài viết" section="Diễn đàn" forumNavigation /> },
      { path: "nguoi-dung/:id", element: page("Hồ sơ công khai") },
      { path: "dang-nhap", element: page("Đăng nhập", "Tài khoản") },
      { path: "dang-ky", element: page("Đăng ký", "Tài khoản") },
      { path: "quen-mat-khau", element: page("Khôi phục mật khẩu", "Tài khoản") },
      { path: "dat-lai-mat-khau", element: page("Đặt lại mật khẩu", "Tài khoản") },
      { path: "tai-khoan/ho-so", element: page("Hồ sơ cá nhân", "Tài khoản") },
      { path: "tai-khoan/doi-mat-khau", element: page("Đổi mật khẩu", "Tài khoản") },
      { path: "yeu-thich", element: page("Tin yêu thích", "Tài khoản") },
      { path: "tin-nhan", element: page("Tin nhắn", "Liên lạc") },
      { path: "bao-cao-cua-toi", element: page("Báo cáo của tôi", "Tài khoản") },
      { path: "thong-bao", element: page("Thông báo", "Tài khoản") },
      { path: "chu-tro/quan-ly-tin", element: page("Quản lý tin", "Chủ trọ") },
      { path: "chu-tro/dang-tin", element: page("Đăng tin", "Chủ trọ") },
      { path: "chu-tro/tin/:id/chinh-sua", element: page("Chỉnh sửa tin", "Chủ trọ") },
      { path: "chu-tro/thong-ke", element: page("Thống kê", "Chủ trọ") },
      { path: "admin/dang-nhap", element: page("Đăng nhập quản trị", "Quản trị") },
      { path: "admin/tin-chuyen-nhuong/*", element: <Navigate to="/tim-phong" replace /> },
      { path: "403", element: <PlaceholderPage title="Không có quyền truy cập" message="Bạn không thể mở trang này." /> },
      { path: "404", element: <PlaceholderPage title="Không tìm thấy trang" message="Đường dẫn này không tồn tại." /> },
      { path: "*", element: <PlaceholderPage title="Không tìm thấy trang" message="Đường dẫn này không tồn tại." /> },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, element: page("Tổng quan", "Quản trị") },
      { path: "nguoi-dung", element: page("Người dùng", "Quản trị") },
      { path: "tin-cho-thue", element: page("Tin cho thuê", "Quản trị") },
      { path: "dien-dan", element: page("Bài viết diễn đàn", "Quản trị") },
      { path: "danh-muc", element: page("Danh mục", "Quản trị") },
      { path: "bao-cao", element: page("Báo cáo", "Quản trị") },
      { path: "thong-ke", element: page("Thống kê", "Quản trị") },
      { path: "ho-so", element: page("Hồ sơ quản trị viên", "Quản trị") },
      { path: "doi-mat-khau", element: page("Đổi mật khẩu", "Quản trị") },
      { path: "thong-bao", element: page("Thông báo", "Quản trị") },
    ],
  },
])
