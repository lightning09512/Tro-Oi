import { useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import { usePlatform } from "@/contexts/PlatformContext"

interface NavItemConfig {
  to: string
  icon: string
  label: string
  badgeCount?: number
}

const ADMIN_HEADER_META: Record<string, { label: string; icon: string }> = {
  "/admin": { label: "Bảng quản trị", icon: "home" },
  "/admin/nguoi-dung": { label: "Thành viên", icon: "users" },
  "/admin/tin-cho-thue": { label: "Tin cho thuê", icon: "building" },
  "/admin/dien-dan": { label: "Cộng đồng", icon: "chat" },
  "/admin/danh-muc": { label: "Danh mục & Tiện ích", icon: "grid" },
  "/admin/bao-cao": { label: "Kiểm duyệt", icon: "shield-check" },
  "/admin/ho-so": { label: "Hồ sơ & Bảo mật", icon: "user" },
  "/admin/doi-mat-khau": { label: "Đổi mật khẩu", icon: "lock" },
  "/admin/thong-bao": { label: "Thông báo hệ thống", icon: "bell" },
}

function formatAdminTodayLabel(): string {
  const formatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { reports, notifications } = usePlatform()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [mobileSideOpen, setMobileSideOpen] = useState(false)

  const pendingReports = useMemo(
    () => reports.filter((item) => item.status === "pending").length,
    [reports],
  )

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.userId === user?.id && !item.read).length,
    [notifications, user?.id],
  )

  const todayLabel = useMemo(() => formatAdminTodayLabel(), [])

  const isProfileActive = pathname === "/admin/ho-so" || pathname === "/admin/doi-mat-khau"
  const headerMeta = ADMIN_HEADER_META[pathname] ?? ADMIN_HEADER_META["/admin"]

  const navItems: NavItemConfig[] = useMemo(
    () => [
      { to: "/admin", icon: "home", label: "Tổng quan" },
      { to: "/admin/tin-cho-thue", icon: "building", label: "Tin cho thuê" },
      { to: "/admin/danh-muc", icon: "grid", label: "Danh mục & Tiện ích" },
      {
        to: "/admin/bao-cao",
        icon: "shield-check",
        label: "Kiểm duyệt",
        badgeCount: pendingReports,
      },
      { to: "/admin/nguoi-dung", icon: "users", label: "Thành viên" },
      { to: "/admin/dien-dan", icon: "chat", label: "Cộng đồng" },
      { to: "/admin/ho-so", icon: "user", label: "Hồ sơ & Bảo mật" },
    ],
    [pendingReports],
  )

  // Đóng sidebar mobile khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSideOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Tự động đóng sidebar mobile khi chuyển route
  useEffect(() => {
    setMobileSideOpen(false)
  }, [pathname])

  const handleLogout = () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất khỏi trang quản trị?")) return
    logout()
    navigate("/admin/dang-nhap", { replace: true, state: null })
  }

  return (
    <main className="admin-layout admin-shell saas-admin-shell">
      {/* Lớp phủ màn hình nhỏ khi mở Sidebar */}
      {mobileSideOpen && (
        <div
          className="saas-sidebar-backdrop"
          onClick={() => setMobileSideOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* A. Thanh điều hướng dọc bên trái (Flat Top-Level Navigation) */}
      <aside className={`admin-side saas-admin-sidebar${mobileSideOpen ? " is-open" : ""}`}>
        <NavLink className="admin-logo saas-brand-header" to="/admin">
          <span className="saas-brand-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <b className="saas-brand-title">Trọ Ơi</b>
        </NavLink>

        <nav className="saas-sidebar-nav" aria-label="Điều hướng quản trị">
          {navItems.map((item) => {
            const isItemActive =
              item.to === "/admin"
                ? pathname === "/admin"
                : item.to === "/admin/ho-so"
                  ? isProfileActive
                  : pathname.startsWith(item.to)

            return (
              <div key={item.to} className="saas-nav-group">
                <NavLink
                  end={item.to === "/admin"}
                  to={item.to}
                  className={`saas-nav-item${isItemActive ? " active" : ""}`}
                >
                  <span className="saas-nav-item-left">
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </span>
                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span className="saas-nav-item-right">
                      <b className="saas-nav-badge">{item.badgeCount}</b>
                    </span>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>
      </aside>

      {/* Khu vực chính bên phải */}
      <section className="admin-main saas-admin-main">
        {/* B. Thẻ Header nổi xanh rừng thương hiệu (Floating Brand Topbar Card) */}
        <div className="saas-topbar-wrap">
          <header className="admin-topbar saas-topbar">
            <div className="saas-topbar-left">
              <button
                type="button"
                className="saas-mobile-menu-btn"
                onClick={() => setMobileSideOpen((prev) => !prev)}
                aria-label="Mở menu điều hướng"
              >
                <Icon name="menu" size={20} />
              </button>
              <span className="saas-topbar-page-icon" aria-hidden="true">
                <Icon name={headerMeta.icon} size={18} />
              </span>
              <div className="saas-topbar-heading">
                <h1 className="saas-topbar-title">{headerMeta.label}</h1>
                <p className="saas-topbar-date">{todayLabel}</p>
              </div>
            </div>

            <div className="saas-topbar-right">
              {/* Nút chuyển nhanh về trang chủ công khai */}
              <NavLink
                to="/"
                className="saas-topbar-btn"
                title="Về trang chủ công khai"
                aria-label="Về trang chủ công khai"
              >
                <span className="saas-topbar-btn-icon" aria-hidden="true">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3.6 9h16.8M3.6 15h16.8" />
                    <path d="M12 3a14 14 0 0 0 0 18 14 14 0 0 0 0-18z" />
                  </svg>
                </span>
                <span className="saas-topbar-btn-label">Về trang chủ</span>
              </NavLink>

              {/* Nút thông báo có chữ + chỉ hiện chấm đỏ khi có thông báo chưa đọc */}
              <button
                type="button"
                className={`saas-notif-btn${pathname === "/admin/thong-bao" ? " is-active" : ""}`}
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
                <Icon name="bell" size={16} />
                <span className="saas-topbar-btn-label">Thông báo</span>
                {unreadNotifications > 0 && (
                  <span className="saas-notif-dot" aria-hidden="true" />
                )}
              </button>

              <span className="saas-topbar-divider" aria-hidden="true" />

              {/* Thẻ tài khoản Admin 2 dòng — bấm mở thẳng Hồ sơ & Bảo mật */}
              <NavLink
                to="/admin/ho-so"
                className={`saas-account-trigger${isProfileActive ? " is-active" : ""}`}
                title="Hồ sơ & Bảo mật"
              >
                <span className="saas-account-avatar">
                  <img
                    src={user?.avatarUrl || "/images/avatars/default-brand-avatar.png"}
                    alt={user?.name || "Admin"}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = "/images/avatars/default-brand-avatar.png"
                    }}
                  />
                </span>
                <span className="saas-account-meta">
                  <strong className="saas-account-name">
                    {user?.name === "Quản trị viên" ? "Admin" : (user?.name ?? "Admin")}
                  </strong>
                  <span className="saas-account-email">
                    {user?.email ?? "admin@trooi.vn"}
                  </span>
                </span>
              </NavLink>

              {/* Nút đăng xuất trực tiếp trên Header */}
              <button
                type="button"
                className="saas-logout-btn"
                onClick={handleLogout}
                title="Đăng xuất khỏi trang quản trị"
                aria-label="Đăng xuất"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="saas-topbar-btn-label">Đăng xuất</span>
              </button>
            </div>
          </header>
        </div>

        <div className="admin-content saas-admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
