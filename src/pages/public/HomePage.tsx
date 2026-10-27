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

type HomeFilterOption = { value: string; label: string }

function HomeFilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: HomeFilterOption[]
  onChange: (value: string) => void
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
        <span>{selectedOption?.label ?? "Chọn mức lọc"}</span>
        <span className="home-filter-chevron" aria-hidden="true">⌄</span>
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
                {selected && <span className="home-filter-check" aria-hidden="true">✓</span>}
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
  const [shareMessage, setShareMessage] = useState("")
  const landlordProgramUrl = user?.role === "landlord" ? "/chu-tro/dang-tin" : "/dang-ky"

  const shareTroOi = async () => {
    const shareUrl = `${window.location.origin}/dang-ky`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareMessage("Đã sao chép liên kết Trọ Ơi để bạn chia sẻ.")
    } catch {
      setShareMessage("Không thể sao chép tự động. Hãy sao chép địa chỉ trang Trọ Ơi trên thanh trình duyệt.")
    }
  }

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
              <span className="eyebrow home-hero-kicker">Tìm phòng cùng Trọ Ơi</span>
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
              <h2 className="search-panel-tab">Phòng cho thuê</h2>
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
                  options={[
                    { value: "all", label: "Tất cả diện tích" },
                    { value: "under20", label: "Dưới 20 m²" },
                    { value: "20-30", label: "20–30 m²" },
                    { value: "30-50", label: "Trên 30–50 m²" },
                    { value: "over50", label: "Trên 50 m²" },
                  ]}
                />
              </div>
              <Button onClick={runSearch} icon="search">
                Tìm kiếm
              </Button>
            </div>
            <button className="near-me" onClick={searchNearby}>
              <Icon name="pin" size={17} /> Tìm phòng gần tôi
            </button>
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
            eyebrow="Tin cho thuê đang mở"
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

      <section className="home-promotions" aria-labelledby="home-promotions-title">
        <div className="container">
          <div className="promotion-panel">
            <div className="promotion-banner">
              <div className="promotion-copy">
                <span className="promotion-eyebrow">Ưu đãi / Chương trình</span>
                <h2 id="home-promotions-title">Khởi đầu dễ dàng cùng Trọ Ơi</h2>
                <p>Tìm phòng, đăng tin và kết nối ngay trên một nền tảng. Các tính năng hiện có của Trọ Ơi đang được sử dụng miễn phí.</p>
                <Link className="promotion-primary" to={landlordProgramUrl}>Đăng tin miễn phí <Icon name="chevron" size={16}/></Link>
              </div>
              <div className="promotion-art" aria-hidden="true">
                <span className="promotion-spark promotion-spark-one">✦</span>
                <span className="promotion-spark promotion-spark-two">✧</span>
                <div className="promotion-ticket"><small>TRỌ ƠI</small><strong>0đ</strong><span>phí đăng tin</span></div>
                <div className="promotion-art-note">Tìm phòng<br/>Dễ dàng hơn</div>
              </div>
            </div>
            <div className="promotion-programs" id="chuong-trinh-chi-tiet">
              <article className="promotion-card">
                <span className="promotion-card-icon" aria-hidden="true">⌂</span>
                <div><span className="promotion-card-label">Dành cho chủ trọ</span><h3>Đăng tin cho thuê miễn phí</h3><p>Thêm ảnh, giá và tiện ích để người thuê dễ tìm thấy phòng của bạn. Tin đăng được duyệt trước khi hiển thị.</p><Link to={landlordProgramUrl}>Bắt đầu đăng tin <Icon name="chevron" size={15}/></Link></div>
              </article>
              <article className="promotion-card">
                <span className="promotion-card-icon" aria-hidden="true">♡</span>
                <div><span className="promotion-card-label">Dành cho người thuê</span><h3>Tìm và lưu phòng yêu thích</h3><p>Lọc theo khu vực, giá và diện tích; lưu lại những lựa chọn phù hợp để xem sau.</p><Link to="/tim-phong">Khám phá phòng <Icon name="chevron" size={15}/></Link></div>
              </article>
              <article className="promotion-card">
                <span className="promotion-card-icon" aria-hidden="true">↗</span>
                <div><span className="promotion-card-label">Chia sẻ Trọ Ơi</span><h3>Rủ bạn cùng tìm nơi ở</h3><p>Gửi đường dẫn đăng ký cho bạn bè đang tìm phòng hoặc muốn đăng tin cho thuê.</p><button type="button" onClick={shareTroOi}>Sao chép liên kết <Icon name="chevron" size={15}/></button></div>
              </article>
            </div>
            {shareMessage && <p className="promotion-share-message" role="status">{shareMessage}</p>}
            <p className="promotion-terms">Chương trình áp dụng cho các tính năng hiện có trên Trọ Ơi. Không bao gồm quà tặng hoặc tiền thưởng giới thiệu.</p>
          </div>
        </div>
      </section>

      <section className="container community-preview">
        <SectionTitle
          eyebrow="Từ diễn đàn"
          title="Kinh nghiệm thuê trọ gần đây"
          action="Vào diễn đàn"
          onAction={() => navigate("/dien-dan")}
        />
        {latestPosts.length ? <div className="story-grid">
          <Link className="featured-story" to={`/bai-viet/${latestPosts[0].id}`}>
            <img
              src={latestPosts[0].image || forumFallbackImage}
              alt={`Ảnh minh họa cho bài viết của ${latestPosts[0].name}`}
              onError={(event) => { event.currentTarget.src = forumFallbackImage }}
            />
            <div>
              <span>Chia sẻ từ {latestPosts[0].name}</span>
              <h2>{latestPosts[0].content}</h2>
              <small>{latestPosts[0].time} · {latestPosts[0].likes} lượt thích · {latestPosts[0].commentsCount} bình luận</small>
            </div>
          </Link>
          <div className="story-list">
            {latestPosts.slice(1, 4).map((post) => (
              <Link to={`/bai-viet/${post.id}`} key={post.id}>
                <span className="story-avatar">{post.initials}</span>
                <div>
                  <span>{post.name}</span>
                  <h3>{post.content}</h3>
                  <small>{post.time} · {post.commentsCount} bình luận</small>
                </div>
              </Link>
            ))}
          </div>
        </div> : <div className="home-forum-empty"><p>Chưa có bài viết nào được đăng.</p><button onClick={() => navigate("/dien-dan")}>Mở diễn đàn <Icon name="chevron" size={16}/></button></div>}
      </section>
    </main>
  )
}

export default Home
