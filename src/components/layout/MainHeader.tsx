import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import BrandMark from "@/components/common/BrandMark"
import LocationPicker from "@/components/common/LocationPicker"
import NotificationPopover from "@/components/common/NotificationPopover"
import useAuth from "@/hooks/useAuth"
import { usePlatform } from "@/contexts/PlatformContext"

const roleLabels = {
  renter: "Người thuê",
  landlord: "Chủ trọ",
  admin: "Quản trị viên",
} as const

type NavigationLink = [path: string, label: string]

const primaryLinks: NavigationLink[] = [
  ["/tim-phong", "Tìm phòng"],
  ["/dien-dan", "Diễn đàn"],
]

export default function MainHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const avatarDropdownRef = useRef<HTMLDivElement>(null)
  const notificationDropdownRef = useRef<HTMLDivElement>(null)
  const menuNavRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [headerLocation, setHeaderLocation] = useState("")
  const { user, logout } = useAuth()
  const { notifications } = usePlatform()
  const unreadNotifications = notifications.filter((item) => item.userId === user?.id && !item.read).length
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  useEffect(() => {
    setMenuOpen(false)
    setAvatarOpen(false)
    setNotificationOpen(false)
    const params = new URLSearchParams(search)
    setSearchQuery(params.get("q") ?? "")
    if (pathname === "/tim-phong") setHeaderLocation(params.get("location") ?? "")
  }, [pathname, search])
  const isAuthPage =
    pathname === "/dang-nhap" ||
    pathname === "/dang-ky" ||
    pathname === "/quen-mat-khau" ||
    pathname === "/dat-lai-mat-khau"
  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    if (!avatarOpen && !menuOpen && !notificationOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (avatarOpen && avatarDropdownRef.current && !avatarDropdownRef.current.contains(target)) {
        setAvatarOpen(false)
      }
      if (notificationOpen && notificationDropdownRef.current && !notificationDropdownRef.current.contains(target)) {
        setNotificationOpen(false)
      }
      if (menuOpen && menuNavRef.current && !menuNavRef.current.contains(target) && !menuButtonRef.current?.contains(target)) {
        setMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarOpen(false)
        setNotificationOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [avatarOpen, menuOpen, notificationOpen])
  const mobileLinks: NavigationLink[] =
    user?.role === "landlord"
      ? [
          ...primaryLinks,
          ["/tim-ban-be", "Bạn bè"],
          ["/chu-tro/quan-ly-tin", "Quản lý tin"],
          ["/chu-tro/thong-ke", "Thống kê"],
          ["/tin-nhan", "Tin nhắn"],
        ]
      : user?.role === "renter"
        ? [...primaryLinks, ["/tim-ban-be", "Bạn bè"], ["/tin-nhan", "Tin nhắn"]]
        : [...primaryLinks, ["/dang-nhap", "Đăng nhập"], ["/dang-ky", "Đăng ký"]]
  const desktopLinks: NavigationLink[] = user && user.role !== "admin"
    ? [...primaryLinks, ["/tim-ban-be", "Bạn bè"]]
    : primaryLinks

  const handleLogout = () => {
    if (!window.confirm("Bạn có chắc muốn đăng xuất khỏi tài khoản này?")) return
    logout()
    setAvatarOpen(false)
    navigate("/dang-nhap", { replace: true, state: null })
  }

  const actionClass = "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#dfe7e0] bg-white px-4 text-[14px] font-semibold text-[#344b3a] transition-colors hover:border-[#bfd4c2] hover:bg-[#f4f8f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a]"

  return (
    <header className={`site-header ${user ? "site-header--authenticated" : ""} sticky top-0 z-50 h-[72px] border-b border-[#e1e8e2] bg-white print:hidden`}>
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      <div className="mx-auto flex h-full w-full max-w-[1480px] items-center gap-2 px-3 sm:gap-3 sm:px-5 xl:gap-4 xl:px-7">
        <button
          ref={menuButtonRef}
          className="inline-grid size-10 shrink-0 place-items-center rounded-full border border-[#e1e8e2] bg-white text-[#345441] transition-colors hover:bg-[#f0f6f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-controls="main-navigation"
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>

        <NavLink
          className="inline-flex shrink-0 items-center gap-2 rounded-lg text-[24px] font-extrabold tracking-[-1.2px] text-[#26382e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#34794a] sm:text-[26px]"
          to="/"
          onClick={closeMenu}
          aria-label="Trọ Ơi - Trang chủ"
        >
          <BrandMark size={34} />
          <span>Trọ <span className="text-[#245f3b]">Ơi</span></span>
        </NavLink>

        {!isAuthPage && (
          <>
            <div className="header-location-picker hidden shrink-0 min-[1120px]:block">
              <LocationPicker
                value={headerLocation}
                variant="filter"
                onChange={(location) => {
                  setHeaderLocation(location)
                  navigate(location ? `/tim-phong?location=${encodeURIComponent(location)}` : "/tim-phong")
                }}
              />
            </div>

            <form
              className="header-search-form group hidden h-10 min-w-[220px] max-w-[340px] xl:max-w-[380px] 2xl:max-w-[440px] flex-1 items-center gap-2 rounded-full border border-[#dfe7e1] bg-[#f4f7f4] px-3.5 text-[#5e7165] transition-all focus-within:border-[#245f3b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#245f3b]/10 min-[1120px]:flex"
              onSubmit={(event) => {
                event.preventDefault()
                const params = new URLSearchParams()
                if (searchQuery.trim()) params.set("q", searchQuery.trim())
                navigate(`/tim-phong?${params.toString()}`)
              }}
            >
              <button
                type="submit"
                className="shrink-0 p-0 text-[#657a6d] transition-colors hover:text-[#245f3b]"
                aria-label="Tìm kiếm"
                title="Tìm kiếm"
              >
                <Icon name="search" size={17} />
              </button>
              <input
                className="header-search-field min-w-0 flex-1 border-0 bg-transparent text-[13.5px] text-[#26382e] outline-none placeholder:text-[#88988e]"
                aria-label="Tìm kiếm"
                placeholder="Tìm phòng trọ, khu vực…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-[#88988e] transition-colors hover:text-[#26382e]"
                  aria-label="Xóa nội dung tìm kiếm"
                  title="Xóa"
                >
                  <Icon name="close" size={15} />
                </button>
              )}
            </form>
          </>
        )}

        <nav
          ref={menuNavRef}
          id="main-navigation"
          className={menuOpen
            ? "absolute left-3 right-3 top-[calc(100%+8px)] z-[60] grid grid-cols-2 gap-1.5 rounded-2xl border border-[#e1e8e2] bg-white p-2 shadow-[0_14px_24px_rgb(29_58_38_/_0.10)] lg:static lg:z-auto lg:ml-auto lg:flex lg:flex-row lg:items-center lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
            : "hidden lg:ml-auto lg:flex lg:items-center lg:gap-1"
          }
        >
          {(menuOpen ? mobileLinks : desktopLinks).map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMenu}
              className={({ isActive }) => `relative inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-3 text-[14px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#34794a] lg:min-h-11 lg:w-auto lg:rounded-full lg:px-3 ${isActive ? "border-[#d7e6d9] bg-[#edf5ee] text-[#245f3b] lg:border-transparent lg:bg-transparent after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[#34794a]" : "border-transparent text-[#4d5c52] hover:bg-[#f1f6f2] hover:text-[#245f3b]"}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-3 xl:gap-2.5">
          {user ? (
            <>
              {user.role !== "admin" && (
                <NavLink
                  to="/yeu-thich"
                  className={({ isActive }) => `hidden size-11 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] sm:inline-grid ${isActive ? "border-[#c4dac7] bg-[#edf5ee] text-[#245f3b]" : "border-[#dfe7e0] bg-white text-[#344b3a] hover:border-[#bfd4c2] hover:bg-[#f4f8f4]"}`}
                  aria-label="Tin yêu thích"
                  title="Tin yêu thích"
                >
                  <Icon name="heart" size={19} />
                </NavLink>
              )}

              <div className="relative" ref={notificationDropdownRef}>
                <button
                  className={`relative inline-grid size-11 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] ${
                    notificationOpen
                      ? "border-[#245f3b] bg-[#edf5ee] text-[#245f3b]"
                      : "border-[#dfe7e0] bg-white text-[#344b3a] hover:border-[#bfd4c2] hover:bg-[#f4f8f4]"
                  }`}
                  aria-label={unreadNotifications ? `Thông báo, ${unreadNotifications} chưa đọc` : "Thông báo"}
                  title={unreadNotifications ? `${unreadNotifications} thông báo chưa đọc` : "Thông báo"}
                  onClick={() => setNotificationOpen((open) => !open)}
                  aria-expanded={notificationOpen}
                  aria-haspopup="dialog"
                >
                  <Icon name="bell" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-[#dc5b50] px-1 text-[9px] font-bold leading-none text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {notificationOpen && (
                  <NotificationPopover onClose={() => setNotificationOpen(false)} />
                )}
              </div>

              <NavLink
                to={user.role === "admin" ? "/admin" : "/tin-nhan"}
                className={({ isActive }) => `${actionClass} header-message-link max-lg:hidden lg:inline-flex ${isActive ? "border-[#bfd4c2] bg-[#edf5ee] text-[#245f3b]" : ""}`}
              >
                <Icon name={user.role === "admin" ? "chart" : "chat"} size={18} />
                {user.role === "admin" ? "Quản trị" : "Tin nhắn"}
              </NavLink>

              {user.role === "landlord" && (
                <>
                  <NavLink
                    to="/chu-tro/quan-ly-tin"
                    className={({ isActive }) => `${actionClass} header-manage-link max-lg:hidden lg:inline-flex ${isActive ? "border-[#bfd4c2] bg-[#edf5ee] text-[#245f3b]" : ""}`}
                  >
                    Quản lý tin
                  </NavLink>
                  <button
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#245f3b] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#1c4e30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a] max-sm:size-11 max-sm:px-0"
                    aria-label="Đăng tin"
                    title="Đăng tin"
                    onClick={() => navigate("/chu-tro/dang-tin")}
                  >
                    <Icon name="plus" size={19} />
                    <span className="max-sm:hidden">Đăng tin</span>
                  </button>
                </>
              )}

              <div className="relative" ref={avatarDropdownRef}>
                <button
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-transparent bg-white py-0 pl-0.5 pr-2 text-[#4a5b50] transition-colors hover:border-[#e3ebe4] hover:bg-[#f7faf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34794a]"
                  onClick={() => setAvatarOpen((open) => !open)}
                  aria-expanded={avatarOpen}
                  aria-haspopup="true"
                  aria-label="Mở menu tài khoản"
                  title="Mở menu tài khoản"
                >
                  <span className="inline-grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9f2eb] text-[13px] font-bold text-[#245f3b]">
                    {user.avatarUrl ? <img className="size-full object-cover" src={user.avatarUrl} alt="" /> : user.initials}
                  </span>
                  <Icon name="down" size={15} />
                </button>
                {avatarOpen && (
                  <div className="header-account-menu absolute right-0 top-[calc(100%+8px)] z-[90] w-[min(260px,calc(100vw-32px))] rounded-2xl border border-[#e1e8e2] bg-white p-2 shadow-[0_16px_36px_rgb(29_58_38_/_0.14)]">
                    <div className="mb-1.5 flex items-center gap-3 border-b border-[#e5ece6] px-2 py-2.5">
                      <span className="inline-grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9f2eb] text-[13px] font-bold text-[#245f3b]">
                        {user.avatarUrl ? <img className="size-full object-cover" src={user.avatarUrl} alt="" /> : user.initials}
                      </span>
                      <div>
                        <strong className="block text-[13px] font-bold text-[#26382e]">{user.name}</strong>
                        <small className="text-xs text-[#718078]">{roleLabels[user.role]}</small>
                      </div>
                    </div>
                    <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate(user.role === "admin" ? "/admin" : "/trang-ca-nhan"); }}>
                      <Icon name="users" size={18} />
                      Trang cá nhân
                    </button>
                    <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate(user.role === "admin" ? "/admin/ho-so" : "/tai-khoan/ho-so"); }}>
                      <Icon name="edit" size={18} />
                      Cài đặt tài khoản
                    </button>
                    <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate(user.role === "admin" ? "/admin/doi-mat-khau" : "/tai-khoan/doi-mat-khau"); }}>
                      <Icon name="shield" size={18} />
                      Đổi mật khẩu
                    </button>
                    {user.role !== "admin" && (
                      <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate("/yeu-thich"); }}>
                        <Icon name="heart" size={18} />
                        Tin yêu thích
                      </button>
                    )}
                    <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate("/tim-ban-be"); }}>
                      <Icon name="users" size={18} />
                      Bạn bè & Kết nối
                    </button>
                    {user.role === "landlord" && (
                      <button className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-[#384b3e] hover:bg-[#edf5ee] hover:text-[#245f3b]" onClick={() => { setAvatarOpen(false); navigate("/chu-tro/thong-ke"); }}>
                        <Icon name="chart" size={18} />
                        Thống kê
                      </button>
                    )}
                    <button className="mt-1.5 flex min-h-10 w-full items-center gap-2.5 rounded-lg border-t border-[#e5ece6] px-2.5 pt-1 text-left text-[13px] font-semibold text-[#a04a45] hover:bg-[#fff5f3]" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className={`header-guest-login inline-flex h-11 items-center justify-center rounded-full px-2.5 text-[13px] font-semibold transition-colors sm:px-3 ${
                  pathname === "/dang-nhap"
                    ? "bg-[#edf5ee] text-[#245f3b]"
                    : "text-[#315b3d] hover:bg-[#f0f6f1]"
                }`}
                onClick={() => navigate("/dang-nhap")}
              >
                Đăng nhập
              </button>
              <button
                className={`inline-flex h-10 items-center justify-center rounded-full border px-3 text-[13px] font-semibold transition-colors sm:px-4 ${
                  pathname === "/dang-ky"
                    ? "border-[#34794a] bg-[#edf5ee] text-[#245f3b]"
                    : "border-[#cdddcf] bg-white text-[#315b3d] hover:border-[#9fbea4] hover:bg-[#f6faf6]"
                }`}
                onClick={() => navigate("/dang-ky")}
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
