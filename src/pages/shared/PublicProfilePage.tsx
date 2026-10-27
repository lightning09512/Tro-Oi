import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Icon } from "@/components/common/legacy"
import useAuth from "@/hooks/useAuth"
import { usePlatform, type PlatformUser } from "@/contexts/PlatformContext"
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

export default function PublicProfilePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users, posts, listings, addReport, startConversation } = usePlatform()
  const [remoteProfile, setRemoteProfile] = useState<PublicProfile | null>(null)
  const [loadState, setLoadState] = useState<ProfileLoadState>(isApiMode ? "loading" : "ready")
  const [retryKey, setRetryKey] = useState(0)
  const [messageError, setMessageError] = useState("")
  const [activeTab, setActiveTab] = useState<"listings" | "posts">("listings")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("Tài khoản có dấu hiệu lừa đảo / cọc ảo")
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    if (user?.id === id) {
      navigate(user.role === "admin" ? "/admin/ho-so" : "/tai-khoan/ho-so", { replace: true })
      return
    }
    if (!isApiMode) {
      setLoadState("ready")
      return
    }

    let active = true
    setLoadState("loading")
    setRemoteProfile(null)
    apiRequest<{ item: PublicProfile }>(`members/${encodeURIComponent(id)}`)
      .then(({ item }) => {
        if (!active) return
        setRemoteProfile(item)
        setLoadState("ready")
      })
      .catch((error: unknown) => {
        if (!active) return
        const message = error instanceof Error ? error.message : ""
        setLoadState(message.includes("(404)") || message.includes("không tồn tại") || message.includes("không còn hoạt động") ? "unavailable" : "error")
      })
    return () => { active = false }
  }, [id, user?.id, user?.role, navigate, retryKey])

  const profile = isApiMode ? remoteProfile : (users.find((item) => item.id === id) as PublicProfile | undefined) ?? null

  const publicPosts = useMemo(
    () => posts.filter((post) => post.authorId === id && post.status === "active"),
    [posts, id],
  )
  const publicListings = useMemo(
    () => listings.filter((listing) => listing.ownerId === id && listing.status === "active"),
    [listings, id],
  )

  const hasTransferListings = useMemo(
    () => publicListings.some((listing) => listing.type === "Chuyển nhượng"),
    [publicListings],
  )

  useEffect(() => {
    if (publicListings.length === 0 && publicPosts.length > 0) {
      setActiveTab("posts")
    } else {
      setActiveTab("listings")
    }
  }, [publicListings.length, publicPosts.length])

  const contactPhone = profile?.phone || publicListings[0]?.phone || ""
  const joinDate = useMemo(() => {
    if (!profile?.createdAt) return "Tháng 10/2026"
    const d = new Date(profile.createdAt)
    return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
  }, [profile?.createdAt])

  const userDistrict = useMemo(() => {
    if (!publicListings.length) return "TP. Hồ Chí Minh"
    const loc = publicListings[0].location
    const parts = loc.split(",").map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    return loc
  }, [publicListings])

  const openMessage = async () => {
    if (!profile) return
    if (!user) {
      navigate("/dang-nhap", { state: { from: `/nguoi-dung/${id}` } })
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

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href)
    toast("Đã sao chép liên kết trang cá nhân!", "success")
  }

  const handleCopyPhone = () => {
    if (contactPhone) {
      navigator.clipboard?.writeText(contactPhone)
      toast(`Đã sao chép số điện thoại: ${contactPhone}`, "success")
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
          <Link to="/dien-dan" className="breadcrumb-link">Cộng đồng</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{profile.name}</span>
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
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="nhatot-avatar-fallback">{profile.initials}</span>
                )}
                {profile.status === "active" && <span className="nhatot-status-dot" title="Đang online" />}
              </div>
            </div>

            {/* Info */}
            <div className="nhatot-info-column">
              <div className="nhatot-name-line">
                <h1 className="nhatot-name-heading">{profile.name}</h1>
                <span className="nhatot-badge-tag">Cá nhân</span>
                {hasTransferListings && (
                  <span className="nhatot-badge-transfer">🔄 Đang pass phòng</span>
                )}
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
                <div className="nhatot-detail-cell">
                  <Icon name="chat" size={15} />
                  <span>Phản hồi chat: <b>Thường trong 15 phút</b></span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="nhatot-actions-column">
              {user?.id !== profile.id && user?.role !== "admin" && (
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
            </div>
          </div>

          {messageError && <p className="nhatot-error-msg">{messageError}</p>}
        </section>

        {/* Tabs Bar */}
        <div className="nhatot-tabs-bar">
          <button
            type="button"
            className={`nhatot-tab-btn ${activeTab === "listings" ? "active" : ""}`}
            onClick={() => setActiveTab("listings")}
          >
            <span>Tin đăng cho thuê / Pass phòng</span>
            <span className="tab-pill-count">{publicListings.length}</span>
          </button>

          <button
            type="button"
            className={`nhatot-tab-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            <span>Bài viết diễn đàn</span>
            <span className="tab-pill-count">{publicPosts.length}</span>
          </button>
        </div>

        {/* TAB 1: LISTINGS */}
        {activeTab === "listings" && (
          <section className="nhatot-listings-section">
            {publicListings.length ? (
              <div className="nhatot-listings-stack">
                {publicListings.map((listing) => (
                  <Link to={`/phong/${listing.id}`} className="nhatot-listing-item" key={listing.id}>
                    <div className="listing-item-cover">
                      <img
                        src={listing.image}
                        alt={listing.title}
                        onError={(e) => {
                          e.currentTarget.src = "/images/rooms/scandinavian-room.jpg"
                        }}
                      />
                      <span className={`listing-type-tag ${listing.type === "Chuyển nhượng" ? "transfer" : "normal"}`}>
                        {listing.type === "Chuyển nhượng" ? "🔄 Chuyển nhượng" : listing.type}
                      </span>
                    </div>

                    <div className="listing-item-info">
                      <h2 className="listing-item-title">{listing.title}</h2>
                      <div className="listing-item-price-line">
                        <strong className="listing-price-text">{listing.price}</strong>
                        <span className="listing-period-text">/tháng</span>
                        <span className="listing-dot-separator">·</span>
                        <span className="listing-area-text">{listing.area || "25 m²"}</span>
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
                <p>Thành viên này hiện không có tin phòng nào đang mở.</p>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: POSTS */}
        {activeTab === "posts" && (
          <section className="nhatot-posts-section">
            {publicPosts.length ? (
              <div className="nhatot-posts-stack">
                {publicPosts.map((post) => (
                  <article className="nhatot-post-item" key={post.id}>
                    <div className="post-header-line">
                      <div className="post-author-meta">
                        <span className="post-author-name">{profile.name}</span>
                        <span className="post-time-meta">{post.time}</span>
                      </div>
                      <Link to="/dien-dan" className="post-forum-badge">Diễn đàn Trọ Ơi</Link>
                    </div>

                    <p className="post-content-body">{post.content}</p>

                    {post.image && (
                      <div className="post-photo-wrap">
                        <img src={post.image} alt="Ảnh bài viết" />
                      </div>
                    )}

                    <div className="post-footer-line">
                      <div className="post-reaction-stats">
                        <span><Icon name="heart" size={14} /> {post.likes} thích</span>
                        <span><Icon name="chat" size={14} /> {post.commentsCount} bình luận</span>
                      </div>
                      <Link to="/dien-dan" className="post-read-link">
                        Xem trên Diễn đàn <Icon name="chevron" size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="nhatot-empty-box">
                <Icon name="chat" size={32} />
                <p>Thành viên này chưa có bài viết nào trên Diễn đàn.</p>
              </div>
            )}
          </section>
        )}

        {/* Subtle Footer Report Link */}
        <div className="nhatot-profile-footer">
          <button
            type="button"
            className="nhatot-report-link"
            onClick={() => setReportModalOpen(true)}
          >
            <Icon name="flag" size={14} />
            <span>Báo cáo tài khoản nếu có dấu hiệu gian lận</span>
          </button>
        </div>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setReportModalOpen(false) }}>
            <section className="action-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
              <button className="dialog-close" onClick={() => setReportModalOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
              <div className="dialog-header-custom">
                <span className="dialog-badge-icon report-badge-icon"><Icon name="flag" size={22} /></span>
                <div>
                  <h2 id="report-modal-title">Báo cáo người dùng</h2>
                  <p className="dialog-subtitle">Gửi phản ánh về {profile.name} tới Ban quản trị Trọ Ơi</p>
                </div>
              </div>

              <div className="report-form-body">
                <div className="report-field-group">
                  <label className="schedule-label">Lý do báo cáo:</label>
                  <div className="report-radio-list">
                    {[
                      "Tài khoản có dấu hiệu lừa đảo / cọc ảo",
                      "Thông tin phòng hoặc giá thuê sai lệch thực tế",
                      "Ngôn từ quấy rối, xúc phạm hoặc thái độ không phù hợp",
                      "Spam hoặc quảng cáo dịch vụ trái phép",
                      "Khác",
                    ].map((reason) => (
                      <label key={reason} className="report-radio-label">
                        <input
                          type="radio"
                          name="profileReportReason"
                          value={reason}
                          checked={reportReason === reason}
                          onChange={(e) => setReportReason(e.target.value)}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="report-field-group">
                  <label className="schedule-label" htmlFor="report-profile-desc">Mô tả chi tiết vi phạm:</label>
                  <textarea
                    id="report-profile-desc"
                    className="report-desc-input"
                    rows={3}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Mô tả cụ thể để BQT kiểm tra và xử lý..."
                  />
                </div>
              </div>

              <div className="dialog-actions-row">
                <button type="button" className="btn-cancel" onClick={() => setReportModalOpen(false)}>Hủy</button>
                <button
                  type="button"
                  className="btn-confirm-report"
                  disabled={isSubmittingReport}
                  onClick={async () => {
                    if (!user) {
                      navigate("/dang-nhap", { state: { from: `/nguoi-dung/${id}` } })
                      return
                    }
                    setIsSubmittingReport(true)
                    try {
                      await addReport({
                        reporterId: user.id,
                        reporter: user.name,
                        targetType: "Tin phòng",
                        targetId: publicListings[0]?.id ?? profile.id,
                        targetTitle: `Hồ sơ tài khoản ${profile.name}`,
                        reason: reportReason,
                        description: reportDescription || `Báo cáo tài khoản ${profile.name}: ${reportReason}`,
                      })
                      setReportModalOpen(false)
                      setReportDescription("")
                      toast("Cảm ơn bạn! BQT Trọ Ơi đã tiếp nhận báo cáo và sẽ xác minh xử lý.", "success")
                    } catch {
                      toast("Có lỗi xảy ra khi gửi báo cáo.", "error")
                    } finally {
                      setIsSubmittingReport(false)
                    }
                  }}
                >
                  {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
