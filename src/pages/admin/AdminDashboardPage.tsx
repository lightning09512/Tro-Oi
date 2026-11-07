import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"

const ROOM_FALLBACK_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='72' viewBox='0 0 96 72'><rect width='100%' height='100%' fill='%23e2e8f0'/><path d='M32 46l10-12 8 10 6-7 8 9H32z' fill='%2394a3b8'/><circle cx='38' cy='26' r='4' fill='%2394a3b8'/></svg>"

const URGENT_REPORT_REGEX = /lừa|cọc|tiền|chiếm đoạt|giả mạo|phản cảm|đặt cọc/i

type AreaFilter = "all" | "hcm" | "danang" | "hanoi"
type PriceRangeFilter = "all" | "under_3m" | "from_3m_to_7m" | "over_7m"
type SortByOption = "views_desc" | "newest" | "price_asc" | "price_desc"

interface TableFilters {
  area: AreaFilter
  priceRange: PriceRangeFilter
  sortBy: SortByOption
}

const DEFAULT_FILTERS: TableFilters = {
  area: "all",
  priceRange: "all",
  sortBy: "views_desc",
}

/**
 * Vòng tròn tiến độ nhỏ (SVG Circular Progress Ring w-12 h-12) cho Thẻ KPI 2 (Nguồn cung phòng trọ)
 */
function KpiRadialRing({ percent }: { percent: number }) {
  const safePct = Math.min(100, Math.max(0, percent))
  const radius = 19
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (safePct / 100) * circumference

  return (
    <div
      className="saas-kpi-radial"
      title={`${safePct}% tin phòng đang mở hiển thị trên tổng nguồn cung`}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="transparent"
          stroke="#E2E8F0"
          strokeWidth="4.5"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="transparent"
          stroke="#10B981"
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="saas-kpi-radial-text">{safePct}%</span>
    </div>
  )
}

/**
 * Component Donut Chart SVG thuần dành riêng cho Cơ cấu vai trò người dùng
 * Hiển thị tổng số tài khoản ở chính giữa vòng tròn
 */
function RoleDonutChart({
  total,
  segments,
}: {
  total: number
  segments: { value: number; color: string; label: string }[]
}) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const sum = segments.reduce((acc, item) => acc + Math.max(0, item.value), 0)

  let accumulatedPercent = 0

  return (
    <div className="saas-role-donut-box">
      <svg
        className="saas-donut-svg"
        width="96"
        height="96"
        viewBox="0 0 96 96"
        role="img"
        aria-label={`Biểu đồ tròn cơ cấu vai trò ${total} tài khoản`}
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="transparent"
          stroke="#F1F5F9"
          strokeWidth="12"
        />
        {sum > 0 &&
          segments.map((seg, idx) => {
            const pct = Math.max(0, seg.value) / sum
            if (pct <= 0) return null
            const dashLength = Math.max(1, pct * circumference - (segments.length > 1 ? 1.5 : 0))
            const dashArray = `${dashLength} ${circumference}`
            const dashOffset = -accumulatedPercent * circumference
            accumulatedPercent += pct

            return (
              <circle
                key={`${seg.label}-${idx}`}
                cx="48"
                cy="48"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 48 48)"
                strokeLinecap="butt"
              >
                <title>{`${seg.label}: ${seg.value}`}</title>
              </circle>
            )
          })}
      </svg>
      <div className="saas-role-donut-center" aria-hidden="true">
        <strong>{total}</strong>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const {
    users,
    listings,
    posts,
    reports,
    connectionState,
    connectionError,
    setListingStatus,
    setPostStatus,
    addNotification,
  } = usePlatform()

  // Tab chuyển nhanh trên bảng Tin cho thuê: 'featured' | 'pending'
  const [roomTab, setRoomTab] = useState<"featured" | "pending">("featured")
  const [tableSearch, setTableSearch] = useState("")

  // State Popover/Dropdown Bộ lọc nâng cao (chỉ lọc khi nhấn Áp dụng hoặc Đặt lại)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<TableFilters>(DEFAULT_FILTERS)
  const [draftFilters, setDraftFilters] = useState<TableFilters>(DEFAULT_FILTERS)
  const filterPopoverRef = useRef<HTMLDivElement | null>(null)

  // Khóa đồng bộ (synchronous lock) chống Double-click / Race Condition khi Duyệt nhanh
  const busyRef = useRef<Set<string>>(new Set())
  const [busyIds, setBusyIds] = useState<string[]>([])
  const [isBatchApproving, setIsBatchApproving] = useState(false)

  // Phản hồi kết quả thao tác nhanh (Success / Error Feedback) chống hiểu nhầm khi rớt mạng
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Tự động ẩn thông báo sau 6 giây để không chiếm dụng diện tích
  useEffect(() => {
    if (!actionFeedback) return
    const timer = setTimeout(() => {
      setActionFeedback(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [actionFeedback])

  // Đóng Popover Bộ lọc khi click ra ngoài hoặc nhấn phím Escape
  useEffect(() => {
    if (!isFilterOpen) return
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        filterPopoverRef.current &&
        !filterPopoverRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false)
      }
    }
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isFilterOpen])

  // Đếm số lượng bộ lọc đang bật để hiển thị trên nút "Bộ lọc (N)"
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (appliedFilters.area !== "all") count++
    if (appliedFilters.priceRange !== "all") count++
    if (appliedFilters.sortBy !== "views_desc") count++
    return count
  }, [appliedFilters])

  // 1. Tính toán đồng bộ toàn bộ KPI & Cơ cấu trong 1 vòng lặp đơn (True Single-Pass O(N))
  const metrics = useMemo(() => {
    const totalUsers = users.length
    let rentersCount = 0
    let landlordsCount = 0
    let adminsCount = 0
    let activeUsersCount = 0
    let lockedUsersCount = 0

    for (const u of users) {
      if (u.role === "renter") rentersCount++
      else if (u.role === "landlord") landlordsCount++
      else if (u.role === "admin") adminsCount++

      if (u.status === "locked") lockedUsersCount++
      else activeUsersCount++
    }

    const renterPct = totalUsers > 0 ? Math.round((rentersCount / totalUsers) * 100) : 0
    const landlordPct = totalUsers > 0 ? Math.round((landlordsCount / totalUsers) * 100) : 0
    const adminPct = totalUsers > 0 ? Math.max(0, 100 - renterPct - landlordPct) : 0

    const totalListings = listings.length
    const activeRooms: typeof listings = []
    const pendingRooms: typeof listings = []
    const rentedRooms: typeof listings = []
    let totalViews = 0
    let totalContacts = 0

    for (const item of listings) {
      totalViews += item.views || 0
      totalContacts += item.contacts || 0
      if (item.status === "active") activeRooms.push(item)
      else if (item.status === "pending") pendingRooms.push(item)
      else if (item.status === "rented") rentedRooms.push(item)
    }

    const otherRoomsCount = Math.max(
      0,
      totalListings - activeRooms.length - pendingRooms.length - rentedRooms.length,
    )
    const activeRoomPct =
      totalListings > 0 ? Math.round((activeRooms.length / totalListings) * 100) : 0
    const pendingRoomPct =
      totalListings > 0 ? Math.round((pendingRooms.length / totalListings) * 100) : 0
    const rentedRoomPct =
      totalListings > 0 ? Math.max(0, 100 - activeRoomPct - pendingRoomPct) : 0

    const activePosts: typeof posts = []
    const pendingPosts: typeof posts = []
    let totalLikes = 0
    let totalComments = 0

    for (const p of posts) {
      totalLikes += p.likes || 0
      totalComments += p.commentsCount || 0
      if (p.status === "active") activePosts.push(p)
      else if (p.status === "pending") pendingPosts.push(p)
    }

    const pendingReports = reports.filter((r) => r.status === "pending")
    const pendingContentCount = pendingRooms.length + pendingPosts.length
    const pendingTasksCount = pendingContentCount + pendingReports.length

    return {
      totalUsers,
      rentersCount,
      landlordsCount,
      adminsCount,
      activeUsersCount,
      lockedUsersCount,
      renterPct,
      landlordPct,
      adminPct,
      totalListings,
      activeRooms,
      pendingRooms,
      rentedRooms,
      otherRoomsCount,
      activeRoomPct,
      pendingRoomPct,
      rentedRoomPct,
      totalViews,
      totalContacts,
      activePosts,
      pendingPosts,
      totalLikes,
      totalComments,
      pendingReports,
      pendingContentCount,
      pendingTasksCount,
    }
  }, [users, listings, posts, reports])

  // 2. Hàng đợi ưu tiên cần kiểm duyệt (Ưu tiên Báo cáo Khẩn cấp lên đầu + Deep-link)
  const allTasks = useMemo(() => {
    const reportTasks = metrics.pendingReports.map((item) => {
      const isUrgent = URGENT_REPORT_REGEX.test(`${item.reason} ${item.description}`)
      return {
        id: item.id,
        kind: "report" as const,
        isUrgent,
        type: isUrgent ? "Báo cáo · Khẩn cấp" : "Báo cáo",
        title: item.targetTitle,
        detail: `${item.reason} · Người báo: ${item.reporter}`,
        link: `/admin/bao-cao?status=pending&q=${encodeURIComponent(item.targetTitle)}`,
      }
    })

    reportTasks.sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent))

    const roomTasks = metrics.pendingRooms.map((item) => ({
      id: item.id,
      kind: "room" as const,
      isUrgent: false,
      type: "Tin phòng",
      title: item.title,
      detail: `${item.ownerName} · ${item.location}`,
      link: `/admin/tin-cho-thue?status=pending&q=${encodeURIComponent(item.title)}`,
    }))

    const postTasks = metrics.pendingPosts.map((item) => ({
      id: item.id,
      kind: "post" as const,
      isUrgent: false,
      type: "Bài viết",
      title: item.content,
      detail: item.name,
      link: `/admin/dien-dan?status=pending&q=${encodeURIComponent(item.name)}`,
    }))

    return [...reportTasks, ...roomTasks, ...postTasks]
  }, [metrics.pendingRooms, metrics.pendingPosts, metrics.pendingReports])

  const tasks = useMemo(() => allTasks.slice(0, 5), [allTasks])
  const remainingTasksCount = Math.max(0, allTasks.length - tasks.length)

  // 3. Danh sách hiển thị trên bảng theo Tab + Tìm kiếm nhanh + Bộ lọc Popover đã áp dụng
  const displayedRooms = useMemo(() => {
    let source =
      roomTab === "pending" ? [...metrics.pendingRooms] : [...metrics.activeRooms]

    // Lọc theo Khu vực / Tỉnh thành
    if (appliedFilters.area !== "all") {
      source = source.filter((item) => {
        const loc = `${item.location} ${item.district || ""}`.toLowerCase()
        if (appliedFilters.area === "hcm") {
          return loc.includes("hồ chí minh") || loc.includes("hcm") || loc.includes("tp.hcm")
        }
        if (appliedFilters.area === "danang") {
          return loc.includes("đà nẵng") || loc.includes("da nang")
        }
        if (appliedFilters.area === "hanoi") {
          return loc.includes("hà nội") || loc.includes("ha noi")
        }
        return true
      })
    }

    // Lọc theo Khoảng giá thuê
    if (appliedFilters.priceRange !== "all") {
      source = source.filter((item) => {
        const val =
          item.priceValue ||
          Number(String(item.price || "").replace(/[^\d]/g, "")) ||
          0
        if (appliedFilters.priceRange === "under_3m") return val > 0 && val < 3_000_000
        if (appliedFilters.priceRange === "from_3m_to_7m")
          return val >= 3_000_000 && val <= 7_000_000
        if (appliedFilters.priceRange === "over_7m") return val > 7_000_000
        return true
      })
    }

    // Lọc theo Từ khóa tìm kiếm
    const q = tableSearch.trim().toLowerCase()
    if (q) {
      source = source.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.ownerName.toLowerCase().includes(q),
      )
    }

    // Sắp xếp theo tiêu chí đã áp dụng
    source.sort((a, b) => {
      const priceA =
        a.priceValue || Number(String(a.price || "").replace(/[^\d]/g, "")) || 0
      const priceB =
        b.priceValue || Number(String(b.price || "").replace(/[^\d]/g, "")) || 0

      if (appliedFilters.sortBy === "price_asc") return priceA - priceB
      if (appliedFilters.sortBy === "price_desc") return priceB - priceA
      if (appliedFilters.sortBy === "newest") return String(b.id).localeCompare(String(a.id))
      return (b.views || 0) - (a.views || 0)
    })

    return source.slice(0, 6)
  }, [metrics.activeRooms, metrics.pendingRooms, roomTab, appliedFilters, tableSearch])

  // 4. Thảo luận cộng đồng mới nhất
  const recentPosts = useMemo(() => {
    return [...posts].slice(0, 4)
  }, [posts])

  // Dữ liệu phân đoạn cho biểu đồ tròn Cơ cấu vai trò người dùng (Phần C)
  const roleDonutSegments = useMemo(
    () => [
      { label: "Chủ trọ", value: metrics.landlordsCount, color: "#10b981" },
      { label: "Người thuê", value: metrics.rentersCount, color: "#0f172a" },
      { label: "Quản trị viên", value: metrics.adminsCount, color: "#6366f1" },
    ],
    [metrics.landlordsCount, metrics.rentersCount, metrics.adminsCount],
  )

  // 5. Hàm Duyệt nhanh (1-Click Quick Approve) an toàn với busyRef lock + Notification + Error Catching
  const handleQuickApproveRoom = async (roomId: string, e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation()
    if (busyRef.current.has(roomId)) return

    busyRef.current.add(roomId)
    setBusyIds((prev) => [...prev, roomId])
    setActionFeedback(null)
    try {
      const target = listings.find((item) => item.id === roomId)
      await setListingStatus(roomId, "active")
      if (target) {
        await addNotification({
          userId: target.ownerId,
          title: "Tin cho thuê đã được duyệt",
          detail: `Tin “${target.title}” hiện đã được hiển thị công khai trên hệ thống.`,
        }).catch(() => undefined)
      }
      setActionFeedback({
        type: "success",
        message: `Đã duyệt hiển thị tin “${target?.title ?? roomId}” và gửi thông báo cho chủ trọ ${target?.ownerName ?? ""}.`,
      })
    } catch (error) {
      setActionFeedback({
        type: "error",
        message:
          error instanceof Error
            ? `Không thể duyệt tin: ${error.message}`
            : "Không thể duyệt tin do mất kết nối máy chủ. Vui lòng kiểm tra đường truyền và thử lại.",
      })
    } finally {
      busyRef.current.delete(roomId)
      setBusyIds((prev) => prev.filter((id) => id !== roomId))
    }
  }

  const handleQuickApprovePost = async (postId: string, e?: MouseEvent | KeyboardEvent) => {
    e?.stopPropagation()
    if (busyRef.current.has(postId)) return

    busyRef.current.add(postId)
    setBusyIds((prev) => [...prev, postId])
    setActionFeedback(null)
    try {
      const target = posts.find((item) => item.id === postId)
      await setPostStatus(postId, "active")
      if (target) {
        await addNotification({
          userId: target.authorId,
          title: "Bài viết diễn đàn đã được duyệt",
          detail: `Bài chia sẻ của bạn trên cộng đồng Trọ Ơi đã được phê duyệt hiển thị.`,
        }).catch(() => undefined)
      }
      setActionFeedback({
        type: "success",
        message: `Đã phê duyệt bài thảo luận của thành viên “${target?.name ?? postId}”.`,
      })
    } catch (error) {
      setActionFeedback({
        type: "error",
        message:
          error instanceof Error
            ? `Không thể duyệt bài viết: ${error.message}`
            : "Không thể duyệt bài viết do mất kết nối máy chủ. Vui lòng thử lại.",
      })
    } finally {
      busyRef.current.delete(postId)
      setBusyIds((prev) => prev.filter((id) => id !== postId))
    }
  }

  // 6. Duyệt hàng loạt (Batch Approve Parallel với Promise.allSettled)
  const handleBatchApprovePendingRooms = async () => {
    if (isBatchApproving || metrics.pendingRooms.length === 0) return
    const targets = [...metrics.pendingRooms]
    const count = targets.length

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn phê duyệt hàng loạt toàn bộ ${count} tin phòng đang chờ duyệt không?`,
      )
    ) {
      return
    }

    setIsBatchApproving(true)
    setActionFeedback(null)

    try {
      const results = await Promise.allSettled(
        targets.map(async (room) => {
          await setListingStatus(room.id, "active")
          await addNotification({
            userId: room.ownerId,
            title: "Tin cho thuê đã được duyệt",
            detail: `Tin “${room.title}” hiện đã được hiển thị công khai trên hệ thống.`,
          }).catch(() => undefined)
          return room.id
        }),
      )

      const fulfilledCount = results.filter((r) => r.status === "fulfilled").length
      const rejectedCount = count - fulfilledCount

      if (rejectedCount === 0) {
        setActionFeedback({
          type: "success",
          message: `Đã phê duyệt hàng loạt thành công toàn bộ ${count} tin phòng và gửi thông báo cho các chủ trọ.`,
        })
      } else {
        setActionFeedback({
          type: "error",
          message: `Đã duyệt thành công ${fulfilledCount}/${count} tin phòng. Có ${rejectedCount} tin gặp sự cố kết nối, vui lòng thử lại các tin còn lại.`,
        })
      }
    } catch {
      setActionFeedback({
        type: "error",
        message: "Quá trình duyệt hàng loạt gặp sự cố kết nối. Vui lòng thử lại.",
      })
    } finally {
      setIsBatchApproving(false)
    }
  }

  const isLoading = connectionState === "loading"

  return (
    <main className="admin-resource-page management-page management-admin admin-dashboard-pro saas-dashboard">
      {/* Error State Banner (với chế độ Fallback & nút Thử kết nối lại) */}
      {connectionState === "error" && (
        <div className="dashboard-alert-banner" role="alert">
          <div className="dashboard-alert-content">
            <strong>Cảnh báo kết nối dữ liệu:</strong>
            <span>
              {connectionError ||
                "Mất kết nối tới máy chủ API. Hệ thống đang hiển thị dữ liệu dự phòng trên trình duyệt (Fallback Mode)."}
            </span>
          </div>
          <button
            type="button"
            className="btn-retry"
            onClick={() => window.location.reload()}
          >
            Thử kết nối lại
          </button>
        </div>
      )}

      {/* Action Feedback Banner (Xác nhận duyệt tin & thông báo lỗi mạng tức thì) */}
      {actionFeedback && (
        <div
          className={`dashboard-action-feedback is-${actionFeedback.type}`}
          role={actionFeedback.type === "error" ? "alert" : "status"}
        >
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* TẦNG 1: HÀNG 4 THẺ CHỈ SỐ KPI (Lấp đầy khoảng trống bên phải con số lớn bằng Stacked Mini-Metrics & Radial Ring) */}
      <section className="dashboard-kpi-grid saas-kpi-grid" aria-busy={isLoading}>
        {/* Thẻ 1: Thành viên hệ thống */}
        <div
          className="dashboard-kpi-card saas-kpi-card"
          onClick={() =>
            navigate(
              metrics.lockedUsersCount > 0
                ? "/admin/nguoi-dung?status=locked"
                : "/admin/nguoi-dung",
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            navigate(
              metrics.lockedUsersCount > 0
                ? "/admin/nguoi-dung?status=locked"
                : "/admin/nguoi-dung",
            )
          }
        >
          <div className="saas-kpi-header">
            <div className="saas-kpi-header-left">
              <span className="saas-kpi-icon is-blue">
                <Icon name="users" size={18} />
              </span>
              <span className="saas-kpi-title">Thành viên hệ thống</span>
            </div>
            <span
              className={`saas-kpi-pill ${
                metrics.lockedUsersCount > 0 ? "is-danger" : "is-blue"
              }`}
            >
              {metrics.activeUsersCount} hoạt động
              {metrics.lockedUsersCount > 0 ? ` · ${metrics.lockedUsersCount} khóa` : ""}
            </span>
          </div>

          <div className="saas-kpi-middle">
            <strong className="saas-kpi-number">
              {isLoading ? "—" : metrics.totalUsers.toLocaleString("vi-VN")}
            </strong>
            <div className="saas-kpi-stack">
              <span className="saas-mini-tag is-slate">
                Chủ trọ: <b>{metrics.landlordsCount}</b> ({metrics.landlordPct}%)
              </span>
              <span className="saas-mini-tag is-slate">
                Người thuê: <b>{metrics.rentersCount}</b> ({metrics.renterPct}%)
              </span>
            </div>
          </div>

          <div className="saas-kpi-footer">
            <span>
              <b>{metrics.rentersCount}</b> người thuê · <b>{metrics.landlordsCount}</b> chủ trọ ·{" "}
              <b>{metrics.adminsCount}</b> quản trị
            </span>
            <span className="saas-kpi-link is-blue">Quản lý →</span>
          </div>
        </div>

        {/* Thẻ 2: Nguồn cung phòng trọ */}
        <div
          className="dashboard-kpi-card saas-kpi-card"
          onClick={() =>
            navigate(
              metrics.pendingRooms.length > 0
                ? "/admin/tin-cho-thue?status=pending"
                : "/admin/tin-cho-thue",
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            navigate(
              metrics.pendingRooms.length > 0
                ? "/admin/tin-cho-thue?status=pending"
                : "/admin/tin-cho-thue",
            )
          }
        >
          <div className="saas-kpi-header">
            <div className="saas-kpi-header-left">
              <span className="saas-kpi-icon is-emerald">
                <Icon name="building" size={18} />
              </span>
              <span className="saas-kpi-title">Nguồn cung phòng trọ</span>
            </div>
            <span className="saas-kpi-pill is-emerald">
              {metrics.activeRooms.length} đang mở
            </span>
          </div>

          <div className="saas-kpi-middle">
            <strong className="saas-kpi-number">
              {isLoading ? "—" : metrics.totalListings.toLocaleString("vi-VN")}
            </strong>
            <KpiRadialRing percent={metrics.activeRoomPct} />
          </div>

          <div className="saas-kpi-footer">
            <span>
              <b>{metrics.activeRooms.length}</b> đang hiển thị ·{" "}
              <b>{metrics.pendingRooms.length}</b> chờ duyệt
            </span>
            <span className="saas-kpi-link is-emerald">Xem tin →</span>
          </div>
        </div>

        {/* Thẻ 3: Thảo luận cộng đồng */}
        <div
          className="dashboard-kpi-card saas-kpi-card"
          onClick={() =>
            navigate(
              metrics.pendingPosts.length > 0
                ? "/admin/dien-dan?status=pending"
                : "/admin/dien-dan",
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            navigate(
              metrics.pendingPosts.length > 0
                ? "/admin/dien-dan?status=pending"
                : "/admin/dien-dan",
            )
          }
        >
          <div className="saas-kpi-header">
            <div className="saas-kpi-header-left">
              <span className="saas-kpi-icon is-indigo">
                <Icon name="chat" size={18} />
              </span>
              <span className="saas-kpi-title">Thảo luận cộng đồng</span>
            </div>
            <span className="saas-kpi-pill is-indigo">
              {metrics.activePosts.length} bài viết
            </span>
          </div>

          <div className="saas-kpi-middle">
            <strong className="saas-kpi-number">
              {isLoading ? "—" : posts.length.toLocaleString("vi-VN")}
            </strong>
            <div className="saas-kpi-stack">
              <span className="saas-mini-tag is-indigo">
                💬 <b>{metrics.totalComments}</b> bình luận
              </span>
              <span className="saas-mini-tag is-rose">
                ♥ <b>{metrics.totalLikes}</b> lượt thích
              </span>
            </div>
          </div>

          <div className="saas-kpi-footer">
            <span>
              <b>{metrics.activePosts.length}</b> bài hiển thị · <b>{metrics.totalComments}</b> bình
              luận
            </span>
            <span className="saas-kpi-link is-indigo">Diễn đàn →</span>
          </div>
        </div>

        {/* Thẻ 4: Hàng đợi kiểm duyệt */}
        <div
          className="dashboard-kpi-card saas-kpi-card"
          onClick={() =>
            navigate(
              metrics.pendingReports.length > 0
                ? "/admin/bao-cao?status=pending"
                : metrics.pendingRooms.length > 0
                  ? "/admin/tin-cho-thue?status=pending"
                  : metrics.pendingPosts.length > 0
                    ? "/admin/dien-dan?status=pending"
                    : "/admin/bao-cao",
            )
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            navigate(
              metrics.pendingReports.length > 0
                ? "/admin/bao-cao?status=pending"
                : metrics.pendingRooms.length > 0
                  ? "/admin/tin-cho-thue?status=pending"
                  : "/admin/bao-cao",
            )
          }
        >
          <div className="saas-kpi-header">
            <div className="saas-kpi-header-left">
              <span className="saas-kpi-icon is-teal">
                <Icon name="shield-check" size={18} />
              </span>
              <span className="saas-kpi-title">Hàng đợi kiểm duyệt</span>
            </div>
            {metrics.pendingTasksCount === 0 ? (
              <span className="saas-kpi-pill is-clean">✓ Đã sạch hoàn toàn</span>
            ) : (
              <span className="saas-kpi-pill is-warning">
                {metrics.pendingTasksCount} cần xử lý
              </span>
            )}
          </div>

          <div className="saas-kpi-middle">
            <strong className="saas-kpi-number">
              {isLoading ? "—" : metrics.pendingTasksCount}
            </strong>
            {metrics.pendingTasksCount === 0 ? (
              <div className="saas-kpi-shield-box is-safe">
                <Icon name="shield-check" size={15} />
                <span>100% đã xử lý</span>
              </div>
            ) : (
              <div className="saas-kpi-shield-box is-pending">
                <Icon name="shield" size={15} />
                <span>Cần duyệt ngay</span>
              </div>
            )}
          </div>

          <div className="saas-kpi-footer">
            <span>
              <b>{metrics.pendingContentCount}</b> tin chờ duyệt ·{" "}
              <b>{metrics.pendingReports.length}</b> báo cáo
            </span>
            <span className="saas-kpi-link is-teal">Kiểm duyệt →</span>
          </div>
        </div>
      </section>

      {/* TẦNG 2: LƯỚI 2 CỘT BẤT ĐỐI XỨNG (2/3 Trái - 1/3 Phải) */}
      <div className="dashboard-main-grid saas-main-grid">
        {/* CỘT TRÁI (2/3): Hàng đợi ưu tiên (nếu có) + Bảng "Danh sách & Hiệu suất tin đăng" */}
        <div className="dashboard-col-main">
          {tasks.length > 0 && (
            <section className="dashboard-card dashboard-pending-box">
              <div className="dashboard-card-header">
                <div>
                  <h3>Việc cần xử lý ngay ({metrics.pendingTasksCount})</h3>
                  <p>
                    Báo cáo khẩn cấp được ưu tiên lên đầu. Mẹo: Nhấn <b>Shift + A</b> khi trỏ vào mục chờ để duyệt nhanh.
                  </p>
                </div>
                <div className="dashboard-header-controls">
                  {metrics.pendingRooms.length > 1 && (
                    <button
                      type="button"
                      className="btn-batch-approve"
                      disabled={isBatchApproving}
                      onClick={handleBatchApprovePendingRooms}
                    >
                      {isBatchApproving
                        ? "Đang duyệt hàng loạt..."
                        : `Duyệt tất cả tin chờ (${metrics.pendingRooms.length})`}
                    </button>
                  )}
                  <span className="dashboard-pending-count-pill">
                    {metrics.pendingTasksCount} mục chờ
                  </span>
                </div>
              </div>
              <div className="dashboard-task-list">
                {tasks.map((task) => {
                  const isBusy = busyIds.includes(task.id)
                  return (
                    <div
                      key={`${task.kind}-${task.id}`}
                      className="dashboard-task-item"
                      onClick={() => navigate(task.link)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          navigate(task.link)
                        } else if (e.shiftKey && (e.key === "A" || e.key === "a")) {
                          e.preventDefault()
                          if (task.kind === "room") void handleQuickApproveRoom(task.id, e)
                          if (task.kind === "post") void handleQuickApprovePost(task.id, e)
                        }
                      }}
                    >
                      <span
                        className={`task-type-badge ${
                          task.isUrgent ? "is-urgent" : `is-${task.kind}`
                        }`}
                      >
                        {task.type}
                      </span>
                      <div className="task-text-col">
                        <strong title={task.title}>{task.title}</strong>
                        <span title={task.detail}>{task.detail}</span>
                      </div>
                      <div className="dashboard-action-group">
                        {task.kind === "room" && (
                          <button
                            type="button"
                            className="btn-quick-approve"
                            disabled={isBusy}
                            onClick={(e) => handleQuickApproveRoom(task.id, e)}
                            title="Duyệt hiển thị tin phòng này ngay (Phím tắt: Shift + A)"
                          >
                            {isBusy ? "Đang duyệt..." : "Duyệt nhanh"}
                          </button>
                        )}
                        {task.kind === "post" && (
                          <button
                            type="button"
                            className="btn-quick-approve"
                            disabled={isBusy}
                            onClick={(e) => handleQuickApprovePost(task.id, e)}
                            title="Duyệt hiển thị bài viết này ngay (Phím tắt: Shift + A)"
                          >
                            {isBusy ? "Đang duyệt..." : "Duyệt nhanh"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="task-action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(task.link)
                          }}
                        >
                          <span>{task.kind === "report" ? "Xử lý" : "Chi tiết"}</span>
                          <Icon name="chevron" size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {remainingTasksCount > 0 && (
                <div className="dashboard-queue-more">
                  <span>
                    Còn <b>{remainingTasksCount}</b> mục khác đang chờ trong hàng đợi kiểm duyệt
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        metrics.pendingReports.length > 0
                          ? "/admin/bao-cao?status=pending"
                          : "/admin/tin-cho-thue?status=pending",
                      )
                    }
                  >
                    Xem tất cả ({metrics.pendingTasksCount}) →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Card Bảng dữ liệu: "Danh sách & Hiệu suất tin đăng" */}
          <section className="dashboard-card dashboard-listings-card saas-table-card">
            <div className="saas-table-card-top">
              <div className="saas-table-title-row">
                <div>
                  <h3>Danh sách & Hiệu suất tin đăng</h3>
                  <p className="saas-table-subtitle">
                    Theo dõi nguồn cung, mức giá, trạng thái kiểm duyệt và mức độ tương tác của từng phòng trọ
                  </p>
                </div>
                {roomTab === "pending" && metrics.pendingRooms.length > 1 && (
                  <button
                    type="button"
                    className="btn-batch-approve"
                    disabled={isBatchApproving}
                    onClick={handleBatchApprovePendingRooms}
                  >
                    {isBatchApproving
                      ? "Đang duyệt..."
                      : `Duyệt tất cả (${metrics.pendingRooms.length})`}
                  </button>
                )}
              </div>

              {/* Thanh công cụ (Toolbar): Segmented Tabs bên trái + Tìm kiếm & Popover Bộ lọc bên phải */}
              <div className="saas-table-toolbar">
                <div
                  className="pill-tabs saas-segmented-tabs"
                  role="tablist"
                  aria-label="Bộ lọc nhanh tin cho thuê"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roomTab === "featured"}
                    className={`pill-tab ${roomTab === "featured" ? "active" : ""}`}
                    onClick={() => setRoomTab("featured")}
                  >
                    Tất cả tin mở ({metrics.activeRooms.length})
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={roomTab === "pending"}
                    className={`pill-tab ${roomTab === "pending" ? "active" : ""}`}
                    onClick={() => setRoomTab("pending")}
                  >
                    Chờ duyệt ({metrics.pendingRooms.length})
                  </button>
                </div>

                <div className="saas-toolbar-right">
                  <div className="saas-inline-search">
                    <Icon name="search" size={14} />
                    <input
                      type="search"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Tìm kiếm tin..."
                      aria-label="Tìm kiếm tin cho thuê trong bảng"
                    />
                  </div>

                  {/* Nút Bộ lọc mở Menu Popover/Dropdown (Không tự ý lọc ngay khi bấm mở) */}
                  <div className="saas-filter-dropdown-wrap" ref={filterPopoverRef}>
                    <button
                      type="button"
                      className={`saas-filter-btn${
                        isFilterOpen || activeFilterCount > 0 ? " is-filtered" : ""
                      }`}
                      aria-expanded={isFilterOpen}
                      aria-haspopup="dialog"
                      onClick={() => {
                        setIsFilterOpen((prev) => {
                          const next = !prev
                          if (next) {
                            setDraftFilters(appliedFilters)
                          }
                          return next
                        })
                      }}
                    >
                      <Icon name="filter" size={14} />
                      <span>
                        {activeFilterCount > 0 ? `Bộ lọc (${activeFilterCount})` : "Bộ lọc"}
                      </span>
                    </button>

                    {isFilterOpen && (
                      <div
                        className="saas-filter-popover"
                        role="dialog"
                        aria-label="Bộ lọc nâng cao danh sách tin đăng"
                      >
                        <div className="saas-filter-popover-head">
                          <strong>Bộ lọc nâng cao</strong>
                          <button
                            type="button"
                            className="saas-filter-close"
                            onClick={() => setIsFilterOpen(false)}
                            aria-label="Đóng bộ lọc"
                          >
                            ✕
                          </button>
                        </div>

                        {/* 1. Lọc theo Khu vực / Tỉnh thành */}
                        <div className="saas-filter-field">
                          <label>Khu vực / Tỉnh thành</label>
                          <div className="saas-filter-pills">
                            {(
                              [
                                ["all", "Tất cả"],
                                ["hcm", "TP. Hồ Chí Minh"],
                                ["danang", "Đà Nẵng"],
                                ["hanoi", "Hà Nội"],
                              ] as const
                            ).map(([val, label]) => (
                              <button
                                key={val}
                                type="button"
                                className={`saas-filter-chip${
                                  draftFilters.area === val ? " is-selected" : ""
                                }`}
                                onClick={() =>
                                  setDraftFilters((prev) => ({ ...prev, area: val }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Lọc theo Khoảng giá thuê */}
                        <div className="saas-filter-field">
                          <label htmlFor="dash-filter-price">Khoảng giá thuê</label>
                          <select
                            id="dash-filter-price"
                            value={draftFilters.priceRange}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                priceRange: e.target.value as PriceRangeFilter,
                              }))
                            }
                          >
                            <option value="all">Tất cả mức giá</option>
                            <option value="under_3m">Dưới 3 triệu</option>
                            <option value="from_3m_to_7m">Từ 3 - 7 triệu</option>
                            <option value="over_7m">Trên 7 triệu</option>
                          </select>
                        </div>

                        {/* 3. Sắp xếp theo */}
                        <div className="saas-filter-field">
                          <label htmlFor="dash-filter-sort">Sắp xếp theo</label>
                          <select
                            id="dash-filter-sort"
                            value={draftFilters.sortBy}
                            onChange={(e) =>
                              setDraftFilters((prev) => ({
                                ...prev,
                                sortBy: e.target.value as SortByOption,
                              }))
                            }
                          >
                            <option value="views_desc">Lượt xem cao nhất</option>
                            <option value="newest">Mới đăng nhất</option>
                            <option value="price_asc">Giá tăng dần</option>
                            <option value="price_desc">Giá giảm dần</option>
                          </select>
                        </div>

                        {/* Hàng nút hành động dưới cùng */}
                        <div className="saas-filter-actions">
                          <button
                            type="button"
                            className="saas-filter-reset-btn"
                            onClick={() => {
                              setDraftFilters(DEFAULT_FILTERS)
                              setAppliedFilters(DEFAULT_FILTERS)
                              setIsFilterOpen(false)
                            }}
                          >
                            Đặt lại
                          </button>
                          <button
                            type="button"
                            className="saas-filter-apply-btn"
                            onClick={() => {
                              setAppliedFilters(draftFilters)
                              setIsFilterOpen(false)
                            }}
                          >
                            Áp dụng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table saas-data-table">
                <thead>
                  <tr>
                    <th>Thông tin phòng trọ & Khu vực</th>
                    <th className="col-nowrap">Giá thuê</th>
                    <th className="col-nowrap">Chủ trọ</th>
                    <th className="col-nowrap">Lượt xem</th>
                    <th className="col-nowrap">Trạng thái</th>
                    <th className="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td colSpan={6}>
                          <div className="dashboard-skeleton-row" />
                        </td>
                      </tr>
                    ))
                  ) : displayedRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-table-cell">
                        <div className="dashboard-empty-box">
                          <Icon name="building" size={24} />
                          <strong>
                            {tableSearch.trim() || activeFilterCount > 0
                              ? "Không tìm thấy tin phòng phù hợp với tiêu chí lọc"
                              : roomTab === "pending"
                                ? "Không còn tin phòng trọ nào đang chờ duyệt"
                                : "Chưa có dữ liệu tin cho thuê trên hệ thống"}
                          </strong>
                          <span>
                            {tableSearch.trim() || activeFilterCount > 0
                              ? "Hãy thử nhấn Đặt lại trong Bộ lọc hoặc xóa từ khóa tìm kiếm."
                              : roomTab === "pending"
                                ? "Mọi tin đăng mới từ chủ trọ đã được kiểm duyệt hoàn tất."
                                : "Tin cho thuê khi được tạo sẽ hiển thị trực tiếp tại bảng này."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedRooms.map((room) => {
                      const isBusy = busyIds.includes(room.id)
                      const rawPrice =
                        room.price || `${room.priceValue?.toLocaleString("vi-VN")}đ`
                      const priceDisplay = rawPrice.includes("/tháng")
                        ? rawPrice
                        : `${rawPrice.replace(/\s+đ$/i, "đ")}/tháng`

                      return (
                        <tr
                          key={room.id}
                          tabIndex={room.status === "pending" ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (
                              room.status === "pending" &&
                              e.shiftKey &&
                              (e.key === "A" || e.key === "a")
                            ) {
                              e.preventDefault()
                              void handleQuickApproveRoom(room.id, e)
                            }
                          }}
                        >
                          <td className="dash-room-cell">
                            <div className="dash-room-box">
                              <div className="dash-room-thumb-wrap">
                                <img
                                  src={room.image || ROOM_FALLBACK_SVG}
                                  alt={room.title}
                                  className="dash-room-thumb"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = ROOM_FALLBACK_SVG
                                  }}
                                />
                                {/* Thumbnail Hover Preview Tooltip (248x160px) */}
                                <div className="dash-room-preview" role="tooltip">
                                  <img
                                    src={room.image || ROOM_FALLBACK_SVG}
                                    alt={room.title}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = ROOM_FALLBACK_SVG
                                    }}
                                  />
                                  <div className="dash-room-preview-caption">
                                    <strong>{room.title}</strong>
                                    <span>
                                      {priceDisplay} · {room.area || "—"} · {room.ownerName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="dash-room-text">
                                <strong className="dash-room-title" title={room.title}>
                                  {room.title}
                                </strong>
                                <span className="dash-room-address" title={room.location}>
                                  <Icon name="pin" size={13} />
                                  <span>{room.location}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="col-nowrap">
                            <span className="room-price-tag">{priceDisplay}</span>
                          </td>
                          <td className="col-nowrap">
                            <span className="room-owner" title={room.ownerName}>
                              {room.ownerName}
                            </span>
                          </td>
                          <td className="col-nowrap">
                            <strong className="saas-views-num">
                              {(room.views || 0).toLocaleString("vi-VN")}
                            </strong>
                          </td>
                          <td className="col-nowrap">
                            <span className={`room-status-badge is-${room.status}`}>
                              {room.status === "active"
                                ? "Đang mở"
                                : room.status === "pending"
                                  ? "Chờ duyệt"
                                  : room.status === "rented"
                                    ? "Đã thuê"
                                    : room.status === "rejected"
                                      ? "Từ chối"
                                      : "Đang ẩn"}
                            </span>
                          </td>
                          <td className="col-actions">
                            <div className="dashboard-action-group">
                              {room.status === "pending" && (
                                <button
                                  type="button"
                                  className="btn-quick-approve"
                                  disabled={isBusy}
                                  onClick={(e) => handleQuickApproveRoom(room.id, e)}
                                  title="Phê duyệt nhanh tin phòng này (Phím tắt: Shift + A)"
                                >
                                  {isBusy ? "Đang duyệt..." : "Duyệt"}
                                </button>
                              )}
                              <button
                                type="button"
                                className="saas-row-icon-btn"
                                onClick={() =>
                                  navigate(
                                    `/admin/tin-cho-thue?status=${room.status}&q=${encodeURIComponent(
                                      room.title,
                                    )}`,
                                  )
                                }
                                title="Tùy chọn & Kiểm duyệt"
                                aria-label="Tùy chọn tin đăng"
                              >
                                <Icon name="more" size={15} />
                              </button>
                              <button
                                type="button"
                                className="saas-row-icon-btn"
                                onClick={() =>
                                  navigate(
                                    `/admin/tin-cho-thue?status=${room.status}&q=${encodeURIComponent(
                                      room.title,
                                    )}`,
                                  )
                                }
                                title="Xem và chỉnh sửa chi tiết"
                                aria-label="Chỉnh sửa chi tiết"
                              >
                                <Icon name="edit" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (1/3): 2 Card xếp chồng dọc (Giữ nguyên 100%) */}
        <div className="dashboard-col-side saas-side-stack">
          {/* Card 1: "Cơ cấu nguồn cung & Lưu lượng" (Tách bạch rõ ràng 3 Phần A - B - C) */}
          <section className="dashboard-card dashboard-telemetry-card saas-side-card">
            <h3 className="saas-side-card-title">Cơ cấu nguồn cung & Lưu lượng</h3>

            {/* PHẦN A: Trạng thái nguồn cung phòng trọ (Segmented Progress Bar) */}
            <div className="saas-telemetry-block is-first">
              <span className="saas-sub-heading">
                Trạng thái tin cho thuê ({metrics.totalListings} tin)
              </span>
              <div
                className="saas-segmented-bar"
                aria-label="Thanh tỷ lệ trạng thái tin cho thuê"
              >
                <span
                  className="saas-bar-slice is-emerald"
                  style={{ width: `${metrics.activeRoomPct}%` }}
                  title={`Đang mở: ${metrics.activeRooms.length} (${metrics.activeRoomPct}%)`}
                />
                <span
                  className="saas-bar-slice is-amber"
                  style={{ width: `${metrics.pendingRoomPct}%` }}
                  title={`Chờ duyệt: ${metrics.pendingRooms.length} (${metrics.pendingRoomPct}%)`}
                />
                <span
                  className="saas-bar-slice is-slate"
                  style={{ width: `${metrics.rentedRoomPct}%` }}
                  title={`Đã thuê: ${metrics.rentedRooms.length + metrics.otherRoomsCount} (${metrics.rentedRoomPct}%)`}
                />
              </div>
              <div className="saas-segmented-legend">
                <span>
                  <i className="saas-dot is-emerald" />
                  Đang mở: <b>{metrics.activeRooms.length}</b> ({metrics.activeRoomPct}%)
                </span>
                <span>
                  <i className="saas-dot is-amber" />
                  Chờ duyệt: <b>{metrics.pendingRooms.length}</b> ({metrics.pendingRoomPct}%)
                </span>
                <span>
                  <i className="saas-dot is-slate" />
                  Đã thuê: <b>{metrics.rentedRooms.length + metrics.otherRoomsCount}</b> (
                  {metrics.rentedRoomPct}%)
                </span>
              </div>
            </div>

            {/* PHẦN B: Lưu lượng tương tác (2 Mini Stat Boxes) */}
            <div className="saas-telemetry-block">
              <div className="saas-mini-stats-grid">
                <div className="saas-mini-stat-box">
                  <span className="saas-mini-label">Tổng lượt xem tin</span>
                  <strong className="saas-mini-value">
                    {metrics.totalViews.toLocaleString("vi-VN")}
                  </strong>
                  <small className="saas-mini-note is-emerald">Trên toàn hệ thống</small>
                </div>
                <div className="saas-mini-stat-box">
                  <span className="saas-mini-label">Lượt liên hệ chủ trọ</span>
                  <strong className="saas-mini-value">
                    {metrics.totalContacts.toLocaleString("vi-VN")}
                  </strong>
                  <small className="saas-mini-note is-indigo">Kết nối thành công</small>
                </div>
              </div>
            </div>

            {/* PHẦN C: Cơ cấu vai trò thành viên (Biểu đồ Tròn Donut Chart riêng biệt) */}
            <div className="saas-telemetry-block">
              <span className="saas-sub-heading">
                Cơ cấu vai trò người dùng ({metrics.totalUsers} tài khoản)
              </span>
              <div className="saas-role-donut-row">
                <RoleDonutChart total={metrics.totalUsers} segments={roleDonutSegments} />

                <div className="saas-role-legend-list">
                  <div className="saas-role-legend-item">
                    <span className="saas-role-label">
                      <i className="saas-dot" style={{ background: "#10b981" }} />
                      <span>Chủ trọ</span>
                    </span>
                    <strong>
                      {metrics.landlordsCount} ({metrics.landlordPct}%)
                    </strong>
                  </div>
                  <div className="saas-role-legend-item">
                    <span className="saas-role-label">
                      <i className="saas-dot" style={{ background: "#0f172a" }} />
                      <span>Người thuê</span>
                    </span>
                    <strong>
                      {metrics.rentersCount} ({metrics.renterPct}%)
                    </strong>
                  </div>
                  <div className="saas-role-legend-item">
                    <span className="saas-role-label">
                      <i className="saas-dot" style={{ background: "#6366f1" }} />
                      <span>Quản trị viên</span>
                    </span>
                    <strong>
                      {metrics.adminsCount} ({metrics.adminPct}%)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: "Thảo luận cộng đồng mới nhất" */}
          <section className="dashboard-card dashboard-forum-recent-card saas-side-card">
            <h3 className="saas-side-card-title">Thảo luận cộng đồng mới nhất</h3>

            <div className="saas-recent-posts">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`post-skel-${idx}`} className="dashboard-skeleton-row" />
                ))
              ) : recentPosts.length === 0 ? (
                <div className="dashboard-empty-box">
                  <Icon name="chat" size={22} />
                  <strong>Chưa có bài thảo luận mới</strong>
                  <span>Các bài chia sẻ kinh nghiệm thuê trọ sẽ xuất hiện tại đây.</span>
                </div>
              ) : (
                recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="saas-post-item"
                    onClick={() =>
                      navigate(
                        `/admin/dien-dan?status=${post.status}&q=${encodeURIComponent(post.name)}`,
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      navigate(
                        `/admin/dien-dan?status=${post.status}&q=${encodeURIComponent(post.name)}`,
                      )
                    }
                  >
                    <div className="saas-post-head">
                      <div className="saas-post-author">
                        <div className="post-author-avatar">
                          {post.avatarUrl ? (
                            <img src={post.avatarUrl} alt={post.name} loading="lazy" />
                          ) : (
                            <span>
                              {post.initials || post.name?.slice(0, 2).toUpperCase() || "TV"}
                            </span>
                          )}
                        </div>
                        <div className="saas-post-author-meta">
                          <strong>{post.name}</strong>
                          <time>{post.time || "2 phút trước"}</time>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="saas-post-more-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(
                            `/admin/dien-dan?status=${post.status}&q=${encodeURIComponent(
                              post.name,
                            )}`,
                          )
                        }}
                        aria-label="Tùy chọn bài viết"
                      >
                        <Icon name="more" size={15} />
                      </button>
                    </div>

                    <p className="saas-post-snippet">{post.content}</p>

                    <div className="saas-post-footer">
                      <span className="saas-post-comments">
                        <Icon name="chat" size={13} />
                        <span>{post.commentsCount || 0} bình luận</span>
                        {post.status === "pending" && (
                          <span className="post-pending-tag">Chờ duyệt</span>
                        )}
                      </span>
                      <span className="saas-post-reply-icon" aria-hidden="true">
                        <Icon name="chat" size={13} />
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
