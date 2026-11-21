import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useLocation, useSearchParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import {
  usePlatform,
  type CategoryRecord,
  type ContentStatus,
  type ForumPost,
  type ListingStatus,
  type PlatformUser,
  type RentalListing,
  type ReportRecord,
} from "@/contexts/PlatformContext"
import { authService } from "@/services/authService"
import { isApiMode, apiRequest } from "@/services/apiClient"
import useDialogFocus from "@/hooks/useDialogFocus"
import {
  formatForumCommentTime,
  formatForumPostDate,
  parseForumPostContent as parsePostContent,
  resolveMemberAvatar as resolveForumMemberAvatar,
} from "@/utils/forumPost"

type Resource = "users" | "listings" | "forum" | "categories" | "reports"
type AdminRow = { id: string; title: string; detail: string; status: string; meta: string; image?: string }
type ListingAreaFilter = "all" | "hcm" | "dn" | "hn"
type ListingSortOption = "newest" | "price_asc" | "price_desc"

const statusText: Record<string, string> = {
  active: "Đang hoạt động",
  locked: "Đã khóa",
  pending: "Chờ xét duyệt",
  hidden: "Đang ẩn",
  rented: "Đã cho thuê",
  rejected: "Từ chối",
  accepted: "Đã chấp nhận",
  reviewed: "Đã xử lý",
}

const ROOM_FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120" fill="none"><rect width="160" height="120" rx="8" fill="#F1F5F9"/><path d="M54 68L80 46L106 68V92H88V74H72V92H54V68Z" stroke="#64748B" stroke-width="3" fill="#E2E8F0"/></svg>',
  )

const MEMBER_PORTRAIT_FALLBACKS = [
  "/images/avatars/demo-owner-01.jpg",
  "/images/avatars/demo-owner-02.jpg",
  "/images/avatars/demo-owner-03.jpg",
  "/images/avatars/demo-owner-04.jpg",
  "/images/avatars/demo-owner-06.jpg",
  "/images/avatars/demo-renter-02.jpg",
  "/images/avatars/demo-broker-01.jpg",
  "/images/avatars/demo-broker-02.jpg",
]

function getMemberAvatarUrl(user: PlatformUser): string {
  const url = user.avatarUrl?.trim()
  if (url && !url.includes("default-brand-avatar")) {
    return url
  }
  if (user.role === "admin") {
    return "/images/avatars/demo-owner-05.jpg"
  }
  const seed = `${user.id}:${user.email}:${user.name}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return MEMBER_PORTRAIT_FALLBACKS[hash % MEMBER_PORTRAIT_FALLBACKS.length]
}

function formatListingPrice(item: RentalListing): string {
  const rawPrice = item.price || `${(item.priceValue || 0).toLocaleString("vi-VN")}đ`
  return rawPrice.includes("/tháng")
    ? rawPrice
    : `${rawPrice.replace(/\s+đ$/i, "đ")}/tháng`
}

function downloadCsv(filename: string, rows: AdminRow[]) {
  const content = [
    "ID,Tiêu đề,Thông tin,Trạng thái,Chi tiết",
    ...rows.map((row) =>
      [row.id, row.title, row.detail, row.status, row.meta]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\r\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }))
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function TaxonomyColumnIcon({
  kind,
  className = "w-4 h-4 text-slate-600 shrink-0",
}: {
  kind: "pin" | "home" | "sparkles"
  className?: string
}) {
  if (kind === "pin") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  }

  if (kind === "home") {
    return (
      <svg
        aria-hidden="true"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </svg>
  )
}

function PencilIcon({ className = "w-3 h-3 text-slate-500 shrink-0" }: { className?: string }) {
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
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )
}

function SearchIcon({ className = "w-4 h-4 text-slate-400" }: { className?: string }) {
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

function getUserDisplayInitials(name: string, fallback?: string): string {
  const clean = name.trim()
  if (clean === "Quản trị viên") return "QT"
  if (fallback && fallback.length >= 2 && fallback !== "AD") return fallback
  const words = clean.split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const lastTwo = words.slice(-2)
    return (lastTwo[0][0] + lastTwo[1][0]).toUpperCase()
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return fallback || "ND"
}

export default function AdminResourcePage() {
  const { pathname } = useLocation()
  const resource = (
    pathname.split("/")[2] === "tin-cho-thue"
      ? "listings"
      : pathname.split("/")[2] === "dien-dan"
        ? "forum"
        : pathname.split("/")[2] === "danh-muc"
          ? "categories"
          : pathname.split("/")[2] === "bao-cao"
            ? "reports"
            : "users"
  ) as Resource

  const {
    users,
    saveUser,
    deleteUser,
    listings,
    setListingStatus,
    deleteListing,
    posts,
    setPostStatus,
    deletePost,
    categories,
    saveCategory,
    deleteCategory,
    reports,
    updateReport,
    addNotification,
    deleteComment,
    connectionState,
    connectionError,
  } = usePlatform()

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "")
  const [filter, setFilter] = useState(() => searchParams.get("status") ?? "all")
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "landlord" | "tenant" | "admin">("all")
  const [userSortBy, setUserSortBy] = useState<"newest" | "name_asc">("newest")
  const [areaFilter, setAreaFilter] = useState<ListingAreaFilter>("all")
  const [sortBy, setSortBy] = useState<ListingSortOption>("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const [forumStatusTab, setForumStatusTab] = useState<"all" | "active" | "hidden" | "with_comments">("all")
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>("all")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [communityPage, setCommunityPage] = useState(1)
  const [failedThumbUrls, setFailedThumbUrls] = useState<Record<string, true>>({})

  const [editing, setEditing] = useState<PlatformUser | CategoryRecord | null>(null)
  const [defaultCategoryType, setDefaultCategoryType] =
    useState<CategoryRecord["type"]>("Khu vực")
  const [categoryStatusActive, setCategoryStatusActive] = useState(true)
  const [reportTargetTypeFilter, setReportTargetTypeFilter] =
    useState<"all" | ReportRecord["targetType"]>("all")
  const [editorError, setEditorError] = useState("")
  const [dialog, setDialog] = useState<"edit" | "report" | "delete" | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    title: string
    detail?: string
    image?: string
    price?: string
    ownerName?: string
    type?: string
    actionLabel?: string
    confirmMessage?: string
  } | null>(null)
  const [actionError, setActionError] = useState("")
  const [reportTarget, setReportTarget] = useState<ReportRecord | null>(null)
  const [reportDecision, setReportDecision] = useState<ReportRecord["status"]>("accepted")
  const [reporterNote, setReporterNote] = useState("")
  const [sendWarning, setSendWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [busyId, setBusyId] = useState("")
  const busyRef = useRef(false)
  const dialogRef = useRef<HTMLElement>(null)

  useDialogFocus(
    dialogRef,
    () => {
      if (!busyRef.current) {
        setDialog(null)
        setDeleteTarget(null)
      }
    },
    Boolean(dialog),
  )

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? ""
    const nextStatus = searchParams.get("status") ?? "all"
    setQuery(nextQuery)
    setFilter(nextStatus)
    setReportTargetTypeFilter("all")
    setDialog(null)
    setDeleteTarget(null)
    setActionError("")
  }, [resource, searchParams])

  const handleFilterChange = (nextStatus: string) => {
    setFilter(nextStatus)
    const nextParams = new URLSearchParams(searchParams)
    if (nextStatus === "all") {
      nextParams.delete("status")
    } else {
      nextParams.set("status", nextStatus)
    }
    setSearchParams(nextParams, { replace: true })
  }

  const statusOptions: Record<Resource, string[]> = {
    users: ["active", "locked"],
    listings: ["pending", "active", "hidden", "rented", "rejected"],
    forum: ["active", "pending", "hidden"],
    categories: ["active", "hidden"],
    reports: ["pending", "accepted", "rejected"],
  }

  const title: Record<Resource, string> = {
    users: "Người dùng",
    listings: "Tin cho thuê",
    forum: "Kiểm duyệt diễn đàn",
    categories: "Danh mục",
    reports: "Báo cáo vi phạm",
  }

  const kind: Record<Resource, string> = {
    users: "Tài khoản",
    listings: "Tin phòng",
    forum: "Bài viết",
    categories: "Danh mục",
    reports: "Nội dung được báo cáo",
  }

  const emptyTitle: Record<Resource, string> = {
    users: "Chưa có tài khoản",
    listings: "Chưa có tin cho thuê",
    forum: "Chưa có bài viết",
    categories: "Chưa có danh mục",
    reports: "Chưa có báo cáo vi phạm",
  }

  const emptyDescription: Record<Resource, string> = {
    users: "Tài khoản mới sẽ xuất hiện tại đây.",
    listings: "Tin cho thuê gửi lên sẽ được hiển thị trong danh sách này.",
    forum: "Bài viết cần kiểm duyệt sẽ xuất hiện tại đây.",
    categories: "Thêm khu vực, loại phòng hoặc tiện ích để quản lý tại đây.",
    reports: "Khi người dùng gửi báo cáo, nội dung cần xem xét sẽ xuất hiện tại đây.",
  }

  const description: Record<Resource, string> = {
    users: "Tìm tài khoản, cập nhật vai trò và kiểm soát trạng thái truy cập.",
    listings: "Xét duyệt, ẩn hoặc gỡ tin cho thuê khỏi kết quả tìm kiếm.",
    forum: "Rà soát bài viết cộng đồng và xử lý nội dung vi phạm.",
    categories: "Quản lý khu vực, loại phòng và tiện ích được dùng trên hệ thống.",
    reports: "Xem nội dung bị báo cáo, đưa ra kết luận và gửi cảnh báo khi cần.",
  }

  // Số liệu thống kê cho 4 Tab trạng thái trên màn hình Tin cho thuê
  const listingTabCounts = useMemo(() => {
    const total = listings.length
    const active = listings.filter((item) => item.status === "active").length
    const pending = listings.filter((item) => item.status === "pending").length
    const hiddenOrRemoved = listings.filter(
      (item) => item.status === "hidden" || item.status === "rejected",
    ).length
    return { total, active, pending, hiddenOrRemoved }
  }, [listings])

  // Danh sách tin cho thuê đã lọc & sắp xếp
  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")

    let list = listings.filter((item) => {
      // Lọc theo trạng thái
      const matchStatus =
        filter === "all"
          ? true
          : filter === "hidden"
            ? item.status === "hidden" || item.status === "rejected"
            : item.status === filter

      if (!matchStatus) return false

      // Lọc theo khu vực (Tỉnh/Thành)
      if (areaFilter !== "all") {
        const loc = (item.location || "").toLocaleLowerCase("vi")
        if (
          areaFilter === "hcm" &&
          !loc.includes("hồ chí minh") &&
          !loc.includes("hcm") &&
          !loc.includes("sài gòn")
        ) {
          return false
        }
        if (areaFilter === "dn" && !loc.includes("đà nẵng")) {
          return false
        }
        if (areaFilter === "hn" && !loc.includes("hà nội")) {
          return false
        }
      }

      // Tìm kiếm theo từ khóa
      if (normalizedQuery) {
        const searchable =
          `${item.title} ${item.location} ${item.price} ${item.area} ${item.ownerName} ${item.type}`.toLocaleLowerCase(
            "vi",
          )
        if (!searchable.includes(normalizedQuery)) return false
      }

      return true
    })

    // Sắp xếp
    list = [...list].sort((a, b) => {
      if (sortBy === "price_asc") {
        return (a.priceValue || 0) - (b.priceValue || 0)
      }
      if (sortBy === "price_desc") {
        return (b.priceValue || 0) - (a.priceValue || 0)
      }
      // Mặc định: Mới nhất
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [listings, filter, areaFilter, query, sortBy])

  const rows: AdminRow[] = useMemo(() => {
    if (resource === "users")
      return users.map((item) => ({
        id: item.id,
        title: item.name,
        detail: item.email,
        status: item.status,
        meta: `${item.role === "landlord" ? "Chủ trọ" : item.role === "admin" ? "Quản trị viên" : "Người thuê"} · ${item.phone}`,
      }))
    if (resource === "listings")
      return filteredListings.map((item) => ({
        id: item.id,
        image: item.image,
        title: item.title,
        detail: item.location,
        status: item.status,
        meta: `${formatListingPrice(item)} · ${item.area} · ${item.ownerName}`,
      }))
    if (resource === "forum")
      return posts.map((item) => ({
        id: item.id,
        title: item.name,
        detail: item.content,
        status: item.status,
        meta: `${item.likes} lượt yêu thích · ${item.commentsCount} bình luận`,
      }))
    if (resource === "categories")
      return categories.map((item) => ({
        id: item.id,
        title: item.name,
        detail: item.type,
        status: item.status,
        meta: `Danh mục ${item.type.toLocaleLowerCase("vi")}`,
      }))
    return reports.map((item) => ({
      id: item.id,
      title: item.targetTitle,
      detail: `${item.targetType} · ${item.reason}`,
      status: item.status,
      meta: `${item.reporter} · ${item.description || "Không có mô tả thêm"}`,
    }))
  }, [resource, users, filteredListings, posts, categories, reports])

  const filtered = useMemo(() => {
    if (resource === "listings") return rows
    return rows.filter(
      (row) =>
        (filter === "all" || row.status === filter) &&
        `${row.title} ${row.detail} ${row.meta}`
          .toLocaleLowerCase("vi")
          .includes(query.toLocaleLowerCase("vi")),
    )
  }, [resource, rows, filter, query])

  // Tự động đưa về trang 1 khi thay đổi từ khóa tìm kiếm, tab trạng thái, khu vực hoặc sắp xếp
  useEffect(() => {
    setCurrentPage(1)
  }, [query, filter, areaFilter, sortBy, resource, userRoleFilter, userSortBy])

  const LISTINGS_PAGE_SIZE = 5
  const totalFilteredListings = filteredListings.length
  const totalListingPages = Math.max(1, Math.ceil(totalFilteredListings / LISTINGS_PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalListingPages)
  const listingStartIndex =
    totalFilteredListings === 0 ? 0 : (safeCurrentPage - 1) * LISTINGS_PAGE_SIZE + 1
  const listingEndIndex = Math.min(safeCurrentPage * LISTINGS_PAGE_SIZE, totalFilteredListings)

  const paginatedListings = useMemo(() => {
    const start = (safeCurrentPage - 1) * LISTINGS_PAGE_SIZE
    return filteredListings.slice(start, start + LISTINGS_PAGE_SIZE)
  }, [filteredListings, safeCurrentPage])

  // Tin cho thuê đang được chọn ở Ngăn Chi tiết tin đăng bên phải
  const selectedListing = useMemo(() => {
    if (filteredListings.length === 0) return null
    if (selectedListingId) {
      const foundOnCurrentPage = paginatedListings.find((item) => item.id === selectedListingId)
      if (foundOnCurrentPage) return foundOnCurrentPage
    }
    return paginatedListings[0] ?? filteredListings[0]
  }, [filteredListings, paginatedListings, selectedListingId])

  // Danh sách bộ ảnh Gallery của phòng đang chọn (loại bỏ ảnh trùng lặp)
  const selectedGalleryPhotos = useMemo(() => {
    if (!selectedListing) return []
    const rawList = [selectedListing.image, ...(selectedListing.gallery ?? [])].filter(
      (url): url is string => Boolean(url && url.trim()),
    )
    const unique = Array.from(new Set(rawList))
    return unique.length > 0 ? unique : [ROOM_FALLBACK_SVG]
  }, [selectedListing])

  // Reset về ảnh đầu tiên mỗi khi Admin chọn sang một tin phòng khác
  useEffect(() => {
    setActivePhotoIndex(0)
  }, [selectedListing?.id])

  const selectedOwnerPhone = useMemo(() => {
    if (!selectedListing) return ""
    if (selectedListing.phone) return selectedListing.phone
    const owner = users.find((u) => u.id === selectedListing.ownerId)
    return owner?.phone ?? ""
  }, [selectedListing, users])

  // Lọc và sắp xếp thành viên (/admin/nguoi-dung)
  const filteredUsers = useMemo(() => {
    if (resource !== "users") return []
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")

    let list = users.filter((u) => {
      // 1. Lọc theo vai trò (Role)
      if (userRoleFilter === "landlord" && u.role !== "landlord") return false
      if (
        userRoleFilter === "tenant" &&
        u.role !== "tenant" &&
        (u.role as string) !== "renter"
      ) {
        return false
      }
      if (userRoleFilter === "admin" && u.role !== "admin") return false

      // 2. Lọc theo trạng thái (Status)
      if (filter !== "all" && u.status !== filter) return false

      // 3. Tìm kiếm theo từ khóa (Tên, email, số điện thoại, ID)
      if (normalizedQuery) {
        const searchable = `${u.name} ${u.email} ${u.phone} ${u.id}`.toLocaleLowerCase("vi")
        if (!searchable.includes(normalizedQuery)) return false
      }

      return true
    })

    // Sắp xếp
    list = [...list].sort((a, b) => {
      if (userSortBy === "name_asc") {
        return a.name.localeCompare(b.name, "vi")
      }
      const timeDiff =
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      if (timeDiff !== 0) return timeDiff
      if (a.role === "admin") return -1
      if (b.role === "admin") return 1
      return 0
    })

    return list
  }, [resource, users, userRoleFilter, filter, query, userSortBy])

  const USERS_PAGE_SIZE = 8
  const totalFilteredUsers = filteredUsers.length
  const totalUserPages = Math.max(1, Math.ceil(totalFilteredUsers / USERS_PAGE_SIZE))
  const safeCurrentUserPage = Math.min(currentPage, totalUserPages)

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentUserPage - 1) * USERS_PAGE_SIZE
    return filteredUsers.slice(start, start + USERS_PAGE_SIZE)
  }, [filteredUsers, safeCurrentUserPage])

  const userCounts = useMemo(() => {
    const total = users.length
    const landlord = users.filter((u) => u.role === "landlord").length
    const tenant = users.filter(
      (u) => u.role === "tenant" || (u.role as string) === "renter",
    ).length
    const admin = users.filter((u) => u.role === "admin").length

    const active = users.filter((u) => u.status === "active").length
    const locked = users.filter((u) => u.status === "locked").length

    return { total, landlord, tenant, admin, active, locked }
  }, [users])

  const openEdit = (
    item?: PlatformUser | CategoryRecord,
    presetCategoryType?: CategoryRecord["type"],
  ) => {
    setEditing(item ?? null)
    if (presetCategoryType) {
      setDefaultCategoryType(presetCategoryType)
    } else if (item && "type" in item) {
      setDefaultCategoryType(item.type)
    } else {
      setDefaultCategoryType("Khu vực")
    }
    setCategoryStatusActive(item ? item.status !== "hidden" : true)
    setEditorError("")
    setDialog("edit")
  }

  const openReportModal = (
    report: ReportRecord,
    presetDecision?: ReportRecord["status"],
  ) => {
    setReportTarget(report)
    setReportDecision(
      presetDecision ??
        (report.status === "rejected" ? "rejected" : "accepted"),
    )
    setReporterNote(report.adminNote ?? "")
    setSendWarning(false)
    setWarningMessage("")
    setActionError("")
    setDialog("report")
  }

  // Số lượng tin cho thuê áp dụng cho từng mục Danh mục & Tiện ích
  const categoryUsageCounts = useMemo(() => {
    const amenityKeywordsMap: Record<string, string[]> = {
      "wi-fi tốc độ cao": ["wi-fi", "wifi", "internet"],
      "wi-fi": ["wi-fi", "wifi", "internet"],
      "bãi đỗ xe": ["bãi đỗ xe", "bãi xe", "bãi để xe", "sân xe", "bãi đỗ ô tô", "chỗ đỗ ô tô"],
      "máy lạnh": ["máy lạnh", "điều hòa"],
      "giường nệm": ["giường nệm", "giường"],
      "camera an ninh": ["camera an ninh", "camera", "bảo vệ"],
      "máy giặt": ["máy giặt"],
      "ban công": ["ban công"],
      "giờ giấc tự do": ["giờ giấc tự do"],
      "cho nuôi thú cưng": ["thú cưng", "nuôi thú"],
    }

    const counts: Record<string, number> = {}
    for (const cat of categories) {
      const target = cat.name.trim().toLocaleLowerCase("vi")
      if (!target) {
        counts[cat.id] = 0
        continue
      }
      if (cat.type === "Khu vực") {
        counts[cat.id] = listings.filter((item) =>
          (item.location || "").toLocaleLowerCase("vi").includes(target),
        ).length
      } else if (cat.type === "Loại phòng") {
        counts[cat.id] = listings.filter(
          (item) => (item.type || "").trim().toLocaleLowerCase("vi") === target,
        ).length
      } else {
        const keywords = amenityKeywordsMap[target] ?? [target]
        counts[cat.id] = listings.filter((item) =>
          (item.amenities ?? []).some((am) => {
            const normAm = am.trim().toLocaleLowerCase("vi")
            return keywords.some(
              (kw) => normAm === kw || normAm.includes(kw) || kw.includes(normAm),
            )
          }),
        ).length
      }
    }
    return counts
  }, [categories, listings])

  // Danh sách Danh mục & Tiện ích đã lọc theo từ khóa & trạng thái
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")
    return categories.filter((item) => {
      const matchStatus = filter === "all" || item.status === filter
      if (!matchStatus) return false
      if (normalizedQuery) {
        const searchable = `${item.name} ${item.type}`.toLocaleLowerCase("vi")
        if (!searchable.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [categories, filter, query])

  // Phân nhóm Danh mục & Tiện ích thành 3 cột độc lập (Khu vực, Loại phòng, Tiện ích)
  const groupedCategories = useMemo(() => {
    const sortByName = (list: CategoryRecord[]) =>
      [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"))

    return {
      areas: sortByName(filteredCategories.filter((item) => item.type === "Khu vực")),
      roomTypes: sortByName(filteredCategories.filter((item) => item.type === "Loại phòng")),
      amenities: sortByName(filteredCategories.filter((item) => item.type === "Tiện ích")),
    }
  }, [filteredCategories])

  // Số liệu thống kê cho 4 Tab trạng thái trên màn hình Kiểm duyệt (/admin/bao-cao)
  const reportTabCounts = useMemo(() => {
    const total = reports.length
    const pending = reports.filter((item) => item.status === "pending").length
    const accepted = reports.filter((item) => item.status === "accepted").length
    const rejected = reports.filter((item) => item.status === "rejected").length
    return { total, pending, accepted, rejected }
  }, [reports])

  // Danh sách Báo cáo vi phạm đã lọc theo Tab trạng thái, Loại nội dung & Từ khóa
  const filteredReports = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")
    return reports.filter((item) => {
      const matchStatus = filter === "all" || item.status === filter
      if (!matchStatus) return false
      const matchType =
        reportTargetTypeFilter === "all" || item.targetType === reportTargetTypeFilter
      if (!matchType) return false
      if (normalizedQuery) {
        const searchable =
          `${item.targetTitle} ${item.targetType} ${item.reason} ${item.reporter} ${item.description}`.toLocaleLowerCase(
            "vi",
          )
        if (!searchable.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [reports, filter, reportTargetTypeFilter, query])

  // Xác định URL hiển thị thực tế của đối tượng bị báo cáo (Phương án A - Mở ở tab mới)
  const getReportTargetUrl = (report: ReportRecord): string => {
    if (report.targetType === "Tin phòng") {
      const matchedListing =
        listings.find((item) => item.id === report.targetId) ??
        listings.find(
          (item) =>
            item.title.trim().toLocaleLowerCase("vi") ===
            report.targetTitle.trim().toLocaleLowerCase("vi"),
        )
      return `/phong/${matchedListing ? matchedListing.id : report.targetId}`
    }

    if (report.targetType === "Bài viết") {
      const matchedPost = posts.find((item) => item.id === report.targetId)
      return matchedPost ? `/bai-viet/${matchedPost.id}` : "/dien-dan"
    }

    // Bình luận: tìm bài viết chứa bình luận này để mở trang bài viết diễn đàn
    const parentPost =
      posts.find(
        (post) =>
          post.id === report.targetId ||
          post.comments?.some((comment) => comment.id === report.targetId),
      ) ??
      posts.find(
        (post) =>
          report.targetTitle.toLocaleLowerCase("vi").includes("chuyển trọ") &&
          post.id === "seed-forum-12",
      )
    return parentPost ? `/bai-viet/${parentPost.id}` : "/dien-dan"
  }

  // Thống kê số lượng bài viết cho các Tab ở màn hình Cộng đồng (/admin/dien-dan)
  const forumTabCounts = useMemo(() => {
    const all = posts.length
    const active = posts.filter((p) => p.status === "active").length
    const hidden = posts.filter((p) => p.status === "hidden").length
    const withComments = posts.filter(
      (p) => (p.comments?.length ?? p.commentsCount ?? 0) > 0,
    ).length
    return { all, active, hidden, withComments }
  }, [posts])

  // Danh mục động từ các bài viết cộng đồng
  const forumCategories = useMemo(() => {
    const standard = ["Pass phòng", "Tìm ở ghép", "Review khu trọ", "Kinh nghiệm"]
    const set = new Set<string>(standard)
    posts.forEach((p) => {
      const { category } = parsePostContent(p.content)
      if (category && category !== "Bài viết") set.add(category)
    })
    return Array.from(set)
  }, [posts])

  // Danh sách bài viết sau khi áp dụng bộ lọc Tab, Danh mục và Ô tìm kiếm
  const filteredForumPosts = useMemo(() => {
    return posts.filter((post) => {
      const parsed = parsePostContent(post.content)

      if (forumStatusTab === "active" && post.status !== "active") return false
      if (forumStatusTab === "hidden" && post.status !== "hidden") return false
      if (forumStatusTab === "with_comments") {
        const cCount = post.comments?.length ?? post.commentsCount ?? 0
        if (cCount <= 0) return false
      }

      if (forumCategoryFilter !== "all" && parsed.category !== forumCategoryFilter) {
        return false
      }

      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const inTitle = parsed.title.toLowerCase().includes(q)
        const inAuthor = (post.name || "").toLowerCase().includes(q)
        const inContent = (post.content || "").toLowerCase().includes(q)
        const inComments = post.comments?.some(
          (c) =>
            (c.author || "").toLowerCase().includes(q) ||
            (c.text || "").toLowerCase().includes(q),
        )
        if (!inTitle && !inAuthor && !inContent && !inComments) return false
      }

      return true
    })
  }, [posts, forumStatusTab, forumCategoryFilter, query])

  useEffect(() => {
    setCommunityPage(1)
  }, [forumStatusTab, forumCategoryFilter, query])

  const FORUM_POSTS_PER_PAGE = 6
  const totalCommunityPages = Math.max(
    1,
    Math.ceil(filteredForumPosts.length / FORUM_POSTS_PER_PAGE),
  )
  const safeCommunityPage = Math.min(communityPage, totalCommunityPages)

  const pagedForumPosts = useMemo(() => {
    const start = (safeCommunityPage - 1) * FORUM_POSTS_PER_PAGE
    return filteredForumPosts.slice(start, start + FORUM_POSTS_PER_PAGE)
  }, [filteredForumPosts, safeCommunityPage])

  // Bài viết đang chọn trong Master-Detail
  const selectedPost = useMemo(() => {
    if (!filteredForumPosts.length) return null
    if (selectedPostId) {
      const found = filteredForumPosts.find((p) => p.id === selectedPostId)
      if (found) return found
    }
    return filteredForumPosts[0]
  }, [filteredForumPosts, selectedPostId])

  const selectedPostParsed = useMemo(() => {
    return selectedPost
      ? parsePostContent(selectedPost.content)
      : {
          title: "",
          compactTitle: "",
          excerpt: "",
          category: "Bài viết",
          fullContent: "",
          bodyContent: "",
        }
  }, [selectedPost])

  const markThumbFailed = (url: string) => {
    setFailedThumbUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }))
  }

  const resolveMemberAvatar = (
    authorId?: string,
    authorName?: string,
    explicitAvatarUrl?: string,
  ): string | undefined =>
    resolveForumMemberAvatar(users, authorId, authorName, explicitAvatarUrl)

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (window.confirm("Xóa bình luận vi phạm này?")) {
      try {
        await deleteComment(postId, commentId)
      } catch (caught: unknown) {
        setActionError(
          caught instanceof Error ? caught.message : "Không thể xóa bình luận.",
        )
      }
    }
  }

  const saveEditor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busyRef.current) return
    busyRef.current = true
    setBusyId("editor")
    setEditorError("")
    const data = new FormData(event.currentTarget)
    try {
      if (resource === "users") {
        const email = String(data.get("email") ?? "").trim().toLocaleLowerCase("vi")
        const phone = String(data.get("phone") ?? "").replace(/\D/g, "")
        const password = String(data.get("password") ?? "")
        if (!editing && isApiMode && password.length < 8) {
          setEditorError("Tài khoản mới cần mật khẩu tối thiểu 8 ký tự.")
          return
        }
        const duplicate = users.some(
          (item) =>
            item.id !== editing?.id &&
            (item.email.toLocaleLowerCase("vi") === email ||
              (phone.length > 0 && item.phone.replace(/\D/g, "") === phone)),
        )
        if (duplicate) {
          setEditorError("Email hoặc số điện thoại đã được dùng cho tài khoản khác.")
          return
        }
        const user: PlatformUser = {
          id: editing?.id ?? `user-${Date.now()}`,
          name: String(data.get("name") ?? ""),
          email,
          phone: String(data.get("phone") ?? ""),
          role: String(data.get("role") ?? "renter") as PlatformUser["role"],
          initials: String(data.get("name") ?? "")
            .split(" ")
            .slice(-2)
            .map((part) => part[0])
            .join("")
            .toUpperCase(),
          status: String(data.get("status") ?? "active") as PlatformUser["status"],
          createdAt:
            editing && "createdAt" in editing ? editing.createdAt : new Date().toISOString(),
        }
        try {
          await saveUser(user, password || undefined)
        } catch (caught) {
          setEditorError(caught instanceof Error ? caught.message : "Không thể lưu tài khoản.")
          return
        }
        if (!isApiMode) authService.saveManagedAccount(user)
      } else {
        const category: CategoryRecord = {
          id: editing?.id ?? `category-${Date.now()}`,
          name: String(data.get("name") ?? ""),
          type: String(data.get("type") ?? "Khu vực") as CategoryRecord["type"],
          status: String(data.get("status") ?? "active") as CategoryRecord["status"],
        }
        await saveCategory(category)
      }
      setDialog(null)
    } catch (caught) {
      setEditorError(
        caught instanceof Error ? caught.message : "Không thể lưu thông tin. Hãy thử lại.",
      )
    } finally {
      busyRef.current = false
      setBusyId("")
    }
  }

  const action = async (id: string, status: string) => {
    if (busyRef.current) return
    setActionError("")
    busyRef.current = true
    setBusyId(id)
    try {
      if (resource === "users") {
        const item = users.find((value) => value.id === id)
        if (item) {
          const updated = {
            ...item,
            status: status === "locked" ? ("active" as const) : ("locked" as const),
          }
          await saveUser(updated)
            .then(() => {
              if (!isApiMode) authService.saveManagedAccount(updated)
            })
            .catch((error: unknown) =>
              setActionError(
                error instanceof Error ? error.message : "Không thể cập nhật tài khoản.",
              ),
            )
        }
      } else if (resource === "listings") {
        const item = listings.find((value) => value.id === id)
        await setListingStatus(id, status as ListingStatus)
          .then(() => {
            if (!isApiMode && item && (status === "active" || status === "rejected"))
              addNotification({
                userId: item.ownerId,
                title:
                  status === "active"
                    ? "Tin cho thuê đã được duyệt"
                    : "Tin cho thuê cần chỉnh sửa",
                detail:
                  status === "active"
                    ? `Tin “${item.title}” hiện đã được hiển thị.`
                    : `Tin “${item.title}” chưa được duyệt. Vui lòng rà soát lại thông tin.`,
              })
          })
          .catch((error: unknown) =>
            setActionError(
              error instanceof Error ? error.message : "Không thể cập nhật trạng thái tin.",
            ),
          )
      } else if (resource === "forum") await setPostStatus(id, status as ContentStatus)
      else if (resource === "categories") {
        const item = categories.find((value) => value.id === id)
        if (item)
          await saveCategory({ ...item, status: item.status === "active" ? "hidden" : "active" })
      } else {
        const report = reports.find((value) => value.id === id)
        if (report) {
          setReportTarget(report)
          setReportDecision("accepted")
          setReporterNote("")
          setSendWarning(false)
          setWarningMessage("")
          setDialog("report")
        }
      }
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Không thể cập nhật nội dung. Hãy thử lại.",
      )
    } finally {
      busyRef.current = false
      setBusyId("")
    }
  }

  const requestDeleteListing = (item: RentalListing) => {
    setDeleteTarget({
      id: item.id,
      title: item.title,
      detail: item.location,
      image: item.image,
      price: formatListingPrice(item),
      ownerName: item.ownerName,
      type: item.type || "Tin cho thuê",
      actionLabel: "Gỡ tin",
      confirmMessage:
        "Bạn có chắc chắn muốn gỡ tin đăng này khỏi hệ thống? Tin đăng sẽ không còn hiển thị trên kết quả tìm kiếm và người thuê sẽ không thể truy cập.",
    })
    setDialog("delete")
  }

  const requestDeleteCategory = (item: CategoryRecord) => {
    setDeleteTarget({
      id: item.id,
      title: item.name,
      detail: `Nhóm: ${item.type}`,
      type: "Danh mục",
      actionLabel: "Xóa danh mục",
      confirmMessage: `Bạn có chắc chắn muốn xóa ${item.type.toLocaleLowerCase("vi")} “${item.name}”? Các tin đang dùng mục này có thể cần được cập nhật lại.`,
    })
    setDialog("delete")
  }

  const remove = (id: string, name: string, detail?: string) => {
    setDeleteTarget({
      id,
      title: name,
      detail,
      type: kind[resource] ?? "Mục",
      actionLabel: resource === "reports" ? "Từ chối báo cáo" : "Xóa",
      confirmMessage:
        resource === "reports"
          ? `Từ chối báo cáo “${name}”?`
          : `Bạn có chắc chắn muốn xóa “${name}”? Thao tác này sẽ xóa dữ liệu khỏi hệ thống.`,
    })
    setDialog("delete")
  }

  const confirmDelete = async () => {
    if (!deleteTarget || busyRef.current) return
    const { id } = deleteTarget
    setActionError("")
    busyRef.current = true
    setBusyId(id)
    try {
      if (resource === "users") {
        await deleteUser(id)
          .then(() => {
            if (!isApiMode) authService.deleteManagedAccount(id)
          })
          .catch((error: unknown) =>
            setActionError(error instanceof Error ? error.message : "Không thể xóa tài khoản."),
          )
      } else if (resource === "listings") {
        await deleteListing(id)
      } else if (resource === "forum") {
        await deletePost(id)
      } else if (resource === "categories") {
        await deleteCategory(id)
      } else if (resource === "reports") {
        await updateReport(id, "rejected", "Đã từ chối báo cáo.")
      }
      setDialog(null)
      setDeleteTarget(null)
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Không thể xóa nội dung. Hãy thử lại.",
      )
    } finally {
      busyRef.current = false
      setBusyId("")
    }
  }

  const saveReportDecision = async (event: FormEvent) => {
    event.preventDefault()
    if (!reportTarget || busyRef.current) return
    if (sendWarning && !warningMessage.trim()) {
      setActionError("Vui lòng nhập nội dung cảnh báo gửi cho người vi phạm.")
      return
    }
    setActionError("")
    busyRef.current = true
    setBusyId("report")
    try {
      await updateReport(reportTarget.id, reportDecision, reporterNote.trim())
      if (sendWarning && warningMessage.trim()) {
        const targetUserId =
          reportTarget.targetType === "Tin phòng"
            ? listings.find((item) => item.id === reportTarget.targetId)?.ownerId
            : reportTarget.targetType === "Bài viết"
              ? posts.find((item) => item.id === reportTarget.targetId)?.authorId
              : posts
                  .flatMap((item) => item.comments)
                  .find((item) => item.id === reportTarget.targetId)?.authorId
        if (targetUserId) {
          if (isApiMode) {
            try {
              await apiRequest(`reports/${encodeURIComponent(reportTarget.id)}/warning`, {
                method: "POST",
                body: JSON.stringify({ userId: targetUserId, note: warningMessage.trim() }),
              })
            } catch {
              await addNotification({
                userId: targetUserId,
                title: "Cảnh báo từ quản trị viên",
                detail: warningMessage.trim(),
              })
            }
          } else {
            await addNotification({
              userId: targetUserId,
              title: "Cảnh báo từ quản trị viên",
              detail: warningMessage.trim(),
            })
          }
        }
      }
      setDialog(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Không thể xử lý báo cáo.")
    } finally {
      busyRef.current = false
      setBusyId("")
    }
  }

  const editDialogNode =
    dialog === "edit" ? (
      <div
        className="dialog-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && !busyRef.current) {
            setDialog(null)
          }
        }}
      >
        {resource === "categories" ? (
          <section
            ref={dialogRef}
            className="action-dialog saas-category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-category-modal-title"
          >
            {/* Header nền trắng sạch sẽ, không có mô tả phụ */}
            <div className="saas-category-modal-header">
              <div className="saas-category-modal-header-left">
                <span className="saas-category-modal-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="7" cy="7" r="1.5" fill="currentColor" />
                    <path
                      d="M19 3v4m-2-2h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <h2 id="admin-category-modal-title" className="saas-category-modal-title">
                  {editing ? "Cập nhật danh mục & tiện ích" : "Thêm danh mục & tiện ích mới"}
                </h2>
              </div>
              <button
                type="button"
                className="saas-modal-close-btn"
                disabled={Boolean(busyId)}
                onClick={() => setDialog(null)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form className="saas-category-modal-form" onSubmit={saveEditor}>
              {editorError && (
                <p className="form-message error" role="alert">
                  {editorError}
                </p>
              )}

              {/* Trường 1 - Nhóm phân loại (3 ô chọn trực quan nằm ngang) */}
              <div className="saas-category-field-group">
                <span className="saas-category-field-label">Nhóm phân loại</span>
                <input type="hidden" name="type" value={defaultCategoryType} />
                <div className="saas-category-type-grid" role="radiogroup" aria-label="Nhóm phân loại">
                  {(
                    [
                      { value: "Khu vực", label: "Khu vực", icon: "pin" },
                      { value: "Loại phòng", label: "Loại phòng", icon: "home" },
                      { value: "Tiện ích", label: "Tiện ích phòng", icon: "sparkles" },
                    ] as const
                  ).map((opt) => {
                    const isSelected = defaultCategoryType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`saas-category-type-card${isSelected ? " is-selected" : ""}`}
                        onClick={() => setDefaultCategoryType(opt.value)}
                      >
                        <Icon name={opt.icon} size={18} />
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trường 2 - Tên danh mục (Không hiển thị dòng gợi ý nhanh) */}
              <label className="saas-category-field-group">
                <span className="saas-category-field-label">Tên danh mục</span>
                <input
                  name="name"
                  className="saas-category-text-input"
                  key={editing ? `name-${editing.id}` : "name-new-cat"}
                  defaultValue={editing && "name" in editing ? editing.name : ""}
                  placeholder="VD: Quận 7, Thủ Đức, Ban công..."
                  autoComplete="off"
                  required
                />
              </label>

              {/* Trường 3 - Trạng thái hiển thị (Tinh gọn trên 1 dòng ngang với Toggle Switch) */}
              <div className="saas-category-status-row">
                <input
                  type="hidden"
                  name="status"
                  value={categoryStatusActive ? "active" : "hidden"}
                />
                <div className="saas-category-status-text">
                  <strong className="saas-category-status-title">Trạng thái hiển thị</strong>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={categoryStatusActive}
                  aria-label="Trạng thái hiển thị"
                  className={`saas-toggle-switch${categoryStatusActive ? " is-active" : ""}`}
                  onClick={() => setCategoryStatusActive((prev) => !prev)}
                >
                  <span className="saas-toggle-thumb" />
                </button>
              </div>

              {/* Footer */}
              <div className="saas-category-modal-footer">
                <button
                  type="button"
                  className="saas-modal-btn-outline"
                  disabled={Boolean(busyId)}
                  onClick={() => setDialog(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="saas-modal-btn-emerald"
                  disabled={Boolean(busyId)}
                >
                  {busyId === "editor" ? "Đang lưu…" : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section
            ref={dialogRef}
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-editor-title"
          >
            <button
              className="dialog-close"
              disabled={Boolean(busyId)}
              onClick={() => setDialog(null)}
              aria-label="Đóng"
            >
              <Icon name="close" />
            </button>
            <h2 id="admin-editor-title">{editing ? "Cập nhật thông tin" : "Tạo mới"}</h2>
            <form className="dialog-form" onSubmit={saveEditor}>
              {editorError && (
                <p className="form-message error" role="alert">
                  {editorError}
                </p>
              )}
              {!editing && resource === "users" && (
                <p className="demo-note">
                  {isApiMode
                    ? "Đặt mật khẩu ban đầu an toàn; mật khẩu sẽ được băm trước khi lưu."
                    : `Tài khoản demo mới dùng mật khẩu ${authService.demoPassword}; người dùng có thể đổi mật khẩu sau khi đăng nhập.`}
                </p>
              )}
              <label className="form-field">
                <span>Họ tên</span>
                <input
                  name="name"
                  defaultValue={editing && "name" in editing ? editing.name : ""}
                  required
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={editing && "email" in editing ? editing.email : ""}
                  required
                />
              </label>
              <label className="form-field">
                <span>Số điện thoại</span>
                <input
                  name="phone"
                  defaultValue={editing && "phone" in editing ? editing.phone : ""}
                  required
                />
              </label>
              {!editing && (
                <label className="form-field">
                  <span>Mật khẩu ban đầu</span>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required={isApiMode}
                    autoComplete="new-password"
                    placeholder="Ít nhất 8 ký tự"
                  />
                </label>
              )}
              <label className="form-field">
                <span>Vai trò</span>
                <select
                  name="role"
                  defaultValue={editing && "role" in editing ? editing.role : "renter"}
                >
                  <option value="renter">Người thuê</option>
                  <option value="landlord">Chủ trọ</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </label>
              <label className="form-field">
                <span>Trạng thái</span>
                <select
                  name="status"
                  defaultValue={editing && "status" in editing ? editing.status : "active"}
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Đã khóa</option>
                </select>
              </label>
              <div className="dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busyId)}
                  onClick={() => setDialog(null)}
                >
                  Hủy
                </Button>
                <Button disabled={Boolean(busyId)}>
                  {busyId === "editor" ? "Đang lưu…" : "Lưu thông tin"}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
    ) : null

  const confirmDialogNode =
    dialog === "delete" && deleteTarget ? (
      <div
        className="dialog-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && !busyRef.current) {
            setDialog(null)
            setDeleteTarget(null)
          }
        }}
      >
        <section
          ref={dialogRef}
          className="action-dialog saas-confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="saas-confirm-title"
        >
          <button
            type="button"
            className="dialog-close saas-confirm-close"
            disabled={Boolean(busyId)}
            onClick={() => {
              setDialog(null)
              setDeleteTarget(null)
            }}
            aria-label="Đóng"
          >
            <Icon name="close" size={16} />
          </button>

          <div className="saas-confirm-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 id="saas-confirm-title" className="saas-confirm-title">
            {resource === "listings"
              ? "Xác nhận gỡ tin cho thuê"
              : resource === "categories"
                ? "Xác nhận xóa danh mục"
                : "Xác nhận xóa nội dung"}
          </h2>

          <p className="saas-confirm-desc">
            {deleteTarget.confirmMessage ||
              `Bạn có chắc chắn muốn xóa “${deleteTarget.title}”? Thao tác này sẽ xóa dữ liệu khỏi hệ thống.`}
          </p>

          {resource === "listings" && (
            <div className="saas-confirm-snippet">
              <img
                className="saas-confirm-snippet-thumb"
                src={deleteTarget.image || ROOM_FALLBACK_SVG}
                alt={deleteTarget.title}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = ROOM_FALLBACK_SVG
                }}
              />
              <div className="saas-confirm-snippet-body">
                <h4 className="saas-confirm-snippet-title" title={deleteTarget.title}>
                  {deleteTarget.title}
                </h4>
                <div className="saas-confirm-snippet-meta">
                  {deleteTarget.price && (
                    <span className="saas-confirm-snippet-price">{deleteTarget.price}</span>
                  )}
                  {deleteTarget.ownerName && (
                    <span className="saas-confirm-snippet-owner">
                      Chủ trọ: {deleteTarget.ownerName}
                    </span>
                  )}
                </div>
                {deleteTarget.detail && (
                  <p className="saas-confirm-snippet-loc" title={deleteTarget.detail}>
                    {deleteTarget.detail}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="saas-confirm-warning-badge" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 8v4m0 4h.01M3.6 19h16.8c1.2 0 1.9-1.3 1.3-2.3L13.3 4.2c-.6-1-2-1-2.6 0L2.3 16.7c-.6 1 .1 2.3 1.3 2.3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              {resource === "listings"
                ? "Lưu ý: Tin đăng sau khi gỡ sẽ bị xóa khỏi danh sách và không thể phục hồi."
                : "Lưu ý: Thao tác này không thể hoàn tác sau khi xác nhận."}
            </span>
          </div>

          <div className="saas-confirm-actions">
            <button
              type="button"
              className="saas-btn-cancel"
              disabled={Boolean(busyId)}
              onClick={() => {
                setDialog(null)
                setDeleteTarget(null)
              }}
            >
              Hủy
            </button>

            <button
              type="button"
              className="saas-btn-danger-solid"
              disabled={Boolean(busyId)}
              onClick={confirmDelete}
            >
              {busyId ? (
                <>
                  <span className="saas-btn-spinner" aria-hidden="true" />
                  <span>Đang xử lý…</span>
                </>
              ) : (
                <span>
                  {deleteTarget.actionLabel ||
                    (resource === "listings" ? "Xác nhận gỡ tin" : "Xác nhận xóa")}
                </span>
              )}
            </button>
          </div>
        </section>
      </div>
    ) : null

  const reportDialogNode =
    dialog === "report" && reportTarget ? (
      <div
        className="dialog-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget && !busyRef.current) {
            setDialog(null)
          }
        }}
      >
        <section
          ref={dialogRef}
          className="action-dialog saas-report-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-report-modal-title"
        >
          {/* Header chỉ có tiêu đề "Xử lý báo cáo" và nút đóng ✕ */}
          <div className="saas-report-modal-header">
            <h2 id="admin-report-modal-title" className="saas-report-modal-title">
              Xử lý báo cáo
            </h2>
            <button
              type="button"
              className="saas-modal-close-btn"
              disabled={Boolean(busyId)}
              onClick={() => setDialog(null)}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Khung tóm tắt đối tượng: Bố cục Lưới Nhãn – Giá Trị Đồng Nhất (145px | 1fr) */}
          <div className="saas-report-modal-summary saas-report-summary-grid">
            {/* Hàng 1: Lý do báo cáo */}
            <span className="saas-report-summary-label">Lý do báo cáo:</span>
            <div className="saas-report-summary-value">
              <span className="saas-report-modal-reason-tag">{reportTarget.reason}</span>
            </div>

            {/* Hàng 2: Nội dung bị báo cáo */}
            <span className="saas-report-summary-label">Nội dung bị báo cáo:</span>
            <div className="saas-report-summary-value">
              <a
                href={getReportTargetUrl(reportTarget)}
                target="_blank"
                rel="noopener noreferrer"
                className="saas-report-modal-target saas-report-target-link"
                title="Mở xem nội dung gốc trong tab mới"
              >
                <span>{reportTarget.targetTitle}</span>
                <span className="saas-report-target-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>

            {/* Đường kẻ mảnh ngăn cách Hàng 2 và Hàng 3 */}
            <div className="saas-report-summary-divider" aria-hidden="true" />

            {/* Hàng 3: Chi tiết phản ánh */}
            <span className="saas-report-summary-label">Chi tiết phản ánh:</span>
            <div className="saas-report-summary-value saas-report-summary-desc-text">
              <strong className="saas-report-modal-reporter">
                {reportTarget.reporter}:
              </strong>{" "}
              &ldquo;{reportTarget.description || "Không có mô tả chi tiết."}&rdquo;
            </div>
          </div>

          <form className="saas-report-modal-form" onSubmit={saveReportDecision}>
            {actionError && (
              <p className="form-message error" role="alert">
                {actionError}
              </p>
            )}

            {/* Kết quả xử lý: 2 nút chọn ngang tinh gọn */}
            <div className="saas-report-field-group">
              <span className="saas-report-field-label">Kết quả</span>
              <div className="saas-report-decision-grid" role="radiogroup" aria-label="Kết quả xử lý">
                <button
                  type="button"
                  role="radio"
                  aria-checked={reportDecision === "accepted"}
                  className={`saas-report-decision-btn${reportDecision === "accepted" ? " is-selected" : ""}`}
                  onClick={() => setReportDecision("accepted")}
                >
                  <span
                    className={`saas-report-decision-check${reportDecision === "accepted" ? " is-checked" : ""}`}
                    aria-hidden="true"
                  >
                    {reportDecision === "accepted" ? "✓" : ""}
                  </span>
                  <span>Chấp nhận báo cáo</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={reportDecision === "rejected"}
                  className={`saas-report-decision-btn${reportDecision === "rejected" ? " is-selected" : ""}`}
                  onClick={() => setReportDecision("rejected")}
                >
                  <span
                    className={`saas-report-decision-check${reportDecision === "rejected" ? " is-checked" : ""}`}
                    aria-hidden="true"
                  >
                    {reportDecision === "rejected" ? "✕" : ""}
                  </span>
                  <span>Từ chối báo cáo</span>
                </button>
              </div>
            </div>

            {/* Ô 1: Phản hồi cho người báo cáo (Luôn hiển thị) */}
            <div className="saas-report-field-group">
              <label htmlFor="admin-report-note-input" className="saas-report-field-label">
                Phản hồi cho người báo cáo ({reportTarget.reporter})
              </label>
              <textarea
                id="admin-report-note-input"
                className="saas-report-textarea"
                rows={2}
                value={reporterNote}
                onChange={(event) => setReporterNote(event.target.value)}
                placeholder="VD: Cảm ơn bạn đã báo cáo, BQT đã kiểm tra và xử lý vi phạm này..."
              />
            </div>

            {/* Công tắc Toggle: Gửi cảnh báo nhắc nhở đến người vi phạm */}
            <div
              className="saas-report-warning-toggle-container"
              onClick={() => setSendWarning((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSendWarning((prev) => !prev)
                }
              }}
            >
              <button
                type="button"
                role="switch"
                aria-checked={sendWarning}
                aria-label="Gửi cảnh báo nhắc nhở đến người vi phạm"
                className={`saas-toggle-switch saas-toggle-switch--sm${sendWarning ? " is-active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSendWarning((prev) => !prev)
                }}
              >
                <span className="saas-toggle-thumb" />
              </button>
              <span className="saas-report-warning-toggle-label">
                Gửi cảnh báo nhắc nhở đến người vi phạm
              </span>
            </div>

            {/* Ô 2: Nội dung cảnh báo gửi người vi phạm (Chỉ hiển thị khi bật công tắc) */}
            {sendWarning && (
              <div className="saas-report-field-group saas-report-warning-field-block">
                <label htmlFor="admin-report-warning-input" className="saas-report-field-label">
                  Nội dung cảnh báo gửi người vi phạm
                </label>
                <textarea
                  id="admin-report-warning-input"
                  className="saas-report-textarea"
                  rows={2}
                  value={warningMessage}
                  onChange={(event) => setWarningMessage(event.target.value)}
                  placeholder="VD: Bài viết của bạn có dấu hiệu yêu cầu chuyển khoản cọc bất thường, vui lòng..."
                />
              </div>
            )}

            {/* Footer */}
            <div className="saas-report-modal-footer">
              <button
                type="button"
                className="saas-modal-btn-outline"
                disabled={Boolean(busyId)}
                onClick={() => setDialog(null)}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="saas-modal-btn-emerald-dark"
                disabled={Boolean(busyId)}
              >
                {busyId === "report" ? "Đang lưu…" : "Lưu kết quả"}
              </button>
            </div>
          </form>
        </section>
      </div>
    ) : null

  // Giao diện chuyên biệt cho màn hình "Kiểm duyệt" (/admin/bao-cao)
  if (resource === "reports") {
    const reportStatusTabs = [
      { id: "all", label: "Tất cả báo cáo", count: reportTabCounts.total, dotClass: null },
      {
        id: "pending",
        label: "Chờ xét duyệt",
        count: reportTabCounts.pending,
        dotClass: "bg-slate-400",
      },
      {
        id: "accepted",
        label: "Đã chấp nhận",
        count: reportTabCounts.accepted,
        dotClass: "bg-emerald-500",
      },
      { id: "rejected", label: "Từ chối", count: reportTabCounts.rejected, dotClass: "bg-slate-400" },
    ] as const

    return (
      <main className="admin-resource-page management-page management-admin admin-resource-page--reports saas-reports-page">
        {/* Hàng 1: Dãy 4 Tab Trạng thái đồng bộ chiều cao + Nút Tải CSV Outline */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-2.5"
            role="tablist"
            aria-label="Lọc theo trạng thái báo cáo"
          >
            {reportStatusTabs.map((tab) => {
              const isActive = filter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`h-10 px-4 rounded-xl text-sm inline-flex items-center gap-2 transition-all box-border border cursor-pointer whitespace-nowrap shadow-2xs ${
                    isActive
                      ? "border-emerald-600 ring-1 ring-emerald-600 bg-white text-slate-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  onClick={() => handleFilterChange(tab.id)}
                >
                  {tab.dotClass && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${tab.dotClass}`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-xs font-semibold leading-none tabular-nums ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            onClick={() => downloadCsv("bao-cao-vi-pham-tro-oi.csv", filtered)}
          >
            <Icon name="download" size={16} />
            <span>Tải CSV</span>
          </button>
        </div>

        {/* Hàng 2: Tách rời Ô Tìm kiếm mở rộng & Cụm lọc Loại nội dung */}
        <div className="flex flex-wrap items-center justify-between gap-4 my-4">
          <div className="relative flex-1 min-w-[320px]">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              aria-label="Tìm theo nội dung, lý do vi phạm hoặc người báo cáo"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo nội dung, lý do vi phạm hoặc người báo cáo..."
              autoComplete="off"
              spellCheck={false}
              className="saas-reports-search-input w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 shadow-2xs transition-all"
            />
          </div>

          <div
            className="flex items-center gap-2.5 shrink-0 flex-wrap"
            role="group"
            aria-label="Lọc theo loại nội dung"
          >
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Loại nội dung:
            </span>
            <div className="inline-flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-200/80 h-10 gap-0.5">
              {(
                [
                  { value: "all", label: "Tất cả" },
                  { value: "Tin phòng", label: "Tin phòng" },
                  { value: "Bài viết", label: "Bài viết" },
                  { value: "Bình luận", label: "Bình luận" },
                ] as const
              ).map((seg) => {
                const isActive = reportTargetTypeFilter === seg.value
                return (
                  <button
                    key={seg.value}
                    type="button"
                    aria-pressed={isActive}
                    className={
                      isActive
                        ? "h-full inline-flex items-center justify-center bg-white text-slate-900 font-semibold shadow-2xs px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap"
                        : "h-full inline-flex items-center justify-center text-slate-600 hover:text-slate-900 font-medium px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap"
                    }
                    onClick={() => setReportTargetTypeFilter(seg.value)}
                  >
                    {seg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {actionError && (
          <p className="form-message error" role="alert">
            {actionError}
          </p>
        )}

        {connectionState === "loading" && (
          <p className="management-feedback" role="status">
            Đang tải dữ liệu báo cáo…
          </p>
        )}

        {connectionState === "error" && (
          <p className="form-message error" role="alert">
            {connectionError || "Không tải được dữ liệu. Hãy tải lại trang để thử lại."}
          </p>
        )}

        {/* Danh sách Báo Cáo Bố Cục Lưới 4 Cột Có Đường Ngăn Cách Dọc Rõ Nét */}
        <section
          className="flex flex-col"
          aria-busy={Boolean(busyId) || connectionState === "loading"}
          aria-label="Danh sách báo cáo vi phạm"
        >
          {filteredReports.length > 0 && (
            <>
              <div
                className="hidden lg:grid lg:grid-cols-12 items-center bg-slate-200/70 border border-slate-300/80 rounded-xl px-0 py-3 mb-3 lg:divide-x lg:divide-slate-300/70"
                role="row"
                aria-hidden="true"
              >
                <div className="lg:col-span-4 px-5 text-sm font-bold text-slate-800">
                  Lý do vi phạm &amp; Phân loại
                </div>
                <div className="lg:col-span-3 px-5 text-sm font-bold text-slate-800">
                  Nội dung bị báo cáo
                </div>
                <div className="lg:col-span-3 px-5 text-sm font-bold text-slate-800">
                  Chi tiết phản ánh
                </div>
                <div className="lg:col-span-2 px-5 text-sm font-bold text-slate-800 text-center">
                  Thao tác
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {filteredReports.map((report) => {
                  const isAccepted = report.status === "accepted"
                  const isPending = report.status === "pending"
                  const typeIcon =
                    report.targetType === "Tin phòng"
                      ? "home"
                      : report.targetType === "Bài viết"
                        ? "edit"
                        : "chat"

                  return (
                    <article
                      key={report.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all grid grid-cols-1 lg:grid-cols-12 items-stretch overflow-hidden divide-y divide-slate-200 lg:divide-y-0 lg:divide-x lg:divide-slate-200"
                    >
                      {/* Cột 1 (lg:col-span-4): Lý do vi phạm & Phân loại */}
                      <div className="lg:col-span-4 p-5 flex flex-col justify-center min-w-0">
                        <div className="saas-report-card-badges">
                          <span className="saas-report-type-badge">
                            <Icon name={typeIcon} size={13} />
                            <span>{report.targetType}</span>
                          </span>

                          {isPending ? (
                            <span className="saas-report-status-pill is-pending">
                              <span className="saas-report-status-dot" aria-hidden="true" />
                              <span>Chờ xét duyệt</span>
                            </span>
                          ) : isAccepted ? (
                            <span className="saas-report-status-pill is-accepted">
                              <span aria-hidden="true">✓</span>
                              <span>Đã chấp nhận</span>
                            </span>
                          ) : (
                            <span className="saas-report-status-pill is-rejected">
                              <span aria-hidden="true">✕</span>
                              <span>Từ chối</span>
                            </span>
                          )}
                        </div>

                        <h3 className="saas-report-reason-title" title={report.reason}>
                          {report.reason}
                        </h3>
                      </div>

                      {/* Cột 2 (lg:col-span-3): Nội dung bị báo cáo */}
                      <div className="lg:col-span-3 p-5 flex flex-col justify-center min-w-0">
                        <span className="saas-report-col-label">Đối tượng:</span>
                        <a
                          href={getReportTargetUrl(report)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="saas-report-target-title saas-report-target-link"
                          title={`${report.targetTitle} — Mở xem nội dung gốc trong tab mới`}
                        >
                          <span>{report.targetTitle}</span>
                          <span className="saas-report-target-arrow" aria-hidden="true">
                            ↗
                          </span>
                        </a>
                      </div>

                      {/* Cột 3 (lg:col-span-3): Chi tiết phản ánh */}
                      <div className="lg:col-span-3 p-5 flex flex-col justify-center min-w-0">
                        <span className="saas-report-reporter-line">
                          Người báo cáo: <strong>{report.reporter}</strong>
                        </span>
                        <p
                          className="saas-report-quote-desc"
                          title={report.description || "Không có mô tả chi tiết."}
                        >
                          &ldquo;{report.description || "Không có mô tả chi tiết."}&rdquo;
                        </p>
                      </div>

                      {/* Cột 4 (lg:col-span-2): Thao tác căn giữa hoàn toàn */}
                      <div className="lg:col-span-2 p-5 flex items-center justify-center min-w-0">
                        {isPending ? (
                          <button
                            type="button"
                            className="saas-report-btn-primary"
                            disabled={Boolean(busyId)}
                            onClick={() => openReportModal(report, "accepted")}
                          >
                            Xử lý
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="saas-report-btn-outline"
                            disabled={Boolean(busyId)}
                            onClick={() => openReportModal(report)}
                          >
                            Xem chi tiết
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {filteredReports.length === 0 &&
            connectionState !== "loading" &&
            connectionState !== "error" && (
              <div className="resource-empty resource-empty--reports saas-reports-empty">
                <Icon name="shield" />
                <h3>
                  {reports.length
                    ? "Không tìm thấy báo cáo phù hợp"
                    : emptyTitle.reports}
                </h3>
                <p>
                  {reports.length
                    ? "Thử thay đổi từ khóa, loại nội dung hoặc trạng thái đang lọc."
                    : emptyDescription.reports}
                </p>
              </div>
            )}
        </section>

        {reportDialogNode}
        {confirmDialogNode}
      </main>
    )
  }

  // Giao diện chuyên biệt cho màn hình "Danh mục & Tiện ích" (3-Column Grouped Taxonomy Board)
  if (resource === "categories") {
    const taxonomyColumns: {
      type: CategoryRecord["type"]
      title: string
      addLabel: string
      items: CategoryRecord[]
      icon: "pin" | "home" | "sparkles"
    }[] = [
      {
        type: "Khu vực",
        title: "Khu vực hoạt động",
        addLabel: "+ Thêm khu vực",
        items: groupedCategories.areas,
        icon: "pin",
      },
      {
        type: "Loại phòng",
        title: "Loại hình phòng",
        addLabel: "+ Thêm loại phòng",
        items: groupedCategories.roomTypes,
        icon: "home",
      },
      {
        type: "Tiện ích",
        title: "Tiện ích phòng trọ",
        addLabel: "+ Thêm tiện ích",
        items: groupedCategories.amenities,
        icon: "sparkles",
      },
    ]

    return (
      <main className="admin-resource-page management-page management-admin admin-resource-page--categories saas-taxonomy-page">
        {/* 1. Thanh Công Cụ Đầu Trang (Top Toolbar 1 hàng ngang duy nhất) */}
        <div className="saas-taxonomy-toolbar">
          <div className="saas-taxonomy-toolbar-left">
            <label className="saas-taxonomy-search">
              <Icon name="search" size={16} />
              <input
                type="search"
                aria-label="Tìm trong danh mục và tiện ích"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm trong danh mục & tiện ích..."
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <select
              className="saas-taxonomy-select"
              value={filter}
              onChange={(event) => handleFilterChange(event.target.value)}
              aria-label="Lọc trạng thái danh mục"
            >
              <option value="all">Tất cả trạng thái</option>
              {statusOptions.categories.map((value) => (
                <option value={value} key={value}>
                  {statusText[value]}
                </option>
              ))}
            </select>

            <span className="saas-taxonomy-count">{filteredCategories.length} kết quả</span>
          </div>

          <div className="saas-taxonomy-toolbar-right">
            <button
              type="button"
              className="saas-csv-export-btn"
              onClick={() => downloadCsv("categories-tro-oi.csv", filtered)}
            >
              <Icon name="download" size={16} />
              <span>Tải CSV</span>
            </button>

            <button
              type="button"
              className="saas-primary-emerald-btn"
              onClick={() => openEdit(undefined, "Khu vực")}
            >
              <span>+ Thêm mới</span>
            </button>
          </div>
        </div>

        {actionError && (
          <p className="form-message error" role="alert">
            {actionError}
          </p>
        )}

        {connectionState === "loading" && (
          <p className="management-feedback" role="status">
            Đang tải dữ liệu…
          </p>
        )}
        {connectionState === "error" && (
          <p className="form-message error" role="alert">
            {connectionError || "Không tải được dữ liệu. Hãy tải lại trang để thử lại."}
          </p>
        )}

        {/* 2. Bố Cục Chính: 3 Card Cột Nền Trắng với Header Xám & Thẻ Con Nền Xám */}
        <section
          className="saas-taxonomy-board grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
          aria-busy={Boolean(busyId) || connectionState === "loading"}
        >
          {taxonomyColumns.map((col) => (
            <article
              key={col.type}
              className="bg-white border border-slate-300/90 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden h-full min-w-0"
            >
              {/* Header nền xám định hình cột */}
              <header className="bg-slate-100/95 border-b border-slate-200/90 px-4 py-3.5 flex items-center justify-between gap-2 shrink-0">
                <div className="inline-flex items-center gap-2 min-w-0">
                  <TaxonomyColumnIcon kind={col.icon} className="w-4 h-4 text-slate-700 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 truncate">{col.title}</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs font-bold shadow-2xs leading-none tabular-nums shrink-0">
                  {col.items.length}
                </span>
              </header>

              {/* Thân Card trắng: danh sách thẻ con xám + nút Thêm ở đáy */}
              <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                {col.items.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {col.items.map((item) => {
                      const usageCount = categoryUsageCounts[item.id] ?? 0
                      const isHidden = item.status === "hidden"

                      return (
                        <div
                          key={item.id}
                          className={`group bg-slate-100/85 hover:bg-slate-200/60 border border-slate-200/95 hover:border-slate-300 rounded-xl px-3 2xl:px-3.5 py-2.5 flex items-center justify-between gap-2 transition-all${
                            isHidden ? " opacity-60" : ""
                          }`}
                        >
                          {/* Cụm bên trái: Tên mục + Badge số tin */}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="text-xs font-bold text-slate-900 truncate"
                              title={item.name}
                            >
                              {item.name}
                            </span>
                            {isHidden ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/90 text-[11px] font-semibold shrink-0">
                                <span>Đã ẩn</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold shrink-0 tabular-nums">
                                <span>{usageCount} tin</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </span>
                            )}
                          </div>

                          {/* Cụm bên phải: 3 nút thao tác nền trắng nổi bật */}
                          <fieldset
                            className="flex items-center gap-1 2xl:gap-1.5 shrink-0 m-0 p-0 border-0"
                            disabled={Boolean(busyId)}
                            aria-label={`Thao tác với ${item.name}`}
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2 2xl:px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                              onClick={() => openEdit(item, item.type)}
                            >
                              <PencilIcon />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-2 2xl:px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                              onClick={() => action(item.id, "hidden")}
                            >
                              {isHidden ? "Hiện" : "Ẩn"}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-2 2xl:px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                              onClick={() => requestDeleteCategory(item)}
                            >
                              Xóa
                            </button>
                          </fieldset>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-10 px-4 text-center text-xs font-medium text-slate-400 m-0">
                    Không có mục nào khớp
                  </p>
                )}

                {/* Duy nhất 1 nút hành động ở đáy cột */}
                <div className="mt-4 shrink-0">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50/90 hover:bg-emerald-50/70 border border-dashed border-slate-300 hover:border-emerald-300 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
                    onClick={() => openEdit(undefined, col.type)}
                  >
                    {col.addLabel}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {editDialogNode}
        {confirmDialogNode}
      </main>
    )
  }

  // Giao diện chuyên biệt cho màn hình "Tin cho thuê" (Master-Detail Split View + Rich Horizontal Cards)
  if (resource === "listings") {
    const statusTabs = [
      { id: "all", label: "Tổng tin đăng", count: listingTabCounts.total },
      { id: "active", label: "Đang hoạt động", count: listingTabCounts.active },
      { id: "pending", label: "Chờ xét duyệt", count: listingTabCounts.pending },
      { id: "hidden", label: "Đã ẩn / Gỡ", count: listingTabCounts.hiddenOrRemoved },
    ]

    return (
      <main className="admin-resource-page management-page management-admin admin-resource-page--listings saas-listings-page">
        {/* 1.A. Hàng đầu tiên: Dãy 4 Tab Trạng Thái (Bên trái) + Nút Tải CSV (Bên phải) */}
        <div className="saas-listings-top-row">
          <div
            className="saas-listings-status-tabs"
            role="tablist"
            aria-label="Phân loại trạng thái tin cho thuê"
          >
            {statusTabs.map((tab) => {
              const isTabActive = filter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isTabActive}
                  className={`saas-status-tab${isTabActive ? " is-active" : ""}`}
                  onClick={() => handleFilterChange(tab.id)}
                >
                  <span className={`saas-status-tab-dot${isTabActive ? " is-active" : ""}`} />
                  <span className="saas-status-tab-label">{tab.label}</span>
                  <span className="saas-status-tab-count">{tab.count}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="saas-csv-export-btn"
            onClick={() => downloadCsv("listings-tro-oi.csv", filtered)}
          >
            <Icon name="download" size={16} />
            <span>Tải CSV</span>
          </button>
        </div>

        {/* 1.C. Thanh Tìm Kiếm & 3 Bộ Lọc Dropdown */}
        <div className="saas-listings-filter-bar">
          <label className="saas-listings-search">
            <Icon name="search" size={16} />
            <input
              type="search"
              aria-label="Tìm trong tin cho thuê"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm trong tin cho thuê"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <select
            className="saas-listings-select"
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            aria-label="Lọc trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions.listings.map((value) => (
              <option value={value} key={value}>
                {statusText[value]}
              </option>
            ))}
          </select>

          <select
            className="saas-listings-select"
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value as ListingAreaFilter)}
            aria-label="Lọc khu vực"
          >
            <option value="all">Khu vực: Toàn quốc</option>
            <option value="hcm">Khu vực: TP. Hồ Chí Minh</option>
            <option value="dn">Khu vực: Đà Nẵng</option>
            <option value="hn">Khu vực: Hà Nội</option>
          </select>

          <select
            className="saas-listings-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as ListingSortOption)}
            aria-label="Sắp xếp tin cho thuê"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="price_asc">Sắp xếp: Giá tăng dần</option>
            <option value="price_desc">Sắp xếp: Giá giảm dần</option>
          </select>
        </div>

        {actionError && (
          <p className="form-message error" role="alert">
            {actionError}
          </p>
        )}

        {connectionState === "loading" && (
          <p className="management-feedback" role="status">
            Đang tải dữ liệu…
          </p>
        )}
        {connectionState === "error" && (
          <p className="form-message error" role="alert">
            {connectionError || "Không tải được dữ liệu. Hãy tải lại trang để thử lại."}
          </p>
        )}

        {/* 2. Bố Cục Chính 2 Cột (Master-Detail Split View) */}
        <section
          className={`saas-listings-split-view${!isInspectorOpen || !selectedListing ? " is-full" : ""}`}
          aria-busy={Boolean(busyId) || connectionState === "loading"}
        >
          {/* Cột Trái (xl:col-span-8): Danh sách Thẻ Ngang Tinh Gọn + Thanh Phân Trang */}
          <div className="saas-listings-master">
            {paginatedListings.map((item) => {
              const isSelected = isInspectorOpen && selectedListing?.id === item.id
              const priceFormatted = formatListingPrice(item)
              const typeLabel = item.type?.trim() || "Phòng trọ"

              return (
                <article
                  key={item.id}
                  className={`saas-listing-hcard${isSelected ? " is-selected" : ""}`}
                  onClick={() => {
                    setSelectedListingId(item.id)
                    setIsInspectorOpen(true)
                  }}
                >
                  {/* 1. Ảnh Thumbnail phòng trọ (w-32 h-24 / 128x96px) */}
                  <img
                    className="saas-listing-hcard-thumb"
                    src={item.image || ROOM_FALLBACK_SVG}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = ROOM_FALLBACK_SVG
                    }}
                  />

                  {/* 2. Thông tin chính & Dãy Chip thông số đơn sắc */}
                  <div className="saas-listing-hcard-body">
                    {/* Hàng 1: Badges phân loại & trạng thái */}
                    <div className="saas-listing-hcard-badges">
                      <span className="saas-badge-neutral">{typeLabel}</span>
                      <span
                        className={
                          item.status === "active"
                            ? "saas-badge-emerald"
                            : "saas-badge-neutral-bordered"
                        }
                      >
                        {statusText[item.status] ?? item.status}
                      </span>
                    </div>

                    {/* Hàng 2: Tiêu đề phòng */}
                    <h3 className="saas-listing-hcard-title" title={item.title}>
                      {item.title}
                    </h3>

                    {/* Hàng 3: Địa chỉ */}
                    <p className="saas-listing-hcard-address" title={item.location}>
                      {item.location}
                    </p>

                    {/* Hàng 4: Dãy thông số kỹ thuật (Đồng nhất 1 tông màu trung tính, khung rõ nét) */}
                    <div className="saas-listing-hcard-specs">
                      <span className="saas-spec-price">{priceFormatted}</span>
                      <span className="saas-spec-chip">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 20h16M4 20V4m0 16L20 4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{item.area || "28 m²"}</span>
                      </span>
                      <span className="saas-spec-chip">
                        <Icon name="user" size={13} />
                        <span>Chủ trọ: {item.ownerName}</span>
                      </span>
                      <span className="saas-spec-chip">
                        <Icon name="eye" size={13} />
                        <span>{(item.views ?? 0).toLocaleString("vi-VN")} lượt xem</span>
                      </span>
                    </div>
                  </div>

                  {/* 3. Cụm Nút Thao Tác Tối Giản (Chỉ giữ 2 nút hành động chính: Ẩn/Duyệt tin & Gỡ tin) */}
                  <fieldset
                    className="saas-listing-hcard-actions"
                    disabled={Boolean(busyId)}
                    aria-label={`Thao tác với ${item.title}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.status === "active" ? (
                      <button
                        type="button"
                        className="saas-btn-outline"
                        onClick={() => action(item.id, "hidden")}
                      >
                        Ẩn tin
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="saas-btn-outline"
                        onClick={() => action(item.id, "active")}
                      >
                        {item.status === "pending" ? "Duyệt tin" : "Hiện tin"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="saas-btn-outline-danger"
                      onClick={() => requestDeleteListing(item)}
                    >
                      Gỡ tin
                    </button>
                  </fieldset>
                </article>
              )
            })}

            {!filteredListings.length &&
              connectionState !== "loading" &&
              connectionState !== "error" && (
                <div className="resource-empty resource-empty--listings saas-listings-empty">
                  <Icon name="building" />
                  <h3>
                    {listings.length
                      ? "Không tìm thấy kết quả phù hợp"
                      : emptyTitle.listings}
                  </h3>
                  <p>
                    {listings.length
                      ? "Thử thay đổi từ khóa hoặc trạng thái đang lọc."
                      : emptyDescription.listings}
                  </p>
                </div>
              )}

            {/* Thanh điều khiển Phân trang (Pagination Bar) */}
            {totalFilteredListings > 0 && (
              <nav className="saas-pagination-bar" aria-label="Phân trang danh sách tin cho thuê">
                <span className="saas-pagination-info">
                  Hiển thị <b>{listingStartIndex}–{listingEndIndex}</b> trong tổng số{" "}
                  <b>{totalFilteredListings}</b> tin cho thuê
                </span>

                <div className="saas-pagination-controls">
                  <button
                    type="button"
                    className="saas-page-nav-btn"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: totalListingPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      aria-current={pageNum === safeCurrentPage ? "page" : undefined}
                      className={`saas-page-num-btn${pageNum === safeCurrentPage ? " is-active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="saas-page-nav-btn"
                    disabled={safeCurrentPage >= totalListingPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalListingPages, prev + 1))
                    }
                  >
                    Sau ›
                  </button>
                </div>
              </nav>
            )}
          </div>

          {/* Cột Phải (xl:col-span-4): Ngăn "Chi tiết tin đăng" (Sticky Inspection Panel) */}
          {isInspectorOpen && selectedListing && (
            <aside
              className="saas-listings-inspector"
              aria-label="Chi tiết tin đăng"
            >
              <div className="saas-inspector-header">
                <h2>Chi tiết tin đăng</h2>
                <button
                  type="button"
                  className="saas-inspector-close"
                  onClick={() => setIsInspectorOpen(false)}
                  aria-label="Đóng ngăn chi tiết"
                >
                  ✕
                </button>
              </div>

              {/* Bộ ảnh Gallery Carousel có nút mũi tên & chấm tròn điều hướng */}
              <div className="saas-inspector-gallery">
                <div className="saas-inspector-photo-stage">
                  <img
                    className="saas-inspector-photo"
                    src={
                      selectedGalleryPhotos[
                        Math.min(activePhotoIndex, selectedGalleryPhotos.length - 1)
                      ] || ROOM_FALLBACK_SVG
                    }
                    alt={`${selectedListing.title} - Ảnh ${activePhotoIndex + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = ROOM_FALLBACK_SVG
                    }}
                  />

                  {selectedGalleryPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="saas-gallery-arrow is-prev"
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev <= 0 ? selectedGalleryPhotos.length - 1 : prev - 1,
                          )
                        }
                        aria-label="Ảnh trước"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="saas-gallery-arrow is-next"
                        onClick={() =>
                          setActivePhotoIndex((prev) =>
                            prev >= selectedGalleryPhotos.length - 1 ? 0 : prev + 1,
                          )
                        }
                        aria-label="Ảnh tiếp theo"
                      >
                        ›
                      </button>
                      <span className="saas-gallery-counter">
                        {Math.min(activePhotoIndex + 1, selectedGalleryPhotos.length)} /{" "}
                        {selectedGalleryPhotos.length}
                      </span>
                    </>
                  )}
                </div>

                {selectedGalleryPhotos.length > 1 && (
                  <div
                    className="saas-gallery-dots"
                    role="tablist"
                    aria-label="Chọn ảnh trong bộ sưu tập"
                  >
                    {selectedGalleryPhotos.map((photoUrl, idx) => (
                      <button
                        key={`${photoUrl}-${idx}`}
                        type="button"
                        role="tab"
                        aria-selected={idx === activePhotoIndex}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        className={`saas-gallery-dot${idx === activePhotoIndex ? " is-active" : ""}`}
                        onClick={() => setActivePhotoIndex(idx)}
                      />
                    ))}
                  </div>
                )}
              </div>

              <h3 className="saas-inspector-title">{selectedListing.title}</h3>

              <div className="saas-inspector-summary">
                <span className="saas-inspector-price">
                  {formatListingPrice(selectedListing)}
                </span>
                <span className="saas-inspector-dot">·</span>
                <span className="saas-inspector-area">{selectedListing.area || "28 m²"}</span>
                <span
                  className={
                    selectedListing.status === "active"
                      ? "saas-badge-emerald"
                      : "saas-badge-neutral-bordered"
                  }
                >
                  {statusText[selectedListing.status] ?? selectedListing.status}
                </span>
              </div>

              {selectedListing.description && (
                <p className="saas-inspector-desc">{selectedListing.description}</p>
              )}

              <div className="saas-inspector-info-box">
                <div className="saas-inspector-info-row">
                  <Icon name="pin" size={14} />
                  <span>{selectedListing.location}</span>
                </div>
                <div className="saas-inspector-info-row">
                  <Icon name="user" size={14} />
                  <span>
                    Chủ trọ: <b>{selectedListing.ownerName}</b>
                    {selectedOwnerPhone ? ` — ${selectedOwnerPhone}` : ""}
                  </span>
                </div>
                {selectedListing.deposit && (
                  <div className="saas-inspector-info-row">
                    <Icon name="shield-check" size={14} />
                    <span>Đặt cọc: {selectedListing.deposit}</span>
                  </div>
                )}
              </div>

              {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                <div className="saas-inspector-amenities">
                  <h4>Tiện ích phòng</h4>
                  <div className="saas-inspector-amenity-tags">
                    {selectedListing.amenities.map((amenity) => (
                      <span key={amenity} className="saas-amenity-tag">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </section>

        {confirmDialogNode}
      </main>
    )
  }

  // Giao diện chuyên biệt cho màn hình "Quản lý Thành viên" (/admin/nguoi-dung)
  if (resource === "users") {
    return (
      <main className="admin-resource-page management-page management-admin admin-resource-page--users saas-users-page p-6 space-y-4 bg-slate-50 min-h-screen">
        {actionError && (
          <div
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {/* 1. Hàng điều khiển đầu tiên (Top Action & Role Tabs Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Cụm trái (4 Tab Pill Vai trò độc lập) */}
          <div
            className="flex flex-wrap items-center gap-2.5"
            role="tablist"
            aria-label="Lọc theo vai trò"
          >
            {(
              [
                { id: "all", label: "Tất cả", count: userCounts.total },
                { id: "landlord", label: "Chủ trọ", count: userCounts.landlord },
                { id: "tenant", label: "Người thuê", count: userCounts.tenant },
                { id: "admin", label: "Quản trị viên", count: userCounts.admin },
              ] as const
            ).map((tab) => {
              const isActive = userRoleFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setUserRoleFilter(tab.id)}
                  className={`h-10 px-4 rounded-xl text-sm inline-flex items-center gap-2 transition-all box-border border cursor-pointer whitespace-nowrap shadow-2xs ${
                    isActive
                      ? "bg-white border-emerald-600 ring-1 ring-emerald-600 text-slate-900 font-bold"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-medium"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-xs font-semibold leading-none tabular-nums ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Cụm phải (Summary Pills + Action Buttons) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-2xs">
              Hoạt động: <strong className="text-slate-900 font-semibold">{userCounts.active}</strong>
            </div>
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-2xs">
              Đã khóa: <strong className="text-rose-600 font-semibold">{userCounts.locked}</strong>
            </div>

            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "thanh-vien-tro-oi.csv",
                  filteredUsers.map((u) => ({
                    id: u.id,
                    title: u.name,
                    detail: u.email,
                    status: statusText[u.status] || u.status,
                    meta: `${u.role === "landlord" ? "Chủ trọ" : u.role === "admin" ? "Quản trị viên" : "Người thuê"} · ${u.phone}`,
                  })),
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-slate-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5M12 15V3" />
              </svg>
              <span>Tải CSV</span>
            </button>

            <button
              type="button"
              onClick={() => openEdit()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Thêm thành viên</span>
            </button>
          </div>
        </div>

        {/* 2. Hàng thứ hai: Thanh Tìm kiếm & Bộ lọc (Search & Filter Bar) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="flex-1 min-w-[260px] relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="text"
              aria-label="Tìm theo tên, email, số điện thoại..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>

          {/* Dropdown trạng thái */}
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            aria-label="Lọc trạng thái người dùng"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:border-emerald-600 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>

          {/* Dropdown sắp xếp */}
          <select
            value={userSortBy}
            onChange={(e) => setUserSortBy(e.target.value as "newest" | "name_asc")}
            aria-label="Sắp xếp người dùng"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:border-emerald-600 focus:outline-none cursor-pointer"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="name_asc">Sắp xếp: Tên A-Z</option>
          </select>
        </div>

        {/* 3. Bảng Danh sách Thành viên — Lưới 12 Cột (5 Cột lớn đồng đều thị giác) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1300px]">
              {/* Header của bảng */}
              <div className="grid grid-cols-12 divide-x divide-slate-200 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <div className="col-span-3 px-4 py-3.5 flex items-center justify-center text-center">
                  Thành viên
                </div>
                <div className="col-span-2 px-4 py-3.5 flex items-center justify-center text-center">
                  Thông tin liên hệ
                </div>
                <div className="col-span-4 px-4 py-3.5 flex items-center justify-center text-center">
                  Lịch sử hoạt động
                </div>
                <div className="col-span-1 px-4 py-3.5 flex items-center justify-center text-center">
                  Ngày tham gia
                </div>
                <div className="col-span-2 px-4 py-3.5 flex items-center justify-center text-center">
                  Thao tác
                </div>
              </div>

              {/* Danh sách các dòng dữ liệu */}
              {paginatedUsers.length > 0 && (
                <div>
                  {paginatedUsers.map((user) => {
                    const userListings = listings.filter(
                      (l) =>
                        l.ownerId === user.id ||
                        l.ownerName?.toLowerCase() === user.name.toLowerCase(),
                    )
                    const userListingCount = userListings.length

                    const userPosts = posts.filter(
                      (p) =>
                        p.authorId === user.id ||
                        p.name?.toLowerCase() === user.name.toLowerCase(),
                    )
                    const userPostCount = userPosts.length

                    const reportsAgainstUser = reports.filter((r) => {
                      if (r.targetType === "Tin phòng") {
                        return userListings.some(
                          (l) =>
                            l.id === r.targetId ||
                            l.title.trim().toLowerCase() ===
                              r.targetTitle.trim().toLowerCase(),
                        )
                      }
                      if (r.targetType === "Bài viết") {
                        return userPosts.some(
                          (p) =>
                            p.id === r.targetId ||
                            parsePostContent(p.content).title.trim().toLowerCase() ===
                              r.targetTitle.trim().toLowerCase(),
                        )
                      }
                      if (r.targetType === "Bình luận") {
                        return posts.some((p) =>
                          (p.comments ?? []).some(
                            (c) =>
                              c.id === r.targetId &&
                              (c.authorId === user.id ||
                                c.author?.toLowerCase() === user.name.toLowerCase()),
                          ),
                        )
                      }
                      return false
                    })
                    const acceptedViolations = reportsAgainstUser.filter(
                      (r) => r.status === "accepted",
                    ).length

                    const submittedReports = reports.filter(
                      (r) =>
                        r.reporterId === user.id ||
                        r.reporter?.toLowerCase() === user.name.toLowerCase(),
                    )
                    const submittedReportsCount = submittedReports.length
                    const acceptedSubmittedReportsCount = submittedReports.filter(
                      (r) => r.status === "accepted",
                    ).length

                    const joinDate = user.createdAt ? new Date(user.createdAt) : null
                    const hasValidJoinDate = Boolean(
                      joinDate && !Number.isNaN(joinDate.getTime()),
                    )
                    const joinDateFormatted =
                      hasValidJoinDate && joinDate
                        ? `${String(joinDate.getDate()).padStart(2, "0")}/${String(joinDate.getMonth() + 1).padStart(2, "0")}/${joinDate.getFullYear()}`
                        : "Chưa rõ"

                    const activityText =
                      user.role === "admin"
                        ? "Toàn quyền"
                        : user.role === "landlord"
                          ? `${userListingCount} tin đăng`
                          : `${userPostCount} bài viết`

                    const roleLabel =
                      user.role === "admin"
                        ? "Quản trị viên"
                        : user.role === "landlord"
                          ? "Chủ trọ"
                          : "Người thuê"

                    return (
                      <div
                        key={user.id}
                        className="grid grid-cols-12 divide-x divide-slate-200 items-stretch hover:bg-slate-50/60 transition-colors border-b border-slate-200 last:border-b-0"
                      >
                        {/* Cột 1: Thành viên (Chia đôi 50/50 — Avatar + Tên | Badge Vai trò cố định w-[120px]) */}
                        <div className="col-span-3 grid grid-cols-2 divide-x divide-slate-200 items-center w-full h-full">
                          <div className="px-3.5 py-3 flex items-center gap-3 min-w-0 h-full">
                            <img
                              src={getMemberAvatarUrl(user)}
                              alt={user.name}
                              onError={(e) => {
                                e.currentTarget.src = "/images/avatars/default-avatar.jpg"
                              }}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                            />
                            <div
                              className="text-sm font-bold text-slate-900 truncate"
                              title={user.name}
                            >
                              {user.name}
                            </div>
                          </div>

                          <div className="px-3 py-3 flex items-center justify-center h-full">
                            <div className="inline-flex items-center justify-center gap-1.5 w-[120px] py-1 rounded-full bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs whitespace-nowrap">
                              {user.role === "admin" ? (
                                <svg
                                  className="w-3.5 h-3.5 text-slate-500 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                >
                                  <rect width="20" height="14" x="2" y="7" rx="2" />
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                              ) : user.role === "landlord" ? (
                                <svg
                                  className="w-3.5 h-3.5 text-slate-500 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                >
                                  <path d="m3 11 9-8 9 8" />
                                  <path d="M5 10v11h14V10M9 21v-7h6v7" />
                                </svg>
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5 text-slate-500 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                >
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              )}
                              <span>{roleLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* Cột 2: Thông tin liên hệ */}
                        <div className="col-span-2 px-4 py-3 flex flex-col justify-center gap-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-800 truncate">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.75"
                            >
                              <rect width="20" height="16" x="2" y="4" rx="2" />
                              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <span className="truncate" title={user.email}>
                              {user.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 truncate">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.75"
                            >
                              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .6 3 .7a2 2 0 0 1 1.6 1.9Z" />
                            </svg>
                            <span className="truncate">
                              {user.phone || "Chưa cập nhật"}
                            </span>
                          </div>
                        </div>

                        {/* Cột 3: Lịch sử hoạt động (chia 3 rãnh đều nhau — đồng bộ 100% Pill w-[112px]) */}
                        <div className="col-span-4 grid grid-cols-3 divide-x divide-slate-200 items-center w-full h-full">
                          {/* Rãnh con 1: Hoạt động */}
                          <div className="px-2 py-3 flex items-center justify-center h-full">
                            <span className="inline-flex items-center justify-center w-[112px] py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {activityText}
                            </span>
                          </div>

                          {/* Rãnh con 2: Vi phạm */}
                          <div className="px-2 py-3 flex items-center justify-center h-full">
                            {acceptedViolations > 0 ? (
                              <span className="inline-flex items-center justify-center w-[112px] py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-600 whitespace-nowrap">
                                {acceptedViolations} vi phạm
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-[112px] py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap">
                                0 vi phạm
                              </span>
                            )}
                          </div>

                          {/* Rãnh con 3: Báo cáo */}
                          <div className="px-2 py-3 flex items-center justify-center h-full">
                            <span
                              className="inline-flex items-center justify-center w-[112px] py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap"
                              title={
                                submittedReportsCount > 0
                                  ? `Đã gửi ${submittedReportsCount} báo cáo${acceptedSubmittedReportsCount > 0 ? ` (${acceptedSubmittedReportsCount} được chấp nhận)` : ""}`
                                  : "Chưa gửi báo cáo nào"
                              }
                            >
                              {submittedReportsCount} báo cáo
                            </span>
                          </div>
                        </div>

                        {/* Cột 4: Ngày tham gia */}
                        <div className="col-span-1 px-3 py-3 flex items-center justify-center text-center">
                          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                            {joinDateFormatted}
                          </span>
                        </div>

                        {/* Cột 5: Thao tác */}
                        <div className="col-span-2 px-2.5 py-3 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                            onClick={() => openEdit(user)}
                          >
                            <svg
                              className="w-3 h-3 text-slate-500 shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.75"
                            >
                              <path d="m15 5 4 4" />
                              <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                            </svg>
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={user.status === "active"}
                            aria-label={
                              user.status === "locked"
                                ? `Mở khóa tài khoản ${user.name}`
                                : `Khóa tài khoản ${user.name}`
                            }
                            title={
                              user.status === "locked"
                                ? "Đã khóa — Nhấn để mở khóa tài khoản"
                                : "Đang hoạt động — Nhấn để khóa tài khoản"
                            }
                            onClick={() => action(user.id, user.status)}
                            className={
                              user.status === "active"
                                ? "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                                : "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200/70 text-slate-500 border border-slate-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={`w-5 h-3 rounded-full p-0.5 flex items-center shrink-0 transition-colors ${
                                user.status === "active"
                                  ? "bg-emerald-600 justify-end"
                                  : "bg-slate-400 justify-start"
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-white shadow-2xs" />
                            </span>
                            <span>
                              {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center px-1.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                            onClick={() => remove(user.id, user.name)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {paginatedUsers.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.8M16 3.2a4 4 0 0 1 0 7.6" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Không tìm thấy thành viên nào
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò/trạng thái.
              </p>
            </div>
          )}

          {/* 4. Thanh Phân trang ở đáy bảng (Pagination Bar) */}
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-center">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeCurrentUserPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={
                    safeCurrentUserPage === pageNum
                      ? "bg-emerald-600 text-white border border-emerald-600 rounded-md px-2.5 py-1 text-xs font-semibold shadow-2xs cursor-pointer"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
                  }
                >
                  {pageNum}
                </button>
              ))}
              <button
                type="button"
                disabled={safeCurrentUserPage >= totalUserPages}
                onClick={() => setCurrentPage((p) => Math.min(totalUserPages, p + 1))}
                className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        {editDialogNode}
        {confirmDialogNode}
      </main>
    )
  }

  // Giao diện chuyên biệt cho màn hình "Cộng đồng" (/admin/dien-dan) - Bố cục 3 Khối Thẻ Lớn Full-Viewport
  if (resource === "forum") {
    const forumTabs: Array<{
      id: "all" | "active" | "hidden" | "with_comments"
      label: string
      count: number
    }> = [
      { id: "all", label: "Tất cả bài viết", count: forumTabCounts.all },
      { id: "active", label: "Đang hoạt động", count: forumTabCounts.active },
      { id: "hidden", label: "Đã ẩn", count: forumTabCounts.hidden },
      { id: "with_comments", label: "Có bình luận mới", count: forumTabCounts.withComments },
    ]

    return (
      <main className="admin-resource-page management-page management-admin admin-resource-page--forum saas-forum-page space-y-4">
        {actionError && (
          <div
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {/* 1. Thanh công cụ tích hợp trên Hàng đầu tiên (Đồng bộ lưới 12 cột với 2 khối thẻ bên dưới) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Bên trái (lg:col-span-7): 4 Nút Pill Độc Lập đồng đều kích thước */}
          <div
            className="lg:col-span-7 min-w-0 flex flex-wrap min-[1440px]:grid min-[1440px]:grid-cols-4 items-center gap-2"
            role="tablist"
            aria-label="Lọc trạng thái bài viết"
          >
            {forumTabs.map((tab) => {
              const isTabActive = forumStatusTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isTabActive}
                  onClick={() => setForumStatusTab(tab.id)}
                  className={
                    isTabActive
                      ? "h-9 flex-auto min-w-fit min-[1440px]:min-w-0 bg-white border-2 border-emerald-600 text-slate-900 font-bold px-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                      : "h-9 flex-auto min-w-fit min-[1440px]:min-w-0 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium px-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isTabActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                  <span
                    className={
                      isTabActive
                        ? "bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums"
                        : "bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums"
                    }
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bên phải (lg:col-span-5): Search giãn ngang thẳng mép Thẻ Thông tin chi tiết + Filter + Export */}
          <div className="lg:col-span-5 min-w-0 flex flex-wrap lg:flex-nowrap items-center gap-2.5">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1 min-w-[160px] lg:min-w-0">
              <svg
                className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="text"
                aria-label="Tìm kiếm tiêu đề, tác giả, nội dung..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm tiêu đề, tác giả, nội dung..."
                className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Dropdown lọc danh mục */}
            <select
              value={forumCategoryFilter}
              onChange={(e) => setForumCategoryFilter(e.target.value)}
              aria-label="Lọc theo danh mục"
              className="shrink-0 h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {forumCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Nút Tải CSV */}
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  "cong-dong-tro-oi.csv",
                  filteredForumPosts.map((p) => {
                    const { title, category } = parsePostContent(p.content)
                    return {
                      id: p.id,
                      title,
                      detail: `${p.name} · ${category}`,
                      status:
                        p.status === "active"
                          ? "Đang hoạt động"
                          : p.status === "hidden"
                            ? "Đã ẩn"
                            : p.status,
                      meta: `${p.likes ?? 0} lượt thích · ${p.comments?.length ?? p.commentsCount ?? 0} bình luận`,
                    }
                  })
                )
              }
              className="shrink-0 h-9 inline-flex items-center gap-1.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium shadow-2xs cursor-pointer transition-colors"
            >
              <svg
                className="w-4 h-4 text-white shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5M12 15V3" />
              </svg>
              <span>Tải CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Bố cục lưới 2 Cột Full-Viewport: 1 Thẻ Lớn bên trái + 2 Thẻ xếp dọc bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:h-[calc(100vh-165px)] lg:min-h-[680px]">
          {/* CỘT TRÁI (lg:col-span-7 h-full): 1 Thẻ Trắng Lớn "Danh sách bài đăng" */}
          <div className="lg:col-span-7 lg:h-full min-w-0">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs h-full flex flex-col justify-between overflow-hidden">
              {/* Header của Thẻ Lớn */}
              <div className="shrink-0 pb-3.5 mb-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">Danh sách bài đăng</h2>
              </div>

              {/* Danh sách các Thẻ Bài Đăng Con ở giữa */}
              {filteredForumPosts.length === 0 ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center">
                  <Icon name="chat" size={32} />
                  <h3 className="text-sm font-bold text-slate-800 mt-2">
                    Không tìm thấy bài viết phù hợp
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thử thay đổi từ khóa tìm kiếm hoặc chọn tab lọc khác.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 grid grid-rows-[repeat(6,minmax(86px,1fr))] gap-2.5 overflow-y-auto py-0.5 pl-0.5 pr-1 scrollbar-thin">
                  {pagedForumPosts.map((post) => {
                    const {
                      title: postTitle,
                      compactTitle,
                      category: postCategory,
                    } = parsePostContent(post.content)
                    const isSelected = selectedPost?.id === post.id
                    const likesCount = post.likes ?? 0
                    const commentsCount =
                      post.comments?.length ?? post.commentsCount ?? 0
                    const postAvatarUrl = resolveMemberAvatar(
                      post.authorId,
                      post.name,
                      post.avatarUrl,
                    )
                    const postDateLabel = formatForumPostDate(post.createdAt, post.time)
                    const thumbUrl = post.image?.trim()
                    const hasValidThumb = Boolean(thumbUrl && !failedThumbUrls[thumbUrl])

                    return (
                      <article
                        key={post.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPostId(post.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSelectedPostId(post.id)
                          }
                        }}
                        className={`min-h-[86px] h-full rounded-xl border px-3.5 py-2.5 flex items-center gap-3.5 cursor-pointer transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/15 ring-1 ring-emerald-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Bên trái: Ảnh Thumbnail Vuông 56×56px (hoặc Placeholder icon) */}
                        {hasValidThumb && thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={compactTitle}
                            loading="lazy"
                            onError={() => markThumbFailed(thumbUrl)}
                            className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0"
                            aria-hidden="true"
                          >
                            {thumbUrl ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
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
                            )}
                          </div>
                        )}

                        {/* Bên phải: Tác giả, Tiêu đề 1 dòng & Chỉ số tương tác */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[62px] gap-1">
                          {/* Dòng 1: Meta & Trạng thái */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                              {postAvatarUrl ? (
                                <img
                                  src={postAvatarUrl}
                                  alt={post.name}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = "/images/avatars/default-avatar.jpg"
                                  }}
                                  className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-100"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                                  {post.initials || getUserDisplayInitials(post.name, "TV")}
                                </div>
                              )}
                              <span className="font-semibold text-slate-700 truncate">
                                {post.name}
                              </span>
                              <span className="text-slate-400 shrink-0" aria-hidden="true">
                                ·
                              </span>
                              <span className="shrink-0 whitespace-nowrap tabular-nums">
                                {postDateLabel}
                              </span>
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 whitespace-nowrap">
                                {postCategory}
                              </span>
                            </div>
                            <div className="shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
                                  post.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500 border border-slate-200"
                                }`}
                              >
                                {post.status === "active"
                                  ? "Đang hoạt động"
                                  : post.status === "pending"
                                    ? "Chờ duyệt"
                                    : "Đã ẩn"}
                              </span>
                            </div>
                          </div>

                          {/* Dòng 2: Tiêu đề bài viết khóa cứng 1 dòng */}
                          <h3
                            className="text-sm font-bold text-slate-900 leading-5 truncate block w-full shrink-0"
                            title={postTitle}
                          >
                            {compactTitle}
                          </h3>

                          {/* Dòng 3: Chỉ số tương tác góc phải */}
                          <div className="flex items-center justify-end gap-3 text-xs text-slate-500">
                            <span
                              className="inline-flex items-center gap-1"
                              title={`${commentsCount} bình luận`}
                            >
                              <svg
                                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span className="tabular-nums">{commentsCount}</span>
                            </span>
                            <span
                              className="inline-flex items-center gap-1"
                              title={`${likesCount} lượt thích`}
                            >
                              <svg
                                className="w-3.5 h-3.5 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                              </svg>
                              <span className="tabular-nums">{likesCount}</span>
                            </span>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {/* Footer Phân Trang bên trong đáy Thẻ Lớn */}
              {filteredForumPosts.length > 0 && (
                <div className="shrink-0 pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Trang {safeCommunityPage} / {totalCommunityPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalCommunityPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCommunityPage(page)}
                        className={`w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                          page === safeCommunityPage
                            ? "border-slate-800 text-slate-900 bg-white shadow-2xs"
                            : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* CỘT PHẢI (lg:col-span-5 h-full flex flex-col gap-5 overflow-hidden): 2 Thẻ Thông Tin Chi Tiết & Bình Luận */}
          <div className="lg:col-span-5 lg:h-full flex flex-col gap-5 overflow-hidden min-w-0">
            {selectedPost ? (
              <>
                {/* Thẻ Trên: "Thông tin chi tiết" */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex-[3] min-h-0 flex flex-col overflow-hidden">
                  {/* Header của Thẻ */}
                  <div className="shrink-0 pb-3 mb-3 border-b border-slate-100 flex items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900">Thông tin chi tiết</h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === selectedPost.id}
                        onClick={() =>
                          action(
                            selectedPost.id,
                            selectedPost.status === "active" ? "hidden" : "active",
                          )
                        }
                        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {selectedPost.status === "hidden" ? "Hiện bài" : "Ẩn bài"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === selectedPost.id}
                        onClick={() => remove(selectedPost.id, selectedPostParsed.title)}
                        className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        Xóa bài
                      </button>
                    </div>
                  </div>

                  {/* Thông tin tác giả & Tiêu đề */}
                  <div className="shrink-0 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {(() => {
                        const selectedAvatarUrl = resolveMemberAvatar(
                          selectedPost.authorId,
                          selectedPost.name,
                          selectedPost.avatarUrl,
                        )
                        return selectedAvatarUrl ? (
                          <img
                            src={selectedAvatarUrl}
                            alt={selectedPost.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = "/images/avatars/default-avatar.jpg"
                            }}
                            className="w-9 h-9 rounded-full object-cover shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {selectedPost.initials ||
                              getUserDisplayInitials(selectedPost.name, "TV")}
                          </div>
                        )
                      })()}
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 leading-tight truncate">
                          {selectedPost.name}
                        </div>
                        <span
                          className={`inline-block mt-1 rounded-full px-2 py-0.5 leading-none text-[11px] font-medium ${
                            selectedPost.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {selectedPost.status === "active"
                            ? "Đang hoạt động"
                            : selectedPost.status === "pending"
                              ? "Chờ duyệt"
                              : "Đã ẩn"}
                        </span>
                      </div>
                    </div>

                    {selectedPostParsed.bodyContent !== selectedPostParsed.title && (
                      <h3 className="text-base font-bold text-slate-900 mt-2.5 leading-snug">
                        {selectedPostParsed.title}
                      </h3>
                    )}
                  </div>

                  {/* Nội dung bài viết & Hình ảnh trải rộng 100% chiều ngang trên nền trắng */}
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedPostParsed.bodyContent}
                    </p>
                    {(() => {
                      const selectedThumbUrl = selectedPost.image?.trim()
                      const hasDetailImage = Boolean(
                        selectedThumbUrl && !failedThumbUrls[selectedThumbUrl],
                      )
                      if (!hasDetailImage || !selectedThumbUrl) return null
                      return (
                        <img
                          src={selectedThumbUrl}
                          alt={selectedPostParsed.title}
                          onError={() => markThumbFailed(selectedThumbUrl)}
                          className="w-full max-h-[210px] rounded-xl object-cover border border-slate-100 bg-slate-100"
                        />
                      )
                    })()}
                  </div>

                  {/* Footer tương tác */}
                  <div className="shrink-0 pt-2.5 mt-2 border-t border-slate-100 text-xs font-medium text-slate-500">
                    {selectedPost.likes ?? 0} lượt thích ·{" "}
                    {selectedPost.comments?.length ?? selectedPost.commentsCount ?? 0} bình luận
                  </div>
                </section>

                {/* Thẻ Dưới: "Bình luận ({count})" */}
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex-[2] min-h-[210px] flex flex-col overflow-hidden">
                  <div className="shrink-0 pb-3 mb-3 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">
                      Bình luận ({selectedPost.comments?.length ?? 0})
                    </h2>
                  </div>

                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <div className="flex-1 min-h-0 flex items-center justify-center text-xs text-slate-400 italic">
                      Chưa có bình luận nào cho bài viết này.
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                      {selectedPost.comments.map((comment) => {
                        const commentAvatarUrl = resolveMemberAvatar(
                          comment.authorId,
                          comment.author,
                          comment.avatarUrl,
                        )
                        const isPostAuthor =
                          (Boolean(comment.authorId) &&
                            Boolean(selectedPost.authorId) &&
                            comment.authorId === selectedPost.authorId) ||
                          comment.author.trim().toLowerCase() ===
                            selectedPost.name.trim().toLowerCase()
                        const commentTimeLabel = formatForumCommentTime(comment.createdAt)

                        return (
                          <div
                            key={comment.id}
                            className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 transition-colors hover:border-slate-300"
                          >
                            {/* Tầng trên: Header của bình luận */}
                            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200/70">
                              <div className="flex items-center gap-2 min-w-0">
                                {commentAvatarUrl ? (
                                  <img
                                    src={commentAvatarUrl}
                                    alt={comment.author}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null
                                      e.currentTarget.src = "/images/avatars/default-avatar.jpg"
                                    }}
                                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-slate-100"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                                    {comment.initials ||
                                      getUserDisplayInitials(comment.author, "BL")}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {comment.author}
                                </span>
                                {isPostAuthor && (
                                  <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 whitespace-nowrap">
                                    Tác giả
                                  </span>
                                )}
                                {commentTimeLabel && (
                                  <>
                                    <span className="text-slate-400 shrink-0" aria-hidden="true">
                                      ·
                                    </span>
                                    <span className="text-[11px] text-slate-500 shrink-0 whitespace-nowrap tabular-nums">
                                      {commentTimeLabel}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Xóa bình luận của ${comment.author}`}
                                  onClick={() =>
                                    handleDeleteComment(selectedPost.id, comment.id)
                                  }
                                  className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>

                            {/* Tầng dưới: Nội dung bình luận trực tiếp */}
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line break-words">
                              {comment.text}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs h-full flex items-center justify-center text-center text-slate-400 text-xs italic">
                Chọn một bài viết ở danh sách bên trái để xem chi tiết và kiểm duyệt bình luận.
              </div>
            )}
          </div>
        </div>

        {confirmDialogNode}
      </main>
    )
  }

  return (
    <main className={`admin-resource-page management-page management-admin admin-resource-page--${resource}`}>
      <div className="resource-page-heading">
        <div>
          <h1>{title[resource]}</h1>
          <p>{description[resource]}</p>
        </div>
        <div>
          {(resource === "users" || resource === "categories") && (
            <Button icon="plus" onClick={() => openEdit()}>
              Thêm mới
            </Button>
          )}
          {resource !== "reports" && (
            <Button
              variant="outline"
              icon="download"
              onClick={() => downloadCsv(`${resource}-tro-oi.csv`, filtered)}
            >
              Tải CSV
            </Button>
          )}
        </div>
      </div>
      {actionError && (
        <p className="form-message error" role="alert">
          {actionError}
        </p>
      )}
      <section
        className={`resource-panel resource-panel--${resource}`}
        aria-busy={Boolean(busyId) || connectionState === "loading"}
      >
        {connectionState === "loading" && (
          <p className="management-feedback" role="status">
            Đang tải dữ liệu…
          </p>
        )}
        {connectionState === "error" && (
          <p className="form-message error" role="alert">
            {connectionError || "Không tải được dữ liệu. Hãy tải lại trang để thử lại."}
          </p>
        )}
        <div className="workspace-toolbar">
          <label className="workspace-search">
            <Icon name="search" />
            <input
              aria-label={`Tìm trong ${title[resource].toLocaleLowerCase("vi")}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Tìm trong ${title[resource].toLocaleLowerCase("vi")}`}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <select
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value)}
            aria-label="Lọc trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            {statusOptions[resource].map((value) => (
              <option value={value} key={value}>
                {statusText[value]}
              </option>
            ))}
          </select>
          <span>{filtered.length} kết quả</span>
        </div>
        <div className={`resource-list resource-list--${resource}`}>
          {filtered.map((row) => (
            <article className={`resource-row resource-row--${resource}`} key={row.id}>
              {row.image && (
                <img
                  className="resource-row-media"
                  src={row.image}
                  alt={row.title}
                  loading="lazy"
                />
              )}
              <div className="resource-row-main">
                <div className="resource-row-heading">
                  <span className="resource-kind">{kind[resource]}</span>
                  <span className={`status-pill status-${row.status}`}>
                    {statusText[row.status] ?? row.status}
                  </span>
                </div>
                <h3>{row.title}</h3>
                <p>{row.detail}</p>
                <small>{row.meta}</small>
                {resource === "forum" &&
                  posts
                    .find((item) => item.id === row.id)
                    ?.comments.map((comment) => (
                      <div className="admin-comment-row" key={comment.id}>
                        <span>
                          <b>{comment.author}</b> · {comment.text}
                        </span>
                        <button
                          className="danger-action"
                          onClick={() => {
                            if (window.confirm("Xóa bình luận vi phạm này?")) {
                              void deleteComment(row.id, comment.id).catch((caught: unknown) =>
                                setActionError(
                                  caught instanceof Error
                                    ? caught.message
                                    : "Không thể xóa bình luận.",
                                ),
                              )
                            }
                          }}
                        >
                          Xóa bình luận
                        </button>
                      </div>
                    ))}
              </div>
              <fieldset
                className="resource-row-actions"
                disabled={Boolean(busyId)}
                aria-label={`Thao tác với ${row.title}`}
              >
                {resource === "users" && (
                  <>
                    <button onClick={() => openEdit(users.find((item) => item.id === row.id))}>
                      <Icon name="edit" size={15} /> Sửa
                    </button>
                    <button onClick={() => action(row.id, row.status)}>
                      {row.status === "locked" ? "Mở khóa" : "Khóa"}
                    </button>
                    <button className="danger-action" onClick={() => remove(row.id, row.title)}>
                      Xóa
                    </button>
                  </>
                )}
                {resource === "forum" && (
                  <>
                    <button
                      onClick={() => action(row.id, row.status === "active" ? "hidden" : "active")}
                    >
                      {row.status === "pending"
                        ? "Duyệt bài"
                        : row.status === "hidden"
                          ? "Hiện bài"
                          : "Ẩn bài"}
                    </button>
                    <button className="danger-action" onClick={() => remove(row.id, row.title)}>
                      Xóa bài
                    </button>
                  </>
                )}
                {resource === "categories" && (
                  <>
                    <button
                      onClick={() => openEdit(categories.find((item) => item.id === row.id))}
                    >
                      <Icon name="edit" size={15} /> Sửa
                    </button>
                    <button onClick={() => action(row.id, "hidden")}>
                      {row.status === "hidden" ? "Hiện" : "Ẩn"}
                    </button>
                    <button className="danger-action" onClick={() => remove(row.id, row.title)}>
                      Xóa
                    </button>
                  </>
                )}
                {resource === "reports" && (
                  <>
                    <button onClick={() => action(row.id, "accepted")}>Xử lý báo cáo</button>
                    <button className="danger-action" onClick={() => remove(row.id, row.title)}>
                      Từ chối
                    </button>
                  </>
                )}
                {busyId === row.id && <small role="status">Đang cập nhật…</small>}
              </fieldset>
            </article>
          ))}
        </div>
        {!filtered.length && connectionState !== "loading" && connectionState !== "error" && (
          <div className={`resource-empty resource-empty--${resource}`}>
            <Icon
              name={
                resource === "reports"
                  ? "shield"
                  : resource === "users"
                    ? "users"
                    : resource === "forum"
                      ? "chat"
                      : "filter"
              }
            />
            <h3>{rows.length ? "Không tìm thấy kết quả phù hợp" : emptyTitle[resource]}</h3>
            <p>
              {rows.length
                ? "Thử thay đổi từ khóa hoặc trạng thái đang lọc."
                : emptyDescription[resource]}
            </p>
          </div>
        )}
      </section>

      {editDialogNode}
      {reportDialogNode}
      {confirmDialogNode}
    </main>
  )
}
