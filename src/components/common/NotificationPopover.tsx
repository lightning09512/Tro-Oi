import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import { usePlatform, type NotificationRecord } from "@/contexts/PlatformContext"
import useAuth from "@/hooks/useAuth"

type MainTab = "activity" | "news"
type FilterCategory = "all" | "account" | "transaction" | "listing" | "event"

function getCategory(item: NotificationRecord): "account" | "transaction" | "listing" | "event" {
  const text = (item.title + " " + item.detail).toLowerCase()
  if (text.includes("điểm") || text.includes("giao dịch") || text.includes("thanh toán") || text.includes("tiền") || text.includes("cọc")) {
    return "transaction"
  }
  if (text.includes("tài khoản") || text.includes("chào mừng") || text.includes("mật khẩu") || text.includes("bảo mật") || text.includes("hồ sơ")) {
    return "account"
  }
  if (text.includes("phòng") || text.includes("tin đăng") || text.includes("duyệt") || text.includes("thuê") || text.includes("lịch hẹn") || text.includes("tin nhắn") || text.includes("chủ trọ")) {
    return "listing"
  }
  return "event"
}

function getCategoryBadge(category: "account" | "transaction" | "listing" | "event") {
  switch (category) {
    case "account":
      return {
        bg: "#e0f2fe",
        color: "#0284c7",
        icon: <Icon name="users" size={17} />,
      }
    case "transaction":
      return {
        bg: "#dcfce7",
        color: "#16a34a",
        icon: <Icon name="chart" size={17} />,
      }
    case "listing":
      return {
        bg: "#fef3c7",
        color: "#d97706",
        icon: <Icon name="home" size={17} />,
      }
    case "event":
    default:
      return {
        bg: "#ede9fe",
        color: "#7c3aed",
        icon: <Icon name="star" size={17} />,
      }
  }
}

function getTargetUrl(item: NotificationRecord, role?: string): string {
  const text = (item.title + " " + item.detail).toLowerCase()
  if (text.includes("tin nhắn") || text.includes("trò chuyện")) return "/tin-nhan"
  if (text.includes("diễn đàn") || text.includes("bài viết")) return "/dien-dan"
  if (text.includes("phòng") || text.includes("tin đăng")) {
    if (role === "landlord") return "/chu-tro/quan-ly-tin"
    return "/tim-phong"
  }
  if (role === "admin") return "/admin"
  return "/tim-phong"
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Gần đây"
  try {
    const date = new Date(dateString)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return "Hôm qua"
    if (diffDays < 7) {
      const weekdays = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
      return `${weekdays[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
  } catch {
    return "Gần đây"
  }
}

export default function NotificationPopover({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    notifications,
    markNotificationsRead,
    markSingleNotificationRead,
  } = usePlatform()

  const [mainTab, setMainTab] = useState<MainTab>("activity")
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all")

  const myNotifications = useMemo(() => {
    return notifications.filter((item) => item.userId === user?.id)
  }, [notifications, user?.id])

  const unreadCount = useMemo(() => {
    return myNotifications.filter((item) => !item.read).length
  }, [myNotifications])

  // Filter based on main tab (Hoạt Động vs Tin Tức)
  const tabFiltered = useMemo(() => {
    if (mainTab === "news") {
      return myNotifications.filter((item) => {
        const cat = getCategory(item)
        const text = (item.title + " " + item.detail).toLowerCase()
        return cat === "event" || text.includes("tin tức") || text.includes("diễn đàn") || text.includes("mẹo")
      })
    }
    // Activity tab shows transactions, account, and listings
    return myNotifications.filter((item) => {
      const cat = getCategory(item)
      return cat !== "event" || (item.title + " " + item.detail).toLowerCase().includes("điểm")
    })
  }, [myNotifications, mainTab])

  // Sub-filter by chips (Tài khoản, Giao dịch, Tin đăng, Sự kiện)
  const displayItems = useMemo(() => {
    if (filterCategory === "all") return tabFiltered
    return tabFiltered.filter((item) => getCategory(item) === filterCategory)
  }, [tabFiltered, filterCategory])

  const handleMarkAllRead = () => {
    if (user?.id) {
      markNotificationsRead(user.id)
    }
  }

  const handleItemClick = (item: NotificationRecord) => {
    if (!item.read) {
      markSingleNotificationRead(item.id, true)
    }
    const targetUrl = getTargetUrl(item, user?.role)
    onClose()
    navigate(targetUrl)
  }

  return (
    <div className="notification-popover" role="dialog" aria-label="Thông báo">
      {/* Header */}
      <div className="notification-popover-head">
        <div className="notification-head-row">
          <h3 className="notification-head-title">Thông Báo</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="notification-mark-all-btn"
              onClick={handleMarkAllRead}
            >
              <Icon name="check" size={14} />
              <span>Đã đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Nhà Tốt style 2 primary tabs: Hoạt Động & Tin Tức */}
        <div className="notification-main-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "activity"}
            className={`notification-tab-btn${mainTab === "activity" ? " is-active" : ""}`}
            onClick={() => {
              setMainTab("activity")
              setFilterCategory("all")
            }}
          >
            Hoạt Động
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "news"}
            className={`notification-tab-btn${mainTab === "news" ? " is-active" : ""}`}
            onClick={() => {
              setMainTab("news")
              setFilterCategory("all")
            }}
          >
            Tin Tức
          </button>
        </div>
      </div>

      {/* Filter chips bar (Lọc | Tài khoản | Giao dịch | Tin đăng | Sự kiện) */}
      <div className="notification-filter-bar">
        <div className="notification-filter-label">
          <Icon name="filter" size={14} />
          <span>Lọc</span>
        </div>
        <div className="notification-filter-divider" />
        <button
          type="button"
          className={`notification-pill-btn${filterCategory === "all" ? " is-active" : ""}`}
          onClick={() => setFilterCategory("all")}
        >
          Tất cả
        </button>
        <button
          type="button"
          className={`notification-pill-btn${filterCategory === "account" ? " is-active" : ""}`}
          onClick={() => setFilterCategory("account")}
        >
          Tài khoản
        </button>
        <button
          type="button"
          className={`notification-pill-btn${filterCategory === "transaction" ? " is-active" : ""}`}
          onClick={() => setFilterCategory("transaction")}
        >
          Giao dịch
        </button>
        <button
          type="button"
          className={`notification-pill-btn${filterCategory === "listing" ? " is-active" : ""}`}
          onClick={() => setFilterCategory("listing")}
        >
          Tin đăng
        </button>
        <button
          type="button"
          className={`notification-pill-btn${filterCategory === "event" ? " is-active" : ""}`}
          onClick={() => setFilterCategory("event")}
        >
          Sự kiện
        </button>
      </div>

      {/* Notification items list */}
      <div className="notification-list-body">
        {displayItems.length > 0 ? (
          displayItems.map((item) => {
            const category = getCategory(item)
            const badge = getCategoryBadge(category)
            const timeAgo = formatRelativeTime(item.createdAt)

            return (
              <div
                key={item.id}
                className={`notification-dropdown-item${!item.read ? " is-unread" : ""}`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleItemClick(item)
                  }
                }}
              >
                {/* Left category badge icon */}
                <div
                  className="notification-item-badge"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  {badge.icon}
                </div>

                {/* Right content details */}
                <div className="notification-item-content">
                  <div className="notification-item-top">
                    <span className="notification-item-title">{item.title}</span>
                    <span className="notification-item-time">{timeAgo}</span>
                  </div>
                  <p className="notification-item-detail">{item.detail}</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="notification-empty-state">
            <div className="notification-empty-icon">
              <Icon name="bell" size={26} />
            </div>
            <p className="notification-empty-text">Chưa có thông báo nào trong mục này</p>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="notification-popover-foot">
        <span className="notification-foot-count">
          {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc tất cả"}
        </span>
        <button
          type="button"
          className="notification-foot-close"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  )
}
