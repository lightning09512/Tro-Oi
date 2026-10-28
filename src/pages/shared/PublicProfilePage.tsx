import ReportDialog from "@/components/common/ReportDialog"
import useDialogFocus from "@/hooks/useDialogFocus"
import { useRef, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import { useFavorites } from "@/contexts/FavoritesContext"
import { usePlatform, type PlatformUser, type ForumPost } from "@/contexts/PlatformContext"
import { useToast } from "@/contexts/ToastContext"
import { apiRequest, isApiMode } from "@/services/apiClient"

type ProfileLoadState = "loading" | "ready" | "unavailable" | "error"
type PublicProfile = {
  id: string
  name: string
  role: PlatformUser["role"]
  status: PlatformUser["status"]
  initials: string
  avatarUrl?: string
  phone?: string
  createdAt?: string
}

function ProfilePostCard({
  post,
  authorName,
  onPreviewImage,
}: {
  post: ForumPost
  authorName: string
  onPreviewImage: (url: string) => void
}) {
  const isLong = post.content.length > 220 || post.content.split("\n").length > 4
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="nhatot-post-item" key={post.id}>
      <div className="post-header-line">
        <div className="post-author-meta">
          <span className="post-author-name">{authorName}</span>
          <span className="post-time-meta">{post.time}</span>
        </div>
        <Link to="/dien-dan" className="post-forum-badge">Diễn đàn Trọ Ơi</Link>
      </div>

      <div className="post-copy-wrapper">
        <p className={`post-content-body${!expanded && isLong ? " is-collapsed" : ""}`}>{post.content}</p>
        {isLong && (
          <button
            type="button"
            className="post-expand-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? "Ẩn bớt" : "... Xem thêm"}
          </button>
        )}
      </div>

      {post.image && (
        <div
          className="post-photo-wrap"
          onClick={() => onPreviewImage(post.image ?? "")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onPreviewImage(post.image ?? "")
            }
          }}
          title="Bấm để xem ảnh phóng to đầy đủ"
        >
          <img
            src={post.image}
            alt="Ảnh bài viết"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/images/rooms/scandinavian-room.jpg"
            }}
          />
          <span className="post-photo-zoom-hint">
            <Icon name="search" size={13} />
            <span>Xem ảnh phóng to</span>
          </span>
        </div>
      )}

      <div className="post-footer-line">
        <div className="post-reaction-stats">
          <span><Icon name="heart" size={14} /> {post.likes} thích</span>
          <span><Icon name="chat" size={14} /> {post.commentsCount} bình luận</span>
        </div>
        <Link to={`/bai-viet/${post.id}`} className="post-read-link">
          Xem chi tiết bài viết <Icon name="chevron" size={13} />
        </Link>
      </div>
    </article>
  )
}

export default function PublicProfilePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favoriteIds } = useFavorites()
  const { toast } = useToast()
  const { users, posts, listings, startConversation } = usePlatform()

  const isPersonalRoute = !id || id === "me" || window.location.pathname === "/trang-ca-nhan"
  const isOwner = Boolean(user && (isPersonalRoute || user.id === id))
  const targetId = isOwner && user ? user.id : id

  const [remoteProfile, setRemoteProfile] = useState<PublicProfile | null>(null)
  const [loadState, setLoadState] = useState<ProfileLoadState>(
    isOwner ? "ready" : isApiMode ? "loading" : "ready"
  )
  const [retryKey, setRetryKey] = useState(0)
  const [messageError, setMessageError] = useState("")
  const [activeTab, setActiveTab] = useState<"listings" | "posts" | "favorites">("posts")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const previewDialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(previewDialogRef, () => setPreviewImage(null), Boolean(previewImage))


  useEffect(() => {
    if (isPersonalRoute && !user) {
      navigate("/dang-nhap", { state: { from: "/trang-ca-nhan" } })
      return
    }
    if (isOwner) {
      setLoadState("ready")
      return
    }
    if (!targetId) return
    if (!isApiMode) {
      setLoadState("ready")
      return
    }

    let active = true
    setLoadState("loading")
    setRemoteProfile(null)
    apiRequest<{ item: PublicProfile }>(`members/${encodeURIComponent(targetId)}`)
      .then(({ item }) => {
        if (!active) return
        setRemoteProfile(item)
        setLoadState("ready")
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : ""
        setLoadState(
          message.includes("(404)") || message.includes("không tồn tại") || message.includes("không còn hoạt động")
            ? "unavailable"
            : "error"
        )
      })
    return () => { active = false }
  }, [targetId, isOwner, isPersonalRoute, user, navigate, retryKey])

  const profile = useMemo(() => {
    if (isOwner && user) {
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        status: (user as any).status ?? "active",
        initials: user.initials,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        createdAt: (user as any).createdAt ?? new Date().toISOString(),
      } as PublicProfile
    }
    return isApiMode ? remoteProfile : (users.find((item) => item.id === targetId) as PublicProfile | undefined) ?? null
  }, [isOwner, user, isApiMode, remoteProfile, users, targetId])

  const publicPosts = useMemo(
    () => posts.filter((post) => post.authorId === targetId && post.status === "active"),
    [posts, targetId],
  )
  const publicListings = useMemo(
    () => listings.filter((listing) => listing.ownerId === targetId && listing.status === "active"),
    [listings, targetId],
  )
  const favoriteRooms = useMemo(
    () => listings.filter((listing) => favoriteIds.includes(listing.id) && listing.status === "active"),
    [listings, favoriteIds],
  )

  useEffect(() => {
    if (profile?.role === "landlord" && publicListings.length > 0) {
      setActiveTab("listings")
    } else {
      setActiveTab("posts")
    }
  }, [profile?.role, publicListings.length])

  const contactPhone = profile?.phone || user?.phone || publicListings[0]?.phone || ""
  const joinDate = useMemo(() => {
    if (!profile?.createdAt) return "Tháng 10/2026"
    const d = new Date(profile.createdAt)
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
  }, [profile?.createdAt])

  const userDistrict = useMemo(() => {
    if (publicListings.length) {
      const loc = publicListings[0].location
      const parts = loc.split(",").map((s) => s.trim()).filter(Boolean)
      if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
      return loc
    }
    if (publicPosts.length) {
      const fullText = publicPosts.map((p) => p.content).join(" ")
      if (/bình thạnh/i.test(fullText)) return "Bình Thạnh, TP. Hồ Chí Minh"
      if (/quận 10/i.test(fullText)) return "Quận 10, TP. Hồ Chí Minh"
      if (/tân bình/i.test(fullText)) return "Tân Bình, TP. Hồ Chí Minh"
      if (/thủ đức/i.test(fullText)) return "TP. Thủ Đức, TP. Hồ Chí Minh"
    }
    return "Chưa cập nhật khu vực"
  }, [publicListings, publicPosts])

  const openMessage = async () => {
    if (!profile) return
    if (!user) {
      navigate("/dang-nhap", { state: { from: `/nguoi-dung/${targetId}` } })
      return
    }
    setMessageError("")
    try {
      const conversation = await startConversation({
        accountId: user.id,
        name: profile.name,
        avatar: profile.initials,
        avatarUrl: profile.avatarUrl,
        userId: profile.id,
        roomId: publicListings[0]?.id ?? "",
      })
      if (conversation) navigate(`/tin-nhan?conversation=${conversation}`)
      else setMessageError("Chưa thể mở cuộc trò chuyện. Vui lòng thử lại.")
    } catch {
      setMessageError("Chưa thể mở cuộc trò chuyện. Vui lòng thử lại.")
    }
  }

  const handleShareProfile = async () => {
    const url = isOwner ? `${window.location.origin}/nguoi-dung/${profile?.id}` : window.location.href
    try {
      if (!navigator.clipboard) throw new Error("Trình duyệt chưa cho phép sao chép. Hãy sao chép địa chỉ trang.")
      await navigator.clipboard.writeText(url)
      toast("Đã sao chép liên kết trang cá nhân.", "success")
    } catch (caught) { toast(caught instanceof Error ? caught.message : "Không thể sao chép liên kết.", "error") }
  }

  const handleCopyPhone = async () => {
    if (contactPhone) {
      try {
        if (!navigator.clipboard) throw new Error("Trình duyệt chưa cho phép sao chép.")
        await navigator.clipboard.writeText(contactPhone)
        toast("Đã sao chép số điện thoại.", "success")
      } catch (caught) { toast(caught instanceof Error ? caught.message : "Không thể sao chép số điện thoại.", "error") }
    } else {
      toast("Thành viên chưa công khai số điện thoại.", "info")
    }
  }

  if (loadState === "loading") return (
    <main className="nhatot-page-wrapper">
      <div className="nhatot-container"><section className="nhatot-state-box" role="status">Đang tải trang cá nhân…</section></div>
    </main>
  )

  if (loadState === "error") return (
    <main className="nhatot-page-wrapper">
      <div className="nhatot-container"><section className="nhatot-state-box">
        <span className="state-icon"><Icon name="users" size={32}/></span>
        <h2>Không tải được thông tin</h2>
        <p>Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.</p>
        <div className="state-actions">
          <button className="nhatot-btn-chat" onClick={() => setRetryKey((v) => v + 1)}>Thử lại</button>
          <button className="nhatot-btn-secondary" onClick={() => navigate(-1)}>Quay lại</button>
        </div>
      </section></div>
    </main>
  )

  if (loadState === "unavailable" || !profile || profile.status !== "active" || profile.role === "admin") return (
    <main className="nhatot-page-wrapper">
      <div className="nhatot-container"><section className="nhatot-state-box">
        <span className="state-icon"><Icon name="users" size={32}/></span>
        <h2>Tài khoản không tồn tại</h2>
        <p>Người dùng này không tồn tại hoặc đã tạm dừng hoạt động.</p>
        <div className="state-actions">
          <button className="nhatot-btn-chat" onClick={() => navigate(-1)}>Quay lại</button>
          <button className="nhatot-btn-secondary" onClick={() => navigate("/dien-dan")}>Về diễn đàn</button>
        </div>
      </section></div>
    </main>
  )

  return (
    <main className="nhatot-page-wrapper">
      <div className="nhatot-container">
        {/* Breadcrumbs Navigation */}
        <nav className="nhatot-breadcrumb" aria-label="Đường dẫn">
          <Link to="/" className="breadcrumb-link"><Icon name="home" size={14} /> Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          {isOwner ? (
            <span className="breadcrumb-current">Trang cá nhân của tôi</span>
          ) : (
            <>
              <Link to="/dien-dan" className="breadcrumb-link">Cộng đồng</Link>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{profile.name}</span>
            </>
          )}
        </nav>

        {/* Profile Card (Nhà Tốt / Chợ Tốt Style) */}
        <section className="nhatot-profile-header-card">
          <div className="nhatot-profile-row">
            {/* Avatar */}
            <div className="nhatot-avatar-column">
              <div className="nhatot-avatar-box">
                {profile.avatarUrl && !avatarFailed ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="nhatot-avatar-image"
                    loading="lazy"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="nhatot-avatar-fallback">{profile.initials}</span>
                )}
                
              </div>
            </div>

            {/* Info */}
            <div className="nhatot-info-column">
              <div className="nhatot-name-line">
                <h1 className="nhatot-name-heading">{profile.name}</h1>
                <span className="nhatot-badge-tag">
                  {profile.role === "landlord" ? "Chủ trọ" : "Người thuê"}
                  {isOwner && " (Bạn)"}
                </span>
              </div>

              <div className="nhatot-details-grid">
                <div className="nhatot-detail-cell">
                  <Icon name="calendar" size={15} />
                  <span>Tham gia: <b>{joinDate}</b></span>
                </div>
                <div className="nhatot-detail-cell">
                  <Icon name="pin" size={15} />
                  <span>Khu vực: <b>{userDistrict}</b></span>
                </div>
                {isOwner && user?.email && (
                  <div className="nhatot-detail-cell">
                    <Icon name="users" size={15} />
                    <span>Email: <b>{user.email}</b></span>
                  </div>
                )}
                <div className="nhatot-detail-cell">
                  <Icon name="chat" size={15} />
                  <span>Phản hồi chat: <b>Thường trong 15 phút</b></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="nhatot-actions-column">
              {isOwner ? (
                <>
                  <Link to="/tai-khoan/ho-so" className="nhatot-btn-chat" title="Mở trang cài đặt và chỉnh sửa thông tin">
                    <Icon name="edit" size={16} />
                    <span>Cài đặt hồ sơ</span>
                  </Link>
                  <Link to="/tai-khoan/doi-mat-khau" className="nhatot-btn-phone" title="Đổi mật khẩu tài khoản">
                    <Icon name="shield" size={15} />
                    <span>Đổi mật khẩu</span>
                  </Link>
                  <button type="button" className="nhatot-btn-share" onClick={handleShareProfile} title="Sao chép liên kết trang cá nhân công khai">
                    <Icon name="share" size={16} />
                    <span>Chia sẻ</span>
                  </button>
                </>
              ) : (
                <>
                  {user?.role !== "admin" && (
                    <button type="button" className="nhatot-btn-chat" onClick={openMessage}>
                      <Icon name="chat" size={16} />
                      <span>Chat với {profile.name.split(" ").slice(-1)[0]}</span>
                    </button>
                  )}

                  {contactPhone && (
                    <button type="button" className="nhatot-btn-phone" onClick={handleCopyPhone} title="Bấm để sao chép số">
                      <Icon name="phone" size={15} />
                      <span>{contactPhone}</span>
                    </button>
                  )}

                  <button type="button" className="nhatot-btn-share" onClick={handleShareProfile} title="Sao chép liên kết">
                    <Icon name="share" size={16} />
                    <span>Chia sẻ</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {messageError && <p className="nhatot-error-msg">{messageError}</p>}
        </section>

        {/* Tabs Bar */}
        <div className="nhatot-tabs-bar">
          {profile.role === "landlord" && (
            <button
              type="button"
              className={`nhatot-tab-btn ${activeTab === "listings" ? "active" : ""}`}
              onClick={() => setActiveTab("listings")}
            >
              <span>{isOwner ? "Tin phòng của tôi" : "Phòng cho thuê"}</span>
              <span className="tab-pill-count">{publicListings.length}</span>
            </button>
          )}

          <button
            type="button"
            className={`nhatot-tab-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <span>{isOwner ? "Bài viết của tôi" : "Bài viết diễn đàn"}</span>
            <span className="tab-pill-count">{publicPosts.length}</span>
          </button>

          {isOwner && profile.role === "renter" && (
            <button
              type="button"
              className={`nhatot-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveTab("favorites")}
            >
              <span>Phòng yêu thích</span>
              <span className="tab-pill-count">{favoriteRooms.length}</span>
            </button>
          )}
        </div>

        {/* TAB 1: LISTINGS (LANDLORD) */}
        {activeTab === "listings" && (
          <section className="nhatot-listings-section">
            {isOwner && profile.role === "landlord" && (
              <div className="nhatot-owner-composer-card">
                <div className="composer-card-left">
                  <div className="composer-card-icon"><Icon name="building" size={20} /></div>
                  <div>
                    <strong>Quản lý phòng cho thuê</strong>
                    <p>Đăng tin mới để tiếp cận hàng ngàn người thuê mỗi ngày trên Trọ Ơi.</p>
                  </div>
                </div>
                <button type="button" className="nhatot-btn-chat" onClick={() => navigate("/chu-tro/dang-tin")}>
                  <Icon name="plus" size={15} /> Đăng tin mới
                </button>
              </div>
            )}

            {publicListings.length ? (
              <div className="nhatot-listings-stack">
                {publicListings.map((listing) => (
                  <Link to={`/phong/${listing.id}`} className="nhatot-listing-item" key={listing.id}>
                    <div className="listing-item-cover">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/images/rooms/scandinavian-room.jpg"
                        }}
                      />
                      <span className="listing-type-tag normal">{listing.type}</span>
                    </div>

                    <div className="listing-item-info">
                      <h2 className="listing-item-title">{listing.title}</h2>
                      <div className="listing-item-price-line">
                        <strong className="listing-price-text">{listing.price}</strong>
                        <span className="listing-period-text">/tháng</span>
                        <span className="listing-dot-separator">·</span>
                        <span className="listing-area-text">{listing.area || "Chưa cập nhật diện tích"}</span>
                      </div>

                      <p className="listing-item-address">
                        <Icon name="pin" size={14} />
                        <span>{listing.location}</span>
                      </p>

                      <div className="listing-item-footer">
                        <span className="listing-deposit-tag">
                          <Icon name="shield" size={13} />
                          <span>{listing.deposit || "Cọc thỏa thuận"}</span>
                        </span>
                        <span className="listing-cta-link">
                          Xem chi tiết <Icon name="chevron" size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="nhatot-empty-box">
                <Icon name="building" size={32} />
                <p>{isOwner ? "Bạn chưa đăng tin cho thuê phòng nào." : "Thành viên này hiện không có tin phòng nào đang mở."}</p>
                {isOwner && (
                  <Link to="/chu-tro/dang-tin" className="nhatot-btn-chat" style={{ marginTop: 8 }}>
                    Đăng tin phòng đầu tiên
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: POSTS */}
        {activeTab === "posts" && (
          <section className="nhatot-posts-section">
            {isOwner && (
              <div className="nhatot-owner-composer-card">
                <div className="composer-card-left">
                  <div className="composer-card-icon"><Icon name="edit" size={20} /></div>
                  <div>
                    <strong>Chia sẻ lên Diễn đàn Trọ Ơi</strong>
                    <p>Chia sẻ kinh nghiệm thuê trọ, tìm ở ghép hoặc chuyển nhượng cọc phòng...</p>
                  </div>
                </div>
                <button type="button" className="nhatot-btn-chat" onClick={() => navigate("/dien-dan")}>
                  <Icon name="plus" size={15} /> Viết bài mới
                </button>
              </div>
            )}

            {publicPosts.length ? (
              <div className="nhatot-posts-stack">
                {publicPosts.map((post) => (
                  <ProfilePostCard
                    key={post.id}
                    post={post}
                    authorName={profile.name}
                    onPreviewImage={setPreviewImage}
                  />
                ))}
              </div>
            ) : (
              <div className="nhatot-empty-box">
                <Icon name="chat" size={32} />
                <p>{isOwner ? "Bạn chưa có bài viết nào trên Diễn đàn." : "Thành viên này chưa có bài viết nào trên Diễn đàn."}</p>
                {isOwner && (
                  <Link to="/dien-dan" className="nhatot-btn-chat" style={{ marginTop: 8 }}>
                    Viết bài ngay
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: FAVORITES (RENTER OWNER) */}
        {activeTab === "favorites" && isOwner && (
          <section className="nhatot-listings-section">
            {favoriteRooms.length ? (
              <div className="nhatot-listings-stack">
                {favoriteRooms.map((listing) => (
                  <Link to={`/phong/${listing.id}`} className="nhatot-listing-item" key={listing.id}>
                    <div className="listing-item-cover">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/images/rooms/scandinavian-room.jpg"
                        }}
                      />
                      <span className="listing-type-tag normal">{listing.type}</span>
                    </div>

                    <div className="listing-item-info">
                      <h2 className="listing-item-title">{listing.title}</h2>
                      <div className="listing-item-price-line">
                        <strong className="listing-price-text">{listing.price}</strong>
                        <span className="listing-period-text">/tháng</span>
                        <span className="listing-dot-separator">·</span>
                        <span className="listing-area-text">{listing.area || "Chưa cập nhật diện tích"}</span>
                      </div>

                      <p className="listing-item-address">
                        <Icon name="pin" size={14} />
                        <span>{listing.location}</span>
                      </p>

                      <div className="listing-item-footer">
                        <span className="listing-deposit-tag">
                          <Icon name="shield" size={13} />
                          <span>{listing.deposit || "Cọc thỏa thuận"}</span>
                        </span>
                        <span className="listing-cta-link">
                          Xem chi tiết <Icon name="chevron" size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="nhatot-empty-box">
                <Icon name="heart" size={32} />
                <p>Bạn chưa lưu phòng trọ nào vào danh sách yêu thích.</p>
                <Link to="/tim-phong" className="nhatot-btn-chat" style={{ marginTop: 8 }}>
                  Khám phá phòng trọ ngay
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Subtle Footer Report Link (Only for other users) */}
        {!isOwner && publicListings.length > 0 && (
          <div className="nhatot-profile-footer">
            <button
              type="button"
              className="nhatot-report-link"
              onClick={() => setReportModalOpen(true)}
            >
              <Icon name="flag" size={14} />
              <span>Báo cáo tin phòng của người đăng</span>
            </button>
          </div>
        )}

        {reportModalOpen && publicListings[0] && <ReportDialog targetType="Tin phòng" targetId={publicListings[0].id} targetTitle={publicListings[0].title} onClose={() => setReportModalOpen(false)} />}

        {/* Lightbox Image Preview Modal */}
        {previewImage && (
          <div
            className="nhatot-image-lightbox"
            ref={previewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh phóng to"
            onClick={() => setPreviewImage(null)}
          >
            <button
              type="button"
              className="nhatot-lightbox-close"
              onClick={() => setPreviewImage(null)}
              aria-label="Đóng ảnh"
            >
              <Icon name="close" size={20} />
            </button>
            <div className="nhatot-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={previewImage} alt="Ảnh phóng to" className="nhatot-lightbox-img" />
              <div className="nhatot-lightbox-bar">
                <span>Bấm phím ESC hoặc chạm ra ngoài để đóng</span>
                <button
                  type="button"
                  className="nhatot-lightbox-btn"
                  onClick={() => window.open(previewImage, "_blank")}
                >
                  Mở ảnh gốc
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
