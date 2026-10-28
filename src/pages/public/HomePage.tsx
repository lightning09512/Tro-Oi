import { useEffect, useMemo, useRef, useState } from "react"
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
    const focusFrame = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus())
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
        onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true) } }}
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
  const landlordProgramUrl = user?.role === "landlord" ? "/chu-tro/dang-tin" : user ? "/chu-tro/dang-tin" : "/dang-nhap"

  const promoCampaigns = useMemo(() => [
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
      if (location) params.set("location", location)
      if (maxPrice) params.set("maxPrice", maxPrice)
      if (areaRange !== "all") params.set("areaRange", areaRange)
    }
    return `/tim-phong?${params.toString()}`
  }
  const postingLink = user?.role === "landlord" ? "/chu-tro/dang-tin" : user?.role === "admin" ? "/admin/tin-cho-thue" : user ? "/dien-dan" : "/dang-nhap"

  return (
    <main className="public-home">
      <section className="hero">
        <div className="container hero-inner">
          <div className={`hero-intro-grid${featuredRoom ? " has-featured-room" : ""}`}>
            <div className="hero-copy">
              <div className="hero-eyebrow-pill">
                <span className="hero-eyebrow-dot" />
                <span>Nền tảng tìm phòng trọ & căn hộ uy tín</span>
              </div>
              <h1>Tìm phòng hợp túi tiền,<br/>gần nơi bạn cần.</h1>
              <p>Lọc theo khu vực, giá thuê và diện tích. Xem ảnh thực tế, tiện nghi đầy đủ và trao đổi trực tiếp với chủ trọ.</p>
              <div className="hero-trust-row">
                <div className="hero-trust-item">
                  <Icon name="shield" size={15}/>
                  <span>Tin phòng xác thực</span>
                </div>
                <div className="hero-trust-item">
                  <Icon name="check" size={15}/>
                  <span>Không cọc ảo</span>
                </div>
                <div className="hero-trust-item">
                  <Icon name="chat" size={15}/>
                  <span>Trao đổi trực tiếp</span>
                </div>
              </div>
            </div>
            {featuredRoom && <Link className="hero-room-card" to={`/phong/${featuredRoom.id}`} aria-label={`Xem phòng ${featuredRoom.title}`}>
              <img src={featuredRoom.image} alt={featuredRoom.title} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/tro-oi-icon.svg"; event.currentTarget.alt = "Ảnh phòng chưa tải được"; event.currentTarget.style.objectFit = "contain" }} />
              <div className="hero-room-details">
                <div className="hero-room-overline"><span>{featuredRoom.type}</span><span>{featuredRoom.area || "Diện tích chưa cập nhật"}</span></div>
                <h2>{featuredRoom.title}</h2>
                <p className="hero-room-location"><Icon name="pin" size={15}/>{featuredRoom.location}</p>
                <p className="hero-room-price">{featuredRoom.price}<small>/tháng</small></p>
              </div>
            </Link>}
          </div>
          <div className="search-panel">
            <div className="search-panel-tabs"><div className="search-panel-tab-active"><Icon name="home" size={18}/><span>Bạn muốn tìm phòng ở đâu?</span></div></div>
            <div className="hero-fields">
              <div className="hero-location-field"><span>Khu vực</span><LocationPicker value={location} onChange={setLocation}/></div>
              <div className="home-filter-field"><span>Khoảng giá</span><HomeFilterDropdown label="Giá thuê tối đa" value={maxPrice} onChange={setMaxPrice} icon="chart" options={[
                { value: "", label: "Mọi mức giá" }, { value: "3", label: "Dưới 3 triệu" }, { value: "5", label: "Dưới 5 triệu" }, { value: "7", label: "Dưới 7 triệu" }, { value: "10", label: "Dưới 10 triệu" }, { value: "20", label: "Dưới 20 triệu" },
              ]}/></div>
              <div className="home-filter-field"><span>Diện tích</span><HomeFilterDropdown label="Diện tích phòng" value={areaRange} onChange={setAreaRange} icon="grid" options={[
                { value: "all", label: "Tất cả diện tích" }, { value: "under20", label: "Dưới 20 m²" }, { value: "20-30", label: "20–30 m²" }, { value: "30-50", label: "Trên 30–50 m²" }, { value: "over50", label: "Trên 50 m²" },
              ]}/></div>
              <button type="button" className="hero-search-btn" onClick={() => navigate(buildSearchUrl())}><Icon name="search" size={18}/><span>Tìm phòng</span></button>
            </div>
          </div>
        </div>
      </section>
      <section className="home-browse-section" id="home-room-list">
        <div className="container quick-section">
          <nav className="chips" aria-label="Tìm theo loại phòng">{roomTypes.map((item, i) => <button key={item} className="chip" onClick={() => navigate(buildSearchUrl(item))}>
            <Icon name={["building", "home", "users", "building", "home"][i] ?? "building"} size={18}/>{item}<small className="chip-count">{roomTypeCounts.get(item) ?? 0}</small>
          </button>)}</nav>
          <SectionTitle title="Tìm nơi ở phù hợp với bạn" action="Xem tất cả phòng" onAction={() => navigate("/tim-phong")}/>
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
          <Link className="featured-story" to={`/bai-viet/${latestPosts[0].id}`}><div className="featured-story-photo"><img src={latestPosts[0].image || forumFallbackImage} alt={`Ảnh minh họa bài viết của ${latestPosts[0].name}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = forumFallbackImage }}/></div><div className="featured-story-body"><h3 className="featured-story-title">{latestPosts[0].content}</h3><p className="home-story-author">{latestPosts[0].name}</p><div className="featured-story-meta">{latestPosts[0].time} · {latestPosts[0].likes} lượt thích · {latestPosts[0].commentsCount} bình luận</div><span className="featured-story-cta">Đọc bài viết <Icon name="chevron" size={14}/></span></div></Link>
          <div className="story-list">{latestPosts.slice(1).map((post) => <Link to={`/bai-viet/${post.id}`} key={post.id} className="story-item"><span className="story-avatar">{post.avatarUrl ? <img className="user-avatar-image" src={post.avatarUrl} alt=""/> : post.initials}</span><div className="story-item-body"><span className="story-item-author">{post.name}</span><p className="story-item-text">{post.content}</p><small className="story-item-meta">{post.time} · {post.commentsCount} bình luận</small></div></Link>)}</div>
        </div> : <div className="home-forum-empty"><p>{connectionState === "loading" ? "Đang tải bài viết cộng đồng…" : connectionState === "error" ? "Chưa kết nối được diễn đàn. Hãy thử lại sau." : "Chưa có bài viết. Hãy bắt đầu một cuộc trò chuyện cùng cộng đồng."}</p><button onClick={() => navigate("/dien-dan")}>Mở diễn đàn <Icon name="chevron" size={16}/></button></div>}
      </section>
    </main>
  )
}

export default Home
