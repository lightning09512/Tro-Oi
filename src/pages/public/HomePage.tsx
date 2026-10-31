import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router"
import {
  Button,
  Icon,
  RoomCard,
  SectionTitle,
} from "@/components/common/legacy"
import { useNavigate } from "react-router"
import { usePlatform } from "@/contexts/PlatformContext"
import LocationPicker from "@/components/common/LocationPicker"
import useAuth from "@/hooks/useAuth"
import { RoomCardSkeletonGrid } from "@/components/common/Skeletons"

const forumFallbackImage = "/images/tromoi/p301-quang-trung/anh-01.webp"

const HERO_COMMUNITY_QUOTES = [
  {
    id: "quote-1",
    className: "hero-quote-left-top",
    avatar: "/images/avatars/demo-renter-01.jpg",
    quote: "Đường này rộng rãi, xe hơi vào còn đ...",
    author: "Anh Lộc · Shipper giao đồ",
  },
  {
    id: "quote-2",
    className: "hero-quote-left-bottom",
    avatar: "/images/avatars/demo-renter-02.jpg",
    quote: "Chấp mưa to gió lớn khu này chả ngập...",
    author: "Mai Phương · SV Ngoại Thương",
  },
  {
    id: "quote-3",
    className: "hero-quote-right-top",
    avatar: "/images/avatars/demo-owner-01.jpg",
    quote: "Khu này muốn mua gì cũng có, hong sợ thiếu gì",
    author: "Cô Thủy · Bán trái cây",
  },
  {
    id: "quote-4",
    className: "hero-quote-right-bottom",
    avatar: "/images/avatars/demo-renter-03.jpg",
    quote: "Phòng đúng ảnh 100%, an tâm đặt cọc",
    author: "Thanh Tùng · NV Văn phòng",
  },
]

type HomeFilterOption = { value: string; label: string }

const LOCATION_OPTIONS: HomeFilterOption[] = [
  { value: "TP. Hồ Chí Minh", label: "TP. Hồ Chí Minh" },
  { value: "Hà Nội", label: "Hà Nội" },
  { value: "Đà Nẵng", label: "Đà Nẵng" },
  { value: "Bình Dương", label: "Bình Dương" },
  { value: "Bình Thạnh", label: "Bình Thạnh (TP.HCM)" },
  { value: "Gò Vấp", label: "Gò Vấp (TP.HCM)" },
  { value: "Quận 7", label: "Quận 7 (TP.HCM)" },
  { value: "Quận 10", label: "Quận 10 (TP.HCM)" },
  { value: "Tân Bình", label: "Tân Bình (TP.HCM)" },
  { value: "Thủ Đức", label: "TP. Thủ Đức" },
  { value: "Phú Nhuận", label: "Phú Nhuận (TP.HCM)" },
  { value: "Cầu Giấy", label: "Cầu Giấy (Hà Nội)" },
  { value: "Đống Đa", label: "Đống Đa (Hà Nội)" },
  { value: "Nam Từ Liêm", label: "Nam Từ Liêm (Hà Nội)" },
  { value: "Hải Châu", label: "Hải Châu (Đà Nẵng)" },
  { value: "", label: "Tất cả khu vực" },
]

function HomeFilterDropdown({
  label,
  value,
  options,
  onChange,
  icon,
}: {
  label: string
  value: string
  options: HomeFilterOption[]
  onChange: (value: string) => void
  icon?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
    width: number
    maxHeight: number
  }>({ top: 0, left: 0, width: 220, maxHeight: 280 })
  const selectedOption =
    options.find((option) => option.value === value) ??
    (value ? { value, label: value } : options.find((option) => option.value === "") ?? options[0])

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const anchor = rootRef.current?.closest<HTMLElement>(".home-filter-field") ?? rootRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 24)
      const approxHeight = Math.min(280, options.length * 42 + 16)
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      let top = rect.bottom + 6
      if (spaceBelow < approxHeight && spaceAbove > approxHeight) {
        top = Math.max(12, rect.top - approxHeight - 6)
      }

      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
      const maxHeight = Math.min(280, window.innerHeight - 24)

      setMenuPosition({
        top,
        left,
        width,
        maxHeight,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const focusFrame = requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    )
    document.addEventListener("pointerdown", closeOnOutsidePointer)
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`home-filter-control${open ? " is-open" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="home-filter-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <div className="home-filter-value-group">
          {icon && <Icon name={icon} size={16} />}
          <span>{selectedOption?.label ?? "Chọn mức lọc"}</span>
        </div>
        <span className={`home-filter-chevron${open ? " is-flipped" : ""}`} aria-hidden="true">
          <Icon name="chevronDown" size={15} />
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="home-filter-menu is-portal"
            role="listbox"
            aria-label={label}
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
              maxHeight: `${menuPosition.maxHeight}px`,
              zIndex: 99999,
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
              const menuOptions = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]")
              if (!menuOptions?.length) return
              event.preventDefault()
              const currentIndex = Array.from(menuOptions).indexOf(document.activeElement as HTMLButtonElement)
              const direction = event.key === "ArrowDown" ? 1 : -1
              const nextIndex =
                currentIndex < 0
                  ? direction > 0
                    ? 0
                    : menuOptions.length - 1
                  : (currentIndex + direction + menuOptions.length) % menuOptions.length
              menuOptions[nextIndex]?.focus()
            }}
          >
            {options.map((option) => {
              const selected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`home-filter-option${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                >
                  <span>{option.label}</span>
                  {selected && (
                    <span className="home-filter-check" aria-hidden="true">
                      <Icon name="check" size={14} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listings, categories, posts, connectionState } = usePlatform()
  const roomTypes = categories.filter((item) => item.type === "Loại phòng" && item.status === "active" && item.name !== "Chuyển nhượng").map((item) => item.name)
  const availableRooms = listings.filter((room) => room.status === "active" && room.type !== "Chuyển nhượng")
  const roomTypeCounts = availableRooms.reduce<Map<string, number>>((counts, room) => counts.set(room.type, (counts.get(room.type) ?? 0) + 1), new Map())
  const featuredRoom = availableRooms.find((room) => room.location.includes("Hồ Chí Minh")) ?? availableRooms[0]
  const latestPosts = [...posts].filter((post) => post.status === "active").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4)
  const locations = useMemo(() => {
    const groups = new Map<string, typeof availableRooms>()
    availableRooms.forEach((room) => {
      const city = room.location.split(",").map((part) => part.trim()).filter(Boolean).at(-1)
      if (city) groups.set(city, [...(groups.get(city) ?? []), room])
    })
    return [...groups].sort((a, b) => b[1].length - a[1].length).slice(0, 6)
  }, [listings])
  const [location, setLocation] = useState("TP. Hồ Chí Minh")
  const [maxPrice, setMaxPrice] = useState("")
  const [areaRange, setAreaRange] = useState("all")
  const [keyword, setKeyword] = useState("")
  const [activeTab, setActiveTab] = useState<"rental" | "roommate" | "apartment" | "house">("rental")
  const [partnerModalOpen, setPartnerModalOpen] = useState(false)
  const landlordProgramUrl = user?.role === "landlord" ? "/chu-tro/dang-tin" : user ? "/chu-tro/dang-tin" : "/dang-nhap"

  const promoCampaigns = useMemo(() => [
    {
      id: "review-mascot-campaign",
      tag: "Chiến dịch cộng đồng · Nhận quà liền tay",
      image: "/images/banners/banner-review-mascot-promo.jpg",
      title: "Review khu trọ bạn biết - Nhận ngay Voucher quà tặng & ăn uống cực xịn!",
      description: "Chia sẻ trải nghiệm thực tế về phòng trọ, hàng quán, an ninh khu phố để nhận ngay voucher trà sữa, gà rán và rinh ưu đãi thuê trọ độc quyền trên Trọ Ơi.",
      buttonText: "Viết review ngay",
      link: "/dien-dan",
    },
    {
      id: "landlord-campaign",
      tag: "Chương trình dành cho chủ trọ",
      image: "/images/banners/banner-nhatot-style.jpg",
      title: "Đăng tin cho thuê trên Trọ Ơi - Tiếp cận hơn 50.000+ người thuê mỗi tháng",
      description: "Đăng tin hoàn toàn miễn phí, kết nối người thuê trực tiếp không qua trung gian. Hệ thống hỗ trợ gắn nhãn chính chủ xác thực và quản lý lịch hẹn thông minh!",
      buttonText: "Đăng tin ngay",
      link: landlordProgramUrl,
    },
    {
      id: "renter-campaign",
      tag: "Ưu đãi sinh viên & người thuê",
      image: "/images/banners/banner-student-nhatot.jpg",
      title: "Rủ bạn cùng tìm phòng trên Trọ Ơi - Nhận trọn ưu đãi tiện ích",
      description: "Khám phá hàng ngàn phòng trọ gần các trường đại học lớn tại TP.HCM, xem ảnh thật, giá điện nước minh bạch và hẹn xem phòng tiện lợi ngay trên hệ thống!",
      buttonText: "Tìm phòng ngay",
      link: "/tim-phong",
    },
    {
      id: "community-campaign",
      tag: "Cộng đồng & Tìm ở ghép",
      image: "/images/banners/banner-roommate-community.jpg",
      title: "Tìm bạn ở ghép & Pass phòng trên Diễn đàn Trọ Ơi",
      description: "Kết nối bạn cùng phòng lý tưởng, pass phòng sang nhượng cọc nhanh chóng và chia sẻ kinh nghiệm thuê trọ thực tế từ cộng đồng.",
      buttonText: "Tham gia diễn đàn",
      link: "/dien-dan",
    },
    {
      id: "verified-campaign",
      tag: "Phòng trọ xác thực 100%",
      image: "/images/banners/banner-verified-safety.jpg",
      title: "Phòng trọ chính chủ xác thực - An tâm đặt cọc, không lo tin ảo",
      description: "Trọ Ơi cam kết 100% tin phòng được kiểm duyệt thông tin, giá thuê minh bạch, hỗ trợ xem phòng trực tiếp và bảo vệ quyền lợi người thuê.",
      buttonText: "Khám phá ngay",
      link: "/tim-phong",
    },
  ], [landlordProgramUrl])

  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0)
  const [isCarouselHovered, setIsCarouselHovered] = useState(false)
  const currentCampaign = promoCampaigns[activeCampaignIndex] ?? promoCampaigns[0]
  const touchStartXRef = useRef<number | null>(null)

  const handlePrevCampaign = () => {
    setActiveCampaignIndex((prev) => (prev - 1 + promoCampaigns.length) % promoCampaigns.length)
  }

  const handleNextCampaign = () => {
    setActiveCampaignIndex((prev) => (prev + 1) % promoCampaigns.length)
  }

  useEffect(() => {
    if (isCarouselHovered) return
    const timer = setInterval(() => {
      setActiveCampaignIndex((prev) => (prev + 1) % promoCampaigns.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isCarouselHovered, promoCampaigns.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartXRef.current - touchEndX
    if (diff > 45) {
      handleNextCampaign()
    } else if (diff < -45) {
      handlePrevCampaign()
    }
    touchStartXRef.current = null
  }

  const buildSearchUrl = (roomType?: string) => {
    const params = new URLSearchParams()
    if (roomType) params.set("type", roomType)
    else {
      if (keyword.trim()) params.set("q", keyword.trim())
      if (location) params.set("location", location)
      if (maxPrice) params.set("maxPrice", maxPrice)
      if (areaRange !== "all") params.set("areaRange", areaRange)
    }
    return `/tim-phong?${params.toString()}`
  }
  const postingLink = user?.role === "landlord" ? "/chu-tro/dang-tin" : user?.role === "admin" ? "/admin/tin-cho-thue" : user ? "/dien-dan" : "/dang-nhap"

  return (
    <main className="public-home">
      <section className="hero-nhatot-banner" aria-label="Tìm kiếm phòng trọ">
        {/* Floating community review stickers on left and right */}
        <div className="hero-quotes-layer" aria-hidden="true">
          {HERO_COMMUNITY_QUOTES.map((item) => (
            <div key={item.id} className={`hero-quote-pill ${item.className}`}>
              <img src={item.avatar} alt="" className="hero-quote-avatar" />
              <div className="hero-quote-text">
                <span className="hero-quote-speech">{item.quote}</span>
                <span className="hero-quote-author">{item.author}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="container hero-nhatot-content">
          <h1 className="hero-nhatot-slogan">Phòng vừa ý, giá hợp lý!</h1>
          <p className="hero-nhatot-subtitle">
            Hơn 50.000+ phòng trọ, căn hộ mini & người ở ghép xác thực 100%
          </p>

          <div className="hero-nhatot-tabs" role="tablist">
            <button
              type="button"
              className={`hero-nhatot-tab-btn${activeTab === "rental" ? " is-active" : ""}`}
              onClick={() => setActiveTab("rental")}
            >
              Cho thuê phòng
            </button>
            <button
              type="button"
              className={`hero-nhatot-tab-btn${activeTab === "roommate" ? " is-active" : ""}`}
              onClick={() => navigate("/dien-dan")}
            >
              Tìm ở ghép
            </button>
            <button
              type="button"
              className={`hero-nhatot-tab-btn${activeTab === "apartment" ? " is-active" : ""}`}
              onClick={() => navigate(`/tim-phong?type=${encodeURIComponent("Căn hộ mini")}`)}
            >
              Căn hộ mini
            </button>
            <button
              type="button"
              className={`hero-nhatot-tab-btn${activeTab === "house" ? " is-active" : ""}`}
              onClick={() => navigate(`/tim-phong?type=${encodeURIComponent("Nhà nguyên căn")}`)}
            >
              Nhà nguyên căn
            </button>
          </div>

          <form
            className="hero-nhatot-searchbar"
            onSubmit={(e) => {
              e.preventDefault()
              navigate(buildSearchUrl())
            }}
          >
            <div className="hero-search-keyword">
              <span className="hero-search-icon-wrap" aria-hidden="true">
                <Icon name="search" size={18} />
              </span>
              <input
                type="text"
                className="hero-search-input"
                placeholder="Tìm tên phòng, trường học…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                autoComplete="off"
              />
              {keyword && (
                <button
                  type="button"
                  className="hero-search-clear-btn"
                  aria-label="Xóa từ khóa"
                  onClick={() => setKeyword("")}
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </div>
            <div className="home-filter-field">
              <span>Khu vực</span>
              <HomeFilterDropdown
                label="Khu vực tìm phòng"
                value={location}
                onChange={setLocation}
                icon="pin"
                options={LOCATION_OPTIONS}
              />
            </div>
            <div className="home-filter-field">
              <span>Khoảng giá</span>
              <HomeFilterDropdown
                label="Giá thuê tối đa"
                value={maxPrice}
                onChange={setMaxPrice}
                icon="chart"
                options={[
                  { value: "", label: "Mọi mức giá" },
                  { value: "3", label: "Dưới 3 triệu" },
                  { value: "5", label: "Dưới 5 triệu" },
                  { value: "7", label: "Dưới 7 triệu" },
                  { value: "10", label: "Dưới 10 triệu" },
                  { value: "20", label: "Dưới 20 triệu" },
                ]}
              />
            </div>
            <div className="home-filter-field">
              <span>Diện tích</span>
              <HomeFilterDropdown
                label="Diện tích phòng"
                value={areaRange}
                onChange={setAreaRange}
                icon="grid"
                options={[
                  { value: "all", label: "Tất cả diện tích" },
                  { value: "under20", label: "Dưới 20 m²" },
                  { value: "20-30", label: "20–30 m²" },
                  { value: "30-50", label: "Trên 30–50 m²" },
                  { value: "over50", label: "Trên 50 m²" },
                ]}
              />
            </div>
            <button type="submit" className="hero-search-submit-btn">
              <Icon name="search" size={18} />
              <span>Tìm phòng</span>
            </button>
          </form>
        </div>
      </section>

      {/* Quick Navigation Cards & Utility Panels (Nhà Tốt Style) */}
      <section className="hero-category-container">
        <div className="hero-quick-cards-grid">
          <Link to="/tim-phong" className="hero-quick-card">
            <div className="hero-quick-card-icon" style={{ background: "#eaf4ec", color: "#245f3b" }}>
              <Icon name="home" size={24} />
            </div>
            <div className="hero-quick-card-info">
              <h3>Cho thuê</h3>
              <p>55.807 tin cho thuê</p>
            </div>
          </Link>

          <Link to="/dien-dan" className="hero-quick-card">
            <div className="hero-quick-card-icon" style={{ background: "#fff3e8", color: "#e36825" }}>
              <Icon name="users" size={24} />
            </div>
            <div className="hero-quick-card-info">
              <h3>Tìm ở ghép</h3>
              <p>Kết nối bạn cùng phòng</p>
            </div>
          </Link>

          <Link to={`/tim-phong?type=${encodeURIComponent("Căn hộ mini")}`} className="hero-quick-card">
            <div className="hero-quick-card-icon" style={{ background: "#eef2ff", color: "#3b82f6" }}>
              <Icon name="building" size={24} />
            </div>
            <div className="hero-quick-card-info">
              <h3>Căn hộ & Studio</h3>
              <p>5.292 căn hộ tiện nghi</p>
            </div>
          </Link>

          <Link to="/tim-phong" className="hero-quick-card">
            <div className="hero-quick-card-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
              <Icon name="shield" size={24} />
            </div>
            <div className="hero-quick-card-info">
              <h3>Xác thực 100%</h3>
              <p>Chính chủ, không cọc ảo</p>
            </div>
          </Link>
        </div>

        <div className="hero-utility-row">
          <div className="hero-utility-card">
            <div className="hero-utility-header">
              <span className="hero-utility-title">Công cụ tiện ích</span>
            </div>
            <div className="hero-utility-links">
              <Link to="/tim-phong" className="hero-utility-link">
                <Icon name="chart" size={20} />
                <div>
                  <strong>Biểu đồ giá</strong>
                  <small>Tra cứu giá theo quận</small>
                </div>
              </Link>
              <Link to="/dien-dan" className="hero-utility-link">
                <Icon name="chat" size={20} />
                <div>
                  <strong>Kinh nghiệm</strong>
                  <small>Cẩm nang & chia sẻ</small>
                </div>
              </Link>
            </div>
          </div>

          <div className="hero-utility-card">
            <div className="hero-utility-header">
              <span className="hero-utility-title">Dịch vụ dành cho chủ trọ</span>
              <Link to={postingLink} className="hero-utility-viewmore">
                Xem thêm <Icon name="chevron" size={14} />
              </Link>
            </div>
            <div className="hero-utility-links">
              <Link to={postingLink} className="hero-utility-link">
                <span className="hero-utility-badge-hot">Mới</span>
                <Icon name="plus" size={20} />
                <div>
                  <strong>Đăng tin miễn phí</strong>
                  <small>Tiếp cận 50.000+ người</small>
                </div>
              </Link>
              <Link to={postingLink} className="hero-utility-link">
                <Icon name="user" size={20} />
                <div>
                  <strong>Quản lý phòng</strong>
                  <small>Lịch hẹn & tin đăng</small>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Trở thành Đối tác Trọ Ơi (Nhà Tốt Style) CTA Card */}
        <div className="home-partner-cta-card">
          <div className="home-partner-cta-header">
            <h2 className="home-partner-cta-title">
              <span>Trở thành <strong className="home-partner-cta-highlight">Đối tác Trọ Ơi</strong></span>
              <svg className="partner-verified-shield" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-label="Xác thực Đối tác">
                <path d="M12 2L4 5.5v6c0 5 3.4 9.7 8 10.5 4.6-.8 8-5.5 8-10.5v-6L12 2z" fill="#ff5722"/>
                <path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </h2>
          </div>

          <div className="home-partner-benefits-grid">
            {/* 1. Nhãn Đối Tác */}
            <div className="home-partner-benefit-item">
              <div className="home-partner-benefit-icon-wrap">
                <svg width="58" height="58" viewBox="0 0 58 58" fill="none" aria-hidden="true">
                  <rect x="6.5" y="17.5" width="45" height="23" rx="5" fill="#ff5722" />
                  <g transform="translate(10.5, 21.5)">
                    <path
                      d="M4.5 1.5C2.8 1.5 1.5 2.8 1.5 4.5C1.5 7 4.5 11 4.5 11C4.5 11 7.5 7 7.5 4.5C7.5 2.8 6.2 1.5 4.5 1.5Z"
                      fill="#ffffff"
                    />
                    <circle cx="4.5" cy="4.5" r="1.4" fill="#ff5722" />
                  </g>
                  <text
                    x="21"
                    y="33"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    letterSpacing="0.2"
                  >
                    Đối Tác
                  </text>
                </svg>
              </div>
              <div className="home-partner-benefit-content">
                <h4>Nhãn Đối Tác</h4>
                <p>Tăng 40% hiệu quả tin đăng</p>
              </div>
            </div>

            {/* 2. Tin đăng tiếp cận */}
            <div className="home-partner-benefit-item">
              <div className="home-partner-benefit-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect x="5" y="18" width="5.5" height="10" rx="1.8" fill="#ff7a29" />
                  <rect x="13.5" y="13" width="5.5" height="15" rx="1.8" fill="#ff6e1a" />
                  <rect x="22" y="7" width="5.5" height="21" rx="1.8" fill="#ff5722" />
                  <path
                    d="M5 14L13 7.5L19 10.5L27 3"
                    stroke="#ff5722"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 3H27V8"
                    stroke="#ff5722"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="home-partner-benefit-content">
                <h4>Tin đăng tiếp cận</h4>
                <p>Hơn 40 triệu người mua tiềm năng</p>
              </div>
            </div>

            {/* 3. Tài Khoản Doanh Nghiệp */}
            <div className="home-partner-benefit-item">
              <div className="home-partner-benefit-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="22" rx="2.5" fill="#ff6e1a" />
                  <circle cx="8.5" cy="10" r="1.3" fill="#ffffff" />
                  <circle cx="15.5" cy="10" r="1.3" fill="#ffffff" />
                  <circle cx="8.5" cy="15" r="1.3" fill="#ffffff" />
                  <circle cx="15.5" cy="15" r="1.3" fill="#ffffff" />
                  <circle cx="8.5" cy="20" r="1.3" fill="#ffffff" />
                  <circle cx="15.5" cy="20" r="1.3" fill="#ffffff" />
                  <circle cx="23" cy="21" r="6.5" fill="#ffffff" />
                  <circle cx="23" cy="21" r="5.5" fill="#ff5722" />
                  <circle cx="23" cy="19.2" r="1.8" fill="#ffffff" />
                  <path d="M19.8 24.5c.3-1.6 1.7-2.3 3.2-2.3s2.9.7 3.2 2.3" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="home-partner-benefit-content">
                <h4>Tài Khoản Doanh Nghiệp</h4>
                <p>Giúp tăng hiệu quả quản lý</p>
              </div>
            </div>
          </div>

          <div className="home-partner-cta-btn-wrap">
            <button
              type="button"
              className="home-partner-learn-btn"
              onClick={() => setPartnerModalOpen(true)}
            >
              Tìm hiểu chương trình
            </button>
          </div>
        </div>
      </section>

      <section className="home-browse-section" id="home-room-list">
        <div className="container quick-section">
          <nav className="chips" aria-label="Tìm theo loại phòng">{roomTypes.map((item, i) => <button key={item} className="chip" onClick={() => navigate(buildSearchUrl(item))}>
            <Icon name={["building", "home", "users", "building", "home"][i] ?? "building"} size={18}/>{item}<small className="chip-count">{roomTypeCounts.get(item) ?? 0}</small>
          </button>)}</nav>
          <SectionTitle title="Tìm nơi ở phù hợp với bạn" action="Xem tất cả phòng" onAction={() => navigate("/tim-phong")}/>

          {/* Tin đăng từ Đối Tác Trọ Ơi Banner Bar (Placing directly above room cards) */}
          <div className="home-partner-listings-banner">
            <h3 className="home-partner-listings-title">
              <span>Tin đăng từ Đối Tác Trọ Ơi</span>
              <button
                type="button"
                className="home-partner-info-btn"
                aria-label="Thông tin đối tác"
                title="Thông tin chương trình đối tác"
                onClick={() => setPartnerModalOpen(true)}
              >
                <Icon name="info" size={16} />
              </button>
            </h3>
            <div className="home-partner-verified-tags">
              <div className="home-partner-verified-tag">
                <span className="home-partner-check-dot" aria-hidden="true">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Thông tin BĐS chính xác</span>
              </div>
              <div className="home-partner-verified-tag">
                <span className="home-partner-check-dot" aria-hidden="true">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Môi giới được xác minh</span>
              </div>
            </div>
          </div>
          {connectionState === "loading" && !availableRooms.length ? <RoomCardSkeletonGrid count={8}/> : availableRooms.length ? <div className="room-grid">{availableRooms.slice(0, 8).map((room) => <RoomCard key={room.id} room={room} onClick={() => navigate(`/phong/${room.id}`)}/>)}</div> : <div className="public-empty-state"><Icon name="building" size={28}/><h3>{connectionState === "error" ? "Chưa tải được danh sách phòng" : "Chưa có phòng đang hiển thị"}</h3><p>{connectionState === "error" ? "Kiểm tra kết nối và thử tải lại trang để xem các tin mới nhất." : "Bạn có thể quay lại sau hoặc tham gia diễn đàn để chia sẻ nhu cầu tìm phòng."}</p><Button variant="outline" onClick={() => connectionState === "error" ? window.location.reload() : navigate("/dien-dan")}>{connectionState === "error" ? "Tải lại trang" : "Vào diễn đàn"}</Button></div>}
        </div>
      </section>
      {locations.length > 0 && <section className="home-districts-section" aria-labelledby="home-districts-title"><div className="container">
        <div className="section-head-with-subtitle"><div><h2 id="home-districts-title">Khám phá theo khu vực</h2><p>Các khu vực đang có tin cho thuê trên Trọ Ơi.</p></div><Link to="/tim-phong?location=" className="section-view-all">Xem toàn quốc <Icon name="chevron" size={16}/></Link></div>
        <div className="districts-grid">{locations.map(([city, rooms]) => <Link key={city} className="district-card" to={`/tim-phong?location=${encodeURIComponent(city)}`}>
          <div className="district-media"><img src={rooms[0].image} alt={`Phòng cho thuê tại ${city}`} loading="lazy"/><span className="district-count-badge">{rooms.length} tin đang mở</span></div>
          <div className="district-info"><h3>{city}</h3><span className="district-explore-link">Khám phá khu vực <Icon name="chevron" size={16}/></span></div>
        </Link>)}</div>
      </div></section>}
      <section className="home-action-section"><div className="container"><div className="home-action-band"><div><h2>{user?.role === "renter" ? "Tìm bạn ở ghép, chia sẻ chuyện thuê trọ." : "Có một căn phòng đang chờ người ở?"}</h2><p>{user?.role === "renter" ? "Đăng bài trên diễn đàn để tìm bạn cùng phòng hoặc chia sẻ thông tin pass phòng." : "Đăng tin với ảnh và thông tin rõ ràng, quản lý tin và trao đổi với người quan tâm ngay trên Trọ Ơi."}</p></div><Link to={postingLink} className="btn primary">{user?.role === "renter" ? "Vào diễn đàn" : user?.role === "admin" ? "Quản lý tin đăng" : "Bắt đầu đăng tin"}<Icon name="chevron" size={17}/></Link></div></div></section>
      <section className="home-campaign-section" aria-labelledby="home-campaign-title">
        <div className="container">
          <div className="campaign-head">
            <h2 id="home-campaign-title" className="campaign-section-title">Ưu đãi / Chương trình</h2>
          </div>

          <div
            className="campaign-banner-card"
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
          >
            <div
              className="campaign-carousel-viewport"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="campaign-carousel-track"
                style={{
                  transform: `translate3d(-${activeCampaignIndex * 100}%, 0, 0)`,
                  transition: "transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {promoCampaigns.map((campaign, idx) => (
                  <div key={campaign.id} className="campaign-carousel-slide">
                    <Link
                      to={campaign.link}
                      className="campaign-image-link"
                      aria-label={campaign.title}
                    >
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        loading={idx === 0 ? "eager" : "lazy"}
                        draggable="false"
                      />
                    </Link>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="campaign-nav-arrow campaign-nav-prev"
                aria-label="Xem chương trình trước"
                onClick={handlePrevCampaign}
              >
                <Icon name="chevron" size={18} />
              </button>
              <button
                type="button"
                className="campaign-nav-arrow campaign-nav-next"
                aria-label="Xem chương trình tiếp theo"
                onClick={handleNextCampaign}
              >
                <Icon name="chevron" size={18} />
              </button>

              <div className="campaign-dots" role="tablist" aria-label="Danh sách chương trình">
                {promoCampaigns.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === activeCampaignIndex}
                    className={`campaign-dot${idx === activeCampaignIndex ? " is-active" : ""}`}
                    onClick={() => setActiveCampaignIndex(idx)}
                    aria-label={`Chuyển đến chương trình ${idx + 1}`}
                  >
                    <span className="campaign-dot-inner" />
                  </button>
                ))}
              </div>

              <div className="campaign-counter-badge">
                {activeCampaignIndex + 1} / {promoCampaigns.length}
              </div>
            </div>

            <div className="campaign-info-bar" key={currentCampaign.id}>
              <div className="campaign-copy">
                <span className="campaign-tag">{currentCampaign.tag}</span>
                <h3 className="campaign-title">{currentCampaign.title}</h3>
                <p className="campaign-desc">{currentCampaign.description}</p>
              </div>
              <div className="campaign-action">
                <Link to={currentCampaign.link} className="campaign-cta-btn">
                  <span>{currentCampaign.buttonText}</span>
                  <Icon name="chevron" size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container community-preview">
        <SectionTitle title="Chuyện thuê trọ từ cộng đồng" action="Vào diễn đàn" onAction={() => navigate("/dien-dan")}/>
        {latestPosts.length ? <div className="story-grid">
          <Link className="featured-story" to={`/bai-viet/${latestPosts[0].id}`}><div className="featured-story-photo"><img src={latestPosts[0].image || forumFallbackImage} alt={`Ảnh minh họa bài viết của ${latestPosts[0].name}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = forumFallbackImage }}/></div><div className="featured-story-body"><h3 className="featured-story-title">{latestPosts[0].content}</h3><p className="home-story-author">{latestPosts[0].name}</p><div className="featured-story-meta">{latestPosts[0].time} · {latestPosts[0].likes} lượt yêu thích · {latestPosts[0].commentsCount} bình luận</div><span className="featured-story-cta">Đọc bài viết <Icon name="chevron" size={14}/></span></div></Link>
          <div className="story-list">{latestPosts.slice(1).map((post) => <Link to={`/bai-viet/${post.id}`} key={post.id} className="story-item"><span className="story-avatar">{post.avatarUrl ? <img className="user-avatar-image" src={post.avatarUrl} alt=""/> : post.initials}</span><div className="story-item-body"><span className="story-item-author">{post.name}</span><p className="story-item-text">{post.content}</p><small className="story-item-meta">{post.time} · {post.commentsCount} bình luận</small></div></Link>)}</div>
        </div> : <div className="home-forum-empty"><p>{connectionState === "loading" ? "Đang tải bài viết cộng đồng…" : connectionState === "error" ? "Chưa kết nối được diễn đàn. Hãy thử lại sau." : "Chưa có bài viết. Hãy bắt đầu một cuộc trò chuyện cùng cộng đồng."}</p><button onClick={() => navigate("/dien-dan")}>Mở diễn đàn <Icon name="chevron" size={16}/></button></div>}
      </section>

      {/* Partner Program Modal */}
      {partnerModalOpen && (
        <div
          className="partner-modal-backdrop"
          onClick={() => setPartnerModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-dialog-title"
        >
          <div
            className="partner-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="partner-modal-header">
              <div className="partner-modal-title-box">
                <span className="partner-modal-badge">Chương trình độc quyền</span>
                <h3 id="partner-dialog-title">Trở thành Đối tác Trọ Ơi</h3>
                <p>Nâng tầm uy tín và tăng tốc độ tìm kiếm khách thuê phòng hiệu quả nhất</p>
              </div>
              <button
                type="button"
                className="partner-modal-close"
                onClick={() => setPartnerModalOpen(false)}
                aria-label="Đóng cửa sổ"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="partner-modal-body">
              <div className="partner-modal-perk-card">
                <div className="partner-modal-perk-icon">
                  <div className="home-partner-badge-pill">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                    </svg>
                    <span>Đối Tác</span>
                  </div>
                </div>
                <div>
                  <strong>Huy hiệu Đối Tác chính thức</strong>
                  <p>Mỗi tin đăng của bạn đều được gắn huy hiệu xác thực cam nổi bật, thu hút ánh nhìn và tăng hơn 40% tỉ lệ người thuê bấm vào xem chi tiết.</p>
                </div>
              </div>

              <div className="partner-modal-perk-card">
                <div className="partner-modal-perk-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e36825" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M18.5 8.5L13.5 13.5L9.5 9.5L3.5 15.5" />
                    <polyline points="14 8.5 18.5 8.5 18.5 13" />
                  </svg>
                </div>
                <div>
                  <strong>Độ phủ tiếp cận vượt trội</strong>
                  <p>Ưu tiên hiển thị trên trang chủ và danh sách tìm kiếm hàng đầu khu vực. Tiếp cận trực tiếp hàng chục ngàn sinh viên và người đi làm mỗi ngày.</p>
                </div>
              </div>

              <div className="partner-modal-perk-card">
                <div className="partner-modal-perk-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e36825" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="11" height="17" rx="1.5" />
                    <line x1="7" y1="8" x2="7.01" y2="8" strokeWidth="2.5" />
                    <line x1="10" y1="8" x2="10.01" y2="8" strokeWidth="2.5" />
                    <circle cx="18" cy="12" r="3" />
                    <path d="M14.5 19a4 4 0 0 1 7 0" />
                  </svg>
                </div>
                <div>
                  <strong>Bộ công cụ quản lý chuyên nghiệp</strong>
                  <p>Bảng điều khiển trực quan giúp bạn theo dõi lượt xem, quản lý danh sách phòng trống, tiếp nhận yêu cầu hẹn xem phòng và chat trực tiếp với khách.</p>
                </div>
              </div>
            </div>

            <div className="partner-modal-footer">
              <Button
                variant="outline"
                onClick={() => setPartnerModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setPartnerModalOpen(false)
                  navigate(landlordProgramUrl)
                }}
              >
                Tham gia Đối tác ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Home
