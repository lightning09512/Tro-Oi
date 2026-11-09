import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useLocation, useSearchParams } from "react-router"
import { Button, Icon } from "@/components/common/legacy"
import {
  usePlatform,
  type CategoryRecord,
  type ContentStatus,
  type ListingStatus,
  type PlatformUser,
  type RentalListing,
  type ReportRecord,
} from "@/contexts/PlatformContext"
import { authService } from "@/services/authService"
import { isApiMode } from "@/services/apiClient"
import useDialogFocus from "@/hooks/useDialogFocus"

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
  const [areaFilter, setAreaFilter] = useState<ListingAreaFilter>("all")
  const [sortBy, setSortBy] = useState<ListingSortOption>("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  const [editing, setEditing] = useState<PlatformUser | CategoryRecord | null>(null)
  const [defaultCategoryType, setDefaultCategoryType] =
    useState<CategoryRecord["type"]>("Khu vực")
  const [editorError, setEditorError] = useState("")
  const [dialog, setDialog] = useState<"edit" | "report" | null>(null)
  const [actionError, setActionError] = useState("")
  const [reportTarget, setReportTarget] = useState<ReportRecord | null>(null)
  const [reportDecision, setReportDecision] = useState<ReportRecord["status"]>("accepted")
  const [reportNote, setReportNote] = useState("")
  const [sendWarning, setSendWarning] = useState(false)
  const [busyId, setBusyId] = useState("")
  const busyRef = useRef(false)
  const dialogRef = useRef<HTMLElement>(null)

  useDialogFocus(
    dialogRef,
    () => {
      if (!busyRef.current) setDialog(null)
    },
    Boolean(dialog),
  )

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? ""
    const nextStatus = searchParams.get("status") ?? "all"
    setQuery(nextQuery)
    setFilter(nextStatus)
    setDialog(null)
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
  }, [query, filter, areaFilter, sortBy, resource])

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
    setEditorError("")
    setDialog("edit")
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
          setReportNote("")
          setSendWarning(false)
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

  const remove = async (id: string, name: string) => {
    if (busyRef.current) return
    if (
      !window.confirm(
        resource === "reports"
          ? `Từ chối báo cáo “${name}”?`
          : `Bạn có chắc muốn xóa “${name}”?`,
      )
    )
      return
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
      }
      if (resource === "listings") await deleteListing(id)
      if (resource === "forum") await deletePost(id)
      if (resource === "categories") await deleteCategory(id)
      if (resource === "reports") await updateReport(id, "rejected", "Đã từ chối báo cáo.")
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
    if (sendWarning && !reportNote.trim()) {
      setActionError("Nhập nội dung cảnh báo trước khi gửi cho người dùng.")
      return
    }
    setActionError("")
    busyRef.current = true
    setBusyId("report")
    try {
      await updateReport(reportTarget.id, reportDecision, reportNote)
      if (sendWarning && reportNote.trim()) {
        const targetUserId =
          reportTarget.targetType === "Tin phòng"
            ? listings.find((item) => item.id === reportTarget.targetId)?.ownerId
            : reportTarget.targetType === "Bài viết"
              ? posts.find((item) => item.id === reportTarget.targetId)?.authorId
              : posts
                  .flatMap((item) => item.comments)
                  .find((item) => item.id === reportTarget.targetId)?.authorId
        if (targetUserId)
          await addNotification({
            userId: targetUserId,
            title: "Cảnh báo từ quản trị viên",
            detail: reportNote.trim(),
          })
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
      <div className="dialog-backdrop">
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
          <h2 id="admin-editor-title">
            {editing
              ? "Cập nhật thông tin"
              : resource === "categories"
                ? `Thêm ${defaultCategoryType.toLocaleLowerCase("vi")} mới`
                : "Tạo mới"}
          </h2>
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
            {resource === "users" ? (
              <>
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
              </>
            ) : (
              <>
                <label className="form-field">
                  <span>Tên danh mục</span>
                  <input
                    name="name"
                    key={editing ? `name-${editing.id}` : `name-new-${defaultCategoryType}`}
                    defaultValue={editing && "name" in editing ? editing.name : ""}
                    placeholder={`Nhập tên ${defaultCategoryType.toLocaleLowerCase("vi")}...`}
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Nhóm</span>
                  <select
                    name="type"
                    key={editing ? `type-${editing.id}` : `type-new-${defaultCategoryType}`}
                    defaultValue={
                      editing && "type" in editing ? editing.type : defaultCategoryType
                    }
                  >
                    <option value="Khu vực">Khu vực</option>
                    <option value="Loại phòng">Loại phòng</option>
                    <option value="Tiện ích">Tiện ích</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Trạng thái</span>
                  <select
                    name="status"
                    key={editing ? `status-${editing.id}` : `status-new-${defaultCategoryType}`}
                    defaultValue={editing && "status" in editing ? editing.status : "active"}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="hidden">Đang ẩn</option>
                  </select>
                </label>
              </>
            )}
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
      </div>
    ) : null

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

        {/* 2. Bố Cục Chính: Bảng 3 Cột Dọc Độc Lập (3-Column Grid) */}
        <section
          className="saas-taxonomy-board"
          aria-busy={Boolean(busyId) || connectionState === "loading"}
        >
          {taxonomyColumns.map((col) => (
            <article key={col.type} className="saas-taxonomy-card">
              <div className="saas-taxonomy-card-top">
                <header className="saas-taxonomy-card-header">
                  <span className="saas-taxonomy-card-icon" aria-hidden="true">
                    {col.icon === "pin" && <Icon name="pin" size={18} />}
                    {col.icon === "home" && <Icon name="home" size={18} />}
                    {col.icon === "sparkles" && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <h2>
                    {col.title} ({col.items.length})
                  </h2>
                </header>

                {col.items.length > 0 ? (
                  <div className="saas-taxonomy-list">
                    {col.items.map((item) => {
                      const usageCount = categoryUsageCounts[item.id] ?? 0
                      const isHidden = item.status === "hidden"

                      return (
                        <div
                          key={item.id}
                          className={`saas-taxonomy-row${isHidden ? " is-hidden" : ""}`}
                        >
                          {/* Cụm bên trái: Tên mục + Badge trạng thái & số lượng tin */}
                          <div className="saas-taxonomy-row-left">
                            <span className="saas-taxonomy-item-name" title={item.name}>
                              {item.name}
                            </span>
                            {isHidden ? (
                              <span className="saas-taxonomy-pill is-hidden">
                                <span className="saas-taxonomy-dot is-hidden" />
                                <span>Đã ẩn</span>
                              </span>
                            ) : (
                              <span className="saas-taxonomy-pill is-active">
                                <span>{usageCount} tin</span>
                                <span className="saas-taxonomy-dot is-active" />
                              </span>
                            )}
                          </div>

                          {/* Cụm bên phải: 3 thao tác Sửa | Ẩn | Xóa trên cùng 1 hàng ngang */}
                          <fieldset
                            className="saas-taxonomy-row-actions"
                            disabled={Boolean(busyId)}
                            aria-label={`Thao tác với ${item.name}`}
                          >
                            <button
                              type="button"
                              className="saas-taxonomy-action-btn"
                              onClick={() => openEdit(item, item.type)}
                            >
                              Sửa
                            </button>
                            <span className="saas-taxonomy-action-sep" aria-hidden="true">
                              |
                            </span>
                            <button
                              type="button"
                              className="saas-taxonomy-action-btn"
                              onClick={() => action(item.id, "hidden")}
                            >
                              {isHidden ? "Hiện" : "Ẩn"}
                            </button>
                            <span className="saas-taxonomy-action-sep" aria-hidden="true">
                              |
                            </span>
                            <button
                              type="button"
                              className="saas-taxonomy-action-btn is-danger"
                              onClick={() => remove(item.id, item.name)}
                            >
                              Xóa
                            </button>
                          </fieldset>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="saas-taxonomy-empty">Không có mục nào khớp</p>
                )}
              </div>

              <button
                type="button"
                className="saas-taxonomy-add-col-btn"
                onClick={() => openEdit(undefined, col.type)}
              >
                {col.addLabel}
              </button>
            </article>
          ))}
        </section>

        {editDialogNode}
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
                      onClick={() => remove(item.id, item.title)}
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

      {dialog === "report" && reportTarget && (
        <div className="dialog-backdrop">
          <section
            ref={dialogRef}
            className="action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-report-title"
          >
            <button
              className="dialog-close"
              disabled={Boolean(busyId)}
              onClick={() => setDialog(null)}
              aria-label="Đóng"
            >
              <Icon name="close" />
            </button>
            <h2 id="admin-report-title">{reportTarget.targetTitle}</h2>
            <p className="dialog-target">
              {reportTarget.targetType} · {reportTarget.reason}
              <br />
              {reportTarget.description}
            </p>
            <form className="dialog-form" onSubmit={saveReportDecision}>
              {actionError && (
                <p className="form-message error" role="alert">
                  {actionError}
                </p>
              )}
              <label className="form-field">
                <span>Kết quả</span>
                <select
                  value={reportDecision}
                  onChange={(event) =>
                    setReportDecision(event.target.value as ReportRecord["status"])
                  }
                >
                  <option value="accepted">Chấp nhận báo cáo</option>
                  <option value="rejected">Từ chối báo cáo</option>
                </select>
              </label>
              <label className="form-field">
                <span>Ghi chú / nội dung cảnh báo</span>
                <textarea
                  rows={4}
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                  placeholder="Ghi lại quyết định xử lý hoặc nội dung cảnh báo."
                />
              </label>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={sendWarning}
                  onChange={(event) => setSendWarning(event.target.checked)}
                />
                Gửi ghi chú này thành cảnh báo cho người dùng liên quan.
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
                <Button icon="send" disabled={Boolean(busyId)}>
                  {busyId === "report" ? "Đang lưu…" : "Lưu kết quả"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
