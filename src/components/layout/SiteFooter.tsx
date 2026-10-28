import { useState } from "react"
import { Link } from "react-router"
import { Icon } from "@/components/common/legacy"
import BrandMark from "@/components/common/BrandMark"
import useAuth from "@/hooks/useAuth"

type FooterLink = { label: string; to: string }
type FooterGroup = { title: string; links?: FooterLink[]; details?: string[] }

const legalText = "© 2026 Trọ Ơi · Tiểu luận chuyên ngành của Nhóm 04"

function FooterLinks({ links }: { links: FooterLink[] }) {
  return <div className="footer-links">{links.map(({ label, to }) => <Link key={to} to={to}>{label}</Link>)}</div>
}

function FooterGroupContent({ group }: { group: FooterGroup }) {
  if (group.links) return <FooterLinks links={group.links} />
  return <div className="footer-project-info">{group.details?.map((detail) => <p key={detail}>{detail}</p>)}</div>
}

export default function SiteFooter({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { user } = useAuth()
  const [showAppModal, setShowAppModal] = useState(false)

  if (variant === "compact") {
    return <footer className="site-footer site-footer--compact">
      <div className="container footer-compact-row">
        <Link className="logo gap-2" to="/"><BrandMark size={30} /><span style={{ color: "inherit" }}>Trọ <span>Ơi</span></span></Link>
        <nav className="footer-compact-links" aria-label="Điều hướng cuối trang">
          <Link to="/tim-phong">Tìm phòng</Link>
          <Link to="/dien-dan">Diễn đàn</Link>
          <Link to="/">Trang chủ</Link>
        </nav>
        <small>© 2026 Trọ Ơi · Nhóm 04</small>
      </div>
    </footer>
  }

  const accountLinks: FooterLink[] = user?.role === "landlord"
    ? [
        { label: "Đăng tin cho thuê", to: "/chu-tro/dang-tin" },
        { label: "Quản lý tin", to: "/chu-tro/quan-ly-tin" },
        { label: "Tin nhắn", to: "/tin-nhan" },
      ]
    : user?.role === "renter"
      ? [
          { label: "Tin yêu thích", to: "/yeu-thich" },
          { label: "Tin nhắn", to: "/tin-nhan" },
          { label: "Hồ sơ cá nhân", to: "/tai-khoan/ho-so" },
        ]
      : user?.role === "admin"
        ? [{ label: "Khu quản trị", to: "/admin" }]
        : [
            { label: "Đăng nhập", to: "/dang-nhap" },
            { label: "Đăng ký", to: "/dang-ky" },
          ]
  const groups: FooterGroup[] = [
    { title: "Khám phá", links: [
      { label: "Tìm phòng trọ", to: "/tim-phong" },
      { label: "Diễn đàn", to: "/dien-dan" },
    ] },
    { title: user?.role === "landlord" ? "Chủ trọ" : "Tài khoản", links: accountLinks },
    { title: "Thông tin dự án", details: [
      "Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh · Khoa Đào tạo Chất lượng cao",
      "Giảng viên hướng dẫn: TS. Lê Văn Vinh",
      "Nhóm 04: Nguyễn Minh Quốc Khánh, Phạm Minh Khánh, Hoàng Thanh Tú",
    ] },
  ]

  return (
    <>
      {variant === "full" && (
        <section
          className="site-footer-promo-band"
          onClick={() => setShowAppModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setShowAppModal(true) }}
          aria-label="Cà phê miễn phí tặng bồ tèo có app! Tải ứng dụng Trọ Ơi"
        >
          <div className="container">
            <img
              src="/images/banners/banner-app-coffee-mascot.jpg"
              alt="Cà phê miễn phí tặng bồ tèo có app! Trọ Ơi"
              className="site-footer-promo-img"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {showAppModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setShowAppModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center text-[#1e293b]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAppModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              aria-label="Đóng"
            >
              <Icon name="close" size={20} />
            </button>
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#fff2e8] text-[#ea580c]">
              <BrandMark size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1.5">Tải App Trọ Ơi - Nhận Cà Phê Miễn Phí!</h3>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              Quét mã QR để cài đặt ứng dụng Trọ Ơi ngay hôm nay, nhận voucher cà phê sữa đá miễn phí và cập nhật phòng mới sớm nhất!
            </p>

            <div className="mx-auto mb-5 flex size-44 items-center justify-center rounded-2xl border border-[#fed7aa] bg-[#fffaf5] p-3 shadow-inner">
              <svg viewBox="0 0 120 120" className="size-full text-[#1e293b]">
                <rect width="120" height="120" fill="white" rx="8" />
                <rect x="12" y="12" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="17" y="17" width="20" height="20" fill="white" rx="2" />
                <rect x="22" y="22" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="78" y="12" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="83" y="17" width="20" height="20" fill="white" rx="2" />
                <rect x="88" y="22" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="12" y="78" width="30" height="30" fill="#245f3b" rx="4" />
                <rect x="17" y="83" width="20" height="20" fill="white" rx="2" />
                <rect x="22" y="88" width="10" height="10" fill="#245f3b" rx="1" />

                <rect x="48" y="15" width="8" height="8" fill="#e36825" />
                <rect x="60" y="20" width="10" height="6" fill="#1e293b" />
                <rect x="48" y="30" width="6" height="14" fill="#1e293b" />
                <rect x="58" y="32" width="12" height="10" fill="#e36825" />
                <rect x="15" y="48" width="8" height="14" fill="#1e293b" />
                <rect x="30" y="52" width="12" height="8" fill="#1e293b" />
                <rect x="48" y="52" width="24" height="20" fill="#245f3b" rx="3" />
                <rect x="78" y="52" width="14" height="8" fill="#1e293b" />
                <rect x="98" y="50" width="10" height="12" fill="#e36825" />
                <rect x="48" y="80" width="10" height="12" fill="#1e293b" />
                <rect x="64" y="85" width="12" height="14" fill="#1e293b" />
                <rect x="80" y="80" width="28" height="26" fill="#e36825" rx="3" />
              </svg>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => alert("Ứng dụng Trọ Ơi trên iOS sắp phát hành trên App Store!")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                App Store
              </button>
              <button
                type="button"
                onClick={() => alert("Ứng dụng Trọ Ơi trên Android sắp phát hành trên Google Play!")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#245f3b] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a492d]"
              >
                Google Play
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
    <div className="container">
      <div className="footer-intro">
        <div className="footer-brand">
          <Link className="logo gap-2" to="/"><BrandMark size={34} /><span style={{ color: "inherit" }}>Trọ <span>Ơi</span></span></Link>
          <p>Nền tảng tìm phòng và kết nối cộng đồng người thuê trọ.</p>
        </div>
        <Link className="admin-link" to="/admin/dang-nhap">Trang quản trị</Link>
      </div>

      <div className="footer-columns desktop-footer-columns">
        {groups.map((group) => <div className="footer-column" key={group.title}>
          <h3>{group.title}</h3>
          <FooterGroupContent group={group} />
        </div>)}
      </div>

      <div className="mobile-footer-content">
        <div className="mobile-footer-accordions">
          {groups.map((group) => <details className="footer-column" key={group.title}>
            <summary>{group.title}<Icon name="down" size={18} /></summary>
            <FooterGroupContent group={group} />
          </details>)}
        </div>
      </div>

      <div className="footer-legal">{legalText}</div>
    </div>
  </footer>
    </>
  )
}