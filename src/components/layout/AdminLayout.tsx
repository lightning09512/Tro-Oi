import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
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

const ADMIN_HEADER_META: Record<string, { label: string; searchTarget: string }> = {
  "/admin": {
    label: "Bảng quản trị",
    searchTarget: "/admin/tin-cho-thue",
  },
  "/admin/nguoi-dung": {
    label: "Thành viên",
    searchTarget: "/admin/nguoi-dung",
  },
  "/admin/tin-cho-thue": {
    label: "Tin cho thuê",
    searchTarget: "/admin/tin-cho-thue",
  },
  "/admin/dien-dan": {
    label: "Cộng đồng",
    searchTarget: "/admin/dien-dan",
  },
  "/admin/danh-muc": {
    label: "Danh mục & Tiện ích",
    searchTarget: "/admin/danh-muc",
  },
  "/admin/bao-cao": {
    label: "Kiểm duyệt",
    searchTarget: "/admin/bao-cao",
  },
  "/admin/thong-ke": {
    label: "Báo cáo & Thống kê",
    searchTarget: "/admin/tin-cho-thue",
  },
  "/admin/ho-so": {
    label: "Cài đặt & Hồ sơ",
    searchTarget: "/admin/tin-cho-thue",
  },
  "/admin/doi-mat-khau": {
    label: "Đổi mật khẩu",
    searchTarget: "/admin/tin-cho-thue",
  },
  "/admin/thong-bao": {
    label: "Thông báo hệ thống",
    searchTarget: "/admin/tin-cho-thue",
  },
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { reports, notifications } = usePlatform()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [quickQuery, setQuickQuery] = useState("")
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileSideOpen, setMobileSideOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  const pendingReports = useMemo(
    () => reports.filter((item) => item.status === "pending").length,
    [reports],
  )

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.userId === user?.id && !item.read).length,
    [notifications, user?.id],
  )

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
      { to: "/admin/thong-ke", icon: "chart", label: "Báo cáo" },
      { to: "/admin/ho-so", icon: "settings", label: "Cài đặt" },
    ],
    [pendingReports],
  )

  // Phím tắt toàn cục Ctrl+K / Cmd+K để focus vào ô Tìm kiếm nhanh
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchInputRef.current?.focus()
      } else if (event.key === "Escape") {
        setAccountMenuOpen(false)
        setMobileSideOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Đóng menu tài khoản khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Tự động đóng menu khi chuyển route
  useEffect(() => {
    setAccountMenuOpen(false)
    setMobileSideOpen(false)
  }, [pathname])

  const handleQuickSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = quickQuery.trim()
    if (!trimmed) return
    navigate(`${headerMeta.searchTarget}?q=${encodeURIComponent(trimmed)}`)
  }

  const handleLogout = () => {
    setAccountMenuOpen(false)
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
        {/* B. Thanh Header trên cùng (Top Header Bar) */}
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
            <h1 className="saas-topbar-title">{headerMeta.label}</h1>
          </div>

          <div className="saas-topbar-right">
            {/* Ô tìm kiếm toàn cục (Tìm kiếm nhanh... (⌘K)) */}
            <form
              className="saas-global-search"
              onSubmit={handleQuickSearchSubmit}
              role="search"
            >
              <Icon name="search" size={15} />
              <input
                ref={searchInputRef}
                type="search"
                value={quickQuery}
                onChange={(event) => setQuickQuery(event.target.value)}
                placeholder="Tìm kiếm nhanh... (⌘K)"
                aria-label="Tìm kiếm nhanh"
                autoComplete="off"
                spellCheck={false}
              />
            </form>

            {/* Nút chuông thông báo có chấm đỏ thông báo mới */}
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
              <Icon name="bell" size={18} />
              <span
                className={`saas-notif-dot${unreadNotifications > 0 ? " has-unread" : ""}`}
                aria-hidden="true"
              />
            </button>

            {/* Cụm thông tin tài khoản Admin + Dropdown Menu */}
            <div className="saas-account-dropdown" ref={accountMenuRef}>
              <button
                type="button"
                className={`saas-account-trigger${accountMenuOpen || isProfileActive ? " is-active" : ""}`}
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
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
                <strong className="saas-account-name">
                  {user?.name === "Quản trị viên" ? "Admin" : (user?.name ?? "Admin")}
                </strong>
                <Icon name="chevron-down" size={15} />
              </button>

              {accountMenuOpen && (
                <div className="saas-account-menu" role="menu">
                  <div className="saas-account-menu-header">
                    <strong>{user?.name ?? "Quản trị viên"}</strong>
                    <span>{user?.email ?? "admin@trooi.vn"}</span>
                  </div>
                  <div className="saas-account-menu-divider" />
                  <NavLink to="/" className="saas-account-menu-item" role="menuitem">
                    <Icon name="home" size={15} />
                    <span>Về trang chủ công khai</span>
                  </NavLink>
                  <NavLink to="/admin/ho-so" className="saas-account-menu-item" role="menuitem">
                    <Icon name="user" size={15} />
                    <span>Hồ sơ & Bảo mật</span>
                  </NavLink>
                  <NavLink
                    to="/admin/doi-mat-khau"
                    className="saas-account-menu-item"
                    role="menuitem"
                  >
                    <Icon name="lock" size={15} />
                    <span>Đổi mật khẩu</span>
                  </NavLink>
                  <div className="saas-account-menu-divider" />
                  <button
                    type="button"
                    className="saas-account-menu-item is-danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content saas-admin-content">
          <Outlet />
        </div>
      </section>
    </main>
  )
}
