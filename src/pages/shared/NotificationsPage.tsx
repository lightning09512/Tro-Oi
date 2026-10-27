import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import { usePlatform, type NotificationRecord } from "@/contexts/PlatformContext"
import useAuth from "@/hooks/useAuth"

type TabType = "all" | "unread" | "listing" | "message" | "system"

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
    await markNotificationsRead(user.id)
  }

  const handleClearAll = async () => {
    if (!user || mine.length === 0) return
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo không?")) {
      await clearAllNotifications(user.id)
    }
  }

  const handleToggleRead = async (item: NotificationRecord) => {
    await markSingleNotificationRead(item.id, !item.read)
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const defaultActionPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "landlord"
        ? "/chu-tro/quan-ly-tin"
        : "/tim-phong"
  const defaultActionLabel =
    user?.role === "admin"
      ? "Về trang quản trị"
      : user?.role === "landlord"
        ? "Quản lý tin đăng"
        : "Khám phá phòng trọ"

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <nav className="notif-breadcrumbs" aria-label="Đường dẫn trang">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          {user?.role === "admin" ? (
            <>
              <Link to="/admin">Quản trị</Link>
              <span>/</span>
            </>
          ) : null}
          <span>Thông báo</span>
        </nav>

        <div className="notif-header-box">
          <div className="notif-title-area">
            <span className="eyebrow">Trung tâm thông báo</span>
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
              disabled={unreadCount === 0}
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
                title="Xóa tất cả thông báo"
              >
                <Icon name="trash" size={15} />
                <span>Xóa tất cả</span>
              </button>
            )}
          </div>
        </div>

        <div className="notif-tabs" role="tablist">
          <button
            type="button"
            className={`notif-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>Tất cả</span>
            <span className="notif-tab-badge">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            <span>Chưa đọc</span>
            {counts.unread > 0 && <span className="notif-tab-badge">{counts.unread}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "listing" ? "active" : ""}`}
            onClick={() => setActiveTab("listing")}
          >
            <span>Tin đăng</span>
            {counts.listing > 0 && <span className="notif-tab-badge">{counts.listing}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "message" ? "active" : ""}`}
            onClick={() => setActiveTab("message")}
          >
            <span>Tin nhắn</span>
            {counts.message > 0 && <span className="notif-tab-badge">{counts.message}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeTab === "system" ? "active" : ""}`}
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
                  onClick={() => {
                    if (!item.read) markSingleNotificationRead(item.id, true)
                  }}
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
                          onClick={() => handleToggleRead(item)}
                          title={item.read ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                        >
                          <Icon name={item.read ? "eye" : "check"} size={16} />
                        </button>
                        <button
                          type="button"
                          className="notif-action-icon-btn delete"
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
