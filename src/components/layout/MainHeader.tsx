import { Link, NavLink } from "react-router"
import useAuth from "@/hooks/useAuth"

const primaryLinks = [
  { to: "/tim-phong", label: "Tìm phòng" },
  { to: "/dien-dan", label: "Diễn đàn" },
]

const navigationClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${
    isActive ? "bg-green-50 text-forest" : "text-slate-600 hover:bg-green-50 hover:text-forest"
  }`

export default function MainHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="relative z-20 border-b border-line bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="shrink-0 rounded-md text-[1.65rem] font-bold tracking-tight text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          aria-label="Trọ Ơi — Trang chủ"
        >
          Trọ <span className="text-forest">Ơi</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Điều hướng chính">
          {primaryLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navigationClass}>
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <>
              <NavLink to="/tin-nhan" className={navigationClass}>
                Tin nhắn
              </NavLink>
              <NavLink to="/thong-bao" className={navigationClass}>
                Thông báo
              </NavLink>
              <NavLink to="/yeu-thich" className={navigationClass}>
                Yêu thích
              </NavLink>
              <NavLink
                to="/tai-khoan/ho-so"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-forest transition-colors hover:border-leaf hover:bg-green-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                  {user.initials || user.name.slice(0, 2).toUpperCase()}
                </span>
                <span>{user.name}</span>
              </NavLink>
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-500 hover:text-red-600 cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/dang-nhap" className={navigationClass}>
                Đăng nhập
              </NavLink>
              <NavLink
                to="/dang-ky"
                className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-forest transition-colors hover:border-leaf hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
              >
                Đăng ký
              </NavLink>
            </>
          )}
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-lg border border-line px-4 text-sm font-semibold text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
            Menu
          </summary>
          <nav
            className="absolute right-0 top-[calc(100%+0.5rem)] grid w-52 rounded-xl border border-line bg-white p-2 shadow-lg"
            aria-label="Điều hướng trên điện thoại"
          >
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navigationClass}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/tin-nhan" className={navigationClass}>
                  Tin nhắn
                </NavLink>
                <NavLink to="/thong-bao" className={navigationClass}>
                  Thông báo
                </NavLink>
                <NavLink to="/yeu-thich" className={navigationClass}>
                  Yêu thích
                </NavLink>
                <NavLink to="/tai-khoan/ho-so" className={navigationClass}>
                  Hồ sơ ({user.name})
                </NavLink>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <NavLink to="/dang-nhap" className={navigationClass}>
                  Đăng nhập
                </NavLink>
                <NavLink to="/dang-ky" className={navigationClass}>
                  Đăng ký
                </NavLink>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  )
}
