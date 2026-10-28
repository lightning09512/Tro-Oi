import { useEffect, useRef, useState, type FormEvent } from "react"
import { Icon } from "@/components/common/legacy"
import { useToast } from "@/contexts/ToastContext"
import useAuth from "@/hooks/useAuth"
import { formatRelativeTime } from "@/utils/formatTime"

export interface ForumStory {
  id: string
  type: "story" | "reel"
  authorId: string
  authorName: string
  authorAvatar?: string
  mediaUrl: string
  mediaType: "image" | "video"
  caption: string
  views?: number
  likes?: number
  createdAt: string
  isUserStory?: boolean
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

const initialStories: ForumStory[] = [
  {
    id: "story-1",
    type: "story",
    authorId: "user-renter-01",
    authorName: "Hoàng Trang",
    authorAvatar: "/images/avatars/demo-owner-01.jpg",
    mediaUrl: "/images/rooms/blue-bedroom.jpg",
    mediaType: "image",
    caption: "Studio ban công lầu 2 Ung Văn Khiêm siêu thoáng mát đón nắng sớm 🌿",
    views: 450,
    likes: 38,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "story-2",
    type: "reel",
    authorId: "user-landlord-01",
    authorName: "Minh Ngọc",
    authorAvatar: "/images/avatars/demo-owner-03.jpg",
    mediaUrl: "/images/rooms/city-window.jpg",
    mediaType: "image",
    caption: "Tour nhanh phòng Tô Hiến Thành Q10 có gác đúc cao ráo không đụng đầu ✨",
    views: 1250,
    likes: 112,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "story-3",
    type: "story",
    authorId: "user-renter-03",
    authorName: "Thu Hà",
    authorAvatar: "/images/avatars/demo-owner-02.jpg",
    mediaUrl: "/images/rooms/compact-color-room.jpg",
    mediaType: "image",
    caption: "Setup góc bàn làm việc bên cửa sổ chill chill phòng mới decor xong ☕",
    views: 680,
    likes: 85,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "story-4",
    type: "reel",
    authorId: "user-landlord-02",
    authorName: "Ngô Lan Hương",
    authorAvatar: "/images/avatars/demo-owner-05.jpg",
    mediaUrl: "/images/rooms/scandinavian-room.jpg",
    mediaType: "image",
    caption: "Hoàng hôn buông nhìn từ ban công chung cư mini Bình Thạnh 🌅",
    views: 2890,
    likes: 240,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "story-5",
    type: "story",
    authorId: "user-renter-04",
    authorName: "Thiên Tài",
    authorAvatar: "/images/avatars/demo-owner-04.jpg",
    mediaUrl: "/images/rooms/studio-kitchen.jpg",
    mediaType: "image",
    caption: "Góc bếp nhỏ xinh đầy đủ bếp từ tủ lạnh, nấu bữa tối ấm cúng 🍳",
    views: 320,
    likes: 42,
    createdAt: new Date(Date.now() - 11 * 3600000).toISOString(),
  },
  {
    id: "story-6",
    type: "reel",
    authorId: "user-renter-02",
    authorName: "Như Quỳnh",
    authorAvatar: "/images/avatars/demo-owner-06.jpg",
    mediaUrl: "/images/rooms/wood-accent-room.jpg",
    mediaType: "image",
    caption: "Chill chiều mưa ngắm thành phố từ góc phòng trọ nhỏ ✨",
    views: 4120,
    likes: 310,
    createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
]

function StoryAuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
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

function StoryMediaBackground({
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

  const [stories, setStories] = useState<ForumStory[]>(() => {
    try {
      const saved = localStorage.getItem("trooi_forum_stories_v2")
      if (saved) {
        const parsed = JSON.parse(saved) as ForumStory[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return initialStories
  })

  const [activeTab, setActiveTab] = useState<"all" | "story" | "reel">("all")
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Creation form state
  const [formType, setFormType] = useState<"story" | "reel">("story")
  const [formCaption, setFormCaption] = useState("")
  const [formMediaUrl, setFormMediaUrl] = useState("")
  const [formMediaType, setFormMediaType] = useState<"image" | "video">("image")
  const [submitting, setSubmitting] = useState(false)

  // Viewer state
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [muted, setMuted] = useState(true)
  const [storyComment, setStoryComment] = useState("")
  const [hasLikedCurrent, setHasLikedCurrent] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Save stories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("trooi_forum_stories_v2", JSON.stringify(stories))
    } catch {}
  }, [stories])

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
  }, [stories, activeTab])

  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current
    if (!el) return
    const amount = direction === "left" ? -240 : 240
    el.scrollBy({ left: amount, behavior: "smooth" })
    setTimeout(checkScroll, 300)
  }

  // Filtered stories by active tab
  const filteredStories = stories.filter((s) => {
    if (activeTab === "all") return true
    return s.type === activeTab
  })

  // Timer for viewing story
  useEffect(() => {
    if (viewingIndex === null || isPaused) return
    const duration = 5000 // 5 seconds per story
    const step = 50
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (step / duration) * 100
        if (next >= 100) {
          // Advance to next story or close
          if (viewingIndex < filteredStories.length - 1) {
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
  }, [viewingIndex, isPaused, filteredStories.length])

  // Reset progress and like state when story changes
  useEffect(() => {
    setProgress(0)
    setHasLikedCurrent(false)
    setStoryComment("")
  }, [viewingIndex])

  const handleNextStory = () => {
    if (viewingIndex === null) return
    if (viewingIndex < filteredStories.length - 1) {
      setViewingIndex(viewingIndex + 1)
    } else {
      setViewingIndex(null)
    }
  }

  const handlePrevStory = () => {
    if (viewingIndex === null) return
    if (viewingIndex > 0) {
      setViewingIndex(viewingIndex - 1)
    } else {
      setProgress(0)
    }
  }

  const handleLikeCurrent = () => {
    if (viewingIndex === null) return
    const cur = filteredStories[viewingIndex]
    if (!cur) return
    setHasLikedCurrent((prev) => !prev)
    setStories((all) =>
      all.map((item) =>
        item.id === cur.id
          ? { ...item, likes: (item.likes || 0) + (hasLikedCurrent ? -1 : 1) }
          : item
      )
    )
  }

  const handleSendStoryComment = (e: FormEvent) => {
    e.preventDefault()
    if (!storyComment.trim()) return
    toast(`Đã gửi phản hồi đến ${filteredStories[viewingIndex ?? 0]?.authorName}: "${storyComment}"`, "success")
    setStoryComment("")
  }

  // Create Story / Reel
  const handleCreateStory = (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      onLogin()
      return
    }
    const finalMedia = formMediaUrl.trim() || PRESET_PHOTOS[0].url
    setSubmitting(true)

    const newStory: ForumStory = {
      id: `story-${Date.now()}`,
      type: formType,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      mediaUrl: finalMedia,
      mediaType: formMediaType,
      caption: formCaption.trim() || (formType === "reel" ? "Reel chia sẻ phòng trọ mới ✨" : "Tin mới từ tôi 🌿"),
      views: 1,
      likes: 0,
      createdAt: new Date().toISOString(),
      isUserStory: true,
    }

    setStories((prev) => [newStory, ...prev])
    setSubmitting(false)
    setCreateModalOpen(false)
    setFormCaption("")
    setFormMediaUrl("")
    toast(formType === "reel" ? "Đã đăng thước phim (Reel) mới!" : "Đã đăng tin (Story) mới!", "success")
  }

  const currentViewingStory = viewingIndex !== null ? filteredStories[viewingIndex] : null

  return (
    <div className="fb-stories-section">
      {/* Tab Switcher: Tin vs Thước phim */}
      <div className="fb-stories-tabs">
        <button
          type="button"
          className={`fb-tab-item ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <span className="fb-tab-icon">📖</span>
          <span>Tất cả</span>
        </button>
        <button
          type="button"
          className={`fb-tab-item ${activeTab === "story" ? "active" : ""}`}
          onClick={() => setActiveTab("story")}
        >
          <span className="fb-tab-icon">📸</span>
          <span>Tin (Stories)</span>
        </button>
        <button
          type="button"
          className={`fb-tab-item ${activeTab === "reel" ? "active" : ""}`}
          onClick={() => setActiveTab("reel")}
        >
          <span className="fb-tab-icon">🎬</span>
          <span>Thước phim (Reels)</span>
        </button>
      </div>

      {/* Carousel Wrapper */}
      <div className="fb-stories-carousel-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="fb-story-arrow fb-story-arrow-left"
            onClick={() => scroll("left")}
            aria-label="Cuộn sang trái"
          >
            ‹
          </button>
        )}

        <div className="fb-stories-carousel" ref={carouselRef}>
          {/* Card 1: Tạo tin (Create Story) */}
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
              <span className="fb-create-plus-icon">+</span>
              <span className="fb-create-text">Tạo tin / Reel</span>
            </div>
          </div>

          {/* Subsequent Story Cards */}
          {filteredStories.map((story, index) => {
            const isReel = story.type === "reel"
            return (
              <div
                className="fb-story-card fb-user-story-card"
                key={story.id}
                onClick={() => setViewingIndex(index)}
                role="button"
                tabIndex={0}
              >
                {/* Background Media */}
                <div className="fb-story-bg-wrapper">
                  <StoryMediaBackground
                    mediaUrl={story.mediaUrl}
                    mediaType={story.mediaType}
                    alt={story.caption}
                  />
                  <div className="fb-story-overlay" />
                </div>

                {/* Top-left Avatar with Story Ring */}
                <div className="fb-story-author-avatar-wrap">
                  <StoryAuthorAvatar name={story.authorName} avatarUrl={story.authorAvatar} />
                </div>

                {/* Badge if Reel */}
                {isReel && (
                  <span className="fb-story-reel-badge" title="Thước phim">
                    ▶ {story.views ? `${story.views > 999 ? `${(story.views / 1000).toFixed(1)}k` : story.views}` : "Reel"}
                  </span>
                )}

                {/* Bottom Author Name */}
                <div className="fb-story-author-name">
                  <span>{story.authorName}</span>
                </div>
              </div>
            )
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="fb-story-arrow fb-story-arrow-right"
            onClick={() => scroll("right")}
            aria-label="Cuộn sang phải"
          >
            ›
          </button>
        )}
      </div>

      {/* Modal: Fullscreen Story Viewer */}
      {currentViewingStory && (
        <div
          className="fb-story-viewer-backdrop"
          onClick={() => setViewingIndex(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") handlePrevStory()
            if (e.key === "ArrowRight") handleNextStory()
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
              {filteredStories.map((s, idx) => (
                <div className="fb-progress-track" key={s.id}>
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
                  <StoryAuthorAvatar
                    name={currentViewingStory.authorName}
                    avatarUrl={currentViewingStory.authorAvatar}
                  />
                </div>
                <div>
                  <div className="fb-viewer-author-name">{currentViewingStory.authorName}</div>
                  <div className="fb-viewer-time">
                    {formatRelativeTime(currentViewingStory.createdAt)} • {currentViewingStory.type === "reel" ? "Reel" : "Tin"}
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
                  {isPaused ? "▶" : "⏸"}
                </button>
                <button
                  type="button"
                  className="fb-viewer-btn"
                  onClick={() => setMuted(!muted)}
                  title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {muted ? "🔇" : "🔊"}
                </button>
                <button
                  type="button"
                  className="fb-viewer-btn fb-viewer-close"
                  onClick={() => setViewingIndex(null)}
                  title="Đóng (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Media Content */}
            <div className="fb-viewer-media-wrap">
              {currentViewingStory.mediaType === "video" ? (
                <video
                  src={currentViewingStory.mediaUrl}
                  className="fb-viewer-video"
                  autoPlay
                  playsInline
                  loop
                  muted={muted}
                />
              ) : (
                <img
                  src={currentViewingStory.mediaUrl}
                  alt={currentViewingStory.caption}
                  className="fb-viewer-image"
                />
              )}

              {/* Caption Overlay */}
              {currentViewingStory.caption && (
                <div className="fb-viewer-caption">
                  <p>{currentViewingStory.caption}</p>
                </div>
              )}

              {/* Prev / Next Click Zones */}
              <button
                type="button"
                className="fb-viewer-zone fb-zone-left"
                onClick={handlePrevStory}
                aria-label="Tin trước"
              />
              <button
                type="button"
                className="fb-viewer-zone fb-zone-right"
                onClick={handleNextStory}
                aria-label="Tin tiếp theo"
              />
            </div>

            {/* Footer: Quick reply & Reaction */}
            <div className="fb-viewer-footer">
              <form className="fb-viewer-reply-form" onSubmit={handleSendStoryComment}>
                <input
                  type="text"
                  placeholder={`Gửi phản hồi đến ${currentViewingStory.authorName}...`}
                  value={storyComment}
                  onChange={(e) => setStoryComment(e.target.value)}
                />
                <button type="submit" disabled={!storyComment.trim()}>
                  <Icon name="send" size={16} />
                </button>
              </form>

              <div className="fb-viewer-reactions">
                <button
                  type="button"
                  className={`fb-reaction-btn ${hasLikedCurrent ? "active" : ""}`}
                  onClick={handleLikeCurrent}
                  title="Thích"
                >
                  ❤️ {currentViewingStory.likes || (hasLikedCurrent ? 1 : 0)}
                </button>
                <button
                  type="button"
                  className="fb-reaction-btn"
                  onClick={() => toast("Đã chia sẻ tin này!", "success")}
                  title="Chia sẻ"
                >
                  ↗️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo tin / Reel mới */}
      {createModalOpen && (
        <div className="dialog-backdrop" onClick={() => setCreateModalOpen(false)}>
          <section className="action-dialog fb-create-story-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fb-dialog-head">
              <h2>Tạo tin hoặc thước phim mới</h2>
              <button type="button" className="dialog-close" onClick={() => setCreateModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="fb-create-form">
              {/* Type Switcher */}
              <div className="fb-create-type-switch">
                <button
                  type="button"
                  className={`fb-type-option ${formType === "story" ? "active" : ""}`}
                  onClick={() => setFormType("story")}
                >
                  📸 Tin (Story)
                </button>
                <button
                  type="button"
                  className={`fb-type-option ${formType === "reel" ? "active" : ""}`}
                  onClick={() => setFormType("reel")}
                >
                  🎬 Thước phim (Reel)
                </button>
              </div>

              {/* Caption */}
              <div className="fb-field-group">
                <label htmlFor="story-caption">Mô tả / Cảm xúc</label>
                <textarea
                  id="story-caption"
                  rows={3}
                  placeholder={
                    formType === "reel"
                      ? "Chia sẻ video ngắn về căn phòng trọ, mẹo dọn dẹp hoặc cuộc sống trọ..."
                      : "Bạn đang muốn chia sẻ khoảnh khắc gì hôm nay?..."
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
                  {submitting ? "Đang đăng..." : formType === "reel" ? "Đăng thước phim" : "Chia sẻ lên tin"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
