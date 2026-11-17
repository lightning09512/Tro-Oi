import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { Link, useNavigate } from "react-router"
import { Icon } from "@/components/common/legacy"
import { usePlatform } from "@/contexts/PlatformContext"
import {
  formatForumPostDate,
  parseForumPostContent,
  resolveMemberAvatar,
} from "@/utils/forumPost"

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

const ITEMS_PER_PAGE = 2

function ChevronLeftIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function CheckCircle2Icon({ className = "w-7 h-7 text-emerald-600 mb-1.5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function TaskCategoryIcon({
  category,
}: {
  category: "Bài viết" | "Bài đăng" | "Tin phòng" | "Bình luận"
}) {
  if (category === "Tin phòng") {
    return (
      <svg
        aria-hidden="true"
        className="w-4 h-4 text-slate-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    )
  }

  if (category === "Bình luận") {
    return (
      <svg
        aria-hidden="true"
        className="w-4 h-4 text-slate-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="w-4 h-4 text-slate-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M7 9h5" />
      <path d="M7 13h3" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  )
}

function FileTextIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  )
}

function MessageCircleIcon({ className = "w-3.5 h-3.5 text-slate-400" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function EyeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function PhoneCallIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <path d="M14.05 2a9 9 0 0 1 8 7.94" />
      <path d="M14.05 6A5 5 0 0 1 18 10" />
    </svg>
  )
}

function SearchIcon({
  className = "w-4 h-4 text-slate-400",
}: {
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function ListFilterIcon({ className = "w-4 h-4 text-slate-500" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
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
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const sum = segments.reduce((acc, item) => acc + Math.max(0, item.value), 0)

  let accumulatedPercent = 0

  return (
    <div className="saas-role-donut-box w-[104px] h-[104px] sm:w-[120px] sm:h-[120px]">
      <svg
        className="saas-donut-svg w-full h-full"
        viewBox="0 0 116 116"
        role="img"
        aria-label={`Biểu đồ tròn cơ cấu vai trò ${total} tài khoản`}
      >
        <circle
          cx="58"
          cy="58"
          r={radius}
          fill="transparent"
          stroke="#F1F5F9"
          strokeWidth="15"
        />
        {sum > 0 &&
          segments.map((seg, idx) => {
            const pct = Math.max(0, seg.value) / sum
            if (pct <= 0) return null
            const dashLength = Math.max(1, pct * circumference - (segments.length > 1 ? 2 : 0))
            const dashArray = `${dashLength} ${circumference}`
            const dashOffset = -accumulatedPercent * circumference
            accumulatedPercent += pct

            return (
              <circle
                key={`${seg.label}-${idx}`}
                cx="58"
                cy="58"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth="15"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 58 58)"
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
  const [actionPage, setActionPage] = useState(1)
  const [failedPostThumbUrls, setFailedPostThumbUrls] = useState<Record<string, true>>({})

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
    const formatTaskDate = (createdAt?: string) => {
      if (!createdAt) return null
      const parsed = new Date(createdAt)
      if (Number.isNaN(parsed.getTime())) return null
      return formatForumPostDate(createdAt)
    }

    const reportTasks = metrics.pendingReports.map((item) => {
      const isUrgent = URGENT_REPORT_REGEX.test(`${item.reason} ${item.description}`)
      const categoryLabel: "Tin phòng" | "Bài đăng" | "Bình luận" =
        item.targetType === "Bài viết" ? "Bài đăng" : item.targetType

      return {
        id: item.id,
        kind: "report" as const,
        categoryLabel,
        isUrgent,
        title: item.targetTitle,
        badgeLabel: "Lý do:",
        reasonText: item.reason,
        actorLabel: "Người báo cáo",
        actorName: item.reporter,
        createdAtDate: formatTaskDate(item.createdAt),
        link: `/admin/bao-cao?status=pending&q=${encodeURIComponent(item.targetTitle)}`,
      }
    })

    reportTasks.sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent))

    const roomTasks = metrics.pendingRooms.map((item) => ({
      id: item.id,
      kind: "room" as const,
      categoryLabel: "Tin phòng" as const,
      isUrgent: false,
      title: item.title,
      badgeLabel: "Khu vực:",
      reasonText: item.location,
      actorLabel: "Chủ trọ",
      actorName: item.ownerName,
      createdAtDate: formatTaskDate(item.createdAt),
      link: `/admin/tin-cho-thue?status=pending&q=${encodeURIComponent(item.title)}`,
    }))

    const postTasks = metrics.pendingPosts.map((item) => {
      const parsed = parseForumPostContent(item.content)
      return {
        id: item.id,
        kind: "post" as const,
        categoryLabel: "Bài đăng" as const,
        isUrgent: false,
        title: parsed.compactTitle,
        badgeLabel: "Danh mục:",
        reasonText: parsed.category,
        actorLabel: "Người đăng",
        actorName: item.name,
        createdAtDate: formatTaskDate(item.createdAt),
        link: `/admin/dien-dan?status=pending&q=${encodeURIComponent(parsed.compactTitle || item.name)}`,
      }
    })

    return [...reportTasks, ...roomTasks, ...postTasks]
  }, [metrics.pendingRooms, metrics.pendingPosts, metrics.pendingReports])

  const totalActionPages = Math.max(1, Math.ceil(allTasks.length / ITEMS_PER_PAGE))
  const currentActionPage = Math.min(actionPage, totalActionPages)

  useEffect(() => {
    if (actionPage > totalActionPages) {
      setActionPage(totalActionPages)
    }
  }, [actionPage, totalActionPages])

  const visibleTasks = useMemo(
    () =>
      allTasks.slice(
        (currentActionPage - 1) * ITEMS_PER_PAGE,
        currentActionPage * ITEMS_PER_PAGE,
      ),
    [allTasks, currentActionPage],
  )

  // 3. Danh sách hiển thị trên bảng theo Tab + Tìm kiếm nhanh + Bộ lọc Popover đã áp dụng
  const filteredListings = useMemo(() => {
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

    return source
  }, [metrics.activeRooms, metrics.pendingRooms, roomTab, appliedFilters, tableSearch])

  // 4. Thảo luận cộng đồng mới nhất
  const recentPosts = useMemo(() => {
    return [...posts].slice(0, 4)
  }, [posts])

  // Dữ liệu phân đoạn cho biểu đồ tròn Cơ cấu vai trò người dùng (Phần C)
  const roleDonutSegments = useMemo(
    () => [
      { label: "Chủ trọ", value: metrics.landlordsCount, pct: metrics.landlordPct, color: "#10B981" },
      { label: "Người thuê", value: metrics.rentersCount, pct: metrics.renterPct, color: "#6EE7B7" },
      { label: "Quản trị viên", value: metrics.adminsCount, pct: metrics.adminPct, color: "#94A3B8" },
    ],
    [
      metrics.landlordsCount,
      metrics.landlordPct,
      metrics.rentersCount,
      metrics.renterPct,
      metrics.adminsCount,
      metrics.adminPct,
    ],
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

      {/* TẦNG 1: HÀNG 4 THẺ CHỈ SỐ KPI (Chuẩn 2 tông màu Slate + Emerald, cấu trúc chia ô đều nhau) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 saas-kpi-section" aria-busy={isLoading}>
        {/* Thẻ 1: Thành viên hệ thống */}
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
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
          {/* Tầng 1: Header */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="users" size={18} />
              </span>
              <span className="text-sm font-bold text-slate-900 truncate">
                Thành viên hệ thống
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 transition-colors shrink-0">
              Quản lý →
            </span>
          </div>

          {/* Tầng 2: Lưới các ô số liệu (3 ô chia đều) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.rentersCount}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Người thuê
              </span>
            </div>
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.landlordsCount}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Chủ trọ
              </span>
            </div>
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.adminsCount}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Quản trị
              </span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Nguồn cung phòng trọ */}
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
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
          {/* Tầng 1: Header */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="building" size={18} />
              </span>
              <span className="text-sm font-bold text-slate-900 truncate">
                Nguồn cung phòng trọ
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 transition-colors shrink-0">
              Xem tin →
            </span>
          </div>

          {/* Tầng 2: Lưới các ô số liệu (2 ô chia đều) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.activeRooms.length}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Đang hiển thị
              </span>
            </div>
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.pendingRooms.length}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Chờ duyệt
              </span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Thảo luận cộng đồng */}
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
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
          {/* Tầng 1: Header */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="chat" size={18} />
              </span>
              <span className="text-sm font-bold text-slate-900 truncate">
                Thảo luận cộng đồng
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 transition-colors shrink-0">
              Diễn đàn →
            </span>
          </div>

          {/* Tầng 2: Lưới các ô số liệu (2 ô chia đều) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.activePosts.length}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Bài hiển thị
              </span>
            </div>
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.totalComments}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Bình luận
              </span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Hàng đợi kiểm duyệt */}
        <div
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between"
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
          {/* Tầng 1: Header */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Icon name="shield-check" size={18} />
              </span>
              <span className="text-sm font-bold text-slate-900 truncate">
                Hàng đợi kiểm duyệt
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 transition-colors shrink-0">
              Kiểm duyệt →
            </span>
          </div>

          {/* Tầng 2: Lưới các ô số liệu (2 ô chia đều) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.pendingRooms.length}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Tin chờ duyệt
              </span>
            </div>
            <div className="bg-slate-100/80 rounded-xl py-3 px-2 text-center flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {isLoading ? "—" : metrics.pendingReports.length}
              </span>
              <span className="text-xs font-medium text-slate-600 mt-1 whitespace-nowrap">
                Báo cáo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TẦNG 2: LƯỚI 2 CỘT BẤT ĐỐI XỨNG (2/3 Trái - 1/3 Phải) */}
      <div className="dashboard-main-grid saas-main-grid items-stretch">
        {/* CỘT TRÁI (2/3): Hàng đợi ưu tiên + Bảng "Danh sách & Hiệu suất tin đăng" */}
        <div className="dashboard-col-main flex flex-col gap-6">
          <section className="saas-pending-card bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
              <h3 className="saas-pending-title text-base font-bold text-slate-900">
                Việc cần xử lý
              </h3>

              <div className="flex items-center">
                <button
                  type="button"
                  className="saas-pending-viewall text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
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
                >
                  Xem tất cả →
                </button>
                <span className="h-3.5 w-px bg-slate-200 mx-3" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-500 mr-2 tabular-nums">
                  Trang {currentActionPage} / {totalActionPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="saas-pending-page-btn w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    disabled={currentActionPage <= 1}
                    onClick={() => setActionPage((prev) => Math.max(1, prev - 1))}
                    aria-label="Trang trước"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="saas-pending-page-btn w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    disabled={currentActionPage >= totalActionPages}
                    onClick={() =>
                      setActionPage((prev) => Math.min(totalActionPages, prev + 1))
                    }
                    aria-label="Trang sau"
                  >
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {allTasks.length === 0 ? (
              <div className="h-[188px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                <CheckCircle2Icon className="w-6 h-6 text-emerald-600" />
                <span className="text-sm font-semibold text-slate-700">
                  Tất cả báo cáo và tin chờ duyệt đã được xử lý hoàn tất
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Hệ thống hiện không có mục nào tồn đọng
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleTasks.map((task) => (
                  <div
                    key={`${task.kind}-${task.id}`}
                    className="min-h-[88px] sm:h-[88px] py-3 sm:py-0 px-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 transition-all flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-3 sm:gap-4 cursor-pointer"
                    onClick={() => navigate(task.link)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        navigate(task.link)
                      }
                    }}
                  >
                    {/* Cột 1: Icon Phân loại + Tiêu đề & Lý do */}
                    <div className="sm:col-span-7 flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center shrink-0 gap-1">
                        <TaskCategoryIcon category={task.categoryLabel} />
                        <span className="text-[11px] font-medium text-slate-600 leading-none">
                          {task.categoryLabel}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div
                          className="text-sm font-bold text-slate-900 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[11px] font-semibold shrink-0">
                            {task.badgeLabel}
                          </span>
                          <span
                            className="text-xs font-medium text-slate-600 truncate"
                            title={task.reasonText}
                          >
                            {task.reasonText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cột 2: Khối Metadata Người báo cáo & Ngày gửi */}
                    <div className="sm:col-span-3 sm:pl-5 sm:py-1.5 sm:border-l sm:border-slate-300 flex flex-col justify-center gap-1 min-w-0">
                      <div
                        className="text-xs text-slate-500 truncate"
                        title={`${task.actorLabel}: ${task.actorName}`}
                      >
                        {task.actorLabel}:{" "}
                        <span className="font-semibold text-slate-800">{task.actorName}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {task.createdAtDate ? (
                          <>
                            Ngày gửi:{" "}
                            <span className="font-medium text-slate-700 tabular-nums">
                              {task.createdAtDate}
                            </span>
                          </>
                        ) : (
                          <>
                            Trạng thái:{" "}
                            <span className="font-medium text-slate-700">Chờ kiểm duyệt</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cột 3: Nút Hành động */}
                    <div className="sm:col-span-2 flex justify-end items-center">
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-colors shrink-0 inline-flex items-center gap-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(task.link)
                        }}
                      >
                        Xử lý →
                      </button>
                    </div>
                  </div>
                ))}

                {visibleTasks.length === 1 && (
                  <div className="h-[88px] px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex items-center justify-center text-xs font-medium text-slate-400 select-none">
                    Không còn mục chờ nào khác trong trang này
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Card Bảng dữ liệu: "Danh sách & Hiệu suất tin đăng" */}
          <section className="dashboard-card dashboard-listings-card saas-table-card flex-1 flex flex-col overflow-hidden rounded-2xl">
            {/* Tầng 1: Top Header Row */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                Danh sách &amp; Hiệu suất tin đăng
              </h3>

              <div className="flex items-center gap-2 shrink-0">
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
                <Link
                  to={
                    roomTab === "pending"
                      ? "/admin/tin-cho-thue?status=pending"
                      : "/admin/tin-cho-thue"
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50/70 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-semibold transition-all shadow-2xs shrink-0 whitespace-nowrap"
                >
                  Quản lý tất cả tin đăng →
                </Link>
              </div>
            </div>

            {/* Tầng 2: Toolbar Lọc & Tìm kiếm */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 pb-4 shrink-0">
              {/* Segmented Pill Tabs tách Badge số lượng riêng */}
              <div
                className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80"
                role="tablist"
                aria-label="Bộ lọc nhanh tin cho thuê"
              >
                {(
                  [
                    { id: "featured", label: "Tất cả tin mở", count: metrics.activeRooms.length },
                    { id: "pending", label: "Chờ duyệt", count: metrics.pendingRooms.length },
                  ] as const
                ).map((tab) => {
                  const isActive = roomTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={
                        isActive
                          ? "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 font-semibold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                          : "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 font-medium text-xs transition-all cursor-pointer whitespace-nowrap"
                      }
                      onClick={() => setRoomTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={
                          isActive
                            ? "px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold leading-none tabular-nums"
                            : "px-2 py-0.5 rounded-full bg-slate-200/90 text-slate-600 text-[11px] font-semibold leading-none tabular-nums"
                        }
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Cụm Tìm kiếm mở rộng + Bộ lọc */}
              <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end min-w-[260px]">
                <div className="relative flex-1 max-w-[340px]">
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Tìm kiếm theo tên phòng, địa chỉ, chủ trọ..."
                    aria-label="Tìm kiếm tin cho thuê trong bảng"
                    className="dashboard-listings-search-input w-full h-9 pl-9 pr-3.5 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-emerald-500 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>

                {/* Nút Bộ lọc mở Menu Popover/Dropdown */}
                <div className="saas-filter-dropdown-wrap" ref={filterPopoverRef}>
                  <button
                    type="button"
                    className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                      isFilterOpen || activeFilterCount > 0
                        ? "bg-slate-100 border-slate-300 text-slate-900"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
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
                    <ListFilterIcon className="w-4 h-4 text-slate-500" />
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

            <div className="dashboard-table-wrap flex-1 min-h-0 overflow-y-auto rounded-b-2xl scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="dashboard-table saas-data-table">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100/95 border-y border-slate-200/90 backdrop-blur-xs">
                    <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Thông tin phòng trọ &amp; Khu vực
                    </th>
                    <th className="col-nowrap py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Giá thuê
                    </th>
                    <th className="col-nowrap py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Chủ trọ
                    </th>
                    <th className="col-nowrap py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Lượt xem
                    </th>
                    <th className="col-nowrap py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Trạng thái
                    </th>
                    <th className="col-actions py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-700 select-none">
                      Thao tác
                    </th>
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
                  ) : filteredListings.length === 0 ? (
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
                    filteredListings.map((room) => {
                      const isBusy = busyIds.includes(room.id)
                      const rawPrice =
                        room.price || `${room.priceValue?.toLocaleString("vi-VN")}đ`
                      const priceAmount = rawPrice
                        .replace(/\/tháng$/i, "")
                        .replace(/\s+đ$/i, "đ")
                        .trim()
                      const priceDisplay = `${priceAmount}/tháng`

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
                            <span className="text-sm font-bold text-slate-900">{priceAmount}</span>
                            <span className="text-xs font-normal text-slate-500">/tháng</span>
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
                                className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 inline-flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
                                onClick={() =>
                                  navigate(
                                    `/admin/tin-cho-thue?status=${room.status}&q=${encodeURIComponent(
                                      room.title,
                                    )}`,
                                  )
                                }
                              >
                                Chi tiết →
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
        <div className="dashboard-col-side saas-side-stack flex flex-col gap-6">
          {/* Card 1: "Thống kê tin đăng & Thành viên" (Tách bạch rõ ràng 3 Phần A - B - C) */}
          <section className="dashboard-card dashboard-telemetry-card saas-side-card">
            <h3 className="text-base font-bold text-slate-900">
              Thống kê tin đăng &amp; Thành viên
            </h3>

            {/* PHẦN A: Trạng thái nguồn cung phòng trọ (Segmented Progress Bar) */}
            <div className="saas-telemetry-block is-first">
              <span className="saas-sub-heading">Trạng thái tin cho thuê</span>
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
                  className="saas-bar-slice"
                  style={{ width: `${metrics.pendingRoomPct}%`, backgroundColor: "#cbd5e1" }}
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
                  <i className="saas-dot is-slate" />
                  Chờ duyệt: <b>{metrics.pendingRooms.length}</b> ({metrics.pendingRoomPct}%)
                </span>
                <span>
                  <i className="saas-dot is-slate" />
                  Đã thuê: <b>{metrics.rentedRooms.length + metrics.otherRoomsCount}</b> (
                  {metrics.rentedRoomPct}%)
                </span>
              </div>
            </div>

            {/* PHẦN B: Lưu lượng tương tác (2 Stat Boxes với khung Icon bên phải) */}
            <div className="saas-telemetry-block">
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-slate-600">
                      Tổng lượt xem tin
                    </span>
                    <span className="block text-2xl font-bold text-slate-900 my-0.5 tabular-nums">
                      {metrics.totalViews.toLocaleString("vi-VN")}
                    </span>
                    <span className="block text-[11px] text-slate-500">Toàn hệ thống</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <EyeIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-xs font-medium text-slate-600">
                      Lượt liên hệ chủ trọ
                    </span>
                    <span className="block text-2xl font-bold text-slate-900 my-0.5 tabular-nums">
                      {metrics.totalContacts.toLocaleString("vi-VN")}
                    </span>
                    <span className="block text-[11px] text-slate-500">Kết nối thành công</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
                    <PhoneCallIcon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN C: Phân loại tài khoản (Donut Chart & Pill Legends) */}
            <div className="saas-telemetry-block">
              <span className="saas-sub-heading">Phân loại tài khoản</span>
              <div className="flex items-center justify-center gap-6 sm:gap-10 pt-1">
                <RoleDonutChart total={metrics.totalUsers} segments={roleDonutSegments} />

                <div className="flex-1 max-w-[240px] space-y-2.5 min-w-0">
                  {roleDonutSegments.map((segment) => (
                    <div
                      key={segment.label}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-full px-3.5 py-1.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <i
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium text-slate-700 truncate">
                          {segment.label}
                        </span>
                      </span>
                      <span className="font-bold text-slate-900 tabular-nums shrink-0">
                        {segment.value} ({segment.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: "Thảo luận cộng đồng mới nhất" (Compact Thumbnail Feed) */}
          <section className="dashboard-card dashboard-forum-recent-card saas-side-card">
            <div className="flex items-center justify-between gap-3 pb-3 mb-1 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Thảo luận cộng đồng mới nhất
              </h3>
              <Link
                to="/admin/dien-dan"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors shrink-0"
              >
                Quản lý →
              </Link>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3 pt-2">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`post-skel-${idx}`} className="dashboard-skeleton-row" />
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="dashboard-empty-box">
                <Icon name="chat" size={22} />
                <strong>Chưa có bài thảo luận mới</strong>
                <span>Các bài chia sẻ kinh nghiệm thuê trọ sẽ xuất hiện tại đây.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPosts.map((post) => {
                  const { title, compactTitle } = parseForumPostContent(post.content)
                  const thumbUrl = post.image?.trim()
                  const hasValidThumb = Boolean(thumbUrl && !failedPostThumbUrls[thumbUrl])
                  const authorAvatarUrl = resolveMemberAvatar(
                    users,
                    post.authorId,
                    post.name,
                    post.avatarUrl,
                  )
                  const postDateLabel = formatForumPostDate(post.createdAt, post.time)
                  const commentsCount = post.comments?.length ?? post.commentsCount ?? 0
                  const targetUrl = `/admin/dien-dan?status=${post.status}&q=${encodeURIComponent(
                    compactTitle || post.name,
                  )}`

                  return (
                    <article
                      key={post.id}
                      className="py-3.5 flex items-center justify-between gap-3.5 group cursor-pointer"
                      onClick={() => navigate(targetUrl)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          navigate(targetUrl)
                        }
                      }}
                    >
                      {/* A. Bên trái: Ảnh Thumbnail Vuông 56x56px */}
                      {hasValidThumb && thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={compactTitle}
                          loading="lazy"
                          onError={() =>
                            setFailedPostThumbUrls((prev) =>
                              prev[thumbUrl] ? prev : { ...prev, [thumbUrl]: true },
                            )
                          }
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-slate-100"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0"
                          aria-hidden="true"
                        >
                          <FileTextIcon className="w-5 h-5" />
                        </div>
                      )}

                      {/* B. Ở giữa: Tiêu đề In Đậm & Hàng Thông Tin Phụ Không Dấu Chấm */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className="saas-recent-post-title text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors"
                          title={title}
                        >
                          {compactTitle}
                        </h4>

                        <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1 mt-1.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <img
                              src={authorAvatarUrl || "/images/avatars/default-avatar.jpg"}
                              alt={post.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = "/images/avatars/default-avatar.jpg"
                              }}
                              className="w-4 h-4 rounded-full object-cover shrink-0 bg-slate-100"
                            />
                            <span className="font-medium text-slate-700 truncate">
                              {post.name}
                            </span>
                          </span>

                          <time
                            dateTime={post.createdAt || undefined}
                            className="shrink-0 tabular-nums"
                          >
                            {postDateLabel}
                          </time>

                          <span className="inline-flex items-center gap-1 shrink-0 tabular-nums">
                            <MessageCircleIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{commentsCount} bình luận</span>
                          </span>
                        </div>
                      </div>

                      {/* C. Bên phải: Icon Mũi Tên Điều Hướng */}
                      <span className="shrink-0" aria-hidden="true">
                        <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </span>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
