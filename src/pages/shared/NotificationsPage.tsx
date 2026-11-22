import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform, type NotificationRecord } from "@/contexts/PlatformContext"
import useAuth from "@/hooks/useAuth"

type TabType = "all" | "unread" | "listing" | "message" | "system"
type AdminTabType = "all" | "unread" | "moderation" | "listing" | "community"
type AdminNotifCategory = "moderation" | "listing" | "community" | "system"

function getAdminCategory(item: NotificationRecord): AdminNotifCategory {
  const text = `${item.title} ${item.detail}`.toLocaleLowerCase("vi")
  if (/báo cáo|vi phạm|khiếu nại|kiểm duyệt|tố cáo|lừa đảo|cảnh báo/.test(text)) {
    return "moderation"
  }
  if (/phòng|tin đăng|tin cho thuê|duyệt|thuê/.test(text)) {
    return "listing"
  }
  if (/diễn đàn|bài viết|bình luận|thành viên|tài khoản|chủ trọ|người thuê/.test(text)) {
    return "community"
  }
  return "system"
}

function getAdminCategoryMeta(category: AdminNotifCategory) {
  switch (category) {
    case "moderation":
      return {
        icon: "shield-check",
        label: "Kiểm duyệt & Báo cáo",
        bg: "#fff7ed",
        color: "#c2410c",
        border: "#fed7aa",
        isUrgent: true,
      }
    case "listing":
      return {
        icon: "building",
        label: "Tin cho thuê",
        bg: "#ecfdf5",
        color: "#047857",
        border: "#a7f3d0",
        isUrgent: false,
      }
    case "community":
      return {
        icon: "users",
        label: "Cộng đồng & Thành viên",
        bg: "#eff6ff",
        color: "#1d4ed8",
        border: "#bfdbfe",
        isUrgent: false,
      }
    case "system":
    default:
      return {
        icon: "bell",
        label: "Hệ thống",
        bg: "#f1f5f9",
        color: "#334155",
        border: "#e2e8f0",
        isUrgent: false,
      }
  }
}

function getAdminActionLink(category: AdminNotifCategory): { to: string; label: string } {
  switch (category) {
    case "moderation":
      return { to: "/admin/bao-cao", label: "Xử lý báo cáo" }
    case "listing":
      return { to: "/admin/tin-cho-thue", label: "Xem tin đăng" }
    case "community":
      return { to: "/admin/dien-dan", label: "Xem cộng đồng" }
    case "system":
    default:
      return { to: "/admin", label: "Về bảng quản trị" }
  }
}

function getCategory(item: NotificationRecord): "listing" | "message" | "community" | "system" {
  const text = (item.title + " " + item.detail).toLowerCase()
  if (text.includes("tin nhắn") || text.includes("trò chuyện") || text.includes("hẹn") || text.includes("liên hệ")) return "message"
  if (text.includes("phòng") || text.includes("tin đăng") || text.includes("duyệt") || text.includes("thuê")) return "listing"
  if (text.includes("diễn đàn") || text.includes("bài viết") || text.includes("bình luận")) return "community"
  return "system"
}

function getCategoryMeta(category: "listing" | "message" | "community" | "system") {
  switch (category) {
    case "message":
      return { icon: "chat", label: "Tin nhắn", bg: "#eff6ff", color: "#1d68bd", border: "#dbeafe" }
    case "listing":
      return { icon: "home", label: "Tin đăng", bg: "#fef8ee", color: "#b45b08", border: "#fdebd0" }
    case "community":
      return { icon: "users", label: "Diễn đàn", bg: "#f5f3ff", color: "#6d28d9", border: "#ede9fe" }
    case "system":
    default:
      return { icon: "bell", label: "Hệ thống", bg: "#edf7f0", color: "#245f3b", border: "#d8ebd9" }
  }
}

function getActionLink(item: NotificationRecord, role?: string): { to: string; label: string } | null {
  const text = (item.title + " " + item.detail).toLowerCase()
  if (text.includes("tin nhắn") || text.includes("trò chuyện")) {
    return { to: "/tin-nhan", label: "Mở cuộc trò chuyện" }
  }
  if (text.includes("diễn đàn") || text.includes("bài viết")) {
    return { to: "/dien-dan", label: "Xem diễn đàn" }
  }
  if (text.includes("phòng") || text.includes("tin đăng")) {
    if (role === "landlord") return { to: "/chu-tro/quan-ly-tin", label: "Xem tin đăng của tôi" }
    return { to: "/tim-phong", label: "Tìm phòng ngay" }
  }
  if (role === "admin") return { to: "/admin", label: "Về tổng quan" }
  return { to: "/tim-phong", label: "Khám phá phòng" }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (!Number.isFinite(date.getTime())) return "Chưa có thời gian"
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return `Hôm qua lúc ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return dateString
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    notifications,
    markNotificationsRead,
    markSingleNotificationRead,
    deleteNotification,
    clearAllNotifications,
  } = usePlatform()

  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [adminTab, setAdminTab] = useState<AdminTabType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const runAction = async (key: string, action: () => Promise<void>) => {
    if (busy) return
    setBusy(key)
    setError("")
    try { await action() }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể cập nhật thông báo. Vui lòng thử lại.") }
    finally { setBusy("") }
  }

  const mine = useMemo(
    () => notifications.filter((item) => item.userId === user?.id),
    [notifications, user?.id],
  )

  const unreadCount = useMemo(() => mine.filter((item) => !item.read).length, [mine])

  const counts = useMemo(() => {
    return {
      all: mine.length,
      unread: unreadCount,
      listing: mine.filter((item) => getCategory(item) === "listing").length,
      message: mine.filter((item) => getCategory(item) === "message").length,
      system: mine.filter((item) => {
        const cat = getCategory(item)
        return cat === "system" || cat === "community"
      }).length,
    }
  }, [mine, unreadCount])

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return mine.filter((item) => !item.read)
      case "listing":
        return mine.filter((item) => getCategory(item) === "listing")
      case "message":
        return mine.filter((item) => getCategory(item) === "message")
      case "system":
        return mine.filter((item) => {
          const cat = getCategory(item)
          return cat === "system" || cat === "community"
        })
      case "all":
      default:
        return mine
    }
  }, [mine, activeTab])

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return
    await runAction("all", () => markNotificationsRead(user.id))
  }

  const handleClearAll = async () => {
    if (!user || mine.length === 0) return
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo không?")) {
      await runAction("clear", () => clearAllNotifications(user.id))
    }
  }

  const handleToggleRead = async (item: NotificationRecord) => {
    await runAction(item.id, () => markSingleNotificationRead(item.id, !item.read))
  }

  const handleDelete = async (id: string) => {
    await runAction(id, () => deleteNotification(id))
  }

  const defaultActionPath =
    user?.role === "landlord"
      ? "/chu-tro/quan-ly-tin"
      : "/tim-phong"
  const defaultActionLabel =
    user?.role === "landlord"
      ? "Quản lý tin đăng"
      : "Khám phá phòng trọ"

  const adminCounts = useMemo(() => {
    let moderation = 0
    let listing = 0
    let community = 0
    for (const item of mine) {
      const cat = getAdminCategory(item)
      if (cat === "moderation") moderation++
      else if (cat === "listing") listing++
      else if (cat === "community") community++
    }
    return {
      all: mine.length,
      unread: unreadCount,
      moderation,
      listing,
      community,
    }
  }, [mine, unreadCount])

  const adminFiltered = useMemo(() => {
    const keyword = searchQuery.trim().toLocaleLowerCase("vi")
    return mine.filter((item) => {
      if (adminTab === "unread" && item.read) return false
      if (adminTab !== "all" && adminTab !== "unread" && getAdminCategory(item) !== adminTab) {
        return false
      }
      if (!keyword) return true
      return (
        item.title.toLocaleLowerCase("vi").includes(keyword) ||
        item.detail.toLocaleLowerCase("vi").includes(keyword)
      )
    })
  }, [mine, adminTab, searchQuery])

  const { unreadAdminItems, readAdminItems } = useMemo(() => {
    const unread: NotificationRecord[] = []
    const read: NotificationRecord[] = []
    for (const item of adminFiltered) {
      if (item.read) read.push(item)
      else unread.push(item)
    }
    unread.sort((a, b) => {
      const aUrgent = getAdminCategory(a) === "moderation" ? 0 : 1
      const bUrgent = getAdminCategory(b) === "moderation" ? 0 : 1
      return aUrgent - bUrgent
    })
    return { unreadAdminItems: unread, readAdminItems: read }
  }, [adminFiltered])

  if (user?.role === "admin") {
    const hasSearch = Boolean(searchQuery.trim())
    const isFiltering = adminTab !== "all" || hasSearch

    const renderAdminCard = (item: NotificationRecord) => {
      const category = getAdminCategory(item)
      const meta = getAdminCategoryMeta(category)
      const action = getAdminActionLink(category)
      const cardStateClass = !item.read ? (meta.isUrgent ? "is-urgent" : "is-unread") : ""

      return (
        <article key={item.id} className={`saas-notif-card ${cardStateClass}`.trim()}>
          <div
            className="saas-notif-icon-box"
            style={{
              backgroundColor: meta.bg,
              color: meta.color,
              borderColor: meta.border,
            }}
            aria-hidden="true"
          >
            <Icon name={meta.icon} size={19} />
          </div>

          <div className="saas-notif-card-body">
            <div className="saas-notif-card-head">
              <div className="saas-notif-title-group">
                {!item.read && (
                  <span
                    className={`saas-notif-status-dot${meta.isUrgent ? " is-urgent" : ""}`}
                    aria-label="Chưa đọc"
                    title="Chưa đọc"
                  />
                )}
                <span
                  className="saas-notif-cat-badge"
                  style={{
                    backgroundColor: meta.bg,
                    color: meta.color,
                    borderColor: meta.border,
                  }}
                >
                  {meta.label}
                </span>
                <h2 className="saas-notif-card-title">{item.title}</h2>
              </div>
              <span className="saas-notif-card-time">{formatRelativeTime(item.createdAt)}</span>
            </div>

            <p className="saas-notif-card-desc">{item.detail}</p>

            <div className="saas-notif-card-foot">
              <span className="saas-notif-read-state">
                {item.read ? "Đã xem" : "Chưa đọc"}
              </span>

              <div className="saas-notif-card-actions">
                <Link
                  to={action.to}
                  className={`saas-notif-cta${meta.isUrgent && !item.read ? " is-urgent" : ""}`}
                >
                  <span>{action.label}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>

                <button
                  type="button"
                  className="saas-notif-icon-btn"
                  disabled={Boolean(busy)}
                  aria-label={item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  title={item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  onClick={() => handleToggleRead(item)}
                >
                  <Icon name={item.read ? "eye" : "check"} size={15} />
                </button>

                <button
                  type="button"
                  className="saas-notif-icon-btn is-danger"
                  disabled={Boolean(busy)}
                  aria-label="Xóa thông báo"
                  title="Xóa thông báo này"
                  onClick={() => handleDelete(item.id)}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          </div>
        </article>
      )
    }

    return (
      <main className="saas-admin-notifications">
        {/* Thanh công cụ hợp nhất toàn chiều ngang */}
        <section className="saas-notif-toolbar" aria-label="Bộ lọc và thao tác thông báo">
          <div className="saas-notif-tabs" role="tablist" aria-label="Phân loại thông báo quản trị">
            {[
              { id: "all" as const, label: "Tất cả", count: adminCounts.all, warn: false },
              { id: "unread" as const, label: "Chưa đọc", count: adminCounts.unread, warn: true },
              { id: "moderation" as const, label: "Kiểm duyệt", count: adminCounts.moderation, warn: true },
              { id: "listing" as const, label: "Tin cho thuê", count: adminCounts.listing, warn: false },
              { id: "community" as const, label: "Cộng đồng", count: adminCounts.community, warn: false },
            ].map((tab) => {
              const isActive = adminTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`saas-notif-tab${isActive ? " is-active" : ""}`}
                  onClick={() => setAdminTab(tab.id)}
                >
                  <span>{tab.label}</span>
                  {(tab.id === "all" || tab.count > 0) && (
                    <span
                      className={`saas-notif-tab-count${tab.warn && tab.count > 0 && !isActive ? " is-warn" : ""}`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="saas-notif-tools">
            <div className="saas-notif-search">
              <span className="saas-notif-search-icon" aria-hidden="true">
                <Icon name="search" size={15} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm trong thông báo..."
                aria-label="Tìm trong thông báo"
              />
              {hasSearch && (
                <button
                  type="button"
                  className="saas-notif-search-clear"
                  aria-label="Xóa từ khóa tìm kiếm"
                  onClick={() => setSearchQuery("")}
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="saas-notif-tool-btn is-primary-soft"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || Boolean(busy)}
              title="Đánh dấu tất cả là đã đọc"
            >
              <Icon name="check" size={15} />
              <span>Đã đọc tất cả{unreadCount > 0 ? ` (${unreadCount})` : ""}</span>
            </button>

            {mine.length > 0 && (
              <button
                type="button"
                className="saas-notif-tool-btn is-danger"
                onClick={handleClearAll}
                disabled={Boolean(busy)}
                title="Xóa tất cả thông báo"
              >
                <Icon name="trash" size={14} />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </section>

        {error && (
          <p className="form-message error" role="alert">
            {error}
          </p>
        )}

        {adminFiltered.length > 0 ? (
          <div className="saas-notif-groups">
            {unreadAdminItems.length > 0 && (
              <section className="saas-notif-group" aria-label="Thông báo chưa đọc">
                <div className="saas-notif-group-head">
                  <span>Cần chú ý · Chưa đọc ({unreadAdminItems.length})</span>
                  <span>Ưu tiên cảnh báo kiểm duyệt</span>
                </div>
                <div className="saas-notif-feed">{unreadAdminItems.map(renderAdminCard)}</div>
              </section>
            )}

            {readAdminItems.length > 0 && (
              <section className="saas-notif-group" aria-label="Thông báo đã đọc">
                <div className="saas-notif-group-head">
                  <span>Hoạt động hệ thống đã xem ({readAdminItems.length})</span>
                </div>
                <div className="saas-notif-feed">{readAdminItems.map(renderAdminCard)}</div>
              </section>
            )}
          </div>
        ) : (
          <section className="saas-notif-empty">
            <div className="saas-notif-empty-icon" aria-hidden="true">
              <Icon name="bell" size={28} />
            </div>
            <h2>
              {isFiltering
                ? "Không có thông báo khớp bộ lọc"
                : "Chưa có thông báo mới nào"}
            </h2>
            <p>
              {isFiltering
                ? "Thử chuyển sang tab Tất cả hoặc xóa từ khóa tìm kiếm để xem toàn bộ lịch sử thông báo."
                : "Các biến động mới về báo cáo kiểm duyệt, tin cho thuê và hoạt động hệ thống gửi đến tài khoản quản trị sẽ hiển thị tại đây."}
            </p>
            <div className="saas-notif-empty-actions">
              {isFiltering ? (
                <button
                  type="button"
                  className="saas-notif-empty-btn is-primary"
                  onClick={() => {
                    setAdminTab("all")
                    setSearchQuery("")
                  }}
                >
                  Xem tất cả thông báo ({mine.length})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="saas-notif-empty-btn is-primary"
                    onClick={() => navigate("/admin")}
                  >
                    Về bảng quản trị
                  </button>
                  <button
                    type="button"
                    className="saas-notif-empty-btn is-outline"
                    onClick={() => navigate("/admin/bao-cao")}
                  >
                    Mở trang Kiểm duyệt
                  </button>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    )
  }

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <nav className="notif-breadcrumbs" aria-label="Đường dẫn trang">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Thông báo</span>
        </nav>

        <div className="notif-header-box">
          <div className="notif-title-area">
            <h1>Thông báo của bạn</h1>
            <p>
              Cập nhật tức thời về tin đăng, cuộc trò chuyện và các hoạt động trên hệ thống Trọ Ơi.
            </p>
          </div>

          <div className="notif-header-actions">
            <button
              type="button"
              className="notif-btn-secondary"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || Boolean(busy)}
              title="Đánh dấu tất cả là đã đọc"
            >
              <Icon name="check" size={16} />
              <span>Đã đọc tất cả {unreadCount > 0 ? `(${unreadCount})` : ""}</span>
            </button>

            {mine.length > 0 && (
              <button
                type="button"
                className="notif-btn-secondary notif-btn-danger"
                onClick={handleClearAll}
                disabled={Boolean(busy)}
                title="Xóa tất cả thông báo"
              >
                <Icon name="trash" size={15} />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        {error && <p className="form-message error" role="alert">{error}</p>}
        <div className="notif-tabs" aria-label="Lọc thông báo">
          <button
            type="button"
            className={`notif-tab ${activeTab === "all" ? "active" : ""}`}
            aria-pressed={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          >
            <span>Tất cả</span>
            <span className="notif-tab-badge">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "unread" ? "active" : ""}`}
            aria-pressed={activeTab === "unread"}
            onClick={() => setActiveTab("unread")}
          >
            <span>Chưa đọc</span>
            {counts.unread > 0 && <span className="notif-tab-badge">{counts.unread}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "listing" ? "active" : ""}`}
            aria-pressed={activeTab === "listing"}
            onClick={() => setActiveTab("listing")}
          >
            <span>Tin đăng</span>
            {counts.listing > 0 && <span className="notif-tab-badge">{counts.listing}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "message" ? "active" : ""}`}
            aria-pressed={activeTab === "message"}
            onClick={() => setActiveTab("message")}
          >
            <span>Tin nhắn</span>
            {counts.message > 0 && <span className="notif-tab-badge">{counts.message}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "system" ? "active" : ""}`}
            aria-pressed={activeTab === "system"}
            onClick={() => setActiveTab("system")}
          >
            <span>Hệ thống</span>
            {counts.system > 0 && <span className="notif-tab-badge">{counts.system}</span>}
          </button>
        </div>

        {filtered.length > 0 ? (
          <div className="notif-feed">
            {filtered.map((item) => {
              const category = getCategory(item)
              const meta = getCategoryMeta(category)
              const action = getActionLink(item, user?.role)

              return (
                <article
                  key={item.id}
                  className={`notif-card ${item.read ? "read" : "unread"}`}
                >
                  <div
                    className="notif-icon-bubble"
                    style={{
                      backgroundColor: meta.bg,
                      color: meta.color,
                      borderColor: meta.border,
                    }}
                    title={meta.label}
                  >
                    <Icon name={meta.icon} size={20} />
                  </div>

                  <div className="notif-content">
                    <div className="notif-headline">
                      <div className="notif-title-row">
                        {!item.read && <span className="notif-unread-dot" title="Chưa đọc" />}
                        <h2 className="notif-title">{item.title}</h2>
                      </div>

                      <div
                        className="notif-menu-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="notif-action-icon-btn"
                          disabled={Boolean(busy)}
                          aria-label={item.read ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                          onClick={() => handleToggleRead(item)}
                          title={item.read ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                        >
                          <Icon name={item.read ? "eye" : "check"} size={16} />
                        </button>
                        <button
                          type="button"
                          className="notif-action-icon-btn delete"
                          disabled={Boolean(busy)}
                          aria-label="Xóa thông báo"
                          onClick={() => handleDelete(item.id)}
                          title="Xóa thông báo này"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="notif-detail">{item.detail}</p>

                    <div className="notif-meta-bar" onClick={(e) => e.stopPropagation()}>
                      <div className="notif-meta-left">
                        <span
                          className="notif-category-chip"
                          style={{
                            backgroundColor: meta.bg,
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span className="notif-time">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {action && (
                        <Link to={action.to} className="notif-action-link">
                          <span>{action.label}</span>
                          <span aria-hidden="true">&rarr;</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <section className="notif-empty-card">
            <div className="notif-empty-icon">
              <Icon name="bell" size={32} />
            </div>
            <h2>
              {activeTab === "unread"
                ? "Tuyệt vời! Bạn không có thông báo chưa đọc"
                : activeTab === "all"
                  ? "Bạn chưa có thông báo nào"
                  : `Không có thông báo nào trong mục này`}
            </h2>
            <p>
              {activeTab === "unread"
                ? "Bạn đã cập nhật toàn bộ tin tức, tin nhắn và biến động tin đăng mới nhất."
                : "Khi có thông tin quan trọng hoặc hoạt động mới liên quan đến tài khoản, thông báo sẽ hiển thị ngay tại đây."}
            </p>
            {activeTab !== "all" ? (
              <Button variant="outline" onClick={() => setActiveTab("all")}>
                Xem tất cả thông báo ({mine.length})
              </Button>
            ) : (
              <Button onClick={() => navigate(defaultActionPath)}>{defaultActionLabel}</Button>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
