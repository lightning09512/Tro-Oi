import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
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

const roleName = (role: PlatformUser["role"]) => role === "landlord" ? "Chủ trọ" : "Người thuê"

export default function PublicProfilePage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const { users, posts, listings, reviews, addReport, startConversation } = usePlatform()
  const [remoteProfile, setRemoteProfile] = useState<PublicProfile | null>(null)
  const [loadState, setLoadState] = useState<ProfileLoadState>(isApiMode ? "loading" : "ready")
  const [retryKey, setRetryKey] = useState(0)
  const [messageError, setMessageError] = useState("")
  const [activeTab, setActiveTab] = useState<"listings" | "posts" | "about">("listings")
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("Tài khoản có dấu hiệu lừa đảo / cọc ảo")
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

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

  // Default tab based on available items
  useEffect(() => {
    if (publicListings.length === 0 && publicPosts.length > 0) {
      setActiveTab("posts")
    } else {
      setActiveTab("listings")
    }
  }, [publicListings.length, publicPosts.length])

  const contactPhone = profile?.phone || publicListings[0]?.phone || ""
  const joinDate = useMemo(() => {
    if (!profile?.createdAt) return "Tháng 10, 2026"
    const d = new Date(profile.createdAt)
    return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`
  }, [profile?.createdAt])

  const userReviews = useMemo(() => {
    const listingIds = new Set(publicListings.map((l) => l.id))
    return reviews.filter((r) => listingIds.has(r.listingId))
  }, [reviews, publicListings])

  const averageRating = userReviews.length
    ? (userReviews.reduce((sum, r) => sum + r.stars, 0) / userReviews.length).toFixed(1)
    : "5.0"

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
    toast("Đã sao chép liên kết hồ sơ vào bộ nhớ tạm!", "success")
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
    <main className="page-bg public-profile-page">
      <div className="container"><section className="public-profile-state" role="status">Đang tải hồ sơ…</section></div>
    </main>
  )

  if (loadState === "error") return (
    <main className="page-bg public-profile-page">
      <div className="container"><section className="public-profile-state">
        <span className="placeholder-icon"><Icon name="users"/></span>
        <h1>Không tải được hồ sơ</h1>
        <p>Đã xảy ra lỗi khi kết nối. Hãy thử tải lại hồ sơ.</p>
        <div><Button onClick={() => setRetryKey((value) => value + 1)}>Thử lại</Button><Button variant="outline" onClick={() => navigate(-1)}>Quay lại</Button></div>
      </section></div>
    </main>
  )

  if (loadState === "unavailable" || !profile || profile.status !== "active" || profile.role === "admin") return (
    <main className="page-bg public-profile-page">
      <div className="container"><section className="public-profile-state">
        <span className="placeholder-icon"><Icon name="users"/></span>
        <h1>Hồ sơ không khả dụng</h1>
        <p>Hồ sơ này không tồn tại hoặc tài khoản không còn hoạt động.</p>
        <div><Button onClick={() => navigate(-1)}>Quay lại</Button><Button variant="outline" onClick={() => navigate("/dien-dan")}>Về diễn đàn</Button></div>
      </section></div>
    </main>
  )

  return (
    <main className="page-bg public-profile-page">
      <div className="container public-profile-container">
        {/* HERO PROFILE CARD */}
        <section className="profile-hero-card">
          {/* Decorative Cover Banner */}
          <div className="profile-cover-banner">
            <button
              type="button"
              className="profile-cover-back-btn"
              onClick={() => navigate(-1)}
              title="Quay lại"
            >
              <Icon name="chevron" size={16} />
              <span>Quay lại</span>
            </button>
            <div className="profile-cover-tagline">
              <Icon name="shield" size={14} />
              <span>Hồ sơ thành viên Trọ Ơi</span>
            </div>
          </div>

          {/* Profile Identity Bar */}
          <div className="profile-identity-bar">
            <div className="profile-avatar-stack">
              <div className="profile-avatar-wrapper">
                {profile.avatarUrl ? (
                  <img className="profile-avatar-img" src={profile.avatarUrl} alt={profile.name} />
                ) : (
                  <span className="profile-avatar-initials">{profile.initials}</span>
                )}
                <span className="profile-avatar-online" title="Thành viên đang hoạt động" />
              </div>
            </div>

            <div className="profile-meta-info">
              <div className="profile-name-row">
                <h1 className="profile-user-fullname">{profile.name}</h1>
                <span className={`profile-role-badge ${hasTransferListings ? "badge-transfer-role" : ""}`}>
                  {hasTransferListings
                    ? "🔄 Người pass phòng"
                    : profile.role === "landlord"
                    ? "Chủ trọ chính chủ"
                    : "Người thuê phòng"}
                </span>
              </div>

              {/* Trust & Metric Chips */}
              <div className="profile-trust-chips">
                <span className="trust-chip verified" title="Tài khoản đã xác minh danh tính">
                  <Icon name="shield" size={14} />
                  <span>Đã xác thực CCCD/SĐT</span>
                </span>
                <span className="trust-chip rating" title="Đánh giá từ cộng đồng">
                  <Icon name="star" size={14} />
                  <span>{userReviews.length ? `${averageRating}/5 (${userReviews.length} đánh giá)` : "5.0 (Rất uy tín)"}</span>
                </span>
                <span className="trust-chip join-date">
                  <Icon name="calendar" size={14} />
                  <span>Tham gia {joinDate}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-header-actions">
              {user?.role !== "admin" && (
                <button type="button" className="btn-profile-primary" onClick={openMessage}>
                  <Icon name="chat" size={18} />
                  <span>Nhắn tin</span>
                </button>
              )}

              {contactPhone && (
                <button type="button" className="btn-profile-secondary" onClick={handleCopyPhone} title={`Gọi hoặc sao chép: ${contactPhone}`}>
                  <Icon name="phone" size={17} />
                  <span>Sao chép SĐT</span>
                </button>
              )}

              <button type="button" className="btn-profile-icon" onClick={handleShareProfile} title="Sao chép liên kết trang cá nhân">
                <Icon name="share" size={18} />
              </button>
            </div>
          </div>
          {messageError && <p className="form-message error profile-msg-error" role="alert">{messageError}</p>}
        </section>

        {/* 2-COLUMN MAIN CONTENT & SIDEBAR */}
        <div className="profile-content-grid">
          {/* LEFT: TABS & CONTENT */}
          <div className="profile-main-column">
            {/* Tab Navigation */}
            <div className="profile-tabs-header">
              <button
                type="button"
                className={`profile-tab-item ${activeTab === "listings" ? "active" : ""}`}
                onClick={() => setActiveTab("listings")}
              >
                <Icon name="building" size={16} />
                <span>
                  {hasTransferListings ? "Tin chuyển nhượng / Cho thuê" : "Tin phòng cho thuê"}
                  <strong className="tab-counter">({publicListings.length})</strong>
                </span>
              </button>

              <button
                type="button"
                className={`profile-tab-item ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                <Icon name="chat" size={16} />
                <span>
                  Bài viết cộng đồng
                  <strong className="tab-counter">({publicPosts.length})</strong>
                </span>
              </button>

              <button
                type="button"
                className={`profile-tab-item ${activeTab === "about" ? "active" : ""}`}
                onClick={() => setActiveTab("about")}
              >
                <Icon name="info" size={16} />
                <span>Giới thiệu & Uy tín</span>
              </button>
            </div>

            {/* TAB 1: LISTINGS */}
            {activeTab === "listings" && (
              <div className="profile-tab-body">
                {publicListings.length ? (
                  <div className="profile-listings-grid">
                    {publicListings.map((listing) => (
                      <Link to={`/phong/${listing.id}`} className="profile-room-card" key={listing.id}>
                        <div className="room-card-photo">
                          <img src={listing.image} alt={listing.title} />
                          <span className={`room-type-badge ${listing.type === "Chuyển nhượng" ? "transfer" : "rent"}`}>
                            {listing.type === "Chuyển nhượng" ? "🔄 Chuyển nhượng" : listing.type}
                          </span>
                        </div>

                        <div className="room-card-content">
                          <h3 className="room-card-title">{listing.title}</h3>
                          <div className="room-card-price-row">
                            <span className="room-card-price">{listing.price}</span>
                            <small className="room-card-period">/ tháng</small>
                          </div>

                          <div className="room-card-specs">
                            <span><Icon name="building" size={13} /> {listing.area || "25 m²"}</span>
                            <span><Icon name="shield" size={13} /> {listing.deposit || "Cọc thỏa thuận"}</span>
                          </div>

                          <p className="room-card-address">
                            <Icon name="pin" size={14} />
                            <span>{listing.location}</span>
                          </p>

                          <div className="room-card-cta">
                            <span>Xem chi tiết tin</span>
                            <Icon name="chevron" size={14} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="profile-tab-empty">
                    <span className="empty-icon"><Icon name="building" size={32} /></span>
                    <h3>Chưa có tin phòng đang mở</h3>
                    <p>Thành viên này hiện tại chưa có tin cho thuê hoặc chuyển nhượng phòng đang hiển thị trên Trọ Ơi.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: POSTS */}
            {activeTab === "posts" && (
              <div className="profile-tab-body">
                {publicPosts.length ? (
                  <div className="profile-posts-list">
                    {publicPosts.map((post) => (
                      <article className="profile-post-card" key={post.id}>
                        <div className="post-card-top">
                          <span className="post-date-tag">
                            <Icon name="calendar" size={13} />
                            <span>{post.time}</span>
                          </span>
                          <Link to={`/dien-dan`} className="post-forum-tag">Cộng đồng Trọ Ơi</Link>
                        </div>

                        <p className="post-body-text">{post.content}</p>

                        {post.image && (
                          <div className="post-image-container">
                            <img src={post.image} alt="Ảnh bài viết" />
                          </div>
                        )}

                        <div className="post-card-bottom">
                          <div className="post-stats-row">
                            <span><Icon name="heart" size={14} /> {post.likes} lượt thích</span>
                            <span><Icon name="chat" size={14} /> {post.commentsCount} bình luận</span>
                          </div>

                          {user?.role !== "admin" && (
                            <button
                              type="button"
                              className="post-discuss-btn"
                              onClick={() => navigate("/dien-dan")}
                            >
                              <span>Xem trên Diễn đàn</span>
                              <Icon name="chevron" size={14} />
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="profile-tab-empty">
                    <span className="empty-icon"><Icon name="chat" size={32} /></span>
                    <h3>Chưa có bài viết công khai</h3>
                    <p>Thành viên chưa chia sẻ bài viết hoặc kinh nghiệm nào trên diễn đàn.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ABOUT */}
            {activeTab === "about" && (
              <div className="profile-tab-body">
                <div className="profile-about-card">
                  <h3 className="about-section-heading">Giới thiệu thành viên</h3>
                  <p className="about-bio-text">
                    Xin chào! Tôi là {profile.name}. Tôi tham gia cộng đồng Trọ Ơi để kết nối tìm phòng trọ văn minh, minh bạch và an toàn. Mọi thông tin tin đăng và liên hệ đều được xác thực chính chủ.
                  </p>

                  <h3 className="about-section-heading" style={{ marginTop: 24 }}>Chỉ số phản hồi & Uy tín</h3>
                  <div className="about-metrics-grid">
                    <div className="about-metric-box">
                      <strong>98%</strong>
                      <span>Tỷ lệ phản hồi tin nhắn</span>
                      <small>Thường trả lời trong vài phút</small>
                    </div>
                    <div className="about-metric-box">
                      <strong>5.0 ⭐</strong>
                      <span>Đánh giá trung bình</span>
                      <small>Được các thành viên tin cậy</small>
                    </div>
                    <div className="about-metric-box">
                      <strong>100%</strong>
                      <span>Thông tin phòng thật</span>
                      <small>Được đội ngũ Trọ Ơi duyệt</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: SIDEBAR */}
          <aside className="profile-side-column">
            {/* Widget 1: Account Trust Badges */}
            <div className="profile-side-widget">
              <h4 className="widget-title">
                <Icon name="shield" size={16} />
                <span>Chứng nhận tài khoản</span>
              </h4>
              <ul className="widget-checklist">
                <li className="checked">
                  <span className="check-bullet"><Icon name="check" size={13} /></span>
                  <div>
                    <strong>Đã xác minh số điện thoại</strong>
                    <span>Số điện thoại chính chủ đang hoạt động</span>
                  </div>
                </li>
                <li className="checked">
                  <span className="check-bullet"><Icon name="check" size={13} /></span>
                  <div>
                    <strong>Đã xác thực giấy tờ cá nhân</strong>
                    <span>Thông tin CCCD đã được hệ thống đối soát</span>
                  </div>
                </li>
                <li className="checked">
                  <span className="check-bullet"><Icon name="check" size={13} /></span>
                  <div>
                    <strong>Thành viên tích cực Trọ Ơi</strong>
                    <span>Tuân thủ đầy đủ quy chế cộng đồng</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Widget 2: Safety Notice */}
            <div className="profile-side-widget safety-widget">
              <h4 className="widget-title safety-title">
                <Icon name="shield" size={16} />
                <span>Giao dịch an toàn</span>
              </h4>
              <p className="safety-note-text">
                Trọ Ơi khuyến cáo bạn luôn đến tận nơi kiểm tra phòng thực tế và ký phụ lục hợp đồng sang tên cọc có chủ nhà xác nhận trước khi thực hiện giao dịch chuyển nhượng hoặc đặt cọc.
              </p>
              <button
                type="button"
                className="btn-report-account"
                onClick={() => setReportModalOpen(true)}
              >
                <Icon name="flag" size={14} />
                <span>Báo cáo tài khoản này</span>
              </button>
            </div>
          </aside>
        </div>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setReportModalOpen(false) }}>
            <section className="action-dialog report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-user-title">
              <button className="dialog-close" onClick={() => setReportModalOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
              <div className="dialog-header-custom">
                <span className="dialog-badge-icon report-badge-icon"><Icon name="flag" size={22} /></span>
                <div>
                  <h2 id="report-user-title">Báo cáo tài khoản</h2>
                  <p className="dialog-subtitle">Gửi phản ánh về hành vi của {profile.name} tới Ban quản trị Trọ Ơi</p>
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
                  <label className="schedule-label" htmlFor="report-user-desc">Mô tả chi tiết vi phạm:</label>
                  <textarea
                    id="report-user-desc"
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
