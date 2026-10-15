import { Link } from "react-router"

const projectDetails = [
  "Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh · Khoa Đào tạo Chất lượng cao",
  "Giảng viên hướng dẫn: TS. Lê Văn Vinh",
  "Nhóm 04: Nguyễn Minh Quốc Khánh, Phạm Minh Khánh, Hoàng Thanh Tú",
]

export default function SiteFooter({ variant = "full" }: { variant?: "full" | "compact" }) {
  if (variant === "compact") {
    return (
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm sm:px-6">
          <Link to="/" className="font-bold text-forest">Trọ Ơi</Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Điều hướng cuối trang">
            <Link className="hover:underline" to="/tim-phong">Tìm phòng</Link>
            <Link className="hover:underline" to="/dien-dan">Diễn đàn</Link>
            <Link className="hover:underline" to="/">Trang chủ</Link>
          </nav>
          <small className="text-slate-600">© 2026 Trọ Ơi · Nhóm 04</small>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-forest-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/20 pb-7">
          <div>
            <Link to="/" className="text-2xl font-bold tracking-tight">Trọ <span className="text-green-200">Ơi</span></Link>
            <p className="mt-3 max-w-xl text-sm leading-6 text-green-50">Nền tảng tìm phòng và kết nối cộng đồng người thuê trọ.</p>
          </div>
          <Link to="/admin/dang-nhap" className="inline-flex min-h-11 items-center rounded-lg border border-white/40 px-4 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Trang quản trị
          </Link>
        </div>

        <div className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.6fr]">
          <div>
            <h2 className="font-semibold">Khám phá</h2>
            <div className="mt-4 grid gap-3 text-sm text-green-50">
              <Link className="w-fit hover:underline" to="/tim-phong">Tìm phòng trọ</Link>
              <Link className="w-fit hover:underline" to="/dien-dan">Diễn đàn</Link>
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Tài khoản</h2>
            <div className="mt-4 grid gap-3 text-sm text-green-50">
              <Link className="w-fit hover:underline" to="/dang-nhap">Đăng nhập</Link>
              <Link className="w-fit hover:underline" to="/dang-ky">Đăng ký</Link>
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Thông tin dự án</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-green-50">
              {projectDetails.map((detail) => <p key={detail}>{detail}</p>)}
            </div>
          </div>
        </div>

        <p className="border-t border-white/20 pt-5 text-sm text-green-50">© 2026 Trọ Ơi · Tiểu luận chuyên ngành của Nhóm 04</p>
      </div>
    </footer>
  )
}
