import { Link, NavLink, Outlet } from "react-router"

const adminLinks = [
  { to: "/admin", label: "Tổng quan", end: true },
  { to: "/admin/nguoi-dung", label: "Người dùng" },
  { to: "/admin/tin-cho-thue", label: "Tin cho thuê" },
  { to: "/admin/dien-dan", label: "Diễn đàn" },
  { to: "/admin/danh-muc", label: "Danh mục" },
  { to: "/admin/bao-cao", label: "Báo cáo" },
  { to: "/admin/thong-ke", label: "Thống kê" },
  { to: "/admin/thong-bao", label: "Thông báo" },
  { to: "/admin/ho-so", label: "Hồ sơ" },
]

export default function AdminLayout() {
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white lg:min-h-dvh lg:border-r lg:border-b-0">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-5">
          <Link to="/admin" className="text-xl font-bold text-forest">Trọ Ơi</Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quản trị hệ thống</p>
          <nav className="mt-5 flex gap-1 overflow-x-auto pb-1 lg:grid" aria-label="Điều hướng quản trị">
            {adminLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${isActive ? "bg-green-50 text-forest" : "text-slate-600 hover:bg-green-50 hover:text-forest"}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link to="/" className="mt-6 hidden text-sm font-semibold text-forest hover:underline lg:inline-block">Về trang chủ</Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <h1 className="font-heading text-xl font-semibold text-slate-800">Quản trị Trọ Ơi</h1>
            <Link to="/" className="text-sm font-semibold text-forest hover:underline lg:hidden">Về trang chủ</Link>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
