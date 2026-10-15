import { Link, NavLink } from "react-router"

type PlaceholderPageProps = {
  title: string
  section?: string
  message?: string
  forumNavigation?: boolean
}

const forumLinks = [
  { to: "/dien-dan", label: "Bảng tin" },
  { to: "/tai-khoan/ho-so", label: "Trang cá nhân" },
  { to: "/tin-nhan", label: "Tin nhắn" },
]

export default function PlaceholderPage({
  title,
  section = "Trọ Ơi",
  message = "Nội dung trang đang được hoàn thiện.",
  forumNavigation = false,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <div className={forumNavigation ? "grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]" : ""}>
        {forumNavigation && (
          <nav aria-label="Diễn đàn" className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:content-start lg:overflow-visible">
            {forumLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `inline-flex min-h-11 shrink-0 items-center rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf ${isActive ? "bg-green-100 text-forest" : "text-slate-600 hover:bg-green-50 hover:text-forest"}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        <section className="min-w-0 rounded-2xl border border-line bg-white px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">{section}</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-slate-800 sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-prose text-sm leading-7 text-slate-600 sm:text-base">{message}</p>
          <Link to="/" className="mt-7 inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-forest transition-colors hover:border-leaf hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf">
            Về trang chủ
          </Link>
        </section>
      </div>
    </div>
  )
}
