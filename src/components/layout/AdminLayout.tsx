import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import BrandMark from "@/components/common/BrandMark"
import useAuth from "@/hooks/useAuth"
import { usePlatform } from "@/contexts/PlatformContext"

const items = [
  ["/admin", "chart", "Tổng quan"],
  ["/admin/nguoi-dung", "users", "Người dùng"],
  ["/admin/tin-cho-thue", "building", "Tin cho thuê"],
  ["/admin/dien-dan", "chat", "Diễn đàn"],
  ["/admin/danh-muc", "filter", "Danh mục"],
  ["/admin/bao-cao", "shield", "Báo cáo"],
  ["/admin/thong-ke", "chart", "Thống kê & báo cáo"],
  ["/admin/ho-so", "user", "Hồ sơ & bảo mật"],
] as const

const ADMIN_HEADER_META: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "",
    subtitle: "",
  },
  "/admin/nguoi-dung": {
    title: "Quản lý người dùng",
    subtitle: "Quản lý tài khoản, vai trò và trạng thái hoạt động",
  },
  "/admin/tin-cho-thue": {
    title: "Kiểm duyệt tin cho thuê",
    subtitle: "Kiểm duyệt và quản lý danh sách phòng trọ trên hệ thống",
  },
  "/admin/dien-dan": {
    title: "Quản lý diễn đàn",
    subtitle: "Kiểm duyệt bài viết và bình luận cộng đồng",
  },
  "/admin/danh-muc": {
    title: "Danh mục phòng trọ",
    subtitle: "Thiết lập phân loại phòng trọ và danh mục hệ thống",
  },
  "/admin/bao-cao": {
    title: "Báo cáo vi phạm",
    subtitle: "Tiếp nhận và xử lý phản ánh từ người dùng",
  },
  "/admin/thong-ke": {
    title: "Thống kê & báo cáo",
    subtitle: "Theo dõi chỉ số tăng trưởng và xuất dữ liệu hệ thống",
  },
  "/admin/ho-so": {
    title: "",
    subtitle: "",
  },
  "/admin/doi-mat-khau": {
    title: "",
    subtitle: "",
  },
  "/admin/thong-bao": {
    title: "Thông báo hệ thống",
    subtitle: "Theo dõi các thông báo và biến động mới nhất",
  },
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { reports, notifications } = usePlatform()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const pendingReports = reports.filter((item) => item.status === "pending").length
  const unreadNotifications = notifications.filter(
    (item) => item.userId === user?.id && !item.read,
  ).length
  const isProfileActive = pathname === "/admin/ho-so" || pathname === "/admin/doi-mat-khau"
  const headerMeta = ADMIN_HEADER_META[pathname] ?? ADMIN_HEADER_META["/admin"]

  return (
    <main className="admin-layout admin-shell">
      <aside className="admin-side">
        <NavLink className="admin-logo" to="/admin">
          <BrandMark size={32} />
          <b>Trọ Ơi</b>
        </NavLink>
        <small>QUẢN TRỊ HỆ THỐNG</small>
        {items.map(([to, icon, label]) => (
          <NavLink
            end={to === "/admin"}
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive || (to === "/admin/ho-so" && isProfileActive) ? "active" : ""
            }
          >
            <Icon name={icon} />
            <span>{label}</span>
            {label === "Báo cáo" && pendingReports > 0 && <b>{pendingReports}</b>}
          </NavLink>
        ))}
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            {headerMeta.title ? <h1>{headerMeta.title}</h1> : null}
            {headerMeta.subtitle ? <p>{headerMeta.subtitle}</p> : null}
          </div>
          <NavLink
            to="/"
            className="admin-home-btn"
            title="Xem giao diện trang chủ công khai"
          >
            <Icon name="home" size={16} />
            <span>Trang chủ</span>
          </NavLink>
          <button
            type="button"
            className={`icon-btn admin-notif-btn${pathname === "/admin/thong-bao" ? " is-active" : ""}`}
            aria-label={
              unreadNotifications > 0
                ? `Thông báo, ${unreadNotifications} chưa đọc`
                : "Thông báo"
            }
            title={
              unreadNotifications > 0
                ? `${unreadNotifications} thông báo chưa đọc`
                : "Thông báo"
            }
            onClick={() => navigate("/admin/thong-bao")}
          >
            <Icon name="bell" />
            {unreadNotifications > 0 && (
              <span className="admin-notif-badge">{unreadNotifications}</span>
            )}
          </button>
          <NavLink
            to="/admin/ho-so"
            className={`admin-user-pill${isProfileActive ? " is-active" : ""}`}
            aria-label="Hồ sơ quản trị viên"
            title="Cài đặt hồ sơ và mật khẩu quản trị"
          >
            <span className="avatar">
              {user?.avatarUrl ? (
                <img className="user-avatar-image" src={user.avatarUrl} alt="" />
              ) : (
                (user?.initials ?? "AD")
              )}
            </span>
            <span className="admin-user-pill-info">
              <strong>{user?.name ?? "Quản trị viên"}</strong>
              <small>Quản trị viên</small>
            </span>
          </NavLink>
          <button
            type="button"
            className="admin-logout"
            onClick={() => {
              if (!window.confirm("Bạn có chắc muốn đăng xuất khỏi trang quản trị?")) return
              logout()
              navigate("/admin/dang-nhap", { replace: true, state: null })
            }}
          >
            Đăng xuất
          </button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
