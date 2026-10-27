import { useEffect, useRef, useState } from "react"
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

const forumFallbackImage = "/images/tromoi/p301-quang-trung/anh-01.webp"

type PopularDistrict = {
  id: string
  name: string
  image: string
  query: string
  roomCount: string
  priceRange: string
  highlight: string
}

const POPULAR_DISTRICTS: PopularDistrict[] = [
  {
    id: "binh-thanh",
    name: "Quận Bình Thạnh",
    image: "/images/rooms/city-window.jpg",
    query: "Quận Bình Thạnh",
    roomCount: "450+ phòng",
    priceRange: "Từ 3.2 – 6.5 tr/tháng",
    highlight: "Gần ĐH Ngoại Thương, HUTECH, GTVT, Văn Lang",
  },
  {
    id: "go-vap",
    name: "Quận Gò Vấp",
    image: "/images/rooms/compact-color-room.jpg",
    query: "Quận Gò Vấp",
    roomCount: "380+ phòng",
    priceRange: "Từ 2.5 – 4.8 tr/tháng",
    highlight: "Gần ĐH Công Nghiệp (IUH), CV Gia Định, Sân bay",
  },
  {
    id: "quan-10",
    name: "Quận 10 & Quận 3",
    image: "/images/rooms/blue-bedroom.jpg",
    query: "Quận 10",
    roomCount: "290+ phòng",
    priceRange: "Từ 3.8 – 7.5 tr/tháng",
    highlight: "Gần ĐH Bách Khoa, Kinh Tế (UEH), Y Dược TP.HCM",
  },
  {
    id: "thu-duc",
    name: "TP. Thủ Đức",
    image: "/images/rooms/scandinavian-room.jpg",
    query: "TP. Thủ Đức",
    roomCount: "520+ phòng",
    priceRange: "Từ 2.0 – 5.0 tr/tháng",
    highlight: "Làng ĐH Quốc Gia, ĐH SP Kỹ Thuật, Nông Lâm",
  },
  {
    id: "quan-7",
    name: "Quận 7",
    image: "/images/rooms/studio-kitchen.jpg",
    query: "Quận 7",
    roomCount: "310+ phòng",
    priceRange: "Từ 3.5 – 7.0 tr/tháng",
    highlight: "Gần ĐH Tôn Đức Thắng, RMIT, ĐH Tài chính - Marketing",
  },
  {
    id: "tan-binh",
    name: "Quận Tân Bình",
    image: "/images/rooms/wood-accent-room.jpg",
    query: "Quận Tân Bình",
    roomCount: "260+ phòng",
    priceRange: "Từ 2.8 – 5.5 tr/tháng",
    highlight: "Khu Sân bay Tân Sơn Nhất, CV Hoàng Văn Thụ",
  },
]

type HomeFilterOption = { value: string; label: string }

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
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer)
    window.addEventListener("keydown", closeOnEscape)
    return () => {
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
      >
        <div className="home-filter-value-group">
          {icon && <Icon name={icon} size={16} />}
          <span>{selectedOption?.label ?? "Chọn mức lọc"}</span>
        </div>
        <span className={`home-filter-chevron${open ? " is-flipped" : ""}`} aria-hidden="true">
          <Icon name="chevronDown" size={15} />
        </span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="home-filter-menu"
          role="listbox"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
            const menuOptions = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=option]")
            if (!menuOptions?.length) return
            event.preventDefault()
            const currentIndex = Array.from(menuOptions).indexOf(document.activeElement as HTMLButtonElement)
            const direction = event.key === "ArrowDown" ? 1 : -1
            const nextIndex = currentIndex < 0
              ? (direction > 0 ? 0 : menuOptions.length - 1)
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
        </div>
      )}
    </div>
  )
}

function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { listings, categories, posts } = usePlatform()
  const roomTypes = categories.filter((item) => item.type === "Loại phòng" && item.status === "active").map((item) => item.name)
  const availableRooms = listings.filter((room) => room.status === "active")
  const roomTypeCounts = availableRooms.reduce<Map<string, number>>((counts, room) => {
    counts.set(room.type, (counts.get(room.type) ?? 0) + 1)
    return counts
  }, new Map())
  const featuredRoom = availableRooms[0]
  const latestPosts = [...posts]
    .filter((post) => post.status === "active")
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 4)
  const [location, setLocation] = useState("TP. Hồ Chí Minh")
  const [maxPrice, setMaxPrice] = useState("")
  const [areaRange, setAreaRange] = useState("all")
  const [nearbyMessage, setNearbyMessage] = useState("")
  const landlordProgramUrl = user?.role === "landlord" ? "/chu-tro/dang-tin" : user ? "/chu-tro/dang-tin" : "/dang-nhap"

  const buildSearchUrl = (roomType?: string) => {
    const params = new URLSearchParams()
    if (roomType) params.set("type", roomType)
    else {
      if (location) params.set("location", location)
      if (maxPrice) params.set("maxPrice", maxPrice)
      if (areaRange !== "all") params.set("areaRange", areaRange)
    }
    return `/tim-phong?${params.toString()}`
  }

  const runSearch = () => navigate(buildSearchUrl())

  const searchNearby = (radiusKm = 20) => {
    setNearbyMessage("")
    if (!navigator.geolocation) {
      setNearbyMessage("Trình duyệt chưa hỗ trợ tìm phòng theo vị trí.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams()
        params.set("location", location || "TP. Hồ Chí Minh")
        params.set("lat", String(coords.latitude))
        params.set("lng", String(coords.longitude))
        params.set("radiusKm", String(radiusKm))
        navigate(`/tim-phong?${params.toString()}`)
      },
      () =>
        setNearbyMessage(
          "Chưa lấy được vị trí. Bạn có thể nhập khu vực để tìm phòng.",
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  }
  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <div className={`hero-intro-grid${featuredRoom ? " has-featured-room" : ""}`}>
            <div className="hero-copy">
              <h1>Tìm phòng hợp túi tiền, gần nơi bạn cần.</h1>
              <p>Lọc theo khu vực, giá và diện tích. Xem ảnh cùng thông tin phòng trước khi liên hệ chủ trọ.</p>
            </div>
            {featuredRoom && (
              <Link
                className="hero-room-card"
                to={`/phong/${featuredRoom.id}`}
                aria-label={`Xem phòng ${featuredRoom.title}`}
              >
                <img src={featuredRoom.image} alt={featuredRoom.title} />
                <div className="hero-room-details">
                  <div className="hero-room-overline">
                    <span>Tin đang mở</span>
                    <span>{featuredRoom.type} · {featuredRoom.area}</span>
                  </div>
                  <h2>{featuredRoom.title}</h2>
                  <p className="hero-room-location"><Icon name="pin" size={15} />{featuredRoom.location}</p>
                  <p className="hero-room-price">{featuredRoom.price}<small> / tháng</small></p>
                </div>
              </Link>
            )}
          </div>
          <div className="search-panel">
            <div className="search-panel-tabs">
              <div className="search-panel-tab-active">
                <Icon name="home" size={17} />
                <span>Phòng cho thuê</span>
              </div>
              <button
                type="button"
                className="search-panel-near-me"
                onClick={() => searchNearby()}
                title="Tìm phòng trọ gần vị trí GPS của bạn"
              >
                <Icon name="pin" size={14} />
                <span>Tìm phòng gần tôi</span>
              </button>
            </div>
            <div className="hero-fields">
              <div className="hero-location-field">
                <span>Khu vực</span>
                <LocationPicker value={location} onChange={setLocation} showNearby onSearchNearby={searchNearby} />
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
              <button type="button" className="hero-search-btn" onClick={runSearch}>
                <Icon name="search" size={18} />
                <span>Tìm kiếm</span>
              </button>
            </div>
            {nearbyMessage && <p className="nearby-message" role="status">{nearbyMessage}</p>}
          </div>
        </div>
      </section>

      <section className="home-browse-section">
        <div className="container quick-section">
          <div className="chips">
            {roomTypes.map((item, i) => (
              <button
                key={item}
                className="chip"
                onClick={() => navigate(buildSearchUrl(item))}
              >
                <span><Icon name={["building", "home", "users", "building", "home"][i] ?? "building"} size={17}/></span>
                {item}<small className="chip-count">{roomTypeCounts.get(item) ?? 0}</small>
              </button>
            ))}
          </div>
          <SectionTitle
            title="Phòng bạn có thể xem"
            action="Xem tất cả"
            onAction={() => navigate("/tim-phong")}
          />
          <div className="room-grid">
            {availableRooms.slice(0, 8).map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onClick={() => navigate(`/phong/${room.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="home-districts-section" aria-labelledby="home-districts-title">
        <div className="container">
          <div className="section-head-with-subtitle">
            <div>
              <span className="section-eyebrow">Địa điểm nổi bật</span>
              <h2 id="home-districts-title" className="section-heading">Khu vực thuê phòng phổ biến tại TP. Hồ Chí Minh</h2>
              <p className="section-subtext">Các quận tập trung nhiều trường đại học lớn, khu văn phòng và giao thông thuận tiện</p>
            </div>
            <Link to="/tim-phong" className="section-view-all">
              <span>Xem tất cả khu vực</span>
              <Icon name="chevron" size={16} />
            </Link>
          </div>

          <div className="districts-grid">
            {POPULAR_DISTRICTS.map((district) => (
              <div
                key={district.id}
                className="district-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/tim-phong?location=${encodeURIComponent(district.query)}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navigate(`/tim-phong?location=${encodeURIComponent(district.query)}`)
                  }
                }}
              >
                <div className="district-media">
                  <img
                    src={district.image}
                    alt={`Phòng trọ tại ${district.name}`}
                    loading="lazy"
                  />
                  <div className="district-media-gradient" />
                  <span className="district-count-badge">
                    <Icon name="home" size={13} />
                    {district.roomCount}
                  </span>
                </div>
                <div className="district-info">
                  <div className="district-title-row">
                    <h3 className="district-name">{district.name}</h3>
                    <span className="district-price">{district.priceRange}</span>
                  </div>
                  <p className="district-highlight">
                    <Icon name="pin" size={14} />
                    <span>{district.highlight}</span>
                  </p>
                  <div className="district-footer">
                    <span className="district-explore-link">
                      Khám phá phòng ngay <Icon name="chevron" size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-landlord-section" aria-labelledby="home-landlord-title">
        <div className="container">
          <div className="landlord-cta-container">
            <div className="landlord-cta-content">
              <span className="landlord-badge">Dành cho chủ trọ & người quản lý</span>
              <h2 id="home-landlord-title">Bạn có phòng trọ, căn hộ trống cần cho thuê?</h2>
              <p className="landlord-desc">
                Đăng tin tiếp cận hơn <strong>50.000+</strong> lượt tìm kiếm mỗi tháng từ sinh viên và người đi làm tại TP.HCM. Kết nối trực tiếp, hẹn xem phòng ngay trên hệ thống mà không qua trung gian hay chi phí ẩn.
              </p>

              <div className="landlord-features-list">
                <div className="landlord-feature-item">
                  <div className="feature-icon-wrapper">
                    <Icon name="check" size={15} />
                  </div>
                  <div className="feature-text">
                    <strong>Đăng tin nhanh & thuận tiện</strong>
                    <span>Chỉ 3 phút tạo tin với hình ảnh, giá điện nước và tiện ích rõ ràng.</span>
                  </div>
                </div>

                <div className="landlord-feature-item">
                  <div className="feature-icon-wrapper">
                    <Icon name="chat" size={15} />
                  </div>
                  <div className="feature-text">
                    <strong>Nhắn tin & đặt lịch trực tiếp</strong>
                    <span>Trao đổi trực tiếp với khách thuê thật, chủ động xếp lịch xem phòng.</span>
                  </div>
                </div>

                <div className="landlord-feature-item">
                  <div className="feature-icon-wrapper">
                    <Icon name="shield" size={15} />
                  </div>
                  <div className="feature-text">
                    <strong>Kiểm duyệt minh bạch, uy tín</strong>
                    <span>Hệ thống gắn nhãn phòng chính chủ, gia tăng độ tin cậy và tỷ lệ lấp phòng.</span>
                  </div>
                </div>
              </div>

              <div className="landlord-actions">
                <Link to={landlordProgramUrl} className="btn-landlord-primary">
                  <span>Đăng tin cho thuê ngay</span>
                  <Icon name="chevron" size={16} />
                </Link>
                <Link to="/dien-dan" className="btn-landlord-secondary">
                  <Icon name="chat" size={15} />
                  <span>Kinh nghiệm cho thuê</span>
                </Link>
              </div>
            </div>

            <div className="landlord-cta-visual">
              <div className="landlord-stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-dot" />
                  <span>Hiệu quả kết nối trên Trọ Ơi</span>
                </div>

                <div className="stat-metrics-grid">
                  <div className="stat-metric-item">
                    <div className="metric-number">50K+</div>
                    <div className="metric-label">Lượt tìm kiếm/tháng</div>
                  </div>
                  <div className="stat-metric-item">
                    <div className="metric-number">95%</div>
                    <div className="metric-label">Có khách trong 2 tuần</div>
                  </div>
                  <div className="stat-metric-item">
                    <div className="metric-number">100%</div>
                    <div className="metric-label">Khách thuê trực tiếp</div>
                  </div>
                  <div className="stat-metric-item">
                    <div className="metric-number">0đ</div>
                    <div className="metric-label">Không phí môi giới</div>
                  </div>
                </div>

                <div className="landlord-tip-box">
                  <div className="tip-header">
                    <Icon name="star" size={14} />
                    <span>Mẹo cho chủ trọ:</span>
                  </div>
                  <p>Phòng có 4–6 ảnh chụp thực tế và chi phí điện nước rõ ràng giúp tăng gấp 3 lần lượt liên hệ xem phòng.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container community-preview">
        <SectionTitle
          title="Kinh nghiệm thuê trọ gần đây"
          action="Vào diễn đàn"
          onAction={() => navigate("/dien-dan")}
        />
        {latestPosts.length ? (
          <div className="story-grid">
            <Link className="featured-story" to={`/bai-viet/${latestPosts[0].id}`}>
              <div className="featured-story-photo">
                <img
                  src={latestPosts[0].image || forumFallbackImage}
                  alt={`Ảnh minh họa bài viết của ${latestPosts[0].name}`}
                  onError={(event) => { event.currentTarget.src = forumFallbackImage }}
                />
              </div>
              <div className="featured-story-body">
                <span className="featured-story-badge">Chia sẻ từ {latestPosts[0].name}</span>
                <h3 className="featured-story-title">{latestPosts[0].content}</h3>
                <div className="featured-story-meta">
                  <span>{latestPosts[0].time}</span>
                  <span>·</span>
                  <span>{latestPosts[0].likes} lượt thích</span>
                  <span>·</span>
                  <span>{latestPosts[0].commentsCount} bình luận</span>
                </div>
                <span className="featured-story-cta">
                  Đọc tiếp <Icon name="chevron" size={14} />
                </span>
              </div>
            </Link>
            <div className="story-list">
              {latestPosts.slice(1, 4).map((post) => (
                <Link to={`/bai-viet/${post.id}`} key={post.id} className="story-item">
                  <span className="story-avatar">
                    {post.avatarUrl ? <img className="user-avatar-image" src={post.avatarUrl} alt="" /> : post.initials}
                  </span>
                  <div className="story-item-body">
                    <span className="story-item-author">{post.name}</span>
                    <p className="story-item-text">{post.content}</p>
                    <small className="story-item-meta">{post.time} · {post.commentsCount} bình luận</small>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : <div className="home-forum-empty"><p>Chưa có bài viết nào được đăng.</p><button onClick={() => navigate("/dien-dan")}>Mở diễn đàn <Icon name="chevron" size={16}/></button></div>}
      </section>
    </main>
  )
}

export default Home
