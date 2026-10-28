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
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Studio hiện đại full đồ",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Căn hộ mini gác lửng",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "View hoàng hôn tầng cao",
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80",
  },
]

const initialStories: ForumStory[] = [
  {
    id: "story-1",
    type: "story",
    authorId: "user-renter-01",
    authorName: "Hoàng Trang",
    authorAvatar: "/images/avatars/demo-renter-01.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80",
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
    authorAvatar: "/images/avatars/demo-owner-01.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80",
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
    authorAvatar: "/images/avatars/demo-renter-03.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80",
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
    authorAvatar: "/images/avatars/demo-owner-02.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80",
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
    authorAvatar: "/images/avatars/demo-renter-04.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=700&q=80",
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
    authorAvatar: "/images/avatars/demo-renter-02.jpg",
    mediaUrl: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=700&q=80",
    mediaType: "image",
    caption: "Tips kiểm tra đồng hồ điện nước khi nhận phòng trọ mới cực kỳ hữu ích 💡",
    views: 4120,
    likes: 380,
    createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
  },
]

export default function StoriesBar({ onLogin }: { onLogin: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"all" | "story" | "reel">("all")
  const [stories, setStories] = useState<ForumStory[]>(() => {
    try {
      const saved = localStorage.getItem("phongtroplus_stories")
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return initialStories
  })

  // Save stories on change
  useEffect(() => {
    try {
      localStorage.setItem("phongtroplus_stories", JSON.stringify(stories))
    } catch {
      // ignore
    }
  }, [stories])

  // Carousel ref for scrolling
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!carouselRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = carouselRef.current
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true })
      window.addEventListener("resize", checkScroll)
      return () => {
        el.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
      }
    }
  }, [stories, activeTab])

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return
    const offset = direction === "left" ? -280 : 280
    carouselRef.current.scrollBy({ left: offset, behavior: "smooth" })
  }

  // Story Viewer state
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  // Create Story Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [storyType, setStoryType] = useState<"story" | "reel">("story")
  const [storyMedia, setStoryMedia] = useState(PRESET_PHOTOS[0].url)
  const [storyMediaType, setStoryMediaType] = useState<"image" | "video">("image")
  const [storyCaption, setStoryCaption] = useState("")
  const [selectedTag, setSelectedTag] = useState("🌿 Phòng đẹp")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const TAGS = ["🌿 Phòng đẹp", "🏠 Pass phòng gấp", "👤 Tìm bạn ghép", "✨ Góc chill", "💡 Review trọ"]

  const filteredStories = stories.filter((s) => {
    if (activeTab === "story") return s.type === "story"
    if (activeTab === "reel") return s.type === "reel"
    return true
  })

  // Timer for Story Viewer auto-advance
  useEffect(() => {
    if (viewingIndex === null || isPaused) return
    const timer = setTimeout(() => {
      if (viewingIndex < filteredStories.length - 1) {
        setViewingIndex(viewingIndex + 1)
      } else {
        setViewingIndex(null) // End of stories
      }
    }, 5500)
    return () => clearTimeout(timer)
  }, [viewingIndex, isPaused, filteredStories.length])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith("video/")
    setStoryMediaType(isVideo ? "video" : "image")
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setStoryMedia(String(event.target.result))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCreateStory = (e: FormEvent) => {
    e.preventDefault()
    if (!user) return onLogin()
    if (!storyMedia) {
      toast("Vui lòng chọn hình ảnh hoặc video cho tin!", "error")
      return
    }

    const newStory: ForumStory = {
      id: `story-${Date.now()}`,
      type: storyType,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      mediaUrl: storyMedia,
      mediaType: storyMediaType,
      caption: storyCaption.trim() ? `${selectedTag} ${storyCaption.trim()}` : selectedTag,
      views: 1,
      likes: 0,
      createdAt: new Date().toISOString(),
      isUserStory: true,
    }

    setStories([newStory, ...stories])
    setCreateModalOpen(false)
    setStoryCaption("")
    toast(`Đã đăng ${storyType === "story" ? "Tin" : "Thước phim"} thành công!`, "success")
    setViewingIndex(0)
  }

  const toggleStoryLike = (storyId: string) => {
    setLikedMap((prev) => ({ ...prev, [storyId]: !prev[storyId] }))
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
                  {story.mediaType === "video" ? (
                    <video src={story.mediaUrl} className="fb-story-media-bg" muted playsInline />
                  ) : (
                    <img src={story.mediaUrl} alt="" className="fb-story-media-bg" loading="lazy" />
                  )}
                  <div className="fb-story-overlay" />
                </div>

                {/* Top-left Avatar with Story Ring */}
                <div className="fb-story-author-avatar-wrap">
                  {story.authorAvatar ? (
                    <img className="fb-story-author-img" src={story.authorAvatar} alt="" />
                  ) : (
                    <span className="fb-story-author-initials">
                      {story.authorName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
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

      {/* =========================================================================
          STORY VIEWER MODAL (Chuẩn Facebook)
          ========================================================================= */}
      {currentViewingStory && viewingIndex !== null && (
        <div
          className="fb-story-viewer-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingIndex(null)
          }}
        >
          <div className="fb-story-viewer-box">
            {/* Top Timer Progress Bars */}
            <div className="fb-viewer-progress-row">
              {filteredStories.map((s, idx) => (
                <div className="fb-viewer-progress-track" key={s.id}>
                  <div
                    className={`fb-viewer-progress-fill ${
                      idx < viewingIndex ? "is-filled" : idx === viewingIndex ? (isPaused ? "is-paused" : "is-active") : ""
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Viewer Header */}
            <div className="fb-viewer-header">
              <div className="fb-viewer-author-meta">
                <span className="fb-viewer-avatar">
                  {currentViewingStory.authorAvatar ? (
                    <img src={currentViewingStory.authorAvatar} alt="" />
                  ) : (
                    currentViewingStory.authorName.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div>
                  <strong className="fb-viewer-author-name">{currentViewingStory.authorName}</strong>
                  <small className="fb-viewer-time">
                    {formatRelativeTime(currentViewingStory.createdAt)} · {currentViewingStory.type === "reel" ? "🎬 Reel" : "📸 Tin"}
                  </small>
                </div>
              </div>

              <div className="fb-viewer-header-actions">
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
                  className="fb-viewer-btn fb-viewer-close-btn"
                  onClick={() => setViewingIndex(null)}
                  title="Đóng (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Viewer Media Body */}
            <div
              className="fb-viewer-media-wrapper"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickX = e.clientX - rect.left
                if (clickX < rect.width * 0.35) {
                  // Click left -> prev story
                  if (viewingIndex > 0) setViewingIndex(viewingIndex - 1)
                } else {
                  // Click right -> next story
                  if (viewingIndex < filteredStories.length - 1) setViewingIndex(viewingIndex + 1)
                  else setViewingIndex(null)
                }
              }}
            >
              {currentViewingStory.mediaType === "video" ? (
                <video
                  src={currentViewingStory.mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  className="fb-viewer-content-media"
                />
              ) : (
                <img
                  src={currentViewingStory.mediaUrl}
                  alt=""
                  className="fb-viewer-content-media"
                />
              )}

              {/* Story Caption Overlay */}
              {currentViewingStory.caption && (
                <div className="fb-viewer-caption-box">
                  <p>{currentViewingStory.caption}</p>
                </div>
              )}
            </div>

            {/* Prev / Next Chevrons */}
            {viewingIndex > 0 && (
              <button
                type="button"
                className="fb-viewer-nav-btn fb-viewer-prev"
                onClick={() => setViewingIndex(viewingIndex - 1)}
                title="Tin trước"
              >
                ‹
              </button>
            )}
            {viewingIndex < filteredStories.length - 1 && (
              <button
                type="button"
                className="fb-viewer-nav-btn fb-viewer-next"
                onClick={() => setViewingIndex(viewingIndex + 1)}
                title="Tin tiếp theo"
              >
                ›
              </button>
            )}

            {/* Bottom Actions Bar */}
            <div className="fb-viewer-footer">
              <input
                className="fb-viewer-reply-input"
                placeholder={`Gửi tin nhắn cho ${currentViewingStory.authorName}...`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    toast(`Đã gửi tin nhắn cho ${currentViewingStory.authorName}!`, "success")
                    ;(e.target as HTMLInputElement).value = ""
                  }
                }}
              />
              <button
                type="button"
                className={`fb-viewer-react-btn ${likedMap[currentViewingStory.id] ? "is-liked" : ""}`}
                onClick={() => toggleStoryLike(currentViewingStory.id)}
                title="Thả tim"
              >
                {likedMap[currentViewingStory.id] ? "❤️" : "🤍"}
              </button>
              <button
                type="button"
                className="fb-viewer-react-btn"
                onClick={() => toast("Đã thả 👍!", "info")}
                title="Thích"
              >
                👍
              </button>
              <button
                type="button"
                className="fb-viewer-react-btn"
                onClick={() => toast("Đã thả 🔥!", "info")}
                title="Lửa"
              >
                🔥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE STORY / REEL MODAL
          ========================================================================= */}
      {createModalOpen && (
        <div
          className="dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false)
          }}
        >
          <section className="action-dialog fb-create-story-dialog" role="dialog" aria-modal="true">
            <button
              className="dialog-close"
              onClick={() => setCreateModalOpen(false)}
              aria-label="Đóng"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">Trọ Ơi Stories</span>
            <h2>Tạo tin hoặc thước phim mới</h2>

            {/* Type selector */}
            <div className="fb-create-type-switch">
              <button
                type="button"
                className={`fb-type-btn ${storyType === "story" ? "active" : ""}`}
                onClick={() => setStoryType("story")}
              >
                📸 Tin (Story 24h)
              </button>
              <button
                type="button"
                className={`fb-type-btn ${storyType === "reel" ? "active" : ""}`}
                onClick={() => setStoryType("reel")}
              >
                🎬 Thước phim (Reel)
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="fb-create-story-form">
              {/* Media Preview Box */}
              <div className="fb-media-preview-box">
                {storyMediaType === "video" ? (
                  <video src={storyMedia} autoPlay loop muted playsInline className="fb-preview-img" />
                ) : (
                  <img src={storyMedia} alt="Xem trước" className="fb-preview-img" />
                )}
                <button
                  type="button"
                  className="fb-choose-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="camera" size={16} />
                  <span>Chọn ảnh / video từ máy</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </div>

              {/* Preset Room Aesthetics */}
              <div className="fb-preset-row">
                <span className="fb-preset-label">Hoặc chọn ảnh phòng mẫu:</span>
                <div className="fb-preset-chips">
                  {PRESET_PHOTOS.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      className={`fb-preset-chip ${storyMedia === p.url ? "selected" : ""}`}
                      onClick={() => {
                        setStoryMedia(p.url)
                        setStoryMediaType("image")
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Selector */}
              <div className="fb-tag-selector">
                <span className="fb-preset-label">Chủ đề tin:</span>
                <div className="fb-preset-chips">
                  {TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`fb-preset-chip ${selectedTag === tag ? "selected" : ""}`}
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <label className="form-field">
                <span>Nội dung / Lời nhắn</span>
                <textarea
                  rows={3}
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  placeholder="Ví dụ: Pass phòng ban công lầu 2 Ung Văn Khiêm, phòng mới sơn sửa sạch đẹp..."
                />
              </label>

              {/* Actions */}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="fb-btn-cancel"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="fb-btn-submit-story">
                  Chia sẻ lên {storyType === "story" ? "Tin" : "Thước phim"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
