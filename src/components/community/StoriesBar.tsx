import { useEffect, useRef, useState, type FormEvent } from "react"
import useAuth from "@/hooks/useAuth"
import { useToast } from "@/contexts/ToastContext"
import { formatRelativeTime } from "@/utils/formatTime"

export interface ForumReel {
  id: string
  type: "reel" | "photo"
  authorId: string
  authorName: string
  authorAvatar?: string
  mediaUrl: string
  mediaType: "image" | "video"
  caption: string
  views?: number
  likes?: number
  createdAt: string
  isUserReel?: boolean
}

const PRESET_PHOTOS = [
  {
    name: "Phòng ban công nắng ấm",
    url: "/images/rooms/blue-bedroom.jpg",
  },
  {
    name: "Studio hiện đại full đồ",
    url: "/images/rooms/city-window.jpg",
  },
  {
    name: "Căn hộ mini gác lửng",
    url: "/images/rooms/compact-color-room.jpg",
  },
  {
    name: "View hoàng hôn tầng cao",
    url: "/images/rooms/scandinavian-room.jpg",
  },
  {
    name: "Góc bếp xinh xắn",
    url: "/images/rooms/studio-kitchen.jpg",
  },
]

const initialReels: ForumReel[] = [
  {
    id: "reel-1",
    type: "photo",
    authorId: "user-renter-01",
    authorName: "Hoàng Trang",
    authorAvatar: "/images/avatars/demo-owner-01.jpg",
    mediaUrl: "/images/rooms/blue-bedroom.jpg",
    mediaType: "image",
    caption: "Studio ban công lầu 2 Ung Văn Khiêm siêu thoáng mát đón nắng sớm",
    views: 450,
    likes: 38,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "reel-2",
    type: "reel",
    authorId: "user-landlord-01",
    authorName: "Minh Ngọc",
    authorAvatar: "/images/avatars/demo-owner-03.jpg",
    mediaUrl: "/images/rooms/city-window.jpg",
    mediaType: "image",
    caption: "Tour nhanh phòng Tô Hiến Thành Q10 có gác đúc cao ráo không đụng đầu",
    views: 1250,
    likes: 112,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "reel-3",
    type: "photo",
    authorId: "user-renter-03",
    authorName: "Thu Hà",
    authorAvatar: "/images/avatars/demo-owner-02.jpg",
    mediaUrl: "/images/rooms/compact-color-room.jpg",
    mediaType: "image",
    caption: "Setup góc bàn làm việc bên cửa sổ phòng mới decor xong",
    views: 680,
    likes: 85,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "reel-4",
    type: "reel",
    authorId: "user-landlord-02",
    authorName: "Ngô Lan Hương",
    authorAvatar: "/images/avatars/demo-owner-05.jpg",
    mediaUrl: "/images/rooms/scandinavian-room.jpg",
    mediaType: "image",
    caption: "Hoàng hôn buông nhìn từ ban công chung cư mini Bình Thạnh",
    views: 2890,
    likes: 240,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "reel-5",
    type: "photo",
    authorId: "user-renter-04",
    authorName: "Thiên Tài",
    authorAvatar: "/images/avatars/demo-owner-04.jpg",
    mediaUrl: "/images/rooms/studio-kitchen.jpg",
    mediaType: "image",
    caption: "Góc bếp nhỏ xinh đầy đủ bếp từ tủ lạnh, nấu bữa tối ấm cúng",
    views: 320,
    likes: 42,
    createdAt: new Date(Date.now() - 11 * 3600000).toISOString(),
  },
  {
    id: "reel-6",
    type: "reel",
    authorId: "user-renter-02",
    authorName: "Như Quỳnh",
    authorAvatar: "/images/avatars/demo-owner-06.jpg",
    mediaUrl: "/images/rooms/wood-accent-room.jpg",
    mediaType: "image",
    caption: "Phòng trọ mới view thoáng thành phố về đêm cực chill",
    views: 4120,
    likes: 310,
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
]

function ReelAuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const [error, setError] = useState(false)
  const initials = name.trim().split(/\s+/).slice(-2).map((p) => p[0]).join("").toUpperCase() || "TO"

  if (!avatarUrl || error) {
    return <span className="fb-story-author-initials">{initials}</span>
  }

  return (
    <img
      className="fb-story-author-img"
      src={avatarUrl}
      alt={name}
      onError={() => setError(true)}
    />
  )
}

function ReelMediaBackground({
  mediaUrl,
  mediaType,
  alt = "",
}: {
  mediaUrl: string
  mediaType: "image" | "video"
  alt?: string
}) {
  const [error, setError] = useState(false)

  if (error) {
    return <div className="fb-story-media-bg fb-story-fallback-gradient" />
  }

  if (mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        className="fb-story-media-bg"
        muted
        playsInline
        onError={() => setError(true)}
      />
    )
  }

  return (
    <img
      src={mediaUrl}
      alt={alt}
      className="fb-story-media-bg"
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}

export default function StoriesBar({ onLogin }: { onLogin: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [reels, setReels] = useState<ForumReel[]>(() => {
    try {
      const saved = localStorage.getItem("trooi_forum_reels_v3")
      if (saved) {
        const parsed = JSON.parse(saved) as ForumReel[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return initialReels
  })

  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Creation form state
  const [formType, setFormType] = useState<"reel" | "photo">("reel")
  const [formCaption, setFormCaption] = useState("")
  const [formMediaUrl, setFormMediaUrl] = useState("")
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("video")
  const [submitting, setSubmitting] = useState(false)

  // Viewer state
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [reelComment, setReelComment] = useState("")
  const [hasLikedCurrent, setHasLikedCurrent] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Save reels to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("trooi_forum_reels_v3", JSON.stringify(reels))
    } catch {}
  }, [reels])

  // Check scroll position
  const checkScroll = () => {
    const el = carouselRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    checkScroll()
    el.addEventListener("scroll", checkScroll, { passive: true })
    window.addEventListener("resize", checkScroll)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [reels])

  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current
    if (!el) return
    const amount = direction === "left" ? -240 : 240
    el.scrollBy({ left: amount, behavior: "smooth" })
    setTimeout(checkScroll, 300)
  }

  // Timer for viewing reel
  useEffect(() => {
    if (viewingIndex === null || isPaused) return
    const duration = 6000 // 6 seconds per reel
    const step = 50
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (step / duration) * 100
        if (next >= 100) {
          if (viewingIndex < reels.length - 1) {
            setViewingIndex(viewingIndex + 1)
            return 0
          } else {
            setViewingIndex(null)
            return 0
          }
        }
        return next
      })
    }, step)

    return () => clearInterval(interval)
  }, [viewingIndex, isPaused, reels.length])

  // Reset progress and like state when reel changes
  useEffect(() => {
    setProgress(0)
    setHasLikedCurrent(false)
    setReelComment("")
  }, [viewingIndex])

  const handleNextReel = () => {
    if (viewingIndex === null) return
    if (viewingIndex < reels.length - 1) {
      setViewingIndex(viewingIndex + 1)
    } else {
      setViewingIndex(null)
    }
  }

  const handlePrevReel = () => {
    if (viewingIndex === null) return
    if (viewingIndex > 0) {
      setViewingIndex(viewingIndex - 1)
    } else {
      setProgress(0)
    }
  }

  const handleLikeCurrent = () => {
    if (viewingIndex === null) return
    const cur = reels[viewingIndex]
    if (!cur) return
    setHasLikedCurrent((prev) => !prev)
    setReels((all) =>
      all.map((item) =>
        item.id === cur.id
          ? { ...item, likes: (item.likes || 0) + (hasLikedCurrent ? -1 : 1) }
          : item
      )
    )
  }

  const handleSendReelComment = (e: FormEvent) => {
    e.preventDefault()
    if (!reelComment.trim()) return
    toast(`Đã gửi phản hồi đến ${reels[viewingIndex ?? 0]?.authorName}: "${reelComment}"`, "success")
    setReelComment("")
  }

  // Create Reel / Photo
  const handleCreateReel = (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      onLogin()
      return
    }
    const finalMedia = formMediaUrl.trim() || PRESET_PHOTOS[0].url
    setSubmitting(true)

    const newReel: ForumReel = {
      id: `reel-${Date.now()}`,
      type: formType,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      mediaUrl: finalMedia,
      mediaType: formMediaType,
      caption: formCaption.trim() || (formType === "reel" ? "Reel chia sẻ phòng trọ mới" : "Ảnh phòng mới"),
      views: 1,
      likes: 0,
      createdAt: new Date().toISOString(),
      isUserReel: true,
    }

    setReels((prev) => [newReel, ...prev])
    setSubmitting(false)
    setCreateModalOpen(false)
    setFormCaption("")
    setFormMediaUrl("")
    toast(formType === "reel" ? "Đã đăng thước phim (Reel) mới!" : "Đã đăng ảnh phòng mới!", "success")
  }

  const currentViewingReel = viewingIndex !== null ? reels[viewingIndex] : null

  return (
    <div className="fb-stories-section">
      {/* Carousel Wrapper */}
      <div className="fb-stories-carousel-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="fb-story-arrow fb-story-arrow-left"
            onClick={() => scroll("left")}
            aria-label="Cuộn sang trái"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div className="fb-stories-carousel" ref={carouselRef}>
          {/* Card 1: Tạo Reel */}
          <div
            className="fb-story-card fb-create-story-card"
            onClick={() => (user ? setCreateModalOpen(true) : onLogin())}
            role="button"
            tabIndex={0}
          >
            <div className="fb-create-story-top">
              {user?.avatarUrl ? (
                <img className="fb-create-avatar-img" src={user.avatarUrl} alt="" />
              ) : (
                <span className="fb-create-avatar-initials">{user?.initials || "+"}</span>
              )}
            </div>
            <div className="fb-create-story-bottom">
              <span className="fb-create-plus-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span className="fb-create-text">Tạo Reel</span>
            </div>
          </div>

          {/* Subsequent Reel Cards */}
          {reels.map((reel, index) => (
            <div
              className="fb-story-card fb-user-story-card"
              key={reel.id}
              onClick={() => setViewingIndex(index)}
              role="button"
              tabIndex={0}
            >
              {/* Background Media */}
              <div className="fb-story-bg-wrapper">
                <ReelMediaBackground
                  mediaUrl={reel.mediaUrl}
                  mediaType={reel.mediaType}
                  alt={reel.caption}
                />
                <div className="fb-story-overlay" />
              </div>

              {/* Top-left Avatar with Reel Ring */}
              <div className="fb-story-author-avatar-wrap">
                <ReelAuthorAvatar name={reel.authorName} avatarUrl={reel.authorAvatar} />
              </div>

              {/* Reel Play Badge */}
              <span className="fb-story-reel-badge" title="Thước phim">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "3px" }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {reel.views ? `${reel.views > 999 ? `${(reel.views / 1000).toFixed(1)}k` : reel.views}` : "Reel"}
              </span>

              {/* Bottom Author Name */}
              <div className="fb-story-author-name">
                <span>{reel.authorName}</span>
              </div>
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="fb-story-arrow fb-story-arrow-right"
            onClick={() => scroll("right")}
            aria-label="Cuộn sang phải"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Modal: Fullscreen Reel Viewer */}
      {currentViewingReel && (
        <div
          className="fb-story-viewer-backdrop"
          onClick={() => setViewingIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") handlePrevReel()
            if (e.key === "ArrowRight") handleNextReel()
            if (e.key === "Escape") setViewingIndex(null)
          }}
          tabIndex={0}
        >
          <div
            className="fb-story-viewer-box"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Top Progress Bars */}
            <div className="fb-viewer-progress-row">
              {reels.map((r, idx) => (
                <div className="fb-progress-track" key={r.id}>
                  <div
                    className="fb-progress-fill"
                    style={{
                      width:
                        idx < (viewingIndex ?? 0)
                          ? "100%"
                          : idx === viewingIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header info */}
            <div className="fb-viewer-header">
              <div className="fb-viewer-author-info">
                <div className="fb-viewer-avatar">
                  <ReelAuthorAvatar
                    name={currentViewingReel.authorName}
                    avatarUrl={currentViewingReel.authorAvatar}
                  />
                </div>
                <div>
                  <div className="fb-viewer-author-name">{currentViewingReel.authorName}</div>
                  <div className="fb-viewer-time">
                    {formatRelativeTime(currentViewingReel.createdAt)} • Thước phim
                  </div>
                </div>
              </div>

              <div className="fb-viewer-controls">
                <button
                  type="button"
                  className="fb-viewer-btn"
                  onClick={() => setIsPaused(!isPaused)}
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="fb-viewer-btn"
                  onClick={() => setMuted(!muted)}
                  title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {muted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="fb-viewer-btn fb-viewer-close"
                  onClick={() => setViewingIndex(null)}
                  title="Đóng (Esc)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="fb-viewer-media-wrap">
              {currentViewingReel.mediaType === "video" ? (
                <video
                  src={currentViewingReel.mediaUrl}
                  className="fb-viewer-video"
                  autoPlay
                  playsInline
                  loop
                  muted={muted}
                />
              ) : (
                <img
                  src={currentViewingReel.mediaUrl}
                  alt={currentViewingReel.caption}
                  className="fb-viewer-image"
                />
              )}

              {/* Caption Overlay */}
              {currentViewingReel.caption && (
                <div className="fb-viewer-caption">
                  <p>{currentViewingReel.caption}</p>
                </div>
              )}

              {/* Prev / Next Click Zones */}
              <button
                type="button"
                className="fb-viewer-zone fb-zone-left"
                onClick={handlePrevReel}
                aria-label="Reel trước"
              />
              <button
                type="button"
                className="fb-viewer-zone fb-zone-right"
                onClick={handleNextReel}
                aria-label="Reel tiếp theo"
              />
            </div>

            {/* Footer: Quick reply & Reaction */}
            <div className="fb-viewer-footer">
              <form className="fb-viewer-reply-form" onSubmit={handleSendReelComment}>
                <input
                  type="text"
                  placeholder={`Gửi phản hồi đến ${currentViewingReel.authorName}...`}
                  value={reelComment}
                  onChange={(e) => setReelComment(e.target.value)}
                />
                <button type="submit" disabled={!reelComment.trim()} aria-label="Gửi phản hồi">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
                  </svg>
                </button>
              </form>

              <div className="fb-viewer-reactions">
                <button
                  type="button"
                  className={`fb-reaction-btn ${hasLikedCurrent ? "active" : ""}`}
                  onClick={handleLikeCurrent}
                  title="Thích"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill={hasLikedCurrent ? "#e41e3f" : "none"}
                    stroke={hasLikedCurrent ? "#e41e3f" : "currentColor"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "4px" }}
                  >
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />
                  </svg>
                  <span>{currentViewingReel.likes || (hasLikedCurrent ? 1 : 0)}</span>
                </button>
                <button
                  type="button"
                  className="fb-reaction-btn"
                  onClick={() => toast("Đã chia sẻ thước phim này!", "success")}
                  title="Chia sẻ"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo Reel mới */}
      {createModalOpen && (
        <div className="dialog-backdrop" onClick={() => setCreateModalOpen(false)}>
          <section className="action-dialog fb-create-story-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fb-dialog-head">
              <h2>Tạo thước phim (Reel) & Ảnh phòng</h2>
              <button type="button" className="dialog-close" onClick={() => setCreateModalOpen(false)} aria-label="Đóng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateReel} className="fb-create-form">
              {/* Type Switcher */}
              <div className="fb-create-type-switch">
                <button
                  type="button"
                  className={`fb-type-option ${formType === "reel" ? "active" : ""}`}
                  onClick={() => {
                    setFormType("reel")
                    setFormMediaType("video")
                  }}
                >
                  Video Reel
                </button>
                <button
                  type="button"
                  className={`fb-type-option ${formType === "photo" ? "active" : ""}`}
                  onClick={() => {
                    setFormType("photo")
                    setFormMediaType("image")
                  }}
                >
                  Ảnh phòng
                </button>
              </div>

              {/* Caption */}
              <div className="fb-field-group">
                <label htmlFor="story-caption">Mô tả căn phòng / Nội dung</label>
                <textarea
                  id="story-caption"
                  rows={3}
                  placeholder={
                    formType === "reel"
                      ? "Chia sẻ video ngắn về căn phòng trọ, tiện ích hoặc cuộc sống quanh khu vực..."
                      : "Mô tả góc phòng đẹp, ban công hoặc nội thất nổi bật..."
                  }
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                />
              </div>

              {/* Presets Gallery */}
              <div className="fb-field-group">
                <label>Hoặc chọn mẫu ảnh phòng đẹp có sẵn:</label>
                <div className="fb-preset-grid">
                  {PRESET_PHOTOS.map((preset) => (
                    <button
                      type="button"
                      key={preset.url}
                      className={`fb-preset-card ${formMediaUrl === preset.url ? "selected" : ""}`}
                      onClick={() => {
                        setFormMediaUrl(preset.url)
                        setFormMediaType("image")
                      }}
                    >
                      <img src={preset.url} alt={preset.name} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Media URL */}
              <div className="fb-field-group">
                <label htmlFor="story-media-url">Hoặc dán liên kết ảnh / video:</label>
                <div className="fb-url-input-wrap">
                  <input
                    id="story-media-url"
                    type="url"
                    placeholder="https://... (link ảnh hoặc video mp4)"
                    value={formMediaUrl}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormMediaUrl(val)
                      if (val.match(/\.(mp4|webm|mov)$/i)) {
                        setFormMediaType("video")
                      } else {
                        setFormMediaType("image")
                      }
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="fb-create-actions">
                <button type="button" className="btn-cancel" onClick={() => setCreateModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Đang đăng..." : formType === "reel" ? "Đăng thước phim" : "Đăng ảnh phòng"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
